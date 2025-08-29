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

// FILTROS PARA ELIMINAR RUÍDOS (linhas que NÃO são transações)
const NOISE_FILTERS = {
  // Saldos e informações de conta
  BALANCE_INFO: /saldo\s+(anterior|atual|disponível)|extrato|período|conta\s+corrente/i,
  
  // IOFs e taxas
  FEES_AND_TAXES: /iof|tarifa|taxa\s|anuidade|manutenção\s+conta/i,
  
  // Cabeçalhos e divisores
  HEADERS: /data\s+histórico|histórico\s+valor|valor\s+saldo|^\s*[\-=\*]{3,}/,
  
  // Linhas muito curtas ou vazias
  TOO_SHORT: /^\s*[A-Z]{1,3}\s*$/,
  
  // Códigos isolados
  ISOLATED_CODES: /^\s*[0-9A-Z]{3,10}\s*$/,
  
  // Informações de identificação
  INFO_LINES: /agência|conta|titular|cpf|cnpj.*titular/i,
  
  // Totalizadores  
  TOTALS: /total\s+débito|total\s+crédito|saldo\s+final/i,
  
  // Linhas com apenas datas
  ONLY_DATE: /^\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s*$/
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
  console.log(`[BR-EXTRACTOR] 🎯 Iniciando extração ULTRA-INTELIGENTE...`);
  
  const transactions: Transaction[] = [];
  const lines = text.split(/\n|\r\n/).filter(line => line.trim().length > 0);
  let processedCount = 0;
  let validCount = 0;
  
  console.log(`[BR-EXTRACTOR] Analisando ${lines.length} linhas do extrato...`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    processedCount++;
    
    // FILTRO 1: Ruído óbvio (super rápido)
    if (isObviousNoise(line)) {
      continue;
    }
    
    // FILTRO 2: Linha deve parecer uma transação completa
    if (!looksLikeCompleteTransaction(line)) {
      continue;
    }
    
    // FILTRO 3: Ruído específico
    if (isNoiseLine(line)) {
      console.log(`[BR-FILTER] Ignorando ruído específico: "${line.substring(0, 40)}..."`);
      continue;
    }
    
    if (line.length < 25) continue; // Transações reais são mais longas
    
    const transaction = parseTransactionLineStrict(line, availableCategories);
    if (transaction && isValidTransactionStrict(transaction)) {
      transactions.push(transaction);
      validCount++;
      console.log(`[BR-EXTRACTOR] ✅ [${validCount}] ${transaction.description} - R$ ${transaction.amount}`);
      
      // LIMITE DE SEGURANÇA: parar se extrair muitas (indica ruído)
      if (validCount >= 80) {
        console.log(`[BR-EXTRACTOR] ⚠️ LIMITE DE SEGURANÇA: Parando em 80 transações`);
        break;
      }
    }
  }
  
  console.log(`[BR-EXTRACTOR] 📊 Resultado: ${validCount}/${processedCount} transações válidas`);
  
  // VALIDAÇÃO FINAL DE QUALIDADE
  if (transactions.length > 60) {
    console.log(`[BR-EXTRACTOR] ⚠️ MUITAS TRANSAÇÕES (${transactions.length}) - possível ruído`);
    // Filtrar apenas as mais confiáveis
    const highConfidence = transactions.filter(t => t.confidence >= 0.9);
    console.log(`[BR-EXTRACTOR] 🔄 Filtrando para ${highConfidence.length} transações de alta confiança`);
    return highConfidence.slice(0, 40); // Máximo 40
  }
  
  return transactions;
}

// FUNÇÃO NOVA: Detectar ruído óbvio ultra-rápido
function isObviousNoise(line: string): boolean {
  const upper = line.toUpperCase();
  
  // Padrões que claramente NÃO são transações
  if (upper.includes('COOPERATIVA:') || 
      upper.includes('ASSOCIADO:') ||
      upper.includes('CONTA:') ||
      upper.includes('EXTRATO') ||
      upper.includes('DATA DESCRIÇÃO') ||
      upper.includes('VALOR (R$)') ||
      upper.includes('SAC ') ||
      upper.includes('OUVIDORIA') ||
      upper.includes('TAXA DE JUROS') ||
      upper.includes('LIMITE ') ||
      line.length < 20) {
    return true;
  }
  
  return false;
}

