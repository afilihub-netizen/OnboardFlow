import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CashFlowPrediction {
  month: string;
  predicted_income: number;
  predicted_expenses: number;
  predicted_balance: number;
  confidence: number;
  alerts: string[];
}

interface PredictiveData {
  predictions: CashFlowPrediction[];
  insights: string[];
  recommendations: string[];
  accuracy_score: number;
}

export function CashFlowPredictor() {
  const [predictions, setPredictions] = useState<PredictiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('6'); // 6 meses por padrão
  const { toast } = useToast();

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      // Como ainda não temos a API implementada, vou simular dados
      const simulatedData: PredictiveData = {
        predictions: generateMockPredictions(parseInt(period)),
        insights: [
          "📈 Tendência de crescimento de 8% nas receitas nos próximos 3 meses",
          "⚠️ Gastos com alimentação podem aumentar 15% baseado no padrão atual",
          "💰 Economia projetada de R$ 1.200 se mantiver o ritmo atual",
          "🔄 Padrão sazonal detectado: gastos maiores no final do mês"
        ],
        recommendations: [
          "Considere criar uma reserva de emergência de R$ 2.500 para cobrir possíveis déficits",
          "Negocie descontos com fornecedores recorrentes para melhorar o fluxo",
          "Planeje compras maiores para a primeira quinzena do mês",
          "Monitore de perto os gastos com categoria 'Outros' que cresceram 25%"
        ],
        accuracy_score: 0.87
      };
      
      setPredictions(simulatedData);
    } catch (error) {
      console.error('Erro ao obter previsões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar as previsões de fluxo de caixa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPredictions = (months: number): CashFlowPrediction[] => {
    const predictions = [];
    const baseIncome = 5000;
    const baseExpenses = 3500;
    
    for (let i = 1; i <= months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      
      const seasonality = Math.sin((month.getMonth() / 12) * 2 * Math.PI) * 0.1;
      const growth = i * 0.02; // 2% crescimento por mês
      
      const income = baseIncome * (1 + growth + seasonality) + (Math.random() - 0.5) * 300;
      const expenses = baseExpenses * (1 + growth * 0.5 + seasonality * 0.5) + (Math.random() - 0.5) * 400;
      const balance = income - expenses;
      
      predictions.push({
        month: month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        predicted_income: Math.round(income),
        predicted_expenses: Math.round(expenses),
        predicted_balance: Math.round(balance),
        confidence: 0.75 + Math.random() * 0.2,
        alerts: balance < 500 ? ['⚠️ Fluxo de caixa baixo'] : []
      });
    }
    
    return predictions;
  };

  useEffect(() => {
    fetchPredictions();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 1000) return 'text-green-600';
    if (balance > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card data-testid="cashflow-predictor-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Fluxo de Caixa Preditivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Gerando previsões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions) {
    return (
      <Card data-testid="cashflow-predictor-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Fluxo de Caixa Preditivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Não foi possível gerar as previsões</p>
            <Button onClick={fetchPredictions} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Fluxo de Caixa Preditivo
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                Precisão: {Math.round(predictions.accuracy_score * 100)}%
              </Badge>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchPredictions} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions.predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'predicted_income' ? 'Receita' : 
                    name === 'predicted_expenses' ? 'Despesas' : 'Saldo'
                  ]}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                <Line 
                  type="monotone" 
                  dataKey="predicted_income" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Receita Prevista"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Despesas Previstas"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_balance" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Saldo Previsto"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Previsões */}
      <Card data-testid="predictions-table">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Previsões Detalhadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Período</th>
                  <th className="text-right py-2">Receita</th>
                  <th className="text-right py-2">Despesas</th>
                  <th className="text-right py-2">Saldo</th>
                  <th className="text-center py-2">Confiança</th>
                  <th className="text-center py-2">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {predictions.predictions.map((prediction, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50">
                    <td className="py-3 font-medium">{prediction.month}</td>
                    <td className="text-right py-3 text-green-600">
                      {formatCurrency(prediction.predicted_income)}
                    </td>
                    <td className="text-right py-3 text-red-600">
                      {formatCurrency(prediction.predicted_expenses)}
                    </td>
                    <td className={`text-right py-3 font-bold ${getBalanceColor(prediction.predicted_balance)}`}>
                      {formatCurrency(prediction.predicted_balance)}
                    </td>
                    <td className="text-center py-3">
                      <Badge variant={prediction.confidence > 0.8 ? "default" : "secondary"}>
                        {Math.round(prediction.confidence * 100)}%
                      </Badge>
                    </td>
                    <td className="text-center py-3">
                      {prediction.alerts.length > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="predictions-insights">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Insights Preditivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="predictions-recommendations">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                >
                  <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}