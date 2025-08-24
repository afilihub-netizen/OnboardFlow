import { useState } from "react";
import { Building2, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    features: ['Transações pessoais', 'Metas de orçamento', 'Relatórios básicos']
  },
  {
    id: 'family',
    title: 'Família',
    description: 'Para famílias que querem gerenciar finanças juntas',
    icon: Users,
    features: ['Múltiplos usuários', 'Orçamento familiar', 'Controle por membro']
  },
  {
    id: 'business',
    title: 'Empresarial',
    description: 'Para empresas, freelancers ou controle empresarial',
    icon: Building2,
    features: ['Departamentos', 'Fornecedores', 'Notas fiscais', 'Relatórios avançados']
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Tipo de Conta</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo que melhor se adequa ao seu uso
        </p>
      </div>

      <div className="grid gap-4">
        {accountTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedType(type.id)}
              data-testid={`account-type-${type.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <CardTitle className="text-base">{type.title}</CardTitle>
                    <CardDescription className="text-sm">{type.description}</CardDescription>
                  </div>
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

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updateAccountMutation.isPending}
          data-testid="button-save-account-type"
        >
          {updateAccountMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}