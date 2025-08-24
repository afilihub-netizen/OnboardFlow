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
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
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
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid={`transaction-item-${index}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(transaction.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white" data-testid={`transaction-description-${index}`}>
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400" data-testid={`transaction-date-${index}`}>
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} data-testid={`transaction-amount-${index}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    {transaction.totalInstallments && transaction.paidInstallments !== undefined && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {transaction.paidInstallments}/{transaction.totalInstallments} parcelas
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </p>
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
