import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Brain, 
  Eye, 
  BarChart3,
  Calendar,
  DollarSign,
  Zap,
  Target,
  Activity,
  RefreshCw
} from "lucide-react";

interface PredictionData {
  predictions: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
  confidence: number;
  factors: string[];
  recommendations: string[];
  seasonalTrends: Array<{
    month: number;
    expectedChange: number;
    reason: string;
  }>;
}

interface AnomalyData {
  id: string;
  transactionId: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  anomalyScore: number;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  createdAt: string;
}

interface CashflowPrediction {
  id: string;
  predictionDate: string;
  predictedInflow: number;
  predictedOutflow: number;
  predictedBalance: number;
  confidence: number;
}

const timeframes = [
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
  { value: '1y', label: '1 ano' }
];

const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function PredictiveInsights() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState("predictions");

  const { data: expensePredictions, isLoading: loadingPredictions, refetch: refetchPredictions } = useQuery({
    queryKey: ["/api/predictions/expenses", { timeframe: selectedTimeframe }],
    retry: false,
  });

  const { data: cashflowPredictions, isLoading: loadingCashflow } = useQuery({
    queryKey: ["/api/predictions/cashflow"],
    retry: false,
  });

  const { data: anomalies, isLoading: loadingAnomalies } = useQuery({
    queryKey: ["/api/anomalies"],
    retry: false,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderPredictionCard = (data: PredictionData) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Previsões de Gastos
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Baseado em seu histórico financeiro
            </p>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              {Math.round(data.confidence * 100)}% confiança
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                R$ {data.predictions.next30Days.toLocaleString('pt-BR')}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">30 dias</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                R$ {data.predictions.next60Days.toLocaleString('pt-BR')}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">60 dias</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                R$ {data.predictions.next90Days.toLocaleString('pt-BR')}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">90 dias</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Fatores de Influência
            </h4>
            <ul className="space-y-1">
              {data.factors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recomendações
            </h4>
            <ul className="space-y-1">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>

          {data.seasonalTrends.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tendências Sazonais
              </h4>
              <div className="space-y-2">
                {data.seasonalTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{monthNames[trend.month - 1]}</span>
                      <span className="text-xs text-gray-500">{trend.reason}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {trend.expectedChange > 0 ? (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        trend.expectedChange > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {trend.expectedChange > 0 ? '+' : ''}{trend.expectedChange}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCashflowChart = (predictions: CashflowPrediction[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Previsão de Fluxo de Caixa (90 dias)
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Projeção do seu saldo futuro
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictions.slice(0, 30).map((prediction, index) => {
            const date = new Date(prediction.predictionDate);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div 
                key={prediction.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isWeekend ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">
                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Conf: {Math.round(prediction.confidence)}%
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Entradas</div>
                    <div className="text-sm font-medium text-green-600">
                      +R$ {prediction.predictedInflow.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Saídas</div>
                    <div className="text-sm font-medium text-red-600">
                      -R$ {prediction.predictedOutflow.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="text-right min-w-[100px]">
                    <div className="text-xs text-gray-500">Saldo</div>
                    <div className={`text-sm font-bold ${
                      prediction.predictedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {prediction.predictedBalance.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderAnomalyCard = (anomaly: AnomalyData) => (
    <Card key={anomaly.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              {getSeverityIcon(anomaly.severity)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{anomaly.title}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {anomaly.description}
              </p>
            </div>
          </div>
          <Badge className={getSeverityColor(anomaly.severity)}>
            {anomaly.severity === 'critical' ? 'Crítico' : 
             anomaly.severity === 'warning' ? 'Atenção' : 'Informativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Valor Esperado</div>
            <div className="text-sm font-medium">
              R$ {anomaly.expectedValue.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Valor Real</div>
            <div className="text-sm font-medium">
              R$ {anomaly.actualValue.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Score de Anomalia</span>
            <span>{Math.round(anomaly.anomalyScore)}%</span>
          </div>
          <Progress value={anomaly.anomalyScore} className="h-2" />
        </div>

        <div className="text-xs text-gray-500">
          Detectado em {new Date(anomaly.createdAt).toLocaleString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" data-testid="predictive-insights">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análise Preditiva</h2>
          <p className="text-muted-foreground">
            Insights inteligentes e detecção de anomalias em suas finanças
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            IA Avançada
          </Badge>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => refetchPredictions()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions" data-testid="tab-predictions">Previsões</TabsTrigger>
          <TabsTrigger value="cashflow" data-testid="tab-cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="anomalies" data-testid="tab-anomalies">
            Anomalias ({anomalies?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Previsões de Gastos</h3>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32" data-testid="select-timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((timeframe) => (
                  <SelectItem key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingPredictions ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : expensePredictions ? (
            renderPredictionCard(expensePredictions)
          ) : (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                Ainda não há dados suficientes para gerar previsões precisas. 
                Continue registrando suas transações para obter insights mais detalhados.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          {loadingCashflow ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : cashflowPredictions && cashflowPredictions.length > 0 ? (
            renderCashflowChart(cashflowPredictions)
          ) : (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                As previsões de fluxo de caixa estão sendo calculadas. 
                Volte em alguns minutos para ver suas projeções financeiras.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          {loadingAnomalies ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : anomalies && anomalies.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {anomalies.map(renderAnomalyCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma anomalia detectada</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Suas transações estão seguindo os padrões normais. Nossa IA monitora continuamente por anomalias.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}