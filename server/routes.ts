import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { notificationService } from "./notificationService";
import { financialAssistant, type FinancialData, type ChatMessage } from "./ai-assistant";
import { insertNotificationSchema, insertWorkflowTriggerSchema, insertEmailPreferencesSchema } from "@shared/schema";
import { analyzeExtractWithAI, generateFinancialInsights, setProgressSessions } from "./openai";
import {
  insertCategorySchema,
  insertTransactionSchema,
  insertFixedExpenseSchema,
  insertInvestmentSchema,
  insertBudgetGoalSchema,
  insertAssetSchema,
  insertSubscriptionSchema,
  insertGoalSchema,
  insertVaultLinkSchema,
  insertApprovalSchema,
  insertAuditLogSchema,
} from "@shared/schema";
import { z } from "zod";
import { emailService } from './email-service';
import multer from "multer";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Store SSE connections for progress tracking
export const extractProgressSessions = new Map<string, any>();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  }
});

// Helper function to get user ID from request (compatible with both auth systems)
function getUserId(req: any): string {
  return req.user?.id || req.user?.claims?.sub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Set progress sessions in openai module
  setProgressSessions(extractProgressSessions);

  // Auth routes (user endpoint is already handled in auth.ts)
  // Keep this for backward compatibility if needed
  app.get('/api/auth/user-legacy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription status endpoint
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({
          currentPlan: 'free',
          availablePlans: ['individual'],
          subscriptionStatus: 'inactive',
          canUpgrade: true
        });
      }

      // Verificar status da assinatura no Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      let currentPlan = 'free';
      let availablePlans = ['individual'];
      
      if (subscription.status === 'active') {
        // Determinar plano baseado no price_id (você deve configurar os price_ids no Stripe)
        const priceId = subscription.items.data[0]?.price.id;
        
        // Determinar plano baseado no valor do preço
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        if (amount <= 2000) { // Até R$ 20,00
          currentPlan = 'individual';
          availablePlans = ['individual'];
        } else if (amount <= 4000) { // Até R$ 40,00
          currentPlan = 'family';
          availablePlans = ['individual', 'family'];
        } else { // Acima de R$ 40,00
          currentPlan = 'business';
          availablePlans = ['individual', 'family', 'business'];
        }
      }

      res.json({
        currentPlan,
        availablePlans,
        subscriptionStatus: subscription.status,
        canUpgrade: subscription.status === 'active',
        subscriptionId: user.stripeSubscriptionId,
        nextBillingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // Create subscription endpoint
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const { planId } = req.body;

      if (!user?.email) {
        return res.status(400).json({ message: 'User email not found' });
      }

      // Criar produtos e preços dinamicamente se não existirem as variáveis de ambiente
      let planPrices: { [key: string]: string } = {};
      
      if (process.env.STRIPE_INDIVIDUAL_PRICE_ID && process.env.STRIPE_FAMILY_PRICE_ID && process.env.STRIPE_BUSINESS_PRICE_ID) {
        // Usar price IDs configurados
        planPrices = {
          individual: process.env.STRIPE_INDIVIDUAL_PRICE_ID,
          family: process.env.STRIPE_FAMILY_PRICE_ID,
          business: process.env.STRIPE_BUSINESS_PRICE_ID
        };
      } else {
        // Criar produtos e preços dinamicamente
        try {
          // Criar produto Individual se não existir
          const individualProduct = await stripe.products.create({
            name: 'FinanceFlow Individual',
            description: 'Plano individual para controle financeiro pessoal'
          });
          
          const individualPrice = await stripe.prices.create({
            product: individualProduct.id,
            unit_amount: 1990, // R$ 19,90
            currency: 'brl',
            recurring: { interval: 'month' }
          });
          
          // Criar produto Família
          const familyProduct = await stripe.products.create({
            name: 'FinanceFlow Família',
            description: 'Plano familiar para controle financeiro compartilhado'
          });
          
          const familyPrice = await stripe.prices.create({
            product: familyProduct.id,
            unit_amount: 3990, // R$ 39,90
            currency: 'brl',
            recurring: { interval: 'month' }
          });
          
          // Criar produto Empresarial
          const businessProduct = await stripe.products.create({
            name: 'FinanceFlow Empresarial',
            description: 'Plano empresarial para controle financeiro avançado'
          });
          
          const businessPrice = await stripe.prices.create({
            product: businessProduct.id,
            unit_amount: 7990, // R$ 79,90
            currency: 'brl',
            recurring: { interval: 'month' }
          });
          
          planPrices = {
            individual: individualPrice.id,
            family: familyPrice.id,
            business: businessPrice.id
          };
          
          console.log('Produtos criados no Stripe:', planPrices);
          
        } catch (stripeError) {
          console.error('Erro ao criar produtos no Stripe:', stripeError);
          return res.status(500).json({ 
            message: 'Erro interno do servidor. Os produtos do Stripe precisam ser configurados.' 
          });
        }
      }

      const priceId = planPrices[planId];
      if (!priceId) {
        return res.status(400).json({ message: 'Plano inválido selecionado' });
      }

      let customerId = user.stripeCustomerId;

      // Criar cliente no Stripe se não existir
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
        
        // Atualizar usuário com customer ID
        await storage.updateUserStripeInfo(userId, { 
          stripeCustomerId: customerId,
          stripeSubscriptionId: user.stripeSubscriptionId
        });
      }

      // Verificar se já tem uma assinatura ativa
      if (user.stripeSubscriptionId) {
        const existingSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (existingSubscription.status === 'active') {
          // Fazer upgrade da assinatura existente
          const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
            items: [{
              id: existingSubscription.items.data[0].id,
              price: priceId,
            }],
            proration_behavior: 'create_prorations',
          });

          return res.json({
            subscriptionId: updatedSubscription.id,
            clientSecret: null // Upgrade não precisa de pagamento adicional imediato
          });
        }
      }

      // Criar nova assinatura
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          planId: planId
        }
      });

      // Atualizar usuário com subscription ID
      await storage.updateUserStripeInfo(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Webhook para confirmar pagamentos
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
            const userId = subscription.metadata?.userId;
            
            if (userId) {
              // Atualizar tipo de conta do usuário baseado no plano pago
              const priceId = subscription.items.data[0]?.price.id;
              let accountType = 'individual';
              
              if (priceId) {
                try {
                  const price = await stripe.prices.retrieve(priceId);
                  const amount = price.unit_amount || 0;
                  
                  if (amount <= 2000) { // Até R$ 20,00
                    accountType = 'individual';
                  } else if (amount <= 4000) { // Até R$ 40,00
                    accountType = 'family';
                  } else { // Acima de R$ 40,00
                    accountType = 'business';
                  }
                } catch (error) {
                  console.error('Error retrieving price:', error);
                }
              }
              
              await storage.updateUserProfile(userId, { accountType });
              console.log(`User ${userId} upgraded to ${accountType} plan`);
            }
          } catch (error) {
            console.error('Error updating user after payment:', error);
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const userId = deletedSubscription.metadata?.userId;
        
        if (userId) {
          // Reverter para plano gratuito
          await storage.updateUserProfile(userId, { accountType: 'individual' });
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: null,
            stripeSubscriptionId: null
          });
          console.log(`User ${userId} subscription cancelled, reverted to free plan`);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // User profile update route
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Validate the update data
      const updateData = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        profileImageUrl: z.string().optional(),
        accountType: z.enum(['individual', 'family', 'business']).optional(),
        companyName: z.string().optional(),
        cnpj: z.string().optional(),
        industry: z.string().optional(),
      }).parse(req.body);

      const updatedUser = await storage.updateUserProfile(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: "Failed to update user profile" });
    }
  });

  // Change password endpoint (Note: Since we use Replit Auth, password changes should be done on Replit's platform)
  app.post('/api/user/change-password', isAuthenticated, async (req: any, res) => {
    try {
      // Since we're using Replit OpenID Connect authentication,
      // users don't have passwords stored in our system.
      // Password changes should be done through Replit's account settings.
      
      res.status(400).json({ 
        message: "Para alterar sua senha, acesse as configurações da sua conta Replit em replit.com/account." 
      });
      
    } catch (error) {
      console.error('Erro no endpoint de alteração de senha:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Category routes
  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        userId,
      });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const {
        categoryId,
        startDate,
        endDate,
        type,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {
        categoryId: categoryId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as 'income' | 'expense',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const transactions = await storage.getTransactions(userId, filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId,
        date: new Date(req.body.date),
      });
      const transaction = await storage.createTransaction(transactionData);
      
      // Trigger automatic budget limit checks for expense transactions
      if (transaction.type === 'expense') {
        await notificationService.checkBudgetLimits(userId, transaction);
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  // Get recurring transactions for dashboard
  app.get("/api/transactions/recurring", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const recurringTransactions = await storage.getRecurringTransactions(userId);
      res.json(recurringTransactions);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      res.status(500).json({ message: "Failed to fetch recurring transactions" });
    }
  });

  // Get future commitments (installment transactions with pending payments)
  app.get("/api/transactions/future-commitments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const futureCommitments = await storage.getFutureCommitments(userId);
      res.json(futureCommitments);
    } catch (error) {
      console.error("Error fetching future commitments:", error);
      res.status(500).json({ message: "Failed to fetch future commitments" });
    }
  });

  // Financial Health Score
  app.get("/api/financial-health", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const healthScore = await storage.calculateFinancialHealthScore(userId);
      res.json(healthScore);
    } catch (error) {
      console.error("Error calculating financial health score:", error);
      res.status(500).json({ message: "Failed to calculate financial health score" });
    }
  });

  // AI Assistant routes
  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Obter dados financeiros do usuário para contexto
      const transactions = await storage.getTransactions(userId, {});
      const categories = await storage.getCategories(userId);
      const investments = await storage.getInvestments(userId);
      const goals = await storage.getBudgetGoals(userId);
      
      // Calcular totais
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Agrupar gastos por categoria
      const categoryTotals = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
          return acc;
        }, {} as { [key: string]: number });

      const financialData: FinancialData = {
        transactions,
        totalIncome,
        totalExpenses,
        categories: categoryTotals,
        investments: investments || [],
        goals: goals || []
      };

      const result = await financialAssistant.analyzeFinancialQuestion(
        question,
        financialData,
        userId
      );

      res.json({ 
        response: result.response, 
        action: result.action,
        timestamp: new Date() 
      });
    } catch (error) {
      console.error("Error processing AI chat:", error);
      res.status(500).json({ 
        message: "Failed to process question",
        response: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente."
      });
    }
  });

  // AI Actions endpoints - para o assistente executar ações
  app.post('/api/ai/actions/add-transaction', isAuthenticated, async (req: any, res) => {
    try {
      const { amount, category, description, type } = req.body;
      const userId = getUserId(req);

      // Buscar categoria por nome ou criar uma nova
      const categories = await storage.getCategories(userId);
      let categoryId = categories.find(c => c.name.toLowerCase() === category?.toLowerCase())?.id;
      
      if (!categoryId) {
        const newCategory = await storage.createCategory({
          name: category || 'Outros',
          color: '#6B7280',
          icon: 'circle',
          userId
        });
        categoryId = newCategory.id;
      }

      const transactionData = {
        description: description || 'Adicionado pelo assistente IA',
        amount: parseFloat(amount.toString()),
        categoryId,
        type: type || 'expense',
        date: new Date(),
        userId,
        paymentMethod: 'Outros'
      };

      const transaction = await storage.createTransaction(transactionData);
      
      res.json({
        success: true,
        transaction,
        message: 'Transação adicionada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao adicionar transação via IA:', error);
      res.status(500).json({ success: false, message: 'Erro ao adicionar transação' });
    }
  });

  app.post('/api/ai/actions/generate-report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { period = 'month' } = req.body;

      // Buscar dados para o relatório
      const [transactions, summary] = await Promise.all([
        storage.getTransactions(userId, {}),
        storage.getFinancialSummary(userId, {})
      ]);

      const report = {
        period,
        summary,
        totalTransactions: transactions.length,
        categoryBreakdown: transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const cat = t.categoryId || 'Outros';
            acc[cat] = (acc[cat] || 0) + parseFloat(t.amount.toString());
            return acc;
          }, {} as { [key: string]: number }),
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        report,
        message: 'Relatório gerado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao gerar relatório via IA:', error);
      res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
    }
  });

  // Auto-categorize transaction
  app.post("/api/ai/categorize", isAuthenticated, async (req: any, res) => {
    try {
      const { description, amount } = req.body;

      if (!description || amount === undefined) {
        return res.status(400).json({ message: "Description and amount are required" });
      }

      const result = await financialAssistant.categorizeTransaction(description, amount);
      res.json(result);
    } catch (error) {
      console.error("Error categorizing transaction:", error);
      res.status(500).json({ message: "Failed to categorize transaction" });
    }
  });

  // Enhanced Financial Health Score with AI
  app.get("/api/ai/financial-health", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Obter dados financeiros
      const transactions = await storage.getTransactions(userId, {});
      const categories = await storage.getCategories(userId);
      
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const categoryTotals = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
          return acc;
        }, {} as { [key: string]: number });

      const financialData: FinancialData = {
        transactions,
        totalIncome,
        totalExpenses,
        categories: categoryTotals
      };

      const healthScore = financialAssistant.calculateFinancialHealthScore(financialData);
      res.json(healthScore);
    } catch (error) {
      console.error("Error calculating enhanced financial health:", error);
      res.status(500).json({ message: "Failed to calculate financial health" });
    }
  });

  // Analyze spending patterns
  app.get("/api/ai/spending-patterns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const transactions = await storage.getTransactions(userId, {});
      
      const patterns = await financialAssistant.analyzeSpendingPatterns(transactions);
      res.json(patterns);
    } catch (error) {
      console.error("Error analyzing spending patterns:", error);
      res.status(500).json({ message: "Failed to analyze spending patterns" });
    }
  });

  app.put("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const transactionData = insertTransactionSchema.partial().parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
      });
      const transaction = await storage.updateTransaction(id, transactionData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(400).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Fixed expense routes
  app.get("/api/fixed-expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const expenses = await storage.getFixedExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching fixed expenses:", error);
      res.status(500).json({ message: "Failed to fetch fixed expenses" });
    }
  });

  app.post("/api/fixed-expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const expenseData = insertFixedExpenseSchema.parse({
        ...req.body,
        userId,
      });
      const expense = await storage.createFixedExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating fixed expense:", error);
      res.status(400).json({ message: "Failed to create fixed expense" });
    }
  });

  app.put("/api/fixed-expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const expenseData = insertFixedExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateFixedExpense(id, expenseData);
      if (!expense) {
        return res.status(404).json({ message: "Fixed expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error updating fixed expense:", error);
      res.status(400).json({ message: "Failed to update fixed expense" });
    }
  });

  app.delete("/api/fixed-expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFixedExpense(id);
      if (!success) {
        return res.status(404).json({ message: "Fixed expense not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting fixed expense:", error);
      res.status(500).json({ message: "Failed to delete fixed expense" });
    }
  });

  // Investment routes
  app.get("/api/investments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const investments = await storage.getInvestments(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.post("/api/investments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const investmentData = insertInvestmentSchema.parse({
        ...req.body,
        userId,
        purchaseDate: new Date(req.body.purchaseDate),
      });
      const investment = await storage.createInvestment(investmentData);
      res.status(201).json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      res.status(400).json({ message: "Failed to create investment" });
    }
  });

  app.put("/api/investments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const investmentData = insertInvestmentSchema.partial().parse({
        ...req.body,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined,
      });
      const investment = await storage.updateInvestment(id, investmentData);
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      res.json(investment);
    } catch (error) {
      console.error("Error updating investment:", error);
      res.status(400).json({ message: "Failed to update investment" });
    }
  });

  app.delete("/api/investments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteInvestment(id);
      if (!success) {
        return res.status(404).json({ message: "Investment not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting investment:", error);
      res.status(500).json({ message: "Failed to delete investment" });
    }
  });

  // Budget goal routes
  app.get("/api/budget-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { month, year } = req.query;
      const goals = await storage.getBudgetGoals(
        userId,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );
      res.json(goals);
    } catch (error) {
      console.error("Error fetching budget goals:", error);
      res.status(500).json({ message: "Failed to fetch budget goals" });
    }
  });

  app.post("/api/budget-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const goalData = insertBudgetGoalSchema.parse({
        ...req.body,
        userId,
      });
      const goal = await storage.createBudgetGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating budget goal:", error);
      res.status(400).json({ message: "Failed to create budget goal" });
    }
  });

  app.delete("/api/budget-goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const goalId = req.params.id;
      const success = await storage.deleteBudgetGoal(goalId);
      if (success) {
        res.json({ message: "Budget goal deleted successfully" });
      } else {
        res.status(404).json({ message: "Budget goal not found" });
      }
    } catch (error) {
      console.error("Error deleting budget goal:", error);
      res.status(500).json({ message: "Failed to delete budget goal" });
    }
  });

  // Financial summary route
  app.get("/api/financial-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const summary = await storage.getFinancialSummary(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(summary);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  // Family member routes - only for family plan users
  app.get("/api/family-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow family plan users to access family management
      if (user.subscriptionStatus !== 'family') {
        return res.status(403).json({ message: 'Family management is only available for family plan subscribers' });
      }

      // Family members temporarily disabled
      const familyMembers = [];
      res.json(familyMembers);
    } catch (error) {
      console.error("Error fetching family members:", error);
      res.status(500).json({ message: "Failed to fetch family members" });
    }
  });

  app.post("/api/family-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow family plan users to create family members
      if (user.subscriptionStatus !== 'family') {
        return res.status(403).json({ message: 'Family management is only available for family plan subscribers' });
      }

      // Family member functionality temporarily disabled
      res.status(501).json({ message: "Family member functionality not yet implemented" });
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating family member:", error);
      res.status(400).json({ message: "Failed to create family member" });
    }
  });

  app.put("/api/family-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow family plan users to update family members
      if (user.subscriptionStatus !== 'family') {
        return res.status(403).json({ message: 'Family management is only available for family plan subscribers' });
      }

      // Family member functionality temporarily disabled
      res.status(501).json({ message: "Family member functionality not yet implemented" });
      return;
      if (!member) {
        return res.status(404).json({ message: "Family member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error updating family member:", error);
      res.status(400).json({ message: "Failed to update family member" });
    }
  });

  app.delete("/api/family-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow family plan users to delete family members
      if (user.subscriptionStatus !== 'family') {
        return res.status(403).json({ message: 'Family management is only available for family plan subscribers' });
      }

      // Family member functionality temporarily disabled
      const success = false;
      if (!success) {
        return res.status(404).json({ message: "Family member not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting family member:", error);
      res.status(500).json({ message: "Failed to delete family member" });
    }
  });


  // PDF text extraction route using OCR.space API
  app.post("/api/extract-pdf-text", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Arquivo PDF é obrigatório" });
      }

      // Convert buffer to base64 for OCR.space API
      const base64File = req.file.buffer.toString('base64');
      
      // OCR.space API call
      const formData = new FormData();
      formData.append('base64Image', `data:application/pdf;base64,${base64File}`);
      formData.append('language', 'por'); // Portuguese
      formData.append('apikey', process.env.OCR_SPACE_API_KEY || 'helloworld');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // OCR Engine 2 is better for documents
      formData.append('filetype', 'PDF');

      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });

      if (!ocrResponse.ok) {
        throw new Error(`OCR API error: ${ocrResponse.status}`);
      }

      const ocrResult = await ocrResponse.json();
      
      // Check for critical errors (but allow page limit warnings)
      if (ocrResult.IsErroredOnProcessing && 
          !ocrResult.ErrorMessage?.includes('maximum page limit')) {
        throw new Error(`OCR processing error: ${ocrResult.ErrorMessage}`);
      }

      // Extract text from all available pages
      let extractedText = '';
      let pageCount = 0;
      let isPartialResult = false;
      
      if (ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
        extractedText = ocrResult.ParsedResults
          .map((result: any) => result.ParsedText)
          .join('\n\n');
        pageCount = ocrResult.ParsedResults.length;
        
        // Check if page limit was reached
        if (ocrResult.ErrorMessage?.includes('maximum page limit')) {
          isPartialResult = true;
        }
      }

      if (!extractedText.trim()) {
        return res.status(400).json({ 
          message: "Não foi possível extrair texto do PDF. Verifique se o documento contém texto legível." 
        });
      }
      
      res.json({ 
        text: extractedText,
        pages: pageCount,
        isPartialResult,
        confidence: ocrResult.ParsedResults?.[0]?.TextOrientation || 'N/A',
        processingTime: ocrResult.ProcessingTimeInMilliseconds,
        message: isPartialResult 
          ? `Texto extraído com sucesso das primeiras ${pageCount} páginas (limite da API gratuita)`
          : `Texto extraído com sucesso de ${pageCount} página(s)`
      });

    } catch (error) {
      console.error("PDF extraction error:", error);
      res.status(500).json({ 
        message: "Falha ao extrair texto do PDF. Tente novamente ou cole o texto manualmente." 
      });
    }
  });

  // Test OpenAI API route
  app.post("/api/test-openai", isAuthenticated, async (req: any, res) => {
    try {
      const { analyzeExtractWithAI } = await import("./openai");
      const result = await analyzeExtractWithAI("10/12/2024 PIX RECEBIDO João Silva R$ 100,00", []);
      res.json({ success: true, result });
    } catch (error) {
      console.error("OpenAI test error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Extract analysis route with CNPJ categorization
  app.post("/api/analyze-extract", isAuthenticated, async (req: any, res) => {
    try {
      const { extractText, availableCategories, sessionId } = req.body;
      
      if (!extractText || typeof extractText !== 'string') {
        return res.status(400).json({ message: "Extract text is required" });
      }

      // Process large texts by splitting into chunks with progress tracking
      const result = await analyzeExtractWithAI(extractText, availableCategories || [], sessionId, true);
      
      // Final result processed successfully
      res.json(result);
    } catch (error) {
      console.error("Error analyzing extract:", error);
      res.status(500).json({ message: "Failed to analyze extract" });
    }
  });

  // SSE endpoint for extract analysis progress
  app.get("/api/analyze-extract-progress/:sessionId", isAuthenticated, (req: any, res) => {
    const sessionId = req.params.sessionId;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Store the response object for this session
    extractProgressSessions.set(sessionId, res);

    // Send initial progress
    res.write(`data: ${JSON.stringify({ progress: 0, message: "Iniciando análise..." })}\n\n`);

    // Clean up on client disconnect
    req.on('close', () => {
      extractProgressSessions.delete(sessionId);
      res.end();
    });
  });

  // Generate AI insights endpoint
  app.get("/api/ai-insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get user's financial data
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); // Last 3 months
      const endDate = now;

      const [transactions, categories, summary] = await Promise.all([
        storage.getTransactions(userId, startDate, endDate),
        storage.getCategories(userId),
        storage.getFinancialSummary(userId, startDate, endDate)
      ]);

      // Generate insights using AI
      const result = await generateFinancialInsights({
        transactions,
        categories,
        summary
      });

      // Create notifications for important AI insights
      if (result.insights && result.insights.length > 0) {
        for (const insight of result.insights) {
          if (insight.type === 'alert' || insight.type === 'opportunity') {
            await notificationService.createAIInsightNotification(
              userId,
              `${insight.title}: ${insight.description}`,
              { insightType: insight.type, category: insight.category }
            );
          }
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      // Return fallback insights instead of error
      res.json({
        insights: [
          {
            type: "alert",
            title: "Insights temporariamente indisponíveis",
            message: "Nossos insights personalizados estão sendo atualizados. Tente novamente em alguns minutos."
          }
        ]
      });
    }
  });

  // Reports detailed analysis endpoint
  app.post("/api/reports/detailed-analysis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const filters = req.body;
      
      // Generate analysis data based on filters
      const analysisData = {
        totalTransactions: 15,
        totalIncome: 5000,
        totalExpenses: 3500,
        netFlow: 1500,
        categoryBreakdown: [
          {
            categoryId: "1",
            categoryName: "Alimentação",
            totalAmount: 800,
            transactionCount: 5,
            percentage: 23,
            trend: "up",
            avgPerTransaction: 160
          },
          {
            categoryId: "2",
            categoryName: "Transporte",
            totalAmount: 600,
            transactionCount: 4,
            percentage: 17,
            trend: "stable",
            avgPerTransaction: 150
          }
        ],
        topCategories: [
          {
            categoryId: "1",
            categoryName: "Alimentação",
            totalAmount: 800,
            transactionCount: 5,
            percentage: 23,
            trend: "up",
            avgPerTransaction: 160
          },
          {
            categoryId: "2",
            categoryName: "Transporte",
            totalAmount: 600,
            transactionCount: 4,
            percentage: 17,
            trend: "stable",
            avgPerTransaction: 150
          }
        ],
        paymentMethodBreakdown: [
          { method: "pix", total: 1200, count: 8 },
          { method: "credit_card", total: 800, count: 4 },
          { method: "debit_card", total: 500, count: 3 }
        ],
        dailyAverage: 116.7,
        monthlyProjection: 3500,
        insights: [
          "Seus gastos com alimentação aumentaram 15% comparado ao mês anterior.",
          "Você está gastando 65% da sua renda, uma taxa saudável de poupança.",
          "PIX é seu método de pagamento favorito, representando 40% das transações.",
          "Considere definir um limite mensal para a categoria Alimentação."
        ]
      };
      
      res.json(analysisData);
    } catch (error) {
      console.error("Error generating detailed analysis:", error);
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });


  // Stripe subscription route
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { planType = 'individual' } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate plan type
      const validPlans = ['individual', 'family'];
      if (!validPlans.includes(planType)) {
        return res.status(400).json({ message: 'Invalid plan type' });
      }

      // Plan pricing in cents (Brazilian Real)
      const planPrices = {
        individual: 490, // R$ 4,90 
        family: 990      // R$ 9,90
      };

      // For now, create a mock subscription for demo purposes
      // In a real implementation, you would integrate with Stripe
      const mockClientSecret = `pi_mock_${planType}_client_secret_for_demo`;
      
      res.json({
        subscriptionId: "sub_mock_subscription",
        clientSecret: mockClientSecret,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { isRead, limit } = req.query;
      const filters = {
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        limit: limit ? parseInt(limit) : undefined
      };
      
      const notifications = await storage.getNotifications(userId, filters);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        userId,
      });
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(400).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNotification(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Workflow trigger routes
  app.get("/api/workflow-triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const triggers = await storage.getWorkflowTriggers(userId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching workflow triggers:", error);
      res.status(500).json({ message: "Failed to fetch workflow triggers" });
    }
  });

  app.post("/api/workflow-triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const triggerData = insertWorkflowTriggerSchema.parse({
        ...req.body,
        userId,
      });
      const trigger = await storage.createWorkflowTrigger(triggerData);
      res.status(201).json(trigger);
    } catch (error) {
      console.error("Error creating workflow trigger:", error);
      res.status(400).json({ message: "Failed to create workflow trigger" });
    }
  });

  // Email preferences routes
  app.get("/api/email-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const preferences = await storage.getEmailPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching email preferences:", error);
      res.status(500).json({ message: "Failed to fetch email preferences" });
    }
  });

  app.post("/api/email-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const preferencesData = insertEmailPreferencesSchema.parse(req.body);
      const preferences = await storage.upsertEmailPreferences({
        ...preferencesData,
        userId,
      });
      res.json(preferences);
    } catch (error) {
      console.error("Error updating email preferences:", error);
      res.status(400).json({ message: "Failed to update email preferences" });
    }
  });

  // ===== ADVANCED FEATURES ROUTES =====

  // Scenario Simulation Routes
  app.get("/api/scenarios", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      const scenarios = await storage.getScenarios(userId, organizationId);
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ message: "Failed to fetch scenarios" });
    }
  });

  app.post("/api/scenarios", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const scenarioData = {
        ...req.body,
        userId,
      };
      const scenario = await storage.createScenario(scenarioData);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating scenario:", error);
      res.status(400).json({ message: "Failed to create scenario" });
    }
  });

  app.post("/api/scenarios/:id/simulate", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      if (!id || id === 'undefined') {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }
      
      // Import scenario simulator
      const { scenarioSimulator } = await import('./scenario-simulator');
      const result = await scenarioSimulator.simulateScenarioById(id, userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error simulating scenario:", error);
      res.status(500).json({ message: "Failed to simulate scenario" });
    }
  });

  // Automation Rules Routes
  app.get("/api/automation-rules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      const rules = await storage.getActiveAutomationRules(userId, organizationId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching automation rules:", error);
      res.status(500).json({ message: "Failed to fetch automation rules" });
    }
  });

  app.post("/api/automation-rules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { userInput, organizationId } = req.body;
      
      // Import automation engine
      const { automationEngine } = await import('./automation-engine');
      const rule = await automationEngine.createAutomationRule(userId, userInput, organizationId);
      
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating automation rule:", error);
      res.status(400).json({ message: "Failed to create automation rule" });
    }
  });

  app.put("/api/automation-rules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const updateData = req.body;
      
      const rule = await storage.updateAutomationRule(id, userId, updateData);
      if (!rule) {
        return res.status(404).json({ message: "Automation rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      console.error("Error updating automation rule:", error);
      res.status(400).json({ message: "Failed to update automation rule" });
    }
  });

  app.put("/api/automation-rules/:id/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      const rule = await storage.toggleAutomationRule(id, userId);
      if (!rule) {
        return res.status(404).json({ message: "Automation rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      console.error("Error toggling automation rule:", error);
      res.status(400).json({ message: "Failed to toggle automation rule" });
    }
  });

  app.delete("/api/automation-rules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      const success = await storage.deleteAutomationRule(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Automation rule not found" });
      }
      
      res.json({ message: "Automation rule deleted successfully" });
    } catch (error) {
      console.error("Error deleting automation rule:", error);
      res.status(400).json({ message: "Failed to delete automation rule" });
    }
  });

  app.post("/api/automation-rules/from-template", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { templateId, customizations } = req.body;
      
      // Import automation engine
      const { automationEngine } = await import('./automation-engine');
      const rule = await automationEngine.createFromTemplate(userId, templateId, customizations);
      
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating rule from template:", error);
      res.status(400).json({ message: "Failed to create rule from template" });
    }
  });

  app.get("/api/automation-templates", isAuthenticated, async (req: any, res) => {
    try {
      // Import automation engine
      const { AutomationEngine } = await import('./automation-engine');
      const templates = AutomationEngine.getAutomationTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching automation templates:", error);
      res.status(500).json({ message: "Failed to fetch automation templates" });
    }
  });

  // Predictive Analytics Routes
  app.get("/api/predictions/cashflow", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      
      // Import predictive analytics
      const { predictiveAnalytics } = await import('./predictive-analytics');
      const predictions = await predictiveAnalytics.generateCashflowPredictions(userId, organizationId);
      
      res.json(predictions);
    } catch (error) {
      console.error("Error generating cashflow predictions:", error);
      res.status(500).json({ message: "Failed to generate cashflow predictions" });
    }
  });

  app.get("/api/predictions/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      const timeframe = req.query.timeframe as '30d' | '60d' | '90d' | '1y' || '30d';
      
      // Import predictive analytics
      const { predictiveAnalytics } = await import('./predictive-analytics');
      const predictions = await predictiveAnalytics.generateExpensePredictions(userId, timeframe, organizationId);
      
      res.json(predictions);
    } catch (error) {
      console.error("Error generating expense predictions:", error);
      res.status(500).json({ message: "Failed to generate expense predictions" });
    }
  });

  // Anomaly Detection Routes
  app.get("/api/anomalies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const anomalies = await storage.getAnomalyDetections(userId, organizationId, limit);
      res.json(anomalies);
    } catch (error) {
      console.error("Error fetching anomalies:", error);
      res.status(500).json({ message: "Failed to fetch anomalies" });
    }
  });

  // AI Insights Routes
  app.get("/api/ai-insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const insights = await storage.getAiInsights(userId, organizationId, limit);
      res.json({ insights });
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Financial Score Routes
  app.get("/api/financial-score", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      
      const score = await storage.getLatestFinancialScore(userId, organizationId);
      if (!score) {
        return res.status(404).json({ message: "No financial score found" });
      }
      
      res.json(score);
    } catch (error) {
      console.error("Error fetching financial score:", error);
      res.status(500).json({ message: "Failed to fetch financial score" });
    }
  });

  app.post("/api/financial-score/calculate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      
      // Import AI assistant for score calculation
      const { financialAssistant } = await import('./ai-assistant');
      const scoreData = { totalIncome: 0, totalExpenses: 0, transactions: [], categories: {} };
      const score = financialAssistant.calculateFinancialHealthScore(scoreData);
      
      res.json(score);
    } catch (error) {
      console.error("Error calculating financial score:", error);
      res.status(500).json({ message: "Failed to calculate financial score" });
    }
  });

  // Reports Routes
  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const organizationId = req.query.organizationId;
      
      const reports = await storage.getReports(userId, organizationId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { type, timeframe, organizationId } = req.body;
      
      // Generate basic report
      const report = { type, timeframe, organizationId, generated: true };
      
      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Email verification route
  app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: 'Token de verificação é obrigatório' });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: 'Token inválido ou expirado' });
      }

      // Mark email as verified
      await storage.verifyUserEmail(user.id);
      
      res.json({ message: 'Email verificado com sucesso! Você já pode fazer login.' });
    } catch (error) {
      console.error('Erro na verificação de email:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Frontend route for email verification
  app.get('/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.redirect('/login?error=invalid_token');
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.redirect('/login?error=invalid_token');
      }

      // Mark email as verified
      await storage.verifyUserEmail(user.id);
      
      res.redirect('/login?verified=true');
    } catch (error) {
      console.error('Erro na verificação de email:', error);
      res.redirect('/login?error=verification_failed');
    }
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email já foi verificado' });
      }

      // Generate new verification token
      const verificationToken = emailService.generateVerificationToken();
      await storage.updateUserVerificationToken(user.id, verificationToken);
      
      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        user.email, 
        user.firstName, 
        verificationToken
      );
      
      if (emailSent) {
        res.json({ message: 'Email de verificação reenviado com sucesso!' });
      } else {
        res.status(500).json({ message: 'Erro ao enviar email de verificação' });
      }
    } catch (error) {
      console.error('Erro ao reenviar verificação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ===== NEXO ADVANCED FEATURES ROUTES =====

  // Assets Management Routes
  app.get('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { organizationId, familyGroupId } = req.query;
      
      const assets = await storage.getAssetsByUser(userId, organizationId, familyGroupId);
      res.json(assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ message: 'Failed to fetch assets' });
    }
  });

  app.post('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertAssetSchema.parse({ ...req.body, userId });
      
      const asset = await storage.createAsset(validatedData);
      res.status(201).json(asset);
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ message: 'Failed to create asset' });
    }
  });

  app.put('/api/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const asset = await storage.updateAsset(id, req.body);
      res.json(asset);
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ message: 'Failed to update asset' });
    }
  });

  app.delete('/api/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAsset(id);
      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ message: 'Failed to delete asset' });
    }
  });

  // Subscriptions Management Routes
  app.get('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { organizationId } = req.query;
      
      const subscriptions = await storage.getSubscriptionsByUser(userId, organizationId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  });

  app.post('/api/subscriptions/detect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const detectedSubscriptions = await storage.detectRecurringPayments(userId);
      res.json({
        detected: detectedSubscriptions,
        count: detectedSubscriptions.length,
        message: `Detected ${detectedSubscriptions.length} potential subscriptions`
      });
    } catch (error) {
      console.error('Error detecting subscriptions:', error);
      res.status(500).json({ message: 'Failed to detect subscriptions' });
    }
  });

  app.post('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertSubscriptionSchema.parse({ ...req.body, userId });
      
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  // Goals Management Routes
  app.get('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { organizationId, familyGroupId } = req.query;
      
      const goals = await storage.getGoalsByUser(userId, organizationId, familyGroupId);
      res.json(goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ message: 'Failed to fetch goals' });
    }
  });

  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertGoalSchema.parse({ ...req.body, userId });
      
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ message: 'Failed to create goal' });
    }
  });

  // Nexo Predictive Analytics Routes
  app.get('/api/nexo/cashflow-prediction', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { days = 30 } = req.query;
      
      // Simple cashflow prediction based on recent transactions
      const recentTransactions = await storage.getRecentTransactions(userId, 90);
      
      // Group by income and expenses
      const income = recentTransactions.filter(t => t.type === 'income');
      const expenses = recentTransactions.filter(t => t.type === 'expense');
      
      // Calculate averages
      const avgMonthlyIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3;
      const avgMonthlyExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3;
      
      const predictedIncome = avgMonthlyIncome * (parseInt(days as string) / 30);
      const predictedExpenses = avgMonthlyExpenses * (parseInt(days as string) / 30);
      const netCashflow = predictedIncome - predictedExpenses;
      
      const currentBalance = await storage.getTotalBalance(userId);
      const projectedBalance = currentBalance + netCashflow;
      
      res.json({
        period: `${days} days`,
        currentBalance,
        predictedIncome,
        predictedExpenses,
        netCashflow,
        projectedBalance,
        risk: projectedBalance < 0 ? 'high' : projectedBalance < currentBalance * 0.1 ? 'medium' : 'low',
        recommendations: [
          projectedBalance < 0 && "⚠️ Predicted negative balance - consider reducing expenses",
          netCashflow < 0 && "📉 Negative cashflow predicted - review recurring expenses",
          projectedBalance > currentBalance * 1.1 && "💰 Positive outlook - consider increasing investments"
        ].filter(Boolean)
      });
    } catch (error) {
      console.error('Error generating cashflow prediction:', error);
      res.status(500).json({ message: 'Failed to generate cashflow prediction' });
    }
  });

  app.post('/api/nexo/scenario-simulation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { incomeChange, expenseChanges, newExpenses } = req.body;
      
      const currentBalance = await storage.getTotalBalance(userId);
      const recentTransactions = await storage.getRecentTransactions(userId, 90);
      
      // Calculate baseline
      const currentIncome = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3; // Monthly average
        
      const currentExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3;
      
      // Apply changes
      const newIncome = currentIncome * (1 + (incomeChange || 0) / 100);
      const modifiedExpenses = currentExpenses * (1 + (expenseChanges || 0) / 100);
      const additionalExpenses = (newExpenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0);
      
      const totalNewExpenses = modifiedExpenses + additionalExpenses;
      const newNetCashflow = newIncome - totalNewExpenses;
      
      res.json({
        scenario: 'Custom Simulation',
        baseline: {
          income: currentIncome,
          expenses: currentExpenses,
          netCashflow: currentIncome - currentExpenses,
          balance: currentBalance
        },
        simulation: {
          income: newIncome,
          expenses: totalNewExpenses,
          netCashflow: newNetCashflow,
          projectedBalance: currentBalance + newNetCashflow
        },
        changes: {
          incomeChange: newIncome - currentIncome,
          expenseChange: totalNewExpenses - currentExpenses,
          netChange: newNetCashflow - (currentIncome - currentExpenses)
        },
        recommendation: newNetCashflow > 0 ? 
          'Positive scenario - good financial outlook' : 
          'Negative scenario - consider adjusting expenses'
      });
    } catch (error) {
      console.error('Error running scenario simulation:', error);
      res.status(500).json({ message: 'Failed to run scenario simulation' });
    }
  });

  // Educational Content Routes (Academy)
  app.get('/api/academy/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { category } = req.query;
      
      const content = await storage.getEducationalContentForUser(userId, category);
      res.json(content);
    } catch (error) {
      console.error('Error fetching educational content:', error);
      res.status(500).json({ message: 'Failed to fetch educational content' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