// FUNÇÃO NOVA: Verificar se linha parece transação completa  
function looksLikeCompleteTransaction(line: string): boolean {
  // Deve ter valor monetário E contexto bancário OU data
  const hasValue = /[-+]?\s*R?\$?\s*[\d.,]+/.test(line);
  const hasDate = /^\d{2}\/\d{2}\/\d{4}/.test(line);
  const hasBankContext = /PIX|TED|COMPRA|PAGAMENTO|RECEBIMENTO|LIQUID|DEB|CRED/i.test(line);
  
  return hasValue && (hasDate || hasBankContext) && line.length >= 25;
}

// FUNÇÃO NOVA: Parser ultra-rigoroso
function parseTransactionLineStrict(line: string, availableCategories: any[]): Transaction | null {
  // 1. EXTRAIR VALOR MONETÁRIO COM VALIDAÇÃO RIGOROSA
  const amountInfo = extractAmount(line);
  if (!amountInfo || Math.abs(amountInfo.amount) < 2) return null;
  
  // 2. EXTRAIR E VALIDAR DESCRIÇÃO
  const description = cleanDescription(line);
  if (!description || description.length < 8) return null;
  
  // 3. VALIDAR CONTEXTO BANCÁRIO
  if (!hasValidFinancialContext(line)) return null;
  
  // 4. CATEGORIZAR INTELIGENTEMENTE  
  const category = categorizeTransaction(description, availableCategories);
  
  // 5. DETERMINAR MÉTODO DE PAGAMENTO
  const paymentMethod = determinePaymentMethod(line);
  
  // 6. DETECTAR ASSINATURAS
  const isSubscription = detectSubscription(description);
  
  // 7. EXTRAIR DATA (usar hoje se não encontrar)
  const date = extractDate(line) || new Date().toISOString().split('T')[0];
  
  // 8. DETERMINAR TIPO DE TRANSAÇÃO
  const type = determineTransactionType(line, amountInfo.amount);
  
  return {
    date,
    description,
    amount: Math.abs(amountInfo.amount),
    type,
    category,
    paymentMethod,
    confidence: amountInfo.confidence,
    isSubscription
  };
}

function parseTransactionLine(line: string, availableCategories: any[]): Transaction | null {
  // 1. EXTRAIR VALOR MONETÁRIO (função original)
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
  // VALIDAÇÃO PRÉVIA: linha deve ter contexto financeiro válido
  if (!hasValidFinancialContext(line)) {
    return null;
  }
  
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
    
    // REJEITAR valores claramente inválidos
    if (valueStr.length > 10 || /^[0,\.]+$/.test(valueStr)) {
      return null;
    }
    
    // Determinar sinal baseado no contexto
    let isNegative = false;
    if (valueStr.startsWith('-') || line.includes('-R$') || line.includes('DEB')) {
      isNegative = true;
      valueStr = valueStr.replace('-', '');
    } else if (valueStr.startsWith('+') || line.includes('+R$') || line.includes('CRED')) {
      valueStr = valueStr.replace('+', '');
    }
    
    // Converter formato brasileiro (1.234,56) para float
    if (valueStr.includes(',')) {
      valueStr = valueStr.replace(/\./g, '').replace(',', '.');
    }
    
    const value = parseFloat(valueStr);
    
    // VALORES REALISTAS: entre R$ 2,00 e R$ 50.000,00  
    if (!isNaN(value) && value >= 2 && value <= 50000) {
      return {
        amount: isNegative ? -value : value,
        confidence: 0.9
      };
    }
  }
  
  return null;
}

