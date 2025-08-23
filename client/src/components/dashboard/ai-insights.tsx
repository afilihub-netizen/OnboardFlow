import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertTriangle, Bot } from "lucide-react";

// Mock AI insights - in production these would come from AI analysis
const insights = [
  {
    id: 1,
    type: 'opportunity',
    icon: Lightbulb,
    title: 'Oportunidade de Economia',
    message: 'Você pode economizar R$ 340 por mês otimizando seus gastos com entregas de comida.',
    color: 'bg-yellow-400',
  },
  {
    id: 2,
    type: 'investment',
    icon: TrendingUp,
    title: 'Meta de Investimento',
    message: 'Com sua economia atual, você pode aumentar seus investimentos em 15% este mês.',
    color: 'bg-green-400',
  },
  {
    id: 3,
    type: 'alert',
    icon: AlertTriangle,
    title: 'Alerta de Gasto',
    message: 'Seus gastos com lazer estão 23% acima da média dos últimos 3 meses.',
    color: 'bg-orange-400',
  },
];

export function AIInsights() {
  return (
    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <CardTitle>Insights da IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = insight.icon;
            
            return (
              <div 
                key={insight.id} 
                className="bg-white bg-opacity-10 rounded-lg p-4"
                data-testid={`ai-insight-${insight.id}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 ${insight.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className="w-3 h-3 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" data-testid={`insight-title-${insight.id}`}>
                      {insight.title}
                    </p>
                    <p className="text-xs text-purple-100" data-testid={`insight-message-${insight.id}`}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
