import { GoogleGenAI } from "@google/genai";
import type { AutomationRule, InsertAutomationRule, Transaction } from "@shared/schema";
import { storage } from "./storage";

// DON'T DELETE THIS COMMENT  
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AutomationTrigger {
  type: 'transaction_amount' | 'category_spend' | 'balance_threshold' | 'date_based' | 'income_received' | 'pattern_detected';
  conditions: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number | string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    category?: string;
    account?: string;
  };
}

export interface AutomationAction {
  type: 'transfer' | 'investment' | 'notification' | 'categorize' | 'create_goal' | 'adjust_budget';
  parameters: {
    amount?: number;
    percentage?: number;
    destination?: string;
    message?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    description?: string;
  };
}

export interface AutomationExecution {
  ruleId: string;
  userId: string;
  triggeredBy: string; // transaction ID, event type, etc.
  executedActions: {
    type: string;
    status: 'success' | 'failed' | 'pending';
    result?: any;
    error?: string;
  }[];
  executedAt: Date;
}

export class AutomationEngine {
  
  /**
   * Create a new automation rule with AI assistance
   */
  async createAutomationRule(
    userId: string,
    userInput: string,
    organizationId?: string
  ): Promise<AutomationRule> {
    // Parse user intent using AI
    const parsedRule = await this.parseUserIntent(userInput, userId);
    
    const automationRule: InsertAutomationRule = {
      userId,
      organizationId,
      name: parsedRule.name,
      description: parsedRule.description,
      type: parsedRule.type,
      trigger: parsedRule.trigger,
      actions: parsedRule.actions,
      isRecurring: parsedRule.isRecurring || false,
      metadata: {
        userInput,
        createdBy: 'ai',
        confidence: parsedRule.confidence
      }
    };

    return await storage.createAutomationRule(automationRule);
  }

