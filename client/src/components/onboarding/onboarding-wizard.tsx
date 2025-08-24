import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Wand2, 
  Target, 
  DollarSign, 
  PiggyBank, 
  TrendingUp, 
  Users, 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles,
  Brain,
  MessageCircle
} from 'lucide-react';

interface OnboardingData {
  accountType: 'individual' | 'family' | 'business';
  monthlyIncome?: number;
  mainGoals: string[];
  currentSituation: string;
  priorities: string[];
  familySize?: number;
  businessType?: string;
}

interface AIRecommendation {
  categories: Array<{
    name: string;
    icon: string;
    budget: number;
    description: string;
  }>;
  goals: Array<{
    title: string;
    target: number;
    timeframe: string;
    description: string;
  }>;
  tips: string[];
  nextSteps: string[];
}

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Bem-vindo', description: 'Vamos configurar sua conta' },
  { id: 'profile', title: 'Perfil', description: 'Conte-nos sobre você' },
  { id: 'goals', title: 'Objetivos', description: 'Seus objetivos financeiros' },
  { id: 'income', title: 'Renda', description: 'Informações de renda' },
  { id: 'ai-analysis', title: 'Análise IA', description: 'Recomendações personalizadas' },
  { id: 'setup', title: 'Configuração', description: 'Aplicar configurações' },
  { id: 'complete', title: 'Concluído', description: 'Tudo pronto!' }
];

const FINANCIAL_GOALS = [
  { id: 'emergency', label: 'Reserva de Emergência', icon: '🛡️' },
  { id: 'vacation', label: 'Viagem/Férias', icon: '✈️' },
  { id: 'house', label: 'Casa Própria', icon: '🏠' },
  { id: 'car', label: 'Veículo', icon: '🚗' },
  { id: 'investment', label: 'Investimentos', icon: '📈' },
  { id: 'education', label: 'Educação', icon: '🎓' },
  { id: 'retirement', label: 'Aposentadoria', icon: '👴' },
  { id: 'business', label: 'Negócio Próprio', icon: '💼' }
];

