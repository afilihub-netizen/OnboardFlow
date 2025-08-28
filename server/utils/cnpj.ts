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

// Categorize based on CNPJ activity
export function categorizeByCNPJ(cnpjInfo: CNPJInfo): string {
  const activity = cnpjInfo.atividade_principal[0]?.text?.toLowerCase() || '';
  const name = cnpjInfo.nome.toLowerCase();
  
  // Healthcare
  if (activity.includes('médic') || activity.includes('hospitalar') || activity.includes('saúde') ||
      activity.includes('farmácia') || activity.includes('clínica') || activity.includes('dentário') ||
      name.includes('hospital') || name.includes('clínica') || name.includes('médico')) {
    return 'Saúde';
  }
  
  // Education
  if (activity.includes('educação') || activity.includes('ensino') || activity.includes('escola') ||
      activity.includes('universidade') || activity.includes('curso') ||
      name.includes('escola') || name.includes('faculdade') || name.includes('universidade')) {
    return 'Educação';
  }
  
  // Transportation
  if (activity.includes('transporte') || activity.includes('combustível') || activity.includes('posto') ||
      activity.includes('gasolina') || activity.includes('táxi') || activity.includes('uber') ||
      name.includes('posto') || name.includes('transport') || name.includes('combustível')) {
    return 'Transporte';
  }
  
  // Food
  if (activity.includes('alimentação') || activity.includes('restaurante') || activity.includes('lanchonete') ||
      activity.includes('padaria') || activity.includes('supermercado') || activity.includes('mercado') ||
      name.includes('restaurante') || name.includes('lanchonete') || name.includes('mercado') ||
      name.includes('supermercado') || name.includes('padaria')) {
    return 'Alimentação';
  }
  
  // Shopping/Retail
  if (activity.includes('comércio') || activity.includes('varejo') || activity.includes('loja') ||
      activity.includes('vestuário') || activity.includes('calçados') || activity.includes('magazine') ||
      name.includes('loja') || name.includes('magazine') || name.includes('shopping')) {
    return 'Compras';
  }
  
  // Entertainment
  if (activity.includes('entretenimento') || activity.includes('cinema') || activity.includes('teatro') ||
      activity.includes('shows') || activity.includes('diversão') ||
      name.includes('cinema') || name.includes('teatro') || name.includes('show')) {
    return 'Entretenimento';
  }
  
  // Utilities
  if (activity.includes('energia elétrica') || activity.includes('água') || activity.includes('telefonia') ||
      activity.includes('internet') || activity.includes('gás') || activity.includes('telecomunicações') ||
      name.includes('energia') || name.includes('telefônica') || name.includes('vivo') ||
      name.includes('tim') || name.includes('claro') || name.includes('oi')) {
    return 'Serviços Essenciais';
  }
  
  // Financial Services
  if (activity.includes('banco') || activity.includes('financeiro') || activity.includes('crédito') ||
      activity.includes('investimento') || activity.includes('corretora') ||
      name.includes('banco') || name.includes('bradesco') || name.includes('itaú') ||
      name.includes('santander') || name.includes('nubank') || name.includes('inter')) {
    return 'Serviços Financeiros';
  }
  
  // Default category
  return 'Outros';
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