import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PiggyBank, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

interface FinancialHealthData {
  score: number;
  factors: HealthFactor[];
  recommendations: string[];
}

export function FinancialHealthScore() {
  const [healthData, setHealthData] = useState<FinancialHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchHealthScore = async () => {
    setIsLoading(true);
    try {
      const data: FinancialHealthData = await apiRequest('GET', '/api/ai/financial-health') as FinancialHealthData;
      setHealthData(data);
    } catch (error) {
      console.error('Erro ao obter score de saúde:', error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular seu score de saúde financeira.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScore();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muito Bom';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Necessita Atenção';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Heart className="w-6 h-6 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-6 h-6 text-yellow-600" />;
    return <TrendingDown className="w-6 h-6 text-red-600" />;
  };

  const getFactorIcon = (factorName: string) => {
    switch (factorName) {
      case 'Equilíbrio Receita/Despesa':
        return <PiggyBank className="w-4 h-4" />;
      case 'Diversificação de Categorias':
        return <Target className="w-4 h-4" />;
      case 'Capacidade de Poupança':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="financial-health-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Calculando seu score...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card data-testid="financial-health-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Não foi possível calcular seu score</p>
            <Button onClick={fetchHealthScore} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Principal */}
      <Card data-testid="financial-health-score">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Saúde Financeira
            </div>
            <Button 
              onClick={fetchHealthScore} 
              variant="ghost" 
              size="sm"
              data-testid="refresh-score"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="flex items-center justify-center">
                {getScoreIcon(healthData.score)}
                <div className="ml-3">
                  <div className={`text-4xl font-bold ${getScoreColor(healthData.score)}`}>
                    {healthData.score}
                  </div>
                  <div className="text-sm text-slate-600">de 100 pontos</div>
                </div>
              </div>
              <Badge 
                variant={healthData.score >= 60 ? "default" : "secondary"}
                className="absolute -top-2 -right-2"
              >
                {getScoreLabel(healthData.score)}
              </Badge>
            </div>

            <Progress 
              value={healthData.score} 
              className="w-full h-3"
              data-testid="health-progress"
            />

            <div className="grid grid-cols-4 gap-1 text-xs text-slate-500">
              <div>0</div>
              <div>25</div>
              <div>50</div>
              <div>75</div>
              <div>100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fatores de Saúde */}
      <Card data-testid="health-factors">
        <CardHeader>
          <CardTitle className="text-lg">Fatores de Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData.factors && healthData.factors.length > 0 ? (
              healthData.factors.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFactorIcon(factor.name)}
                      <span className="font-medium text-sm">{factor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getScoreColor(factor.score)}`}>
                        {factor.score}
                      </span>
                      <span className="text-xs text-slate-500">
                        (peso: {Math.round(factor.weight * 100)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={factor.score} className="h-2" />
                  <p className="text-xs text-slate-600">{factor.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-600">Carregando fatores de avaliação...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card data-testid="health-recommendations">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Dicas Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthData.recommendations && healthData.recommendations.length > 0 ? (
              healthData.recommendations.map((recommendation, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                >
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{recommendation}</p>
                </div>
              ))
            ) : null}

            {(!healthData.recommendations || healthData.recommendations.length === 0) && (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  Parabéns! Sua saúde financeira está em excelente estado.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gamificação */}
      <Card data-testid="health-gamification">
        <CardHeader>
          <CardTitle className="text-lg">Próximas Metas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthData.score < 60 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Meta: Alcançar 60 pontos</p>
                  <p className="text-sm text-orange-700">
                    Faltam {60 - healthData.score} pontos para "Bom"
                  </p>
                </div>
              </div>
            )}

            {healthData.score >= 60 && healthData.score < 80 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Target className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Meta: Alcançar 80 pontos</p>
                  <p className="text-sm text-yellow-700">
                    Faltam {80 - healthData.score} pontos para "Muito Bom"
                  </p>
                </div>
              </div>
            )}

            {healthData.score >= 80 && healthData.score < 90 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Meta: Alcançar 90 pontos</p>
                  <p className="text-sm text-green-700">
                    Faltam {90 - healthData.score} pontos para "Excelente"
                  </p>
                </div>
              </div>
            )}

            {healthData.score >= 90 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">🎉 Parabéns!</p>
                  <p className="text-sm text-green-700">
                    Você atingiu o nível "Excelente" em saúde financeira!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}