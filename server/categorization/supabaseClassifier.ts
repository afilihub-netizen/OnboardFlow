import { storage } from '../storage.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { 
  detectTipo, 
  extractMerchant, 
  normalizeMerchantName, 
  slugify, 
  naturezaFrom
} from './normalize.js';
import { 
  type RawBankRow,
  type TxNormalized,
  type Tipo
} from './types.js';

// Interface para dicionário do banco
interface DictEntry {
  pattern_substring: string;
  merchant_canonico: string;
  cnpj?: string | null;
  categoria?: string | null;
  confianca?: number;
}

// Regras heurísticas adaptadas do Supabase
const RULES: Array<{ re: RegExp; categoria: string; score: number }> = [
  { re: /(POSTO|IPIRANGA|SHELL|RAIZEN|ALE\b|INNOVARE)/i, categoria: 'Transporte', score: 0.93 },
  { re: /(MERCADO|SUPERMERC|ATACAD|ASSAI|TONIN|MEDEIROS)/i, categoria: 'Alimentação', score: 0.92 },
  { re: /(VIVO|CLARO|TIM|OI|ALGAR|NEXTEL|WEBCLIX)/i, categoria: 'Serviços', score: 0.92 },
  { re: /(UBER|99APP|99POP|BUSER)/i, categoria: 'Transporte', score: 0.9 },
  { re: /(PAY|PAGAR\.ME|CIELO|STONE|PAYPAL|MERCADO\s*PAGO|BLUE\s*PAY)/i, categoria: 'Serviços Financeiros', score: 0.9 },
  { re: /(LANCH|RESTAUR|PIZZA|BURGER|SUBWAY|MC ?DONALD|BK\b)/i, categoria: 'Alimentação', score: 0.88 },
  { re: /(DROGARIA|FARMACIA|LABORATORIO|CLINICA)/i, categoria: 'Saúde', score: 0.9 },
  { re: /(TOSCANA|TELEMARKETING)/i, categoria: 'Serviços', score: 0.85 },
];

function rulesMatch(merchantNorm: string) {
  for (const r of RULES) {
    if (r.re.test(merchantNorm)) {
      return { categoria: r.categoria, score: r.score };
    }
  }
  return null;
}

// Carrega dicionário do banco Supabase
async function loadDictionary(userId: string = 'demo-user'): Promise<DictEntry[]> {
  try {
    // Usar sql() do drizzle para query raw
    const result = await db.execute(sql`
      SELECT 
        mm.pattern_substring,
        m.nome as merchant_canonico,
        mm.cnpj,
        mm.categoria,
        mm.confianca
      FROM public.merchant_map mm
      JOIN public.merchants m ON mm.merchant_id = m.id
      WHERE mm.user_id = ${userId}
      ORDER BY length(mm.pattern_substring) DESC
    `);
    
    const rows = result.rows as any[];
    const dict = rows.map(row => ({
      pattern_substring: row.pattern_substring,
      merchant_canonico: row.merchant_canonico,
      cnpj: row.cnpj,
      categoria: row.categoria,
      confianca: row.confianca || 0.99
    }));
    
    console.log(`📚 [DICT] Carregado ${dict.length} entradas do dicionário para usuário ${userId}`);
    return dict;
    
  } catch (error) {
    console.error('❌ [DICT] Erro ao carregar dicionário:', error);
    return [];
  }
}

