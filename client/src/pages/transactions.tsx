import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionHistory } from "@/components/transactions/transaction-history";

export default function Transactions() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isBusinessAccount } = useBusinessTheme();

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
    <div className={`flex h-screen overflow-hidden ${isBusinessAccount ? '' : 'bg-gray-50 dark:bg-gray-900'}`}>
      <Sidebar />
      
      <main className="flex-1 overflow-auto min-w-0">
        <Header 
          title={isBusinessAccount ? "Movimentação Financeira" : "Lançamentos"} 
          subtitle={isBusinessAccount ? "Controle de receitas, despesas e fluxo de caixa empresarial" : "Gerencie suas receitas e despesas"} 
        />
        
        <div className="p-6 space-y-8">
          <TransactionForm />
          <TransactionHistory />
        </div>
      </main>
    </div>
  );
}
