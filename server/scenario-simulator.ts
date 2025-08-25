import { GoogleGenAI } from "@google/genai";
import type { Scenario, InsertScenario } from "@shared/schema";

// DON'T DELETE THIS COMMENT  
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ScenarioSimulationResult {
  targetAmount: number;
  monthlyContribution: number;
  targetDate: Date;
  probability: number;
  timeToGoal: number; // months
  totalContributions: number;
  totalInterest: number;
  projections: {
    month: number;
    balance: number;
    contribution: number;
    interest: number;
    cumulativeContribution: number;
  }[];
  recommendations: string[];
  riskAssessment: {
    level: string;
    factors: string[];
    mitigation: string[];
  };
}

export interface ScenarioParameters {
  type: 'retirement' | 'house_purchase' | 'emergency_fund' | 'business_investment' | 'custom';
  targetAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  currentSavings?: number;
  expectedReturn: number; // Annual percentage
  inflationRate?: number; // Annual percentage
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  additionalParameters?: {
    age?: number;
    retirementAge?: number;
    currentIncome?: number;
    dependents?: number;
    currentDebt?: number;
  };
}

export class ScenarioSimulator {
  
  /**
   * Simulates a financial scenario by ID
   */
  async simulateScenarioById(scenarioId: string, userId: string): Promise<ScenarioSimulationResult> {
    const { storage } = await import('./storage');
    const scenario = await storage.getScenario(scenarioId, userId);
    
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    // Convert scenario to parameters
    const params: ScenarioParameters = {
      type: scenario.type as any,
      targetAmount: parseFloat(scenario.targetAmount?.toString() || '0'),
      targetDate: scenario.targetDate ? new Date(scenario.targetDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
      monthlyContribution: parseFloat(scenario.monthlyContribution?.toString() || '0'),
      currentSavings: 0, // Could be added to scenario model
      expectedReturn: parseFloat(scenario.expectedReturn?.toString() || '8'),
      inflationRate: 3.5, // Default
      riskTolerance: (scenario.riskTolerance as any) || 'moderate'
    };

    return await this.simulateScenario(params);
  }

  /**
   * Simulates a financial scenario using Monte Carlo methods
   */
  async simulateScenario(params: ScenarioParameters): Promise<ScenarioSimulationResult> {
    const monthsToTarget = this.calculateMonthsToTarget(new Date(), params.targetDate);
    const monthlyReturn = (params.expectedReturn || 8) / 100 / 12;
    const monthlyInflation = (params.inflationRate || 3.5) / 100 / 12;
    
    // Calculate projections
    const projections = this.calculateProjections(
      params.currentSavings || 0,
      params.monthlyContribution,
      monthlyReturn,
      monthsToTarget
    );

    // Calculate probability of success using Monte Carlo simulation
    const probability = await this.calculateSuccessProbability(params);

    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(params, projections);

    // Assess risk factors
    const riskAssessment = this.assessRisk(params, projections);

    const finalBalance = projections[projections.length - 1]?.balance || 0;
    const totalContributions = params.monthlyContribution * monthsToTarget + (params.currentSavings || 0);
    const totalInterest = finalBalance - totalContributions;

    return {
      targetAmount: params.targetAmount,
      monthlyContribution: params.monthlyContribution,
      targetDate: params.targetDate,
      probability,
      timeToGoal: monthsToTarget,
      totalContributions,
      totalInterest,
      projections,
      recommendations,
      riskAssessment
    };
  }

  /**
   * Calculate month-by-month projections using compound interest
   */
  private calculateProjections(
    initialAmount: number,
    monthlyContribution: number,
    monthlyReturn: number,
    months: number
  ) {
    const projections = [];
    let balance = initialAmount;
    let cumulativeContribution = initialAmount;

    for (let month = 1; month <= months; month++) {
      // Add monthly contribution
      balance += monthlyContribution;
      cumulativeContribution += monthlyContribution;
      
      // Apply interest
      const interestEarned = balance * monthlyReturn;
      balance += interestEarned;

      projections.push({
        month,
        balance: Math.round(balance * 100) / 100,
        contribution: monthlyContribution,
        interest: Math.round(interestEarned * 100) / 100,
        cumulativeContribution: Math.round(cumulativeContribution * 100) / 100
      });
    }

    return projections;
  }

  /**
   * Monte Carlo simulation for success probability
   */
  private async calculateSuccessProbability(params: ScenarioParameters): Promise<number> {
    const simulations = 1000;
    let successCount = 0;
    const months = this.calculateMonthsToTarget(new Date(), params.targetDate);
    
    // Volatility based on risk tolerance
    const volatilityMap = {
      conservative: 0.05,
      moderate: 0.12,
      aggressive: 0.20
    };
    
    const volatility = volatilityMap[params.riskTolerance];
    const monthlyReturn = (params.expectedReturn || 8) / 100 / 12;

    for (let sim = 0; sim < simulations; sim++) {
      let balance = params.currentSavings || 0;
      
      for (let month = 1; month <= months; month++) {
        balance += params.monthlyContribution;
        
        // Random return with normal distribution
        const randomReturn = monthlyReturn + (Math.random() - 0.5) * volatility;
        balance *= (1 + randomReturn);
      }
      
      if (balance >= params.targetAmount) {
        successCount++;
      }
    }

    return Math.round((successCount / simulations) * 100);
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    params: ScenarioParameters,
    projections: any[]
  ): Promise<string[]> {
    try {
      const prompt = `
      Analise este cenário financeiro e forneça 3-5 recomendações práticas em português:
      
      Tipo: ${params.type}
      Meta: R$ ${params.targetAmount.toLocaleString('pt-BR')}
      Contribuição mensal: R$ ${params.monthlyContribution.toLocaleString('pt-BR')}
      Data alvo: ${params.targetDate.toLocaleDateString('pt-BR')}
      Retorno esperado: ${params.expectedReturn}% ao ano
      Tolerância ao risco: ${params.riskTolerance}
      
      Valor final projetado: R$ ${projections[projections.length - 1]?.balance.toLocaleString('pt-BR') || 0}
      
      Forneça recomendações específicas e acionáveis para melhorar as chances de sucesso.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const recommendations = response.text?.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 5) || [];

      return recommendations.length > 0 ? recommendations : [
        "Considere aumentar sua contribuição mensal gradualmente",
        "Revise seus gastos para encontrar economia adicional",
        "Diversifique seus investimentos conforme sua tolerância ao risco"
      ];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        "Considere aumentar sua contribuição mensal gradualmente",
        "Revise seus gastos para encontrar economia adicional",
        "Diversifique seus investimentos conforme sua tolerância ao risco"
      ];
    }
  }

  /**
   * Assess risk factors for the scenario
   */
  private assessRisk(params: ScenarioParameters, projections: any[]) {
    const factors = [];
    const mitigation = [];
    let level = 'low';

    const finalBalance = projections[projections.length - 1]?.balance || 0;
    const shortfall = params.targetAmount - finalBalance;

    if (shortfall > 0) {
      level = 'high';
      factors.push(`Déficit projetado de R$ ${shortfall.toLocaleString('pt-BR')}`);
      mitigation.push('Considere aumentar a contribuição mensal');
    }

    if (params.riskTolerance === 'aggressive') {
      factors.push('Alta volatilidade dos investimentos');
      mitigation.push('Mantenha uma reserva de emergência separada');
    }

    const monthsToTarget = this.calculateMonthsToTarget(new Date(), params.targetDate);
    if (monthsToTarget < 12) {
      level = 'high';
      factors.push('Prazo muito curto para a meta');
      mitigation.push('Revise o prazo ou ajuste a meta');
    }

    if (factors.length === 0) {
      factors.push('Cenário bem estruturado');
      mitigation.push('Continue seguindo o plano');
    }

    return { level, factors, mitigation };
  }

  /**
   * Calculate months between two dates
   */
  private calculateMonthsToTarget(startDate: Date, targetDate: Date | null | undefined): number {
    if (!targetDate) {
      return 12; // Default to 12 months if no target date
    }
    
    const target = new Date(targetDate);
    const start = new Date(startDate);
    
    if (isNaN(target.getTime()) || isNaN(start.getTime())) {
      return 12; // Default if invalid dates
    }
    
    const yearDiff = target.getFullYear() - start.getFullYear();
    const monthDiff = target.getMonth() - start.getMonth();
    return Math.max(1, yearDiff * 12 + monthDiff);
  }

  /**
   * Create scenario templates for common goals
   */
  static getScenarioTemplate(type: string, userIncome?: number): Partial<ScenarioParameters> {
    const templates: Record<string, Partial<ScenarioParameters>> = {
      emergency_fund: {
        type: 'emergency_fund' as const,
        targetAmount: (userIncome || 5000) * 6, // 6 months of expenses
        expectedReturn: 6, // Conservative return for emergency fund
        riskTolerance: 'conservative' as const
      },
      retirement: {
        type: 'retirement' as const,
        targetAmount: (userIncome || 5000) * 12 * 25, // 25x annual expenses
        expectedReturn: 8,
        riskTolerance: 'moderate' as const
      },
      house_purchase: {
        type: 'house_purchase' as const,
        targetAmount: 200000, // Typical down payment
        expectedReturn: 7,
        riskTolerance: 'moderate' as const
      },
      business_investment: {
        type: 'business_investment' as const,
        targetAmount: 50000,
        expectedReturn: 10,
        riskTolerance: 'aggressive' as const
      }
    };

    return templates[type] || {};
  }
}

export const scenarioSimulator = new ScenarioSimulator();

export const scenarioSimulator = new ScenarioSimulator();