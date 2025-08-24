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
    description: 'Ideal para controle financeiro pessoal',
    popular: false,
    mostUsed: false,
    icon: '👤',
    color: 'blue',
    features: [
      'Transações ilimitadas',
      'Categorias personalizadas', 
      'Relatórios básicos',
      'Importação de extratos',
      'Metas de orçamento',
      'Dashboard personalizado'
    ],
    benefits: [
      'Organize suas finanças pessoais',
      'Controle total dos gastos',
      'Metas financeiras claras'
    ]
  },
  {
    id: 'family',
    name: 'Família',
    price: 'R$ 39,90',
    period: 'mês',
    description: 'Perfeito para famílias organizarem finanças juntas',
    popular: true,
    mostUsed: true,
    icon: '👨‍👩‍👧‍👦',
    color: 'green',
    features: [
      'Tudo do plano Individual',
      'Múltiplos usuários (até 6)',
      'Orçamento familiar compartilhado',
      'Controle por membro da família',
      'Relatórios compartilhados',
      'Notificações personalizadas',
      'Metas familiares'
    ],
    benefits: [
      'Gestão financeira colaborativa',
      'Transparência total em família',
      'Educação financeira para todos'
    ]
  },
  {
    id: 'business',
    name: 'Empresarial',
    price: 'R$ 79,90',
    period: 'mês',
    description: 'Solução completa para empresas e freelancers',
    popular: false,
    mostUsed: false,
    icon: '🏢',
    color: 'purple',
    features: [
      'Tudo do plano Família',
      'Controle por departamentos',
      'Gestão de fornecedores',
      'Notas fiscais e impostos',
      'Relatórios avançados e analytics',
      'API personalizada',
      'Suporte dedicado 24/7',
      'Integração com sistemas'
    ],
    benefits: [
      'Controle financeiro empresarial',
      'Conformidade fiscal automática',
      'Insights avançados de negócio'
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
          <p className="text-center text-muted-foreground mt-2">
            Desbloqueie todo o potencial do seu controle financeiro
          </p>
          <div className="text-center mt-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
              ✨ Sem compromisso • Cancele quando quiser • Suporte 24/7
            </Badge>
          </div>
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
                className={`relative cursor-pointer transition-all duration-300 ${
                  isCurrent 
                    ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20 cursor-not-allowed' 
                    : isSelected 
                      ? 'ring-2 ring-primary border-primary shadow-xl scale-105' 
                      : plan.mostUsed
                        ? 'border-2 border-orange-200 shadow-lg hover:shadow-xl hover:scale-105'
                        : 'border hover:shadow-lg hover:scale-105'
                }`}
                onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                data-testid={`plan-modal-${plan.id}`}
              >
                {/* Badge para plano mais usado */}
                {plan.mostUsed && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Mais Escolhido
                    </Badge>
                  </div>
                )}

                {/* Badge para plano atual */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      <Check className="h-3 w-3 mr-1" />
                      Plano Atual
                    </Badge>
                  </div>
                )}

                {/* Badge para mais popular */}
                {plan.popular && !plan.mostUsed && !isCurrent && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Recomendado
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  {/* Ícone do plano */}
                  <div className="flex justify-center mb-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                      plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-950' :
                      plan.color === 'green' ? 'bg-green-100 dark:bg-green-950' :
                      'bg-purple-100 dark:bg-purple-950'
                    }`}>
                      {plan.icon}
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold mb-2">{plan.name}</CardTitle>
                  
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-green-600">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Benefícios principais */}
                  <div className="mt-4 space-y-1">
                    {plan.benefits.map((benefit, index) => (
                      <div key={index} className="text-xs text-muted-foreground italic">
                        {benefit}
                      </div>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Lista de recursos */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Recursos inclusos:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Estado do plano */}
                  <div className="text-center">
                    {isCurrent ? (
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                          <Check className="h-4 w-4" />
                          <span className="font-medium">Seu plano atual</span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Aproveite todos os recursos!
                        </p>
                      </div>
                    ) : isSelected ? (
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <Star className="h-4 w-4" />
                          <span className="font-medium">Plano Selecionado</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Clique em continuar para prosseguir
                        </p>
                      </div>
                    ) : isDowngrade ? (
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-center gap-2 text-orange-700 dark:text-orange-300">
                          <span className="font-medium">Downgrade</span>
                        </div>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Recursos serão limitados
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-muted-foreground text-sm font-medium">
                          Clique para selecionar
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resumo da seleção */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedPlan ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      Plano {plans.find(p => p.id === selectedPlan)?.name} selecionado
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plans.find(p => p.id === selectedPlan)?.price}/mês
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Star className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">
                      Nenhum plano selecionado
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Escolha uma opção acima
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} data-testid="button-cancel-upgrade">
                Cancelar
              </Button>
              <Button 
                onClick={handleContinue}
                disabled={!selectedPlan || isProcessing || selectedPlan === currentPlan}
                className="min-w-[180px]"
                data-testid="button-continue-upgrade"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Criando assinatura...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Continuar pagamento
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Garantias */}
        <div className="text-center mt-4 space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Pagamento 100% seguro
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Cancele quando quiser
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              Suporte dedicado
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            🔒 Seus dados estão protegidos e seu pagamento é processado com segurança
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}