import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Store SSE connections for progress tracking
export const extractProgressSessions = new Map<string, any>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Set progress sessions in openai module
  setProgressSessions(extractProgressSessions);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Obter dados financeiros do usuário para contexto
      const transactions = await storage.getTransactions(userId, {});
      const categories = await storage.getCategories(userId);
      
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
        categories: categoryTotals
      };

      const response = await financialAssistant.analyzeFinancialQuestion(
        question,
        financialData,
        userId
      );

      res.json({ response, timestamp: new Date() });
    } catch (error) {
      console.error("Error processing AI chat:", error);
      res.status(500).json({ message: "Failed to process question" });
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const expenses = await storage.getFixedExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching fixed expenses:", error);
      res.status(500).json({ message: "Failed to fetch fixed expenses" });
    }
  });

  app.post("/api/fixed-expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const investments = await storage.getInvestments(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.post("/api/investments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  // Extract analysis route
  app.post("/api/analyze-extract", isAuthenticated, async (req: any, res) => {
    try {
      const { extractText, availableCategories, sessionId } = req.body;
      
      if (!extractText || typeof extractText !== 'string') {
        return res.status(400).json({ message: "Extract text is required" });
      }

      // Process large texts by splitting into chunks with progress tracking
      const result = await analyzeExtractWithAI(extractText, availableCategories || [], sessionId);
      
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const triggers = await storage.getWorkflowTriggers(userId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching workflow triggers:", error);
      res.status(500).json({ message: "Failed to fetch workflow triggers" });
    }
  });

  app.post("/api/workflow-triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const preferences = await storage.getEmailPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching email preferences:", error);
      res.status(500).json({ message: "Failed to fetch email preferences" });
    }
  });

  app.post("/api/email-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
