import { GoogleGenAI } from "@google/genai";
import type { 
  Transaction, 
  Prediction, 
  InsertPrediction, 
  AnomalyDetection,
  InsertAnomalyDetection,
  CashflowPrediction,
  InsertCashflowPrediction
} from "@shared/schema";
import { storage } from "./storage";
import { aiServiceManager } from "./services/aiServiceManager";

// DON'T DELETE THIS COMMENT  
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PredictionResult {
  predictions: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
  confidence: number;
  factors: string[];
  recommendations: string[];
  seasonalTrends: {
    month: number;
    expectedChange: number;
    reason: string;
  }[];
}

export interface AnomalyResult {
  isAnomaly: boolean;
  severity: 'info' | 'warning' | 'critical';
  score: number; // 0-100
  reasons: string[];
  expectedRange: {
    min: number;
    max: number;
  };
  recommendations: string[];
}

export class PredictiveAnalytics {

  /**
   * Generate cashflow predictions for the next 90 days
   */
  async generateCashflowPredictions(
    userId: string, 
    organizationId?: string
  ): Promise<CashflowPrediction[]> {
    const transactions = await storage.getTransactionsForPrediction(userId, organizationId, 365); // Last year of data
    const fixedExpenses = await storage.getFixedExpenses(userId, organizationId);
    
    const predictions: InsertCashflowPrediction[] = [];
    const today = new Date();

    // Predict for next 90 days
    for (let days = 1; days <= 90; days++) {
      const predictionDate = new Date(today);
      predictionDate.setDate(today.getDate() + days);
      
      const prediction = await this.predictDayBalance(
        predictionDate,
        transactions,
        fixedExpenses,
        userId,
        organizationId
      );
      
      predictions.push(prediction);
    }

    // Save predictions to database
    const savedPredictions = [];
    for (const prediction of predictions) {
      try {
        const saved = await storage.createCashflowPrediction(prediction);
        savedPredictions.push(saved);
      } catch (error) {
        console.error('Error saving prediction:', error);
      }
    }

    return savedPredictions;
  }

  /**
   * Predict balance for a specific day
   */
  private async predictDayBalance(
    date: Date,
    historicalTransactions: Transaction[],
    fixedExpenses: any[],
    userId: string,
    organizationId?: string
  ): Promise<InsertCashflowPrediction> {
    // Calculate historical patterns
    const patterns = this.analyzeSpendingPatterns(historicalTransactions);
    
    // Predict daily inflow/outflow based on patterns
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    
    let predictedInflow = 0;
    let predictedOutflow = 0;

    // Fixed expenses for this day
    const fixedForDay = fixedExpenses.filter(expense => 
      expense.dueDay === dayOfMonth && expense.isActive
    );
    
    predictedOutflow += fixedForDay.reduce((sum, expense) => 
      sum + parseFloat(expense.amount), 0
    );

    // Variable expenses based on patterns
    predictedOutflow += patterns.dailyAverages.expense * this.getDayMultiplier(dayOfWeek);
    
    // Income prediction (usually monthly/bi-weekly)
    if (this.isIncomeDay(date, patterns.incomePattern)) {
      predictedInflow += patterns.averageIncome;
    }

    // Random variable expenses
    predictedOutflow += patterns.dailyAverages.variable * (0.8 + Math.random() * 0.4);

    // Current balance (this would come from actual account balance)
    const currentBalance = await storage.getTotalBalance(userId, organizationId);
    const predictedBalance = currentBalance + predictedInflow - predictedOutflow;

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(historicalTransactions.length, date);

    return {
      userId,
      organizationId,
      predictionDate: date,
      predictedInflow,
      predictedOutflow,
      predictedBalance,
      confidence,
      factors: {
        dayOfWeek,
        fixedExpenses: fixedForDay.length,
        historicalData: historicalTransactions.length,
        seasonalFactor: this.getSeasonalFactor(date)
      }
    };
  }

