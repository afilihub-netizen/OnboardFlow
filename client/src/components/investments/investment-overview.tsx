import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target } from "lucide-react";
import { InvestmentGoals } from "./investment-goals";

export function InvestmentOverview() {
  const [period, setPeriod] = useState("12months");

  const { data: investments, isLoading } = useQuery({
    queryKey: ['/api/investments'],
    queryFn: async () => {
      const response = await fetch('/api/investments', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch investments');
      return response.json();
    },
  });

  // Generate chart data based on actual investments and period
  const generateChartData = () => {
    const now = new Date();
    let months = 12;
    if (period === '2years') months = 24;
    if (period === 'year') months = 12;

    const chartData = [];

    // If no investments, create a baseline chart with zeros
    if (!investments || investments.length === 0) {
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
        chartData.push({
          month: monthName,
          value: 0
        });
      }
      return chartData;
    }

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

      // Calculate investments up to this month
      const investmentsUpToDate = investments.filter((investment: any) => {
        const purchaseDate = new Date(investment.purchaseDate);
        return purchaseDate <= date;
      });

      // Calculate total value for this month
      const monthValue = investmentsUpToDate.reduce((total: number, investment: any) => {
        // Use actual values from investments
        const baseValue = parseFloat(investment.initialAmount || '0');
        const currentValue = parseFloat(investment.currentAmount || investment.initialAmount || '0');
        const growth = currentValue / (baseValue || 1);
        
        // Apply time-based growth simulation for historical data
        const monthsFromPurchase = Math.max(1, (now.getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
        const timeGrowth = Math.pow(growth, Math.min(1, monthsFromPurchase / 12));
        
        return total + baseValue * timeGrowth;
      }, 0);

      chartData.push({
        month: monthName,
        value: Math.round(monthValue)
      });
    }

    return chartData;
  };

  const chartData = generateChartData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateTotalValue = () => {
    if (!investments) return 0;
    return investments.reduce((total, investment) => {
      return total + parseFloat(investment.currentAmount);
    }, 0);
  };

  const calculateTotalGain = () => {
    if (!investments) return { amount: 0, percentage: 0 };
    
    const totalCurrent = calculateTotalValue();
    const totalInitial = investments.reduce((total, investment) => {
      return total + parseFloat(investment.initialAmount);
    }, 0);
    
    const gain = totalCurrent - totalInitial;
    const percentage = totalInitial > 0 ? (gain / totalInitial) * 100 : 0;
    
    return { amount: gain, percentage };
  };

  const totalValue = calculateTotalValue();
  const { amount: totalGain, percentage: gainPercentage } = calculateTotalGain();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="chart-container">
            <CardHeader>
              <CardTitle>Evolução dos Investimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="chart-container">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Evolução dos Investimentos</CardTitle>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12months">Últimos 12 meses</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                  <SelectItem value="2years">Últimos 2 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="month" 
                      className="text-gray-600 dark:text-gray-300"
                    />
                    <YAxis 
                      tickFormatter={(value) => value === 0 ? 'R$ 0' : `R$ ${(value / 1000).toFixed(0)}k`}
                      className="text-gray-600 dark:text-gray-300"
                      domain={[0, 'dataMax']}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Valor Investido']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--chart-4))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-4">
                    <TrendingUp className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Comece a investir
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Adicione seus primeiros investimentos para acompanhar a evolução do seu portfólio
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {(!investments || investments.length === 0) && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Dica:</strong> Vá para a seção "Portfólio" abaixo para adicionar seus primeiros investimentos e começar a acompanhar sua evolução patrimonial.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        {/* Investment Summary */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Investido</p>
                <p className="text-2xl font-bold" data-testid="total-investment-value">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-lg p-3">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-purple-100 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span data-testid="investment-gain">
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({gainPercentage.toFixed(1)}%) este ano
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Investment Goal */}
        <InvestmentGoals />
      </div>
    </div>
  );
}
