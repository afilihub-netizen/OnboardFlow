// EXTRATOR DETERMINÍSTICO PARA EXTRATOS BRASILEIROS
// Sistema inteligente baseado em padrões específicos do sistema bancário brasileiro

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  confidence: number;
  isSubscription?: boolean;
}

// PADRÕES ESPECÍFICOS DO SISTEMA BANCÁRIO BRASILEIRO
const BRAZILIAN_PATTERNS = {
  // Padrões de valores monetários
  AMOUNT: /(?:R\$\s*)?([+-]?\s*[\d.,]+)/i,
  AMOUNT_WITH_SIGN: /([+-])\s*R?\$?\s*([\d.,]+)/i,
  
  // Padrões específicos por tipo de transação
  PIX_DEBIT: /(?:PAGAMENTO\s+)?PIX.*?(?:DEB|DÉBITO)/i,
  PIX_CREDIT: /(?:RECEBIMENTO\s+)?PIX.*?(?:CRED|CRÉDITO)/i,
  
  COMPRAS_NACIONAIS: /COMPRAS\s+NACIONAIS/i,
  TED_CREDIT: /TED.*(?:CRED|CRÉDITO)/i,
  TED_DEBIT: /TED.*(?:DEB|DÉBITO)/i,
  
  // Padrões de data brasileira
  DATE_BR: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
  DATE_ISO: /(\d{4})-(\d{2})-(\d{2})/,
  
  // CNPJ pattern
  CNPJ: /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14})/,
  
  // Assinaturas/serviços recorrentes
  SUBSCRIPTIONS: /(NETFLIX|SPOTIFY|AMAZON|MICROSOFT|GOOGLE|APPLE|GLOBO|TELEFONE|CLARO|VIVO|TIM|OI)/i
};

// CATEGORIZAÇÃO INTELIGENTE POR PADRÕES
const SMART_CATEGORIZATION = {
  'Alimentação': [
    /SUPERMERCADO|MERCADO|AÇOUGUE|PADARIA|RESTAURANTE|LANCHONETE|PIZZARIA|SUSHI|BAR\s|FOOD|IFOOD|UBER\s*EATS/i,
    /LUIZ\s+TONIN|KOMAKALI|RETA\s+ALIMENTOS/i
  ],
  'Transporte': [
    /POSTO|COMBUSTIVEL|GAS|UBER|99|TAXI|ONIBUS|METRO|PEDAGIO|ESTACIONAMENTO/i,
    /AUTO\s+POSTO|CONTIN/i
  ],
  'Casa': [
    /UTILIDADES|CASA\s|HOME|LOJA\s|MATERIAL\s+CONSTRUÇÃO|ELETRO|MOVEIS/i,
    /LARUANA\s+UTILIDADES/i
  ],
  'Saúde': [
    /FARMACIA|DROGARIA|HOSPITAL|CLINICA|MEDICO|DENTISTA|LABORATORIO/i
  ],
  'Educação': [
    /ESCOLA|FACULDADE|CURSO|UNIVERSIDADE|COLEGIO/i
  ],
  'Lazer': [
    /CINEMA|TEATRO|SHOPPING|DIVERSAO|JOGO|STREAMING/i
  ],
  'Trabalho': [
    /SALARIO|PRESTACAO|SERVICO|FREELANCE|HONORARIOS/i,
    /THE\s+ONE\s+PRESTACAO|TOSCANA\s+TELEMARKETING/i
  ]
};

export function extractTransactionsBrazilian(text: string, availableCategories: any[] = []): Transaction[] {
  console.log(`[BR-EXTRACTOR] Iniciando extração determinística...`);
  
  const transactions: Transaction[] = [];
  const lines = text.split(/\n|\r\n/).filter(line => line.trim().length > 0);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length < 10) continue; // Muito curto para ser transação
    
    const transaction = parseTransactionLine(line, availableCategories);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  console.log(`[BR-EXTRACTOR] Extraiu ${transactions.length} transações`);
  return transactions;
}

function parseTransactionLine(line: string, availableCategories: any[]): Transaction | null {
  // 1. EXTRAIR VALOR MONETÁRIO
  const amountInfo = extractAmount(line);
  if (!amountInfo) return null;
  
  // 2. DETERMINAR TIPO DA TRANSAÇÃO
  const type = determineTransactionType(line, amountInfo.amount);
  
  // 3. EXTRAIR E LIMPAR DESCRIÇÃO
  const description = cleanDescription(line);
  
  // 4. CATEGORIZAR INTELIGENTEMENTE  
  const category = categorizeTransaction(description, availableCategories);
  
  // 5. DETERMINAR MÉTODO DE PAGAMENTO
  const paymentMethod = determinePaymentMethod(line);
  
  // 6. DETECTAR ASSINATURAS
  const isSubscription = detectSubscription(description);
  
  // 7. EXTRAIR DATA (usar hoje se não encontrar)
  const date = extractDate(line) || new Date().toISOString().split('T')[0];
  
  return {
    date,
    description: description,
    amount: amountInfo.amount,
    type,
    category,
    paymentMethod,
    confidence: amountInfo.confidence,
    isSubscription
  };
}

