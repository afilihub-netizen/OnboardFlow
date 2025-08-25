import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Heart, 
  BarChart3, 
  TrendingUp, 
  MessageCircle, 
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { FinancialHealthScore } from './financial-health-score';
import { SpendingPatterns } from './spending-patterns';
import { AIChatAssistant } from './ai-chat-assistant';
import { CashFlowPredictor } from './cash-flow-predictor';
import { ScenarioSimulator } from './scenario-simulator';

export function AIDashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Inteligência Financeira</h2>
              <p className="text-blue-100 text-sm">
                Análises e insights personalizados com IA para melhorar sua saúde financeira
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5" />
                <span className="font-medium">Score de Saúde</span>
              </div>
              <p className="text-sm text-blue-100">
                Avaliação automática da sua situação financeira
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Análise de Padrões</span>
              </div>
              <p className="text-sm text-blue-100">
                Insights sobre seus hábitos de consumo
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Assistente IA</span>
              </div>
              <p className="text-sm text-blue-100">
                Tire dúvidas sobre suas finanças
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => setIsChatOpen(true)}
              variant="outline" 
              className="h-auto p-4 flex-col items-start"
              data-testid="open-ai-chat-dashboard"
            >
              <MessageCircle className="w-6 h-6 mb-2 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Conversar com IA</p>
                <p className="text-sm text-slate-600">
                  Faça perguntas sobre suas finanças
                </p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col items-start"
              onClick={() => {
                // Scroll para a seção de score
                document.getElementById('health-score')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              data-testid="view-health-score"
            >
              <Heart className="w-6 h-6 mb-2 text-red-500" />
              <div className="text-left">
                <p className="font-medium">Ver Score de Saúde</p>
                <p className="text-sm text-slate-600">
                  Confira sua pontuação atual
                </p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col items-start"
              onClick={() => {
                // Scroll para a seção de padrões
                document.getElementById('spending-patterns')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              data-testid="view-patterns"
            >
              <TrendingUp className="w-6 h-6 mb-2 text-green-500" />
              <div className="text-left">
                <p className="font-medium">Análise de Padrões</p>
                <p className="text-sm text-slate-600">
                  Descubra insights sobre gastos
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Análises de IA */}
      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Score de Saúde
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Padrões de Gastos
          </TabsTrigger>
          <TabsTrigger value="predictor" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Fluxo Preditivo
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Simulador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" id="health-score">
          <FinancialHealthScore />
        </TabsContent>

        <TabsContent value="patterns" id="spending-patterns">
          <SpendingPatterns />
        </TabsContent>

        <TabsContent value="predictor">
          <CashFlowPredictor />
        </TabsContent>

        <TabsContent value="simulator">
          <ScenarioSimulator />
        </TabsContent>
      </Tabs>

      {/* Chat Assistant Modal */}
      <AIChatAssistant 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
}