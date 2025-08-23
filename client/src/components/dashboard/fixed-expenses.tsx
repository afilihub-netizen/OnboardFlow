import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Zap, Wifi, Car, Calendar, Plus } from "lucide-react";

const getCategoryIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('aluguel') || lowerName.includes('casa')) return Home;
  if (lowerName.includes('energia') || lowerName.includes('luz')) return Zap;
  if (lowerName.includes('internet') || lowerName.includes('wifi')) return Wifi;
  if (lowerName.includes('seguro') || lowerName.includes('carro')) return Car;
  return Calendar;
};

const getCategoryColor = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('aluguel')) return 'bg-blue-100 dark:bg-blue-900 text-blue-600';
  if (lowerName.includes('energia')) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600';
  if (lowerName.includes('internet')) return 'bg-purple-100 dark:bg-purple-900 text-purple-600';
  if (lowerName.includes('seguro')) return 'bg-red-100 dark:bg-red-900 text-red-600';
  return 'bg-gray-100 dark:bg-gray-900 text-gray-600';
};

const getStatusColor = (isPaid: boolean) => {
  return isPaid ? 'bg-green-500' : 'bg-orange-500';
};

const getStatusTitle = (isPaid: boolean) => {
  return isPaid ? 'Pago' : 'Pendente';
};

export function FixedExpenses() {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['/api/fixed-expenses'],
    queryFn: async () => {
      const response = await fetch('/api/fixed-expenses', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch fixed expenses');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contas Fixas do Mês</CardTitle>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
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

  const formatDueDate = (dueDay: number) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const dueDate = new Date(currentYear, currentMonth, dueDay);
    
    return `Vence em ${dueDay.toString().padStart(2, '0')}/${(currentMonth + 1).toString().padStart(2, '0')}`;
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contas Fixas do Mês</CardTitle>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white" data-testid="button-add-fixed-expense">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conta fixa cadastrada.</p>
            <p className="text-sm">Adicione suas contas mensais para melhor controle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {expenses.map((expense) => {
              const Icon = getCategoryIcon(expense.name);
              
              return (
                <div 
                  key={expense.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  data-testid={`fixed-expense-${expense.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(expense.name)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm" data-testid={`expense-name-${expense.id}`}>
                        {expense.name}
                      </span>
                    </div>
                    <span 
                      className={`w-2 h-2 ${getStatusColor(expense.isPaid)} rounded-full`} 
                      title={getStatusTitle(expense.isPaid)}
                      data-testid={`expense-status-${expense.id}`}
                    ></span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid={`expense-amount-${expense.id}`}>
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`expense-due-date-${expense.id}`}>
                    {formatDueDate(expense.dueDay)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
