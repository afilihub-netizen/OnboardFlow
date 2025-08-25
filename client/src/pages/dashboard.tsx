import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
import { BusinessModeIndicator } from "@/components/business/business-mode-indicator";
import { BusinessDepartmentalMetrics } from "@/components/business/business-departmental-metrics";
import { BusinessSuppliersWidget } from "@/components/business/business-suppliers-widget";
import { BusinessFinancialHealth } from "@/components/business/business-financial-health";
import { BusinessCashFlow } from "@/components/business/business-cash-flow";
import { BusinessProjectsROI } from "@/components/business/business-projects-roi";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isBusinessAccount, companyName } = useBusinessTheme();
  const [isAIMinimized, setIsAIMinimized] = useState(true);

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

  if (isLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className={`flex h-screen ${isBusinessAccount ? '' : 'bg-gray-50 dark:bg-gray-900'}`}>
      <BusinessModeIndicator />
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
              
              {/* KPIs Compactos no Topo - Painel Executivo */}
              <BusinessMetrics />
              
              {/* Bloco 1: Fluxo de Caixa */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <BusinessCashFlow />
              </div>
              
              {/* Bloco 2 & 3: Performance de Projetos + Departamentos */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                  <BusinessProjectsROI />
                </div>
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                  <BusinessDepartmentalMetrics />
                </div>
              </div>
              
              {/* Bloco 4 & 5: Fornecedores + Saúde Financeira */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                  <BusinessSuppliersWidget />
                </div>
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                  <BusinessFinancialHealth />
                </div>
              </div>
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
    </div>
  );
}
