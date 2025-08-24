import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

const plans = [
  {
    id: 'individual',
    name: 'Individual',
    price: 'R$ 19,90',
    period: 'mês',
    description: 'Para controle financeiro pessoal',
    popular: false,
    features: [
      'Transações ilimitadas',
      'Categorias personalizadas', 
      'Relatórios básicos',
      'Importação de extratos',
      'Metas de orçamento'
    ]
  },
  {
    id: 'family',
    name: 'Família',
    price: 'R$ 39,90',
    period: 'mês',
    description: 'Para famílias organizarem finanças juntas',
    popular: true,
    features: [
      'Tudo do plano Individual',
      'Múltiplos usuários (até 6)',
      'Orçamento familiar compartilhado',
      'Controle por membro',
      'Relatórios compartilhados',
      'Notificações personalizadas'
    ]
  },
  {
    id: 'business',
    name: 'Empresarial',
    price: 'R$ 79,90',
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
      'Suporte dedicado 24/7'
    ]
  }
];

export function PlanSelectionModal({ isOpen, onClose, currentPlan }: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha o plano que melhor se adequa às suas necessidades.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlan === currentPlan) {
      toast({
        title: "Plano atual",
        description: "Você já possui este plano ativo.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Criar assinatura para o plano selecionado
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ planId: selectedPlan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar assinatura');
      }

      const data = await response.json();
      
      // Redirecionar para página de pagamento com client secret
      const params = new URLSearchParams({
        plan: selectedPlan,
        clientSecret: data.clientSecret || '',
      });
      
      window.location.href = `/upgrade?${params.toString()}`;
      
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanLevel = (planId: string) => {
    const levels = { individual: 1, family: 2, business: 3 };
    return levels[planId as keyof typeof levels] || 0;
  };

  const getCurrentLevel = () => {
    if (!currentPlan) return 0;
    return getPlanLevel(currentPlan);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Escolha seu Plano FinanceFlow
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Selecione o plano ideal para suas necessidades financeiras
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isCurrent = currentPlan === plan.id;
            const planLevel = getPlanLevel(plan.id);
            const currentLevel = getCurrentLevel();
            const isDowngrade = planLevel < currentLevel;

            return (
              <Card 
                key={plan.id}
                className={`relative cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary border-primary shadow-lg' 
                    : plan.popular 
                      ? 'border-primary/20 shadow-md'
                      : 'hover:shadow-md'
                } ${isCurrent ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}
                onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                data-testid={`plan-modal-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="outline" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Atual
                      </Badge>
                    )}
                    {isDowngrade && (
                      <Badge variant="secondary" className="text-xs">
                        Downgrade
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-green-600">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isSelected && !isCurrent && (
                    <div className="text-center">
                      <Badge variant="default" className="bg-primary/10 text-primary">
                        Plano Selecionado
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedPlan ? (
              <>✅ Plano {plans.find(p => p.id === selectedPlan)?.name} selecionado</>
            ) : (
              "Selecione um plano acima para continuar"
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-upgrade">
              Cancelar
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!selectedPlan || isProcessing || selectedPlan === currentPlan}
              data-testid="button-continue-upgrade"
            >
              {isProcessing ? (
                "Processando..."
              ) : (
                <>
                  Continuar para Pagamento
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Pagamento seguro • Cancele a qualquer momento • Suporte 24/7
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}