import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const plans = [
  {
    id: 'individual',
    name: 'Plano Individual',
    price: 'R$ 19,90',
    priceValue: 19.90,
    period: 'mês',
    description: 'Ideal para controle financeiro pessoal',
    popular: false,
    features: [
      'Transações ilimitadas',
      'Categorias personalizadas', 
      'Relatórios básicos',
      'Importação de extratos',
      'Metas de orçamento',
      'Suporte por email'
    ]
  },
  {
    id: 'family',
    name: 'Plano Família',
    price: 'R$ 39,90',
    priceValue: 39.90,
    period: 'mês',
    description: 'Para famílias organizarem finanças juntas',
    popular: true,
    features: [
      'Tudo do plano Individual',
      'Múltiplos usuários (até 6)',
      'Orçamento familiar compartilhado',
      'Controle por membro da família',
      'Relatórios compartilhados',
      'Notificações por WhatsApp',
      'Suporte prioritário'
    ]
  },
  {
    id: 'business',
    name: 'Plano Empresarial',
    price: 'R$ 79,90',
    priceValue: 79.90,
    period: 'mês',
    description: 'Completo para empresas e freelancers',
    popular: false,
    features: [
      'Tudo do plano Família',
      'Controle por departamentos',
      'Gestão de fornecedores',
      'Notas fiscais e impostos',
      'Relatórios avançados',
      'API personalizada',
      'Integração contábil',
      'Suporte dedicado 24/7'
    ]
  }
];

interface PaymentFormProps {
  planId: string;
  clientSecret: string;
}

function PaymentForm({ planId, clientSecret }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile?upgraded=${planId}`,
        },
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no pagamento", 
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const plan = plans.find(p => p.id === planId);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Upgrade para {plan?.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Finalize seu pagamento para ativar o plano {plan?.name}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{plan?.name}</span>
              <span className="text-lg font-bold text-green-600">
                {plan?.price}/{plan?.period}
              </span>
            </div>
          </div>
          
          <PaymentElement />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || processing}
            data-testid="button-confirm-payment"
          >
            {processing ? "Processando..." : `Pagar ${plan?.price}`}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Pagamento seguro processado pelo Stripe
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar status atual da assinatura
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/status', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      return response.json();
    },
  });

  const handleSelectPlan = async (planId: string) => {
    try {
      setSelectedPlan(planId);
      
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      });
      setSelectedPlan(null);
    }
  };

  const getCurrentPlanLevel = () => {
    if (!subscriptionStatus) return 0;
    const planLevels = { free: 0, individual: 1, family: 2, business: 3 };
    return planLevels[subscriptionStatus.currentPlan as keyof typeof planLevels] || 0;
  };

  if (selectedPlan && clientSecret) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm planId={selectedPlan} clientSecret={clientSecret} />
        </Elements>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Escolha seu Plano</h1>
        <p className="text-muted-foreground">
          Unlock todas as funcionalidades do FinanceFlow
        </p>
      </div>

      {subscriptionStatus && (
        <Card className="max-w-2xl mx-auto mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600" />
              <span className="font-medium">
                Plano atual: {plans.find(p => p.id === subscriptionStatus.currentPlan)?.name || 'Gratuito'}
              </span>
              <Badge variant={subscriptionStatus.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                {subscriptionStatus.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const currentLevel = getCurrentPlanLevel();
          const planLevels = { individual: 1, family: 2, business: 3 };
          const planLevel = planLevels[plan.id as keyof typeof planLevels];
          const isCurrentPlan = subscriptionStatus?.currentPlan === plan.id;
          const isDowngrade = planLevel < currentLevel;
          const canUpgrade = planLevel > currentLevel;

          return (
            <Card 
              key={plan.id}
              className={`relative ${
                plan.popular ? 'ring-2 ring-primary border-primary' : ''
              } ${isCurrentPlan ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name}
                  {isCurrentPlan && (
                    <Badge variant="outline" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Atual
                    </Badge>
                  )}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-green-600">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || isDowngrade}
                  onClick={() => handleSelectPlan(plan.id)}
                  data-testid={`button-select-${plan.id}`}
                >
                  {isCurrentPlan 
                    ? "Plano Atual" 
                    : isDowngrade 
                      ? "Downgrade não disponível"
                      : canUpgrade
                        ? `Fazer Upgrade - ${plan.price}`
                        : `Escolher ${plan.name}`
                  }
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Pagamento seguro • Cancele a qualquer momento • Suporte 24/7
        </p>
      </div>
    </div>
  );
}