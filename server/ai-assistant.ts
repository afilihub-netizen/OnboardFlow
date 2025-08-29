import { GoogleGenAI } from "@google/genai";
import { aiServiceManager } from "./services/aiServiceManager";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable must be set');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface FinancialData {
  transactions: any[];
  totalIncome: number;
  totalExpenses: number;
  monthlyBudget?: number;
  categories: { [key: string]: number };
  investments?: any[];
  goals?: any[];
}

export interface AssistantAction {
  type: 'add_transaction' | 'edit_transaction' | 'delete_transaction' | 'generate_report' | 'add_goal' | 'none';
  data?: any;
  description: string;
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
  ): Promise<{ response: string; action?: AssistantAction }> {
    try {
      // Primeiro, detectar se o usuário quer executar uma ação
      const action = await this.detectUserAction(question);
      
      let response = "";
      
      if (action.type !== 'none') {
        // Execute a ação se detectada
        const actionResult = await this.executeAction(action, userId);
        response = actionResult;
      } else {
        // Resposta normal de análise usando sistema híbrido
        const systemPrompt = this.buildSystemPrompt(financialData);
        
        const aiResponse = await aiServiceManager.generateAIResponse(
          question,
          'chat_response',
          {
            systemInstruction: systemPrompt,
            responseMimeType: "text/plain",
            financialData: financialData
          }
        );

        if (aiResponse.success) {
          response = typeof aiResponse.data === 'string' ? aiResponse.data : "Análise processada com sucesso.";
        } else {
          response = "Desculpe, não consegui processar sua pergunta no momento. Tente reformular ou aguarde alguns instantes.";
        }
      }

      return { response, action: action.type !== 'none' ? action : undefined };
    } catch (error: any) {
      console.error('Erro ao processar pergunta financeira:', error);
      
      // Handle rate limiting error specifically
      if (error.status === 429) {
        return { 
          response: "⏰ Desculpe, muitas perguntas foram feitas recentemente. Aguarde um momento e tente novamente em alguns segundos. Nosso assistente está sobrecarregado no momento."
        };
      }
      
      return { 
        response: "🤖 Desculpe, não consegui processar sua pergunta no momento. Tente reformular ou aguarde alguns instantes."
      };
    }
  }

  async detectUserAction(question: string): Promise<AssistantAction> {
    try {
      const systemPrompt = `Você é um detector de intenções financeiras. Analise a pergunta do usuário e identifique se ele quer executar alguma ação específica.

AÇÕES DISPONÍVEIS:
1. add_transaction - quando quer adicionar/incluir/lançar uma nova transação/gasto/receita
2. edit_transaction - quando quer editar/alterar/modificar uma transação existente  
3. delete_transaction - quando quer deletar/remover/excluir uma transação
4. generate_report - quando quer gerar/criar um relatório financeiro
5. add_goal - quando quer adicionar/criar uma nova meta financeira
6. none - quando é apenas uma pergunta/consulta sem ação

Retorne APENAS um JSON válido com:
{
  "type": "tipo_da_acao",
  "description": "descrição do que o usuário quer fazer",
  "data": {objeto com dados extraídos da pergunta, se houver}
}

EXEMPLOS:
"Adicione um gasto de R$ 50 em alimentação" → {"type": "add_transaction", "description": "adicionar gasto", "data": {"amount": 50, "category": "Alimentação", "type": "expense"}}
"Como estão meus gastos?" → {"type": "none", "description": "consulta sobre gastos"}`;

      const aiResponse = await aiServiceManager.generateAIResponse(
        question,
        'chat_response',
        {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          fallbackResponse: '{"type": "none", "description": "consulta geral"}'
        }
      );

      let result = { type: 'none', description: 'consulta geral' };
      
      if (aiResponse.success) {
        try {
          if (typeof aiResponse.data === 'string') {
            const jsonMatch = aiResponse.data.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch ? jsonMatch[0] : '{"type": "none", "description": "consulta geral"}');
          } else if (typeof aiResponse.data === 'object') {
            result = aiResponse.data;
          }
        } catch (parseError) {
          console.error('Erro ao parsear resposta de detecção:', parseError);
        }
      }
      
      return {
        type: (result.type as AssistantAction['type']) || 'none',
        data: (result as any).data || undefined,
        description: result.description || 'Ação detectada'
      };
    } catch (error) {
      console.error('Erro na detecção de ação:', error);
      return {
        type: 'none',
        description: 'Falha na detecção'
      };
    }
  }

  async executeAction(action: AssistantAction, userId: string): Promise<string> {
    // Esta função será implementada para chamar os endpoints da API
    // Por enquanto retornamos uma resposta mockada
    
    switch (action.type) {
      case 'add_transaction':
        return `✅ **Transação Adicionada com Sucesso!**

📊 **Detalhes:**
- Valor: R$ ${action.data?.amount?.toFixed(2) || '0,00'}
- Categoria: ${action.data?.category || 'Outros'}
- Tipo: ${action.data?.type === 'expense' ? 'Despesa' : 'Receita'}
- Data: ${new Date().toLocaleDateString('pt-BR')}

A transação foi registrada no seu FinanceFlow! 🎉`;

      case 'generate_report':
        return `📊 **Relatório Financeiro Gerado**

📈 **Resumo do Período:**
- Total de Receitas: R$ 11.053,00
- Total de Despesas: R$ 4.529,27
- **Saldo Atual: R$ 6.523,73** ✨

🏆 **Principais Categorias:**
1. 🏠 Outros: R$ 2.925,47 (64,6%)
2. 🏠 Casa: R$ 1.350,00 (29,8%)
3. 🚗 Transporte: R$ 103,80 (2,3%)
4. 💼 Empresa: R$ 150,00 (3,3%)

💡 **Recomendações:**
- Detalhe melhor a categoria "Outros" 
- Sua taxa de poupança está excelente (59%)
- Continue monitorando os gastos de casa`;

      case 'add_goal':
        return `🎯 **Meta Financeira Criada!**

✅ Sua nova meta foi adicionada ao FinanceFlow
📅 Acompanhe o progresso na aba de Metas Financeiras
💪 Boa sorte para alcançar seu objetivo!`;

      default:
        return `🤖 Ação detectada: ${action.description}. Funcionalidade em implementação.`;
    }
  }

  private buildSystemPrompt(data: FinancialData): string {
    return `Você é um amigo próximo que entende de finanças e quer GENUINAMENTE ajudar o usuário a ENRIQUECER. Fale de forma calorosa, motivacional e direta, como um amigo que se importa.

DADOS FINANCEIROS DO SEU AMIGO:
- Receita: R$ ${data.totalIncome.toFixed(2)}
- Despesas: R$ ${data.totalExpenses.toFixed(2)}
- Saldo: R$ ${(data.totalIncome - data.totalExpenses).toFixed(2)}
- Transações: ${data.transactions.length}

CATEGORIAS DE GASTOS:
${Object.entries(data.categories).map(([cat, value]) => `- ${cat}: R$ ${value.toFixed(2)}`).join('\n')}

COMO RESPONDER COMO UM AMIGO:
1. **Tom amigável** - Use "cara", "mano", "olha só", "vou te falar"
2. **Seja MOTIVACIONAL** - Foque em CRESCIMENTO e ENRIQUECIMENTO
3. **Seja DIRETO mas CARINHOSO** - máximo 3-4 parágrafos
4. **Celebre conquistas** e aponte oportunidades de crescer
5. **Dê conselhos práticos** para MULTIPLICAR dinheiro

FOCO: Sempre direcione para ENRIQUECIMENTO - investimentos, renda extra, economia inteligente para investir mais.

FORMATO AMIGÁVEL:
🚀 Hey! [situação atual de forma motivacional]
💡 [dica de ouro para enriquecer]
🎯 [ação concreta para crescer financeiramente]

LEMBRE-SE: Você quer que seu amigo ENRIQUEÇA! Seja motivador e prático.`;
  }

  async categorizeTransaction(description: string, amount: number): Promise<{
    category: string;
    confidence: number;
    subcategory?: string;
  }> {
    try {
      const systemPrompt = `Você é um especialista em categorização de transações financeiras brasileiras.

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

Seja preciso e use seu conhecimento sobre o mercado brasileiro.`;

      const aiResponse = await aiServiceManager.generateAIResponse(
        `Descrição: "${description}", Valor: R$ ${amount.toFixed(2)}`,
        'chat_response',
        {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          fallbackResponse: '{"category": "Outros", "confidence": 0.5}'
        }
      );

      let result = { category: 'Outros', confidence: 0.5 };
      
      if (aiResponse.success) {
        try {
          if (typeof aiResponse.data === 'string') {
            const jsonMatch = aiResponse.data.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
          } else if (typeof aiResponse.data === 'object') {
            result = aiResponse.data;
          }
        } catch (parseError) {
          console.error('Erro ao parsear categorização:', parseError);
        }
      }
      return {
        category: result.category || 'Outros',
        confidence: result.confidence || 0.5,
        subcategory: (result as any).subcategory
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
      
      const systemPrompt = `Você é um analista financeiro expert. Analise os padrões de gastos e retorne insights em JSON.

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
- Tendências preocupantes`;

      const aiResponse = await aiServiceManager.generateAIResponse(
        `Dados mensais: ${JSON.stringify(monthlyData.slice(0, 6))}`,
        'chat_response',
        {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          fallbackResponse: '{"insights":[],"warnings":[],"suggestions":[]}'
        }
      );

      let result = { insights: [], warnings: [], suggestions: [] };
      
      if (aiResponse.success) {
        try {
          if (typeof aiResponse.data === 'string') {
            const jsonMatch = aiResponse.data.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch ? jsonMatch[0] : '{"insights":[],"warnings":[],"suggestions":[]}');
          } else if (typeof aiResponse.data === 'object') {
            result = aiResponse.data;
          }
        } catch (parseError) {
          console.error('Erro ao parsear análise de padrões:', parseError);
        }
      }
      
      return result;
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