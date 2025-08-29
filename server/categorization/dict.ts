import { DictEntry } from './types.js';

// Em produção, isso vem do seu DB (tabela merchant_map).
// Aqui deixo um exemplo inicial com casos brasileiros específicos.
export const DICT: DictEntry[] = [
  // Supermercados regionais
  { pattern_substring: 'TONIN', merchant_canonico: 'Luiz Tonin Supermercados', cnpj: '00.000.000/0001-00', categoria: 'Alimentação', confianca: 0.99 },
  { pattern_substring: 'MEDEIROS', merchant_canonico: 'Supermercado Medeiros', cnpj: '11.111.111/0001-01', categoria: 'Alimentação', confianca: 0.99 },
  { pattern_substring: 'RETA', merchant_canonico: 'Reta Alimentos', cnpj: '22.222.222/0001-02', categoria: 'Alimentação', confianca: 0.99 },
  
  // Postos de combustível
  { pattern_substring: 'INNOVARE', merchant_canonico: 'Auto Posto Innovare', cnpj: '33.333.333/0001-03', categoria: 'Transporte', confianca: 0.99 },
  { pattern_substring: 'AUTO POSTO INNOVARE', merchant_canonico: 'Auto Posto Innovare', cnpj: '33.333.333/0001-03', categoria: 'Transporte', confianca: 0.99 },
  
  // Telecomunicações
  { pattern_substring: 'CLARO', merchant_canonico: 'Claro', cnpj: '44.444.444/0001-04', categoria: 'Serviços', confianca: 0.99 },
  { pattern_substring: 'WEBCLIX', merchant_canonico: 'Webclix', cnpj: '55.555.555/0001-05', categoria: 'Serviços', confianca: 0.99 },
  { pattern_substring: 'VIVO', merchant_canonico: 'Vivo', cnpj: '66.666.666/0001-06', categoria: 'Serviços', confianca: 0.99 },
  { pattern_substring: 'TIM', merchant_canonico: 'TIM', cnpj: '77.777.777/0001-07', categoria: 'Serviços', confianca: 0.99 },
  
  // Serviços financeiros
  { pattern_substring: 'BLUE PAY SOLUTIONS', merchant_canonico: 'Blue Pay Solutions', cnpj: '88.888.888/0001-08', categoria: 'Serviços Financeiros', confianca: 0.99 },
  { pattern_substring: 'BLUE PAY', merchant_canonico: 'Blue Pay Solutions', cnpj: '88.888.888/0001-08', categoria: 'Serviços Financeiros', confianca: 0.99 },
  { pattern_substring: 'NUBANK', merchant_canonico: 'Nubank', cnpj: '99.999.999/0001-09', categoria: 'Serviços Financeiros', confianca: 0.99 },
  
  // Telemarketing
  { pattern_substring: 'TOSCANA TELEMARKETING', merchant_canonico: 'Toscana Telemarketing', cnpj: '10.101.010/0001-10', categoria: 'Serviços', confianca: 0.98 },
  { pattern_substring: 'TOSCANA', merchant_canonico: 'Toscana Telemarketing', cnpj: '10.101.010/0001-10', categoria: 'Serviços', confianca: 0.95 },
  
  // Farmácias
  { pattern_substring: 'DROGASIL', merchant_canonico: 'Drogasil', cnpj: '20.202.020/0001-20', categoria: 'Saúde', confianca: 0.99 },
  { pattern_substring: 'PACHECO', merchant_canonico: 'Drogaria Pacheco', cnpj: '30.303.030/0001-30', categoria: 'Saúde', confianca: 0.99 },
  
  // Apps de transporte
  { pattern_substring: 'UBER', merchant_canonico: 'Uber', cnpj: '40.404.040/0001-40', categoria: 'Transporte', confianca: 0.99 },
  { pattern_substring: '99APP', merchant_canonico: '99', cnpj: '50.505.050/0001-50', categoria: 'Transporte', confianca: 0.99 },
  { pattern_substring: '99POP', merchant_canonico: '99', cnpj: '50.505.050/0001-50', categoria: 'Transporte', confianca: 0.99 },
  
  // Delivery
  { pattern_substring: 'IFOOD', merchant_canonico: 'iFood', cnpj: '60.606.060/0001-60', categoria: 'Alimentação', confianca: 0.99 },
  
  // Grandes redes nacionais
  { pattern_substring: 'CARREFOUR', merchant_canonico: 'Carrefour', categoria: 'Alimentação', confianca: 0.99 },
  { pattern_substring: 'EXTRA', merchant_canonico: 'Extra', categoria: 'Alimentação', confianca: 0.99 },
  { pattern_substring: 'PETROBRAS', merchant_canonico: 'Petrobras', categoria: 'Transporte', confianca: 0.99 },
  { pattern_substring: 'SHELL', merchant_canonico: 'Shell', categoria: 'Transporte', confianca: 0.99 },
  { pattern_substring: 'IPIRANGA', merchant_canonico: 'Ipiranga', categoria: 'Transporte', confianca: 0.99 },
];

export function dictLookup(merchantNorm: string) {
  const up = merchantNorm.toUpperCase();
  
  // Ordena entradas por tamanho decrescente para priorizar matches mais específicos
  const sortedDict = [...DICT].sort((a, b) => b.pattern_substring.length - a.pattern_substring.length);
  
  // Primeiro, busca matches exatos (mais específicos primeiro)
  for (const e of sortedDict) {
    if (up.includes(e.pattern_substring.toUpperCase())) {
      console.log(`✅ [DICT] Match exato: "${merchantNorm}" → "${e.merchant_canonico}" (${e.categoria})`);
      return {
        nome: e.merchant_canonico,
        cnpj: e.cnpj ?? null,
        categoria: e.categoria ?? null,
        score: e.confianca ?? 0.99,
      };
    }
  }
  
  // Segundo, busca matches por palavras-chave individuais
  const words = up.split(/\s+/).filter(word => word.length >= 4); // Só palavras com 4+ caracteres
  for (const word of words) {
    for (const e of sortedDict) {
      const pattern = e.pattern_substring.toUpperCase();
      if (pattern.includes(word) || word.includes(pattern)) {
        console.log(`🎯 [DICT] Match parcial: "${merchantNorm}" → "${e.merchant_canonico}" (${e.categoria}) via palavra "${word}"`);
        return {
          nome: e.merchant_canonico,
          cnpj: e.cnpj ?? null,
          categoria: e.categoria ?? null,
          score: (e.confianca ?? 0.99) * 0.80, // Reduz confiança para matches parciais
        };
      }
    }
  }
  
  return null;
}