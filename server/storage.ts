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
  scenarios,
  automationRules,
  reports,
  predictions,
  accountsPayable,
  accountsReceivable,
  cashflowPredictions,
  financialScores,
  aiInsights,
  anomalyDetections,
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
  type Scenario,
  type InsertScenario,
  type AutomationRule,
  type InsertAutomationRule,
  type Report,
  type InsertReport,
  type Prediction,
  type InsertPrediction,
  type AccountsPayable,
  type InsertAccountsPayable,
  type AccountsReceivable,
  type InsertAccountsReceivable,
  type CashflowPrediction,
  type InsertCashflowPrediction,
  type FinancialScore,
  type InsertFinancialScore,
  type AiInsight,
  type InsertAiInsight,
  type AnomalyDetection,
  type InsertAnomalyDetection,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, sum, count, gt, isNotNull, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(userData: Partial<User>): Promise<User>;
  createUserWithGoogle(userData: Partial<User>): Promise<User>;
  linkGoogleAccount(userId: string, googleId: string): Promise<void>;
  updateUserLastLogin(userId: string): Promise<void>;
  
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

  // Advanced features operations
  // Scenarios
  getScenarios(userId: string, organizationId?: string): Promise<Scenario[]>;
  getScenario(id: string, userId: string): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: string, scenario: Partial<Scenario>): Promise<Scenario | undefined>;
  deleteScenario(id: string): Promise<boolean>;

  // Automation Rules
  getActiveAutomationRules(userId: string, organizationId?: string): Promise<AutomationRule[]>;
  createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule>;
  updateAutomationRuleExecution(ruleId: string): Promise<void>;
  saveAutomationExecution(execution: any): Promise<void>;

  // Predictions
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getCashflowPredictions(userId: string, organizationId?: string): Promise<CashflowPrediction[]>;
  createCashflowPrediction(prediction: InsertCashflowPrediction): Promise<CashflowPrediction>;

  // Financial Scores
  createFinancialScore(score: InsertFinancialScore): Promise<FinancialScore>;
  getLatestFinancialScore(userId: string, organizationId?: string): Promise<FinancialScore | undefined>;

  // AI Insights
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;
  getAiInsights(userId: string, organizationId?: string, limit?: number): Promise<AiInsight[]>;

  // Anomaly Detection
  createAnomalyDetection(anomaly: InsertAnomalyDetection): Promise<AnomalyDetection>;
  getAnomalyDetections(userId: string, organizationId?: string, limit?: number): Promise<AnomalyDetection[]>;

  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReports(userId: string, organizationId?: string): Promise<Report[]>;

  // Helper methods for predictions and analysis
  getTransactionsForPrediction(userId: string, organizationId?: string, days: number): Promise<Transaction[]>;
  getRecentTransactions(userId: string, days: number, organizationId?: string): Promise<Transaction[]>;
  getCategorySpendingForPeriod(userId: string, categoryId: string, timeframe: string, organizationId?: string): Promise<number>;
  getTotalBalance(userId: string, organizationId?: string): Promise<number>;
  updateTransactionCategory(transactionId: string, categoryId: string): Promise<Transaction | undefined>;
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

  // Authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: userData.passwordHash,
        authProvider: userData.authProvider || 'email',
        emailVerified: userData.emailVerified || false,
        profileImageUrl: userData.profileImageUrl,
        accountType: userData.accountType || 'individual',
        isActive: true,
      })
      .returning();
    return user;
  }

  async createUserWithGoogle(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        googleId: userData.googleId,
        authProvider: 'google',
        emailVerified: userData.emailVerified || true,
        profileImageUrl: userData.profileImageUrl,
        accountType: userData.accountType || 'individual',
        isActive: true,
      })
      .returning();
    return user;
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        googleId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
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
    
    // Se mudou para business, criar organização automaticamente
    if (updateData.accountType === 'business' && updatedUser) {
      const existingOrg = await this.getUserOrganization(userId);
      if (!existingOrg) {
        const organization = await this.createOrganization({
          name: updateData.companyName || `${updatedUser.firstName || 'Empresa'} ${updatedUser.lastName || ''}`.trim(),
          cnpj: updateData.cnpj,
          industry: updateData.industry,
          ownerId: userId,
        });
        
        // Atualizar usuário com organizationId
        await db
          .update(users)
          .set({ organizationId: organization.id })
          .where(eq(users.id, userId));
      }
    }
    
    return updatedUser;
  }

  async updateUserStripeInfo(userId: string, stripeData: { stripeCustomerId?: string | null, stripeSubscriptionId?: string | null }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...stripeData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Helper function to get data filter based on user account type
  private async getDataFilter(userId: string): Promise<{
    userId: string;
    organizationId?: string | null;
    familyGroupId?: string | null;
  }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const baseFilter: { userId: string; organizationId?: string | null; familyGroupId?: string | null } = { userId };
    
    if (user.accountType === 'business' && user.organizationId) {
      baseFilter.organizationId = user.organizationId;
    } else if (user.accountType === 'family' && user.familyGroupId) {
      baseFilter.familyGroupId = user.familyGroupId;
    }
    
    return baseFilter;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    const filter = await this.getDataFilter(userId);
    const conditions = [eq(categories.userId, userId)];
    
    if (filter.organizationId) {
      conditions.push(eq(categories.organizationId, filter.organizationId));
    } else if (filter.familyGroupId) {
      conditions.push(eq(categories.familyGroupId, filter.familyGroupId));
    } else {
      // Individual account - exclude business and family categories
      conditions.push(sql`${categories.organizationId} IS NULL`);
      conditions.push(sql`${categories.familyGroupId} IS NULL`);
    }
    
    return await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    // Apply organization/family context to new category
    const filter = await this.getDataFilter(category.userId || '');
    const enrichedCategory = {
      ...category,
      organizationId: filter.organizationId || null,
      familyGroupId: filter.familyGroupId || null,
    };
    
    const [newCategory] = await db.insert(categories).values(enrichedCategory).returning();
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

  // Organization operations
  async getUserOrganization(userId: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.ownerId, userId));
    return organization;
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(orgData)
      .returning();
    return organization;
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

    const filter = await this.getDataFilter(userId);
    const conditions = [eq(transactions.userId, userId)];

    // Apply data isolation based on account type
    if (filter.organizationId) {
      conditions.push(eq(transactions.organizationId, filter.organizationId));
    } else if (filter.familyGroupId) {
      conditions.push(eq(transactions.familyGroupId, filter.familyGroupId));
    } else {
      // Individual account - show transactions that don't belong to any organization or family
      // This includes old transactions that were created before the separation was implemented
      conditions.push(
        or(
          isNull(transactions.organizationId),
          eq(transactions.organizationId, '')
        )
      );
      conditions.push(
        or(
          isNull(transactions.familyGroupId),
          eq(transactions.familyGroupId, '')
        )
      );
    }

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
    // Apply organization/family context to new transaction  
    const filter = await this.getDataFilter(transaction.userId);
    const enrichedTransaction = {
      ...transaction,
      organizationId: filter.organizationId || null,
      familyGroupId: filter.familyGroupId || null,
    };
    
    const [newTransaction] = await db.insert(transactions).values(enrichedTransaction).returning();
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
    const filter = await this.getDataFilter(userId);
    const conditions = [eq(investments.userId, userId)];
    
    if (filter.organizationId) {
      conditions.push(eq(investments.organizationId, filter.organizationId));
    } else if (filter.familyGroupId) {
      conditions.push(eq(investments.familyGroupId, filter.familyGroupId));
    } else {
      // Individual account - exclude business and family investments
      conditions.push(sql`${investments.organizationId} IS NULL`);
      conditions.push(sql`${investments.familyGroupId} IS NULL`);
    }
    
    return await db
      .select()
      .from(investments)
      .where(and(...conditions))
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
    const filter = await this.getDataFilter(userId);
    const conditions = [eq(budgetGoals.userId, userId)];

    // Apply data isolation based on account type
    if (filter.organizationId) {
      conditions.push(eq(budgetGoals.organizationId, filter.organizationId));
    } else if (filter.familyGroupId) {
      conditions.push(eq(budgetGoals.familyGroupId, filter.familyGroupId));
    } else {
      // Individual account - exclude business and family budget goals
      conditions.push(sql`${budgetGoals.organizationId} IS NULL`);
      conditions.push(sql`${budgetGoals.familyGroupId} IS NULL`);
    }

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

  // ===== ADVANCED FEATURES IMPLEMENTATION =====

  // Scenarios operations
  async getScenarios(userId: string, organizationId?: string): Promise<Scenario[]> {
    const conditions = organizationId 
      ? and(eq(scenarios.userId, userId), eq(scenarios.organizationId, organizationId))
      : and(eq(scenarios.userId, userId), isNull(scenarios.organizationId));
    
    return await db
      .select()
      .from(scenarios)
      .where(conditions)
      .orderBy(desc(scenarios.createdAt));
  }

  async createScenario(scenario: InsertScenario): Promise<Scenario> {
    const [newScenario] = await db.insert(scenarios).values(scenario).returning();
    return newScenario;
  }

  async updateScenario(id: string, scenario: Partial<Scenario>): Promise<Scenario | undefined> {
    const [updated] = await db
      .update(scenarios)
      .set({ ...scenario, updatedAt: new Date() })
      .where(eq(scenarios.id, id))
      .returning();
    return updated;
  }

  async getScenario(id: string, userId: string): Promise<Scenario | undefined> {
    const [scenario] = await db
      .select()
      .from(scenarios)
      .where(and(eq(scenarios.id, id), eq(scenarios.userId, userId)))
      .limit(1);
    return scenario;
  }

  async deleteScenario(id: string): Promise<boolean> {
    const result = await db.delete(scenarios).where(eq(scenarios.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Automation Rules operations
  async getActiveAutomationRules(userId: string, organizationId?: string): Promise<AutomationRule[]> {
    const conditions = organizationId 
      ? and(eq(automationRules.userId, userId), eq(automationRules.organizationId, organizationId), eq(automationRules.status, 'active'))
      : and(eq(automationRules.userId, userId), isNull(automationRules.organizationId), eq(automationRules.status, 'active'));
    
    return await db
      .select()
      .from(automationRules)
      .where(conditions)
      .orderBy(desc(automationRules.createdAt));
  }

  async createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule> {
    const [newRule] = await db.insert(automationRules).values(rule).returning();
    return newRule;
  }

  async updateAutomationRule(id: string, userId: string, updateData: Partial<AutomationRule>): Promise<AutomationRule | undefined> {
    const [updated] = await db
      .update(automationRules)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)))
      .returning();
    return updated;
  }

  async toggleAutomationRule(id: string, userId: string): Promise<AutomationRule | undefined> {
    // First get the current status
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)))
      .limit(1);
    
    if (!rule) return undefined;

    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    
    const [updated] = await db
      .update(automationRules)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)))
      .returning();
    
    return updated;
  }

  async deleteAutomationRule(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(automationRules)
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateAutomationRuleExecution(ruleId: string): Promise<void> {
    await db
      .update(automationRules)
      .set({ 
        executionCount: sql`${automationRules.executionCount} + 1`,
        lastExecuted: new Date() 
      })
      .where(eq(automationRules.id, ruleId));
  }

  async saveAutomationExecution(execution: any): Promise<void> {
    // For now, just log the execution - could create a separate table for this
    console.log('Automation execution saved:', execution);
  }

  // Predictions operations
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getCashflowPredictions(userId: string, organizationId?: string): Promise<CashflowPrediction[]> {
    const conditions = organizationId 
      ? and(eq(cashflowPredictions.userId, userId), eq(cashflowPredictions.organizationId, organizationId))
      : and(eq(cashflowPredictions.userId, userId), isNull(cashflowPredictions.organizationId));
    
    return await db
      .select()
      .from(cashflowPredictions)
      .where(conditions)
      .orderBy(cashflowPredictions.predictionDate);
  }

  async createCashflowPrediction(prediction: InsertCashflowPrediction): Promise<CashflowPrediction> {
    const [newPrediction] = await db.insert(cashflowPredictions).values(prediction).returning();
    return newPrediction;
  }

  // Financial Scores operations
  async createFinancialScore(score: InsertFinancialScore): Promise<FinancialScore> {
    const [newScore] = await db.insert(financialScores).values(score).returning();
    return newScore;
  }

  async getLatestFinancialScore(userId: string, organizationId?: string): Promise<FinancialScore | undefined> {
    const conditions = organizationId 
      ? and(eq(financialScores.userId, userId), eq(financialScores.organizationId, organizationId))
      : and(eq(financialScores.userId, userId), isNull(financialScores.organizationId));
    
    const [score] = await db
      .select()
      .from(financialScores)
      .where(conditions)
      .orderBy(desc(financialScores.calculatedAt))
      .limit(1);
    
    return score;
  }

  // AI Insights operations
  async createAiInsight(insight: InsertAiInsight): Promise<AiInsight> {
    const [newInsight] = await db.insert(aiInsights).values(insight).returning();
    return newInsight;
  }

  async getAiInsights(userId: string, organizationId?: string, limit = 50): Promise<AiInsight[]> {
    const conditions = organizationId 
      ? and(eq(aiInsights.userId, userId), eq(aiInsights.organizationId, organizationId))
      : and(eq(aiInsights.userId, userId), isNull(aiInsights.organizationId));
    
    return await db
      .select()
      .from(aiInsights)
      .where(conditions)
      .orderBy(desc(aiInsights.createdAt))
      .limit(limit);
  }

  // Anomaly Detection operations
  async createAnomalyDetection(anomaly: InsertAnomalyDetection): Promise<AnomalyDetection> {
    const [newAnomaly] = await db.insert(anomalyDetections).values(anomaly).returning();
    return newAnomaly;
  }

  async getAnomalyDetections(userId: string, organizationId?: string, limit = 50): Promise<AnomalyDetection[]> {
    const conditions = organizationId 
      ? and(eq(anomalyDetections.userId, userId), eq(anomalyDetections.organizationId, organizationId))
      : and(eq(anomalyDetections.userId, userId), isNull(anomalyDetections.organizationId));
    
    return await db
      .select()
      .from(anomalyDetections)
      .where(conditions)
      .orderBy(desc(anomalyDetections.createdAt))
      .limit(limit);
  }

  // Reports operations
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(userId: string, organizationId?: string): Promise<Report[]> {
    const conditions = organizationId 
      ? and(eq(reports.userId, userId), eq(reports.organizationId, organizationId))
      : and(eq(reports.userId, userId), isNull(reports.organizationId));
    
    return await db
      .select()
      .from(reports)
      .where(conditions)
      .orderBy(desc(reports.createdAt));
  }

  // Helper methods for predictions and analysis
  async getTransactionsForPrediction(userId: string, organizationId?: string, days: number): Promise<Transaction[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const conditions = organizationId 
      ? and(eq(transactions.userId, userId), eq(transactions.organizationId, organizationId), gte(transactions.date, startDate))
      : and(eq(transactions.userId, userId), isNull(transactions.organizationId), gte(transactions.date, startDate));
    
    return await db
      .select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.date));
  }

  async getRecentTransactions(userId: string, days: number, organizationId?: string): Promise<Transaction[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const conditions = organizationId 
      ? and(eq(transactions.userId, userId), eq(transactions.organizationId, organizationId), gte(transactions.date, startDate))
      : and(eq(transactions.userId, userId), isNull(transactions.organizationId), gte(transactions.date, startDate));
    
    return await db
      .select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.date));
  }

  async getCategorySpendingForPeriod(userId: string, categoryId: string, timeframe: string, organizationId?: string): Promise<number> {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const conditions = organizationId 
      ? and(
          eq(transactions.userId, userId), 
          eq(transactions.organizationId, organizationId),
          eq(transactions.categoryId, categoryId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate)
        )
      : and(
          eq(transactions.userId, userId), 
          isNull(transactions.organizationId),
          eq(transactions.categoryId, categoryId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate)
        );

    const result = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(conditions);

    return parseFloat(result[0]?.total || '0');
  }

  async getTotalBalance(userId: string, organizationId?: string): Promise<number> {
    const conditions = organizationId 
      ? and(eq(transactions.userId, userId), eq(transactions.organizationId, organizationId))
      : and(eq(transactions.userId, userId), isNull(transactions.organizationId));

    const results = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount)
      })
      .from(transactions)
      .where(conditions)
      .groupBy(transactions.type);

    let balance = 0;
    for (const result of results) {
      const amount = parseFloat(result.total || '0');
      if (result.type === 'income') {
        balance += amount;
      } else {
        balance -= amount;
      }
    }

    return balance;
  }

  async updateTransactionCategory(transactionId: string, categoryId: string): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({ categoryId, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
