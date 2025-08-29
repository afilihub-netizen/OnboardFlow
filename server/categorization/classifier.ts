import { RawBankRow, TxNormalized } from './types.js';
import { detectTipo, extractMerchant, normalizeMerchantName, slugify, naturezaFrom } from './normalize.js';
import { rulesMatch } from './rules.js';
import { InMemoryCnpjResolver, cnpjToCategory } from './cnpjResolver.js';
import { dictLookup } from './dict.js';

// ML leve (fallback): pesos por palavra-chave ESPECÍFICOS PARA BRASIL
const KEYWORD_WEIGHTS: Array<{ re: RegExp; categoria: string; w: number }> = [
  // Combustível
  { re: /(POSTO|IPIRANGA|SHELL|RAIZEN|ALE\b|PETROBRAS|INNOVARE)/i, categoria: 'Transporte', w: 1.0 },
  
  // Supermercados brasileiros
  { re: /(MERCADO|SUPERMERC|ATACAD|ASSAI|TONIN|MEDEIROS|RETA|CARREFOUR|EXTRA)/i, categoria: 'Alimentação', w: 0.9 },
  
  // Telecomunicações brasileiras
  { re: /(VIVO|CLARO|TIM\b|OI\b|WEBCLIX|EMBRATEL|TELEFONICA)/i, categoria: 'Serviços', w: 0.85 },
  
  // Apps de transporte
  { re: /(UBER|99APP|99POP|99\b)/i, categoria: 'Transporte', w: 0.8 },
  
  // Farmácias
  { re: /(DROGARIA|FARMACIA|LABORATORIO|CLINICA|DROGASIL|PACHECO|PAGUE\s*MENOS)/i, categoria: 'Saúde', w: 0.85 },
  
  // Serviços financeiros
  { re: /(PAY|PAYPAL|MERCADO\s*PAGO|GATEWAY|CIELO|STONE|BLUE\s*PAY|NUBANK|INTER|C6)/i, categoria: 'Serviços Financeiros', w: 0.8 },
  
  // Telemarketing
  { re: /(TELEMARKETING|TOSCANA|CALL\s*CENTER)/i, categoria: 'Serviços', w: 0.75 },
  
  // Alimentação fora de casa
  { re: /(RESTAUR|LANCH|PIZZA|BURGER|IFOOD)/i, categoria: 'Alimentação', w: 0.7 },
  
  // Streaming
  { re: /(NETFLIX|SPOTIFY|AMAZON|DISNEY|YOUTUBE)/i, categoria: 'Entretenimento', w: 0.7 },
];

function mlPredict(merchantNorm: string): { categoria: string; score: number } | null {
  const scores = new Map<string, number>();
  for (const k of KEYWORD_WEIGHTS) {
    if (k.re.test(merchantNorm)) {
      scores.set(k.categoria, (scores.get(k.categoria) ?? 0) + k.w);
    }
  }
  if (!scores.size) return null;
  const best = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
  const max = [...scores.values()].reduce((a, b) => Math.max(a, b), 0);
  
  console.log(`🤖 [ML] "${merchantNorm}" → ${best[0]} (score: ${(best[1] / (max || 1) * 0.89).toFixed(2)})`);
  
  return { categoria: best[0], score: Math.min(0.89, best[1] / (max || 1)) };
}

const cnpjResolver = new InMemoryCnpjResolver();

