import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TrendingUp, AlertTriangle, DollarSign, Calendar, Brain, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CashflowPrediction {
  period: string;
  currentBalance: number;
  predictedIncome: number;
  predictedExpenses: number;
  netCashflow: number;
  projectedBalance: number;
  risk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface ScenarioSimulation {
  scenario: string;
  baseline: {
    income: number;
    expenses: number;
    netCashflow: number;
    balance: number;
  };
  simulation: {
    income: number;
    expenses: number;
    netCashflow: number;
    projectedBalance: number;
  };
  changes: {
    incomeChange: number;
    expenseChange: number;
    netChange: number;
  };
  recommendation: string;
}

export default function PredictiveAnalytics() {
  const [selectedDays, setSelectedDays] = useState(30);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [incomeChange, setIncomeChange] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);
  const [newExpenses, setNewExpenses] = useState([{ name: '', amount: 0 }]);
  const { toast } = useToast();

  const { data: cashflowPrediction, isLoading: isLoadingPrediction } = useQuery({
    queryKey: ['/api/nexo/cashflow-prediction', selectedDays],
    queryFn: () => apiRequest(`/api/nexo/cashflow-prediction?days=${selectedDays}`),
  });

  const scenarioMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/nexo/scenario-simulation', { 
      method: 'POST', 
      body: data 
    }),
  });

  const runScenarioSimulation = () => {
    scenarioMutation.mutate({
      incomeChange,
      expenseChanges: expenseChange,
      newExpenses: newExpenses.filter(exp => exp.name && exp.amount > 0)
    });
  };

  const addNewExpense = () => {
    setNewExpenses([...newExpenses, { name: '', amount: 0 }]);
  };

  const removeNewExpense = (index: number) => {
    setNewExpenses(newExpenses.filter((_, i) => i !== index));
  };

  const updateNewExpense = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...newExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setNewExpenses(updated);
  };

  // Mock data for charts
  const chartData = Array.from({ length: 6 }, (_, i) => ({
    month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i],
    income: 8000 + Math.random() * 2000,
    expenses: 6000 + Math.random() * 1500,
    balance: 15000 + i * 500 + Math.random() * 1000,
  }));

  const riskColors = {
    low: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' },
    medium: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
    high: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200' }
  };

  if (isLoadingPrediction) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const prediction = cashflowPrediction as CashflowPrediction;
  const riskStyle = prediction ? riskColors[prediction.risk] : riskColors.low;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Cérebro Analítico
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Inteligência preditiva para suas finanças com análises avançadas e simulações
        </p>
      </div>

      <Tabs defaultValue="prediction" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prediction">Previsão de Fluxo</TabsTrigger>
          <TabsTrigger value="scenarios">Simulação de Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="space-y-6">
          {/* Controles de Período */}
          <div className="flex gap-4 items-center">
            <Label>Período de Análise:</Label>
            <div className="flex gap-2">
              {[7, 15, 30, 60, 90].map((days) => (
                <Button
                  key={days}
                  variant={selectedDays === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDays(days)}
                  data-testid={`button-period-${days}`}
                >
                  {days} dias
                </Button>
              ))}
            </div>
          </div>

          {/* Resumo da Previsão */}
          {prediction && (
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Saldo Atual
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    R$ {prediction.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Receita Prevista
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    R$ {prediction.predictedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gastos Previstos
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                    R$ {prediction.predictedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card className={`${riskStyle.bg} ${riskStyle.border}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${riskStyle.text}`}>
                    Saldo Projetado
                  </CardTitle>
                  <Brain className={`h-4 w-4 ${riskStyle.text.replace('text-', 'text-').replace('800', '600').replace('200', '400')}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${riskStyle.text}`}>
                    R$ {prediction.projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge className={`text-xs mt-1 ${
                    prediction.risk === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                    prediction.risk === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    Risco {prediction.risk === 'low' ? 'Baixo' : prediction.risk === 'medium' ? 'Médio' : 'Alto'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recomendações da IA */}
          {prediction?.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Recomendações Inteligentes
                </CardTitle>
                <CardDescription>
                  Baseado na análise dos seus dados financeiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {prediction.recommendations.map((recommendation, index) => (
                  <Alert key={index} className="border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800 dark:text-purple-200">
                      {recommendation}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Tendência */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Histórica e Projeção</CardTitle>
              <CardDescription>
                Análise dos últimos 6 meses com tendências identificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Receitas" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Gastos" />
                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Saldo" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {/* Simulação de Cenários */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Simulação de Cenários
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Teste diferentes situações e veja como elas afetam suas finanças
              </p>
            </div>
            
            <Dialog open={scenarioDialogOpen} onOpenChange={setScenarioDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white">
                  <Brain className="w-4 h-4 mr-2" />
                  Nova Simulação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Simular Cenário Financeiro</DialogTitle>
                  <DialogDescription>
                    Configure as mudanças que deseja simular e veja o impacto
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="income-change">Mudança na Renda (%)</Label>
                      <Input
                        id="income-change"
                        type="number"
                        value={incomeChange}
                        onChange={(e) => setIncomeChange(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 10 para +10%"
                        data-testid="input-income-change"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="expense-change">Mudança nos Gastos (%)</Label>
                      <Input
                        id="expense-change"
                        type="number"
                        value={expenseChange}
                        onChange={(e) => setExpenseChange(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: -15 para -15%"
                        data-testid="input-expense-change"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label>Novos Gastos Mensais</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addNewExpense}
                        data-testid="button-add-expense"
                      >
                        Adicionar
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {newExpenses.map((expense, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2 items-center">
                          <Input
                            placeholder="Nome do gasto"
                            value={expense.name}
                            onChange={(e) => updateNewExpense(index, 'name', e.target.value)}
                            className="col-span-3"
                            data-testid={`input-expense-name-${index}`}
                          />
                          <Input
                            type="number"
                            placeholder="Valor"
                            value={expense.amount || ''}
                            onChange={(e) => updateNewExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                            data-testid={`input-expense-amount-${index}`}
                          />
                          {newExpenses.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeNewExpense(index)}
                              data-testid={`button-remove-expense-${index}`}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setScenarioDialogOpen(false)}
                      className="flex-1"
                      data-testid="button-cancel-simulation"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={runScenarioSimulation}
                      disabled={scenarioMutation.isPending}
                      className="flex-1"
                      data-testid="button-run-simulation"
                    >
                      {scenarioMutation.isPending ? "Simulando..." : "Executar Simulação"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Resultado da Simulação */}
          {scenarioMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Resultado da Simulação
                </CardTitle>
                <CardDescription>
                  Comparação entre cenário atual e simulado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Cenário Atual */}
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Cenário Atual
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Receita:</span>
                          <span className="font-medium">
                            R$ {scenarioMutation.data.baseline.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Gastos:</span>
                          <span className="font-medium">
                            R$ {scenarioMutation.data.baseline.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 dark:text-gray-400">Fluxo Líquido:</span>
                          <span className={`font-bold ${scenarioMutation.data.baseline.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {scenarioMutation.data.baseline.netCashflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cenário Simulado */}
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Cenário Simulado
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Receita:</span>
                          <span className="font-medium">
                            R$ {scenarioMutation.data.simulation.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <span className={`ml-1 text-xs ${scenarioMutation.data.changes.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({scenarioMutation.data.changes.incomeChange >= 0 ? '+' : ''}
                              R$ {scenarioMutation.data.changes.incomeChange.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Gastos:</span>
                          <span className="font-medium">
                            R$ {scenarioMutation.data.simulation.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <span className={`ml-1 text-xs ${scenarioMutation.data.changes.expenseChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ({scenarioMutation.data.changes.expenseChange >= 0 ? '+' : ''}
                              R$ {scenarioMutation.data.changes.expenseChange.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 dark:text-gray-400">Fluxo Líquido:</span>
                          <span className={`font-bold ${scenarioMutation.data.simulation.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {scenarioMutation.data.simulation.netCashflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <span className={`ml-1 text-xs ${scenarioMutation.data.changes.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({scenarioMutation.data.changes.netChange >= 0 ? '+' : ''}
                              R$ {scenarioMutation.data.changes.netChange.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className={`${
                    scenarioMutation.data.changes.netChange >= 0 ? 
                    'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' :
                    'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    <Brain className={`h-4 w-4 ${scenarioMutation.data.changes.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <AlertDescription className={`${
                      scenarioMutation.data.changes.netChange >= 0 ? 
                      'text-green-800 dark:text-green-200' :
                      'text-red-800 dark:text-red-200'
                    }`}>
                      {scenarioMutation.data.recommendation}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Simulações */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Comparativa</CardTitle>
              <CardDescription>
                Visualização do impacto das mudanças simuladas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Receitas', atual: 8000, simulado: 8000 + (8000 * incomeChange / 100) },
                    { name: 'Gastos', atual: 6000, simulado: 6000 + (6000 * expenseChange / 100) },
                    { name: 'Fluxo Líquido', atual: 2000, simulado: (8000 + (8000 * incomeChange / 100)) - (6000 + (6000 * expenseChange / 100)) }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Bar dataKey="atual" fill="#6b7280" name="Atual" />
                    <Bar dataKey="simulado" fill="#3b82f6" name="Simulado" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}