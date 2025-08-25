import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SpendingPatternsData {
  insights: string[];
  warnings: string[];
  suggestions: string[];
}

export function SpendingPatterns() {
  const [patternsData, setPatternsData] = useState<SpendingPatternsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatterns = async () => {
    setIsLoading(true);
    try {
      const data: SpendingPatternsData = await apiRequest('GET', '/api/ai/spending-patterns') as SpendingPatternsData;
      setPatternsData(data);
    } catch (error) {
      console.error('Erro ao obter padrões de gastos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível analisar seus padrões de gastos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  if (isLoading) {
    return (
      <Card data-testid="spending-patterns-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Análise de Padrões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Analisando seus padrões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patternsData) {
    return (
      <Card data-testid="spending-patterns-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Análise de Padrões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Não foi possível analisar os padrões</p>
            <Button onClick={fetchPatterns} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      {patternsData.insights.length > 0 && (
        <Card data-testid="spending-insights">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Insights Descobertos
              <Badge variant="secondary">{patternsData.insights.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patternsData.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                >
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos */}
      {patternsData.warnings.length > 0 && (
        <Card data-testid="spending-warnings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Pontos de Atenção
              <Badge variant="destructive">{patternsData.warnings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patternsData.warnings.map((warning, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-900">{warning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugestões */}
      {patternsData.suggestions.length > 0 && (
        <Card data-testid="spending-suggestions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Sugestões de Melhoria
              <Badge variant="default">{patternsData.suggestions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patternsData.suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400"
                >
                  <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {patternsData.insights.length === 0 && 
       patternsData.warnings.length === 0 && 
       patternsData.suggestions.length === 0 && (
        <Card data-testid="spending-patterns-empty">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análise de Padrões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Ainda não há dados suficientes</p>
              <p className="text-sm text-slate-500">
                Continue registrando suas transações para gerar insights personalizados
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Análise Atualizada</p>
              <p className="text-sm text-slate-600">
                A análise é baseada em suas transações mais recentes
              </p>
            </div>
            <Button 
              onClick={fetchPatterns} 
              variant="outline"
              data-testid="refresh-patterns"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}