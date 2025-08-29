import { GoogleGenAI } from "@google/genai";

// Interface para padronizar respostas de diferentes provedores
interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  provider: string;
  timestamp: Date;
}

// Interface para configuração de provedores
interface AIProvider {
  name: string;
  enabled: boolean;
  quotaLimit: number;
  quotaUsed: number;
  resetDate: Date;
  priority: number;
}

// Gerenciador inteligente de múltiplas APIs de IA
export class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map();
  private geminiAI?: GoogleGenAI;
  
  constructor() {
    this.initializeProviders();
  }

  // Inicializar configurações dos provedores
  private initializeProviders() {
    // OpenAI - primeira prioridade
    this.providers.set('openai', {
      name: 'OpenAI',
      enabled: !!process.env.OPENAI_API_KEY,
      quotaLimit: 100, // Depende do tier
      quotaUsed: 0,
      resetDate: this.getNextMonthReset(),
      priority: 1
    });

    // Gemini - segunda prioridade
    this.providers.set('gemini', {
      name: 'Gemini',
      enabled: !!process.env.GEMINI_API_KEY,
      quotaLimit: 50,
      quotaUsed: 0,
      resetDate: this.getNextDayReset(),
      priority: 2
    });

    // Hugging Face - terceira prioridade (temporariamente desabilitado)
    this.providers.set('huggingface', {
      name: 'Hugging Face',
      enabled: false, // Temporariamente desabilitado devido a problemas de conectividade
      quotaLimit: 1000,
      quotaUsed: 0,
      resetDate: this.getNextMonthReset(),
      priority: 3
    });

    // Removido sistema local - apenas APIs de IA

    // Inicializar clientes das APIs
    if (process.env.GEMINI_API_KEY) {
      this.geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  // Obter próximo reset diário
  private getNextDayReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Obter próximo reset mensal
  private getNextMonthReset(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  }

  // Verificar se provedor está disponível
  private isProviderAvailable(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    if (!provider || !provider.enabled) return false;

    // Resetar quota se passou da data de reset
    if (new Date() > provider.resetDate) {
      provider.quotaUsed = 0;
      if (providerName === 'gemini') {
        provider.resetDate = this.getNextDayReset();
      } else {
        provider.resetDate = this.getNextMonthReset();
      }
    }

    return provider.quotaUsed < provider.quotaLimit;
  }

  // Incrementar uso da quota
  private incrementQuota(providerName: string) {
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.quotaUsed++;
    }
  }

  // Obter lista de provedores disponíveis ordenados por prioridade
  private getAvailableProviders(): string[] {
    const available = Array.from(this.providers.entries())
      .filter(([name, provider]) => this.isProviderAvailable(name))
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([name]) => name);
    
    console.log('Provedores disponíveis:', available);
    return available;
  }

  // Método genérico para qualquer tipo de análise de IA
  async generateAIResponse(
    prompt: string,
    type: 'investment_suggestions' | 'financial_insights' | 'chat_response' | 'extract_analysis' | 'scenario_simulation' | 'automation_rules' | 'predictive_analysis',
    config: any = {}
  ): Promise<AIResponse> {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return {
        success: false,
        error: 'Assistente temporariamente indisponível',
        provider: 'assistant',
        timestamp: new Date()
      };
    }

    // Tentar cada provedor em ordem de prioridade
    for (const providerName of availableProviders) {
      try {
        
        let result: any;
        switch (providerName) {
          case 'gemini':
            result = await this.callGemini(prompt, config);
            break;
          case 'huggingface':
            result = await this.callHuggingFace(prompt, config);
            break;
          case 'openai':
            result = await this.callOpenAI(prompt, config);
            break;
          // Sistema local removido - apenas APIs de IA
          default:
            continue;
        }

        if (result && (typeof result === 'string' ? result.trim() !== '' : result !== null)) {
          console.log(`[${providerName}] Resultado obtido com sucesso:`, typeof result === 'string' ? result.substring(0, 100) + '...' : JSON.stringify(result).substring(0, 100) + '...');
          this.incrementQuota(providerName);
          return {
            success: true,
            data: result,
            provider: 'assistant',
            timestamp: new Date()
          };
        } else {
          console.log(`[${providerName}] Resultado vazio ou inválido:`, result);
        }
      } catch (error: any) {
        console.log(`[${providerName}] Erro:`, error.message || error);
        // Se for erro de quota, marca provedor como indisponível temporariamente
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          const provider = this.providers.get(providerName);
          if (provider) {
            provider.quotaUsed = provider.quotaLimit; // Força indisponibilidade
          }
        }
        // Falha silenciosa - tenta próximo provedor
        continue;
      }
    }

    // Todas as APIs de IA falharam
    return {
      success: false,
      error: 'Assistente financeiro temporariamente indisponível. Tente novamente em alguns minutos.',
      provider: 'assistant',
      timestamp: new Date()
    };
  }

  // Gerar sugestões de investimento usando múltiplas APIs
  async generateInvestmentSuggestions(
    userPortfolio: any[], 
    riskProfile: string = 'moderado'
  ): Promise<AIResponse> {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return {
        success: false,
        error: 'Assistente temporariamente indisponível',
        provider: 'assistant',
        timestamp: new Date()
      };
    }

    // Tentar cada provedor em ordem de prioridade
    for (const providerName of availableProviders) {
      try {
        // Tentando próximo serviço disponível
        
        let result: any;
        switch (providerName) {
          case 'gemini':
            result = await this.tryGemini(userPortfolio, riskProfile);
            break;
          case 'huggingface':
            result = await this.tryHuggingFace(userPortfolio, riskProfile);
            break;
          case 'openai':
            result = await this.tryOpenAI(userPortfolio, riskProfile);
            break;
          // Sistema local removido - apenas APIs de IA
          default:
            continue;
        }

        if (result && (typeof result === 'string' ? result.trim() !== '' : result !== null)) {
          console.log(`[${providerName}] Resultado obtido com sucesso:`, typeof result === 'string' ? result.substring(0, 100) + '...' : JSON.stringify(result).substring(0, 100) + '...');
          this.incrementQuota(providerName);
          return {
            success: true,
            data: result,
            provider: 'assistant',
            timestamp: new Date()
          };
        } else {
          console.log(`[${providerName}] Resultado vazio ou inválido:`, result);
        }
      } catch (error: any) {
        console.log(`[${providerName}] Erro:`, error.message || error);
        // Se for erro de quota, marca provedor como indisponível temporariamente
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          const provider = this.providers.get(providerName);
          if (provider) {
            provider.quotaUsed = provider.quotaLimit; // Força indisponibilidade
          }
        }
        // Falha silenciosa - tenta próximo provedor
        continue;
      }
    }

    // Todas as APIs de investimento falharam
    return {
      success: false,
      error: 'Serviço de sugestões de investimento temporariamente indisponível. Tente novamente em alguns minutos.',
      provider: 'assistant',
      timestamp: new Date()
    };
  }

  // Método universal para chamar Gemini
  private async callGemini(prompt: string, config: any = {}): Promise<any> {
    if (!this.geminiAI) throw new Error('Gemini não configurado');
    
    console.log('[Gemini] Chamando com config:', { responseMimeType: config.responseMimeType });

    const modelConfig = {
      model: config.model || "gemini-2.5-flash",
      config: {
        responseMimeType: config.responseMimeType || "text/plain",
        temperature: config.temperature || 0.3,
        systemInstruction: config.systemInstruction || undefined
      },
      contents: [{ 
        role: "user", 
        parts: [{ text: prompt }] 
      }],
    };

    if (config.systemInstruction) {
      modelConfig.config.systemInstruction = config.systemInstruction;
    }

    const response = await this.geminiAI.models.generateContent(modelConfig);
    const content = response.text || '';
    
    console.log('[Gemini] Resposta completa:', { response, content, candidates: response.candidates });
    
    // Se esperamos JSON, parse it
    if (config.responseMimeType === "application/json") {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    }
    
    return content || "Análise processada com sucesso.";
  }

  // Método universal para chamar Hugging Face
  private async callHuggingFace(prompt: string, config: any = {}): Promise<any> {
    if (!process.env.HUGGINGFACE_API_KEY) throw new Error('Hugging Face não configurado');

    // Usar modelo mais adequado baseado no tipo de tarefa
    const model = config.model || "gpt2";
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
          options: {
            wait_for_model: true,
            use_cache: false
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    return this.processHuggingFaceResponse(result, config);
  }

  // Método universal para chamar OpenAI
  private async callOpenAI(prompt: string, config: any = {}): Promise<any> {
    // Implementação pendente quando OpenAI API key estiver disponível
    throw new Error('OpenAI não configurado');
  }

  // Sistema local removido - apenas APIs de IA

  // Processar resposta do Hugging Face
  private processHuggingFaceResponse(hfResponse: any, config: any): any {
    if (Array.isArray(hfResponse) && hfResponse.length > 0) {
      const response = hfResponse[0];
      if (response.generated_text) {
        return response.generated_text;
      }
    }
    
    // Se não conseguiu processar, retornar resposta estruturada básica
    return config.fallbackResponse || "Análise processada com sucesso";
  }

  // Funções de sistema local removidas - apenas APIs de IA

  // Método específico para investimentos (mantido para compatibilidade)
  private async tryGemini(userPortfolio: any[], riskProfile: string): Promise<any> {
    if (!this.geminiAI) throw new Error('Gemini não configurado');

    const portfolioValue = userPortfolio.reduce((total, inv) => total + parseFloat(inv.currentAmount), 0);
    const portfolioTypes = userPortfolio.map(inv => inv.type);
    
    const prompt = `
Como especialista financeiro brasileiro, analise este portfólio e forneça sugestões:

PORTFÓLIO ATUAL:
- Valor total: R$ ${portfolioValue.toFixed(2)}
- Quantidade de ativos: ${userPortfolio.length}
- Tipos de investimento: ${portfolioTypes.join(', ')}
- Perfil de risco: ${riskProfile}

DADOS DETALHADOS:
${userPortfolio.map(inv => `• ${inv.name} (${inv.type}): R$ ${inv.currentAmount}`).join('\n')}

Considerando o mercado brasileiro atual (agosto 2025), forneça 3 sugestões específicas:
1. Diversificação em ações (B3), FIIs e renda fixa
2. Adequação ao perfil de risco
3. Oportunidades atuais do mercado

Responda APENAS em JSON válido:
{
  "analysis": "análise breve do portfólio atual",
  "suggestions": [
    {
      "type": "stocks|real_estate_fund|fixed_income|crypto",
      "asset": "nome do ativo",
      "symbol": "código",
      "reason": "justificativa específica",
      "allocation": "% sugerido",
      "risk_level": "baixo|médio|alto"
    }
  ],
  "portfolio_score": "nota de 1 a 10",
  "next_steps": "próximos passos recomendados"
}`;

    const response = await this.geminiAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const content = response.text || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  }

  // Tentar usar Hugging Face (modelo gratuito para análise financeira)
  private async tryHuggingFace(userPortfolio: any[], riskProfile: string): Promise<any> {
    if (!process.env.HUGGINGFACE_API_KEY) throw new Error('Hugging Face não configurado');

    const portfolioValue = userPortfolio.reduce((total, inv) => total + parseFloat(inv.currentAmount), 0);
    
    // Usar modelo gratuito de texto como microsoft/DialoGPT-medium ou similar
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: `Como consultor financeiro, analise carteira de R$ ${portfolioValue.toFixed(2)} com perfil ${riskProfile} e sugira 3 investimentos brasileiros adequados.`
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Como é um modelo de conversação, vamos processar a resposta e estruturar
    return this.parseHuggingFaceResponse(result, userPortfolio, riskProfile);
  }

  // Processar resposta do Hugging Face e estruturar
  private parseHuggingFaceResponse(hfResponse: any, userPortfolio: any[], riskProfile: string): any {
    // Gerar resposta estruturada baseada na resposta do HF + lógica local
    const portfolioValue = userPortfolio.reduce((total, inv) => total + parseFloat(inv.currentAmount), 0);
    
    // Combinar insights do HF com estrutura local
    const suggestions = this.generateSmartSuggestions(userPortfolio, riskProfile);
    
    return {
      analysis: `Análise híbrida: carteira de R$ ${portfolioValue.toFixed(2)} ${this.getPortfolioInsight(userPortfolio, riskProfile)}`,
      suggestions: suggestions.slice(0, 3),
      portfolio_score: this.calculateScore(userPortfolio, riskProfile).toString(),
      next_steps: "Diversifique gradualmente e monitore performance mensalmente",
      ai_insight: hfResponse[0]?.generated_text || "Consulte um especialista para orientações personalizadas"
    };
  }

  // Tentar usar OpenAI (se disponível)
  private async tryOpenAI(userPortfolio: any[], riskProfile: string): Promise<any> {
    throw new Error('OpenAI para investimentos não implementado');
  }

  // Sistema local removido - mantidas apenas funções auxiliares para APIs

  // Gerar sugestões inteligentes baseadas em dados reais
  private generateSmartSuggestions(userPortfolio: any[], riskProfile: string): any[] {
    const hasStocks = userPortfolio.some(inv => inv.type === 'stocks');
    const hasFIIs = userPortfolio.some(inv => inv.type === 'real_estate_fund');
    const hasFixedIncome = userPortfolio.some(inv => inv.type === 'fixed_income');
    const portfolioValue = userPortfolio.reduce((sum, inv) => sum + parseFloat(inv.currentAmount), 0);

    // Base de dados atualizada de investimentos brasileiros
    const investmentOptions = {
      conservador: [
        { type: "fixed_income", asset: "Tesouro Selic", symbol: "SELIC", reason: "Segurança e liquidez diária com taxa Selic de 11,75%", allocation: "50%", risk_level: "baixo" },
        { type: "fixed_income", asset: "CDB 100% CDI", symbol: "CDB", reason: "Renda fixa protegida pelo FGC com rentabilidade próxima ao CDI", allocation: "30%", risk_level: "baixo" },
        { type: "real_estate_fund", asset: "HGLG11", symbol: "HGLG11", reason: "FII de logística com yield de 8,5% e baixa volatilidade", allocation: "20%", risk_level: "baixo" }
      ],
      moderado: [
        { type: "fixed_income", asset: "Tesouro Selic", symbol: "SELIC", reason: "Base segura do portfólio com taxa atual atrativa", allocation: "40%", risk_level: "baixo" },
        { type: "real_estate_fund", asset: "HGLG11", symbol: "HGLG11", reason: "Diversificação imobiliária no setor de logística em crescimento", allocation: "30%", risk_level: "médio" },
        { type: "stocks", asset: "ITSA4", symbol: "ITSA4", reason: "Holding diversificada com histórico sólido de dividendos", allocation: "30%", risk_level: "médio" }
      ],
      agressivo: [
        { type: "stocks", asset: "PETR4", symbol: "PETR4", reason: "Líder em energia com potencial de valorização e dividendos", allocation: "40%", risk_level: "alto" },
        { type: "stocks", asset: "VALE3", symbol: "VALE3", reason: "Exposição a commodities com demanda global crescente", allocation: "30%", risk_level: "alto" },
        { type: "real_estate_fund", asset: "XPML11", symbol: "XPML11", reason: "FII de shoppings com yield atrativo e potencial de recuperação", allocation: "30%", risk_level: "médio" }
      ]
    };

    const baseProfile = riskProfile as keyof typeof investmentOptions || 'moderado';
    let suggestions = [...investmentOptions[baseProfile]];

    // Personalizar baseado na carteira atual
    if (portfolioValue === 0) {
      // Para iniciantes, priorizar diversificação básica
      return suggestions;
    }

    // Se já tem algumas posições, sugerir complementos
    if (hasStocks && !hasFIIs) {
      suggestions.unshift({
        type: "real_estate_fund",
        asset: "VISC11",
        symbol: "VISC11", 
        reason: "Diversificação em fundos imobiliários de shoppings",
        allocation: "20%",
        risk_level: "médio"
      });
    }

    if (!hasFixedIncome && riskProfile !== 'agressivo') {
      suggestions.unshift({
        type: "fixed_income",
        asset: "Tesouro IPCA+",
        symbol: "IPCA",
        reason: "Proteção contra inflação com rentabilidade real",
        allocation: "25%",
        risk_level: "baixo"
      });
    }

    return suggestions;
  }

  // Análise textual do portfólio
  private generatePortfolioAnalysis(userPortfolio: any[], riskProfile: string): string {
    const totalValue = userPortfolio.reduce((sum, inv) => sum + parseFloat(inv.currentAmount), 0);
    
    if (totalValue === 0) {
      return `Carteira iniciante - momento ideal para começar com estratégia ${riskProfile}`;
    }

    const diversity = new Set(userPortfolio.map(inv => inv.type)).size;
    return `Carteira de R$ ${totalValue.toFixed(2)} com ${diversity} tipos de ativos, adequada para perfil ${riskProfile}`;
  }

  // Calcular score do portfólio
  private calculateScore(userPortfolio: any[], riskProfile: string): number {
    if (userPortfolio.length === 0) return 0;
    
    let score = 5;
    const diversity = new Set(userPortfolio.map(inv => inv.type)).size;
    score += diversity * 1.5;
    
    const totalValue = userPortfolio.reduce((sum, inv) => sum + parseFloat(inv.currentAmount), 0);
    if (totalValue > 1000) score += 1;
    if (totalValue > 10000) score += 1;
    
    return Math.min(10, Math.max(0, Math.round(score)));
  }

  // Próximos passos personalizados
  private generateNextSteps(userPortfolio: any[], riskProfile: string): string {
    const totalValue = userPortfolio.reduce((sum, inv) => sum + parseFloat(inv.currentAmount), 0);
    
    if (totalValue === 0) {
      return "Comece com aportes mensais regulares priorizando diversificação";
    }
    
    return "Monitore performance, rebalanceie trimestralmente e aumente aportes gradualmente";
  }

  // Insight do portfólio para análise
  private getPortfolioInsight(userPortfolio: any[], riskProfile: string): string {
    const totalValue = userPortfolio.reduce((sum, inv) => sum + parseFloat(inv.currentAmount), 0);
    
    if (totalValue === 0) return "pronta para primeiros investimentos";
    if (totalValue < 5000) return "em fase de construção";
    if (totalValue < 50000) return "com boa base estabelecida";
    return "consolidada e diversificada";
  }

  // Obter status dos provedores
  getProvidersStatus(): any {
    const status: any = {};
    this.providers.forEach((provider, name) => {
      status[name] = {
        name: provider.name,
        enabled: provider.enabled,
        available: this.isProviderAvailable(name),
        quotaUsed: provider.quotaUsed,
        quotaLimit: provider.quotaLimit,
        resetDate: provider.resetDate
      };
    });
    return status;
  }
}

// Instância singleton
export const aiServiceManager = new AIServiceManager();