import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, Mail, Shield, Eye, DollarSign, Trash2, UserCheck, UserX, Clock } from "lucide-react";

interface FamilyMember {
  id: string;
  familyAccountId: string;
  name: string;
  email: string;
  role: string;
  inviteStatus: string;
  canManageTransactions: boolean;
  canViewReports: boolean;
  monthlyAllowance: string | null;
  invitedAt: string;
  joinedAt: string | null;
}

export function FamilyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [canManageTransactions, setCanManageTransactions] = useState(false);
  const [canViewReports, setCanViewReports] = useState(true);
  const [monthlyAllowance, setMonthlyAllowance] = useState("");

  // Fetch family members
  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ['/api/family-members'],
    queryFn: async () => {
      const response = await fetch('/api/family-members', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch family members');
      return response.json();
    },
  });

  // Invite family member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (memberData: any) => {
      const response = await fetch('/api/family-members/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      if (!response.ok) throw new Error('Failed to invite member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      setIsInviteDialogOpen(false);
      resetInviteForm();
      toast({
        title: "Convite enviado",
        description: "O convite foi enviado por email com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao enviar convite. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Remove family member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/family-members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      toast({
        title: "Membro removido",
        description: "O membro da família foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover membro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const resetInviteForm = () => {
    setInviteEmail("");
    setInviteName("");
    setInviteRole("member");
    setCanManageTransactions(false);
    setCanViewReports(true);
    setMonthlyAllowance("");
  };

  const handleInviteMember = () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email.",
        variant: "destructive",
      });
      return;
    }

    const memberData = {
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      canManageTransactions,
      canViewReports,
      monthlyAllowance: monthlyAllowance ? parseFloat(monthlyAllowance) : null,
    };

    inviteMemberMutation.mutate(memberData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'declined':
        return <Badge variant="destructive"><UserX className="w-3 h-3 mr-1" />Recusado</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'child':
        return <Badge className="bg-blue-100 text-blue-800">Filho(a)</Badge>;
      default:
        return <Badge variant="secondary">Membro</Badge>;
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "Não definido";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardContent className="p-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Gerenciamento Familiar
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-family-member">
                <Plus className="w-4 h-4 mr-2" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Convidar Membro da Família</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-name">Nome</Label>
                  <Input
                    id="invite-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Nome completo"
                    data-testid="input-invite-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    data-testid="input-invite-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="invite-role">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger data-testid="select-invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="child">Filho(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="can-manage">Pode gerenciar transações</Label>
                    <Switch
                      id="can-manage"
                      checked={canManageTransactions}
                      onCheckedChange={setCanManageTransactions}
                      data-testid="switch-manage-transactions"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="can-view">Pode ver relatórios</Label>
                    <Switch
                      id="can-view"
                      checked={canViewReports}
                      onCheckedChange={setCanViewReports}
                      data-testid="switch-view-reports"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="allowance">Mesada mensal (opcional)</Label>
                  <Input
                    id="allowance"
                    type="number"
                    step="0.01"
                    value={monthlyAllowance}
                    onChange={(e) => setMonthlyAllowance(e.target.value)}
                    placeholder="0.00"
                    data-testid="input-monthly-allowance"
                  />
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleInviteMember}
                    disabled={inviteMemberMutation.isPending}
                    className="flex-1"
                    data-testid="button-send-invite"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {inviteMemberMutation.isPending ? "Enviando..." : "Enviar Convite"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {familyMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum membro da família cadastrado ainda.</p>
            <p className="text-sm">Comece convidando sua família para gerenciar as finanças juntos!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {familyMembers.map((member: FamilyMember) => (
              <div
                key={member.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                data-testid={`family-member-${member.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{member.name}</h4>
                      {getStatusBadge(member.inviteStatus)}
                      {getRoleBadge(member.role)}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {member.email}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        {member.canManageTransactions && (
                          <span className="flex items-center text-green-600">
                            <Shield className="w-4 h-4 mr-1" />
                            Gerencia transações
                          </span>
                        )}
                        {member.canViewReports && (
                          <span className="flex items-center text-blue-600">
                            <Eye className="w-4 h-4 mr-1" />
                            Vê relatórios
                          </span>
                        )}
                        {member.monthlyAllowance && (
                          <span className="flex items-center text-purple-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Mesada: {formatCurrency(member.monthlyAllowance)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs">
                        Convidado em: {new Date(member.invitedAt).toLocaleDateString('pt-BR')}
                        {member.joinedAt && (
                          <> | Ingressou em: {new Date(member.joinedAt).toLocaleDateString('pt-BR')}</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`remove-member-${member.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover membro da família</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover <strong>{member.name}</strong> da conta familiar?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          className="bg-red-600 hover:bg-red-700"
                          data-testid={`confirm-remove-${member.id}`}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}