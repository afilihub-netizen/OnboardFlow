export type Natureza = 'Entrada' | 'Saída' | 'Neutra';
export type Tipo =
  | 'PIX_DEB'
  | 'PIX_CRED'
  | 'COMPRA'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'BOLETO'
  | 'TARIFA'
  | 'OUTRO';

export interface RawBankRow {
  data: string;           // '2025-08-26'
  descricao: string;      // texto do extrato
  valor: number;          // positivo ou negativo
  saldo?: number | null;
  moeda?: string;
  conta_id?: string;
}

export interface Match {
  nome?: string;          // nome canônico
  cnpj?: string | null;
  categoria?: string | null;
  fonte?: string;         // 'rule' | 'cnpj' | 'dict' | 'ml' | 'fallback'
  score: number;          // 0-1
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
  fontes: string[];       // ordem de decisão
}

export interface DictEntry {
  pattern_substring: string; // ex.: 'TONIN'
  merchant_canonico: string;
  cnpj?: string | null;
  categoria?: string | null;
  confianca?: number;        // default 0.99
}