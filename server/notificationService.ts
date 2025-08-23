import { storage } from './storage';
import { type InsertNotification, type Transaction, type BudgetGoal, type FixedExpense } from '@shared/schema';
import { eq, and, sum, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { transactions, budgetGoals, fixedExpenses, categories, users } from '@shared/schema';

export class NotificationService {
  
  // Check budget limits for a user after transaction
  async checkBudgetLimits(userId: string, newTransaction: Transaction): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get budget goals for current month
    const budgetGoalsForMonth = await storage.getBudgetGoals(userId, currentMonth, currentYear);
    
    if (!budgetGoalsForMonth.length) return;

    // Calculate spending by category for current month
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    
    for (const goal of budgetGoalsForMonth) {
      if (!goal.categoryId) continue;
      
      // Get total spending for this category this month
      const spendingResult = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, goal.categoryId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, firstDayOfMonth),
            lte(transactions.date, lastDayOfMonth)
          )
        );

      const totalSpent = parseFloat(spendingResult[0]?.total || '0');
      const budgetLimit = parseFloat(goal.targetAmount);
      
      const percentageUsed = (totalSpent / budgetLimit) * 100;
      
      // Create notifications based on thresholds
      if (percentageUsed >= 100) {
        await this.createNotification({
          userId,
          type: 'budget_limit',
          priority: 'urgent',
          title: 'Orçamento Ultrapassado!',
          message: `Você ultrapassou o orçamento da categoria em ${percentageUsed.toFixed(0)}%. Gastou R$ ${totalSpent.toFixed(2)} de R$ ${budgetLimit.toFixed(2)}.`,
          metadata: {
            categoryId: goal.categoryId,
            budgetGoalId: goal.id,
            totalSpent,
            budgetLimit,
            percentageUsed: percentageUsed.toFixed(2)
          },
          isActionRequired: true,
          actionUrl: '/goals',
          triggeredBy: newTransaction.id
        });
      } else if (percentageUsed >= 80) {
        await this.createNotification({
          userId,
          type: 'budget_limit',
          priority: 'high',
          title: 'Atenção ao Orçamento',
          message: `Você já gastou ${percentageUsed.toFixed(0)}% do orçamento da categoria. R$ ${totalSpent.toFixed(2)} de R$ ${budgetLimit.toFixed(2)}.`,
          metadata: {
            categoryId: goal.categoryId,
            budgetGoalId: goal.id,
            totalSpent,
            budgetLimit,
            percentageUsed: percentageUsed.toFixed(2)
          },
          actionUrl: '/goals',
          triggeredBy: newTransaction.id
        });
      }
    }
  }

  // Check if budget goal was achieved
  async checkGoalAchievement(userId: string): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const goals = await storage.getBudgetGoals(userId, currentMonth, currentYear);
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    
    for (const goal of goals) {
      if (!goal.categoryId) continue;
      
      // Get spending for this category this month
      const spendingResult = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, goal.categoryId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, firstDayOfMonth),
            lte(transactions.date, lastDayOfMonth)
          )
        );

      const totalSpent = parseFloat(spendingResult[0]?.total || '0');
      const budgetTarget = parseFloat(goal.targetAmount);
      
      // Check if goal was achieved (stayed within budget)
      if (totalSpent <= budgetTarget && totalSpent > 0) {
        const remainingBudget = budgetTarget - totalSpent;
        
        await this.createNotification({
          userId,
          type: 'goal_achieved',
          priority: 'medium',
          title: 'Meta Alcançada! 🎉',
          message: `Parabéns! Você ficou dentro do orçamento da categoria. Economizou R$ ${remainingBudget.toFixed(2)}!`,
          metadata: {
            categoryId: goal.categoryId,
            budgetGoalId: goal.id,
            totalSpent,
            budgetTarget,
            savedAmount: remainingBudget
          },
          actionUrl: '/goals'
        });
      }
    }
  }

  // Check for upcoming fixed expense payments
  async checkUpcomingPayments(userId: string): Promise<void> {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const fixedExpensesData = await storage.getFixedExpenses(userId);
    
    for (const expense of fixedExpensesData) {
      // Calculate due date based on dueDay
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const dueDate = new Date(currentYear, currentMonth, expense.dueDay);
      
      // If due date has passed this month, check next month
      if (dueDate < today) {
        dueDate.setMonth(currentMonth + 1);
      }
      
      if (dueDate >= today && dueDate <= threeDaysFromNow && !expense.isPaid) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await this.createNotification({
          userId,
          type: 'payment_reminder',
          priority: daysUntilDue <= 1 ? 'urgent' : 'high',
          title: daysUntilDue === 0 ? 'Pagamento Vence Hoje!' : `Pagamento em ${daysUntilDue} dias`,
          message: `${expense.name} - R$ ${parseFloat(expense.amount).toFixed(2)} vence em ${daysUntilDue === 0 ? 'hoje' : `${daysUntilDue} dias`}.`,
          metadata: {
            fixedExpenseId: expense.id,
            amount: expense.amount,
            dueDay: expense.dueDay,
            daysUntilDue
          },
          isActionRequired: true,
          actionUrl: '/transactions',
          triggeredBy: expense.id
        });
      }
    }
  }

  // Create AI insight notification
  async createAIInsightNotification(userId: string, insight: string, metadata?: any): Promise<void> {
    await this.createNotification({
      userId,
      type: 'ai_insight',
      priority: 'medium',
      title: 'Nova Análise da IA',
      message: insight,
      metadata: metadata || {},
      actionUrl: '/dashboard'
    });
  }

  // Investment milestone notification
  async checkInvestmentMilestones(userId: string, investmentId: string, newAmount: number): Promise<void> {
    const investments = await storage.getInvestments(userId);
    const investment = investments.find(inv => inv.id === investmentId);
    
    if (!investment) return;
    
    const initialAmount = parseFloat(investment.initialAmount);
    const growthPercentage = ((newAmount - initialAmount) / initialAmount) * 100;
    
    // Notify on significant milestones
    const milestones = [10, 25, 50, 100]; // Growth percentages
    
    for (const milestone of milestones) {
      if (growthPercentage >= milestone) {
        await this.createNotification({
          userId,
          type: 'investment_milestone',
          priority: 'medium',
          title: `Investimento cresceu ${milestone}%! 📈`,
          message: `Seu investimento ${investment.name} cresceu ${growthPercentage.toFixed(1)}%! Valor atual: R$ ${newAmount.toFixed(2)}`,
          metadata: {
            investmentId,
            growthPercentage: growthPercentage.toFixed(1),
            currentAmount: newAmount,
            initialAmount
          },
          actionUrl: '/investments'
        });
      }
    }
  }

  // Private method to create notification
  private async createNotification(notification: InsertNotification): Promise<void> {
    try {
      await storage.createNotification(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Run all automated checks (to be called periodically)
  async runAutomatedChecks(): Promise<void> {
    try {
      // Get all users (in a real app, you might want to batch this)
      const allUsers = await db.select({ id: users.id }).from(users);
      
      for (const user of allUsers) {
        await this.checkUpcomingPayments(user.id);
        await this.checkGoalAchievement(user.id);
      }
    } catch (error) {
      console.error('Error running automated checks:', error);
    }
  }
}

export const notificationService = new NotificationService();