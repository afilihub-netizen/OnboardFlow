import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Calculator, PieChart, Target, Lightbulb, Zap, DollarSign } from "lucide-react";

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters: Record<string, any>;
  icon: React.ComponentType<any>;
}

interface ScenarioResult {
  id: string;
  scenario: {
    name: string;
    type: string;
    parameters: any;
  };
  results: {
    summary: {
      feasible: boolean;
      timeToGoal: number;
      monthlyRequired: number;
      totalCost: number;
      successProbability: number;
    };
    projections: Array<{
      month: number;
      balance: number;
      income: number;
      expenses: number;
      netFlow: number;
    }>;
    recommendations: string[];
    warnings: string[];
    milestones: Array<{
      month: number;
      description: string;
      target: number;
      achieved: number;
    }>;
  };
  confidence: number;
  createdAt: string;
}

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: 'retirement',
    name: 'Planejamento de Aposentadoria',
    description: 'Simule quando e como se aposentar com segurança financeira',
    type: 'retirement',
    parameters: {
      targetAge: 65,
      currentAge: 30,
      monthlyContribution: 1000,
      expectedReturn: 0.08,
      inflationRate: 0.04
    },
    icon: Target
  },
  {
    id: 'house_purchase',
    name: 'Compra de Casa Própria',
    description: 'Planeje a compra da casa própria com financiamento ou à vista',
    type: 'house_purchase',
    parameters: {
      targetValue: 500000,
      downPayment: 100000,
      timeframe: 60,
      monthlyIncome: 8000,
      currentSavings: 20000
    },
    icon: DollarSign
  },
  {
    id: 'emergency_fund',
    name: 'Reserva de Emergência',
    description: 'Construa uma reserva de emergência adequada ao seu perfil',
    type: 'emergency_fund',
    parameters: {
      monthlyExpenses: 5000,
      targetMonths: 6,
      monthlyContribution: 500,
      currentAmount: 1000
    },
    icon: PieChart
  },
  {
    id: 'investment_goal',
    name: 'Meta de Investimento',
    description: 'Alcance objetivos específicos através de investimentos',
    type: 'investment_goal',
    parameters: {
      targetAmount: 100000,
      timeframe: 36,
      monthlyContribution: 2000,
      riskProfile: 'moderate'
    },
    icon: TrendingUp
  }
];

