import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, PieChart, BarChart3, DollarSign, Calendar, Target, AlertCircle } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";

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

  const getPaymentMethodLabel = (method: string) => {
    const paymentMethod = PAYMENT_METHODS.find(p => p.value === method);
    return paymentMethod?.label || method.replace('_', ' ');
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getPaymentMethodLabel(method.method)}
                </div>
                <div className="text-xs text-gray-500">
                  {method.count} transações
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights - Destacado */}
      <Card className="financial-card ai-insights-card border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl -m-6 mb-4 p-6">
          <CardTitle className="flex items-center">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold">🧠 Insights e Recomendações da IA</div>
              <div className="text-sm text-purple-100">Análises inteligentes personalizadas</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.insights.length > 0 ? (
              data.insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm"
                  data-testid={`insight-${index}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{insight}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">🧠 IA aguardando dados</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Adicione mais transações para obter análises inteligentes e recomendações personalizadas.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}