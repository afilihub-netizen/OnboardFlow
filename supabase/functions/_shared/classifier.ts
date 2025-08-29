// Compactei os módulos anteriores em um único arquivo para Edge Function.

export type Natureza = 'Entrada' | 'Saída' | 'Neutra';
export type Tipo = 'PIX_DEB' | 'PIX_CRED' | 'COMPRA' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'BOLETO' | 'TARIFA' | 'OUTRO';

export interface RawBankRow {
  data: string;
  descricao: string;
  valor: number;
  conta_id?: string | null;
}

export interface TxNormalized {
  data: string;
  descricao_raw: string;
  merchant_raw: string;
  merchant_norm: string;
  merchant_slug: string;
  tipo: Tipo;
  natureza: Natureza;
  valor: number;
  categoria: string;
  cnpj?: string | null;
  nome_canonico: string;
  confidence: number;
  fontes: string[];
}

const deburr = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const titleCase = (s: string) => s.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()).trim();

export function detectTipo(descricao: string, amount: number): Tipo {
  const d = deburr(descricao.toUpperCase());
  if (/PAGAMENTO\s+PIX/.test(d) && amount < 0) return 'PIX_DEB';
  if (/(RECEBIMENTO\s+PIX|PIX\s+CRED)/.test(d) && amount > 0) return 'PIX_CRED';
  if (/(COMPRA|COMPRAS\s+NACIONAIS)/.test(d)) return 'COMPRA';
  if (/(TRANSFERENCIA|TED|DOC)/.test(d) && amount < 0) return 'TRANSFER_OUT';
  if (/(TRANSFERENCIA|TED|DOC)/.test(d) && amount > 0) return 'TRANSFER_IN';
  if (/BOLETO/.test(d)) return 'BOLETO';
  if (/(TARIFA|PACOTE|MENSALIDADE)/.test(d)) return 'TARIFA';
  return 'OUTRO';
}

export function extractMerchant(descricao: string, tipo: Tipo): string {
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

export function normalizeMerchantName(name: string): string {
  let s = name.replace(/\b(BR|BRASIL)\b/gi, ' ').replace(/\b(LOJAS?|NACIONAL(IS)?)\b/gi, ' ');
  return titleCase(s.replace(/\s{2,}/g, ' ').trim());
}

export function slugify(s: string): string {
  return deburr(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function naturezaFrom(tipo: Tipo, amount: number): Natureza {
  if (tipo === 'TRANSFER_IN' || tipo === 'PIX_CRED' || amount > 0) return 'Entrada';
  if (tipo === 'TRANSFER_OUT' || tipo === 'PIX_DEB' || tipo === 'COMPRA' || amount < 0) return 'Saída';
  return 'Neutra';
}

/** --- Heurísticas/Regras --- */
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
  for (const r of RULES) if (r.re.test(merchantNorm)) return { categoria: r.categoria, score: r.score };
  return null;
}

/** --- Mini resolutor CNPJ (substitua por API/DB real) --- */
function jaroWinkler(a: string, b: string): number {
  function jaro(s1: string, s2: string) {
    const m = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1m = new Array(s1.length).fill(false);
    const s2m = new Array(s2.length).fill(false);
    let mat = 0;
    for (let i = 0; i < s1.length; i++) {
      for (let j = Math.max(0, i - m); j < Math.min(i + m + 1, s2.length); j++) {
        if (!s2m[j] && s1[i] === s2[j]) { s1m[i] = s2m[j] = true; mat++; break; }
      }
    }
    if (!mat) return 0;
    let t = 0, k = 0;
    for (let i = 0; i < s1.length; i++) if (s1m[i]) { while (!s2m[k]) k++; if (s1[i] !== s2[k]) t++; k++; }
    t /= 2;
    return (mat / s1.length + mat / s2.length + (mat - t) / mat) / 3;
  }
  const j = jaro(a, b);
  let l = 0; for (; l < Math.min(4, a.length, b.length); l++) if (a[l] !== b[l]) break;
  return j + l * 0.1 * (1 - j);
}

const CNAE_TO_CATEGORY: Array<{ prefix: string; cat: string }> = [
  { prefix: '47.11', cat: 'Alimentação' },
  { prefix: '47.30', cat: 'Transporte' },
  { prefix: '61.',   cat: 'Serviços' },
  { prefix: '64.',   cat: 'Serviços Financeiros' },
  { prefix: '82.20', cat: 'Serviços' },
];

function categoryFromCNAE(cnae?: string | null) {
  if (!cnae) return null;
  const hit = CNAE_TO_CATEGORY.find(x => cnae.startsWith(x.prefix));
  return hit?.cat ?? null;
}

export type DictEntry = { pattern_substring: string; merchant_canonico: string; cnpj?: string | null; categoria?: string | null; confianca?: number; };

export async function classifyRowWithSupabase(row: RawBankRow, user_id: string, dict: DictEntry[], supabase: any): Promise<TxNormalized> {
  const tipo = detectTipo(row.descricao, row.valor);
  const merchantRaw = extractMerchant(row.descricao, tipo);
  const merchantNorm = normalizeMerchantName(merchantRaw);
  const slug = slugify(merchantNorm);
  const natureza = naturezaFrom(tipo, row.valor);

  const fontes: string[] = [];
  let nome = merchantNorm, categoria: string | null = null, cnpj: string | null = null, confidence = 0;

  console.log(`🎯 [CLASSIFY] Processando: "${row.descricao}" → merchant: "${merchantNorm}"`);

  // 1) dicionário (do DB já carregado)
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

  // 2) CNPJ cache por nome (simples: varrer merchants do user)
  if (!categoria || confidence < 0.95) {
    const { data: candidates } = await supabase
      .from('merchants')
      .select('id,nome,cnpj')
      .eq('user_id', user_id)
      .limit(50);

    let best: any = null;
    for (const c of candidates ?? []) {
      const sc = jaroWinkler(merchantNorm.toUpperCase(), String(c.nome).toUpperCase());
      if (!best || sc > best.score) best = { ...c, score: sc };
    }
    if (best && best.score >= 0.82) {
      nome = best.nome;
      cnpj = best.cnpj ?? cnpj;
      confidence = Math.max(confidence, best.score);
      fontes.push('cnpj');
      console.log(`✅ [CNPJ] Match por similaridade: ${best.nome} [${Math.round(best.score * 100)}%]`);
      // opcional: buscar categoria por CNAE se tiver em cnpj_cache
      if (best.cnpj) {
        const { data: cc } = await supabase.from('cnpj_cache').select('cnae_principal').eq('cnpj', best.cnpj).maybeSingle();
        const by = categoryFromCNAE(cc?.cnae_principal);
        if (by) categoria = by;
      }
    }
  }

  // 3) regras
  if (!categoria) {
    const r = rulesMatch(merchantNorm);
    if (r) { 
      categoria = r.categoria; 
      confidence = Math.max(confidence, r.score); 
      fontes.push('rule'); 
      console.log(`✅ [RULE] Match por regra: ${categoria} [${Math.round(r.score * 100)}%]`);
    }
  }

  // 4) fallback simples
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
    tipo, natureza, valor: row.valor,
    categoria, cnpj,
    nome_canonico: nome,
    confidence, fontes,
  };
}