  /**
   * Detect anomalies in transactions using AI and statistical methods
   */
  async detectAnomalies(
    transaction: Transaction,
    userId: string,
    organizationId?: string
  ): Promise<AnomalyDetection | null> {
    const recentTransactions = await storage.getRecentTransactions(userId, 90, organizationId);
    const categoryTransactions = recentTransactions.filter(t => 
      t.categoryId === transaction.categoryId
    );

    // Statistical analysis
    const statisticalAnomaly = this.detectStatisticalAnomaly(transaction, categoryTransactions);
    
    // AI analysis
    const aiAnomaly = await this.detectAIAnomaly(transaction, recentTransactions);

    // Combine results
    const isAnomaly = statisticalAnomaly.isAnomaly || aiAnomaly.isAnomaly;
    
    if (!isAnomaly) {
      return null;
    }

    const anomaly: InsertAnomalyDetection = {
      userId,
      organizationId,
      transactionId: transaction.id,
      type: this.determineAnomalyType(transaction, statisticalAnomaly, aiAnomaly),
      severity: this.determineSeverity(statisticalAnomaly.score, aiAnomaly.score),
      title: `Transação Anômala Detectada`,
      description: this.generateAnomalyDescription(transaction, statisticalAnomaly, aiAnomaly),
      anomalyScore: Math.max(statisticalAnomaly.score, aiAnomaly.score),
      expectedValue: statisticalAnomaly.expectedRange.average,
      actualValue: parseFloat(transaction.amount),
      deviation: Math.abs(parseFloat(transaction.amount) - statisticalAnomaly.expectedRange.average),
      context: {
        statistical: statisticalAnomaly,
        ai: aiAnomaly,
        categoryHistory: categoryTransactions.length
      }
    };

    return await storage.createAnomalyDetection(anomaly);
  }

  /**
   * Generate expense predictions using AI
   */
  async generateExpensePredictions(
    userId: string,
    timeframe: '30d' | '60d' | '90d' | '1y',
    organizationId?: string
  ): Promise<PredictionResult> {
    const daysMap = { '30d': 30, '60d': 60, '90d': 90, '1y': 365 };
    const days = daysMap[timeframe];
    
    const transactions = await storage.getTransactionsForPrediction(userId, organizationId, days * 2);
    const categories = await storage.getCategories(userId, organizationId);

    try {
      const prompt = `
      Analise estas transações e gere previsões de gastos para os próximos ${days} dias:
      
      Histórico de transações (últimos ${days * 2} dias):
      ${transactions.slice(0, 50).map(t => 
        `${t.description} - R$ ${t.amount} - ${t.type} - ${new Date(t.date).toLocaleDateString('pt-BR')}`
      ).join('\n')}
      
      Categorias disponíveis:
      ${categories.map(c => c.name).join(', ')}
      
      Retorne um JSON com:
      {
        "predictions": {
          "next30Days": valor_total_esperado,
          "next60Days": valor_total_esperado,
          "next90Days": valor_total_esperado
        },
        "confidence": 0.0_a_1.0,
        "factors": ["fator1", "fator2", "fator3"],
        "recommendations": ["recomendacao1", "recomendacao2"],
        "seasonalTrends": [
          {
            "month": numero_mes,
            "expectedChange": porcentagem_mudanca,
            "reason": "motivo_da_mudanca"
          }
        ]
      }
      
      Considere:
      - Padrões sazonais (férias, datas comemorativas)
      - Tendências de crescimento/redução
      - Gastos recorrentes vs variáveis
      - Contexto econômico brasileiro
      `;

      const aiResponse = await aiServiceManager.generateAIResponse(
        prompt,
        'predictive_analysis',
        {
          responseMimeType: "application/json",
          fallbackResponse: '{"predictions": {"next30Days": 0, "next60Days": 0, "next90Days": 0}, "confidence": 0.5}'
        }
      );

      let result = { predictions: { next30Days: 0, next60Days: 0, next90Days: 0 }, confidence: 0.5 };
      if (aiResponse.success) {
        if (typeof aiResponse.data === 'string') {
          result = JSON.parse(aiResponse.data || '{}');
        } else if (typeof aiResponse.data === 'object') {
          result = aiResponse.data;
        }
      }
      
      // Save prediction to database
      const prediction: InsertPrediction = {
        userId,
        organizationId,
        type: 'expense',
        timeframe,
        prediction: result.predictions,
        confidence: result.confidence * 100,
        metadata: {
          factors: result.factors,
          recommendations: result.recommendations,
          seasonalTrends: result.seasonalTrends,
          dataPoints: transactions.length
        },
        validUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      };

      await storage.createPrediction(prediction);
      
      return result;
    } catch (error) {
      console.error('Error generating predictions:', error);
      
      // Fallback to statistical prediction
      return this.generateStatisticalPrediction(transactions, timeframe);
    }
  }

