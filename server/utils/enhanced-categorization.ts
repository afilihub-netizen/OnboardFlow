// Sistema de categorização aprimorado que integra dicionário, CNPJ e IA
import { 
  MERCHANT_DICTIONARY, 
  findMerchantInDictionary, 
  extractMerchantName, 
  normalizeTransactionText,
  detectTransactionType,
  BUSINESS_TYPE_RULES,
  type MerchantInfo 
} from './merchant-dictionary.js';
import { extractCNPJ, queryCNPJ, categorizeByCNPJ, type CNPJInfo } from './cnpj.js';

export interface EnhancedCategorization {
  merchant: string;
  category: string;
  businessType: string;
  description: string;
  confidence: number;
  sources: string[];
  cnpj?: string;
  paymentMethod?: string;
}

// Pipeline de categorização híbrida (regras → dicionário → CNPJ → fallback)
export async function enhancedCategorization(
  description: string,
  amount: number
): Promise<EnhancedCategorization> {
  
  const sources: string[] = [];
  let result: EnhancedCategorization = {
    merchant: extractMerchantName(description),
    category: 'Outros',
    businessType: 'Outros',
    description: 'Transação não categorizada',
    confidence: 0.4,
    sources: ['fallback']
  };

  // Detecta tipo de transação e método de pagamento
  const transactionInfo = detectTransactionType(description);
  result.paymentMethod = transactionInfo.method;

  // 1. DICIONÁRIO DE MERCHANTS (maior prioridade)
  const dictMatch = findMerchantInDictionary(description);
  if (dictMatch) {
    result = {
      merchant: dictMatch.name,
      category: dictMatch.category,
      businessType: dictMatch.businessType,
      description: dictMatch.description,
      confidence: dictMatch.confidence,
      sources: ['dictionary'],
      paymentMethod: result.paymentMethod
    };
    
    console.log(`✅ [DICT] ${description} → ${dictMatch.name} (${dictMatch.category})`);
    return result;
  }

  // 2. REGRAS DE NEGÓCIO DETERMINÍSTICAS
  const normalized = normalizeTransactionText(description);
  for (const [pattern, rule] of Object.entries(BUSINESS_TYPE_RULES)) {
    if (normalized.includes(pattern)) {
      result = {
        merchant: extractMerchantName(description),
        category: rule.category,
        businessType: rule.businessType,
        description: rule.description,
        confidence: rule.confidence,
        sources: ['business_rules'],
        paymentMethod: result.paymentMethod
      };
      
      console.log(`✅ [RULE] ${description} → ${rule.category} via "${pattern}"`);
      sources.push('business_rules');
      break;
    }
  }

  // 3. ENRIQUECIMENTO COM CNPJ (se não encontrou ainda)
  if (result.confidence < 0.85) {
    const cnpj = extractCNPJ(description);
    if (cnpj) {
      try {
        const cnpjInfo = await queryCNPJ(cnpj);
        if (cnpjInfo) {
          const cnpjCategorization = categorizeByCNPJ(cnpjInfo);
          
          result = {
            merchant: cnpjInfo.nome || result.merchant,
            category: cnpjCategorization.category,
            businessType: cnpjCategorization.businessType,
            description: cnpjCategorization.description,
            confidence: 0.85,
            sources: ['cnpj'],
            cnpj: cnpj,
            paymentMethod: result.paymentMethod
          };
          
          console.log(`✅ [CNPJ] ${description} → ${cnpjInfo.nome} (${cnpjCategorization.category})`);
          sources.push('cnpj');
        }
      } catch (error) {
        console.log(`❌ [CNPJ] Erro ao consultar ${cnpj}:`, error);
      }
    }
  }

  // 4. REGRAS HEURÍSTICAS ADICIONAIS (para casos não cobertos)
  if (result.confidence < 0.7) {
    const heuristicResult = applyHeuristicRules(description);
    if (heuristicResult) {
      result = {
        ...result,
        ...heuristicResult,
        sources: [...sources, 'heuristic']
      };
      
      console.log(`✅ [HEUR] ${description} → ${heuristicResult.category}`);
    }
  }

  result.sources = sources.length > 0 ? sources : ['fallback'];
  
  // Log final do resultado
  console.log(`🎯 [FINAL] "${description}" → ${result.merchant} | ${result.category} | ${result.confidence}%`);
  
  return result;
}

