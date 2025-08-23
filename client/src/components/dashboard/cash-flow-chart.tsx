import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CashFlowChart() {
  const [period, setPeriod] = useState("6months");

  // Fetch real cash flow data
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['/api/cash-flow-data', period],
    queryFn: async () => {
      // Calculate date ranges based on period
      const now = new Date();
      let months = 6;
      if (period === '12months') months = 12;
      if (period === 'year') months = 12;

      const cashFlowData = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const startDate = date.toISOString();
        const endDate = nextDate.toISOString();
        
        try {
          const response = await fetch(`/api/financial-summary?startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            cashFlowData.push({
              month: date.toLocaleDateString('pt-BR', { month: 'short' }),
              receitas: parseFloat(data.totalIncome || '0'),
              despesas: Math.abs(parseFloat(data.totalExpenses || '0')),
            });
          } else {
            // Fallback to zero if no data
            cashFlowData.push({
              month: date.toLocaleDateString('pt-BR', { month: 'short' }),
              receitas: 0,
              despesas: 0,
            });
          }
        } catch (error) {
          // Fallback to zero on error
          cashFlowData.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short' }),
            receitas: 0,
            despesas: 0,
          });
        }
      }
      
      return cashFlowData;
    },
  });

  if (isLoading) {
    return (
      <Card className="chart-container">
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fluxo de Caixa</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Últimos 12 meses</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                className="text-gray-600 dark:text-gray-300"
              />
              <YAxis 
                tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
                className="text-gray-600 dark:text-gray-300"
              />
              <Tooltip 
                formatter={(value, name) => [
                  `R$ ${Number(value).toLocaleString('pt-BR')}`, 
                  name === 'receitas' ? 'Receitas' : 'Despesas'
                ]}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receitas" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: 'hsl(var(--success))' }}
              />
              <Line 
                type="monotone" 
                dataKey="despesas" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: 'hsl(var(--destructive))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
