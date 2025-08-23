import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PieChart, Clock } from "lucide-react";
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

  const { data: commitments, isLoading: isLoadingCommitments } = useQuery({
    queryKey: ['/api/transactions/future-commitments'],
    queryFn: async () => {
      const response = await fetch('/api/transactions/future-commitments', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch future commitments');
      return response.json();
    },
  });

  if (isLoading || isLoadingCommitments) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
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
  
  // Calculate future commitments total
  const totalOutstanding = commitments ? commitments.reduce((total, commitment) => {
    const remainingInstallments = commitment.totalInstallments - commitment.paidInstallments;
    const remainingValue = remainingInstallments * parseFloat(commitment.installmentValue);
    return total + remainingValue;
  }, 0) : 0;

  const totalCommitments = commitments?.length || 0;
  
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">Saldo Total</p>
              <p className="text-2xl font-bold" data-testid="balance-total">
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-blue-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+{balanceChange}% este mês</span>
          </div>
        </CardContent>
      </Card>

      {/* Income Card */}
      <Card className="financial-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Receitas</p>
              <p className="text-2xl font-bold text-green-600" data-testid="income-total">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center text-green-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+{incomeChange}% vs mês anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card className="financial-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Gastos</p>
              <p className="text-2xl font-bold text-red-600" data-testid="expenses-total">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 rounded-lg p-3">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center text-red-600 text-sm">
            <TrendingDown className="w-4 h-4 mr-1" />
            <span>{expenseChange}% vs mês anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Investments Card */}
      <Card className="financial-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Investimentos</p>
              <p className="text-2xl font-bold text-purple-600" data-testid="investments-total">
                {formatCurrency(investmentValue)}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-3">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center text-purple-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+{investmentChange}% rendimento</span>
          </div>
        </CardContent>
      </Card>

      {/* Future Commitments Card */}
      <Card className="financial-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Compromissos</p>
              <p className="text-2xl font-bold text-orange-600" data-testid="commitments-total">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-3">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center text-orange-600 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            <span>{totalCommitments} parcelamento{totalCommitments !== 1 ? 's' : ''} ativo{totalCommitments !== 1 ? 's' : ''}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
