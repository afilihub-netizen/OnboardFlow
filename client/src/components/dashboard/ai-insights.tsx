import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, AlertTriangle, Bot, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Insight {
  type: 'opportunity' | 'investment' | 'alert';
  title: string;
  message: string;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'opportunity':
      return Lightbulb;
    case 'investment':
      return TrendingUp;
    case 'alert':
      return AlertTriangle;
    default:
      return Lightbulb;
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'opportunity':
      return 'bg-yellow-400';
    case 'investment':
      return 'bg-green-400';
    case 'alert':
      return 'bg-orange-400';
    default:
      return 'bg-blue-400';
  }
};

export function AIInsights() {
  const [currentInsight, setCurrentInsight] = useState(0);

  // Fetch AI-generated insights
  const { data: aiInsights, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['/api/ai-insights'],
    queryFn: async () => {
      const response = await fetch('/api/ai-insights', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const insights: Insight[] = aiInsights?.insights || [];

  // Auto-rotation effect
  useEffect(() => {
    if (insights.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentInsight(prev => (prev + 1) % insights.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [insights.length]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <CardTitle>Insights da IA</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white bg-opacity-10 rounded-lg p-4">
                <Skeleton className="h-4 w-3/4 mb-2 bg-white bg-opacity-20" />
                <Skeleton className="h-3 w-full bg-white bg-opacity-20" />
                <Skeleton className="h-3 w-2/3 bg-white bg-opacity-20 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <CardTitle>Insights da IA</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-white hover:bg-white hover:bg-opacity-20"
            data-testid="refresh-insights"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium mb-1">Nenhum insight disponível</p>
              <p className="text-xs text-purple-100">
                Adicione algumas transações para começar a receber insights personalizados da IA.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Current Insight */}
              <div 
                className="bg-white bg-opacity-10 rounded-lg p-4 min-h-[100px] flex items-center transition-all duration-300"
                data-testid={`ai-insight-${currentInsight}`}
              >
                {(() => {
                  const insight = insights[currentInsight];
                  const Icon = getInsightIcon(insight.type);
                  const color = getInsightColor(insight.type);
                  
                  return (
                    <div className="flex items-start space-x-3 w-full">
                      <div className={`w-6 h-6 ${color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className="w-3 h-3 text-black" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1" data-testid={`insight-title-${currentInsight}`}>
                          {insight.title}
                        </p>
                        <p className="text-xs text-purple-100" data-testid={`insight-message-${currentInsight}`}>
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Progress Indicators - Only show if more than 1 insight */}
              {insights.length > 1 && (
                <div className="flex justify-center mt-3 space-x-1">
                  {insights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentInsight(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentInsight 
                          ? 'bg-white' 
                          : 'bg-white bg-opacity-40'
                      }`}
                      data-testid={`insight-dot-${index}`}
                    />
                  ))}
                </div>
              )}

              {/* Counter */}
              {insights.length > 1 && (
                <div className="text-center mt-2">
                  <span className="text-xs text-purple-200">
                    {currentInsight + 1} de {insights.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}