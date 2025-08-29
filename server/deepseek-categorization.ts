/**
 * DeepSeek AI Categorization Service
 * Serviço dedicado exclusivamente para categorização inteligente de transações
 */

interface Transaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

interface CategorizedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  confidence: number;
  reasoning?: string;
}

export class DeepSeekCategorizationService {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('DEEPSEEK_API_KEY não configurada - categorização DeepSeek desabilitada');
    }
  }

  /**
   * NOVA FUNÇÃO: Extrai e categoriza transações diretamente do texto do extrato
   * COM PROCESSAMENTO EM CHUNKS para evitar timeout
   */
  async extractAndCategorizeTransactions(extractText: string): Promise<CategorizedTransaction[]> {
    if (!this.apiKey) {
      console.log('[DeepSeek] API key não disponível');
      return [];
    }

    try {
      console.log(`[DeepSeek] Iniciando extração de ${extractText.length} caracteres`);
      
      // Para textos grandes, dividir em chunks
      if (extractText.length > 10000) {
        console.log(`[DeepSeek] Texto grande (${extractText.length}), processando em chunks`);
        return await this.processInChunks(extractText);
      }
      
      // Para textos pequenos, processar direto
      const prompt = this.buildExtractionPrompt(extractText);
      const response = await this.callDeepSeekAPI(prompt);
      
      const transactions = this.parseExtractionResponse(response);
      
      console.log(`[DeepSeek] Extração concluída: ${transactions.length} transações`);
      return transactions;
      
    } catch (error) {
      console.error('[DeepSeek] Erro na extração:', error);
      return [];
    }
  }

  /**
   * Processa texto grande em chunks menores
   */
  private async processInChunks(extractText: string): Promise<CategorizedTransaction[]> {
    const chunkSize = 8000; // Chunks maiores para menos requisições
    const chunks: string[] = [];
    
    // Dividir por linhas para não cortar transações
    const lines = extractText.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
      if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`[DeepSeek] Dividido em ${chunks.length} chunks de ~${chunkSize} caracteres`);
    
    // Processar chunks em paralelo para maior velocidade
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        console.log(`[DeepSeek] Processando chunk ${index + 1}/${chunks.length} (${chunk.length} chars)`);
        
        const prompt = this.buildExtractionPrompt(chunk);
        const response = await this.callDeepSeekAPI(prompt);
        const chunkTransactions = this.parseExtractionResponse(response);
        
        console.log(`[DeepSeek] Chunk ${index + 1}: ${chunkTransactions.length} transações encontradas`);
        return chunkTransactions;
        
      } catch (error) {
        console.error(`[DeepSeek] Erro no chunk ${index + 1}:`, error);
        return [];
      }
    });
    
    // Aguardar todos os chunks processarem em paralelo
    const allChunkResults = await Promise.all(chunkPromises);
    const allTransactions = allChunkResults.flat();
    
    console.log(`[DeepSeek] Processamento em chunks concluído: ${allTransactions.length} transações total`);
    return allTransactions;
  }

  /**
   * Categoriza uma lista de transações usando DeepSeek
   */
  async categorizeTransactions(transactions: Transaction[]): Promise<CategorizedTransaction[]> {
    if (!this.apiKey) {
      console.log('[DeepSeek] API key não disponível, usando categorização padrão');
      return this.fallbackCategorization(transactions);
    }

    try {
      console.log(`[DeepSeek] Iniciando categorização de ${transactions.length} transações`);
      
      const prompt = this.buildCategorizationPrompt(transactions);
      const response = await this.callDeepSeekAPI(prompt);
      
      const categorizedTransactions = this.parseCategorizationResponse(response, transactions);
      
      console.log(`[DeepSeek] Categorização concluída: ${categorizedTransactions.length} transações categorizadas`);
      return categorizedTransactions;
      
    } catch (error) {
      console.error('[DeepSeek] Erro na categorização:', error);
      return this.fallbackCategorization(transactions);
    }
  }

  /**
   * Constrói o prompt OTIMIZADO para extração rápida
   */
  private buildExtractionPrompt(extractText: string): string {
    return `Extraia transações de extrato bancário. Ignore saldos/cabeçalhos.

RECEITA: PIX/TED recebido, depósitos, salários
DESPESA: PIX enviado, compras, saques, tarifas

CATEGORIAS: Alimentação, Transporte, Casa, Saúde, Outros

TEXTO:
${extractText}

JSON:
{"transactions":[{"date":"AAAA-MM-DD","description":"DESC","amount":VALOR,"type":"income/expense","category":"CATEGORIA","confidence":0.9}]}`;
  }

  /**
   * Processa a resposta da extração e retorna transações - COM PARSING ROBUSTO
   */
  private parseExtractionResponse(response: string): CategorizedTransaction[] {
    try {
      console.log(`[DeepSeek] Processando resposta: ${response.length} caracteres`);
      
      // Tentar múltiplas estratégias de parsing
      let parsed;
      
      // Estratégia 1: JSON limpo
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log(`[DeepSeek] JSON parsing falhou, tentando limpeza...`);
          
          // Estratégia 2: Limpar JSON malformado
          let cleanedJson = jsonMatch[0]
            .replace(/,\s*}/g, '}')  // Remove vírgulas extras antes de }
            .replace(/,\s*]/g, ']')  // Remove vírgulas extras antes de ]
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Adiciona aspas em chaves
          
          try {
            parsed = JSON.parse(cleanedJson);
          } catch (e2) {
            console.log(`[DeepSeek] Limpeza falhou, extraindo transações com regex...`);
            return this.extractWithRegex(response);
          }
        }
      } else {
        console.log(`[DeepSeek] Nenhum JSON encontrado, usando regex...`);
        return this.extractWithRegex(response);
      }

      const transactions = parsed.transactions || [];
      console.log(`[DeepSeek] ${transactions.length} transações encontradas no JSON`);

      const validTransactions = transactions
        .map((t: any) => ({
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || 'Transação sem descrição',
          amount: parseFloat(t.amount) || 0,
          type: (t.type || 'expense').toLowerCase(),
          category: t.category || 'Outros',
          confidence: t.confidence || 0.8,
          reasoning: t.reasoning || 'Categorização automática'
        }))
        .filter(this.isValidTransaction);

      console.log(`[DeepSeek] ${validTransactions.length}/${transactions.length} transações válidas após filtros`);
      return validTransactions;

    } catch (error) {
      console.error('[DeepSeek] Erro ao processar resposta:', error);
      return this.extractWithRegex(response);
    }
  }

  /**
   * Valida se uma transação é válida e não é ruído
   */
  private isValidTransaction(transaction: CategorizedTransaction): boolean {
    // Verificar se o valor é válido (maior que R$ 0,01)
    if (!transaction.amount || transaction.amount < 0.01) {
      return false;
    }

    // Verificar se a descrição não é muito genérica ou vazia
    const description = transaction.description.toLowerCase().trim();
    const invalidDescriptions = [
      'transação sem descrição',
      'sem descrição',
      'desc',
      'saldo',
      'saldo anterior',
      'saldo atual',
      'extrato',
      'conta corrente',
      'agência',
      'banco',
      'cpf',
      'cnpj',
      'página',
      'período',
      'total',
      'limite'
    ];

    if (description.length < 3 || invalidDescriptions.some(inv => description.includes(inv))) {
      return false;
    }

    // Verificar se a data é válida (últimos 2 anos)
    const transactionDate = new Date(transaction.date);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isNaN(transactionDate.getTime()) || 
        transactionDate < twoYearsAgo || 
        transactionDate > tomorrow) {
      return false;
    }

    // Verificar se o tipo é válido
    if (!['income', 'expense'].includes(transaction.type)) {
      return false;
    }

    return true;
  }

  /**
   * Extração via regex como fallback
   */
  private extractWithRegex(text: string): CategorizedTransaction[] {
    console.log(`[DeepSeek] Usando extração regex como fallback...`);
    
    const transactions: CategorizedTransaction[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Padrões básicos de transação bancária
      const patterns = [
        /(\d{2}\/\d{2}\/\d{4}).*?([A-Z\s]+).*?R?\$?\s*([\d,.-]+)/i,
        /(\d{4}-\d{2}-\d{2}).*?(PIX|TED|DOC|DÉBITO|CRÉDITO).*?([\d,.-]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const amount = parseFloat(match[3].replace(/[^\d,-]/g, '').replace(',', '.'));
          if (!isNaN(amount) && amount !== 0) {
            transactions.push({
              date: this.normalizeDate(match[1]),
              description: match[2].trim(),
              amount: amount,
              type: amount > 0 ? 'income' : 'expense',
              category: 'Outros',
              confidence: 0.6,
              reasoning: 'Extração via regex'
            });
          }
          break;
        }
      }
    }
    
    const validTransactions = transactions.filter(this.isValidTransaction);
    console.log(`[DeepSeek] Regex extraiu ${validTransactions.length}/${transactions.length} transações válidas`);
    return validTransactions;
  }

  /**
   * Normaliza formato de data
   */
  private normalizeDate(dateStr: string): string {
    try {
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateStr;
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Constrói o prompt específico para categorização
   */
  private buildCategorizationPrompt(transactions: Transaction[]): string {
    const transactionsList = transactions.map((t, index) => 
      `${index + 1}. "${t.description}" - R$ ${t.amount} (${t.type}) - ${t.date}`
    ).join('\n');

    return `Você é um especialista em categorização de transações bancárias brasileiras.

REGRAS DE CATEGORIZAÇÃO:
- Alimentação: supermercados, restaurantes, delivery, padarias
- Transporte: combustível, Uber, 99, pedágios, estacionamento
- Casa: aluguel, condomínio, energia, água, internet, móveis
- Saúde: farmácias, hospitais, consultas, planos de saúde
- Educação: escolas, cursos, livros, material escolar
- Entretenimento: cinema, streaming, jogos, viagens
- Vestuário: roupas, calçados, acessórios
- Serviços: salão, barbeiro, consertos, limpeza
- Assinaturas: Netflix, Spotify, software, academias
- Investimentos: aplicações, ações, fundos
- Outros: transações que não se encaixam nas categorias acima

INSTRUÇÕES:
1. Analise cada transação considerando a descrição e valor
2. Identifique estabelecimentos conhecidos (ex: MAGAZINELUIZA → Outros/Eletrônicos)
3. Para PIX, tente inferir pela descrição ou valor
4. Retorne APENAS JSON válido no formato especificado

TRANSAÇÕES PARA CATEGORIZAR:
${transactionsList}

RESPONDA APENAS COM JSON:
{
  "transactions": [
    {
      "id": 1,
      "category": "categoria_escolhida",
      "confidence": 0.95,
      "reasoning": "motivo_da_categorizacao"
    }
  ]
}`;
  }

  /**
   * Chama a API do DeepSeek
   */
  private async callDeepSeekAPI(prompt: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout mais rápido - 8s

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000, // Reduzido para respostas mais rápidas
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Processa a resposta da IA e aplica às transações
   */
  private parseCategorizationResponse(response: string, originalTransactions: Transaction[]): CategorizedTransaction[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const categorizations = parsed.transactions || [];

      return originalTransactions.map((transaction, index) => {
        const categorization = categorizations.find((c: any) => c.id === index + 1);
        
        return {
          ...transaction,
          category: categorization?.category || 'Outros',
          confidence: categorization?.confidence || 0.5,
          reasoning: categorization?.reasoning,
        };
      });

    } catch (error) {
      console.error('[DeepSeek] Erro ao processar resposta:', error);
      return this.fallbackCategorization(originalTransactions);
    }
  }

  /**
   * Categorização de fallback usando regras simples
   */
  private fallbackCategorization(transactions: Transaction[]): CategorizedTransaction[] {
    return transactions.map(transaction => ({
      ...transaction,
      category: this.getSimpleCategory(transaction.description),
      confidence: 0.7,
      reasoning: 'Categorização automática por palavras-chave',
    }));
  }

  /**
   * Categorização simples baseada em palavras-chave
   */
  private getSimpleCategory(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('superm') || desc.includes('mercado') || desc.includes('carrefour') || desc.includes('extra')) {
      return 'Alimentação';
    }
    if (desc.includes('posto') || desc.includes('combustivel') || desc.includes('shell') || desc.includes('ipiranga')) {
      return 'Transporte';
    }
    if (desc.includes('farmacia') || desc.includes('droga') || desc.includes('pague menos')) {
      return 'Saúde';
    }
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('disney') || desc.includes('amazon prime')) {
      return 'Assinaturas';
    }
    if (desc.includes('magazine') || desc.includes('americanas') || desc.includes('mercado livre')) {
      return 'Outros';
    }
    
    return 'Outros';
  }

  /**
   * Verifica se o serviço está disponível
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const deepSeekCategorization = new DeepSeekCategorizationService();