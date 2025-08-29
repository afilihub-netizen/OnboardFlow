import { Tipo } from './types.js';

// remove acento
const deburr = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
    .trim();

export function detectTipo(descricao: string, amount: number): Tipo {
  const d = deburr(descricao.toUpperCase());
  
  console.log(`🔍 [DETECT-TIPO] "${descricao}" (amount: ${amount}) → normalized: "${d}"`);

  // PIX - detectar independente do valor primeiro, depois ajustar por contexto
  if (/PAGAMENTO\s+PIX|PIX\s+DEB/.test(d)) {
    console.log(`  → PIX_DEB detectado (pagamento/débito)`);
    return 'PIX_DEB';
  }
  if (/(RECEBIMENTO\s+PIX|PIX\s+CRED)/.test(d)) {
    console.log(`  → PIX_CRED detectado (recebimento/crédito)`);
    return 'PIX_CRED';
  }
  
  if (/(COMPRA|COMPRAS\s+NACIONAIS)/.test(d)) {
    console.log(`  → COMPRA detectado`);
    return 'COMPRA';
  }
  if (/(TRANSFERENCIA|TED|DOC)/.test(d) && amount < 0) return 'TRANSFER_OUT';
  if (/(TRANSFERENCIA|TED|DOC)/.test(d) && amount > 0) return 'TRANSFER_IN';
  if (/BOLETO/.test(d)) return 'BOLETO';
  if (/(TARIFA|PACOTE|MENSALIDADE)/.test(d)) return 'TARIFA';
  
  console.log(`  → OUTRO (fallback)`);
  return 'OUTRO';
}

// remove tokens "lixo" dos adquirentes/codigos/banco
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
  let s = name;
  s = s.replace(/\b(BR|BRASIL)\b/gi, ' ');
  s = s.replace(/\b(LOJAS?|NACIONAL(IS)?)\b/gi, ' ');
  s = s.replace(/\s{2,}/g, ' ').trim();
  s = titleCase(s);
  return s;
}

export function slugify(s: string): string {
  return deburr(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function naturezaFrom(tipo: Tipo, amount: number): 'Entrada' | 'Saída' | 'Neutra' {
  // Prioridade: TIPO primeiro, depois valor
  if (tipo === 'TRANSFER_IN' || tipo === 'PIX_CRED') return 'Entrada';
  if (tipo === 'TRANSFER_OUT' || tipo === 'PIX_DEB' || tipo === 'COMPRA' || tipo === 'BOLETO' || tipo === 'TARIFA') return 'Saída';
  
  // Para 'OUTRO': baseado no valor
  if (amount > 0) return 'Entrada';
  if (amount < 0) return 'Saída';
  
  return 'Neutra';
}