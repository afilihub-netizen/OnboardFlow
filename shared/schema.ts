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

// Authentication provider enum
export const authProviderEnum = pgEnum('auth_provider', ['email', 'google', 'replit']);

// User storage table with support for multiple auth providers
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Authentication fields
  passwordHash: varchar("password_hash"), // For email/password auth
  authProvider: authProviderEnum("auth_provider").default("email"),
  googleId: varchar("google_id").unique(), // For Google OAuth
  replitId: varchar("replit_id").unique(), // For existing Replit auth (backward compatibility)
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Account settings
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
  lastLoginAt: timestamp("last_login_at"),
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
  assets: many(assets),
  subscriptions: many(subscriptions),
  goals: many(goals),
  approvals: many(approvals),
  auditLogs: many(auditLogs),
}));

// Notification types
export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

export type InsertWorkflowTrigger = typeof workflowTriggers.$inferInsert;
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;

export type InsertEmailPreferences = typeof emailPreferences.$inferInsert;
export type EmailPreferences = typeof emailPreferences.$inferSelect;

// Approval workflows for business
export const approvalStatusEnum = pgEnum('approval_status', ['draft', 'pending', 'approved', 'rejected', 'cancelled']);

export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  entityType: varchar("entity_type").notNull(), // transaction, expense, etc
  entityId: varchar("entity_id").notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }),
  status: approvalStatusEnum("status").default('pending'),
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").default(1),
  approverId: varchar("approver_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  comments: text("comments"),
  policy: jsonb("policy"), // Approval policy rules
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs for compliance
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: varchar("entity_id"),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Educational content for Nexus Academy
export const educationalContent = pgTable("educational_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  contentType: varchar("content_type").default('tip'), // tip, guide, warning, insight
  triggerConditions: jsonb("trigger_conditions"), // When to show this content
  targetAudience: varchar("target_audience").default('all'), // beginner, intermediate, advanced, all
  category: varchar("category", { length: 100 }), // budgeting, investing, debt, etc
  priority: integer("priority").default(3),
  isActive: boolean("is_active").default(true),
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 4 }),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User interactions with educational content
export const userEducationInteractions = pgTable("user_education_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentId: varchar("content_id").references(() => educationalContent.id).notNull(),
  interactionType: varchar("interaction_type").notNull(), // viewed, clicked, dismissed, saved
  timestamp: timestamp("timestamp").defaultNow(),
});

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

// Relations will be defined at the end of the file

// ===== NEXO ADVANCED FEATURES SCHEMA =====

// Asset types for patrimony management
export const assetTypeEnum = pgEnum('asset_type', ['vehicle', 'real_estate', 'crypto', 'bank_account', 'other']);
export const assetStatusEnum = pgEnum('asset_status', ['active', 'sold', 'inactive']);

// Assets table (vehicles, real estate, crypto, etc.)
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  name: varchar("name", { length: 200 }).notNull(),
  type: assetTypeEnum("type").notNull(),
  status: assetStatusEnum("status").default('active'),
  purchaseValue: decimal("purchase_value", { precision: 14, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 14, scale: 2 }).notNull(),
  valuationSource: varchar("valuation_source", { length: 100 }), // FIPE, manual, API
  metadata: jsonb("metadata"), // JSON with asset-specific data (year, brand, model, etc.)
  description: text("description"),
  purchaseDate: timestamp("purchase_date").notNull(),
  lastValuation: timestamp("last_valuation").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription/recurring payments detector
