import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { ExpensesChart } from "@/components/dashboard/expenses-chart";
import { AdvancedFilters } from "@/components/reports/advanced-filters";
import { DetailedAnalysis } from "@/components/reports/detailed-analysis";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const getPeriodDates = (period: string) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };

  const handleExportCSV = () => {
    // Mock data for CSV export - in a real app this would fetch from the API
    const data = [
      { date: '2024-01-15', type: 'Receita', category: 'Salário', amount: 5000.00, description: 'Salário mensal' },
      { date: '2024-01-10', type: 'Despesa', category: 'Alimentação', amount: -150.00, description: 'Supermercado' },
      { date: '2024-01-08', type: 'Despesa', category: 'Transporte', amount: -80.00, description: 'Gasolina' },
      { date: '2024-01-05', type: 'Investimento', category: 'Ações', amount: -1000.00, description: 'Compra de ações' },
    ];

    // Convert to CSV
    const headers = ['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        row.type,
        row.category,
        row.amount.toFixed(2),
        `"${row.description}"`
      ].join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "Seu relatório foi baixado com sucesso em formato CSV.",
    });
  };

  const { startDate, endDate } = getPeriodDates(selectedPeriod);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/financial-summary', startDate.toISOString(), endDate.toISOString()],
    queryFn: async ({ queryKey }) => {
      const [, startDate, endDate] = queryKey;
      const response = await fetch(`/api/financial-summary?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch financial summary');
      return response.json();
    },
  });

  const handleAdvancedAnalysis = async () => {
    if (!advancedFilters) {
      toast({
        title: "Filtros necessários",
        description: "Configure os filtros antes de fazer a análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/reports/detailed-analysis', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advancedFilters),
      });

      if (!response.ok) throw new Error('Failed to fetch analysis');
      
      const data = await response.json();
      setAnalysisData(data);
      
      toast({
        title: "Análise concluída",
        description: "Relatório detalhado gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Falha ao gerar análise detalhada.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const balance = summary ? parseFloat(summary.balance) : 0;
  const totalIncome = summary ? parseFloat(summary.totalIncome) : 0;
  const totalExpenses = summary ? parseFloat(summary.totalExpenses) : 0;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Relatórios" 
          subtitle="Análises detalhadas das suas finanças" 
        />
        
        <div className="p-6 space-y-6">
          {/* Filter Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Análise Financeira</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Escolha entre filtros básicos ou avançados para análise detalhada
              </p>
            </div>
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              data-testid="toggle-advanced-filters"
            >
              {showAdvancedFilters ? "Filtros Básicos" : "Filtros Avançados"}
            </Button>
          </div>

          {/* Advanced or Basic Filters */}
          {showAdvancedFilters ? (
            <AdvancedFilters
              onFiltersChange={setAdvancedFilters}
              onAnalyze={handleAdvancedAnalysis}
              isAnalyzing={isAnalyzing}
            />
          ) : (
            /* Basic Filter Controls */
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtros Básicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Período
                  </label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger data-testid="select-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Este mês</SelectItem>
                      <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                      <SelectItem value="current-year">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleExportCSV}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  data-testid="button-export"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Detailed Analysis Results */}
          {analysisData && showAdvancedFilters && (
            <DetailedAnalysis data={analysisData} />
          )}

          {/* Only show regular reports when not using advanced filters */}
          {!showAdvancedFilters && (
            <>
              {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="financial-card">
              <CardContent className="p-6">
                {summaryLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Receitas</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="report-total-income">
                        {formatCurrency(totalIncome)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                {summaryLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Despesas</p>
                      <p className="text-2xl font-bold text-red-600" data-testid="report-total-expenses">
                        {formatCurrency(totalExpenses)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                {summaryLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo Líquido</p>
                      <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="report-balance">
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashFlowChart />
            <ExpensesChart />
          </div>

          {/* Category Breakdown Table */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Detalhamento por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Transações
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {summary?.categoryBreakdown?.map((category, index) => (
                        <tr key={index} data-testid={`category-row-${index}`}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {category.categoryName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                            {category.count}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                            {formatCurrency(parseFloat(category.total))}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            Nenhum dado encontrado para o período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
              </>
            )}
        </div>
      </main>
    </div>
  );
}
