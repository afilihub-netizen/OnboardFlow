import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Rocket,
  Store,
  Factory,
  Globe,
  Users,
  Calculator,
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  Target,
  Package,
  UserCheck,
  Eye,
  BarChart3,
  Trophy,
  X
} from "lucide-react";

interface WizardData {
  sector: string;
  priorities: string[];
  viewMode: 'executive' | 'complete';
  gamification: boolean;
  companyName: string;
}

interface BusinessSetupWizardProps {
  onComplete: (data: WizardData) => void;
  onSkip: () => void;
}

export function BusinessSetupWizard({ onComplete, onSkip }: BusinessSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    sector: '',
    priorities: [],
    viewMode: 'executive',
    gamification: false,
    companyName: ''
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const sectors = [
    { id: 'varejo', name: 'Varejo', icon: Store, color: 'bg-blue-500' },
    { id: 'industria', name: 'Indústria', icon: Factory, color: 'bg-red-500' },
    { id: 'ecommerce', name: 'E-commerce', icon: Globe, color: 'bg-green-500' },
    { id: 'consultoria', name: 'Serviços / Consultoria', icon: Users, color: 'bg-purple-500' },
    { id: 'contabil', name: 'Escritório Contábil / Jurídico', icon: Calculator, color: 'bg-orange-500' },
    { id: 'outros', name: 'Outros', icon: Building2, color: 'bg-gray-500' }
  ];

  const priorityOptions = [
    { id: 'fluxo', name: 'Fluxo de Caixa', icon: DollarSign, color: 'bg-green-500' },
    { id: 'lucro', name: 'Lucro / Margem', icon: TrendingUp, color: 'bg-blue-500' },
    { id: 'custos', name: 'Custos e Despesas', icon: Receipt, color: 'bg-red-500' },
    { id: 'roi', name: 'ROI de Projetos / Marketing', icon: Target, color: 'bg-purple-500' },
    { id: 'estoque', name: 'Estoque e Operações', icon: Package, color: 'bg-orange-500' },
    { id: 'equipe', name: 'Equipe e Produtividade', icon: UserCheck, color: 'bg-indigo-500' }
  ];

  const handleSectorSelect = (sectorId: string) => {
    setWizardData(prev => ({ ...prev, sector: sectorId }));
  };

  const handlePriorityToggle = (priorityId: string) => {
    setWizardData(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priorityId)
        ? prev.priorities.filter(p => p !== priorityId)
        : prev.priorities.length < 2 
          ? [...prev.priorities, priorityId]
          : prev.priorities
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 2: return wizardData.sector !== '';
      case 3: return wizardData.priorities.length > 0;
      case 4: return wizardData.viewMode === 'executive' || wizardData.viewMode === 'complete';
      default: return true;
    }
  };

  const handleComplete = () => {
    onComplete(wizardData);
  };

  // Tela 1 - Boas-vindas
  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-2xl shadow-2xl bg-white border-2 border-slate-300 rounded-2xl">
          <CardHeader className="text-center pb-6 bg-white rounded-t-2xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl mb-2 text-slate-900 font-bold">👋 Bem-vindo ao FinanceFlow Empresarial</CardTitle>
            <p className="text-slate-700 text-base">
              Antes de começar, queremos conhecer melhor o seu negócio para personalizar sua experiência.
            </p>
            <p className="text-slate-800 font-semibold text-base">
              Em menos de 3 minutos, sua dashboard estará pronta e feita sob medida para você. 🚀
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6 bg-white rounded-b-2xl">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={onSkip} className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <X className="w-4 h-4" />
                Pular Configuração
              </Button>
              <Button onClick={nextStep} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                Começar Personalização
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela 2 - Setor da Empresa
  if (currentStep === 2) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-3xl shadow-2xl bg-white border-2 border-slate-300 rounded-2xl">
          <CardHeader className="text-center bg-white rounded-t-2xl">
            <CardTitle className="text-xl mb-4 text-slate-900 font-bold">Qual é o setor principal da sua empresa?</CardTitle>
            <Progress value={progress} className="h-3" />
          </CardHeader>
          <CardContent className="space-y-6 bg-white rounded-b-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectors.map((sector) => (
                <div
                  key={sector.id}
                  onClick={() => handleSectorSelect(sector.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    wizardData.sector === sector.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid={`sector-${sector.id}`}
                >
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 ${sector.color} rounded-lg flex items-center justify-center mx-auto`}>
                      <sector.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="font-semibold text-sm text-slate-800">{sector.name}</div>
                    {wizardData.sector === sector.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={prevStep} className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300"
                data-testid="next-step"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela 3 - Prioridades de Gestão
  if (currentStep === 3) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-4xl shadow-2xl bg-white border-2 border-slate-300 rounded-2xl">
          <CardHeader className="text-center bg-white rounded-t-2xl">
            <CardTitle className="text-xl mb-2 text-slate-900 font-bold">O que é mais importante para você acompanhar de perto?</CardTitle>
            <p className="text-sm text-slate-700 mb-4 font-medium">Escolha até 2 prioridades</p>
            <Progress value={progress} className="h-3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {priorityOptions.map((priority) => (
                <div
                  key={priority.id}
                  onClick={() => handlePriorityToggle(priority.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    wizardData.priorities.includes(priority.id)
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  } ${wizardData.priorities.length >= 2 && !wizardData.priorities.includes(priority.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  data-testid={`priority-${priority.id}`}
                >
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 ${priority.color} rounded-lg flex items-center justify-center mx-auto`}>
                      <priority.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="font-semibold text-sm">{priority.name}</div>
                    {wizardData.priorities.includes(priority.id) && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {wizardData.priorities.length > 0 && (
              <div className="text-center">
                <Badge variant="outline" className="text-sm">
                  {wizardData.priorities.length}/2 prioridades selecionadas
                </Badge>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={prevStep} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!canProceed()}
                className="flex items-center gap-2"
                data-testid="next-step"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela 4 - Nível de Detalhamento
  if (currentStep === 4) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-2xl shadow-2xl bg-white border-2 border-slate-300 rounded-2xl">
          <CardHeader className="text-center bg-white rounded-t-2xl">
            <CardTitle className="text-xl mb-4 text-slate-900 font-bold">Como você prefere visualizar suas informações?</CardTitle>
            <Progress value={progress} className="h-3" />
          </CardHeader>
          <CardContent className="space-y-6 bg-white rounded-b-2xl">
            <div className="space-y-4">
              <div
                onClick={() => setWizardData(prev => ({ ...prev, viewMode: 'executive' }))}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  wizardData.viewMode === 'executive' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="view-executive"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-slate-800">👔 Visão Resumida (Executiva)</h3>
                    <p className="text-sm text-slate-700">Apenas indicadores principais para tomada rápida de decisão</p>
                  </div>
                  {wizardData.viewMode === 'executive' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>

              <div
                onClick={() => setWizardData(prev => ({ ...prev, viewMode: 'complete' }))}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  wizardData.viewMode === 'complete' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="view-complete"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-slate-800">📊 Visão Completa (Detalhada)</h3>
                    <p className="text-sm text-slate-700">Todos os blocos: financeiro, projetos, departamentos, fornecedores</p>
                  </div>
                  {wizardData.viewMode === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={prevStep} className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300"
                data-testid="next-step"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela 5 - Gamificação
  if (currentStep === 5) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-2xl shadow-2xl bg-white border-2 border-slate-300 rounded-2xl">
          <CardHeader className="text-center bg-white rounded-t-2xl">
            <CardTitle className="text-xl mb-4 text-slate-900 font-bold">Gostaria de ativar os desafios e conquistas mensais?</CardTitle>
            <Progress value={progress} className="h-3" />
          </CardHeader>
          <CardContent className="space-y-6 bg-white rounded-b-2xl">
            <div className="space-y-4">
              <div
                onClick={() => setWizardData(prev => ({ ...prev, gamification: true }))}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  wizardData.gamification 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="gamification-yes"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-slate-800">✅ Sim, quero gamificação</h3>
                    <p className="text-sm text-slate-700">Ativar Score Empresarial, badges e desafios mensais personalizados</p>
                  </div>
                  {wizardData.gamification && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>

              <div
                onClick={() => setWizardData(prev => ({ ...prev, gamification: false }))}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  !wizardData.gamification 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="gamification-no"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-slate-800">❌ Não agora</h3>
                    <p className="text-sm text-slate-700">Pode ativar depois nas configurações quando preferir</p>
                  </div>
                  {!wizardData.gamification && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={prevStep} className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button 
                onClick={nextStep} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="next-step"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela 6 - Finalização
  if (currentStep === 6) {
    const selectedSector = sectors.find(s => s.id === wizardData.sector);
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-2xl shadow-2xl bg-white border-2 border-slate-300 rounded-2xl">
          <CardHeader className="text-center bg-white rounded-t-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl mb-2 text-slate-900 font-bold">🎉 Pronto!</CardTitle>
            <p className="text-slate-700 font-medium">
              Sua dashboard foi personalizada de acordo com o seu setor e prioridades.
            </p>
            <Progress value={100} className="h-3 mt-4" />
          </CardHeader>
          <CardContent className="space-y-6 bg-white rounded-b-2xl">
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-center mb-4 text-slate-800">Configurações Aplicadas:</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Setor:</span>
                  <Badge variant="outline">{selectedSector?.name}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Prioridades:</span>
                  <div className="flex gap-1">
                    {wizardData.priorities.map(p => {
                      const priority = priorityOptions.find(opt => opt.id === p);
                      return (
                        <Badge key={p} variant="outline" className="text-xs">
                          {priority?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Visualização:</span>
                  <Badge variant="outline">
                    {wizardData.viewMode === 'executive' ? 'Resumida' : 'Completa'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Gamificação:</span>
                  <Badge variant={wizardData.gamification ? "default" : "outline"}>
                    {wizardData.gamification ? 'Ativada' : 'Desativada'}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-slate-700 font-medium">
              Você poderá alterar essas preferências a qualquer momento nas configurações.
            </p>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={prevStep} className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button 
                onClick={handleComplete} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                data-testid="complete-wizard"
              >
                🚀 Ir para Minha Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}