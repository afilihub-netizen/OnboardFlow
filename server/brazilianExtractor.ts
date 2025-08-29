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
    
    if (line.length < 20) continue; // REDUZIDO: aceitar linhas menores
    
    const transaction = parseTransactionLineStrict(line, availableCategories);
    if (transaction && isValidTransactionStrict(transaction)) {
      transactions.push(transaction);
      validCount++;
      console.log(`[BR-EXTRACTOR] ✅ [${validCount}] ${transaction.description} - R$ ${transaction.amount}`);
      
      // LIMITE DE SEGURANÇA AUMENTADO: parar apenas se for realmente excessivo
      if (validCount >= 200) {
        console.log(`[BR-EXTRACTOR] ⚠️ LIMITE DE SEGURANÇA: Parando em 200 transações`);
        break;
      }
    }
  }
  
  console.log(`[BR-EXTRACTOR] 📊 Resultado: ${validCount}/${processedCount} transações válidas`);
  
  // VALIDAÇÃO FINAL DE QUALIDADE REMOVIDA - permitir todas as transações válidas
  if (transactions.length > 200) {
    console.log(`[BR-EXTRACTOR] ⚠️ MUITAS TRANSAÇÕES (${transactions.length}) - possível ruído massivo`);
    // Filtrar apenas as mais confiáveis se for realmente excessivo
    const highConfidence = transactions.filter(t => t.confidence >= 0.95);
    console.log(`[BR-EXTRACTOR] 🔄 Filtrando para ${highConfidence.length} transações de altíssima confiança`);
    return highConfidence.slice(0, 150); // Máximo mais alto
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
  // FILTRO MAIS FLEXÍVEL: Deve ter valor monetário E algum contexto
  const hasValue = /[-+]?\s*R?\$?\s*[\d.,]+/.test(line);
  const hasDate = /^\d{2}\/\d{2}\/\d{4}/.test(line);
  const hasBankContext = /PIX|TED|COMPRA|PAGAMENTO|RECEBIMENTO|LIQUID|DEB|CRED|NACIONAIS|POSTO|MERCADO|SUPER/i.test(line);
  
  return hasValue && (hasDate || hasBankContext) && line.length >= 18; // REDUZIDO
}

