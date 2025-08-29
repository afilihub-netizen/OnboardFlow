// EXTRATOR ULTRA-SIMPLES PARA TRANSAÇÕES BRASILEIRAS
// Só pega transações com padrões muito específicos e conhecidos

interface SimpleTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  confidence: number;
}

// PADRÕES ULTRA-ESPECÍFICOS - APENAS O QUE SABEMOS QUE FUNCIONA
const ULTRA_SPECIFIC_PATTERNS = {
  // Linha completa de transação com data no início
  TRANSACTION_LINE: /^\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+([A-Z0-9_]+)\s*([-+]?\s*[\d.,]+)\s+[\d.,]+$/,
  
  // PIX específicos
  PIX_PAYMENT: /PAGAMENTO PIX.*?PIX_DEB\s*([-][\d.,]+)/i,
  PIX_RECEIPT: /RECEBIMENTO PIX.*?PIX_CRED\s*([+]?[\d.,]+)/i,
  
  // Compras específicas  
  COMPRAS_NACIONAIS: /COMPRAS NACIONAIS\s+(.+?)\s+VE\d+\s*([-][\d.,]+)/i,
  
  // TED específicos
  TED_TRANSACTION: /TED\s+[\d\s]+(.+?)\s+\d+\s*([+-]?[\d.,]+)/i,
  
  // Apenas valores em formato brasileiro
  BRAZILIAN_VALUE: /[-+]?\s*R?\$?\s*([\d]{1,3}(?:\.\d{3})*(?:,\d{2})?)/
};

export function extractSimpleBrazilianTransactions(text: string, availableCategories: any[] = []): SimpleTransaction[] {
  console.log('[SIMPLE-BR] 🎯 Iniciando extração ultra-simples...');
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  const transactions: SimpleTransaction[] = [];
  
  console.log(`[SIMPLE-BR] Analisando ${lines.length} linhas...`);
  
  for (const line of lines) {
    // APENAS linhas que começam com data e terminam com valores
    const transactionMatch = line.match(ULTRA_SPECIFIC_PATTERNS.TRANSACTION_LINE);
    if (!transactionMatch) continue;
    
    const description = transactionMatch[1].trim();
    const valueStr = transactionMatch[3].trim();
    
    // FILTROS ULTRA-RIGOROSOS
    if (shouldIgnoreLine(line)) {
      console.log(`[SIMPLE-BR] ❌ Ignorando: ${line.substring(0, 50)}...`);
      continue;
    }
    
    // Extrair valor
    const amount = parseSimpleBrazilianValue(valueStr);
    if (!amount || Math.abs(amount) < 2) {
      console.log(`[SIMPLE-BR] ❌ Valor inválido: ${valueStr}`);
      continue;
    }
    
    // Limpar descrição
    const cleanDesc = cleanSimpleDescription(description);
    if (!cleanDesc || cleanDesc.length < 10) {
      console.log(`[SIMPLE-BR] ❌ Descrição inválida: ${description}`);
      continue;
    }
    
    // Extrair data da linha
    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
    const date = dateMatch ? convertBrazilianDate(dateMatch[1]) : new Date().toISOString().split('T')[0];
    
    const transaction: SimpleTransaction = {
      date,
      description: cleanDesc,
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      category: categorizeSimple(cleanDesc, availableCategories),
      paymentMethod: detectPaymentMethod(line),
      confidence: 0.95
    };
    
    transactions.push(transaction);
    console.log(`[SIMPLE-BR] ✅ Extraído: ${cleanDesc} - R$ ${Math.abs(amount)}`);
  }
  
  console.log(`[SIMPLE-BR] 🎉 Total extraído: ${transactions.length} transações`);
  return transactions;
}

function shouldIgnoreLine(line: string): boolean {
  const ignorePatterns = [
    /SALDO (ANTERIOR|ATUAL)/i,
    /^Cooperativa:/i,
    /^Conta:/i,
    /^Extrato/i,
    /SAC \d/i,
    /Ouvidoria/i,
    /Taxa de juros/i,
    /Data\s+Descrição/i,
    /^Associado:/i,
    /IOF (BASICO|ADICIONAL)/i,
    /JUROS/i,
    /TARIFA/i
  ];
  
  return ignorePatterns.some(pattern => pattern.test(line));
}

function parseSimpleBrazilianValue(valueStr: string): number | null {
  // Remove espaços e detecta sinal
  let clean = valueStr.replace(/\s/g, '');
  const isNegative = clean.includes('-') || clean.startsWith('-');
  
  // Remove sinais e símbolos
  clean = clean.replace(/[+-R$]/g, '');
  
  // Converter formato brasileiro para float
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  
  const value = parseFloat(clean);
  if (isNaN(value)) return null;
  
  return isNegative ? -value : value;
}

function cleanSimpleDescription(desc: string): string {
  let clean = desc
    .replace(/\s+/g, ' ')
    .replace(/[+-]?\s*R?\$?\s*[\d.,]+/g, '')
    .replace(/\s+[A-Z0-9]{6,}$/i, '') // Remove códigos
    .trim();
  
  if (clean.length < 8) return '';
  
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function convertBrazilianDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function detectPaymentMethod(line: string): string {
  if (/PIX/i.test(line)) return 'pix';
  if (/TED/i.test(line)) return 'ted';
  if (/COMPRAS NACIONAIS/i.test(line)) return 'debit_card';
  if (/CARTAO|CARD/i.test(line)) return 'credit_card';
  return 'other';
}

function categorizeSimple(description: string, categories: any[]): string {
  const desc = description.toLowerCase();
  
  // Categorização simples por palavras-chave
  if (desc.includes('mercado') || desc.includes('super') || desc.includes('aliment')) {
    return findCategory(categories, 'Alimentação') || 'Outros';
  }
  if (desc.includes('posto') || desc.includes('combustiv')) {
    return findCategory(categories, 'Transporte') || 'Outros';
  }
  if (desc.includes('farmacia') || desc.includes('medic')) {
    return findCategory(categories, 'Saúde') || 'Outros';
  }
  
  return 'Outros';
}

function findCategory(categories: any[], name: string): string | null {
  const found = categories.find(cat => cat.name === name);
  return found ? found.name : null;
}