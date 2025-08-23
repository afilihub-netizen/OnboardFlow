import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { ExpensesChart } from "@/components/dashboard/expenses-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { FixedExpenses } from "@/components/dashboard/fixed-expenses";
import { MonthlyGoalsNotifications } from "@/components/dashboard/monthly-goals-notifications";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
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
          title="Dashboard" 
          subtitle="Visão geral das suas finanças" 
        />
        
        <div className="p-6 space-y-6">
          {/* Monthly Goals Notifications */}
          <MonthlyGoalsNotifications />
          
          {/* Financial Overview Cards */}
          <FinancialOverview />
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashFlowChart />
            <ExpensesChart />
          </div>
          
          {/* Recent Transactions & AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentTransactions />
            <AIInsights />
          </div>
          
          {/* Fixed Expenses */}
          <FixedExpenses />
        </div>
      </main>
    </div>
  );
}
