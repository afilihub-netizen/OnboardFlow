import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target } from "lucide-react";

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

  // Generate sample chart data - in a real app this would come from investment history API
  const chartData = [
    { month: 'Jan', value: 12000 },
    { month: 'Fev', value: 12500 },
    { month: 'Mar', value: 13200 },
    { month: 'Abr', value: 13800 },
    { month: 'Mai', value: 14100 },
    { month: 'Jun', value: 14600 },
    { month: 'Jul', value: 15000 },
    { month: 'Ago', value: 15200 },
    { month: 'Set', value: 14800 },
    { month: 'Out', value: 15100 },
    { month: 'Nov', value: 15300 },
    { month: 'Dez', value: 15320 },
  ];

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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="month" 
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-gray-600 dark:text-gray-300"
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
            </div>
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
        <Card className="financial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Meta Mensal
              </h4>
              <button className="text-blue-600 hover:text-blue-700 text-sm" data-testid="button-edit-goal">
                Editar
              </button>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">R$ 800 / R$ 1.200</span>
                <span className="text-gray-600 dark:text-gray-400">66%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '66%' }}></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Faltam R$ 400 para atingir sua meta
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
