import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, PieChart, BarChart3, DollarSign, Calendar, Target, AlertCircle } from "lucide-react";

interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  avgPerTransaction: number;
}

interface DetailedAnalysisProps {
  data: {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
    categoryBreakdown: CategoryAnalysis[];
    topCategories: CategoryAnalysis[];
    paymentMethodBreakdown: any[];
    dailyAverage: number;
    monthlyProjection: number;
    insights: string[];
  };
}

export function DetailedAnalysis({ data }: DetailedAnalysisProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getFlowColor = (value: number) => {
    return value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="financial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Transações</p>
                <p className="text-2xl font-bold" data-testid="analysis-total-transactions">
                  {data.totalTransactions}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Receitas</p>
                <p className="text-2xl font-bold text-green-600" data-testid="analysis-total-income">
                  {formatCurrency(data.totalIncome)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600" data-testid="analysis-total-expenses">
                  {formatCurrency(data.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fluxo Líquido</p>
                <p className={`text-2xl font-bold ${getFlowColor(data.netFlow)}`} data-testid="analysis-net-flow">
                  {formatCurrency(data.netFlow)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${getFlowColor(data.netFlow)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Categorias com Mais Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCategories.slice(0, 5).map((category, index) => (
                <div key={category.categoryId} className="space-y-2" data-testid={`top-category-${index}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{index + 1}º</Badge>
                      <span className="font-medium">{category.categoryName}</span>
                      {getTrendIcon(category.trend)}
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(category.totalAmount)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={category.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{category.transactionCount} transações</span>
                      <span>{category.percentage.toFixed(1)}% do total</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Métricas de Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Média Diária</span>
                <span className="font-semibold" data-testid="daily-average">
                  {formatCurrency(data.dailyAverage)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Projeção Mensal</span>
                <span className="font-semibold" data-testid="monthly-projection">
                  {formatCurrency(data.monthlyProjection)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Ticket Médio</span>
                <span className="font-semibold">
                  {formatCurrency(data.totalTransactions > 0 ? Math.abs(data.totalExpenses) / data.totalTransactions : 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Poupança</span>
                <span className={`font-semibold ${getFlowColor(data.netFlow)}`}>
                  {data.totalIncome > 0 ? ((data.netFlow / data.totalIncome) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Métodos de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.paymentMethodBreakdown.map((method, index) => (
              <div key={method.method} className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-lg font-semibold" data-testid={`payment-method-${method.method}`}>
                  {formatCurrency(method.total)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {method.method.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  {method.count} transações
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Insights e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.insights.length > 0 ? (
              data.insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  data-testid={`insight-${index}`}
                >
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">{insight}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum insight disponível para o período selecionado.</p>
                <p className="text-sm">Adicione mais transações para obter análises detalhadas.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}