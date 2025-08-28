import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function FinancialOverview() {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/financial-summary', startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: async ({ queryKey }) => {
      const [, startDate, endDate] = queryKey;
      const response = await fetch(`/api/financial-summary?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch financial summary');
      return response.json();
    },
  });


  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const balance = summary ? parseFloat(summary.balance) : 0;
  const totalIncome = summary ? parseFloat(summary.totalIncome) : 0;
  const totalExpenses = summary ? parseFloat(summary.totalExpenses) : 0;
  
  
  // Calculate percentage changes (mock data for now since we don't have previous period data)
  const balanceChange = 12.5;
  const incomeChange = 8.2;
  const expenseChange = -3.1;
  const investmentValue = 15320.80; // This would come from investments API
  const investmentChange = 3.2;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border border-blue-400/20 shadow-xl rounded-2xl animate-scale-in hover:shadow-2xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wide mb-3">Saldo Total</p>
              <p className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight modern-large-value" data-testid="balance-total">
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="bg-blue-400/30 rounded-xl p-2.5 backdrop-blur-sm ml-3">
              <Wallet className="w-5 h-5 icon-pulse-smooth" />
            </div>
          </div>
          <div className="flex items-center text-blue-100 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-2 icon-animated" />
            <span>+{balanceChange.toFixed(1)}% este mês</span>
          </div>
        </CardContent>
      </Card>

      {/* Income Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl animate-scale-in hover:shadow-2xl transition-all duration-300 overflow-hidden" style={{animationDelay: '0.1s'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-3">Receitas</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600 tracking-tight leading-tight modern-large-value" data-testid="income-total">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 rounded-xl p-2.5 ml-3">
              <TrendingUp className="w-5 h-5 text-green-600 icon-float" />
            </div>
          </div>
          <div className="flex items-center text-green-600 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-2 icon-animated" />
            <span>+{incomeChange.toFixed(1)}% vs mês anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl animate-scale-in hover:shadow-2xl transition-all duration-300 overflow-hidden" style={{animationDelay: '0.2s'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-3">Gastos</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-600 tracking-tight leading-tight modern-large-value" data-testid="expenses-total">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 rounded-xl p-2.5 ml-3">
              <TrendingDown className="w-5 h-5 text-red-600 icon-bounce-target" />
            </div>
          </div>
          <div className="flex items-center text-red-600 text-sm font-medium">
            <TrendingDown className="w-4 h-4 mr-2 icon-animated" />
            <span>{expenseChange.toFixed(1)}% vs mês anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Investments Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl animate-scale-in hover:shadow-2xl transition-all duration-300 overflow-hidden" style={{animationDelay: '0.3s'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-3">Investimentos</p>
              <p className="text-2xl lg:text-3xl font-bold text-purple-600 tracking-tight leading-tight modern-large-value" data-testid="investments-total">
                {formatCurrency(investmentValue)}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-xl p-2.5 ml-3">
              <PieChart className="w-5 h-5 text-purple-600 icon-shield-glow" />
            </div>
          </div>
          <div className="flex items-center text-purple-600 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-2 icon-animated" />
            <span>+{investmentChange.toFixed(1)}% rendimento</span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