  /**
   * Statistical anomaly detection
   */
  private detectStatisticalAnomaly(
    transaction: Transaction, 
    categoryTransactions: Transaction[]
  ): { isAnomaly: boolean; score: number; expectedRange: { min: number; max: number; average: number } } {
    if (categoryTransactions.length < 3) {
      return { 
        isAnomaly: false, 
        score: 0, 
        expectedRange: { min: 0, max: 1000, average: 500 } 
      };
    }

    const amounts = categoryTransactions.map(t => parseFloat(t.amount));
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const transactionAmount = parseFloat(transaction.amount);
    const zScore = Math.abs((transactionAmount - mean) / (stdDev || 1));

    // Consider anomaly if z-score > 2 (95% confidence)
    const isAnomaly = zScore > 2;
    const score = Math.min(100, zScore * 25); // Scale to 0-100

    return {
      isAnomaly,
      score,
      expectedRange: {
        min: Math.max(0, mean - 2 * stdDev),
        max: mean + 2 * stdDev,
        average: mean
      }
    };
  }

  /**
   * AI-based anomaly detection
   */
  private async detectAIAnomaly(
    transaction: Transaction,
    recentTransactions: Transaction[]
  ): Promise<{ isAnomaly: boolean; score: number; reasons: string[] }> {
    try {
      const prompt = `
      Analise se esta transação é anômala com base no histórico:
      
      Nova transação: ${transaction.description} - R$ ${transaction.amount} - ${transaction.type}
      
      Histórico recente:
      ${recentTransactions.slice(0, 20).map(t => 
        `${t.description} - R$ ${t.amount} - ${t.type} - ${new Date(t.date).toLocaleDateString()}`
      ).join('\n')}
      
      Retorne JSON:
      {
        "isAnomaly": true_ou_false,
        "score": 0_a_100,
        "reasons": ["motivo1", "motivo2"]
      }
      
      Considere:
      - Valor muito diferente do padrão
      - Estabelecimento incomum
      - Horário fora do padrão
      - Frequência incomum
      `;

      const aiResponse = await aiServiceManager.generateAIResponse(
        prompt,
        'predictive_analysis',
        {
          responseMimeType: "application/json",
          fallbackResponse: '{"isAnomaly": false, "score": 0, "reasons": []}'
        }
      );

      if (aiResponse.success) {
        if (typeof aiResponse.data === 'string') {
          return JSON.parse(aiResponse.data || '{"isAnomaly": false, "score": 0, "reasons": []}');
        } else if (typeof aiResponse.data === 'object') {
          return aiResponse.data;
        }
      }
      
      return { isAnomaly: false, score: 0, reasons: [] };
    } catch (error) {
      console.error('Error in AI anomaly detection:', error);
      return { isAnomaly: false, score: 0, reasons: [] };
    }
  }

  /**
   * Analyze spending patterns from historical data
   */
  private analyzeSpendingPatterns(transactions: Transaction[]) {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const days = Math.max(1, (new Date().getTime() - new Date(transactions[transactions.length - 1]?.date || new Date()).getTime()) / (1000 * 60 * 60 * 24));

    return {
      dailyAverages: {
        expense: totalExpenses / days,
        income: totalIncome / days,
        variable: totalExpenses * 0.3 / days // Assume 30% is variable
      },
      averageIncome: totalIncome / Math.max(1, incomeTransactions.length),
      incomePattern: this.detectIncomePattern(incomeTransactions),
      totalDays: days
    };
  }