// PIPELINE PRINCIPAL HÍBRIDO: dicionário → CNPJ/CNAE → regras → ML → fallback
export async function classifyRow(row: RawBankRow): Promise<TxNormalized> {
  const tipo = detectTipo(row.descricao, row.valor);
  const merchantRaw = extractMerchant(row.descricao, tipo);
  const merchantNorm = normalizeMerchantName(merchantRaw);
  const slug = slugify(merchantNorm);
  const natureza = naturezaFrom(tipo, row.valor);

  const fontes: string[] = [];
  let nome_canonico = merchantNorm;
  let categoria: string | null = null;
  let cnpj: string | null = null;
  let confidence = 0;

  console.log(`🎯 [CLASSIFY] Processando: "${row.descricao}" → merchant: "${merchantNorm}"`);

  // 1) DICIONÁRIO (maior prioridade - determinístico)
  const dict = dictLookup(merchantNorm);
  if (dict && dict.score > 0.9) {
    categoria = dict.categoria ?? categoria;
    cnpj = dict.cnpj ?? cnpj;
    nome_canonico = dict.nome ?? nome_canonico;
    confidence = Math.max(confidence, dict.score);
    fontes.push('dict');
    
    console.log(`✅ [DICT] Match determinístico: ${dict.nome} (${dict.categoria}) [${Math.round(dict.score * 100)}%]`);
  }

  // 2) CNPJ/CNAE (segunda prioridade se ainda não tem categoria confiável)
  if (!categoria || confidence < 0.95) {
    try {
      const hit = await cnpjResolver.resolveByName(merchantNorm);
      if (hit && hit.score > 0.75) {
        cnpj = hit.cnpj;
        nome_canonico = hit.nome_fantasia || nome_canonico;
        const byCnae = await cnpjToCategory(hit.cnae_principal);
        if (byCnae) {
          categoria = byCnae;
          console.log(`✅ [CNPJ] CNAE → categoria: ${hit.nome_fantasia} (${byCnae}) [${Math.round(hit.score * 100)}%]`);
        }
        confidence = Math.max(confidence, hit.score);
        fontes.push('cnpj');
      }
    } catch (error) {
      console.log(`❌ [CNPJ] Erro ao resolver: ${error.message}`);
    }
  }

  // 3) REGRAS DETERMINÍSTICAS (terceira prioridade)
  if (!categoria) {
    const r = rulesMatch(merchantNorm, tipo);
    if (r) {
      categoria = r.categoria;
      nome_canonico = r.nome ?? nome_canonico;
      confidence = Math.max(confidence, r.score ?? 0.9);
      fontes.push('rule');
      
      console.log(`✅ [RULE] Match por regra: ${categoria} [${Math.round((r.score ?? 0.9) * 100)}%]`);
    }
  }

  // 4) ML LEVE (quarta prioridade - fallback inteligente)
  if (!categoria) {
    const m = mlPredict(merchantNorm);
    if (m) {
      categoria = m.categoria;
      confidence = Math.max(confidence, m.score);
      fontes.push('ml');
    }
  }

  // 5) FALLBACK (última opção)
  if (!categoria) {
    categoria = 'Outros';
    confidence = Math.max(confidence, 0.4);
    fontes.push('fallback');
    
    console.log(`⚠️ [FALLBACK] Sem categorização: ${merchantNorm} → Outros`);
  }

  // Log final do resultado
  console.log(`🎯 [FINAL] "${row.descricao}" → ${nome_canonico} | ${categoria} | ${Math.round(confidence * 100)}% | Fontes: ${fontes.join(' → ')}`);

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
    nome_canonico,
    confidence,
    fontes,
  };
}

export async function classifyBatch(rows: RawBankRow[]): Promise<TxNormalized[]> {
  const out: TxNormalized[] = [];
  console.log(`🚀 [BATCH] Iniciando classificação de ${rows.length} transações...`);
  
  for (const r of rows) {
    try {
      const result = await classifyRow(r);
      out.push(result);
      
      // Pequeno delay para não sobrecarregar resolvers
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error(`❌ [BATCH] Erro ao classificar "${r.descricao}":`, error);
      
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
  
  console.log(`✅ [BATCH] Classificação concluída: ${out.length} transações processadas`);
  return out;
}

// Função para converter dados do sistema atual para o formato do classificador
export function convertToRawBankRow(transaction: any): RawBankRow {
  return {
    data: transaction.date || new Date().toISOString().split('T')[0],
    descricao: transaction.description || '',
    valor: parseFloat(transaction.amount) || 0,
    saldo: transaction.balance ? parseFloat(transaction.balance) : null,
    conta_id: transaction.accountId || null
  };
}

// Função para converter resultado do classificador para formato do sistema
export function convertFromTxNormalized(tx: TxNormalized): any {
  // Determina o valor correto baseado na natureza
  let finalAmount: number;
  
  if (tx.natureza === 'Entrada') {
    // Para entradas, garante que o valor seja positivo
    finalAmount = Math.abs(tx.valor);
  } else if (tx.natureza === 'Saída') {
    // Para saídas, garante que o valor seja negativo  
    finalAmount = -Math.abs(tx.valor);
  } else {
    // Neutra: mantém o valor original
    finalAmount = tx.valor;
  }
  
  return {
    date: tx.data,
    description: tx.descricao_raw,
    merchant: tx.nome_canonico,
    category: tx.categoria,
    type: tx.natureza === 'Entrada' ? 'income' : 'expense',
    amount: finalAmount.toString(),
    confidence: tx.confidence,
    sources: tx.fontes,
    businessType: tx.categoria, // Para compatibilidade
    paymentMethod: getPaymentMethodFromTipo(tx.tipo),
    cnpj: tx.cnpj,
    reasoning: `Categorizado via: ${tx.fontes.join(' → ')}`
  };
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