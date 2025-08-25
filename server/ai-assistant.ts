import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable must be set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FinancialData {
  transactions: any[];
  totalIncome: number;
  totalExpenses: number;
  monthlyBudget?: number;
  categories: { [key: string]: number };
  investments?: any[];
  goals?: any[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class FinancialAssistant {
  async analyzeFinancialQuestion(
    question: string, 
    financialData: FinancialData,
    userId: string
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(financialData);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: question
          }
        ],
        max_completion_tokens: 500,
      });

      return response.choices[0].message.content || "Desculpe, não consegui processar sua pergunta.";
    } catch (error) {
      console.error('Erro ao processar pergunta financeira:', error);
      throw new Error('Erro interno do assistente financeiro');
    }
  }

  private buildSystemPrompt(data: FinancialData): string {
    return `Você é um assistente financeiro pessoal inteligente e amigável do FinanceFlow. 

DADOS FINANCEIROS DO USUÁRIO:
- Receita total: R$ ${data.totalIncome.toFixed(2)}
- Despesas totais: R$ ${data.totalExpenses.toFixed(2)}
- Saldo atual: R$ ${(data.totalIncome - data.totalExpenses).toFixed(2)}
- Número de transações: ${data.transactions.length}

CATEGORIAS DE GASTOS:
${Object.entries(data.categories).map(([cat, value]) => `- ${cat}: R$ ${value.toFixed(2)}`).join('\n')}

INSTRUÇÕES:
1. Responda em português brasileiro de forma clara e amigável
2. Use os dados reais do usuário nas suas análises
3. Dê dicas práticas e acionáveis
4. Se não tiver dados suficientes, seja transparente sobre isso
5. Foque em insights úteis, não apenas repetir números
6. Use emojis moderadamente para deixar a resposta mais amigável
7. Seja conciso mas informativo
8. Se a pergunta for sobre algo que não está nos dados, sugira como o usuário pode melhorar o controle financeiro

EXEMPLOS DE RESPOSTAS ESPERADAS:
- Para "Como estão meus gastos?": Analise as categorias, identifique padrões, dê dicas
- Para "Onde posso economizar?": Identifique categorias com maior gasto e sugira otimizações
- Para "Como está minha saúde financeira?": Analise receita vs despesa, padrões de economia
`;
  }

  async categorizeTransaction(description: string, amount: number): Promise<{
    category: string;
    confidence: number;
    subcategory?: string;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `Você é um especialista em categorização de transações financeiras brasileiras.

CATEGORIAS DISPONÍVEIS:
- Alimentação (restaurantes, delivery, supermercado, lanches)
- Transporte (combustível, uber, transporte público, manutenção)
- Moradia (aluguel, condomínio, energia, água, internet)
- Saúde (médico, farmácia, plano de saúde, academia)
- Lazer (cinema, viagem, jogos, entretenimento)
- Educação (cursos, livros, escola, faculdade)
- Roupas (vestuário, calçados, acessórios)
- Tecnologia (eletrônicos, software, aplicativos)
- Investimentos (aplicações, ações, fundos)
- Transferências (pix, ted, doc)
- Renda (salário, freelance, vendas)
- Outros

Analise a descrição e retorne um JSON com:
{
  "category": "categoria_principal",
  "confidence": 0.95,
  "subcategory": "subcategoria_opcional"
}

Seja preciso e use seu conhecimento sobre o mercado brasileiro.`
          },
          {
            role: "user",
            content: `Descrição: "${description}", Valor: R$ ${amount.toFixed(2)}`
          }
        ],
        max_completion_tokens: 150,
      });

      const content = response.choices[0].message.content || '{}';
      // Extrair JSON do texto se necessário
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
      return {
        category: result.category || 'Outros',
        confidence: result.confidence || 0.5,
        subcategory: result.subcategory
      };
    } catch (error) {
      console.error('Erro na categorização:', error);
      return {
        category: 'Outros',
        confidence: 0.1
      };
    }
  }

  async analyzeSpendingPatterns(transactions: any[]): Promise<{
    insights: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    try {
      const monthlyData = this.groupTransactionsByMonth(transactions);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `Você é um analista financeiro expert. Analise os padrões de gastos e retorne insights em JSON.

Retorne APENAS um JSON válido com:
{
  "insights": ["insight1", "insight2", ...],
  "warnings": ["aviso1", "aviso2", ...], 
  "suggestions": ["sugestao1", "sugestao2", ...]
}

Foque em:
- Padrões temporais (dias da semana, horários)
- Crescimento/redução de categorias
- Gastos anômalos
- Oportunidades de economia
- Tendências preocupantes`
          },
          {
            role: "user",
            content: `Dados mensais: ${JSON.stringify(monthlyData.slice(0, 6))}`
          }
        ],
        max_completion_tokens: 400,
      });

      const content = response.choices[0].message.content || '{"insights":[],"warnings":[],"suggestions":[]}';
      // Extrair JSON do texto se necessário
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : '{"insights":[],"warnings":[],"suggestions":[]}');
    } catch (error) {
      console.error('Erro na análise de padrões:', error);
      return {
        insights: [],
        warnings: [],
        suggestions: []
      };
    }
  }

  private groupTransactionsByMonth(transactions: any[]) {
    const grouped = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0, categories: {} };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
        acc[month].categories[transaction.category] = 
          (acc[month].categories[transaction.category] || 0) + transaction.amount;
      }
      
      return acc;
    }, {});

    return Object.entries(grouped).map(([month, data]) => ({
      month,
      ...(data as any)
    })).sort((a, b) => b.month.localeCompare(a.month));
  }

  calculateFinancialHealthScore(data: FinancialData): {
    score: number;
    factors: { name: string; score: number; weight: number; description: string }[];
    recommendations: string[];
  } {
    const factors = [
      {
        name: 'Equilíbrio Receita/Despesa',
        score: this.calculateIncomeExpenseBalance(data.totalIncome, data.totalExpenses),
        weight: 0.3,
        description: 'Proporção entre o que entra e o que sai'
      },
      {
        name: 'Diversificação de Categorias',
        score: this.calculateCategoryDiversification(data.categories),
        weight: 0.2,
        description: 'Distribuição equilibrada dos gastos'
      },
      {
        name: 'Frequência de Transações',
        score: this.calculateTransactionFrequency(data.transactions),
        weight: 0.2,
        description: 'Controle regular das finanças'
      },
      {
        name: 'Capacidade de Poupança',
        score: this.calculateSavingsCapacity(data.totalIncome, data.totalExpenses),
        weight: 0.3,
        description: 'Potencial para formar reservas'
      }
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    const recommendations = this.generateRecommendations(factors, data);

    return {
      score: Math.round(weightedScore),
      factors,
      recommendations
    };
  }

  private calculateIncomeExpenseBalance(income: number, expenses: number): number {
    if (income === 0) return 0;
    const ratio = expenses / income;
    if (ratio <= 0.7) return 100;
    if (ratio <= 0.8) return 80;
    if (ratio <= 0.9) return 60;
    if (ratio <= 1.0) return 40;
    return 20;
  }

  private calculateCategoryDiversification(categories: { [key: string]: number }): number {
    const values = Object.values(categories);
    if (values.length < 2) return 30;
    
    const total = values.reduce((sum, val) => sum + val, 0);
    const percentages = values.map(val => val / total);
    
    // Calcula índice de diversificação (quanto mais distribuído, melhor)
    const maxCategory = Math.max(...percentages);
    if (maxCategory > 0.6) return 40;
    if (maxCategory > 0.4) return 70;
    return 90;
  }

  private calculateTransactionFrequency(transactions: any[]): number {
    const days = new Set(transactions.map(t => 
      new Date(t.date).toDateString()
    )).size;
    
    const daysInPeriod = 30; // Últimos 30 dias
    const frequency = days / daysInPeriod;
    
    return Math.min(100, frequency * 100);
  }

  private calculateSavingsCapacity(income: number, expenses: number): number {
    if (income === 0) return 0;
    const savingsRate = (income - expenses) / income;
    
    if (savingsRate >= 0.3) return 100;
    if (savingsRate >= 0.2) return 80;
    if (savingsRate >= 0.1) return 60;
    if (savingsRate >= 0) return 40;
    return 20;
  }

  private generateRecommendations(factors: any[], data: FinancialData): string[] {
    const recommendations = [];
    
    const balanceFactor = factors.find(f => f.name === 'Equilíbrio Receita/Despesa');
    if (balanceFactor && balanceFactor.score < 60) {
      recommendations.push('💰 Revise seus gastos principais - suas despesas estão altas em relação à receita');
    }

    const savingsFactor = factors.find(f => f.name === 'Capacidade de Poupança');
    if (savingsFactor && savingsFactor.score < 70) {
      recommendations.push('🎯 Estabeleça uma meta de poupança de pelo menos 10% da sua renda');
    }

    const diversificationFactor = factors.find(f => f.name === 'Diversificação de Categorias');
    if (diversificationFactor && diversificationFactor.score < 60) {
      recommendations.push('📊 Uma categoria está consumindo muito do seu orçamento - analise se é necessário');
    }

    // Análise por categoria
    const topCategory = Object.entries(data.categories)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && topCategory[1] > data.totalExpenses * 0.4) {
      recommendations.push(`🔍 ${topCategory[0]} representa ${((topCategory[1]/data.totalExpenses)*100).toFixed(0)}% dos seus gastos - considere otimizar`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Parabéns! Sua saúde financeira está em bom estado');
    }

    return recommendations;
  }
}

export const financialAssistant = new FinancialAssistant();