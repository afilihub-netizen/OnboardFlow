import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Check, Crown, Users, Zap, Shield, Star } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/subscription?success=true",
      },
    });

    if (error) {
      toast({
        title: "Falha no Pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento Realizado",
        description: "Você agora tem acesso ao plano Premium!",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
        data-testid="subscribe-button"
      >
        <Crown className="w-4 h-4 mr-2" />
        {isLoading ? "Processando..." : "Assinar Premium"}
      </Button>
    </form>
  );
};

export default function Subscription() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Assinatura Ativada!",
        description: "Bem-vindo ao FinanceFlow Premium!",
      });
      // Remove the success parameter from URL
      window.history.replaceState({}, '', '/subscription');
    }
  }, [toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Acesso Necessário",
        description: "Faça login para gerenciar sua assinatura.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const handleSubscribe = async () => {
    setIsSubscriptionLoading(true);
    
    try {
      const response = await fetch("/api/get-or-create-subscription", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao inicializar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "mensal",
      description: "Para uso pessoal básico",
      features: [
        "Até 50 transações por mês",
        "3 categorias personalizadas",
        "Relatórios básicos",
        "Suporte por email"
      ],
      current: currentPlan === "free",
      popular: false,
      buttonText: "Plano Atual",
      buttonDisabled: true,
    },
    {
      name: "Premium",
      price: "R$ 29,90",
      period: "mensal", 
      description: "Para controle financeiro completo",
      features: [
        "Transações ilimitadas",
        "Categorias ilimitadas",
        "Relatórios avançados com filtros",
        "Importação IA de extratos",
        "Contas familiares (até 5 membros)",
        "Assistente IA personalizado",
        "Dashboard com insights avançados",
        "Suporte prioritário",
        "Backup automático",
        "Modo offline"
      ],
      current: currentPlan === "premium",
      popular: true,
      buttonText: currentPlan === "premium" ? "Gerenciar Plano" : "Assinar Premium",
      buttonDisabled: false,
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Planos e Assinatura" 
          subtitle="Escolha o plano ideal para suas necessidades" 
        />
        
        <div className="p-6 space-y-6">
          {/* Current Plan Status */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Seu Plano Atual
                </div>
                <Badge variant={currentPlan === "premium" ? "default" : "secondary"}>
                  {currentPlan === "premium" ? "Premium" : "Gratuito"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {currentPlan === "premium" ? "FinanceFlow Premium" : "FinanceFlow Gratuito"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentPlan === "premium" 
                      ? "Você tem acesso completo a todos os recursos premium"
                      : "Upgrade para Premium e libere todo o potencial do FinanceFlow"
                    }
                  </p>
                </div>
                {currentPlan === "premium" && (
                  <Crown className="w-8 h-8 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plans Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`financial-card relative ${
                  plan.popular ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-3 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center mb-2">
                    {plan.name === "Premium" ? (
                      <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                    ) : (
                      <Shield className="w-6 h-6 mr-2 text-gray-500" />
                    )}
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.current ? "secondary" : "default"}
                    disabled={plan.buttonDisabled || isSubscriptionLoading}
                    onClick={plan.name === "Premium" && !plan.current ? handleSubscribe : undefined}
                    data-testid={`plan-button-${plan.name.toLowerCase()}`}
                  >
                    {plan.name === "Premium" && <Crown className="w-4 h-4 mr-2" />}
                    {isSubscriptionLoading && plan.name === "Premium" ? "Carregando..." : plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Form - Show only when subscribing */}
          {clientSecret && (
            <Card className="financial-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Finalizar Assinatura Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
              </CardContent>
            </Card>
          )}

          {/* Premium Features Highlight */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                Por que escolher o Premium?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Contas Familiares</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adicione até 5 membros da família e gerencie as finanças de todos em um só lugar
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Crown className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">IA Avançada</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Assistente IA personalizado e importação automática de extratos bancários
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Recursos Ilimitados</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Transações, categorias e relatórios sem limites
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Star className="w-6 h-6 text-purple-500 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Suporte Prioritário</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Atendimento preferencial e suporte técnico especializado
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}