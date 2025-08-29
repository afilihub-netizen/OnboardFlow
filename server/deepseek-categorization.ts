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
   */
  async extractAndCategorizeTransactions(extractText: string): Promise<CategorizedTransaction[]> {
    if (!this.apiKey) {
      console.log('[DeepSeek] API key não disponível');
      return [];
    }

    try {
      console.log(`[DeepSeek] Iniciando extração de ${extractText.length} caracteres`);
      
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
   * Constrói o prompt para extração completa do extrato bancário
   */
  private buildExtractionPrompt(extractText: string): string {
    return `Você é um especialista em análise de extratos bancários brasileiros.

TAREFA: Extraia TODAS as transações do extrato e categorize-as automaticamente.

REGRAS DE EXTRAÇÃO:
- Procure por padrões como: PIX, TED, DOC, débito, crédito, transferência, pagamento, compra, saque
- Identifique datas (DD/MM/AAAA, DD-MM-AAAA, AAAA-MM-DD)
- Extraia valores (positivos para receitas, negativos para despesas)
- Capture descrições completas das transações

CATEGORIAS DISPONÍVEIS:
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

EXTRATO BANCÁRIO:
${extractText}

RESPONDA APENAS COM JSON VÁLIDO:
{
  "transactions": [
    {
      "date": "2025-01-15",
      "description": "PAGAMENTO PIX SUPERMERCADO XYZ",
      "amount": -150.00,
      "type": "expense",
      "category": "Alimentação",
      "confidence": 0.95
    }
  ]
}`;
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
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout para extração

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
          temperature: 0.1, // Baixa temperatura para respostas consistentes
          max_tokens: 4000,
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