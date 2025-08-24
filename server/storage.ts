import {
  users,
  categories,
  transactions,
  fixedExpenses,
  investments,
  investmentHistory,
  budgetGoals,
  organizations,
  familyGroups,
  departments,
  userPermissions,
  notifications,
  workflowTriggers,
  emailPreferences,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type FixedExpense,
  type InsertFixedExpense,
  type Investment,
  type InsertInvestment,
  type InsertInvestmentHistory,
  type InvestmentHistory,
  type BudgetGoal,
  type InsertBudgetGoal,
  type Notification,
  type InsertNotification,
  type WorkflowTrigger,
  type InsertWorkflowTrigger,
  type Organization,
  type InsertOrganization,
  type FamilyGroup,
  type InsertFamilyGroup,
  type Department,
  type InsertDepartment,
  type UserPermissions,
  type InsertUserPermissions,
  type EmailPreferences,
  type InsertEmailPreferences,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, count, gt, isNotNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(userId: string, filters?: {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: 'income' | 'expense';
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Fixed expense operations
  getFixedExpenses(userId: string): Promise<FixedExpense[]>;
  createFixedExpense(expense: InsertFixedExpense): Promise<FixedExpense>;
  updateFixedExpense(id: string, expense: Partial<FixedExpense>): Promise<FixedExpense | undefined>;
  deleteFixedExpense(id: string): Promise<boolean>;
  
  // Investment operations
  getInvestments(userId: string): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: string, investment: Partial<Investment>): Promise<Investment | undefined>;
  deleteInvestment(id: string): Promise<boolean>;
  addInvestmentHistory(history: InsertInvestmentHistory): Promise<InvestmentHistory>;
  
  // Budget goal operations
  getBudgetGoals(userId: string, month?: number, year?: number): Promise<BudgetGoal[]>;
  createBudgetGoal(goal: InsertBudgetGoal): Promise<BudgetGoal>;
  updateBudgetGoal(id: string, goal: Partial<BudgetGoal>): Promise<BudgetGoal | undefined>;
  deleteBudgetGoal(id: string): Promise<boolean>;
  
  // Financial summary operations
  getFinancialSummary(userId: string, startDate: Date, endDate: Date): Promise<{
    totalIncome: string;
    totalExpenses: string;
    balance: string;
    transactionCount: number;
    categoryBreakdown: Array<{ categoryName: string; total: string; count: number; }>;
  }>;

  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  
  // Family group operations
  getFamilyGroup(id: string): Promise<FamilyGroup | undefined>;
  createFamilyGroup(familyGroup: InsertFamilyGroup): Promise<FamilyGroup>;
  
  // Notification operations
  getNotifications(userId: string, filters?: { isRead?: boolean; limit?: number }): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Workflow trigger operations
  getWorkflowTriggers(userId: string): Promise<WorkflowTrigger[]>;
  createWorkflowTrigger(trigger: InsertWorkflowTrigger): Promise<WorkflowTrigger>;
  updateWorkflowTrigger(id: string, trigger: Partial<WorkflowTrigger>): Promise<WorkflowTrigger | undefined>;
  deleteWorkflowTrigger(id: string): Promise<boolean>;
  
  // Email preferences operations
  getEmailPreferences(userId: string): Promise<EmailPreferences | undefined>;
  upsertEmailPreferences(preferences: InsertEmailPreferences & { userId: string }): Promise<EmailPreferences>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, updateData: {
    accountType?: 'individual' | 'family' | 'business';
    companyName?: string;
    cnpj?: string;
    industry?: string;
  }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Transaction operations
  async getTransactions(userId: string, filters: {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: 'income' | 'expense';
    limit?: number;
    offset?: number;
  } = {}): Promise<Transaction[]> {
    const {
      categoryId,
      startDate,
      endDate,
      type,
      limit = 50,
      offset = 0
    } = filters;

    const conditions = [eq(transactions.userId, userId)];

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }
    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }
    if (type) {
      conditions.push(eq(transactions.type, type));
    }

    return await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Financial Health Score calculation
  async calculateFinancialHealthScore(userId: string) {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get financial data for the last 3 months
    const summary = await this.getFinancialSummary(userId, threeMonthsAgo, now);
    const transactions = await this.getTransactions(userId, { 
      startDate: threeMonthsAgo, 
      endDate: now, 
      limit: 1000 
    });
    const budgetGoals = await this.getBudgetGoals(userId);

    const totalIncome = parseFloat(summary.totalIncome);
    const totalExpenses = parseFloat(summary.totalExpenses);
    const balance = parseFloat(summary.balance);

    // Calculate various financial health metrics
    let score = 0;
    const maxScore = 100;
    const recommendations = [];

    // 1. Income vs Expenses Ratio (25 points)
    const incomeExpenseRatio = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
    if (incomeExpenseRatio >= 0.3) {
      score += 25; // Excellent savings rate
    } else if (incomeExpenseRatio >= 0.2) {
      score += 20; // Good savings rate
      recommendations.push("Tente aumentar sua taxa de poupança para 30% da renda.");
    } else if (incomeExpenseRatio >= 0.1) {
      score += 15; // Fair savings rate
      recommendations.push("Sua taxa de poupança está baixa. Tente reduzir gastos desnecessários.");
    } else if (incomeExpenseRatio >= 0) {
      score += 10; // Breaking even
      recommendations.push("Você está gastando quase toda sua renda. Crie um orçamento para controlar gastos.");
    } else {
      score += 0; // Spending more than earning
      recommendations.push("URGENTE: Você está gastando mais do que ganha. Revise seus gastos imediatamente.");
    }

    // 2. Spending Consistency (20 points)
    const monthlyExpenses = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthTransactions = transactions.filter(t => 
        t.type === 'expense' && 
        new Date(t.date) >= monthStart && 
        new Date(t.date) <= monthEnd
      );
      const monthTotal = monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      monthlyExpenses.push(monthTotal);
    }

    if (monthlyExpenses.length >= 2) {
      const avgExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp, 0) / monthlyExpenses.length;
      const variance = monthlyExpenses.reduce((sum, exp) => sum + Math.pow(exp - avgExpenses, 2), 0) / monthlyExpenses.length;
      const consistencyScore = avgExpenses > 0 ? Math.max(0, 20 - (variance / avgExpenses) * 10) : 0;
      score += Math.min(20, consistencyScore);
      
      if (consistencyScore < 10) {
        recommendations.push("Seus gastos variam muito mensalmente. Crie um orçamento mensal consistente.");
      }
    }

    // 3. Budget Goal Adherence (20 points)
    if (budgetGoals.length > 0) {
      let budgetScore = 0;
      let budgetsAnalyzed = 0;

      for (const goal of budgetGoals) {
        const categoryTransactions = transactions.filter(t => 
          t.categoryId === goal.categoryId && 
          t.type === 'expense' &&
          new Date(t.date) >= currentMonth
        );
        const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const target = parseFloat(goal.targetAmount);
        
        if (target > 0) {
          const adherence = Math.max(0, 1 - (spent / target));
          budgetScore += adherence * 20;
          budgetsAnalyzed++;
        }
      }

      if (budgetsAnalyzed > 0) {
        score += budgetScore / budgetsAnalyzed;
      } else {
        score += 10;
        recommendations.push("Configure metas de orçamento para melhor controle financeiro.");
      }
    } else {
      recommendations.push("Crie metas de orçamento por categoria para melhor controle dos gastos.");
    }

    // 4. Debt Management (20 points) - Based on installments
    const installmentTransactions = transactions.filter(t => t.totalInstallments && t.totalInstallments > 1);
    const totalDebt = installmentTransactions.reduce((sum, t) => {
      const remaining = (parseFloat(t.totalValue || t.amount) * ((t.totalInstallments ?? 0) - (t.paidInstallments ?? 0))) / (t.totalInstallments ?? 1);
      return sum + remaining;
    }, 0);

    if (totalIncome > 0) {
      const debtToIncomeRatio = totalDebt / (totalIncome / 3); // 3 months income
      if (debtToIncomeRatio <= 0.1) {
        score += 20; // Low debt
      } else if (debtToIncomeRatio <= 0.3) {
        score += 15; // Moderate debt
        recommendations.push("Considere quitar algumas parcelas em aberto para reduzir compromissos.");
      } else if (debtToIncomeRatio <= 0.5) {
        score += 10; // High debt
        recommendations.push("Você tem muitos compromissos parcelados. Evite novas dívidas.");
      } else {
        score += 5; // Very high debt
        recommendations.push("ATENÇÃO: Nível alto de endividamento. Priorize quitar dívidas existentes.");
      }
    }

    // 5. Emergency Fund Indicator (15 points) - Based on positive balance
    const emergencyFundMonths = totalIncome > 0 ? (balance / (totalIncome / 3)) : 0;
    if (emergencyFundMonths >= 6) {
      score += 15; // 6+ months emergency fund
    } else if (emergencyFundMonths >= 3) {
      score += 12; // 3-6 months emergency fund
      recommendations.push("Parabéns! Continue construindo sua reserva de emergência.");
    } else if (emergencyFundMonths >= 1) {
      score += 8; // 1-3 months emergency fund
      recommendations.push("Construa uma reserva de emergência equivalente a 6 meses de gastos.");
    } else if (balance > 0) {
      score += 5; // Some savings
      recommendations.push("Comece a construir uma reserva de emergência. Meta: 6 meses de gastos.");
    } else {
      recommendations.push("PRIORITÁRIO: Crie uma reserva de emergência mesmo que pequena.");
    }

    // Calculate final score and level
    const finalScore = Math.min(maxScore, Math.max(0, Math.round(score)));
    let level = 'Crítico';
    let color = 'red';
    
    if (finalScore >= 80) {
      level = 'Excelente';
      color = 'green';
    } else if (finalScore >= 65) {
      level = 'Bom';
      color = 'blue';
    } else if (finalScore >= 45) {
      level = 'Regular';
      color = 'yellow';
    } else if (finalScore >= 25) {
      level = 'Baixo';
      color = 'orange';
    }

    // Add level-specific recommendations
    if (finalScore >= 80) {
      recommendations.unshift("Parabéns! Você tem uma saúde financeira excelente. Continue assim!");
    } else if (finalScore >= 65) {
      recommendations.unshift("Sua saúde financeira está boa, mas há espaço para melhorar.");
    } else if (finalScore >= 45) {
      recommendations.unshift("Sua situação financeira precisa de atenção. Foque nas recomendações abaixo.");
    } else {
      recommendations.unshift("Sua saúde financeira precisa de melhorias urgentes.");
    }

    return {
      score: finalScore,
      level,
      color,
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      metrics: {
        incomeVsExpenses: {
          ratio: incomeExpenseRatio,
          score: Math.round((incomeExpenseRatio >= 0.3 ? 25 : incomeExpenseRatio >= 0.2 ? 20 : incomeExpenseRatio >= 0.1 ? 15 : incomeExpenseRatio >= 0 ? 10 : 0))
        },
        emergencyFund: {
          months: emergencyFundMonths,
          score: Math.round(emergencyFundMonths >= 6 ? 15 : emergencyFundMonths >= 3 ? 12 : emergencyFundMonths >= 1 ? 8 : balance > 0 ? 5 : 0)
        },
        debtLevel: {
          ratio: totalIncome > 0 ? totalDebt / (totalIncome / 3) : 0,
          score: Math.round(totalIncome > 0 ? (totalDebt / (totalIncome / 3) <= 0.1 ? 20 : totalDebt / (totalIncome / 3) <= 0.3 ? 15 : totalDebt / (totalIncome / 3) <= 0.5 ? 10 : 5) : 0)
        }
      }
    };
  }

  // Get recurring transactions for dashboard
  async getRecurringTransactions(userId: string): Promise<any[]> {
    // Get recurring transactions
    const recurringTransactions = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        dueDay: transactions.dueDay,
        paymentMethod: transactions.paymentMethod,
        date: transactions.date,
        totalInstallments: transactions.totalInstallments,
        paidInstallments: transactions.paidInstallments,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        }
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.isRecurring, true)
      ))
      .orderBy(desc(transactions.createdAt));

    // Get active fixed expenses
    const activeFixedExpenses = await db
      .select({
        id: fixedExpenses.id,
        description: fixedExpenses.name,
        amount: fixedExpenses.amount,
        type: sql`'expense'`.as('type'),
        dueDay: fixedExpenses.dueDay,
        paymentMethod: sql`'recurring'`.as('paymentMethod'),
        date: fixedExpenses.createdAt,
        totalInstallments: fixedExpenses.totalInstallments,
        paidInstallments: fixedExpenses.paidInstallments,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        }
      })
      .from(fixedExpenses)
      .leftJoin(categories, eq(fixedExpenses.categoryId, categories.id))
      .where(and(
        eq(fixedExpenses.userId, userId),
        eq(fixedExpenses.isActive, true)
      ))
      .orderBy(fixedExpenses.dueDay);

    // Combine both types
    return [...recurringTransactions, ...activeFixedExpenses];
  }

  // Get future commitments - transactions with pending installments + fixed expenses
  async getFutureCommitments(userId: string): Promise<any[]> {
    
    // Get transactions with installments where paidInstallments < totalInstallments
    const commitmentTransactions = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        amount: transactions.amount,
        totalValue: transactions.totalValue,
        totalInstallments: transactions.totalInstallments,
        paidInstallments: transactions.paidInstallments,
        paymentMethod: transactions.paymentMethod,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        dueDay: transactions.dueDay,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          isNotNull(transactions.totalInstallments),
          isNotNull(transactions.paidInstallments),
          gt(transactions.totalInstallments, sql`COALESCE(${transactions.paidInstallments}, 0)`)
        )
      )
      .orderBy(desc(transactions.date));

    // Get active fixed expenses (recurring monthly commitments)
    const fixedExpenseCommitments = await db
      .select({
        id: fixedExpenses.id,
        description: fixedExpenses.name,
        amount: fixedExpenses.amount,
        dueDay: fixedExpenses.dueDay,
        categoryId: fixedExpenses.categoryId,
        categoryName: categories.name,
      })
      .from(fixedExpenses)
      .leftJoin(categories, eq(fixedExpenses.categoryId, categories.id))
      .where(
        and(
          eq(fixedExpenses.userId, userId),
          eq(fixedExpenses.isActive, true)
        )
      )
      .orderBy(fixedExpenses.dueDay);

    // Process installment transactions
    const installmentCommitments = commitmentTransactions.map(commitment => {
      const installmentValue = commitment.totalValue && commitment.totalInstallments
        ? (parseFloat(commitment.totalValue) / commitment.totalInstallments).toFixed(2)
        : commitment.amount;

      return {
        ...commitment,
        type: 'installment',
        installmentValue: installmentValue,
        categoryName: commitment.categoryName || 'Sem categoria'
      };
    });

    // Process fixed expenses as monthly commitments
    const monthlyCommitments = fixedExpenseCommitments.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      installmentValue: expense.amount,
      type: 'monthly',
      paymentMethod: 'recurring',
      categoryId: expense.categoryId,
      categoryName: expense.categoryName || 'Sem categoria',
      dueDay: expense.dueDay,
      totalInstallments: null,
      paidInstallments: null,
      totalValue: null,
    }));

    // Combine both types of commitments
    return [...installmentCommitments, ...monthlyCommitments];
  }

  // Fixed expense operations
  async getFixedExpenses(userId: string): Promise<FixedExpense[]> {
    return await db
      .select()
      .from(fixedExpenses)
      .where(and(eq(fixedExpenses.userId, userId), eq(fixedExpenses.isActive, true)))
      .orderBy(fixedExpenses.dueDay);
  }

  async createFixedExpense(expense: InsertFixedExpense): Promise<FixedExpense> {
    const [newExpense] = await db.insert(fixedExpenses).values(expense).returning();
    return newExpense;
  }

  async updateFixedExpense(id: string, expense: Partial<FixedExpense>): Promise<FixedExpense | undefined> {
    const [updated] = await db
      .update(fixedExpenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(fixedExpenses.id, id))
      .returning();
    return updated;
  }

  async deleteFixedExpense(id: string): Promise<boolean> {
    const result = await db
      .update(fixedExpenses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(fixedExpenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Investment operations
  async getInvestments(userId: string): Promise<Investment[]> {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId))
      .orderBy(desc(investments.createdAt));
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestment(id: string, investment: Partial<Investment>): Promise<Investment | undefined> {
    const [updated] = await db
      .update(investments)
      .set({ ...investment, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return updated;
  }

  async deleteInvestment(id: string): Promise<boolean> {
    const result = await db.delete(investments).where(eq(investments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async addInvestmentHistory(history: InsertInvestmentHistory): Promise<InvestmentHistory> {
    const [newHistory] = await db.insert(investmentHistory).values(history).returning();
    return newHistory;
  }

  // Budget goal operations
  async getBudgetGoals(userId: string, month?: number, year?: number): Promise<BudgetGoal[]> {
    const conditions = [eq(budgetGoals.userId, userId)];

    if (month) {
      conditions.push(eq(budgetGoals.month, month));
    }
    if (year) {
      conditions.push(eq(budgetGoals.year, year));
    }

    return await db
      .select()
      .from(budgetGoals)
      .where(and(...conditions))
      .orderBy(budgetGoals.month);
  }

  async createBudgetGoal(goal: InsertBudgetGoal): Promise<BudgetGoal> {
    const [newGoal] = await db.insert(budgetGoals).values(goal).returning();
    return newGoal;
  }

  async updateBudgetGoal(id: string, goal: Partial<BudgetGoal>): Promise<BudgetGoal | undefined> {
    const [updated] = await db
      .update(budgetGoals)
      .set(goal)
      .where(eq(budgetGoals.id, id))
      .returning();
    return updated;
  }

  async deleteBudgetGoal(id: string): Promise<boolean> {
    const result = await db.delete(budgetGoals).where(eq(budgetGoals.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Financial summary operations
  async getFinancialSummary(userId: string, startDate: Date, endDate: Date) {
    const results = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
        count: count(),
        categoryName: categories.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.type, categories.name);

    let totalIncome = '0';
    let totalExpenses = '0';
    let transactionCount = 0;
    const categoryBreakdown: Array<{ categoryName: string; total: string; count: number; }> = [];

    for (const result of results) {
      transactionCount += result.count;
      
      if (result.type === 'income') {
        totalIncome = (parseFloat(totalIncome) + parseFloat(result.total || '0')).toString();
      } else {
        totalExpenses = (parseFloat(totalExpenses) + parseFloat(result.total || '0')).toString();
        categoryBreakdown.push({
          categoryName: result.categoryName || 'Sem categoria',
          total: result.total || '0',
          count: result.count,
        });
      }
    }

    const balance = (parseFloat(totalIncome) - parseFloat(totalExpenses)).toString();

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount,
      categoryBreakdown,
    };
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrganization] = await db.insert(organizations).values(organization).returning();
    return newOrganization;
  }

  // Family group operations
  async getFamilyGroup(id: string): Promise<FamilyGroup | undefined> {
    const [familyGroup] = await db.select().from(familyGroups).where(eq(familyGroups.id, id));
    return familyGroup;
  }

  async createFamilyGroup(familyGroup: InsertFamilyGroup): Promise<FamilyGroup> {
    const [newFamilyGroup] = await db.insert(familyGroups).values(familyGroup).returning();
    return newFamilyGroup;
  }

  // Notification operations
  async getNotifications(userId: string, filters: { isRead?: boolean; limit?: number } = {}): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    if (filters.isRead !== undefined) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.isRead, filters.isRead)));
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  // Workflow trigger operations
  async getWorkflowTriggers(userId: string): Promise<WorkflowTrigger[]> {
    return await db
      .select()
      .from(workflowTriggers)
      .where(eq(workflowTriggers.userId, userId))
      .orderBy(workflowTriggers.name);
  }

  async createWorkflowTrigger(trigger: InsertWorkflowTrigger): Promise<WorkflowTrigger> {
    const [newTrigger] = await db.insert(workflowTriggers).values(trigger).returning();
    return newTrigger;
  }

  async updateWorkflowTrigger(id: string, trigger: Partial<WorkflowTrigger>): Promise<WorkflowTrigger | undefined> {
    const [updated] = await db
      .update(workflowTriggers)
      .set({ ...trigger, updatedAt: new Date() })
      .where(eq(workflowTriggers.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflowTrigger(id: string): Promise<boolean> {
    const result = await db.delete(workflowTriggers).where(eq(workflowTriggers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Email preferences operations
  async getEmailPreferences(userId: string): Promise<EmailPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId));
    return preferences;
  }

  async upsertEmailPreferences(preferences: InsertEmailPreferences & { userId: string }): Promise<EmailPreferences> {
    const [upserted] = await db
      .insert(emailPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: emailPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }
}

export const storage = new DatabaseStorage();
