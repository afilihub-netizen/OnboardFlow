// CNPJ utilities for automatic categorization
interface CNPJInfo {
  nome: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  natureza_juridica: string;
  porte: string;
}

// Extract CNPJ from transaction description
export function extractCNPJ(text: string): string | null {
  // CNPJ pattern: XX.XXX.XXX/XXXX-XX
  const cnpjPattern = /\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}/;
  const match = text.match(cnpjPattern);
  
  if (match) {
    return match[0];
  }
  
  // Try pattern without formatting: XXXXXXXXXX (14 digits)
  const cnpjDigitsPattern = /\b\d{14}\b/;
  const digitsMatch = text.match(cnpjDigitsPattern);
  
  if (digitsMatch) {
    const cnpj = digitsMatch[0];
    // Format as XX.XXX.XXX/XXXX-XX
    return `${cnpj.slice(0,2)}.${cnpj.slice(2,5)}.${cnpj.slice(5,8)}/${cnpj.slice(8,12)}-${cnpj.slice(12,14)}`;
  }
  
  return null;
}

// Query CNPJ information from ReceitaWS API
export async function queryCNPJ(cnpj: string): Promise<CNPJInfo | null> {
  try {
    const cleanCNPJ = cnpj.replace(/\D/g, ''); // Remove formatting
    
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
      headers: {
        'User-Agent': 'FinanceFlow/1.0'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      return null;
    }
    
    return {
      nome: data.nome || data.fantasia || 'Empresa não identificada',
      atividade_principal: data.atividade_principal || [],
      natureza_juridica: data.natureza_juridica || '',
      porte: data.porte || ''
    };
  } catch (error) {
    console.error('Error querying CNPJ:', error);
    return null;
  }
}