// Função de extração melhorada (compatível com Supabase)
function extractMerchantSupabase(descricao: string, tipo: Tipo): string {
  let d = descricao;
  
  // Remove valores monetários primeiro (padrões brasileiros)
  d = d.replace(/[+-]?\s*R\$\s*[\d.,]+/gi, ' ');
  d = d.replace(/[+-]\s*[\d.,]+/gi, ' ');
  
  // remove tokens comuns de bancos brasileiros
  d = d.replace(/\b(PAGAMENTO|RECEBIMENTO)\b\s+PIX\s+\d+/gi, ' ');
  d = d.replace(/\bPIX\s+(DEB|CRED)\b/gi, ' ');
  d = d.replace(/\bCOMPRAS?\b\s+NACIONAIS?/gi, ' ');
  d = d.replace(/\bDBR\b|\bVEO\S*\b|\bAUT\s*\d+\b/gi, ' ');
  d = d.replace(/\bSAO\s+JOAQUIM\b/gi, ' ');
  d = d.replace(/\bDEB(?:ITO)?\b|\bCRED(?:ITO)?\b/gi, ' ');
  
  // Remove códigos e números longos
  d = d.replace(/\b\d{10,}\b/gi, ' '); // Remove CPF/CNPJ sem formatação
  d = d.replace(/\b\d{4,8}\b/gi, ' '); // Remove códigos diversos
  
  // Remove separadores e normaliza espaços
  d = d.replace(/[—–-]/g, ' ');
  d = d.replace(/\s{2,}/g, ' ').trim();
  
  // heurísticas por tipo
  if (tipo === 'PIX_DEB' || tipo === 'PIX_CRED') {
    // após remover prefixos, pegue o que sobrou (nome da pessoa/empresa)
    d = d.replace(/\b(PAGAMENTO|RECEBIMENTO)\b\s*PIX/gi, '').trim();
    // Remove códigos PIX no início
    d = d.replace(/^\d+\s+/, '').trim();
  }
  
  return d.trim();
}

// Classificador principal usando arquitetura Supabase
export async function classifyRowSupabase(row: RawBankRow, userId: string = 'demo-user'): Promise<TxNormalized> {
  const tipo = detectTipo(row.descricao, row.valor);
  const merchantRaw = extractMerchantSupabase(row.descricao, tipo);
  const merchantNorm = normalizeMerchantName(merchantRaw);
  const slug = slugify(merchantNorm);
  const natureza = naturezaFrom(tipo, row.valor);

  const fontes: string[] = [];
  let nome = merchantNorm, categoria: string | null = null, cnpj: string | null = null, confidence = 0;

  console.log(`🎯 [SUPABASE-CLASSIFY] Processando: "${row.descricao}" → merchant: "${merchantNorm}"`);

  // 1) Carrega e aplica dicionário do banco
  const dict = await loadDictionary(userId);
  const up = merchantNorm.toUpperCase();
  
  for (const e of dict) {
    if (up.includes(e.pattern_substring.toUpperCase())) {
      nome = e.merchant_canonico || nome;
      cnpj = e.cnpj ?? cnpj;
      categoria = e.categoria ?? categoria;
      confidence = Math.max(confidence, e.confianca ?? 0.99);
      fontes.push('dict');
      console.log(`✅ [DICT] Match determinístico: ${e.merchant_canonico} (${e.categoria}) [${Math.round((e.confianca ?? 0.99) * 100)}%]`);
      break;
    }
  }

  // 2) Regras heurísticas
  if (!categoria) {
    const r = rulesMatch(merchantNorm);
    if (r) { 
      categoria = r.categoria; 
      confidence = Math.max(confidence, r.score); 
      fontes.push('rule'); 
      console.log(`✅ [RULE] Match por regra: ${categoria} [${Math.round(r.score * 100)}%]`);
    }
  }

  // 3) Fallback
  if (!categoria) { 
    categoria = 'Outros'; 
    confidence = Math.max(confidence, 0.4); 
    fontes.push('fallback'); 
    console.log(`⚠️ [FALLBACK] Sem categorização: ${merchantNorm} → Outros`);
  }

  console.log(`🎯 [FINAL] "${row.descricao}" → ${nome} | ${categoria} | ${Math.round(confidence * 100)}% | Fontes: ${fontes.join(' → ')}`);

  return {
    data: row.data,
    descricao_raw: row.descricao,
    merchant_raw: merchantRaw,
    merchant_norm: merchantNorm,
    merchant_slug: slug,
    tipo, 
    natureza, 
    valor: row.valor,
    categoria, 
    cnpj,
    nome_canonico: nome,
    confidence, 
    fontes,
  };
}

