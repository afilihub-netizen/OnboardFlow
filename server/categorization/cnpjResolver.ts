import { categoryFromCNAE } from './cnaeCategoryMap.js';

// Implementação com injeção de dependência.
// Você pode plugar aqui BrasilAPI CNPJ, ReceitaWS, Serpro ou sua base local.
// Este resolver aceita nome do comércio e tenta achar um CNPJ/cnae via sua cache/DB.

export interface CnpjHit {
  nome_fantasia?: string | null;
  razao_social?: string | null;
  cnpj: string;
  cnae_principal?: string | null;
  score: number; // similaridade do nome (0-1)
}

export interface CnpjResolver {
  resolveByName(name: string): Promise<CnpjHit | null>;
}

// Algoritmo Jaro-Winkler para matching de nomes
function jaroWinkler(s1: string, s2: string): number {
  // Implementação compacta (não perfeita, mas suficiente pro matching)
  function jaro(a: string, b: string) {
    const m = Math.floor(Math.max(a.length, b.length) / 2) - 1;
    const aFlags = new Array(a.length);
    const bFlags = new Array(b.length);
    let matches = 0;
    for (let i = 0; i < a.length; i++) {
      const low = Math.max(0, i - m);
      const hi = Math.min(i + m + 1, b.length);
      for (let j = low; j < hi; j++) {
        if (!bFlags[j] && a[i] === b[j]) {
          aFlags[i] = bFlags[j] = true as any;
          matches++;
          break;
        }
      }
    }
    if (!matches) return 0;
    let t = 0;
    let k = 0;
    for (let i = 0; i < a.length; i++) {
      if (aFlags[i]) {
        while (!bFlags[k]) k++;
        if (a[i] !== b[k]) t++;
        k++;
      }
    }
    t /= 2;
    return (matches / a.length + matches / b.length + (matches - t) / matches) / 3;
  }
  const j = jaro(s1, s2);
  const p = 0.1;
  let l = 0;
  for (; l < Math.min(4, s1.length, s2.length); l++) {
    if (s1[l] !== s2[l]) break;
  }
  return j + l * p * (1 - j);
}

// Base de dados de merchants brasileiros conhecidos (expandida)
const miniBase = [
  // Supermercados
  { cnpj: '00.000.000/0001-00', nome_fantasia: 'Luiz Tonin Supermercados', razao_social: 'Luiz Tonin Ltda', cnae_principal: '47.11-3-01' },
  { cnpj: '11.111.111/0001-01', nome_fantasia: 'Supermercado Medeiros', razao_social: 'Medeiros Comércio Ltda', cnae_principal: '47.11-3-01' },
  { cnpj: '22.222.222/0001-02', nome_fantasia: 'Reta Alimentos', razao_social: 'Reta Comércio e Distribuição Ltda', cnae_principal: '47.11-3-01' },
  
  // Postos de combustível
  { cnpj: '33.333.333/0001-03', nome_fantasia: 'Auto Posto Innovare', razao_social: 'Posto Innovare Ltda', cnae_principal: '47.30-1-00' },
  
  // Telecomunicações
  { cnpj: '44.444.444/0001-04', nome_fantasia: 'Claro S.A.', razao_social: 'Claro S.A.', cnae_principal: '61.41-7-00' },
  { cnpj: '55.555.555/0001-05', nome_fantasia: 'Webclix Telecom', razao_social: 'Webclix Provedor de Internet Ltda', cnae_principal: '61.41-7-00' },
  { cnpj: '66.666.666/0001-06', nome_fantasia: 'Vivo S.A.', razao_social: 'Telefônica Brasil S.A.', cnae_principal: '61.41-7-00' },
  { cnpj: '77.777.777/0001-07', nome_fantasia: 'TIM S.A.', razao_social: 'TIM S.A.', cnae_principal: '61.41-7-00' },
  
  // Serviços financeiros
  { cnpj: '88.888.888/0001-08', nome_fantasia: 'Blue Pay Solutions', razao_social: 'Blue Pay Solutions Ltda', cnae_principal: '64.99-9-99' },
  { cnpj: '99.999.999/0001-09', nome_fantasia: 'Nubank', razao_social: 'Nu Pagamentos S.A.', cnae_principal: '64.22-6-00' },
  
  // Call centers e telemarketing
  { cnpj: '10.101.010/0001-10', nome_fantasia: 'Toscana Telemarketing', razao_social: 'Toscana Telemarketing e Serviços S.A.', cnae_principal: '82.20-2-00' },
  
  // Farmácias
  { cnpj: '20.202.020/0001-20', nome_fantasia: 'Drogasil', razao_social: 'Drogasil S.A.', cnae_principal: '47.71-7-01' },
  { cnpj: '30.303.030/0001-30', nome_fantasia: 'Drogaria Pacheco', razao_social: 'Drogaria Pacheco S.A.', cnae_principal: '47.71-7-01' },
  
  // Apps e serviços digitais
  { cnpj: '40.404.040/0001-40', nome_fantasia: 'Uber do Brasil', razao_social: 'Uber do Brasil Tecnologia Ltda', cnae_principal: '49.39-1-03' },
  { cnpj: '50.505.050/0001-50', nome_fantasia: '99', razao_social: '99 Tecnologia Ltda', cnae_principal: '49.39-1-03' },
  { cnpj: '60.606.060/0001-60', nome_fantasia: 'iFood', razao_social: 'Movile Internet Móvel S.A.', cnae_principal: '56.20-1-00' },
];

export class InMemoryCnpjResolver implements CnpjResolver {
  async resolveByName(name: string): Promise<CnpjHit | null> {
    const norm = name.toUpperCase();
    let best: CnpjHit | null = null;
    
    for (const row of miniBase) {
      // Testa tanto nome fantasia quanto razão social
      const score1 = jaroWinkler(norm, row.nome_fantasia!.toUpperCase());
      const score2 = jaroWinkler(norm, row.razao_social!.toUpperCase());
      const score = Math.max(score1, score2);
      
      if (!best || score > best.score) {
        best = { 
          ...row, 
          score 
        };
      }
    }
    
    // Retorna apenas se score for alto o suficiente
    if (best && best.score >= 0.75) {
      console.log(`🎯 [CNPJ Resolver] "${name}" → "${best.nome_fantasia}" (score: ${(best.score * 100).toFixed(1)}%)`);
      return best;
    }
    
    return null;
  }
}

export async function cnpjToCategory(cnae: string | null | undefined): Promise<string | null> {
  return categoryFromCNAE(cnae || null);
}