export const subscriptionActiveStatusEnum = pgEnum('subscription_active_status', ['active', 'cancelled', 'paused']);

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  merchant: varchar("merchant", { length: 200 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('BRL'),
  frequency: varchar("frequency").notNull(), // monthly, yearly, weekly
  status: subscriptionActiveStatusEnum("status").default('active'),
  nextChargeDate: timestamp("next_charge_date"),
  lastChargeDate: timestamp("last_charge_date"),
  categoryId: varchar("category_id").references(() => categories.id),
  detectedAt: timestamp("detected_at").defaultNow(),
  confirmedByUser: boolean("confirmed_by_user").default(false),
  usageScore: integer("usage_score"), // 1-10 based on user activity
  cancellationUrl: varchar("cancellation_url", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Goals and Vaults system
export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'paused', 'cancelled']);
export const goalTypeEnum = pgEnum('goal_type', ['emergency_fund', 'vacation', 'house_purchase', 'retirement', 'education', 'custom']);

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  familyGroupId: varchar("family_group_id").references(() => familyGroups.id),
  name: varchar("name", { length: 200 }).notNull(),
  type: goalTypeEnum("type").notNull(),
  status: goalStatusEnum("status").default('active'),
  targetAmount: decimal("target_amount", { precision: 14, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 14, scale: 2 }).default('0'),
  targetDate: timestamp("target_date"),
  priority: integer("priority").default(3), // 1-5 scale
  autoAllocation: boolean("auto_allocation").default(false),
  allocationRules: jsonb("allocation_rules"), // Rules for automatic money allocation
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vault links for multi-account goals
export const vaultLinks = pgTable("vault_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").references(() => goals.id).notNull(),
  accountInfo: jsonb("account_info").notNull(), // {bank, account, allocation_percentage}
  allocationPercentage: decimal("allocation_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scenario status enum for simulation tracking
export const scenarioStatusEnum = pgEnum('scenario_status', ['draft', 'active', 'completed', 'archived']);
export const scenarioTypeEnum = pgEnum('scenario_type', ['retirement', 'house_purchase', 'emergency_fund', 'business_investment', 'custom']);

// Financial Scenarios for simulation
export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: scenarioTypeEnum("type").notNull(),
  status: scenarioStatusEnum("status").default('draft'),
  targetAmount: decimal("target_amount", { precision: 15, scale: 2 }),
  targetDate: timestamp("target_date"),
  monthlyContribution: decimal("monthly_contribution", { precision: 10, scale: 2 }),
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }), // Annual return percentage
  riskTolerance: varchar("risk_tolerance"), // conservative, moderate, aggressive
  parameters: jsonb("parameters"), // Scenario-specific parameters
  results: jsonb("results"), // Simulation results
  probability: decimal("probability", { precision: 5, scale: 2 }), // Success probability
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Automation rules for intelligent financial automation
export const automationStatusEnum = pgEnum('automation_status', ['active', 'paused', 'completed', 'failed']);
export const automationTypeEnum = pgEnum('automation_type', ['transfer', 'investment', 'alert', 'categorization', 'payment']);

export const automationRules = pgTable("automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: automationTypeEnum("type").notNull(),
  status: automationStatusEnum("status").default('active'),
  trigger: jsonb("trigger").notNull(), // Trigger conditions
  actions: jsonb("actions").notNull(), // Actions to execute
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  nextExecution: timestamp("next_execution"),
  maxExecutions: integer("max_executions"), // Optional limit
  isRecurring: boolean("is_recurring").default(false),
  metadata: jsonb("metadata"), // Additional configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Generated reports storage
export const reportStatusEnum = pgEnum('report_status', ['generating', 'completed', 'failed']);
export const reportTypeEnum = pgEnum('report_type', ['monthly', 'quarterly', 'annual', 'custom', 'cashflow', 'profitability']);

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  title: varchar("title", { length: 200 }).notNull(),
  type: reportTypeEnum("type").notNull(),
  status: reportStatusEnum("status").default('generating'),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  content: text("content"), // Generated narrative content
  data: jsonb("data"), // Report data and charts
  insights: jsonb("insights"), // AI-generated insights
  fileUrl: varchar("file_url"), // PDF download URL
  generatedBy: varchar("generated_by").default('ai'), // ai, user, scheduled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Predictive analysis results
export const predictionTypeEnum = pgEnum('prediction_type', ['cashflow', 'expense', 'income', 'investment', 'anomaly']);

export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  type: predictionTypeEnum("type").notNull(),
  timeframe: varchar("timeframe").notNull(), // 30d, 60d, 90d, 1y
  prediction: jsonb("prediction").notNull(), // Prediction data
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // Confidence percentage
  actualValue: decimal("actual_value", { precision: 15, scale: 2 }), // For accuracy tracking
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // Calculated accuracy
  metadata: jsonb("metadata"), // Additional prediction context
  createdAt: timestamp("created_at").defaultNow(),
  validUntil: timestamp("valid_until").notNull(),
});

