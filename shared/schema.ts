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

// Account types enum
export const accountTypeEnum = pgEnum('account_type', ['individual', 'family', 'business']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['free', 'individual', 'family', 'business']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'member', 'viewer']);

// Organizations/Companies table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).unique(), // Brazilian company ID
  industry: varchar("industry", { length: 100 }),
  description: text("description"),
  logo: varchar("logo"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family groups table
export const familyGroups = pgTable("family_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  inviteCode: varchar("invite_code", { length: 8 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  accountType: accountTypeEnum("account_type").default("individual"),
  // Campos opcionais para empresas (CPF também pode usar funcionalidades empresariais)
  companyName: varchar("company_name", { length: 200 }),
  cnpj: varchar("cnpj", { length: 18 }),
  industry: varchar("industry", { length: 100 }),
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  role: userRoleEnum("role").default("owner"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("free"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  isActive: boolean("is_active").default(true),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  isDefault: boolean("is_default").default(false),
  categoryType: varchar("category_type").default("personal"), // personal, business, family
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  attachmentUrl: text("attachment_url"),
  isRecurring: boolean("is_recurring").default(false), // Indica se é um lançamento mensal
  dueDay: integer("due_day"), // Dia do mês para vencimento (1-31) - apenas para recorrentes
  totalInstallments: integer("total_installments"), // Total number of installments
  paidInstallments: integer("paid_installments").default(0), // Number of installments paid
  totalValue: decimal("total_value", { precision: 10, scale: 2 }), // Total value of the purchase for installments
  // Business-specific fields
  vendor: varchar("vendor", { length: 200 }), // Supplier/client name
  invoiceNumber: varchar("invoice_number", { length: 100 }), // Invoice reference
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }), // Tax value
  departmentId: varchar("department_id"), // Department/cost center
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  isActive: boolean("is_active").default(true),
  isPaid: boolean("is_paid").default(false),
  lastPaidDate: timestamp("last_paid_date"),
  totalInstallments: integer("total_installments"), // Total number of installments
  paidInstallments: integer("paid_installments").default(0), // Number of installments paid
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  categoryId: varchar("category_id").references(() => categories.id),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business departments for organization structure
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  managerId: varchar("manager_id").references(() => users.id),
  budgetLimit: decimal("budget_limit", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User permissions for organizations
export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  canManageTransactions: boolean("can_manage_transactions").default(false),
  canViewReports: boolean("can_view_reports").default(true),
  canManageUsers: boolean("can_manage_users").default(false),
  canManageBudgets: boolean("can_manage_budgets").default(false),
  canManageCategories: boolean("can_manage_categories").default(false),
  departmentAccess: text("department_access"), // JSON array of department IDs
  monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, { fields: [users.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [users.familyGroupId], references: [familyGroups.id] }),
  categories: many(categories),
  transactions: many(transactions),
  fixedExpenses: many(fixedExpenses),
  investments: many(investments),
  budgetGoals: many(budgetGoals),
  permissions: many(userPermissions),
}));

// Organizations relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  users: many(users),
  departments: many(departments),
  categories: many(categories),
  transactions: many(transactions),
  investments: many(investments),
  budgetGoals: many(budgetGoals),
}));

// Family groups relations
export const familyGroupsRelations = relations(familyGroups, ({ one, many }) => ({
  owner: one(users, { fields: [familyGroups.ownerId], references: [users.id] }),
  members: many(users),
  categories: many(categories),
  transactions: many(transactions),
  investments: many(investments),
  budgetGoals: many(budgetGoals),
}));

// Departments relations
export const departmentsRelations = relations(departments, ({ one }) => ({
  organization: one(organizations, { fields: [departments.organizationId], references: [organizations.id] }),
  manager: one(users, { fields: [departments.managerId], references: [users.id] }),
}));

// User permissions relations
export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, { fields: [userPermissions.userId], references: [users.id] }),
  organization: one(organizations, { fields: [userPermissions.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [userPermissions.familyGroupId], references: [familyGroups.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  organization: one(organizations, { fields: [categories.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [categories.familyGroupId], references: [familyGroups.id] }),
  transactions: many(transactions),
  fixedExpenses: many(fixedExpenses),
  budgetGoals: many(budgetGoals),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  organization: one(organizations, { fields: [transactions.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [transactions.familyGroupId], references: [familyGroups.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

export const fixedExpensesRelations = relations(fixedExpenses, ({ one }) => ({
  user: one(users, { fields: [fixedExpenses.userId], references: [users.id] }),
  organization: one(organizations, { fields: [fixedExpenses.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [fixedExpenses.familyGroupId], references: [familyGroups.id] }),
  category: one(categories, { fields: [fixedExpenses.categoryId], references: [categories.id] }),
}));

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  user: one(users, { fields: [investments.userId], references: [users.id] }),
  organization: one(organizations, { fields: [investments.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [investments.familyGroupId], references: [familyGroups.id] }),
  history: many(investmentHistory),
}));

export const investmentHistoryRelations = relations(investmentHistory, ({ one }) => ({
  investment: one(investments, { fields: [investmentHistory.investmentId], references: [investments.id] }),
}));

export const budgetGoalsRelations = relations(budgetGoals, ({ one }) => ({
  user: one(users, { fields: [budgetGoals.userId], references: [users.id] }),
  organization: one(organizations, { fields: [budgetGoals.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [budgetGoals.familyGroupId], references: [familyGroups.id] }),
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

export type InsertOrganization = typeof organizations.$inferInsert;
export type Organization = typeof organizations.$inferSelect;

export type InsertFamilyGroup = typeof familyGroups.$inferInsert;
export type FamilyGroup = typeof familyGroups.$inferSelect;

export type InsertDepartment = typeof departments.$inferInsert;
export type Department = typeof departments.$inferSelect;

export type InsertUserPermissions = typeof userPermissions.$inferInsert;
export type UserPermissions = typeof userPermissions.$inferSelect;

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

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyGroupSchema = createInsertSchema(familyGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPermissionsSchema = createInsertSchema(userPermissions).omit({
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
