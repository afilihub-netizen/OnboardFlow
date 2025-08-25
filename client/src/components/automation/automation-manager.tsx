import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Plus, 
  Bot, 
  TrendingUp, 
  Bell, 
  ArrowRight, 
  Settings,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: string;
  trigger: any;
  actions: any[];
  status: 'active' | 'paused' | 'inactive';
  isRecurring: boolean;
  executionCount: number;
  lastExecuted: string | null;
  createdAt: string;
  metadata: any;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  trigger: any;
  actions: any[];
  isRecurring: boolean;
  icon: React.ComponentType<any>;
  category: string;
}

const automationCategories = [
  { id: 'savings', name: 'Poupança', icon: TrendingUp },
  { id: 'alerts', name: 'Alertas', icon: Bell },
  { id: 'investments', name: 'Investimentos', icon: TrendingUp },
  { id: 'budgeting', name: 'Orçamento', icon: Settings }
];

export function AutomationManager() {
  const [activeTab, setActiveTab] = useState("rules");
  const [newRuleInput, setNewRuleInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: automationRules, isLoading: loadingRules } = useQuery({
    queryKey: ["/api/automation-rules"],
    retry: false,
  });

  const { data: automationTemplates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["/api/automation-templates"],
    retry: false,
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: { userInput: string; organizationId?: string }) => {
      const response = await apiRequest("POST", "/api/automation-rules", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] });
      setNewRuleInput("");
      setIsCreatingRule(false);
      toast({
        title: "Regra Criada",
        description: "Regra de automação criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar regra de automação",
        variant: "destructive",
      });
    },
  });

  const handleCreateRule = async () => {
    if (!newRuleInput.trim()) return;

    setIsCreatingRule(true);
    try {
      await createRuleMutation.mutateAsync({
        userInput: newRuleInput,
      });
    } catch (error) {
      console.error('Error creating automation rule:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const renderRuleCard = (rule: AutomationRule) => (
    <Card key={rule.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              {getStatusIcon(rule.status)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{rule.name}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {rule.description}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(rule.status)}>
            {rule.status === 'active' ? 'Ativa' : 
             rule.status === 'paused' ? 'Pausada' : 'Inativa'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Execuções:</span>
            <span className="ml-2 font-medium">{rule.executionCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Última execução:</span>
            <span className="ml-2 font-medium">
              {rule.lastExecuted 
                ? new Date(rule.lastExecuted).toLocaleDateString('pt-BR')
                : 'Nunca'
              }
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {rule.type === 'transfer' ? 'Transferência' :
               rule.type === 'investment' ? 'Investimento' :
               rule.type === 'alert' ? 'Alerta' :
               rule.type === 'categorization' ? 'Categorização' : 'Outro'}
            </Badge>
            {rule.isRecurring && (
              <Badge variant="outline" className="text-xs">
                Recorrente
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" data-testid={`edit-rule-${rule.id}`}>
              <Settings className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant={rule.status === 'active' ? 'outline' : 'default'}
              data-testid={`toggle-rule-${rule.id}`}
            >
              {rule.status === 'active' ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <Button size="sm" variant="outline" className="text-red-600">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTemplateCard = (template: AutomationTemplate) => {
    const IconComponent = template.icon;
    return (
      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {template.description}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {template.category}
            </Badge>
            <Button size="sm" data-testid={`use-template-${template.id}`}>
              Usar Template
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" data-testid="automation-manager">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automação Financeira</h2>
          <p className="text-muted-foreground">
            Configure regras inteligentes para automatizar suas finanças
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Bot className="h-3 w-3" />
          IA Inteligente
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules" data-testid="tab-rules">
            Minhas Regras ({automationRules?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="create" data-testid="tab-create">Criar Nova</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {loadingRules ? (
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
          ) : automationRules && automationRules.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {automationRules.map(renderRuleCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma regra criada</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Crie sua primeira regra de automação para começar a automatizar suas finanças
                </p>
                <Button onClick={() => setActiveTab("create")} data-testid="button-create-first-rule">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Criar Regra com IA
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Descreva o que você quer automatizar e nossa IA criará a regra para você
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule-input">Descreva sua regra de automação</Label>
                <Textarea
                  id="rule-input"
                  placeholder="Ex: Se eu gastar mais de R$ 500 em restaurantes por mês, me avise..."
                  value={newRuleInput}
                  onChange={(e) => setNewRuleInput(e.target.value)}
                  rows={4}
                  data-testid="textarea-rule-input"
                />
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Exemplos de regras:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• "Quando receber meu salário, investir 20% automaticamente"</li>
                    <li>• "Se eu gastar mais de R$ 800 em compras, me avisar"</li>
                    <li>• "Todo dia 15, transferir R$ 500 para poupança"</li>
                    <li>• "Categorizar automaticamente gastos com 'Uber' como transporte"</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setNewRuleInput("")}
                  disabled={!newRuleInput.trim()}
                  data-testid="button-clear-input"
                >
                  Limpar
                </Button>
                <Button
                  onClick={handleCreateRule}
                  disabled={!newRuleInput.trim() || isCreatingRule || createRuleMutation.isPending}
                  data-testid="button-create-rule"
                >
                  {isCreatingRule ? "Criando..." : "Criar Regra"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {automationCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`category-card-${category.id}`}
                >
                  <CardHeader className="text-center">
                    <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {loadingTemplates ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : automationTemplates ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(automationTemplates).map(([key, template]: [string, any]) => 
                renderTemplateCard({
                  id: key,
                  name: template.name,
                  description: template.description,
                  type: template.type,
                  trigger: template.trigger,
                  actions: template.actions,
                  isRecurring: template.isRecurring,
                  icon: template.type === 'transfer' ? TrendingUp : 
                        template.type === 'alert' ? Bell : 
                        template.type === 'investment' ? TrendingUp : Settings,
                  category: template.type === 'transfer' ? 'Poupança' : 
                           template.type === 'alert' ? 'Alertas' : 
                           template.type === 'investment' ? 'Investimentos' : 'Orçamento'
                })
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Templates não disponíveis</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Não foi possível carregar os templates de automação
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}