// FUNÇÃO PARA VALIDAR SE A LINHA TEM CONTEXTO FINANCEIRO VÁLIDO
function hasValidFinancialContext(line: string): boolean {
  // DEVE ter pelo menos uma palavra de contexto bancário VÁLIDO
  const bankKeywords = [
    'PIX', 'TED', 'DOC', 'COMPRA', 'PAGAMENTO', 'RECEBIMENTO',
    'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'CARTAO', 'SAQUE', 
    'DEPOSITO', 'NACIONAIS', 'INTERNACIONAL', 'TARIFA', 'LIQUIDACAO'
  ];
  
  const lineUpper = line.toUpperCase();
  
  // PRIMEIRO: deve ter uma palavra-chave bancária
  let hasKeyword = false;
  for (const keyword of bankKeywords) {
    if (lineUpper.includes(keyword)) {
      hasKeyword = true;
      break;
    }
  }
  
  if (!hasKeyword) {
    return false;
  }
  
  // SEGUNDO: não deve ser apenas informativo/cabeçalho
  const invalidContext = [
    'DATA DESCRIÇÃO DOCUMENTO VALOR',
    'SALDO ANTERIOR',
    'SALDO ATUAL',
    'COOPERATIVA:',
    'CONTA:',
    'EXTRATO',
    'PERÍODO',
    'OUVIDORIA',
    'SAC ',
    'TAXA DE'
  ];
  
  for (const invalid of invalidContext) {
    if (lineUpper.includes(invalid)) {
      return false;
    }
  }
  
  return true;
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
  
  // Remover datas do início (formato DD/MM/YYYY)
  clean = clean.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*/, '');
  
  // Remover símbolos estranhos e caracteres problemáticos
  clean = clean.replace(/^[\s\-\—\*\/\#\@\%\$\"\'\`]+/, '');
  clean = clean.replace(/[\s\-\—\*\/\#\@\%\$\"\'\`]+$/, '');
  
  // Remover ":" isolados no final
  clean = clean.replace(/:\s*$/, '');
  
  // Remover caracteres unicode problemáticos
  clean = clean.replace(/[\u201C\u201D\u2018\u2019\u2013\u2014]/g, '');
  
  // REJEITAR descrições muito curtas ou inválidas (MAIS RIGOROSO)
  if (clean.length < 10) {
    return '';
  }
  
  // REJEITAR padrões claramente inválidos (EXPANDIDO)
  const invalidPatterns = [
    /^cooperativa:?\s*$/i,
    /^conta:?\s*$/i,
    /^extrato:?\s*$/i,
    /^período:?\s*$/i,
    /^saldo:?\s*$/i,
    /^total:?\s*$/i,
    /^data\s+descrição/i,
    /^valor\s*\(r\$\)/i,
    /^documento/i,
    /^associado/i,
    /^\/\/\s*$/,
    /^\s*[\-\=\*]{2,}\s*$/,
    /^[\s\*\-]+$/,
    /^\d+\s*$/,
    /^[a-z]{1,2}\s*$/i
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(clean)) {
      return '';
    }
  }
  
  // REJEITAR linhas que são apenas códigos ou números
  if (/^[A-Z0-9\s\-\.]{1,15}$/i.test(clean)) {
    return '';
  }
  
  // Capitalizar primeira letra
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  
  return clean || '';
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

// FUNÇÃO PARA IDENTIFICAR E FILTRAR RUÍDOS
function isNoiseLine(line: string): boolean {
  // Verificar cada filtro de ruído
  for (const [key, pattern] of Object.entries(NOISE_FILTERS)) {
    if (pattern.test(line)) {
      return true;
    }
  }
  
  // Linha muito curta
  if (line.length < 15) return true;
  
  // Linha que não tem valor monetário
  if (!BRAZILIAN_PATTERNS.AMOUNT.test(line)) return true;
  
  // FILTROS MAIS RIGOROSOS PARA EVITAR FRAGMENTOS
  
  // Linha que termina com ":" (fragmento de cabeçalho)
  if (line.trim().endsWith(':')) return true;
  
  // Linha que começa com "//" ou símbolos estranhos
  if (/^[\s\*\/\-\=\#\@\%\$]{2,}/.test(line)) return true;
  
  // Linha que é apenas um nome/palavra seguida de ":"
  if (/^[A-Z][a-zA-Z\s]+:\s*$/.test(line)) return true;
  
  // Linha sem contexto bancário claro
  const bankPatterns = [
    /PIX|TED|DOC|COMPRA|PAGAMENTO|RECEBIMENTO|TRANSFERENCIA|DEBITO|CREDITO/i,
    /CARTAO|SAQUE|DEPOSITO|TARIFA|IOF/i
  ];
  
  let hasBankPattern = false;
  for (const pattern of bankPatterns) {
    if (pattern.test(line)) {
      hasBankPattern = true;
      break;
    }
  }
  
  // Se não tem padrão bancário E é muito curta, provavelmente é ruído
  if (!hasBankPattern && line.length < 25) return true;
  
  return false;
}

// FUNÇÃO PARA VALIDAR SE A TRANSAÇÃO É REALMENTE VÁLIDA
// FUNÇÃO MELHORADA: Validação ultra-rigorosa
function isValidTransactionStrict(transaction: Transaction): boolean {
  // VALOR: deve ser realista
  if (transaction.amount < 2 || transaction.amount > 50000) {
    return false;
  }
  
  // DESCRIÇÃO: deve ser substancial e limpa
  if (!transaction.description || 
      transaction.description.length < 8 ||
      transaction.description.toLowerCase().includes('saldo') ||
      transaction.description.toLowerCase().includes('taxa') ||
      /^[\s\d\-\.]+$/.test(transaction.description)) {
    return false;
  }
  
  return true;
}

// FUNÇÃO ORIGINAL (mantida para compatibilidade)
function isValidTransaction(transaction: Transaction): boolean {
  // Valor mínimo para ser considerado transação real (R$ 2,00 - mais rigoroso)
  const MIN_AMOUNT = 2.00;
  if (Math.abs(transaction.amount) < MIN_AMOUNT) {
    return false;
  }
  
  // Valor máximo realista (R$ 50.000)
  const MAX_AMOUNT = 50000;
  if (Math.abs(transaction.amount) > MAX_AMOUNT) {
    return false;
  }
  
  // Descrição deve ter conteúdo significativo e não ser fragmento
  if (transaction.description.length < 10) {
    return false;
  }
  
  // Não pode ser apenas números
  if (/^\d+$/.test(transaction.description.trim())) {
    return false;
  }
  
  // VALIDAÇÕES MAIS RIGOROSAS PARA EVITAR FRAGMENTOS
  
  // Não pode terminar com ":" (fragmento)
  if (transaction.description.trim().endsWith(':')) {
    return false;
  }
  
  // Não pode começar com símbolos estranhos
  if (/^[\*\/\-\=\#\@\%\$\/]{2,}/.test(transaction.description)) {
    return false;
  }
  
  // Deve ter pelo menos uma palavra completa de contexto bancário
  const bankContextWords = [
    'PIX', 'TED', 'DOC', 'COMPRA', 'PAGAMENTO', 'RECEBIMENTO',
    'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'CARTAO', 'SAQUE',
    'DEPOSITO', 'NACIONAIS', 'INTERNACIONAL'
  ];
  
  let hasBankContext = false;
  for (const word of bankContextWords) {
    if (transaction.description.toUpperCase().includes(word)) {
      hasBankContext = true;
      break;
    }
  }
  
  if (!hasBankContext) {
    return false;
  }
  
  // Filtrar descrições que são claramente ruído
  const noiseDescriptions = [
    /^saldo/i,
    /^total/i,
    /^extrato/i,
    /^período/i,
    /^agência/i,
    /^conta/i,
    /^cooperativa:\s*$/i,
    /^\/\/["\s]*$/,
    /^data\s+descrição/i,
    /^valor\s+saldo/i
  ];
  
  for (const pattern of noiseDescriptions) {
    if (pattern.test(transaction.description)) {
      return false;
    }
  }
  
  return true;
}