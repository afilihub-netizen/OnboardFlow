import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Briefcase, Car, Home, Utensils, HeartHandshake, Activity } from "lucide-react";
import { Link } from "wouter";
import { PAYMENT_METHODS, TRANSACTION_TYPES } from "@/lib/constants";

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('mercado') || name.includes('supermercado')) return ShoppingCart;
  if (name.includes('trabalho') || name.includes('salário')) return Briefcase;
  if (name.includes('transporte') || name.includes('combustível')) return Car;
  if (name.includes('casa') || name.includes('aluguel')) return Home;
  if (name.includes('alimentação') || name.includes('restaurante')) return Utensils;
  return HeartHandshake;
};

const getCategoryColor = (type: string) => {
  return type === 'income' ? 'text-green-600 bg-green-100 dark:bg-green-900' : 'text-red-600 bg-red-100 dark:bg-red-900';
};

// Função para traduzir tipos de transação
const getTransactionTypeLabel = (type: string) => {
  const transactionType = TRANSACTION_TYPES.find(t => t.value === type);
  return transactionType?.label || type;
};

// Função para traduzir métodos de pagamento
const getPaymentMethodLabel = (method: string) => {
  const paymentMethod = PAYMENT_METHODS.find(p => p.value === method);
  return paymentMethod?.label || method;
};

export function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions?limit=5', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Card className="modern-card shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
            <Activity className="w-5 h-5 text-green-600" />
            Transações Recentes
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-medium shadow-sm"
            data-testid="button-view-all-transactions"
          >
            <Link href="/transactions">Ver todas</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Nenhuma transação encontrada.</p>
              <p className="text-sm">Adicione sua primeira transação para começar.</p>
            </div>
          ) : (
            transactions?.map((transaction: any, index: number) => {
              const Icon = getCategoryIcon(transaction.description);
              
              return (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  data-testid={`transaction-item-${index}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(transaction.type)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white leading-tight" data-testid={`transaction-description-${index}`}>
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1" data-testid={`transaction-date-${index}`}>
                        {formatDate(transaction.date)} • {getPaymentMethodLabel(transaction.paymentMethod)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold tracking-tight ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} data-testid={`transaction-amount-${index}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    {transaction.totalInstallments && transaction.paidInstallments !== undefined && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                        {transaction.paidInstallments}/{transaction.totalInstallments} parcelas
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
