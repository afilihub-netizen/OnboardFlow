// Dicionário de merchants brasileiros conhecidos para categorização determinística
export interface MerchantInfo {
  name: string;
  category: string;
  businessType: string;
  description: string;
  confidence: number;
  keywords: string[];
}

// Dicionário principal de merchants conhecidos
export const MERCHANT_DICTIONARY: { [key: string]: MerchantInfo } = {
  // Telecomunicações e Internet
  'claro': {
    name: 'Claro',
    category: 'Serviços',
    businessType: 'Telefonia/Internet',
    description: 'Serviços de telefonia e internet',
    confidence: 0.95,
    keywords: ['claro', 'claro s.a', 'claro brasil', 'embratel']
  },
  'vivo': {
    name: 'Vivo',
    category: 'Serviços',
    businessType: 'Telefonia/Internet',
    description: 'Serviços de telefonia e internet',
    confidence: 0.95,
    keywords: ['vivo', 'telefonica', 'telefônica brasil']
  },
  'tim': {
    name: 'TIM',
    category: 'Serviços',
    businessType: 'Telefonia/Internet',
    description: 'Serviços de telefonia e internet',
    confidence: 0.95,
    keywords: ['tim', 'tim brasil', 'tim participacoes']
  },
  'oi': {
    name: 'Oi',
    category: 'Serviços',
    businessType: 'Telefonia/Internet',
    description: 'Serviços de telefonia e internet',
    confidence: 0.95,
    keywords: ['oi', 'oi s.a', 'telemar']
  },
  'webclix': {
    name: 'Webclix',
    category: 'Serviços',
    businessType: 'Provedor Internet',
    description: 'Provedor de internet',
    confidence: 0.95,
    keywords: ['webclix', 'web clix', 'webclix telecom']
  },

  // Supermercados e Alimentação
  'tonin': {
    name: 'Luiz Tonin',
    category: 'Alimentação',
    businessType: 'Supermercado',
    description: 'Supermercado',
    confidence: 0.95,
    keywords: ['tonin', 'luiz tonin', 'supermercado tonin', 'mercado tonin']
  },
  'medeiros': {
    name: 'Supermercado Medeiros',
    category: 'Alimentação',
    businessType: 'Supermercado',
    description: 'Supermercado',
    confidence: 0.95,
    keywords: ['medeiros', 'supermercado medeiros', 'mercado medeiros']
  },
  'reta': {
    name: 'Reta Alimentos',
    category: 'Alimentação',
    businessType: 'Supermercado',
    description: 'Supermercado e alimentos',
    confidence: 0.95,
    keywords: ['reta', 'reta alimentos', 'supermercado reta']
  },
  'carrefour': {
    name: 'Carrefour',
    category: 'Alimentação',
    businessType: 'Hipermercado',
    description: 'Hipermercado',
    confidence: 0.95,
    keywords: ['carrefour', 'carrefour brasil', 'hiper carrefour']
  },
  'extra': {
    name: 'Extra',
    category: 'Alimentação',
    businessType: 'Hipermercado',
    description: 'Hipermercado',
    confidence: 0.95,
    keywords: ['extra', 'extra hipermercado', 'hipermercado extra']
  },
  'pao-de-acucar': {
    name: 'Pão de Açúcar',
    category: 'Alimentação',
    businessType: 'Supermercado',
    description: 'Supermercado',
    confidence: 0.95,
    keywords: ['pao de acucar', 'pão de açúcar', 'supermercado pao de acucar']
  },
  'atacadao': {
    name: 'Atacadão',
    category: 'Alimentação',
    businessType: 'Atacado/Varejo',
    description: 'Atacado e varejo',
    confidence: 0.95,
    keywords: ['atacadao', 'atacadão', 'carrefour atacadao']
  },
  'assai': {
    name: 'Assaí',
    category: 'Alimentação',
    businessType: 'Atacado',
    description: 'Atacado',
    confidence: 0.95,
    keywords: ['assai', 'assaí', 'assai atacadista']
  },

  // Postos de Combustível
  'shell': {
    name: 'Shell',
    category: 'Transporte',
    businessType: 'Posto de Combustível',
    description: 'Posto de combustível',
    confidence: 0.95,
    keywords: ['shell', 'posto shell', 'auto posto shell']
  },
  'petrobras': {
    name: 'Petrobras',
    category: 'Transporte',
    businessType: 'Posto de Combustível',
    description: 'Posto de combustível',
    confidence: 0.95,
    keywords: ['petrobras', 'posto petrobras', 'br petrobras']
  },
  'ipiranga': {
    name: 'Ipiranga',
    category: 'Transporte',
    businessType: 'Posto de Combustível',
    description: 'Posto de combustível',
    confidence: 0.95,
    keywords: ['ipiranga', 'posto ipiranga', 'auto posto ipiranga']
  },
  'raizen': {
    name: 'Raízen',
    category: 'Transporte',
    businessType: 'Posto de Combustível',
    description: 'Posto de combustível',
    confidence: 0.95,
    keywords: ['raizen', 'raízen', 'posto raizen']
  },

  // Farmácias e Saúde
  'drogasil': {
    name: 'Drogasil',
    category: 'Saúde',
    businessType: 'Farmácia',
    description: 'Farmácia',
    confidence: 0.95,
    keywords: ['drogasil', 'farmacia drogasil']
  },
  'pacheco': {
    name: 'Drogaria Pacheco',
    category: 'Saúde',
    businessType: 'Farmácia',
    description: 'Farmácia',
    confidence: 0.95,
    keywords: ['pacheco', 'drogaria pacheco', 'farmacia pacheco']
  },
  'pague-menos': {
    name: 'Pague Menos',
    category: 'Saúde',
    businessType: 'Farmácia',
    description: 'Farmácia',
    confidence: 0.95,
    keywords: ['pague menos', 'farmacia pague menos']
  },

  // Bancos e Serviços Financeiros
  'nubank': {
    name: 'Nubank',
    category: 'Serviços Financeiros',
    businessType: 'Banco Digital',
    description: 'Banco digital',
    confidence: 0.95,
    keywords: ['nubank', 'nu bank', 'nu pagamentos']
  },
  'inter': {
    name: 'Banco Inter',
    category: 'Serviços Financeiros',
    businessType: 'Banco Digital',
    description: 'Banco digital',
    confidence: 0.95,
    keywords: ['inter', 'banco inter', 'intermedium']
  },
  'c6-bank': {
    name: 'C6 Bank',
    category: 'Serviços Financeiros',
    businessType: 'Banco Digital',
    description: 'Banco digital',
    confidence: 0.95,
    keywords: ['c6', 'c6 bank', 'banco c6']
  },

  // Aplicativos e Serviços
  'uber': {
    name: 'Uber',
    category: 'Transporte',
    businessType: 'App de Transporte',
    description: 'Aplicativo de transporte',
    confidence: 0.95,
    keywords: ['uber', 'uber brasil', 'uber trip']
  },
  '99': {
    name: '99',
    category: 'Transporte',
    businessType: 'App de Transporte',
    description: 'Aplicativo de transporte',
    confidence: 0.95,
    keywords: ['99', '99app', '99 tecnologia']
  },
  'ifood': {
    name: 'iFood',
    category: 'Alimentação',
    businessType: 'Delivery',
    description: 'Aplicativo de delivery',
    confidence: 0.95,
    keywords: ['ifood', 'i food', 'movile internet movel']
  },
  'netflix': {
    name: 'Netflix',
    category: 'Entretenimento',
    businessType: 'Streaming',
    description: 'Serviço de streaming',
    confidence: 0.95,
    keywords: ['netflix', 'netflix.com']
  },
  'spotify': {
    name: 'Spotify',
    category: 'Entretenimento',
    businessType: 'Streaming Musical',
    description: 'Streaming de música',
    confidence: 0.95,
    keywords: ['spotify', 'spotify ltd']
  },

  // Educação
  'estacio': {
    name: 'Estácio',
    category: 'Educação',
    businessType: 'Universidade',
    description: 'Universidade',
    confidence: 0.95,
    keywords: ['estacio', 'estácio', 'universidade estacio']
  },
  'unopar': {
    name: 'Unopar',
    category: 'Educação',
    businessType: 'Universidade',
    description: 'Universidade',
    confidence: 0.95,
    keywords: ['unopar', 'universidade unopar']
  }
};

