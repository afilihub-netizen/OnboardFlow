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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title={isBusinessAccount ? "Painel Corporativo" : "Dashboard"} 
          subtitle={isBusinessAccount ? "Controle financeiro empresarial" : "Visão geral das suas finanças"} 
        />
        
        <div className="p-6 space-y-6">
          {/* Business Header (only for business accounts) */}
          {isBusinessAccount && <BusinessDashboardHeader />}
          
          {/* Business Metrics (only for business accounts) */}
          {isBusinessAccount && <BusinessMetrics />}
          
          {/* Monthly Goals Notifications */}
          <MonthlyGoalsNotifications />
          
          {/* Financial Overview Cards */}
          <FinancialOverview />
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FutureCommitments />
            <ExpensesChart />
            <FinancialHealthScore />
          </div>
          
          {/* Recent Transactions & AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentTransactions />
            <AIInsights />
          </div>
          
          {/* Fixed Expenses */}
          <FixedExpenses />
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
