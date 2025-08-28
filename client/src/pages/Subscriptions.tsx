import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Calendar, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubscriptionSchema, type Subscription } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const subscriptionFormSchema = insertSubscriptionSchema.extend({
  merchant: z.string().min(1, "Nome do serviço é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
});

const frequencyLabels = {
  weekly: "Semanal",
  monthly: "Mensal", 
  yearly: "Anual",
};

const statusLabels = {
  active: "Ativo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300", 
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
};

export default function Subscriptions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof subscriptionFormSchema>>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      merchant: "",
      amount: "",
      frequency: "monthly",
      status: "active",
    },
  });

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  const detectSubscriptionsMutation = useMutation({
    mutationFn: () => apiRequest('/api/subscriptions/detect', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: "Assinaturas detectadas",
        description: `${data.count} possíveis assinaturas foram encontradas automaticamente!`,
      });
    },
    onError: () => {
      toast({
        title: "Erro na detecção",
        description: "Não foi possível detectar assinaturas automaticamente.",
        variant: "destructive",
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/subscriptions', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Assinatura adicionada",
        description: "Assinatura foi adicionada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar",
        description: "Ocorreu um erro ao adicionar a assinatura.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof subscriptionFormSchema>) => {
    const nextChargeDate = new Date();
    nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
    
    createSubscriptionMutation.mutate({
      ...data,
      nextChargeDate,
    });
  };

  const filteredSubscriptions = subscriptions?.filter((sub: Subscription) =>
    sub.merchant.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalMonthlyAmount = subscriptions?.reduce((sum: number, sub: Subscription) => {
    if (sub.status !== 'active') return sum;
    
    const amount = parseFloat(sub.amount);
    switch (sub.frequency) {
      case 'weekly': return sum + (amount * 4.33);
      case 'yearly': return sum + (amount / 12);
      default: return sum + amount;
    }
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assinaturas & Serviços
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitore todas as suas assinaturas e gastos recorrentes
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => detectSubscriptionsMutation.mutate()}
            disabled={detectSubscriptionsMutation.isPending}
            data-testid="button-detect-subscriptions"
          >
            <Search className="w-4 h-4 mr-2" />
            {detectSubscriptionsMutation.isPending ? "Detectando..." : "Detectar Automático"}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Nova Assinatura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Assinatura</DialogTitle>
                <DialogDescription>
                  Adicione uma nova assinatura ou serviço recorrente
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="merchant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Serviço</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Netflix" {...field} data-testid="input-merchant-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="29,90" 
                              {...field}
                              data-testid="input-subscription-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-frequency">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(frequencyLabels).map(([value, label]) => (
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
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createSubscriptionMutation.isPending}
                      data-testid="button-create-subscription"
                    >
                      {createSubscriptionMutation.isPending ? "Salvando..." : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              Gasto Mensal Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">
              R$ {totalMonthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {subscriptions?.filter((s: Subscription) => s.status === 'active').length || 0} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 dark:from-orange-900/20 dark:to-amber-900/20 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Próximos Vencimentos
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {subscriptions?.filter((s: Subscription) => {
                if (s.status !== 'active' || !s.nextChargeDate) return false;
                const nextCharge = new Date(s.nextChargeDate);
                const today = new Date();
                const diffDays = (nextCharge.getTime() - today.getTime()) / (1000 * 3600 * 24);
                return diffDays <= 7 && diffDays >= 0;
              }).length || 0}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Economia Potencial
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              R$ {(totalMonthlyAmount * 0.15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              cancelando não utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar assinaturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            data-testid="input-search-subscriptions"
          />
        </div>
      </div>

      {/* Lista de Assinaturas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Minhas Assinaturas
        </h2>
        
        {subscriptions?.some((s: Subscription) => !s.confirmedByUser) && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Algumas assinaturas foram detectadas automaticamente. Confirme ou remova as que não são relevantes.
            </AlertDescription>
          </Alert>
        )}
        
        {filteredSubscriptions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma assinatura encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? 
                "Tente ajustar sua busca ou adicione uma nova assinatura" :
                "Adicione suas assinaturas para monitorar gastos recorrentes"
              }
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubscriptions.map((subscription: Subscription) => {
              const nextCharge = subscription.nextChargeDate ? new Date(subscription.nextChargeDate) : null;
              const daysUntilCharge = nextCharge ? 
                Math.ceil((nextCharge.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
              
              return (
                <Card 
                  key={subscription.id} 
                  className={`hover:shadow-lg transition-shadow duration-200 ${
                    !subscription.confirmedByUser ? 'border-blue-200 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-800' : ''
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {subscription.merchant}
                        {!subscription.confirmedByUser && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Detectado
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge className={`text-xs ${statusColors[subscription.status]}`}>
                        {statusLabels[subscription.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          R$ {parseFloat(subscription.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {frequencyLabels[subscription.frequency]}
                        </p>
                      </div>
                      
                      {nextCharge && subscription.status === 'active' && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Próxima cobrança:
                          </p>
                          <p className={`text-sm font-medium ${
                            daysUntilCharge && daysUntilCharge <= 3 ? 'text-red-600 dark:text-red-400' :
                            daysUntilCharge && daysUntilCharge <= 7 ? 'text-orange-600 dark:text-orange-400' :
                            'text-gray-900 dark:text-white'
                          }`}>
                            {nextCharge.toLocaleDateString('pt-BR')}
                            {daysUntilCharge !== null && (
                              <span className="text-xs ml-1">
                                ({daysUntilCharge === 0 ? 'hoje' : 
                                  daysUntilCharge === 1 ? 'amanhã' :
                                  `em ${daysUntilCharge} dias`})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
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