  /**
   * Detect income pattern (monthly, bi-weekly, etc.)
   */
  private detectIncomePattern(incomeTransactions: Transaction[]) {
    if (incomeTransactions.length < 2) return { type: 'monthly', days: [1] };

    const dates = incomeTransactions.map(t => new Date(t.date).getDate()).sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i-1]);
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    if (avgInterval <= 7) return { type: 'weekly', days: dates };
    if (avgInterval <= 16) return { type: 'bi-weekly', days: dates };
    return { type: 'monthly', days: dates };
  }

  /**
   * Get day multiplier based on day of week
   */
  private getDayMultiplier(dayOfWeek: number): number {
    // Weekend might have different spending patterns
    const multipliers = [0.8, 1.0, 1.0, 1.0, 1.1, 1.3, 1.2]; // Sun-Sat
    return multipliers[dayOfWeek] || 1.0;
  }

  /**
   * Check if a date is likely an income day
   */
  private isIncomeDay(date: Date, incomePattern: any): boolean {
    const dayOfMonth = date.getDate();
    return incomePattern.days.includes(dayOfMonth);
  }

  /**
   * Get seasonal factor for a date
   */
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth() + 1;
    
    // Brazilian seasonal factors
    const factors = {
      1: 1.2, // Janeiro (férias)
      2: 1.1, // Fevereiro (carnaval)
      3: 1.0, // Março
      4: 1.0, // Abril
      5: 0.9, // Maio
      6: 1.0, // Junho
      7: 1.1, // Julho (férias escolares)
      8: 1.0, // Agosto
      9: 1.0, // Setembro
      10: 1.0, // Outubro
      11: 1.2, // Novembro (Black Friday)
      12: 1.4  // Dezembro (Natal)
    };

    return factors[month] || 1.0;
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(dataPoints: number, predictionDate: Date): number {
    const daysAhead = Math.floor((predictionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    let confidence = Math.min(100, dataPoints * 2); // More data = higher confidence
    confidence -= daysAhead * 0.5; // Farther predictions = lower confidence
    
    return Math.max(10, confidence);
  }

  /**
   * Determine anomaly type
   */
  private determineAnomalyType(
    transaction: Transaction,
    statistical: any,
    ai: any
  ): 'spending_spike' | 'unusual_merchant' | 'timing_anomaly' | 'amount_anomaly' | 'frequency_anomaly' {
    if (statistical.isAnomaly && statistical.score > 75) {
      return 'amount_anomaly';
    }
    
    if (ai.reasons.some(r => r.includes('estabelecimento') || r.includes('merchant'))) {
      return 'unusual_merchant';
    }
    
    if (ai.reasons.some(r => r.includes('horário') || r.includes('timing'))) {
      return 'timing_anomaly';
    }
    
    if (ai.reasons.some(r => r.includes('frequência') || r.includes('frequency'))) {
      return 'frequency_anomaly';
    }
    
    return 'spending_spike';
  }

  /**
   * Determine severity level
   */
  private determineSeverity(statisticalScore: number, aiScore: number): 'info' | 'warning' | 'critical' {
    const maxScore = Math.max(statisticalScore, aiScore);
    
    if (maxScore >= 80) return 'critical';
    if (maxScore >= 60) return 'warning';
    return 'info';
  }

  /**
   * Generate anomaly description
   */
  private generateAnomalyDescription(
    transaction: Transaction,
    statistical: any,
    ai: any
  ): string {
    const reasons = [
      ...(statistical.isAnomaly ? [`Valor fora do padrão normal (${statistical.score.toFixed(1)}% de desvio)`] : []),
      ...ai.reasons
    ];
    
    return `Transação "${transaction.description}" no valor de R$ ${transaction.amount} foi identificada como anômala. Motivos: ${reasons.join(', ')}.`;
  }

  /**
   * Fallback statistical prediction
   */
  private generateStatisticalPrediction(
    transactions: Transaction[],
    timeframe: string
  ): PredictionResult {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const days = Math.max(1, transactions.length / 30); // Rough monthly conversion
    
    const monthlyAverage = totalExpenses / days;
    
    return {
      predictions: {
        next30Days: monthlyAverage,
        next60Days: monthlyAverage * 2,
        next90Days: monthlyAverage * 3
      },
      confidence: 0.6,
      factors: ['Média histórica', 'Padrão de gastos atual'],
      recommendations: ['Monitore gastos variáveis', 'Mantenha orçamento mensal'],
      seasonalTrends: []
    };
  }
}

export const predictiveAnalytics = new PredictiveAnalytics();