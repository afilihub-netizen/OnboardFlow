import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const subscriptionSchema = z.object({
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

export default function SimpleSubscriptions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      merchant: "",
      amount: "",
      frequency: "monthly",
    },
  });

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  const detectSubscriptionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscriptions/detect', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to detect subscriptions');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: "Assinaturas detectadas",
        description: `${data.count || 0} possíveis assinaturas foram encontradas automaticamente!`,
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Assinatura adicionada",
        description: "Assinatura foi adicionada com sucesso!",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof subscriptionSchema>) => {
    const nextChargeDate = new Date();
    nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
    
    createSubscriptionMutation.mutate({
      ...data,
      status: 'active',
      nextChargeDate,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const subscriptionList = (subscriptions as any[] || []);
  const filteredSubscriptions = subscriptionList.filter((sub) =>
    sub.merchant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMonthlyAmount = subscriptionList.reduce((sum, sub) => {
    if (sub.status !== 'active') return sum;
    
    const amount = parseFloat(sub.amount);
    switch (sub.frequency) {
      case 'weekly': return sum + (amount * 4.33);
      case 'yearly': return sum + (amount / 12);
      default: return sum + amount;
    }
  }, 0);

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
          >
            {detectSubscriptionsMutation.isPending ? "Detectando..." : "Detectar Automático"}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
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
                          <Input placeholder="Ex: Netflix" {...field} />
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
                            <Input type="number" placeholder="29,90" {...field} />
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
                              <SelectTrigger>
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
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createSubscriptionMutation.isPending}
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
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Gasto Mensal Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              R$ {totalMonthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {subscriptionList.filter((s) => s.status === 'active').length} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Assinaturas
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptionList.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              assinaturas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Economia Potencial
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(totalMonthlyAmount * 0.15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              cancelando não utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar assinaturas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Lista de Assinaturas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Minhas Assinaturas</h2>
        
        {filteredSubscriptions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Nenhuma assinatura encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 
                "Tente ajustar sua busca ou adicione uma nova assinatura" :
                "Adicione suas assinaturas para monitorar gastos recorrentes"
              }
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubscriptions.map((subscription: any) => (
              <Card key={subscription.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {subscription.merchant}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {statusLabels[subscription.status as keyof typeof statusLabels] || subscription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-lg font-bold">
                        R$ {parseFloat(subscription.amount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {frequencyLabels[subscription.frequency as keyof typeof frequencyLabels] || subscription.frequency}
                      </p>
                    </div>
                    
                    {subscription.nextChargeDate && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-600">
                          Próxima cobrança:
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(subscription.nextChargeDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}