// FUNÇÃO NOVA: Parser ultra-rigoroso com HOTFIX aplicado
function parseTransactionLineStrict(line: string, availableCategories: any[]): Transaction | null {
  // 1. EXTRAIR VALOR COM PARSER BR CORRETO
  const amountInfo = extractAmount(line);
  if (!amountInfo || Math.abs(amountInfo.amount) < 2) return null;
  
  // 2. EXTRAIR E LIMPAR DESCRIÇÃO com cleanMerchant
  const rawDescription = cleanDescription(line);
  if (!rawDescription || rawDescription.length < 8) return null;
  
  const cleanedDescription = cleanMerchant(rawDescription);
  
  // 3. DETERMINAR NATUREZA POR REGRAS (PIX CRED/DEB)
  const type = resolveNatureza(line, amountInfo.amount);
  
  // 4. DETECTAR TRANSFERÊNCIA INTERNA (marcar como neutra)
  const isTransferenciaInterna = detectTransferenciaInterna(line);
  if (isTransferenciaInterna) {
    return {
      date: extractDate(line) || new Date().toISOString().split('T')[0],
      description: cleanedDescription,
      amount: amountInfo.amount, // USAR VALOR COM SINAL do parser corrigido
      type: 'expense', // Manter como expense mas pode ser marcado diferente
      category: 'Transferência Interna',
      paymentMethod: determinePaymentMethod(line),
      confidence: amountInfo.confidence,
      isSubscription: false
    };
  }
  
  // 5. CATEGORIZAR COM REGRAS DETERMINÍSTICAS
  const category = categorizeBR(cleanedDescription);
  
  // 6. DETERMINAR MÉTODO DE PAGAMENTO
  const paymentMethod = determinePaymentMethod(line);
  
  // 7. DETECTAR ASSINATURAS
  const isSubscription = detectSubscription(cleanedDescription);
  
  // 8. EXTRAIR DATA (usar hoje se não encontrar)
  const date = extractDate(line) || new Date().toISOString().split('T')[0];
  
  return {
    date,
    description: cleanedDescription,
    amount: amountInfo.amount, // USAR VALOR COM SINAL do parser corrigido
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

// 1️⃣ PARSER BR PARA VALORES (HOTFIX)
export function parseAmountBR(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const s = raw.replace(/\s/g, '').replace(/R\$/i, '');
  const neg = /^-/.test(s) || /^\(.*\)$/.test(s);
  const num = s.replace(/[()+-]/g, '').replace(/\./g, '').replace(',', '.');
  return (neg ? -1 : 1) * (parseFloat(num || '0'));
}

// 2️⃣ NATUREZA COM PRECEDÊNCIA DE PALAVRAS-CHAVE (HOTFIX)
export function resolveNatureza(desc: string, amount: number): 'income' | 'expense' {
  const u = desc.toUpperCase();
  if (/(RECEBIMENTO\s+PIX|PIX\s+CRED|CR[ÉE]D(ITO)?\b)/.test(u)) return 'income';
  if (/(PAGAMENTO\s+PIX|PIX\s+DEB|DEB(ITO)?\b|COMPRA|BOLETO|TARIFA)/.test(u)) return 'expense';
  return amount >= 0 ? 'income' : 'expense';
}

// 3️⃣ LIMPEZA DE MERCHANT (REMOVE CÓDIGOS DO BANCO) (HOTFIX)
export function cleanMerchant(desc: string): string {
  return desc
    .replace(/\b(PAGAMENTO|RECEBIMENTO)\s+PIX\s+\d+/gi,' ')
    .replace(/\bPIX\s+(DEB|CRED)\b/gi,' ')
    .replace(/\bCOMPRAS?\s+NACIONAIS?\b/gi,' ')
    .replace(/\b(DBR|VEO\w*|AUT\s*\d+|CX\d+)\b/gi,' ')
    .replace(/\bSAO\s+JOAQUIM\b/gi,' ')
    .replace(/\b(DEB(ITO)?|CRED(ITO)?)\b/gi,' ')
    .replace(/[—–-]/g,' ')
    .replace(/\s{2,}/g,' ')
    .trim();
}

// 4️⃣ CATEGORIZAÇÃO DETERMINÍSTICA (HOTFIX)
const BRAZILIAN_RULES: Array<{re:RegExp; cat:string}> = [
  { re: /(POSTO|IPIRANGA|SHELL|RAIZEN|ALE\b|COMBUSTIVEL|GAS)/i, cat: 'Transporte' },
  { re: /(MERCADO|SUPERMERC|ATACAD|ASSAI|TONIN|COMPER|BIG|WALMART)/i, cat: 'Alimentação' },
  { re: /(VIVO|CLARO|TIM|OI|ALGAR|TELEFONE|CELULAR)/i, cat: 'Comunicação' },
  { re: /(UBER|99APP|99POP|TAXI|TRANSPORTE)/i, cat: 'Transporte' },
  { re: /(PAGAR\.ME|CIELO|STONE|PAYPAL|MERCADO\s*PAGO|BLUE\s*PAY)/i, cat: 'Serviços Financeiros' },
  { re: /(LANCH|RESTAUR|PIZZA|BURGER|SUBWAY|MC ?DONALD|BK\b|IFOOD|UBER\s*EATS)/i, cat: 'Alimentação' },
  { re: /(DROGARIA|FARMACIA|LABORATORIO|CLINICA|HOSPITAL)/i, cat: 'Saúde' },
  { re: /(NETFLIX|SPOTIFY|AMAZON|MICROSOFT|GOOGLE|APPLE|GLOBO)/i, cat: 'Entretenimento' }
];

export function categorizeBR(merchantNorm: string, dictHit?: {categoria?:string}): string {
  if (dictHit?.categoria) return dictHit.categoria;
  for (const r of BRAZILIAN_RULES) if (r.re.test(merchantNorm)) return r.cat;
  return 'Outros';
}

// 5️⃣ DETECTAR TRANSFERÊNCIAS INTERNAS (HOTFIX)
export function detectTransferenciaInterna(desc: string, nomeTitular: string = 'Maickon Douglas'): boolean {
  const u = desc.toUpperCase();
  return /\bPIX\b/.test(u) && new RegExp(nomeTitular.replace(/\s+/g,'\\s+'), 'i').test(desc);
}

function extractAmount(line: string): { amount: number; confidence: number } | null {
  // CORREÇÃO CRÍTICA: Priorizar valores de transação sobre saldos
  console.log(`[PARSER] Analisando linha: "${line}"`);
  
  const foundValues = [];
  
  // PADRÃO 1: Valores com sinal explícito (MAIOR PRIORIDADE - são valores de transação)
  const signedPatterns = [
    /[-+]\s*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/g, // -R$ 1.234,56 ou +1.234,56
    /[-+]\s*R?\$?\s*(\d{1,6},\d{2})/g, // -123,45 ou +123,45
  ];
  
  for (const pattern of signedPatterns) {
    const matches = [...line.matchAll(pattern)];
    for (const match of matches) {
      const fullMatch = match[0];
      const valueStr = match[1];
      const amount = parseAmountBR(fullMatch); // Inclui o sinal
      
      if (!isNaN(amount) && Math.abs(amount) >= 0.01 && Math.abs(amount) <= 50000) {
        foundValues.push({
          amount,
          confidence: 0.95, // ALTA confiança - tem sinal explícito
          context: fullMatch,
          type: 'signed_transaction'
        });
        console.log(`[PARSER] 🎯 VALOR COM SINAL: ${fullMatch} → ${amount}`);
      }
    }
  }
  
  // PADRÃO 2: Contexto PIX/TED com valores (SEGUNDA PRIORIDADE)
  const contextPatterns = [
    /(?:PIX_(?:DEB|CRED)|TED|DOC)\s+([-+]?\s*)([\d]{1,3}(?:\.\d{3})*,\d{2})/g, // PIX_DEB 1.234,56
    /(?:PIX_(?:DEB|CRED)|TED|DOC)\s+([-+]?\s*)(\d{1,6},\d{2})/g, // PIX_CRED 123,45
  ];
  
  for (const pattern of contextPatterns) {
    const matches = [...line.matchAll(pattern)];
    for (const match of matches) {
      const sign = match[1].trim();
      const valueStr = match[2];
      let amount = parseAmountBR(valueStr);
      
      // Determinar sinal baseado no contexto
      if (match[0].includes('PIX_DEB') || match[0].includes('TED') || sign === '-') {
        amount = -Math.abs(amount);
      } else if (match[0].includes('PIX_CRED') || sign === '+') {
        amount = Math.abs(amount);
      }
      
      if (!isNaN(amount) && Math.abs(amount) >= 0.01 && Math.abs(amount) <= 50000) {
        foundValues.push({
          amount,
          confidence: 0.90, // ALTA confiança - contexto bancário
          context: match[0],
          type: 'contextual_transaction'
        });
        console.log(`[PARSER] 🏦 CONTEXTO BANCÁRIO: ${match[0]} → ${amount}`);
      }
    }
  }
  
  // PADRÃO 3: Múltiplos valores - priorizar o PRIMEIRO (geralmente transação)
  if (foundValues.length === 0) {
    const allValuePatterns = [
      /\b([\d]{1,3}(?:\.\d{3})*,\d{2})\b/g, // 1.234,56
      /\b(\d{1,6},\d{2})\b/g, // 123,45
    ];
    
    const allValuesInLine = [];
    for (const pattern of allValuePatterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        const amount = parseAmountBR(match[1]);
        
        // IGNORAR anos e códigos
        if (amount >= 2020 && amount <= 2030) continue;
        if (amount >= 100000) continue;
        if (Math.abs(amount) < 2) continue; // Muito pequeno
        
        allValuesInLine.push({
          amount,
          position: match.index,
          value: match[1]
        });
      }
    }
    
    // Se tem múltiplos valores, o PRIMEIRO é geralmente a transação, o ÚLTIMO é o saldo
    if (allValuesInLine.length >= 2) {
      const firstValue = allValuesInLine[0];
      const lastValue = allValuesInLine[allValuesInLine.length - 1];
      
      // Determinar sinal baseado no contexto da descrição
      let amount = firstValue.amount;
      if (line.toLowerCase().includes('pagamento') || line.toLowerCase().includes('compra') || 
          line.toLowerCase().includes('débito') || line.toLowerCase().includes('pix_deb')) {
        amount = -Math.abs(amount);
      } else if (line.toLowerCase().includes('recebimento') || line.toLowerCase().includes('crédito') || 
                 line.toLowerCase().includes('pix_cred')) {
        amount = Math.abs(amount);
      }
      
      foundValues.push({
        amount,
        confidence: 0.75, // Confiança média - inferido
        context: `Primeiro valor: ${firstValue.value} (saldo ignorado: ${lastValue.value})`,
        type: 'positional_transaction'
      });
      console.log(`[PARSER] 📍 VALOR POSICIONAL: ${firstValue.value} → ${amount} (ignorando saldo ${lastValue.value})`);
    }
  }
  
  if (foundValues.length === 0) {
    console.log(`[PARSER] ❌ NENHUM VALOR ENCONTRADO na linha`);
    return null;
  }
  
  // Retornar o valor com maior confiança
  foundValues.sort((a, b) => b.confidence - a.confidence);
  const best = foundValues[0];
  
  console.log(`[PARSER] ✅ MELHOR VALOR: ${best.amount} (conf: ${best.confidence}, tipo: ${best.type})`);
  return {
    amount: best.amount,
    confidence: best.confidence
  };
}

function extractAmountOld(line: string): { amount: number; confidence: number } | null {
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
  // VALOR: mais flexível
  if (Math.abs(transaction.amount) < 1 || Math.abs(transaction.amount) > 100000) {
    return false;
  }
  
  // DESCRIÇÃO: mais flexível
  if (!transaction.description || 
      transaction.description.length < 5 || // REDUZIDO
      transaction.description.toLowerCase().includes('saldo') ||
      transaction.description.toLowerCase().includes('taxa de juros') ||
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