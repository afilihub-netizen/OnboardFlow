import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Zap, Wifi, Car, Calendar, Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const getCategoryIcon = (categoryName: string, description: string) => {
  const text = `${categoryName || ''} ${description}`.toLowerCase();
  if (text.includes('aluguel') || text.includes('casa') || text.includes('habitação')) return Home;
  if (text.includes('energia') || text.includes('luz') || text.includes('elétrica')) return Zap;
  if (text.includes('internet') || text.includes('wifi') || text.includes('telecom')) return Wifi;
  if (text.includes('seguro') || text.includes('carro') || text.includes('veículo')) return Car;
  return Calendar;
};

const getCategoryColor = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('aluguel')) return 'bg-blue-100 dark:bg-blue-900 text-blue-600';
  if (lowerName.includes('energia')) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600';
  if (lowerName.includes('internet')) return 'bg-purple-100 dark:bg-purple-900 text-purple-600';
  if (lowerName.includes('seguro')) return 'bg-red-100 dark:bg-red-900 text-red-600';
  return 'bg-gray-100 dark:bg-gray-900 text-gray-600';
};

const getStatusColor = (isPaid: boolean) => {
  return isPaid ? 'bg-green-500' : 'bg-orange-500';
};

const getStatusTitle = (isPaid: boolean) => {
  return isPaid ? 'Pago' : 'Pendente';
};

const fixedExpenseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser um número positivo"),
  dueDay: z.string().min(1, "Dia do vencimento é obrigatório").refine((val) => {
    const day = parseInt(val);
    return day >= 1 && day <= 31;
  }, "Dia deve estar entre 1 e 31"),
  categoryId: z.string().optional(),
  isPaid: z.boolean().default(false),
  totalInstallments: z.string().optional(),
  paidInstallments: z.string().optional(),
});

type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

export function FixedExpenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: {
      isPaid: false,
      totalInstallments: "",
      paidInstallments: "",
    },
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['/api/transactions/recurring'],
    queryFn: async () => {
      const response = await fetch('/api/transactions/recurring', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch recurring transactions');
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const createFixedExpenseMutation = useMutation({
    mutationFn: async (data: FixedExpenseFormData) => {
      if (data.isPaid) {
        // Se estiver pago, criar como transação recorrente
        await apiRequest('POST', '/api/transactions', {
          description: data.name,
          amount: data.amount,
          type: 'expense',
          categoryId: data.categoryId,
          paymentMethod: 'other',
          date: new Date().toISOString().split('T')[0],
          isRecurring: true,
          dueDay: parseInt(data.dueDay),
          totalInstallments: data.totalInstallments ? parseInt(data.totalInstallments) : undefined,
          paidInstallments: data.paidInstallments ? parseInt(data.paidInstallments) : undefined,
        });
      } else {
        // Se não estiver pago, criar como conta fixa
        await apiRequest('POST', '/api/fixed-expenses', {
          name: data.name,
          amount: data.amount,
          dueDay: parseInt(data.dueDay),
          categoryId: data.categoryId,
          totalInstallments: data.totalInstallments ? parseInt(data.totalInstallments) : undefined,
          paidInstallments: data.paidInstallments ? parseInt(data.paidInstallments) : undefined,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Conta fixa criada com sucesso!",
      });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recurring'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fixed-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/future-commitments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-summary'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao criar conta fixa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FixedExpenseFormData) => {
    createFixedExpenseMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contas Fixas do Mês</CardTitle>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const formatDueDate = (dueDay: number) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const dueDate = new Date(currentYear, currentMonth, dueDay);
    
    return `Vence em ${dueDay.toString().padStart(2, '0')}/${(currentMonth + 1).toString().padStart(2, '0')}`;
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contas Fixas do Mês</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white" 
                data-testid="button-add-fixed-expense"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta Fixa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Conta Fixa do Mês</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Conta</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex: Aluguel, Conta de Luz..."
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Valor */}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">R$</span>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="pl-8"
                                data-testid="input-amount"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dia do Vencimento */}
                    <FormField
                      control={form.control}
                      name="dueDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia Vencimento</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              max="31"
                              placeholder="Ex: 10"
                              data-testid="input-due-day"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Categoria */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Controle de Parcelas */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-medium">📊 Controle de Parcelas (Opcional)</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Total de Parcelas */}
                      <FormField
                        control={form.control}
                        name="totalInstallments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total de Parcelas</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                placeholder="Ex: 12"
                                data-testid="input-total-installments"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Parcelas Já Pagas */}
                      <FormField
                        control={form.control}
                        name="paidInstallments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Já Pagas</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                max={form.watch('totalInstallments') || "999"}
                                placeholder="Ex: 3"
                                data-testid="input-paid-installments"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Mostrar Progress */}
                    {form.watch('totalInstallments') && form.watch('paidInstallments') && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {(() => {
                          const total = parseInt(form.watch('totalInstallments') || '0');
                          const paid = parseInt(form.watch('paidInstallments') || '0');
                          const remaining = total - paid;
                          const percentage = total > 0 ? (paid / total) * 100 : 0;
                          
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Progresso: {paid}/{total} parcelas</span>
                                <span>{remaining} restantes</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Status Pago */}
                  <FormField
                    control={form.control}
                    name="isPaid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-paid"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            ✅ Já foi pago este mês?
                          </FormLabel>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Se já foi pago, aparecerá nos lançamentos. Se não, ficará pendente.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createFixedExpenseMutation.isPending}
                      data-testid="button-save"
                    >
                      {createFixedExpenseMutation.isPending ? (
                        "Salvando..."
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conta fixa cadastrada.</p>
            <p className="text-sm">Adicione suas contas mensais para melhor controle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {expenses.map((transaction: any) => {
              const Icon = getCategoryIcon(transaction.category?.name || '', transaction.description);
              
              return (
                <div 
                  key={transaction.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  data-testid={`fixed-expense-${transaction.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(transaction.description)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm" data-testid={`expense-name-${transaction.id}`}>
                        {transaction.description}
                      </span>
                    </div>
                    <span 
                      className={`w-2 h-2 bg-blue-500 rounded-full`} 
                      title="Lançamento Mensal"
                      data-testid={`expense-status-${transaction.id}`}
                    ></span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid={`expense-amount-${transaction.id}`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                  {transaction.totalInstallments && transaction.paidInstallments !== undefined && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                      📊 {transaction.paidInstallments}/{transaction.totalInstallments} parcelas
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`expense-due-date-${transaction.id}`}>
                    {transaction.dueDay ? formatDueDate(transaction.dueDay) : 'Data não definida'}
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