// Accounts Payable (Business)
export const payableStatusEnum = pgEnum('payable_status', ['pending', 'paid', 'overdue', 'cancelled']);

export const accountsPayable = pgTable("accounts_payable", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  vendorName: varchar("vendor_name", { length: 200 }).notNull(),
  vendorEmail: varchar("vendor_email"),
  vendorPhone: varchar("vendor_phone"),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  status: payableStatusEnum("status").default('pending'),
  categoryId: varchar("category_id").references(() => categories.id),
  departmentId: varchar("department_id").references(() => departments.id),
  paidDate: timestamp("paid_date"),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }),
  paymentMethod: paymentMethodEnum("payment_method"),
  attachmentUrl: varchar("attachment_url"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts Receivable (Business)
export const receivableStatusEnum = pgEnum('receivable_status', ['pending', 'received', 'overdue', 'cancelled']);

export const accountsReceivable = pgTable("accounts_receivable", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  status: receivableStatusEnum("status").default('pending'),
  categoryId: varchar("category_id").references(() => categories.id),
  departmentId: varchar("department_id").references(() => departments.id),
  receivedDate: timestamp("received_date"),
  receivedAmount: decimal("received_amount", { precision: 15, scale: 2 }),
  paymentMethod: paymentMethodEnum("payment_method"),
  pixQRCode: text("pix_qr_code"), // QR code for PIX payments
  attachmentUrl: varchar("attachment_url"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cashflow predictions for business planning
export const cashflowPredictions = pgTable("cashflow_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  predictionDate: timestamp("prediction_date").notNull(),
  predictedInflow: decimal("predicted_inflow", { precision: 15, scale: 2 }).notNull(),
  predictedOutflow: decimal("predicted_outflow", { precision: 15, scale: 2 }).notNull(),
  predictedBalance: decimal("predicted_balance", { precision: 15, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  factors: jsonb("factors"), // Contributing factors
  actualInflow: decimal("actual_inflow", { precision: 15, scale: 2 }),
  actualOutflow: decimal("actual_outflow", { precision: 15, scale: 2 }),
  actualBalance: decimal("actual_balance", { precision: 15, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial health scores history
export const financialScores = pgTable("financial_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  score: integer("score").notNull(), // 0-100
  level: varchar("level").notNull(), // poor, fair, good, excellent
  factors: jsonb("factors").notNull(), // Detailed breakdown
  recommendations: jsonb("recommendations"), // AI recommendations
  improvements: jsonb("improvements"), // Improvement tracking
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// AI-generated insights storage
export const insightTypeEnum = pgEnum('insight_type', ['opportunity', 'alert', 'recommendation', 'trend', 'achievement']);
export const insightPriorityEnum = pgEnum('insight_priority', ['low', 'medium', 'high', 'critical']);

export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  type: insightTypeEnum("type").notNull(),
  priority: insightPriorityEnum("priority").default('medium'),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  impact: decimal("impact", { precision: 15, scale: 2 }), // Potential financial impact
  actionRequired: boolean("action_required").default(false),
  actionUrl: varchar("action_url"), // URL for taking action
  dataSource: varchar("data_source"), // What triggered this insight
  metadata: jsonb("metadata"), // Additional context
  isRead: boolean("is_read").default(false),
  isActedUpon: boolean("is_acted_upon").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Anomaly detection results
export const anomalyTypeEnum = pgEnum('anomaly_type', ['spending_spike', 'unusual_merchant', 'timing_anomaly', 'amount_anomaly', 'frequency_anomaly']);
export const anomalySeverityEnum = pgEnum('anomaly_severity', ['info', 'warning', 'critical']);

export const anomalyDetections = pgTable("anomaly_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  type: anomalyTypeEnum("type").notNull(),
  severity: anomalySeverityEnum("severity").default('warning'),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  anomalyScore: decimal("anomaly_score", { precision: 5, scale: 2 }), // 0-100
  expectedValue: decimal("expected_value", { precision: 15, scale: 2 }),
  actualValue: decimal("actual_value", { precision: 15, scale: 2 }),
  deviation: decimal("deviation", { precision: 15, scale: 2 }),
  context: jsonb("context"), // Additional context data
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== RELATIONS FOR NEW ADVANCED FEATURES =====

export const scenariosRelations = relations(scenarios, ({ one }) => ({
  user: one(users, { fields: [scenarios.userId], references: [users.id] }),
  organization: one(organizations, { fields: [scenarios.organizationId], references: [organizations.id] }),
}));

export const automationRulesRelations = relations(automationRules, ({ one }) => ({
  user: one(users, { fields: [automationRules.userId], references: [users.id] }),
  organization: one(organizations, { fields: [automationRules.organizationId], references: [organizations.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  organization: one(organizations, { fields: [reports.organizationId], references: [organizations.id] }),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, { fields: [predictions.userId], references: [users.id] }),
  organization: one(organizations, { fields: [predictions.organizationId], references: [organizations.id] }),
}));

export const accountsPayableRelations = relations(accountsPayable, ({ one }) => ({
  organization: one(organizations, { fields: [accountsPayable.organizationId], references: [organizations.id] }),
  category: one(categories, { fields: [accountsPayable.categoryId], references: [categories.id] }),
  department: one(departments, { fields: [accountsPayable.departmentId], references: [departments.id] }),
  createdBy: one(users, { fields: [accountsPayable.createdBy], references: [users.id] }),
}));

export const accountsReceivableRelations = relations(accountsReceivable, ({ one }) => ({
  organization: one(organizations, { fields: [accountsReceivable.organizationId], references: [organizations.id] }),
  category: one(categories, { fields: [accountsReceivable.categoryId], references: [categories.id] }),
  department: one(departments, { fields: [accountsReceivable.departmentId], references: [departments.id] }),
  createdBy: one(users, { fields: [accountsReceivable.createdBy], references: [users.id] }),
}));

export const cashflowPredictionsRelations = relations(cashflowPredictions, ({ one }) => ({
  user: one(users, { fields: [cashflowPredictions.userId], references: [users.id] }),
  organization: one(organizations, { fields: [cashflowPredictions.organizationId], references: [organizations.id] }),
}));

export const financialScoresRelations = relations(financialScores, ({ one }) => ({
  user: one(users, { fields: [financialScores.userId], references: [users.id] }),
  organization: one(organizations, { fields: [financialScores.organizationId], references: [organizations.id] }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, { fields: [aiInsights.userId], references: [users.id] }),
  organization: one(organizations, { fields: [aiInsights.organizationId], references: [organizations.id] }),
}));

export const anomalyDetectionsRelations = relations(anomalyDetections, ({ one }) => ({
  user: one(users, { fields: [anomalyDetections.userId], references: [users.id] }),
  organization: one(organizations, { fields: [anomalyDetections.organizationId], references: [organizations.id] }),
  transaction: one(transactions, { fields: [anomalyDetections.transactionId], references: [transactions.id] }),
  resolvedBy: one(users, { fields: [anomalyDetections.resolvedBy], references: [users.id] }),
}));

// ===== TYPES FOR NEW ADVANCED FEATURES =====

export type InsertScenario = typeof scenarios.$inferInsert;
export type Scenario = typeof scenarios.$inferSelect;

export type InsertAutomationRule = typeof automationRules.$inferInsert;
export type AutomationRule = typeof automationRules.$inferSelect;

export type InsertReport = typeof reports.$inferInsert;
export type Report = typeof reports.$inferSelect;

export type InsertPrediction = typeof predictions.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;

export type InsertAccountsPayable = typeof accountsPayable.$inferInsert;
export type AccountsPayable = typeof accountsPayable.$inferSelect;

export type InsertAccountsReceivable = typeof accountsReceivable.$inferInsert;
export type AccountsReceivable = typeof accountsReceivable.$inferSelect;

export type InsertCashflowPrediction = typeof cashflowPredictions.$inferInsert;
export type CashflowPrediction = typeof cashflowPredictions.$inferSelect;

export type InsertFinancialScore = typeof financialScores.$inferInsert;
export type FinancialScore = typeof financialScores.$inferSelect;

export type InsertAiInsight = typeof aiInsights.$inferInsert;
export type AiInsight = typeof aiInsights.$inferSelect;

export type InsertAnomalyDetection = typeof anomalyDetections.$inferInsert;
export type AnomalyDetection = typeof anomalyDetections.$inferSelect;

// ===== INSERT SCHEMAS FOR NEW ADVANCED FEATURES =====

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  executionCount: true,
  lastExecuted: true,
  nextExecution: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

export const insertAccountsPayableSchema = createInsertSchema(accountsPayable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountsReceivableSchema = createInsertSchema(accountsReceivable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCashflowPredictionSchema = createInsertSchema(cashflowPredictions).omit({
  id: true,
  createdAt: true,
});

export const insertFinancialScoreSchema = createInsertSchema(financialScores).omit({
  id: true,
  calculatedAt: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
});

export const insertAnomalyDetectionSchema = createInsertSchema(anomalyDetections).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Insert schemas for Nexo tables
export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVaultLinkSchema = createInsertSchema(vaultLinks).omit({
  id: true,
  createdAt: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertEducationalContentSchema = createInsertSchema(educationalContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New types
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

export type VaultLink = typeof vaultLinks.$inferSelect;
export type InsertVaultLink = typeof vaultLinks.$inferInsert;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type EducationalContent = typeof educationalContent.$inferSelect;
export type InsertEducationalContent = typeof educationalContent.$inferInsert;

export type UserEducationInteraction = typeof userEducationInteractions.$inferSelect;

// ===== ALL RELATIONS (defined at the end) =====

// Relations for new Nexo tables
export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, { fields: [assets.userId], references: [users.id] }),
  organization: one(organizations, { fields: [assets.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [assets.familyGroupId], references: [familyGroups.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  organization: one(organizations, { fields: [subscriptions.organizationId], references: [organizations.id] }),
  category: one(categories, { fields: [subscriptions.categoryId], references: [categories.id] }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  organization: one(organizations, { fields: [goals.organizationId], references: [organizations.id] }),
  familyGroup: one(familyGroups, { fields: [goals.familyGroupId], references: [familyGroups.id] }),
  vaultLinks: many(vaultLinks),
}));

export const vaultLinksRelations = relations(vaultLinks, ({ one }) => ({
  goal: one(goals, { fields: [vaultLinks.goalId], references: [goals.id] }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  organization: one(organizations, { fields: [approvals.organizationId], references: [organizations.id] }),
  requester: one(users, { fields: [approvals.requesterId], references: [users.id] }),
  approver: one(users, { fields: [approvals.approverId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
  organization: one(organizations, { fields: [auditLogs.organizationId], references: [organizations.id] }),
}));

export const educationalContentRelations = relations(educationalContent, ({ many }) => ({
  interactions: many(userEducationInteractions),
}));

export const userEducationInteractionsRelations = relations(userEducationInteractions, ({ one }) => ({
  user: one(users, { fields: [userEducationInteractions.userId], references: [users.id] }),
  content: one(educationalContent, { fields: [userEducationInteractions.contentId], references: [educationalContent.id] }),
}));
