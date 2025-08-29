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
    const chunkSize = 4000; // Tamanho reduzido para processamento mais rápido
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
    
    const allTransactions: CategorizedTransaction[] = [];
    
    // Processar cada chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`[DeepSeek] Processando chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
        
        const prompt = this.buildExtractionPrompt(chunks[i]);
        const response = await this.callDeepSeekAPI(prompt);
        const chunkTransactions = this.parseExtractionResponse(response);
        
        if (chunkTransactions.length > 0) {
          allTransactions.push(...chunkTransactions);
          console.log(`[DeepSeek] Chunk ${i + 1}: ${chunkTransactions.length} transações encontradas`);
        }
        
        // Pequena pausa entre chunks para não sobrecarregar a API
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`[DeepSeek] Erro no chunk ${i + 1}:`, error);
        // Continua com próximo chunk
      }
    }
    
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
    return `Extraia transações bancárias brasileiras do texto.

CATEGORIAS: Alimentação, Transporte, Casa, Saúde, Educação, Entretenimento, Vestuário, Serviços, Assinaturas, Investimentos, Outros.

TEXTO:
${extractText}

RESPONDA APENAS JSON:
{"transactions":[{"date":"AAAA-MM-DD","description":"DESC","amount":VALOR,"type":"income/expense","category":"CATEGORIA","confidence":0.9}]}`;
  }

  /**
   * Processa a resposta da extração e retorna transações
   */
  private parseExtractionResponse(response: string): CategorizedTransaction[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const transactions = parsed.transactions || [];

      return transactions.map((t: any) => ({
        date: t.date || new Date().toISOString().split('T')[0],
        description: t.description || 'Transação sem descrição',
        amount: parseFloat(t.amount) || 0,
        type: (t.type || 'expense').toLowerCase(),
        category: t.category || 'Outros',
        confidence: t.confidence || 0.8,
        reasoning: t.reasoning || 'Categorização automática'
      }));

    } catch (error) {
      console.error('[DeepSeek] Erro ao processar resposta de extração:', error);
      return [];
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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout mais agressivo

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