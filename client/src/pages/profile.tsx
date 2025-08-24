import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, LogOut, Settings, Shield, Users, Plus, Camera } from "lucide-react";
import { FamilyManagement } from "@/components/profile/family-management";
import { AccountTypeSelector } from "@/components/profile/account-type-selector";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setProfileImageUrl(user.profileImageUrl || '');
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não Autorizado",
        description: "Você foi desconectado. Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { firstName?: string; lastName?: string; profileImageUrl?: string }) => {
      const response = await apiRequest("PATCH", "/api/user/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      // Invalidate queries to refresh user data everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    },
  });


  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      profileImageUrl,
    });
  };


  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 3MB.",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      
      // Convert file to base64 for temporary preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setProfileImageUrl(base64);
        
        toast({
          title: "Foto selecionada",
          description: "Clique em 'Salvar Alterações' para confirmar a nova foto.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock family members data
  const familyMembers = [
    { id: "1", name: "Maria Silva", email: "maria@email.com", role: "admin" },
    { id: "2", name: "João Silva", email: "joao@email.com", role: "member" },
    { id: "3", name: "Ana Silva", email: "ana@email.com", role: "child" },
  ];

  if (isLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Perfil" 
          subtitle="Gerencie suas informações pessoais" 
        />
        
        <div className="p-6 space-y-6">
          {/* Profile Overview */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileImageUrl || user?.profileImageUrl} alt="Profile" />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      data-testid="input-photo-upload"
                    />
                    <Button variant="outline" size="sm" data-testid="button-change-avatar">
                      <Camera className="w-4 h-4 mr-2" />
                      Alterar Foto
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome</Label>
                      <Input 
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Digite seu nome"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Sobrenome</Label>
                      <Input 
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Digite seu sobrenome"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="bg-gray-100 dark:bg-gray-700"
                      data-testid="input-email"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      O email não pode ser alterado
                    </p>
                  </div>
                  
                  {/* Tipo de conta será gerenciado em seção separada */}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  data-testid="button-save-profile"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Status da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Ativa
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tipo</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="account-type">
                    {user?.accountType === 'family' ? 'Conta Familiar' : 
                     user?.accountType === 'business' ? 'Conta Empresarial' : 'Conta Individual'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Membro desde</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="member-since">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Autenticação</span>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Ativa
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Último acesso</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Agora
                  </span>
                </div>

                <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid="button-security-settings"
                    >
                      Configurações de Segurança
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Configurações de Segurança
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Alterar Senha
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Como você está usando a autenticação do Replit, para alterar sua senha 
                          você precisa acessar as configurações da sua conta Replit.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800/50"
                          onClick={() => window.open('https://replit.com/account', '_blank')}
                          data-testid="button-replit-account"
                        >
                          Abrir Configurações do Replit
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Informações de Segurança
                        </h4>
                        
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Autenticação</span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Replit OAuth
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Último login</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            Agora
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Sessão ativa</span>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Segura
                          </Badge>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsPasswordModalOpen(false)}
                          data-testid="button-close-security"
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Logout Section */}
          <Card className="financial-card border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Sair da Conta</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Desconecte-se de forma segura da sua conta
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Type Selection */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Configuração da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountTypeSelector 
                currentType={user?.accountType || 'individual'}
                currentCompanyData={{
                  companyName: user?.companyName,
                  cnpj: user?.cnpj,
                  industry: user?.industry
                }}
              />
            </CardContent>
          </Card>

          {/* Family Management Section - Only for family plan users */}
          {user?.subscriptionStatus === 'family' && (
            <FamilyManagement />
          )}
          
          {/* Old Family Members Section - Only show for family accounts */}
          {false && user?.accountType === 'family' && (
            <Card className="financial-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Membros da Família
                </CardTitle>
                
                <Dialog open={isNewMemberDialogOpen} onOpenChange={setIsNewMemberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-family-member">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Membro da Família</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="memberName">Nome Completo</Label>
                        <Input id="memberName" placeholder="Ex: João Silva" data-testid="input-member-name" />
                      </div>
                      <div>
                        <Label htmlFor="memberEmail">Email (opcional)</Label>
                        <Input id="memberEmail" type="email" placeholder="joao@email.com" data-testid="input-member-email" />
                      </div>
                      <div>
                        <Label htmlFor="memberRole">Função</Label>
                        <Select>
                          <SelectTrigger data-testid="select-member-role">
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="member">Membro</SelectItem>
                            <SelectItem value="child">Criança/Adolescente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="monthlyAllowance">Mesada (opcional)</Label>
                        <Input id="monthlyAllowance" type="number" placeholder="200.00" data-testid="input-member-allowance" />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissões</Label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" data-testid="checkbox-manage-transactions" />
                            <span className="text-sm">Pode gerenciar transações</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" data-testid="checkbox-view-reports" />
                            <span className="text-sm">Pode visualizar relatórios</span>
                          </label>
                        </div>
                      </div>
                      <Button className="w-full" data-testid="button-create-member">Adicionar Membro</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg" data-testid={`family-member-${member.id}`}>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role === 'admin' ? 'Admin' : member.role === 'member' ? 'Membro' : 'Criança'}
                        </Badge>
                        <Button variant="outline" size="sm" data-testid={`button-edit-member-${member.id}`}>Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
