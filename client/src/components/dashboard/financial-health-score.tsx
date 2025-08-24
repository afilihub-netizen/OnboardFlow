import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Shield, AlertTriangle, CheckCircle, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface FinancialHealthData {
  score: number;
  level: string;
  color: string;
  recommendations: string[];
  metrics: {
    incomeVsExpenses: {
      ratio: number;
      score: number;
    };
    emergencyFund: {
      months: number;
      score: number;
    };
    debtLevel: {
      ratio: number;
      score: number;
    };
  };
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 65) return "text-blue-600 dark:text-blue-400";
  if (score >= 45) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 25) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 45) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'Excelente':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'Bom':
      return <TrendingUp className="w-5 h-5 text-blue-600" />;
    case 'Regular':
      return <Target className="w-5 h-5 text-yellow-600" />;
    case 'Baixo':
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
  }
};

export function FinancialHealthScore() {
  const [currentRecommendation, setCurrentRecommendation] = useState(0);

  const { data: healthData, isLoading } = useQuery<FinancialHealthData>({
    queryKey: ['/api/financial-health'],
    queryFn: async () => {
      const response = await fetch('/api/financial-health', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch financial health score');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Score de Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Score de Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Dados insuficientes para calcular o score.</p>
            <p className="text-sm">Adicione mais transações para obter uma análise completa.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatMonths = (value: number) => {
    if (value < 1) return `${Math.round(value * 30)} dias`;
    return `${Math.round(value * 10) / 10} mês${value > 1.1 ? 'es' : ''}`;
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Score de Saúde Financeira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className={`text-4xl font-bold ${getScoreColor(healthData.score)}`} data-testid="health-score">
              {healthData.score}
            </div>
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/100</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            {getLevelIcon(healthData.level)}
            <Badge 
              variant="outline" 
              className={`${getScoreColor(healthData.score)} border-current`}
              data-testid="health-level"
            >
              {healthData.level}
            </Badge>
          </div>
          <Progress 
            value={healthData.score} 
            className="w-full h-3"
            data-testid="health-progress"
          />
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Análise Detalhada</h4>
          
          {/* Income vs Expenses */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Poupança</span>
              <span className="text-sm font-medium" data-testid="savings-rate">
                {formatPercentage(healthData.metrics.incomeVsExpenses.ratio)}
              </span>
            </div>
            <Progress 
              value={(healthData.metrics.incomeVsExpenses.score / 25) * 100} 
              className="h-2"
              data-testid="savings-progress"
            />
          </div>

          {/* Emergency Fund */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Reserva de Emergência</span>
              <span className="text-sm font-medium" data-testid="emergency-fund">
                {formatMonths(healthData.metrics.emergencyFund.months)}
              </span>
            </div>
            <Progress 
              value={(healthData.metrics.emergencyFund.score / 15) * 100} 
              className="h-2"
              data-testid="emergency-progress"
            />
          </div>

          {/* Debt Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Nível de Endividamento</span>
              <span className="text-sm font-medium" data-testid="debt-level">
                {formatPercentage(healthData.metrics.debtLevel.ratio)}
              </span>
            </div>
            <Progress 
              value={(healthData.metrics.debtLevel.score / 20) * 100} 
              className="h-2"
              data-testid="debt-progress"
            />
          </div>
        </div>

        {/* Recommendations Carousel */}
        {healthData.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Recomendações Personalizadas</h4>
            <div className="relative">
              {/* Current Recommendation */}
              <div 
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 min-h-[80px] flex items-center"
                data-testid={`recommendation-${currentRecommendation}`}
              >
                <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed text-center w-full">
                  {healthData.recommendations[currentRecommendation]}
                </p>
              </div>

              {/* Navigation Controls - Only show if more than 1 recommendation */}
              {healthData.recommendations.length > 1 && (
                <div className="flex items-center justify-between mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentRecommendation(prev => 
                      prev === 0 ? healthData.recommendations.length - 1 : prev - 1
                    )}
                    className="h-8 w-8 p-0"
                    data-testid="recommendation-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Dots Indicator */}
                  <div className="flex space-x-1">
                    {healthData.recommendations.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentRecommendation(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentRecommendation 
                            ? 'bg-blue-600 dark:bg-blue-400' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        data-testid={`recommendation-dot-${index}`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentRecommendation(prev => 
                      prev === healthData.recommendations.length - 1 ? 0 : prev + 1
                    )}
                    className="h-8 w-8 p-0"
                    data-testid="recommendation-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Counter */}
              {healthData.recommendations.length > 1 && (
                <div className="text-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRecommendation + 1} de {healthData.recommendations.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}