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
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, individual, family
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
  inviteStatus: varchar("invite_status").default("pending"), // pending, accepted, declined
  inviteToken: varchar("invite_token"),
  canManageTransactions: boolean("can_manage_transactions").default(false),
  canViewReports: boolean("can_view_reports").default(true),
  monthlyAllowance: decimal("monthly_allowance", { precision: 10, scale: 2 }),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
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

// Notification types enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'budget_limit', 'goal_achieved', 'fixed_expense_due', 'investment_milestone', 
  'ai_insight', 'payment_reminder', 'subscription_renewal', 'family_activity'
]);

export const notificationPriorityEnum = pgEnum('notification_priority', [
  'low', 'medium', 'high', 'urgent'
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  priority: notificationPriorityEnum("priority").default('medium'),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // Additional data like amounts, IDs, etc.
  isRead: boolean("is_read").default(false),
  isActionRequired: boolean("is_action_required").default(false),
  actionUrl: varchar("action_url", { length: 500 }), // URL to redirect for action
  expiresAt: timestamp("expires_at"), // When notification should be auto-removed
  triggeredBy: varchar("triggered_by"), // What triggered this notification (transaction_id, goal_id, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Automated workflow triggers
export const workflowTriggers = pgTable("workflow_triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  triggerType: varchar("trigger_type").notNull(), // budget_exceeded, goal_reached, due_date_approaching
  conditions: jsonb("conditions").notNull(), // Trigger conditions as JSON
  actions: jsonb("actions").notNull(), // Actions to perform as JSON
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email notification preferences
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  budgetAlerts: boolean("budget_alerts").default(true),
  goalNotifications: boolean("goal_notifications").default(true),
  paymentReminders: boolean("payment_reminders").default(true),
  aiInsights: boolean("ai_insights").default(true),
  weeklyReports: boolean("weekly_reports").default(false),
  monthlyReports: boolean("monthly_reports").default(true),
  emailFrequency: varchar("email_frequency").default('daily'), // immediate, daily, weekly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const workflowTriggersRelations = relations(workflowTriggers, ({ one }) => ({
  user: one(users, { fields: [workflowTriggers.userId], references: [users.id] }),
}));

export const emailPreferencesRelations = relations(emailPreferences, ({ one }) => ({
  user: one(users, { fields: [emailPreferences.userId], references: [users.id] }),
}));

// Add to users relations
export const usersRelationsUpdated = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
  fixedExpenses: many(fixedExpenses),
  investments: many(investments),
  budgetGoals: many(budgetGoals),
  familyMembers: many(familyMembers),
  notifications: many(notifications),
  workflowTriggers: many(workflowTriggers),
  emailPreferences: many(emailPreferences),
}));

// Notification types
export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

export type InsertWorkflowTrigger = typeof workflowTriggers.$inferInsert;
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;

export type InsertEmailPreferences = typeof emailPreferences.$inferInsert;
export type EmailPreferences = typeof emailPreferences.$inferSelect;

// Insert schemas for notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertWorkflowTriggerSchema = createInsertSchema(workflowTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggered: true,
});

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
