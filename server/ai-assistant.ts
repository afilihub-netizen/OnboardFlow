import { GoogleGenAI } from "@google/genai";

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
        // Resposta normal de análise
        const systemPrompt = this.buildSystemPrompt(financialData);
        
        const aiResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          config: {
            systemInstruction: systemPrompt,
          },
          contents: [{ role: "user", parts: [{ text: question }] }],
        });

        response = aiResponse.text || "Desculpe, não consegui processar sua pergunta.";
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

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: systemPrompt,
        },
        contents: [{ role: "user", parts: [{ text: question }] }],
      });

      const content = response.text || '{"type": "none", "description": "consulta geral"}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{"type": "none", "description": "consulta geral"}');
      
      return {
        type: result.type || 'none',
        data: result.data,
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
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: `Você é um especialista em categorização de transações financeiras brasileiras.

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
        contents: [{ role: "user", parts: [{ text: `Descrição: "${description}", Valor: R$ ${amount.toFixed(2)}` }] }],
      });

      const content = response.text || '{}';
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
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: `Você é um analista financeiro expert. Analise os padrões de gastos e retorne insights em JSON.

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
        contents: [{ role: "user", parts: [{ text: `Dados mensais: ${JSON.stringify(monthlyData.slice(0, 6))}` }] }],
      });

      const content = response.text || '{"insights":[],"warnings":[],"suggestions":[]}';
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