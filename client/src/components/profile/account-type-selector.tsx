import { useState } from "react";
import { Building2, Users, User, Crown, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountTypeSelectorProps {
  currentType: string;
  currentCompanyData?: {
    companyName?: string;
    cnpj?: string;
    industry?: string;
  };
}

const accountTypes = [
  {
    id: 'individual',
    title: 'Pessoal',
    description: 'Para controle financeiro pessoal e individual',
    icon: User,
    price: 'R$ 19,90/mês',
    features: ['Transações pessoais', 'Metas de orçamento', 'Relatórios básicos', 'Importação de extratos'],
    planLevel: 1
  },
  {
    id: 'family',
    title: 'Família',
    description: 'Para famílias que querem gerenciar finanças juntas',
    icon: Users,
    price: 'R$ 39,90/mês',
    features: ['Múltiplos usuários', 'Orçamento familiar', 'Controle por membro', 'Relatórios compartilhados'],
    planLevel: 2
  },
  {
    id: 'business',
    title: 'Empresarial',
    description: 'Para empresas, freelancers ou controle empresarial',
    icon: Building2,
    price: 'R$ 79,90/mês',
    features: ['Departamentos', 'Fornecedores', 'Notas fiscais', 'Relatórios avançados', 'API personalizada'],
    planLevel: 3
  }
];

const industries = [
  'Tecnologia', 'Comércio', 'Serviços', 'Educação', 'Saúde', 'Construção',
  'Alimentação', 'Transporte', 'Financeiro', 'Consultoria', 'Freelancer', 'Outros'
];

export function AccountTypeSelector({ currentType, currentCompanyData }: AccountTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState(currentType);
  const [companyData, setCompanyData] = useState({
    companyName: currentCompanyData?.companyName || '',
    cnpj: currentCompanyData?.cnpj || '',
    industry: currentCompanyData?.industry || ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar status de assinatura
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/status', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      return response.json();
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('PATCH', '/api/user/profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Tipo de conta atualizado",
        description: "Suas configurações foram salvas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tipo de conta",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    // Verificar se o plano selecionado está disponível
    if (!subscriptionStatus?.availablePlans?.includes(selectedType)) {
      toast({
        title: "Plano não disponível",
        description: "Você precisa ter uma assinatura ativa para usar este plano.",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {
      accountType: selectedType
    };

    // Se for empresarial, incluir dados da empresa
    if (selectedType === 'business') {
      updateData.companyName = companyData.companyName;
      updateData.cnpj = companyData.cnpj;
      updateData.industry = companyData.industry;
    }

    updateAccountMutation.mutate(updateData);
  };

  const getAccountTypeStatus = (typeId: string) => {
    if (!subscriptionStatus) return 'loading';
    
    if (subscriptionStatus.availablePlans?.includes(typeId)) {
      return subscriptionStatus.currentPlan === typeId ? 'current' : 'available';
    }
    
    return 'locked';
  };

  const handleUpgrade = (planType: string) => {
    // Redirecionar para página de upgrade
    window.location.href = '/upgrade';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Tipo de Conta</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo que melhor se adequa ao seu uso
        </p>
      </div>

      {/* Status da assinatura atual */}
      {subscriptionStatus && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Status do Plano</CardTitle>
              </div>
              <Badge variant={subscriptionStatus.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                {subscriptionStatus.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Plano atual:</strong> {
                  accountTypes.find(t => t.id === subscriptionStatus.currentPlan)?.title || 'Gratuito'
                }
              </p>
              {subscriptionStatus.nextBillingDate && (
                <p className="text-sm text-muted-foreground">
                  Próxima cobrança: {new Date(subscriptionStatus.nextBillingDate).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {accountTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const status = getAccountTypeStatus(type.id);
          const isLocked = status === 'locked';
          const isCurrent = status === 'current';
          
          return (
            <Card 
              key={type.id}
              className={`transition-all ${
                isSelected && !isLocked 
                  ? 'ring-2 ring-primary border-primary' 
                  : isLocked 
                    ? 'opacity-75 border-gray-200 dark:border-gray-700'
                    : 'hover:shadow-md cursor-pointer'
              }`}
              onClick={() => !isLocked && setSelectedType(type.id)}
              data-testid={`account-type-${type.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${
                      isSelected && !isLocked ? 'text-primary' : 
                      isLocked ? 'text-gray-400' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{type.title}</CardTitle>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Atual
                          </Badge>
                        )}
                        {isLocked && (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <CardDescription className="text-sm">{type.description}</CardDescription>
                      <p className="text-sm font-medium text-green-600 mt-1">{type.price}</p>
                    </div>
                  </div>
                  {isLocked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpgrade(type.id);
                      }}
                      data-testid={`button-upgrade-${type.id}`}
                    >
                      Fazer Upgrade
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedType === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da Empresa</CardTitle>
            <CardDescription>
              Dados opcionais para melhor organização (CPF também pode usar funcionalidades empresariais)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nome da Empresa/Atividade</Label>
              <Input
                id="companyName"
                placeholder="Ex: Minha Consultoria, Freelancer Web, etc."
                value={companyData.companyName}
                onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                data-testid="input-company-name"
              />
            </div>
            
            <div>
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={companyData.cnpj}
                onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: e.target.value }))}
                data-testid="input-cnpj"
              />
            </div>
            
            <div>
              <Label htmlFor="industry">Setor/Atividade</Label>
              <Select
                value={companyData.industry}
                onValueChange={(value) => setCompanyData(prev => ({ ...prev, industry: value }))}
              >
                <SelectTrigger data-testid="select-industry">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            "Verificando planos disponíveis..."
          ) : getAccountTypeStatus(selectedType) === 'locked' ? (
            "⚠️ Este plano requer uma assinatura ativa"
          ) : (
            "✅ Plano disponível para sua assinatura"
          )}
        </div>
        <Button 
          onClick={handleSave}
          disabled={updateAccountMutation.isPending || isLoading || getAccountTypeStatus(selectedType) === 'locked'}
          data-testid="button-save-account-type"
        >
          {updateAccountMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}