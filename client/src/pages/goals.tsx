import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Calendar, TrendingUp, DollarSign, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Goals() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [newGoalData, setNewGoalData] = useState({
    categoryId: "",
    targetAmount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch current goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/budget-goals'],
    queryFn: async () => {
      const response = await fetch('/api/budget-goals', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch goals');
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return await apiRequest("POST", "/api/budget-goals", goalData);
    },
    onSuccess: () => {
      toast({
        title: "Meta criada!",
        description: "Sua nova meta foi criada com sucesso.",
      });
      setIsNewGoalDialogOpen(false);
      setNewGoalData({
        categoryId: "",
        targetAmount: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget-goals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar meta",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch(`/api/budget-goals/${goalId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete goal');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meta excluída!",
        description: "A meta foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget-goals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir meta",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const totalGoals = goals.reduce((acc: number, goal: any) => acc + parseFloat(goal.targetAmount || '0'), 0);
  const totalSaved = 0; // Real calculation would require financial data integration
  const overallProgress = totalGoals > 0 ? Math.round((totalSaved / totalGoals) * 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (authLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto md:ml-0">
        <Header 
          title="Metas Financeiras" 
          subtitle="Defina e acompanhe suas metas de economia" 
        />
        
        <div className="p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Metas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Poupado</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSaved)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meta Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalGoals)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progresso Geral</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals List */}
          <Card className="financial-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Suas Metas
              </CardTitle>
              <Dialog open={isNewGoalDialogOpen} onOpenChange={setIsNewGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-goal">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Meta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Valor da Meta</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="R$ 0,00"
                        value={newGoalData.targetAmount}
                        onChange={(e) => setNewGoalData({...newGoalData, targetAmount: e.target.value})}
                        data-testid="input-goal-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={newGoalData.categoryId} onValueChange={(value) => setNewGoalData({...newGoalData, categoryId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Poupança Geral</SelectItem>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="month">Mês</Label>
                        <Select value={newGoalData.month.toString()} onValueChange={(value) => setNewGoalData({...newGoalData, month: parseInt(value)})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="year">Ano</Label>
                        <Select value={newGoalData.year.toString()} onValueChange={(value) => setNewGoalData({...newGoalData, year: parseInt(value)})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        if (!newGoalData.targetAmount) {
                          toast({
                            title: "Erro",
                            description: "Por favor, informe o valor da meta.",
                            variant: "destructive"
                          });
                          return;
                        }
                        const goalData = {
                          ...newGoalData,
                          categoryId: newGoalData.categoryId || null
                        };
                        createGoalMutation.mutate(goalData);
                      }}
                      disabled={createGoalMutation.isPending}
                      data-testid="button-create-goal"
                    >
                      {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhuma meta criada ainda</p>
                  <p className="text-sm text-gray-500">Crie sua primeira meta financeira para começar!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {goals.map((goal: any) => {
                    const targetAmount = parseFloat(goal.targetAmount);
                    
                    return (
                      <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {goal.categoryId ? `Orçamento para ${goal.category?.name || 'Categoria'}` : 'Poupança Geral'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(0, goal.month - 1).toLocaleDateString('pt-BR', { month: 'long' })} {goal.year}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                Meta: {formatCurrency(targetAmount)}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {goal.categoryId ? 'Orçamento mensal' : 'Meta de poupança'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteGoalMutation.mutate(goal.id)}
                              disabled={deleteGoalMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              data-testid={`button-delete-goal-${goal.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {goal.categoryId 
                              ? `Orçamento para gastos da categoria "${goal.category?.name || 'Categoria'}"` 
                              : 'Meta de poupança geral para o mês'
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}