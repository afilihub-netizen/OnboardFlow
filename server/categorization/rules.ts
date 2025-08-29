import { Tipo } from './types.js';

export type Rule = {
  test: (merchantNorm: string, tipo: Tipo) => boolean;
  to: { categoria: string; nome?: string };
  score?: number;
};

const kw = (s: string) => (x: string) => x.toUpperCase().includes(s.toUpperCase());

export const RULES: Rule[] = [
  // Combustível - ALTA PRIORIDADE
  { 
    test: (m) => /(POSTO|IPIRANGA|SHELL|BR\b|RAIZEN|ALE\b|PETROBRAS|INNOVARE)/i.test(m), 
    to: { categoria: 'Transporte' }, 
    score: 0.93 
  },
  
  // Supermercado - EXPANDIDO para casos brasileiros
  { 
    test: (m) => /(MERCADO|SUPERMERC|ATACAD|ASSAI|TONIN|MEDEIROS|RETA|CARREFOUR|EXTRA|WALMART)/i.test(m), 
    to: { categoria: 'Alimentação' }, 
    score: 0.92 
  },
  
  // Telefonia - CASOS BRASILEIROS ESPECÍFICOS
  { 
    test: (m) => /(VIVO|CLARO|TIM\b|OI\b|ALGAR|NEXTEL|WEBCLIX|EMBRATEL|TELEFONICA)/i.test(m), 
    to: { categoria: 'Serviços' }, 
    score: 0.92 
  },
  
  // Apps transporte
  { 
    test: (m) => /(UBER|99APP|99POP|BUSER|99\b)/i.test(m), 
    to: { categoria: 'Transporte' }, 
    score: 0.9 
  },
  
  // Serviços financeiros - EXPANDIDO
  { 
    test: (m) => /(PAY|PAGAR\.ME|CIELO|STONE|RECEBIVEIS|GATEWAY|PAYPAL|MERCADO\s*PAGO|BLUE\s*PAY|NUBANK|INTER|C6)/i.test(m), 
    to: { categoria: 'Serviços Financeiros' }, 
    score: 0.9 
  },
  
  // Restaurantes e alimentação
  { 
    test: (m) => /(LANCH|RESTAUR|PIZZA|BURGER|SUBWAY|MC\s*DONALD|BK\b|IFOOD)/i.test(m), 
    to: { categoria: 'Alimentação' }, 
    score: 0.88 
  },
  
  // Saúde - EXPANDIDO
  { 
    test: (m) => /(DROGARIA|FARMACIA|LABORATORIO|CLINICA|HOSPITAL|MEDIC|DROGASIL|PACHECO|PAGUE\s*MENOS)/i.test(m), 
    to: { categoria: 'Saúde' }, 
    score: 0.9 
  },
  
  // Telemarketing e call centers - ESPECÍFICO BRASILEIRO
  { 
    test: (m) => /(TELEMARKETING|TOSCANA|CALL\s*CENTER)/i.test(m), 
    to: { categoria: 'Serviços' }, 
    score: 0.85 
  },
  
  // Streaming e assinaturas digitais
  { 
    test: (m) => /(NETFLIX|SPOTIFY|AMAZON|DISNEY|YOUTUBE|MICROSOFT|ADOBE|GOOGLE|APPLE)/i.test(m), 
    to: { categoria: 'Entretenimento' }, 
    score: 0.87 
  },
  
  // Educação
  { 
    test: (m) => /(UNIVERSIDADE|FACULDADE|ESCOLA|ESTACIO|UNOPAR|ANHANGUERA|UNIP|KROTON)/i.test(m), 
    to: { categoria: 'Educação' }, 
    score: 0.85 
  }
];

export function rulesMatch(merchantNorm: string, tipo: Tipo) {
  for (const r of RULES) {
    if (r.test(merchantNorm, tipo)) {
      return { categoria: r.to.categoria, nome: r.to.nome, score: r.score ?? 0.9 };
    }
  }
  return null;
}