import {
  users,
  categories,
  transactions,
  fixedExpenses,
  investments,
  investmentHistory,
  budgetGoals,
  familyMembers,
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
  type FamilyMember,
  type InsertFamilyMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, count } from "drizzle-orm";

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

  // Family member operations
  getFamilyMembers(familyAccountId: string): Promise<FamilyMember[]>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: string, member: Partial<FamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: string): Promise<boolean>;
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
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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

  // Family member operations
  async getFamilyMembers(familyAccountId: string): Promise<FamilyMember[]> {
    return await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyAccountId, familyAccountId), eq(familyMembers.isActive, true)))
      .orderBy(familyMembers.name);
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const [newMember] = await db.insert(familyMembers).values(member).returning();
    return newMember;
  }

  async updateFamilyMember(id: string, member: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const [updated] = await db
      .update(familyMembers)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(familyMembers.id, id))
      .returning();
    return updated;
  }

  async deleteFamilyMember(id: string): Promise<boolean> {
    const result = await db
      .update(familyMembers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(familyMembers.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