export function ScenarioSimulator() {
  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | null>(null);
  const [customScenario, setCustomScenario] = useState({
    name: '',
    description: '',
    type: 'custom',
    parameters: {}
  });
  const [activeTab, setActiveTab] = useState("templates");
  const [simulationResult, setSimulationResult] = useState<ScenarioResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingScenarios, isLoading: loadingScenarios } = useQuery({
    queryKey: ["/api/scenarios"],
    retry: false,
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (scenarioData: any) => {
      const response = await apiRequest("POST", "/api/scenarios", scenarioData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      toast({
        title: "Cenário Criado",
        description: "Cenário criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar cenário",
        variant: "destructive",
      });
    },
  });

  const simulateScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const response = await apiRequest("POST", `/api/scenarios/${scenarioId}/simulate`, {});
      return response;
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      toast({
        title: "Simulação Concluída",
        description: "Cenário simulado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao simular cenário",
        variant: "destructive",
      });
    },
  });

  const handleTemplateSelect = (template: ScenarioTemplate) => {
    setSelectedTemplate(template);
    setActiveTab("configure");
  };

  const handleParameterChange = (key: string, value: any) => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        parameters: {
          ...selectedTemplate.parameters,
          [key]: value
        }
      });
    }
  };

  const handleCreateAndSimulate = async () => {
    if (!selectedTemplate) return;

    setIsSimulating(true);
    try {
      const scenarioData = {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        type: selectedTemplate.type,
        parameters: selectedTemplate.parameters
      };

      const createdScenario = await createScenarioMutation.mutateAsync(scenarioData);
      await simulateScenarioMutation.mutateAsync(createdScenario.id);
    } catch (error) {
      console.error('Error creating and simulating scenario:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const renderParameterInput = (key: string, value: any, label: string) => {
    if (typeof value === 'number') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{label}</Label>
          <Input
            id={key}
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(key, parseFloat(e.target.value) || 0)}
            data-testid={`input-${key}`}
          />
        </div>
      );
    }
    
    if (typeof value === 'string') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{label}</Label>
          <Input
            id={key}
            type="text"
            value={value}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            data-testid={`input-${key}`}
          />
        </div>
      );
    }

    return null;
  };

  const renderSimulationResults = () => {
    if (!simulationResult) return null;

    const { results } = simulationResult;
    const successColor = results.summary.feasible ? "text-green-600" : "text-red-600";

    return (
      <div className="space-y-6" data-testid="simulation-results">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {results.summary.feasible ? "✅" : "❌"}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {results.summary.feasible ? "Viável" : "Inviável"}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{results.summary.timeToGoal}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Meses para meta</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  R$ {results.summary.monthlyRequired.toLocaleString('pt-BR')}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mensal necessário</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{results.summary.successProbability}%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prob. de sucesso</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recomendações
              </h4>
              <ul className="space-y-1">
                {results.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>

            {results.warnings.length > 0 && (
              <Alert>
                <AlertDescription>
                  <strong>Atenção:</strong> {results.warnings.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {results.projections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projeção Financeira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.projections.slice(0, 12).map((projection, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="font-medium">Mês {projection.month}</div>
                    <div className="text-right">
                      <div className="font-bold">R$ {projection.balance.toLocaleString('pt-BR')}</div>
                      <div className={`text-sm ${projection.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projection.netFlow >= 0 ? '+' : ''}R$ {projection.netFlow.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="scenario-simulator">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Simulador de Cenários</h2>
          <p className="text-muted-foreground">
            Simule diferentes cenários financeiros e planeje seu futuro
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          IA Avançada
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" data-testid="tab-templates">Modelos</TabsTrigger>
          <TabsTrigger value="configure" data-testid="tab-configure" disabled={!selectedTemplate}>
            Configurar
          </TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-results" disabled={!simulationResult}>
            Resultados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {scenarioTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                  data-testid={`template-card-${template.id}`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5" />
                      {template.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {existingScenarios && existingScenarios.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Cenários Salvos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {existingScenarios.map((scenario: any) => (
                  <Card key={scenario.id} className="cursor-pointer hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {scenario.description}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => simulateScenarioMutation.mutate(scenario.id)}
                        disabled={simulateScenarioMutation.isPending}
                        data-testid={`simulate-saved-${scenario.id}`}
                      >
                        Simular Novamente
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <selectedTemplate.icon className="h-5 w-5" />
                  {selectedTemplate.name}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(selectedTemplate.parameters).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      targetAge: 'Idade desejada para aposentadoria',
                      currentAge: 'Idade atual',
                      monthlyContribution: 'Contribuição mensal (R$)',
                      expectedReturn: 'Retorno esperado (anual %)',
                      inflationRate: 'Taxa de inflação (anual %)',
                      targetValue: 'Valor do imóvel (R$)',
                      downPayment: 'Valor da entrada (R$)',
                      timeframe: 'Prazo (meses)',
                      monthlyIncome: 'Renda mensal (R$)',
                      currentSavings: 'Poupança atual (R$)',
                      monthlyExpenses: 'Gastos mensais (R$)',
                      targetMonths: 'Meses de reserva',
                      currentAmount: 'Valor atual (R$)',
                      targetAmount: 'Meta de valor (R$)',
                      riskProfile: 'Perfil de risco'
                    };
                    
                    return renderParameterInput(key, value, labels[key] || key);
                  })}
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("templates")}
                    data-testid="button-back-templates"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCreateAndSimulate}
                    disabled={isSimulating || createScenarioMutation.isPending}
                    data-testid="button-simulate"
                  >
                    {isSimulating ? "Simulando..." : "Criar e Simular"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {renderSimulationResults()}
        </TabsContent>
      </Tabs>
    </div>
  );
}