// Regras heurísticas para casos não cobertos
function applyHeuristicRules(description: string): Partial<EnhancedCategorization> | null {
  const desc = description.toLowerCase();
  
  // Telecomunicações (palavras-chave expandidas)
  if (desc.includes('claro') || desc.includes('vivo') || desc.includes('tim') || desc.includes('oi') ||
      desc.includes('telefonica') || desc.includes('embratel') || desc.includes('webclix') ||
      desc.includes('telecom') || desc.includes('internet') || desc.includes('banda larga')) {
    return {
      category: 'Serviços',
      businessType: 'Telefonia/Internet',
      description: 'Serviços de telefonia e internet',
      confidence: 0.80
    };
  }
  
  // Alimentação (supermercados regionais)
  if (desc.includes('tonin') || desc.includes('medeiros') || desc.includes('reta') ||
      desc.includes('supermercado') || desc.includes('mercado') || desc.includes('hipermercado') ||
      desc.includes('atacadao') || desc.includes('atacadão') || desc.includes('assai') || desc.includes('assaí')) {
    return {
      category: 'Alimentação',
      businessType: 'Supermercado',
      description: 'Compras em supermercado',
      confidence: 0.80
    };
  }
  
  // Postos de combustível
  if (desc.includes('posto') || desc.includes('shell') || desc.includes('petrobras') || 
      desc.includes('ipiranga') || desc.includes('raizen') || desc.includes('combustivel') ||
      desc.includes('gasolina') || desc.includes('alcool') || desc.includes('etanol')) {
    return {
      category: 'Transporte',
      businessType: 'Posto de Combustível',
      description: 'Abastecimento de combustível',
      confidence: 0.80
    };
  }
  
  // Farmácias
  if (desc.includes('farmacia') || desc.includes('drogaria') || desc.includes('drogasil') ||
      desc.includes('pacheco') || desc.includes('pague menos') || desc.includes('medicamento')) {
    return {
      category: 'Saúde',
      businessType: 'Farmácia',
      description: 'Medicamentos e produtos de saúde',
      confidence: 0.80
    };
  }
  
  // Aplicativos e serviços digitais
  if (desc.includes('uber') || desc.includes('99') || desc.includes('ifood') || 
      desc.includes('netflix') || desc.includes('spotify') || desc.includes('apple') ||
      desc.includes('google') || desc.includes('microsoft')) {
    return {
      category: 'Serviços',
      businessType: 'Aplicativos/Digital',
      description: 'Serviços digitais e aplicativos',
      confidence: 0.75
    };
  }
  
  // Educação
  if (desc.includes('universidade') || desc.includes('faculdade') || desc.includes('escola') ||
      desc.includes('estacio') || desc.includes('estácio') || desc.includes('unopar') ||
      desc.includes('anhanguera') || desc.includes('unip')) {
    return {
      category: 'Educação',
      businessType: 'Instituição de Ensino',
      description: 'Educação e cursos',
      confidence: 0.75
    };
  }
  
  return null;
}

// Função para detectar assinaturas (transações recorrentes)
export function detectSubscription(
  transactions: Array<{ description: string; amount: number; date: string }>
): boolean {
  // Implementação básica - pode ser expandida
  if (transactions.length < 2) return false;
  
  // Verifica se há pelo menos 2 transações com valores similares e merchants similares
  const amounts = transactions.map(t => Math.abs(t.amount));
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
  
  // Se a variância é baixa (valores similares) e há pelo menos 2 ocorrências, considera assinatura
  return variance < (avgAmount * 0.15) && transactions.length >= 2;
}

// Função para processar lote de transações com categorização aprimorada
export async function processTransactionBatch(
  transactions: Array<{ description: string; amount: number; date: string }>
): Promise<Array<{ original: any; categorization: EnhancedCategorization }>> {
  const results = [];
  
  for (const transaction of transactions) {
    try {
      const categorization = await enhancedCategorization(
        transaction.description, 
        transaction.amount
      );
      
      results.push({
        original: transaction,
        categorization
      });
      
      // Pequeno delay para não sobrecarregar APIs externas
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Erro ao categorizar transação:', error);
      results.push({
        original: transaction,
        categorization: {
          merchant: extractMerchantName(transaction.description),
          category: 'Outros',
          businessType: 'Outros',
          description: 'Erro na categorização',
          confidence: 0.1,
          sources: ['error']
        }
      });
    }
  }
  
  return results;
}