// Enhanced categorization with detailed business analysis
export function categorizeByCNPJ(cnpjInfo: CNPJInfo): {
  category: string;
  businessType: string;
  description: string;
} {
  const activity = cnpjInfo.atividade_principal[0]?.text?.toLowerCase() || '';
  const name = cnpjInfo.nome.toLowerCase();
  
  // Supermercados e Mercados
  if (activity.includes('supermercado') || activity.includes('hipermercado') || activity.includes('mercado') ||
      activity.includes('atacadista') || activity.includes('varejo alimentício') ||
      name.includes('supermercado') || name.includes('mercado') || name.includes('atacadão') ||
      name.includes('carrefour') || name.includes('pão de açúcar') || name.includes('extra')) {
    return {
      category: 'Alimentação',
      businessType: 'Supermercado',
      description: 'Compras em supermercado'
    };
  }
  
  // Postos de Combustível
  if (activity.includes('combustível') || activity.includes('posto') || activity.includes('gasolina') ||
      activity.includes('álcool') || activity.includes('etanol') || activity.includes('diesel') ||
      name.includes('posto') || name.includes('petrobras') || name.includes('shell') ||
      name.includes('ipiranga') || name.includes('ale')) {
    return {
      category: 'Transporte',
      businessType: 'Posto de Combustível',
      description: 'Abastecimento de combustível'
    };
  }
  
  // Farmácias
  if (activity.includes('farmácia') || activity.includes('medicamento') || activity.includes('drogaria') ||
      name.includes('farmácia') || name.includes('drogaria') || name.includes('droga') ||
      name.includes('pague menos') || name.includes('extrafarma') || name.includes('drogasil')) {
    return {
      category: 'Saúde',
      businessType: 'Farmácia',
      description: 'Compra de medicamentos e produtos de saúde'
    };
  }
  
  // Restaurantes e Alimentação
  if (activity.includes('restaurante') || activity.includes('lanchonete') || activity.includes('pizzaria') ||
      activity.includes('hamburgueria') || activity.includes('food') || activity.includes('alimentação') ||
      name.includes('restaurante') || name.includes('lanchonete') || name.includes('mcdonald') ||
      name.includes('burger') || name.includes('pizza') || name.includes('ifood')) {
    return {
      category: 'Alimentação',
      businessType: 'Restaurante',
      description: 'Gastos com alimentação fora de casa'
    };
  }
  
  // Telecomunicações e Internet
  if (activity.includes('telecomunicações') || activity.includes('telefonia') || activity.includes('internet') ||
      activity.includes('celular') || activity.includes('banda larga') ||
      name.includes('vivo') || name.includes('tim') || name.includes('claro') ||
      name.includes('oi') || name.includes('nextel') || name.includes('sky')) {
    return {
      category: 'Serviços Essenciais',
      businessType: 'Telecomunicações',
      description: 'Serviços de telefonia e internet'
    };
  }
  
  // Energia Elétrica
  if (activity.includes('energia elétrica') || activity.includes('distribuição de energia') ||
      name.includes('energia') || name.includes('elétrica') || name.includes('copel') ||
      name.includes('cemig') || name.includes('light') || name.includes('eletrobras')) {
    return {
      category: 'Serviços Essenciais',
      businessType: 'Energia Elétrica',
      description: 'Conta de luz'
    };
  }
  
  // Streaming e Assinaturas Digitais
  if (activity.includes('streaming') || activity.includes('conteúdo digital') || activity.includes('software') ||
      name.includes('netflix') || name.includes('spotify') || name.includes('amazon prime') ||
      name.includes('disney') || name.includes('youtube') || name.includes('microsoft') ||
      name.includes('adobe') || name.includes('google')) {
    return {
      category: 'Entretenimento',
      businessType: 'Assinatura Digital',
      description: 'Serviços de streaming e assinaturas digitais'
    };
  }
  
  // Bancos e Serviços Financeiros
  if (activity.includes('banco') || activity.includes('financeiro') || activity.includes('crédito') ||
      activity.includes('investimento') || activity.includes('corretora') ||
      name.includes('banco') || name.includes('bradesco') || name.includes('itaú') ||
      name.includes('santander') || name.includes('nubank') || name.includes('inter') ||
      name.includes('caixa') || name.includes('bb ')) {
    return {
      category: 'Serviços Financeiros',
      businessType: 'Banco',
      description: 'Serviços bancários e financeiros'
    };
  }
  
  // Lojas e Varejo
  if (activity.includes('comércio varejista') || activity.includes('loja') || activity.includes('varejo') ||
      activity.includes('vestuário') || activity.includes('calçados') || activity.includes('magazine') ||
      name.includes('magazine') || name.includes('americanas') || name.includes('casas bahia') ||
      name.includes('riachuelo') || name.includes('c&a') || name.includes('renner')) {
    return {
      category: 'Compras',
      businessType: 'Loja de Varejo',
      description: 'Compras em lojas físicas ou online'
    };
  }
  
  // Transporte e Mobilidade
  if (activity.includes('transporte') || activity.includes('táxi') || activity.includes('aplicativo') ||
      name.includes('uber') || name.includes('99') || name.includes('taxi') ||
      name.includes('metro') || name.includes('cptm') || name.includes('brt')) {
    return {
      category: 'Transporte',
      businessType: 'Transporte',
      description: 'Gastos com locomoção'
    };
  }
  
  // Default category
  return {
    category: 'Outros',
    businessType: 'Empresa',
    description: 'Gasto não categorizado automaticamente'
  };
}

// Detect payment method from transaction description
export function detectPaymentMethod(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('pix') || desc.includes('transferencia pix')) {
    return 'pix';
  }
  
  if (desc.includes('cartao credito') || desc.includes('compra cartao') || 
      desc.includes('cc ') || desc.includes('credit')) {
    return 'credit_card';
  }
  
  if (desc.includes('cartao debito') || desc.includes('debito') || 
      desc.includes('cd ') || desc.includes('debit')) {
    return 'debit_card';
  }
  
  if (desc.includes('ted') || desc.includes('doc') || desc.includes('transferencia')) {
    return 'transfer';
  }
  
  if (desc.includes('dinheiro') || desc.includes('especie')) {
    return 'cash';
  }
  
  if (desc.includes('saque') || desc.includes('atm')) {
    return 'cash';
  }
  
  // Default based on common patterns
  if (desc.includes('compra') || desc.includes('pagto')) {
    return 'debit_card'; // Most common for purchases
  }
  
  return 'other';
}

// Extract company name from transaction description
export function extractCompanyName(description: string): string | null {
  // Common patterns for company names in bank statements
  const patterns = [
    /PIX\s+(.+?)(?:\s+\d|$)/i,
    /TED\s+(.+?)(?:\s+\d|$)/i,
    /COMPRA\s+(.+?)(?:\s+\d|$)/i,
    /PAGTO\s+(.+?)(?:\s+\d|$)/i,
    /DÉBITO\s+(.+?)(?:\s+\d|$)/i,
    /(.+?)\s+(?:\d{2}\/\d{2})/,
    /(.+?)\s+R\$/
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}