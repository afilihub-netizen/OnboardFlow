import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS } from "@/lib/constants";
import { Link } from "wouter";

export function ExpensesChart() {
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
      <Card className="chart-container">
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = summary?.categoryBreakdown?.map((item, index) => ({
    name: item.categoryName,
    value: parseFloat(item.total),
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="chart-container">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gastos por Categoria</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 font-medium shadow-sm"
            data-testid="button-view-details"
          >
            <Link href="/reports">Ver detalhes</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-gray-600 dark:text-gray-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
