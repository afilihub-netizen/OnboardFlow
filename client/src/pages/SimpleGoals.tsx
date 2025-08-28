import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const goalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["emergency_fund", "vacation", "house_purchase", "retirement", "education", "custom"]),
  targetAmount: z.string().min(1, "Meta de valor é obrigatória"),
  currentAmount: z.string().optional(),
  targetDate: z.string().min(1, "Data limite é obrigatória"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

const goalTypeLabels = {
  emergency_fund: "Fundo de Emergência",
  vacation: "Férias",
  house_purchase: "Compra da Casa",
  retirement: "Aposentadoria",
  education: "Educação",
  custom: "Personalizado",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta", 
  urgent: "Urgente",
};

export default function SimpleGoals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      type: "emergency_fund",
      targetAmount: "",
      currentAmount: "0",
      targetDate: "",
      priority: "medium",
    },
  });

  const { data: goals, isLoading } = useQuery({
    queryKey: ['/api/goals'],
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create goal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Meta criada",
        description: "Meta foi adicionada com sucesso!",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof goalSchema>) => {
    createGoalMutation.mutate({
      ...data,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || "0",
      targetDate: new Date(data.targetDate),
      status: 'active',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const goalList = (goals as any[] || []);
  const activeGoals = goalList.filter(goal => goal.status === 'active');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Metas & Objetivos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Defina e acompanhe o progresso das suas metas financeiras
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Meta Financeira</DialogTitle>
              <DialogDescription>
                Defina uma nova meta para alcançar seus objetivos
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Meta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Casa própria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(goalTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Meta</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50000,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Atual</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Limite</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(priorityLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createGoalMutation.isPending}
                  >
                    {createGoalMutation.isPending ? "Salvando..." : "Criar Meta"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Metas Ativas
            </CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {activeGoals.length}
            </div>
            <p className="text-xs text-green-600 mt-1">
              em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total das Metas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {activeGoals.reduce((sum, goal) => 
                sum + parseFloat(goal.targetAmount || '0'), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              soma das metas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progresso Médio
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGoals.length > 0 ? 
                Math.round(activeGoals.reduce((sum, goal) => {
                  const current = parseFloat(goal.currentAmount || '0');
                  const target = parseFloat(goal.targetAmount || '1');
                  return sum + (current / target) * 100;
                }, 0) / activeGoals.length) : 0}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              das metas concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Minhas Metas</h2>
        
        {goalList.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Nenhuma meta definida
            </h3>
            <p className="text-gray-600 mb-4">
              Defina suas primeiras metas financeiras para começar a alcançar seus objetivos
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goalList.map((goal: any) => {
              const currentAmount = parseFloat(goal.currentAmount || '0');
              const targetAmount = parseFloat(goal.targetAmount || '1');
              const progress = Math.min((currentAmount / targetAmount) * 100, 100);
              const targetDate = new Date(goal.targetDate);
              const today = new Date();
              const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <Card key={goal.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {goal.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {goalTypeLabels[goal.type as keyof typeof goalTypeLabels] || goal.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {priorityLabels[goal.priority as keyof typeof priorityLabels] || goal.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progresso</span>
                          <span className="font-medium">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Atual:</span>
                        <span className="font-medium">
                          R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Meta:</span>
                        <span className="font-medium">
                          R$ {targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Prazo:</span>
                          <span className={`font-medium ${
                            daysLeft < 0 ? 'text-red-600' :
                            daysLeft < 30 ? 'text-orange-600' :
                            'text-gray-900'
                          }`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)} dias em atraso` :
                             daysLeft === 0 ? 'Vence hoje!' :
                             `${daysLeft} dias restantes`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}