const PRIORITIES = [
  { id: 'save', label: 'Economizar Dinheiro', icon: '💰' },
  { id: 'budget', label: 'Controlar Gastos', icon: '📊' },
  { id: 'invest', label: 'Investir Melhor', icon: '📈' },
  { id: 'debt', label: 'Quitar Dívidas', icon: '💳' },
  { id: 'plan', label: 'Planejar Futuro', icon: '🎯' },
  { id: 'track', label: 'Acompanhar Finanças', icon: '📱' }
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    accountType: 'individual',
    mainGoals: [],
    currentSituation: '',
    priorities: []
  });
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get AI recommendations
  const getAIRecommendations = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await apiRequest('POST', '/api/ai/onboarding-analysis', data);
      return response.json();
    },
    onSuccess: (recommendations) => {
      setAiRecommendations(recommendations);
      setIsAnalyzing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na análise",
        description: error.message || "Erro ao gerar recomendações.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  });

  // Complete onboarding
  const completeOnboarding = useMutation({
    mutationFn: async (data: { onboardingData: OnboardingData; recommendations: AIRecommendation }) => {
      const response = await apiRequest('POST', '/api/user/complete-onboarding', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuração concluída!",
        description: "Sua conta foi configurada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao concluir configuração.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep === 4) { // AI Analysis step
      setIsAnalyzing(true);
      getAIRecommendations.mutate(onboardingData);
    }
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (aiRecommendations) {
      completeOnboarding.mutate({
        onboardingData,
        recommendations: aiRecommendations
      });
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleGoal = (goalId: string) => {
    const currentGoals = onboardingData.mainGoals;
    if (currentGoals.includes(goalId)) {
      updateData('mainGoals', currentGoals.filter(g => g !== goalId));
    } else {
      updateData('mainGoals', [...currentGoals, goalId]);
    }
  };

  const togglePriority = (priorityId: string) => {
    const currentPriorities = onboardingData.priorities;
    if (currentPriorities.includes(priorityId)) {
      updateData('priorities', currentPriorities.filter(p => p !== priorityId));
    } else {
      updateData('priorities', [...currentPriorities, priorityId]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Bem-vindo ao FinanceFlow!</h2>
              <p className="text-muted-foreground mb-6">
                Vamos configurar sua conta em alguns passos simples. Nossa IA vai criar 
                recomendações personalizadas baseadas no seu perfil.
              </p>
            </div>
            <div className="grid gap-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Análise inteligente do seu perfil financeiro</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                <Target className="w-5 h-5 text-green-600" />
                <span className="text-sm">Configuração automática de categorias e metas</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm">Recomendações personalizadas para seus objetivos</span>
              </div>
            </div>
          </div>
        );

      case 1: // Profile
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Sobre Você</h2>
              <p className="text-muted-foreground">
                Conte-nos um pouco sobre sua situação para personalizarmos a experiência
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Tipo de conta</Label>
                <Select value={onboardingData.accountType} onValueChange={(value: any) => updateData('accountType', value)}>
                  <SelectTrigger data-testid="select-onboarding-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Individual
                      </div>
                    </SelectItem>
                    <SelectItem value="family">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Família
                      </div>
                    </SelectItem>
                    <SelectItem value="business">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Empresarial
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {onboardingData.accountType === 'family' && (
                <div>
                  <Label htmlFor="familySize">Quantas pessoas na família?</Label>
                  <Input
                    id="familySize"
                    type="number"
                    min="2"
                    max="10"
                    value={onboardingData.familySize || ''}
                    onChange={(e) => updateData('familySize', parseInt(e.target.value) || undefined)}
                    placeholder="Ex: 4"
                    data-testid="input-family-size"
                  />
                </div>
              )}

              {onboardingData.accountType === 'business' && (
                <div>
                  <Label htmlFor="businessType">Tipo de negócio</Label>
                  <Input
                    id="businessType"
                    value={onboardingData.businessType || ''}
                    onChange={(e) => updateData('businessType', e.target.value)}
                    placeholder="Ex: E-commerce, Consultoria, Restaurante..."
                    data-testid="input-business-type"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="currentSituation">Descreva sua situação financeira atual</Label>
                <Textarea
                  id="currentSituation"
                  value={onboardingData.currentSituation}
                  onChange={(e) => updateData('currentSituation', e.target.value)}
                  placeholder="Ex: Quero organizar melhor meus gastos e começar a investir..."
                  rows={3}
                  data-testid="textarea-current-situation"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Goals
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Seus Objetivos</h2>
              <p className="text-muted-foreground">
                Selecione seus principais objetivos financeiros
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {FINANCIAL_GOALS.map((goal) => {
                const isSelected = onboardingData.mainGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    data-testid={`goal-${goal.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{goal.label}</div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-1" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Suas prioridades principais</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PRIORITIES.map((priority) => {
                    const isSelected = onboardingData.priorities.includes(priority.id);
                    return (
                      <button
                        key={priority.id}
                        onClick={() => togglePriority(priority.id)}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${
                          isSelected 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        data-testid={`priority-${priority.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{priority.icon}</span>
                          <span>{priority.label}</span>
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Income
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Informações Financeiras</h2>
              <p className="text-muted-foreground">
                Isso nos ajuda a criar recomendações mais precisas
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="monthlyIncome">Renda mensal aproximada (R$)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  min="0"
                  step="100"
                  value={onboardingData.monthlyIncome || ''}
                  onChange={(e) => updateData('monthlyIncome', parseFloat(e.target.value) || undefined)}
                  placeholder="Ex: 5000"
                  data-testid="input-monthly-income"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Esta informação é privada e usada apenas para recomendações
                </p>
              </div>
            </div>
          </div>
        );

      case 4: // AI Analysis
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  {isAnalyzing ? (
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Brain className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">
                {isAnalyzing ? 'Analisando seu perfil...' : 'Análise Concluída!'}
              </h2>
              <p className="text-muted-foreground">
                {isAnalyzing 
                  ? 'Nossa IA está gerando recomendações personalizadas para você'
                  : 'Confira as recomendações baseadas no seu perfil'
                }
              </p>
            </div>

            {isAnalyzing && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <MessageCircle className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="text-sm">Analisando seus objetivos...</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <Target className="w-5 h-5 text-green-600 animate-pulse" />
                  <span className="text-sm">Criando categorias personalizadas...</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="text-sm">Gerando dicas inteligentes...</span>
                </div>
              </div>
            )}

            {aiRecommendations && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Categorias Recomendadas
                  </h3>
                  <div className="grid gap-2">
                    {aiRecommendations.categories.slice(0, 3).map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge variant="outline">R$ {category.budget}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Metas Sugeridas
                  </h3>
                  <div className="space-y-2">
                    {aiRecommendations.goals.slice(0, 2).map((goal, index) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{goal.title}</span>
                          <Badge>R$ {goal.target}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Dicas Personalizadas
                  </h3>
                  <div className="space-y-2">
                    {aiRecommendations.tips.slice(0, 3).map((tip, index) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5: // Setup
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Aplicar Configurações</h2>
              <p className="text-muted-foreground">
                Vamos criar sua conta com base nas recomendações da IA
              </p>
            </div>
            
            {aiRecommendations && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">O que será criado:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {aiRecommendations.categories.length} categorias personalizadas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {aiRecommendations.goals.length} metas financeiras
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Orçamento inicial configurado
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Perfil otimizado para seus objetivos
                    </li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleComplete}
                  disabled={completeOnboarding.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-complete-onboarding"
                >
                  {completeOnboarding.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Configurando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Finalizar Configuração
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        );

      case 6: // Complete
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Tudo Pronto!</h2>
              <p className="text-muted-foreground mb-6">
                Sua conta foi configurada com sucesso. Você já pode começar a 
                gerenciar suas finanças com as recomendações personalizadas da IA.
              </p>
            </div>
            <div className="grid gap-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm">Categorias e orçamento configurados</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Metas financeiras criadas</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm">Perfil otimizado para seus objetivos</span>
              </div>
            </div>
            <Button 
              onClick={onComplete}
              className="w-full"
              size="lg"
              data-testid="button-start-using"
            >
              Começar a Usar
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Profile
        return onboardingData.currentSituation.trim().length > 10;
      case 2: // Goals
        return onboardingData.mainGoals.length > 0 && onboardingData.priorities.length > 0;
      case 3: // Income
        return onboardingData.monthlyIncome && onboardingData.monthlyIncome > 0;
      case 4: // AI Analysis
        return aiRecommendations !== null;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {user?.firstName ? user.firstName[0] : user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold">Configuração Inicial</h1>
                <p className="text-sm text-muted-foreground">
                  {ONBOARDING_STEPS[currentStep].title} - {ONBOARDING_STEPS[currentStep].description}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {currentStep + 1} de {ONBOARDING_STEPS.length}
            </Badge>
          </div>
          
          <Progress 
            value={(currentStep / (ONBOARDING_STEPS.length - 1)) * 100} 
            className="h-2"
          />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="button-previous"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            {currentStep < ONBOARDING_STEPS.length - 1 && currentStep !== 5 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isAnalyzing}
                data-testid="button-next"
              >
                {currentStep === 4 ? (
                  isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Analisando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OnboardingWizard;