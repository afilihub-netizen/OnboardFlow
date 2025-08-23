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
  const [currentPlan, setCurrentPlan] = useState(user?.subscriptionStatus || "free");
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

  const handleSubscribe = async (planType = 'individual') => {
    setIsSubscriptionLoading(true);
    
    try {
      const response = await fetch("/api/get-or-create-subscription", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
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
      description: "Para começar suas finanças",
      icon: Shield,
      color: "gray",
      features: [
        "Até 50 transações por mês",
        "5 categorias básicas",
        "Relatórios simples",
        "Dashboard básico",
        "Suporte por email"
      ],
      current: currentPlan === "free",
      popular: false,
      buttonText: "Plano Atual",
      buttonDisabled: true,
      planType: "free"
    },
    {
      name: "Individual", 
      price: "R$ 4,90",
      period: "mensal",
      description: "Ideal para pessoa física",
      icon: Crown,
      color: "blue",
      features: [
        "Transações ilimitadas",
        "Categorias ilimitadas", 
        "Assistente IA completo",
        "Relatórios avançados",
        "Importação de extratos",
        "Metas personalizadas",
        "Backup automático",
        "Suporte prioritário"
      ],
      current: currentPlan === "individual",
      popular: true,
      buttonText: currentPlan === "individual" ? "Plano Atual" : "Assinar Individual",
      buttonDisabled: currentPlan === "individual",
      planType: "individual"
    },
    {
      name: "Familiar",
      price: "R$ 9,90", 
      period: "mensal",
      description: "Perfeito para famílias",
      icon: Users,
      color: "purple",
      features: [
        "Tudo do Individual",
        "Até 6 membros da família",
        "Convites por email", 
        "Permissões personalizadas",
        "Controle parental",
        "Relatórios unificados",
        "Mesadas automáticas",
        "Gestão familiar completa"
      ],
      current: currentPlan === "family",
      popular: false,
      buttonText: currentPlan === "family" ? "Plano Atual" : "Assinar Familiar", 
      buttonDisabled: currentPlan === "family",
      planType: "family"
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
                <Badge variant={currentPlan !== "free" ? "default" : "secondary"}>
                  {currentPlan === "individual" ? "Individual" : 
                   currentPlan === "family" ? "Familiar" : "Gratuito"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {currentPlan === "individual" ? "FinanceFlow Individual" : 
                     currentPlan === "family" ? "FinanceFlow Familiar" : "FinanceFlow Gratuito"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentPlan !== "free"
                      ? "Você tem acesso completo a todos os recursos do seu plano"
                      : "Faça upgrade para Individual ou Familiar e libere todo o potencial do FinanceFlow"
                    }
                  </p>
                </div>
                {currentPlan !== "free" && (
                  <Crown className="w-8 h-8 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plans Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`financial-card relative ${
                  plan.popular ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                } ${plan.color === 'purple' ? 'border-purple-200 dark:border-purple-800' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 ${
                    plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    plan.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    'bg-gray-100 dark:bg-gray-800'
                  } rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className={`w-6 h-6 ${
                      plan.color === 'blue' ? 'text-blue-600' :
                      plan.color === 'purple' ? 'text-purple-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${
                      plan.color === 'blue' ? 'text-blue-600' :
                      plan.color === 'purple' ? 'text-purple-600' :
                      'text-gray-600'
                    }`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                  {plan.name === "Familiar" && (
                    <p className="text-xs text-gray-500 mt-1">até 6 membros</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${
                      plan.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      plan.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                      ''
                    }`}
                    variant={plan.current ? "secondary" : "default"}
                    disabled={plan.buttonDisabled || isSubscriptionLoading}
                    onClick={!plan.current && plan.planType !== 'free' ? () => handleSubscribe(plan.planType) : undefined}
                    data-testid={`plan-button-${plan.name.toLowerCase()}`}
                  >
                    <plan.icon className="w-4 h-4 mr-2" />
                    {isSubscriptionLoading ? "Carregando..." : plan.buttonText}
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
                  Finalizar Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
              </CardContent>
            </Card>
          )}

          {/* Features Highlight */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                Preços pensados para escala - acessível para todos!
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <Crown className="w-8 h-8 text-blue-500 mx-auto" />
                <h4 className="font-medium">Individual Premium</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Apenas R$ 4,90/mês para recursos completos
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <Users className="w-8 h-8 text-purple-500 mx-auto" />
                <h4 className="font-medium">Família Completa</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  R$ 9,90/mês para até 6 membros (R$ 1,65/pessoa)
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <Star className="w-8 h-8 text-yellow-500 mx-auto" />
                <h4 className="font-medium">Sem Pegadinhas</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cancele quando quiser, sem taxa de cancelamento
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}