// Função para normalizar texto de transação bancária
export function normalizeTransactionText(description: string): string {
  let normalized = description.toLowerCase().trim();
  
  // Remove prefixos comuns de bancos brasileiros
  const bankPrefixes = [
    'pagamento pix',
    'recebimento pix',
    'pix deb',
    'pix cred',
    'compras nacionais',
    'compra cartao',
    'cartao credito',
    'cartao debito',
    'ted',
    'doc',
    'transferencia',
    'saque',
    'deposito'
  ];
  
  for (const prefix of bankPrefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.replace(prefix, '').trim();
      break;
    }
  }
  
  // Remove códigos e números comuns
  normalized = normalized.replace(/\b(veo\d+|vec\d+|dbr|deb|cred|aut\d+|nsu\d+)\b/g, '');
  normalized = normalized.replace(/\b\d{4,}\b/g, ''); // Remove números longos
  normalized = normalized.replace(/[^\w\s]/g, ' '); // Remove pontuação
  normalized = normalized.replace(/\s+/g, ' ').trim(); // Normaliza espaços
  
  // Remove sufixos comuns
  const suffixes = ['ltda', 'me', 'epp', 's.a', 'sa', 'eireli'];
  for (const suffix of suffixes) {
    normalized = normalized.replace(new RegExp(`\\b${suffix}\\b$`, 'i'), '').trim();
  }
  
  return normalized;
}