  /**
   * Parse user intent using AI to create automation rules
   */
  private async parseUserIntent(userInput: string, userId: string): Promise<{
    name: string;
    description: string;
    type: string;
    trigger: AutomationTrigger;
    actions: AutomationAction[];
    isRecurring: boolean;
    confidence: number;
  }> {
    try {
      const prompt = `
      Analise esta solicitação de automação financeira e crie uma regra estruturada:
      
      Solicitação: "${userInput}"
      
      Retorne um JSON com a estrutura:
      {
        "name": "Nome descritivo da regra",
        "description": "Descrição detalhada",
        "type": "transfer|investment|alert|categorization|payment",
        "trigger": {
          "type": "transaction_amount|category_spend|balance_threshold|date_based|income_received|pattern_detected",
          "conditions": {
            "operator": "gt|lt|eq|gte|lte",
            "value": valor_numerico_ou_string,
            "timeframe": "daily|weekly|monthly|yearly",
            "category": "categoria_se_aplicavel"
          }
        },
        "actions": [{
          "type": "transfer|investment|notification|categorize|create_goal|adjust_budget",
          "parameters": {
            "amount": valor_numerico,
            "percentage": porcentagem,
            "destination": "destino",
            "message": "mensagem",
            "priority": "low|medium|high",
            "category": "categoria",
            "description": "descrição"
          }
        }],
        "isRecurring": true_ou_false,
        "confidence": 0.0_a_1.0
      }
      
      Exemplos de regras:
      - "Se eu gastar mais de R$ 800 em restaurantes, me avise" → trigger: category_spend + notification
      - "Quando receber salário, investir 20% automaticamente" → trigger: income_received + investment
      - "Todo dia 15, transferir R$ 500 para poupança" → trigger: date_based + transfer
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
        },
        contents: prompt,
      });

      const parsed = JSON.parse(response.text || '{}');
      
      return {
        name: parsed.name || "Regra de Automação",
        description: parsed.description || userInput,
        type: (parsed.type as 'transfer' | 'investment' | 'alert' | 'categorization' | 'payment') || "alert",
        trigger: parsed.trigger || {
          type: 'transaction_amount',
          conditions: { operator: 'gt', value: 1000 }
        },
        actions: parsed.actions || [{
          type: 'notification',
          parameters: { message: 'Ação executada', priority: 'medium' }
        }],
        isRecurring: parsed.isRecurring || false,
        confidence: parsed.confidence || 0.7
      };
    } catch (error) {
      console.error('Error parsing user intent:', error);
      
      // Fallback: create basic notification rule
      return {
        name: "Regra de Automação",
        description: userInput,
        type: "alert",
        trigger: {
          type: 'transaction_amount',
          conditions: { operator: 'gt', value: 1000 }
        },
        actions: [{
          type: 'notification',
          parameters: { message: userInput, priority: 'medium' }
        }],
        isRecurring: false,
        confidence: 0.5
      };
    }
  }

  /**
   * Check if any automation rules should be triggered by a transaction
   */
  async checkTriggersForTransaction(transaction: Transaction): Promise<AutomationExecution[]> {
    const rules = await storage.getActiveAutomationRules(transaction.userId, transaction.organizationId);
    const executions: AutomationExecution[] = [];

    for (const rule of rules) {
      const shouldTrigger = await this.evaluateTrigger(rule, transaction);
      
      if (shouldTrigger) {
        const execution = await this.executeRule(rule, transaction);
        executions.push(execution);
      }
    }

    return executions;
  }

  /**
   * Evaluate if a trigger condition is met
   */
  private async evaluateTrigger(rule: AutomationRule, transaction: Transaction): Promise<boolean> {
    const trigger = rule.trigger as AutomationTrigger;
    
    switch (trigger.type) {
      case 'transaction_amount':
        return this.evaluateAmountTrigger(trigger, transaction);
      
      case 'category_spend':
        return await this.evaluateCategorySpendTrigger(trigger, transaction);
      
      case 'balance_threshold':
        return await this.evaluateBalanceTrigger(trigger, transaction);
      
      case 'income_received':
        return transaction.type === 'income' && parseFloat(transaction.amount) >= (trigger.conditions.value as number || 0);
      
      case 'pattern_detected':
        return await this.evaluatePatternTrigger(trigger, transaction);
      
      default:
        return false;
    }
  }

  /**
   * Evaluate amount-based triggers
   */
  private evaluateAmountTrigger(trigger: AutomationTrigger, transaction: Transaction): boolean {
    const amount = parseFloat(transaction.amount);
    const threshold = trigger.conditions.value as number;
    
    switch (trigger.conditions.operator) {
      case 'gt': return amount > threshold;
      case 'gte': return amount >= threshold;
      case 'lt': return amount < threshold;
      case 'lte': return amount <= threshold;
      case 'eq': return amount === threshold;
      default: return false;
    }
  }

  /**
   * Evaluate category spending triggers
   */
  private async evaluateCategorySpendTrigger(trigger: AutomationTrigger, transaction: Transaction): Promise<boolean> {
    if (!trigger.conditions.category || transaction.categoryId !== trigger.conditions.category) {
      return false;
    }

    // Calculate total spending in category for the timeframe
    const timeframe = trigger.conditions.timeframe || 'monthly';
    const totalSpent = await storage.getCategorySpendingForPeriod(
      transaction.userId,
      trigger.conditions.category,
      timeframe,
      transaction.organizationId
    );

    const threshold = trigger.conditions.value as number;
    return this.evaluateAmountCondition(totalSpent + parseFloat(transaction.amount), threshold, trigger.conditions.operator);
  }

  /**
   * Evaluate balance threshold triggers
   */
  private async evaluateBalanceTrigger(trigger: AutomationTrigger, transaction: Transaction): Promise<boolean> {
    const currentBalance = await storage.getTotalBalance(transaction.userId, transaction.organizationId);
    const threshold = trigger.conditions.value as number;
    
    return this.evaluateAmountCondition(currentBalance, threshold, trigger.conditions.operator);
  }

  /**
   * Evaluate pattern detection triggers
   */
  private async evaluatePatternTrigger(trigger: AutomationTrigger, transaction: Transaction): Promise<boolean> {
    // Use AI to detect spending patterns
    try {
      const recentTransactions = await storage.getRecentTransactions(transaction.userId, 30, transaction.organizationId);
      
      const prompt = `
      Analise estas transações recentes e determine se há um padrão preocupante:
      
      Nova transação: ${transaction.description} - R$ ${transaction.amount}
      Transações recentes: ${recentTransactions.slice(0, 10).map((t: Transaction) => 
        `${t.description} - R$ ${t.amount} (${t.date})`
      ).join(', ')}
      
      Responda apenas "true" ou "false" se detectar um padrão anômalo de gastos.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return (response.text?.toLowerCase().includes('true')) || false;
    } catch (error) {
      console.error('Error evaluating pattern trigger:', error);
      return false;
    }
  }

