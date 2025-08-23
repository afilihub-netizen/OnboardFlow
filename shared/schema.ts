import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  accountType: varchar("account_type").default("individual"), // individual, family
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction types and payment methods
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);
export const paymentMethodEnum = pgEnum('payment_method', [
  'pix', 'debit_card', 'credit_card', 'cash', 'transfer', 'other'
]);

// Categories for transactions
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }), // Font Awesome icon class
  color: varchar("color", { length: 7 }), // Hex color
  userId: varchar("user_id").references(() => users.id),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  date: timestamp("date").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fixed expenses (monthly recurring)
export const fixedExpenses = pgTable("fixed_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull(), // Day of month (1-31)
  categoryId: varchar("category_id").references(() => categories.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  isPaid: boolean("is_paid").default(false),
  lastPaidDate: timestamp("last_paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investment types
export const investmentTypeEnum = pgEnum('investment_type', [
  'fixed_income', 'real_estate_fund', 'stocks', 'crypto', 'savings', 'other'
]);

// Investments table
export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: investmentTypeEnum("type").notNull(),
  initialAmount: decimal("initial_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investment history for tracking performance
export const investmentHistory = pgTable("investment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investmentId: varchar("investment_id").references(() => investments.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Budget goals
export const budgetGoals = pgTable("budget_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Family members for family accounts
export const familyMembers = pgTable("family_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyAccountId: varchar("family_account_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email"),
  role: varchar("role").default("member"), // admin, member, child
  canManageTransactions: boolean("can_manage_transactions").default(false),
  canViewReports: boolean("can_view_reports").default(true),
  monthlyAllowance: decimal("monthly_allowance", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
  fixedExpenses: many(fixedExpenses),
  investments: many(investments),
  budgetGoals: many(budgetGoals),
  familyMembers: many(familyMembers),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  familyAccount: one(users, { fields: [familyMembers.familyAccountId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
  fixedExpenses: many(fixedExpenses),
  budgetGoals: many(budgetGoals),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

export const fixedExpensesRelations = relations(fixedExpenses, ({ one }) => ({
  user: one(users, { fields: [fixedExpenses.userId], references: [users.id] }),
  category: one(categories, { fields: [fixedExpenses.categoryId], references: [categories.id] }),
}));

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  user: one(users, { fields: [investments.userId], references: [users.id] }),
  history: many(investmentHistory),
}));

export const investmentHistoryRelations = relations(investmentHistory, ({ one }) => ({
  investment: one(investments, { fields: [investmentHistory.investmentId], references: [investments.id] }),
}));

export const budgetGoalsRelations = relations(budgetGoals, ({ one }) => ({
  user: one(users, { fields: [budgetGoals.userId], references: [users.id] }),
  category: one(categories, { fields: [budgetGoals.categoryId], references: [categories.id] }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;

export type InsertFixedExpense = typeof fixedExpenses.$inferInsert;
export type FixedExpense = typeof fixedExpenses.$inferSelect;

export type InsertInvestment = typeof investments.$inferInsert;
export type Investment = typeof investments.$inferSelect;

export type InsertInvestmentHistory = typeof investmentHistory.$inferInsert;
export type InvestmentHistory = typeof investmentHistory.$inferSelect;

export type InsertBudgetGoal = typeof budgetGoals.$inferInsert;
export type BudgetGoal = typeof budgetGoals.$inferSelect;

export type InsertFamilyMember = typeof familyMembers.$inferInsert;
export type FamilyMember = typeof familyMembers.$inferSelect;

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFixedExpenseSchema = createInsertSchema(fixedExpenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetGoalSchema = createInsertSchema(budgetGoals).omit({
  id: true,
  createdAt: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
