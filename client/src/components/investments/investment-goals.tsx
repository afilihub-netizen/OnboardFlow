import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Target, Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function InvestmentGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Fetch budget goals for current month
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['/api/budget-goals', currentMonth, currentYear],
    queryFn: async () => {
      const response = await fetch(`/api/budget-goals?month=${currentMonth}&year=${currentYear}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch goals');
      return response.json();
    },
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return await apiRequest("/api/budget-goals", {
        method: "POST",
        body: JSON.stringify(goalData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-goals"] });
      setIsNewGoalDialogOpen(false);
      toast({
        title: "Meta criada",
        description: "Sua meta de investimento foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar meta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/budget-goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-goals"] });
      setEditingGoal(null);
      toast({
        title: "Meta atualizada",
        description: "Sua meta foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar meta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/budget-goals/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-goals"] });
      toast({
        title: "Meta excluída",
        description: "A meta foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir meta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const goalData = {
      targetAmount: formData.get("targetAmount"),
      month: currentMonth,
      year: currentYear,
      categoryId: formData.get("categoryId") || null,
    };

    createGoalMutation.mutate(goalData);
  };

  const handleUpdateGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const goalData = {
      targetAmount: formData.get("targetAmount"),
    };

    updateGoalMutation.mutate({ id: editingGoal.id, data: goalData });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const investmentGoals = goals.filter(goal => !goal.categoryId); // Investment goals without specific category

  return (
    <Card className="financial-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Metas de Investimento
        </CardTitle>
        
        <Dialog open={isNewGoalDialogOpen} onOpenChange={setIsNewGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-investment-goal">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Meta de Investimento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <Label htmlFor="targetAmount">Valor da Meta</Label>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  required
                  data-testid="input-goal-amount"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsNewGoalDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createGoalMutation.isPending} data-testid="button-create-goal">
                  {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : investmentGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Nenhuma meta de investimento definida para este mês
            </p>
            <Button
              onClick={() => setIsNewGoalDialogOpen(true)}
              variant="outline"
              data-testid="button-create-first-goal"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira meta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {investmentGoals.map((goal) => {
              const targetAmount = parseFloat(goal.targetAmount);
              const currentAmount = 800; // This would come from actual investment data
              const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
              
              return (
                <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Meta Mensal de Investimento
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Dialog open={editingGoal?.id === goal.id} onOpenChange={(open) => setEditingGoal(open ? goal : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid={`button-edit-goal-${goal.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Meta de Investimento</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdateGoal} className="space-y-4">
                            <div>
                              <Label htmlFor="editTargetAmount">Valor da Meta</Label>
                              <Input
                                id="editTargetAmount"
                                name="targetAmount"
                                type="number"
                                step="0.01"
                                defaultValue={goal.targetAmount}
                                required
                                data-testid="input-edit-goal-amount"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="outline" onClick={() => setEditingGoal(null)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={updateGoalMutation.isPending}>
                                {updateGoalMutation.isPending ? "Salvando..." : "Salvar"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        disabled={deleteGoalMutation.isPending}
                        data-testid={`button-delete-goal-${goal.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(currentAmount)} / {formatCurrency(targetAmount)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentAmount >= targetAmount 
                      ? "🎉 Meta atingida!" 
                      : `Faltam ${formatCurrency(targetAmount - currentAmount)} para atingir sua meta`
                    }
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}