  /**
   * Execute an automation rule
   */
  private async executeRule(rule: AutomationRule, triggeredBy: Transaction): Promise<AutomationExecution> {
    const execution: AutomationExecution = {
      ruleId: rule.id,
      userId: rule.userId,
      triggeredBy: triggeredBy.id,
      executedActions: [],
      executedAt: new Date()
    };

    const actions = rule.actions as AutomationAction[];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, rule, triggeredBy);
        execution.executedActions.push({
          type: action.type,
          status: 'success',
          result
        });
      } catch (error: unknown) {
        execution.executedActions.push({
          type: action.type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update rule execution stats
    await storage.updateAutomationRuleExecution(rule.id);

    // Save execution log
    await storage.saveAutomationExecution(execution);

    return execution;
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: AutomationAction, rule: AutomationRule, transaction: Transaction): Promise<any> {
    switch (action.type) {
      case 'notification':
        return await this.executeNotificationAction(action, rule, transaction);
      
      case 'transfer':
        return await this.executeTransferAction(action, rule, transaction);
      
      case 'investment':
        return await this.executeInvestmentAction(action, rule, transaction);
      
      case 'categorize':
        return await this.executeCategorizeAction(action, rule, transaction);
      
      case 'create_goal':
        return await this.executeCreateGoalAction(action, rule, transaction);
      
      case 'adjust_budget':
        return await this.executeAdjustBudgetAction(action, rule, transaction);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute notification action
   */
  private async executeNotificationAction(action: AutomationAction, rule: AutomationRule, transaction: Transaction) {
    const notification = {
      userId: rule.userId,
      type: 'ai_insight' as const,
      priority: (action.parameters.priority || 'medium') as 'low' | 'medium' | 'high',
      title: `Automação: ${rule.name}`,
      message: action.parameters.message || `Regra "${rule.name}" foi ativada pela transação: ${transaction.description}`,
      metadata: {
        ruleId: rule.id,
        transactionId: transaction.id,
        amount: transaction.amount
      },
      isActionRequired: false
    };

    return await storage.createNotification(notification);
  }

  /**
   * Execute transfer action
   */
  private async executeTransferAction(action: AutomationAction, rule: AutomationRule, transaction: Transaction) {
    // Calculate transfer amount
    let transferAmount = action.parameters.amount || 0;
    
    if (action.parameters.percentage) {
      transferAmount = parseFloat(transaction.amount) * (action.parameters.percentage / 100);
    }

    // Create transfer transaction (simplified)
    const transferTransaction = {
      userId: rule.userId,
      organizationId: rule.organizationId,
      description: `Transferência automática: ${rule.name}`,
      amount: transferAmount.toString(),
      type: 'expense' as const,
      paymentMethod: 'transfer' as const,
      date: new Date(),
      categoryId: null
    };

    return await storage.createTransaction(transferTransaction);
  }

  /**
   * Execute investment action
   */
  private async executeInvestmentAction(action: AutomationAction, rule: AutomationRule, transaction: Transaction) {
    let investmentAmount = action.parameters.amount || 0;
    
    if (action.parameters.percentage) {
      investmentAmount = parseFloat(transaction.amount) * (action.parameters.percentage / 100);
    }

    const investment = {
      userId: rule.userId,
      organizationId: rule.organizationId,
      name: `Investimento automático: ${rule.name}`,
      type: 'other' as const,
      initialAmount: investmentAmount.toString(),
      currentAmount: investmentAmount.toString(),
      purchaseDate: new Date(),
      notes: `Criado pela automação: ${rule.name}`
    };

    return await storage.createInvestment(investment);
  }

  /**
   * Execute categorization action
   */
  private async executeCategorizeAction(action: AutomationAction, rule: AutomationRule, transaction: Transaction) {
    if (!action.parameters.category) {
      throw new Error('Category not specified for categorization action');
    }

    return await storage.updateTransactionCategory(transaction.id, action.parameters.category);
  }

  /**
   * Execute create goal action
   */
  private async executeCreateGoalAction(action: AutomationAction, rule: AutomationRule, transaction: Transaction) {
    const goal = {
      userId: rule.userId,
      organizationId: rule.organizationId,
      categoryId: transaction.categoryId,
      targetAmount: (action.parameters.amount || 1000).toString(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };

    return await storage.createBudgetGoal(goal);
  }

  /**
   * Execute budget adjustment action
   */
  private async executeAdjustBudgetAction(action: AutomationAction, rule: AutomationRule, transaction: Transaction) {
    // Implementation would depend on budget adjustment logic
    // For now, create a notification about the need to adjust budget
    return await this.executeNotificationAction({
      type: 'notification',
      parameters: {
        message: `Considere ajustar o orçamento da categoria ${transaction.categoryId} devido a gastos elevados`,
        priority: 'high'
      }
    }, rule, transaction);
  }

  /**
   * Helper method to evaluate amount conditions
   */
  private evaluateAmountCondition(amount: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt': return amount > threshold;
      case 'gte': return amount >= threshold;
      case 'lt': return amount < threshold;
      case 'lte': return amount <= threshold;
      case 'eq': return amount === threshold;
      default: return false;
    }
  }

  /**
   * Get predefined automation templates
   */
  static getAutomationTemplates(): Record<string, Partial<InsertAutomationRule>> {
    return {
      'savings_rule': {
        name: 'Regra de Poupança 50/30/20',
        description: 'Automaticamente transfere 20% da renda para poupança',
        type: 'transfer',
        trigger: {
          type: 'income_received',
          conditions: { operator: 'gte', value: 1000 }
        },
        actions: [{
          type: 'transfer',
          parameters: { percentage: 20, destination: 'savings' }
        }],
        isRecurring: true
      },
      'overspend_alert': {
        name: 'Alerta de Gasto Excessivo',
        description: 'Notifica quando gasto em uma categoria excede limite',
        type: 'alert',
        trigger: {
          type: 'category_spend',
          conditions: { operator: 'gt', value: 1000, timeframe: 'monthly' }
        },
        actions: [{
          type: 'notification',
          parameters: { 
            message: 'Você excedeu seu limite de gastos nesta categoria',
            priority: 'high'
          }
        }]
      },
      'investment_roundup': {
        name: 'Arredondamento para Investimento',
        description: 'Investe o "troco" das compras automaticamente',
        type: 'investment',
        trigger: {
          type: 'transaction_amount',
          conditions: { operator: 'gt', value: 10 }
        },
        actions: [{
          type: 'investment',
          parameters: { description: 'Investimento do troco arredondado' }
        }],
        isRecurring: true
      }
    };
  }
}

export const automationEngine = new AutomationEngine();