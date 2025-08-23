import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Save, Upload } from "lucide-react";

const transactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser um número positivo"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(["pix", "debit_card", "credit_card", "cash", "transfer", "other"]),
  date: z.string().min(1, "Data é obrigatória"),
  isRecurring: z.boolean().default(false),
  dueDay: z.string().optional(),
  // Campos para parcelamento
  isInstallment: z.boolean().default(false),
  totalValue: z.string().optional(),
  installmentCount: z.string().optional(),
  installmentValue: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function TransactionForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().split('T')[0],
      paymentMethod: "pix",
      isRecurring: false,
      isInstallment: false,
    },
  });
  
  const watchPaymentMethod = form.watch("paymentMethod");
  const watchIsInstallment = form.watch("isInstallment");
  const watchInstallmentCount = form.watch("installmentCount");
  const watchTotalValue = form.watch("totalValue");
  
  // Auto-calculate installment value when total value or installment count changes
  const calculateInstallmentValue = () => {
    if (watchTotalValue && watchInstallmentCount) {
      const total = parseFloat(watchTotalValue);
      const count = parseInt(watchInstallmentCount);
      if (!isNaN(total) && !isNaN(count) && count > 0) {
        const installmentValue = (total / count).toFixed(2);
        form.setValue("installmentValue", installmentValue);
        form.setValue("amount", installmentValue); // Amount becomes the installment value
      }
    }
  };

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

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      await apiRequest('POST', '/api/transactions', {
        ...data,
        amount: data.amount,
        date: data.date,
        isRecurring: data.isRecurring,
        dueDay: data.isRecurring && data.dueDay ? parseInt(data.dueDay) : undefined,
        // Installment data
        totalValue: data.isInstallment && data.totalValue ? parseFloat(data.totalValue) : undefined,
        totalInstallments: data.isInstallment && data.installmentCount ? parseInt(data.installmentCount) : undefined,
        paidInstallments: data.isInstallment ? 1 : undefined, // First installment is being paid
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso!",
      });
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
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
        description: "Falha ao criar transação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createTransactionMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle>Nova Transação</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transaction Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="income" id="income" data-testid="radio-income" />
                          <Label htmlFor="income">Receita</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="expense" id="expense" data-testid="radio-expense" />
                          <Label htmlFor="expense">Despesa</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Supermercado, Salário..."
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
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
                        {categories?.map((category) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Day - only show if recurring */}
              {form.watch('isRecurring') && (
                <FormField
                  control={form.control}
                  name="dueDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia do Vencimento</FormLabel>
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
              )}
            </div>

            {/* Installment Checkbox - show for credit card or other (financing) */}
            {(watchPaymentMethod === 'credit_card' || watchPaymentMethod === 'other') && (
              <FormField
                control={form.control}
                name="isInstallment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-installment"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        🏪 É um produto parcelado?
                      </FormLabel>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Marque se este produto foi comprado a prazo ou financiado.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Installment Fields - show when installment is checked */}
            {watchIsInstallment && (watchPaymentMethod === 'credit_card' || watchPaymentMethod === 'other') && (
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-medium">🛒 Dados do Parcelamento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Value */}
                  <FormField
                    control={form.control}
                    name="totalValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total do Bem</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">R$</span>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="1200,00"
                              className="pl-8"
                              onChange={(e) => {
                                field.onChange(e);
                                setTimeout(calculateInstallmentValue, 100);
                              }}
                              data-testid="input-total-value"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Installment Count */}
                  <FormField
                    control={form.control}
                    name="installmentCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="2"
                            max="60"
                            placeholder="12"
                            onChange={(e) => {
                              field.onChange(e);
                              setTimeout(calculateInstallmentValue, 100);
                            }}
                            data-testid="input-installment-count"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Installment Value (auto-calculated) */}
                  <FormField
                    control={form.control}
                    name="installmentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Parcela</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">R$</span>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="100,00"
                              className="pl-8 bg-gray-50 dark:bg-gray-800"
                              readOnly
                              data-testid="input-installment-value"
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Calculado automaticamente
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attachment */}
              <div>
                <Label>Comprovante</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <label className="cursor-pointer text-blue-600 hover:text-blue-700">
                        <span>Carregar arquivo</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          data-testid="input-attachment"
                        />
                      </label>
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-gray-500">{selectedFile.name}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Empty space for second column on larger screens */}
              <div className="hidden md:block"></div>
            </div>

            {/* Recurring Transaction Option */}
            <div className="border-t pt-6">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-recurring"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        📅 É um lançamento mensal?
                      </FormLabel>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Marque se esta é uma despesa ou receita que se repete mensalmente (ex: aluguel, salário, conta de luz)
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.reset()}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTransactionMutation.isPending}
                data-testid="button-save-transaction"
              >
                {createTransactionMutation.isPending ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Transação
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
