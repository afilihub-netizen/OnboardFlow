import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, BarChart3, TrendingUp, DollarSign, Rocket, Building, Users } from "lucide-react";
import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { FinancialHealthScore } from "@/components/dashboard/financial-health-score";
import { FutureCommitments } from "@/components/dashboard/future-commitments";
import { ExpensesChart } from "@/components/dashboard/expenses-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { FixedExpenses } from "@/components/dashboard/fixed-expenses";
import { MonthlyGoalsNotifications } from "@/components/dashboard/monthly-goals-notifications";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { BusinessMetrics } from "@/components/business/business-metrics";
import { BusinessDashboardHeader } from "@/components/business/business-dashboard-header";
import { BusinessDepartmentalMetrics } from "@/components/business/business-departmental-metrics";
import { BusinessSuppliersWidget } from "@/components/business/business-suppliers-widget";
import { BusinessFinancialHealth } from "@/components/business/business-financial-health";
import { BusinessCashFlow } from "@/components/business/business-cash-flow";
import { BusinessProjectsROI } from "@/components/business/business-projects-roi";
import { BusinessGamification } from "@/components/business/business-gamification";
import { BusinessSetupWizard } from "@/components/wizard/business-setup-wizard";
import { ClearPreferences } from "@/components/debug/clear-preferences";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isBusinessAccount, companyName } = useBusinessTheme();
  const [isAIMinimized, setIsAIMinimized] = useState(true);
  const [viewMode, setViewMode] = useState<'executive' | 'complete'>('executive');
  const [activeTab, setActiveTab] = useState('financeiro');
  const [showWizard, setShowWizard] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  // Carregar preferências do localStorage na inicialização
  useEffect(() => {
    const savedPrefs = localStorage.getItem('financeflow_business_preferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setUserPreferences(prefs);
      setViewMode(prefs.viewMode || 'executive');
      setActiveTab(prefs.defaultTab || 'financeiro');
    } else if (isBusinessAccount) {
      // Se é conta empresarial e não tem preferências, mostrar wizard
      setShowWizard(true);
    }
  }, [isBusinessAccount]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não Autorizado",
        description: "Você foi desconectado. Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleWizardComplete = (data: any) => {
    const preferences = {
      sector: data.sector,
      priorities: data.priorities,
      viewMode: data.viewMode,
      gamification: data.gamification,
      defaultTab: getDefaultTabBySector(data.sector),
      setupCompleted: true,
      completedAt: new Date().toISOString()
    };
    
    localStorage.setItem('financeflow_business_preferences', JSON.stringify(preferences));
    setUserPreferences(preferences);
    setViewMode(data.viewMode);
    setActiveTab(getDefaultTabBySector(data.sector));
    setShowWizard(false);
    
    toast({
      title: "✅ Configuração Concluída!",
      description: "Sua dashboard foi personalizada com sucesso.",
    });
  };

  const handleWizardSkip = () => {
    const defaultPrefs = {
      sector: 'outros',
      priorities: ['fluxo', 'lucro'],
      viewMode: 'executive',
      gamification: false,
      defaultTab: 'financeiro',
      setupCompleted: false,
      skippedAt: new Date().toISOString()
    };
    
    localStorage.setItem('financeflow_business_preferences', JSON.stringify(defaultPrefs));
    setUserPreferences(defaultPrefs);
    setShowWizard(false);
  };

  const getDefaultTabBySector = (sector: string) => {
    switch (sector) {
      case 'varejo': return 'financeiro';
      case 'ecommerce': return 'projetos';
      case 'consultoria': return 'projetos';
      case 'industria': return 'departamentos';
      default: return 'financeiro';
    }
  };

  const getSectorInfo = () => {
    if (!userPreferences) return null;
    
    const sectorNames: Record<string, string> = {
      varejo: 'Varejo',
      industria: 'Indústria', 
      ecommerce: 'E-commerce',
      consultoria: 'Serviços/Consultoria',
      contabil: 'Contábil/Jurídico',
      outros: 'Outros'
    };
    
    return {
      name: sectorNames[userPreferences.sector] || 'Não definido',
      priorities: userPreferences.priorities || []
    };
  };

  if (isLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className={`flex h-screen ${isBusinessAccount ? '' : 'bg-gray-50 dark:bg-gray-900'}`}>
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title={isBusinessAccount ? "Painel Corporativo" : "Dashboard"} 
          subtitle={isBusinessAccount ? "Controle financeiro empresarial" : "Visão geral das suas finanças"} 
        />
        
        <div className="p-6 space-y-6">
          {/* Business Mode Components - Sistema Empresarial Exclusivo */}
          {isBusinessAccount && (
            <div className="space-y-8 animate-in fade-in-50 duration-700">
              {/* Header Empresarial */}
              <BusinessDashboardHeader />
              
              {/* Toggle de Visualização - Modo Executivo vs Completo */}
              <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Nível de Visualização
                      {userPreferences && (
                        <span className="text-xs text-blue-600 ml-2">
                          ({getSectorInfo()?.name})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {viewMode === 'executive' ? 'Mostrando indicadores principais' : 'Visão completa e detalhada'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={`px-3 py-1 ${viewMode === 'executive' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {viewMode === 'executive' ? 'Modo Executivo' : 'Modo Completo'}
                  </Badge>
                  {userPreferences && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWizard(true)}
                        className="text-xs"
                        data-testid="reconfigure-wizard"
                      >
                        ⚙️ Reconfigurar
                      </Button>
                      <ClearPreferences onClear={() => setUserPreferences(null)} />
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'executive' ? 'complete' : 'executive')}
                    className="flex items-center gap-2"
                    data-testid="toggle-view-mode"
                  >
                    {viewMode === 'executive' ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Ver Completo
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Modo Executivo
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* KPIs Compactos no Topo - Sempre Visível */}
              <BusinessMetrics />
              
              {/* Sistema de Abas Contextuais */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200 h-14 p-1">
                  <TabsTrigger 
                    value="financeiro" 
                    className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    data-testid="tab-financeiro"
                  >
                    <DollarSign className="w-4 h-4" />
                    Financeiro
                  </TabsTrigger>
                  <TabsTrigger 
                    value="projetos" 
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                    data-testid="tab-projetos"
                  >
                    <Rocket className="w-4 h-4" />
                    Projetos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="departamentos" 
                    className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white"
                    data-testid="tab-departamentos"
                  >
                    <Building className="w-4 h-4" />
                    Departamentos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fornecedores" 
                    className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    data-testid="tab-fornecedores"
                  >
                    <Users className="w-4 h-4" />
                    Fornecedores
                  </TabsTrigger>
                </TabsList>
                
                {/* Conteúdo da Aba Financeiro */}
                <TabsContent value="financeiro" className="mt-6 space-y-6">
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <BusinessCashFlow />
                  </div>
                  {viewMode === 'complete' && (
                    <>
                      <div className="transform transition-all duration-300 hover:scale-[1.01] animate-in fade-in-50 duration-500">
                        <BusinessFinancialHealth />
                      </div>
                      {userPreferences?.gamification && (
                        <div className="transform transition-all duration-300 hover:scale-[1.01] animate-in fade-in-50 duration-700">
                          <BusinessGamification />
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
                
                {/* Conteúdo da Aba Projetos */}
                <TabsContent value="projetos" className="mt-6 space-y-6">
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <BusinessProjectsROI />
                  </div>
                </TabsContent>
                
                {/* Conteúdo da Aba Departamentos */}
                <TabsContent value="departamentos" className="mt-6 space-y-6">
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <BusinessDepartmentalMetrics />
                  </div>
                </TabsContent>
                
                {/* Conteúdo da Aba Fornecedores */}
                <TabsContent value="fornecedores" className="mt-6 space-y-6">
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <BusinessSuppliersWidget />
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Indicador do Modo Executivo */}
              {viewMode === 'executive' && (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200">
                    <TrendingUp className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">Modo Executivo Ativo</p>
                      <p className="text-sm">Focando apenas nos indicadores essenciais por aba</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Personal/Family Mode Components - Sistema Pessoal/Familiar */}
          {!isBusinessAccount && (
            <div className="space-y-6 animate-in fade-in-50 duration-700">
              {/* Monthly Goals Notifications */}
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <MonthlyGoalsNotifications />
              </div>
              
              {/* Financial Overview Cards */}
              <div className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                <FinancialOverview />
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="transform transition-all duration-300 hover:scale-105">
                  <FutureCommitments />
                </div>
                <div className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <ExpensesChart />
                </div>
                <div className="transform transition-all duration-300 hover:scale-105">
                  <FinancialHealthScore />
                </div>
              </div>
              
              {/* Recent Transactions & AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <RecentTransactions />
                </div>
                <div className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <AIInsights />
                </div>
              </div>
              
              {/* Fixed Expenses */}
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <FixedExpenses />
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant */}
        {isAIMinimized ? (
          <AIAssistant
            className="fixed bottom-4 right-4 z-50"
            isMinimized={true}
            onToggleMinimize={() => setIsAIMinimized(false)}
          />
        ) : (
          <div className="fixed bottom-4 right-4 w-96 h-[600px] z-50 shadow-xl">
            <AIAssistant
              isMinimized={false}
              onToggleMinimize={() => setIsAIMinimized(true)}
            />
          </div>
        )}
      </main>

      {/* Wizard de Configuração Inicial */}
      {showWizard && (
        <BusinessSetupWizard 
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      )}
    </div>
  );
}