// Função para buscar merchant no dicionário
export function findMerchantInDictionary(description: string): MerchantInfo | null {
  const normalized = normalizeTransactionText(description);
  const words = normalized.split(' ');
  
  // Busca exata primeiro
  for (const [key, merchant] of Object.entries(MERCHANT_DICTIONARY)) {
    for (const keyword of merchant.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return merchant;
      }
    }
  }
  
  // Busca por palavras individuais
  for (const word of words) {
    if (word.length >= 3) { // Só considera palavras com 3+ caracteres
      for (const [key, merchant] of Object.entries(MERCHANT_DICTIONARY)) {
        if (merchant.keywords.some(keyword => keyword.toLowerCase().includes(word))) {
          return { ...merchant, confidence: merchant.confidence * 0.8 }; // Reduz confiança
        }
      }
    }
  }
  
  return null;
}

// Função para extrair nome limpo do merchant
export function extractMerchantName(description: string): string {
  const normalized = normalizeTransactionText(description);
  
  // Se encontrou no dicionário, usa o nome canônico
  const dictMatch = findMerchantInDictionary(description);
  if (dictMatch) {
    return dictMatch.name;
  }
  
  // Senão, usa o texto normalizado como nome
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Função para classificar tipo de transação
export function detectTransactionType(description: string): {
  type: 'PIX_IN' | 'PIX_OUT' | 'CARD' | 'TRANSFER' | 'OTHER';
  method: string;
} {
  const desc = description.toLowerCase();
  
  if (desc.includes('recebimento pix') || desc.includes('pix cred')) {
    return { type: 'PIX_IN', method: 'PIX' };
  }
  
  if (desc.includes('pagamento pix') || desc.includes('pix deb')) {
    return { type: 'PIX_OUT', method: 'PIX' };
  }
  
  if (desc.includes('compras nacionais') || desc.includes('compra cartao')) {
    return { type: 'CARD', method: 'Cartão' };
  }
  
  if (desc.includes('ted') || desc.includes('doc') || desc.includes('transferencia')) {
    return { type: 'TRANSFER', method: 'Transferência' };
  }
  
  return { type: 'OTHER', method: 'Outro' };
}

// Regras determinísticas por tipo de estabelecimento
export const BUSINESS_TYPE_RULES: { [key: string]: MerchantInfo } = {
  'auto posto': {
    name: 'Posto de Combustível',
    category: 'Transporte',
    businessType: 'Posto de Combustível',
    description: 'Abastecimento',
    confidence: 0.90,
    keywords: ['auto posto', 'posto', 'combustivel']
  },
  'supermercado': {
    name: 'Supermercado',
    category: 'Alimentação',
    businessType: 'Supermercado',
    description: 'Compras no supermercado',
    confidence: 0.90,
    keywords: ['supermercado', 'mercado', 'hipermercado']
  },
  'farmacia': {
    name: 'Farmácia',
    category: 'Saúde',
    businessType: 'Farmácia',
    description: 'Medicamentos e produtos de saúde',
    confidence: 0.90,
    keywords: ['farmacia', 'drogaria']
  },
  'restaurante': {
    name: 'Restaurante',
    category: 'Alimentação',
    businessType: 'Restaurante',
    description: 'Alimentação',
    confidence: 0.90,
    keywords: ['restaurante', 'lanchonete', 'pizzaria']
  }
};