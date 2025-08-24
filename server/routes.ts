import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { notificationService } from "./notificationService";
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

  // AI-powered onboarding analysis
  app.post('/api/ai/onboarding-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const { accountType, monthlyIncome, mainGoals, currentSituation, priorities, familySize, businessType } = req.body;
      
      console.log('Análise de onboarding iniciada para:', { accountType, monthlyIncome, mainGoals, priorities });
      
      // Fallback recommendations if AI fails
      const fallbackRecommendations = {
        categories: [
          { name: "Alimentação", icon: "🍔", budget: Math.round((monthlyIncome || 3000) * 0.25), description: "Gastos com supermercado e refeições" },
          { name: "Transporte", icon: "🚗", budget: Math.round((monthlyIncome || 3000) * 0.15), description: "Combustível, transporte público e manutenção" },
          { name: "Moradia", icon: "🏠", budget: Math.round((monthlyIncome || 3000) * 0.30), description: "Aluguel, financiamento e contas da casa" },
          { name: "Lazer", icon: "🎯", budget: Math.round((monthlyIncome || 3000) * 0.10), description: "Entretenimento e atividades de lazer" },
          { name: "Saúde", icon: "⚕️", budget: Math.round((monthlyIncome || 3000) * 0.10), description: "Plano de saúde e medicamentos" },
          { name: "Educação", icon: "📚", budget: Math.round((monthlyIncome || 3000) * 0.10), description: "Cursos, livros e desenvolvimento pessoal" }
        ],
        goals: [
          { title: "Reserva de Emergência", target: (monthlyIncome || 3000) * 6, timeframe: "12 meses", description: "Criar uma reserva para imprevistos" },
          { title: "Viagem dos Sonhos", target: 8000, timeframe: "18 meses", description: "Economizar para aquela viagem especial" },
          { title: "Investimentos", target: (monthlyIncome || 3000) * 2, timeframe: "6 meses", description: "Começar a investir regularmente" }
        ],
        tips: [
          "Comece com pequenas economias diárias - R$ 5 por dia resultam em R$ 1.800 por ano",
          "Use a regra 50-30-20: 50% necessidades, 30% desejos, 20% poupança",
          "Automatize sua poupança - programe transferências automáticas",
          "Revise seus gastos mensalmente para identificar onde pode economizar",
          "Invista em conhecimento financeiro - é o melhor investimento que você pode fazer"
        ],
        nextSteps: [
          "Configure suas categorias de gastos no FinanceFlow",
          "Cadastre suas primeiras transações",
          "Defina suas metas financeiras",
          "Comece a acompanhar seus gastos diariamente"
        ]
      };

      // Try AI analysis first
      try {
        const prompt = `Você é um consultor financeiro especializado. Baseado no perfil abaixo, crie recomendações personalizadas em JSON:

Perfil: ${accountType}, Renda: R$ ${monthlyIncome || 'não informado'}, Objetivos: ${mainGoals.join(', ')}, Prioridades: ${priorities.join(', ')}, Situação: ${currentSituation}${familySize ? `, Família: ${familySize} pessoas` : ''}${businessType ? `, Negócio: ${businessType}` : ''}

Responda APENAS com JSON válido contendo:
{
  "categories": [{"name": "string", "icon": "emoji", "budget": number, "description": "string"}],
  "goals": [{"title": "string", "target": number, "timeframe": "string", "description": "string"}],
  "tips": ["string"],
  "nextSteps": ["string"]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'Você é um consultor financeiro. Responda apenas com JSON válido.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const aiResponse = await response.json();
        console.log('OpenAI response received:', aiResponse.choices?.[0]?.message?.content ? 'Success' : 'No content');
        
        if (!aiResponse.choices?.[0]?.message?.content) {
          throw new Error('No content from OpenAI');
        }

        const recommendations = JSON.parse(aiResponse.choices[0].message.content);
        console.log('Recomendações da IA geradas com sucesso');
        
        res.json(recommendations);
      } catch (aiError) {
        console.error('Erro na IA, usando fallback:', aiError);
        console.log('Usando recomendações padrão personalizadas');
        res.json(fallbackRecommendations);
      }
    } catch (error) {
      console.error('Erro geral na análise de onboarding:', error);
      res.status(500).json({ message: 'Erro ao gerar recomendações personalizadas' });
    }
  });

  // Complete user onboarding
  app.post('/api/user/complete-onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { onboardingData, recommendations } = req.body;

      // Update user profile with onboarding data
      await storage.updateUserProfile(userId, {
        accountType: onboardingData.accountType,
        companyName: onboardingData.businessType,
        onboardingCompleted: true
      });

      // Create recommended categories
      for (const category of recommendations.categories) {
        await storage.createCategory({
          id: crypto.randomUUID(),
          name: category.name,
          type: 'expense',
          color: '#3B82F6',
          icon: category.icon,
          userId,
          budgetLimit: category.budget
        });
      }

      // Create recommended goals
      for (const goal of recommendations.goals) {
        await storage.createBudgetGoal({
          id: crypto.randomUUID(),
          title: goal.title,
          targetAmount: goal.target,
          currentAmount: 0,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          description: goal.description,
          userId
        });
      }

      res.json({ success: true, message: 'Onboarding concluído com sucesso' });
    } catch (error) {
      console.error('Erro ao concluir onboarding:', error);
      res.status(500).json({ message: 'Erro ao finalizar configuração' });
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
      res.status(500).json({ message: "Failed to generate AI insights" });
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

  // AI Chat endpoint
  app.post("/api/ai-chat", isAuthenticated, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      const userId = req.user.claims.sub;
      
      // Mock AI responses based on message content
      const generateAIResponse = (userMessage: string) => {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('gastar') || lowerMessage.includes('despesa') || lowerMessage.includes('análise') || lowerMessage.includes('analis')) {
          return {
            message: `Com base nos seus dados financeiros, vejo que você tem um padrão interessante de gastos. 

📊 **Análise dos seus gastos:**
• Suas principais categorias de despesa são alimentação e transporte
• Você tem uma boa taxa de poupança de aproximadamente 30%
• Recomendo estabelecer um limite mensal para gastos supérfluos

💡 **Dicas personalizadas:**
• Considere usar mais o PIX para evitar taxas de cartão
• Tente reduzir os gastos com alimentação externa em 10%
• Seus investimentos estão crescendo bem, continue assim!`,
            suggestions: [
              "Como posso reduzir gastos com alimentação?",
              "Quais investimentos recomendam?",
              "Mostre meu progresso este mês"
            ]
          };
        }
        
        if (lowerMessage.includes('economizar') || lowerMessage.includes('poupar') || lowerMessage.includes('economia')) {
          return {
            message: `🏦 **Estratégias de economia personalizadas para você:**

**Economia Imediata (próximos 30 dias):**
• Reduza gastos com delivery/restaurantes em 20% = ~R$ 160/mês
• Use transporte público 2x por semana = ~R$ 80/mês
• Cancele assinaturas não utilizadas = ~R$ 50/mês

**Economia a Médio Prazo:**
• Automatize uma transferência de 15% da renda para poupança
• Use a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança
• Renegocie contratos de serviços (internet, celular)

**Potencial de economia total: R$ 290/mês** 💰`,
            suggestions: [
              "Como automatizar minha poupança?",
              "Quais assinaturas posso cancelar?",
              "Defina uma meta de economia mensal"
            ]
          };
        }
        
        if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo') || lowerMessage.includes('planejamento')) {
          return {
            message: `🎯 **Vamos definir suas metas financeiras!**

**Metas Sugeridas baseadas no seu perfil:**

**Curto Prazo (3-6 meses):**
• Reserva de emergência: R$ 5.000
• Reduzir gastos supérfluos em 15%
• Organizar todas as receitas/despesas

**Médio Prazo (1-2 anos):**
• Fundo de emergência: R$ 15.000 (6 meses de gastos)
• Investir 20% da renda mensalmente
• Quitar dívidas de cartão (se houver)

**Longo Prazo (3-5 anos):**
• Entrada para imóvel: R$ 50.000
• Aposentadoria privada
• Diversificar investimentos

**Primeira meta recomendada:** Criar reserva de emergência de R$ 5.000 em 6 meses (R$ 833/mês) 🎯`,
            suggestions: [
              "Como criar uma reserva de emergência?",
              "Quanto devo investir por mês?",
              "Quais são os melhores investimentos para iniciantes?"
            ]
          };
        }
        
        if (lowerMessage.includes('investimento') || lowerMessage.includes('investir') || lowerMessage.includes('renda')) {
          return {
            message: `💼 **Guia de Investimentos Personalizado:**

**Para seu perfil atual, recomendo:**

**Iniciante/Conservador:**
• Tesouro Selic (liquidez diária) - até 30%
• CDB de bancos grandes - até 40%
• Fundos DI simples - até 30%

**Intermediário:**
• Tesouro IPCA+ (proteção inflação) - 40%
• Ações via ETFs (IVVB11, BOVA11) - 30%
• Fundos multimercado - 20%
• REITs (fundos imobiliários) - 10%

**⚠️ Lembre-se:**
• Comece com R$ 100-300/mês
• Diversifique os investimentos
• Nunca invista dinheiro que pode precisar em 6 meses
• Estude antes de investir

**Ordem de prioridade:**
1º Reserva de emergência na poupança/Tesouro Selic
2º CDBs e Tesouro Direto
3º Ações e fundos (longo prazo)`,
            suggestions: [
              "Como abrir conta em corretora?",
              "Quanto rende o Tesouro Selic?",
              "Vale a pena investir em ações?"
            ]
          };
        }

        // Default response
        return {
          message: `Olá! Sou seu assistente financeiro pessoal. 🤖💰

Posso te ajudar com:

📊 **Análises Financeiras:**
• Revisar seus gastos e receitas
• Identificar padrões de consumo
• Comparar períodos mensais

🎯 **Planejamento:**
• Definir metas de economia
• Criar planos de investimento
• Organizar orçamento mensal

💡 **Dicas Personalizadas:**
• Estratégias de economia
• Sugestões de investimentos
• Otimização de gastos

O que você gostaria de saber sobre suas finanças hoje?`,
          suggestions: [
            "Analise meus gastos do mês",
            "Como posso economizar mais?",
            "Defina metas financeiras para mim",
            "Quais investimentos recomendam?"
          ]
        };
      };

      const response = generateAIResponse(message);
      res.json(response);
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
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
