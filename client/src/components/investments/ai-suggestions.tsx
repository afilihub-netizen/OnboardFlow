import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, TrendingUp, AlertCircle, Target, BarChart3, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AISuggestion {
  type: string;
  asset: string;
  symbol: string;
  reason: string;
  allocation: string;
  risk_level: string;
}

interface SuggestionsResponse {
  success: boolean;
  portfolio_summary: {
    total_investments: number;
    total_value: number;
  };
  suggestions: {
    analysis: string;
    suggestions: AISuggestion[];
    portfolio_score: string;
    next_steps: string;
  };
  generated_at: string;
}

export function AISuggestions() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const generateSuggestionsMutation = useMutation({
    mutationFn: async (): Promise<SuggestionsResponse> => {
      return await apiRequest('POST', '/api/investments/suggestions', {
        riskProfile: 'moderado' // Perfil padrão para análise automática
      });
    },
    onSuccess: (data) => {
      setSuggestions(data);
      setIsInitialLoad(false);
    },
    onError: () => {
      setIsInitialLoad(false);
      // Silenciar erros da API para não mostrar toast em carregamento automático
    },
  });

  // Gerar sugestões automaticamente quando o componente carrega
  useEffect(() => {
    generateSuggestionsMutation.mutate();
  }, []);

  const handleRefreshSuggestions = () => {
    generateSuggestionsMutation.mutate();
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'baixo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'médio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'alto': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'stocks': return '📈';
      case 'real_estate_fund': return '🏢';
      case 'fixed_income': return '🏛️';
      case 'crypto': return '₿';
      default: return '💰';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">🤖 Consultor IA</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
              Sugestões personalizadas para seu portfólio
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">

        {/* Loading State */}
        {(generateSuggestionsMutation.isPending || isInitialLoad) && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
                <span className="text-gray-600 dark:text-gray-400">
                  Analisando oportunidades de investimento...
                </span>
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        )}

        {/* Resultados */}
        {suggestions && !generateSuggestionsMutation.isPending && (
          <div className="space-y-6">
            {/* Header com botão de atualizar */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🤖 Análise Automática do Mercado
              </h3>
              <button
                onClick={handleRefreshSuggestions}
                disabled={generateSuggestionsMutation.isPending}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
                data-testid="button-refresh-suggestions"
              >
                <RefreshCw className={`w-4 h-4 ${generateSuggestionsMutation.isPending ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
            {/* Resumo e Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">Score do Portfólio</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {suggestions?.suggestions?.portfolio_score || '0'}/10
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {suggestions?.portfolio_summary?.total_investments || 0} ativos
                  </Badge>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold">Valor Total</h4>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(suggestions?.portfolio_summary?.total_value || 0)}
                </span>
              </div>
            </div>

            {/* Análise */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Análise do Portfólio
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {suggestions?.suggestions?.analysis || 'Análise não disponível'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sugestões */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recomendações de Investimento
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(suggestions?.suggestions?.suggestions || []).map((suggestion, index) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getAssetTypeIcon(suggestion.type)}
                        </span>
                        <Badge className={getRiskLevelColor(suggestion.risk_level)}>
                          {suggestion.risk_level}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {suggestion.allocation}
                      </span>
                    </div>
                    
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {suggestion.asset}
                    </h5>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {suggestion.symbol}
                    </p>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {suggestion.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <Target className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                    Próximos Passos
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {suggestions?.suggestions?.next_steps || 'Próximos passos não disponíveis'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Sugestões geradas em: {suggestions?.generated_at ? new Date(suggestions.generated_at).toLocaleString('pt-BR') : 'Data não disponível'}
            </p>
          </div>
        )}

        {/* Estado de Erro */}
        {!suggestions && !generateSuggestionsMutation.isPending && !isInitialLoad && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Análise Temporariamente Indisponível
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Não foi possível gerar a análise automática do mercado no momento
            </p>
            <button
              onClick={handleRefreshSuggestions}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}