// Classificação em lote
export async function classifyBatchSupabase(rows: RawBankRow[], userId: string = 'demo-user'): Promise<TxNormalized[]> {
  const out: TxNormalized[] = [];
  console.log(`🚀 [SUPABASE-BATCH] Iniciando classificação de ${rows.length} transações...`);
  
  for (const r of rows) {
    try {
      const result = await classifyRowSupabase(r, userId);
      out.push(result);
      
      // Pequeno delay para não sobrecarregar o banco
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error(`❌ [SUPABASE-BATCH] Erro ao classificar "${r.descricao}":`, error);
      
      // Em caso de erro, cria um resultado básico
      out.push({
        data: r.data,
        descricao_raw: r.descricao,
        merchant_raw: r.descricao,
        merchant_norm: r.descricao,
        merchant_slug: slugify(r.descricao),
        tipo: detectTipo(r.descricao, r.valor),
        natureza: naturezaFrom(detectTipo(r.descricao, r.valor), r.valor),
        valor: r.valor,
        categoria: 'Outros',
        cnpj: null,
        nome_canonico: r.descricao,
        confidence: 0.1,
        fontes: ['error'],
      });
    }
  }
  
  console.log(`✅ [SUPABASE-BATCH] Classificação concluída: ${out.length} transações processadas`);
  return out;
}

// Função para converter resultado do classificador para formato do sistema
export function convertFromTxNormalizedSupabase(tx: TxNormalized): any {
  console.log(`🔄 [CONVERT] Convertendo: ${tx.descricao_raw}`);
  console.log(`   📊 Valor original: ${tx.valor} | Natureza detectada: ${tx.natureza}`);
  
  // Determina o tipo e valor correto baseado na natureza
  let finalAmount: number;
  let transactionType: string;
  
  if (tx.natureza === 'Entrada') {
    // Para entradas, valor positivo e type = 'income'
    finalAmount = Math.abs(tx.valor);
    transactionType = 'income';
    console.log(`   📈 [RESULTADO] ${tx.nome_canonico}: type="${transactionType}" amount="${finalAmount}" (ENTRADA)`);
  } else if (tx.natureza === 'Saída') {
    // Para saídas, valor negativo e type = 'expense'  
    finalAmount = -Math.abs(tx.valor);
    transactionType = 'expense';
    console.log(`   📉 [RESULTADO] ${tx.nome_canonico}: type="${transactionType}" amount="${finalAmount}" (SAÍDA)`);
  } else {
    // Neutra: mantém o valor original
    finalAmount = tx.valor;
    transactionType = tx.valor >= 0 ? 'income' : 'expense';
    console.log(`   🔄 [RESULTADO] ${tx.nome_canonico}: type="${transactionType}" amount="${finalAmount}" (NEUTRA)`);
  }
  
  const result = {
    date: tx.data,
    description: tx.descricao_raw,
    merchant: tx.nome_canonico,
    category: tx.categoria,
    type: transactionType,
    amount: finalAmount.toString(),
    confidence: tx.confidence,
    sources: tx.fontes,
    businessType: tx.categoria, // Para compatibilidade
    paymentMethod: getPaymentMethodFromTipo(tx.tipo),
    cnpj: tx.cnpj,
    reasoning: `Categorizado via: ${tx.fontes.join(' → ')}`
  };
  
  console.log(`   ✅ [FINAL] Enviando para frontend: type="${result.type}" amount="${result.amount}"`);
  return result;
}

function getPaymentMethodFromTipo(tipo: string): string {
  switch (tipo) {
    case 'PIX_DEB':
    case 'PIX_CRED':
      return 'PIX';
    case 'COMPRA':
      return 'Cartão';
    case 'TRANSFER_OUT':
    case 'TRANSFER_IN':
      return 'Transferência';
    case 'BOLETO':
      return 'Boleto';
    default:
      return 'Outro';
  }
}