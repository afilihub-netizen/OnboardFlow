import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { InvestmentOverview } from "@/components/investments/investment-overview";
import { Portfolio } from "@/components/investments/portfolio";
import { InvestmentNotifications } from "@/components/investments/investment-notifications";

export default function Investments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
          title="Investimentos" 
          subtitle="Acompanhe seu portfólio" 
        />
        
        <div className="p-6 space-y-6">
          <InvestmentNotifications />
          <InvestmentOverview />
          <Portfolio />
        </div>
      </main>
    </div>
  );
}
