import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Database, 
  CreditCard, 
  Brain, 
  FileText, 
  Mail, 
  Key, 
  TestTube, 
  CheckCircle, 
  XCircle,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  isEncrypted: boolean;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfigFormData {
  [key: string]: string;
}

const categoryConfig = {
  database: {
    label: "Banco de Dados",
    icon: Database,
    color: "bg-blue-500",
  },
  auth: {
    label: "Autenticação",
    icon: Key,
    color: "bg-green-500",
  },
  payment: {
    label: "Pagamentos",
    icon: CreditCard,
    color: "bg-purple-500",
  },
  ai: {
    label: "Inteligência Artificial",
    icon: Brain,
    color: "bg-orange-500",
  },
  document: {
    label: "Processamento de Documentos",
    icon: FileText,
    color: "bg-indigo-500",
  },
  email: {
    label: "Email",
    icon: Mail,
    color: "bg-red-500",
  },
  general: {
    label: "Geral",
    icon: Settings,
    color: "bg-gray-500",
  },
};

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ConfigFormData>({});
  const [visibleValues, setVisibleValues] = useState<{[key: string]: boolean}>({});
  const [testResults, setTestResults] = useState<{[key: string]: { success: boolean; message: string }}>({});

  // Fetch configurations
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["/api/system/configs"],
    queryFn: () => apiRequest("GET", "/api/system/configs").then(r => r.json()),
  });

  // Initialize form data when configs load
  useEffect(() => {
    if (configs.length > 0) {
      const initialData: ConfigFormData = {};
      configs.forEach((config: SystemConfig) => {
        // For encrypted configs, leave empty initially
        initialData[config.key] = config.isEncrypted ? "" : config.value;
      });
      setFormData(initialData);
    }
  }, [configs]);

  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string; category?: string; isEncrypted?: boolean; isRequired?: boolean }) => {
      const response = await apiRequest("POST", "/api/system/configs", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Configuração Salva",
        description: `${variables.key} foi configurada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/configs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Test configuration mutation
  const testMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest("POST", `/api/system/configs/${key}/test`);
      return response.json();
    },
    onSuccess: (result, key) => {
      setTestResults(prev => ({ ...prev, [key]: result }));
      toast({
        title: result.success ? "Teste Bem-sucedido" : "Teste Falhou",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: any, key) => {
      const result = { success: false, message: error.message || "Erro no teste" };
      setTestResults(prev => ({ ...prev, [key]: result }));
      toast({
        title: "Erro no Teste",
        description: result.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (config: SystemConfig) => {
    const value = formData[config.key];
    if (!value && config.isRequired) {
      toast({
        title: "Campo Obrigatório",
        description: "Esta configuração é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      key: config.key,
      value: value || "",
      description: config.description,
      category: config.category,
      isEncrypted: config.isEncrypted,
      isRequired: config.isRequired,
    });
  };

  const handleTest = (key: string) => {
    testMutation.mutate(key);
  };

  const toggleVisibility = (key: string) => {
    setVisibleValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedConfigs = configs.reduce((groups: { [category: string]: SystemConfig[] }, config: SystemConfig) => {
    const category = config.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(config);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="settings-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Configurações do Sistema</h1>
        <p className="text-muted-foreground" data-testid="page-description">
          Configure todas as chaves de API e configurações necessárias para o funcionamento completo do sistema.
        </p>
      </div>

      <Tabs defaultValue={Object.keys(groupedConfigs)[0]} className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2" data-testid="category-tabs">
          {Object.keys(groupedConfigs).map((category) => {
            const categoryInfo = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;
            const Icon = categoryInfo.icon;
            
            return (
              <TabsTrigger 
                key={category} 
                value={category}
                className="flex items-center gap-2 text-xs"
                data-testid={`tab-${category}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{categoryInfo.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => {
          const categoryInfo = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;
          const Icon = categoryInfo.icon;

          return (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card data-testid={`category-card-${category}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${categoryInfo.color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    {categoryInfo.label}
                  </CardTitle>
                  <CardDescription>
                    Configure as opções relacionadas a {categoryInfo.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categoryConfigs.map((config: SystemConfig) => (
                    <div key={config.key} className="space-y-3 p-4 border rounded-lg" data-testid={`config-${config.key}`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={config.key} className="font-medium">
                              {config.key}
                            </Label>
                            {config.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Obrigatório
                              </Badge>
                            )}
                            {config.isEncrypted && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Criptografado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                        
                        {testResults[config.key] && (
                          <div className="flex items-center gap-1" data-testid={`test-result-${config.key}`}>
                            {testResults[config.key].success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {testResults[config.key].message}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={config.key}
                            type={config.isEncrypted && !visibleValues[config.key] ? "password" : "text"}
                            value={formData[config.key] || ""}
                            onChange={(e) => handleInputChange(config.key, e.target.value)}
                            placeholder={
                              config.isEncrypted && !formData[config.key] 
                                ? "***ENCRYPTED*** - Digite novo valor para alterar" 
                                : "Digite o valor..."
                            }
                            className="pr-10"
                            data-testid={`input-${config.key}`}
                          />
                          {config.isEncrypted && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => toggleVisibility(config.key)}
                              data-testid={`toggle-visibility-${config.key}`}
                            >
                              {visibleValues[config.key] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleSave(config)}
                          disabled={saveMutation.isPending}
                          variant="outline"
                          data-testid={`save-${config.key}`}
                        >
                          Salvar
                        </Button>
                        
                        {["stripe.secret_key", "openai.api_key", "gemini.api_key"].includes(config.key) && (
                          <Button
                            onClick={() => handleTest(config.key)}
                            disabled={testMutation.isPending || !formData[config.key]}
                            variant="secondary"
                            size="sm"
                            data-testid={`test-${config.key}`}
                          >
                            <TestTube className="h-4 w-4 mr-1" />
                            Testar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🔐 Segurança</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Chaves marcadas como "Criptografado" são protegidas no banco</li>
                <li>• Valores não são mostrados por segurança</li>
                <li>• Digite novo valor para alterar chaves existentes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">✅ Configurações</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Campos "Obrigatório" são essenciais para o sistema</li>
                <li>• Use "Testar" para validar conexões API</li>
                <li>• Alterações são aplicadas imediatamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}