function extractAmount(line: string): { amount: number; confidence: number } | null {
  // Tentar padrão com sinal explícito primeiro
  const signMatch = line.match(BRAZILIAN_PATTERNS.AMOUNT_WITH_SIGN);
  if (signMatch) {
    const sign = signMatch[1];
    const valueStr = signMatch[2].replace(/\./g, '').replace(',', '.');
    const value = parseFloat(valueStr);
    
    if (!isNaN(value) && value > 0) {
      return {
        amount: sign === '-' ? -value : value,
        confidence: 0.95
      };
    }
  }
  
  // Tentar padrão geral
  const amountMatch = line.match(BRAZILIAN_PATTERNS.AMOUNT);
  if (amountMatch) {
    let valueStr = amountMatch[1].replace(/\s/g, '');
    
    // Determinar sinal baseado no contexto
    let isNegative = false;
    if (valueStr.startsWith('-') || line.includes('-R$')) {
      isNegative = true;
      valueStr = valueStr.replace('-', '');
    } else if (valueStr.startsWith('+') || line.includes('+R$')) {
      valueStr = valueStr.replace('+', '');
    }
    
    // Converter formato brasileiro (1.234,56) para float
    if (valueStr.includes(',')) {
      valueStr = valueStr.replace(/\./g, '').replace(',', '.');
    }
    
    const value = parseFloat(valueStr);
    if (!isNaN(value) && value > 0) {
      return {
        amount: isNegative ? -value : value,
        confidence: 0.9
      };
    }
  }
  
  return null;
}

function determineTransactionType(line: string, amount: number): 'income' | 'expense' {
  // Se tem sinal explícito, usar ele
  if (amount < 0) return 'expense';
  if (amount > 0) return 'income';
  
  // Padrões que indicam débito/despesa
  if (BRAZILIAN_PATTERNS.PIX_DEBIT.test(line) ||
      BRAZILIAN_PATTERNS.COMPRAS_NACIONAIS.test(line) ||
      line.includes('PAGAMENTO') ||
      line.includes('COMPRA') ||
      line.includes('DEB')) {
    return 'expense';
  }
  
  // Padrões que indicam crédito/receita
  if (BRAZILIAN_PATTERNS.PIX_CREDIT.test(line) ||
      BRAZILIAN_PATTERNS.TED_CREDIT.test(line) ||
      line.includes('RECEBIMENTO') ||
      line.includes('CRED')) {
    return 'income';
  }
  
  // Fallback: se não conseguir determinar, assumir baseado no valor
  return amount >= 0 ? 'income' : 'expense';
}

function cleanDescription(line: string): string {
  // Remover valores monetários da descrição
  let clean = line
    .replace(/[+-]?\s*R?\$?\s*[\d.,]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remover códigos e números longos do final
  clean = clean.replace(/\s+[A-Z0-9]{6,}$/i, '');
  
  // Capitalizar primeira letra
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  
  return clean || 'Transação';
}

function categorizeTransaction(description: string, availableCategories: any[]): string {
  // Tentar categorização inteligente primeiro
  for (const [category, patterns] of Object.entries(SMART_CATEGORIZATION)) {
    for (const pattern of patterns) {
      if (pattern.test(description)) {
        return category;
      }
    }
  }
  
  // Usar primeira categoria disponível como fallback
  return availableCategories[0]?.name || 'Outros';
}

function determinePaymentMethod(line: string): string {
  if (BRAZILIAN_PATTERNS.PIX_DEBIT.test(line) || BRAZILIAN_PATTERNS.PIX_CREDIT.test(line)) {
    return 'pix';
  }
  if (line.includes('TED')) {
    return 'ted';
  }
  if (BRAZILIAN_PATTERNS.COMPRAS_NACIONAIS.test(line)) {
    return 'debit_card';
  }
  if (line.includes('CARTAO') || line.includes('CARD')) {
    return 'credit_card';
  }
  
  return 'other';
}

function detectSubscription(description: string): boolean {
  return BRAZILIAN_PATTERNS.SUBSCRIPTIONS.test(description);
}

function extractDate(line: string): string | null {
  // Tentar formato brasileiro DD/MM/YYYY
  const brDate = line.match(BRAZILIAN_PATTERNS.DATE_BR);
  if (brDate) {
    const day = brDate[1].padStart(2, '0');
    const month = brDate[2].padStart(2, '0');
    let year = brDate[3];
    
    if (year.length === 2) {
      year = '20' + year; // Assumir século 21
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // Tentar formato ISO
  const isoDate = line.match(BRAZILIAN_PATTERNS.DATE_ISO);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  }
  
  return null;
}