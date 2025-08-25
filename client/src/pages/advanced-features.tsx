import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenarioSimulator } from "@/components/scenarios/scenario-simulator";
import { AutomationManager } from "@/components/automation/automation-manager";
import { PredictiveInsights } from "@/components/analytics/predictive-insights";
import { 
  Brain, 
  Bot, 
  TrendingUp, 
  Zap, 
  Calculator,
  Target,
  Activity,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  badge: string;
  benefits: string[];
  available: boolean;
}

const advancedFeatures: FeatureCard[] = [
  {
    id: "scenarios",
    title: "Simulador de Cenários",
    description: "Simule diferentes cenários financeiros como aposentadoria, compra de casa própria e metas de investimento",
    icon: Calculator,
    badge: "IA Inteligente",
    benefits: [
      "Projeções precisas baseadas em IA",
      "Templates prontos para diferentes objetivos",
      "Análise de viabilidade em tempo real",
      "Recomendações personalizadas"
    ],
    available: true
  },
  {
    id: "automation",
    title: "Automação Financeira",
    description: "Configure regras inteligentes para automatizar transferências, investimentos e alertas",
    icon: Bot,
    badge: "Automação",
    benefits: [
      "Regras criadas por linguagem natural",
      "Execução automática de ações",
      "Templates pré-configurados",
      "Monitoramento em tempo real"
    ],
    available: true
  },
  {
    id: "analytics",
    title: "Análise Preditiva",
    description: "Insights avançados sobre seus padrões de gastos e detecção de anomalias",
    icon: TrendingUp,
    badge: "IA Avançada",
    benefits: [
      "Previsões de gastos futuros",
      "Detecção automática de anomalias",
      "Projeções de fluxo de caixa",
      "Tendências sazonais identificadas"
    ],
    available: true
  }
];

export default function AdvancedFeatures() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const renderFeatureOverview = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Funcionalidades Avançadas</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Potencialize sua gestão financeira com nossa suíte completa de ferramentas impulsionadas por 
          Inteligência Artificial. Simule cenários, automatize tarefas e obtenha insights preditivos.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by Google Gemini Pro
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            IA de Última Geração
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {advancedFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card 
              key={feature.id} 
              className={`cursor-pointer transition-all hover:shadow-lg group ${
                activeFeature === feature.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setActiveFeature(feature.id);
                setActiveTab(feature.id);
              }}
              data-testid={`feature-card-${feature.id}`}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Principais Benefícios:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-2">
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                    size="sm"
                    data-testid={`explore-${feature.id}`}
                  >
                    Explorar
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Integração Inteligente</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Todas as funcionalidades trabalham em conjunto, aprendendo com seus dados para 
                oferecer insights cada vez mais precisos e automações mais eficientes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Clique em qualquer funcionalidade acima para começar a explorar suas capacidades avançadas
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" data-testid="advanced-features-page">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="scenarios" data-testid="tab-scenarios">
            <Calculator className="h-4 w-4 mr-2" />
            Cenários
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <Bot className="h-4 w-4 mr-2" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderFeatureOverview()}
        </TabsContent>

        <TabsContent value="scenarios" className="mt-6">
          <ScenarioSimulator />
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <AutomationManager />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <PredictiveInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}