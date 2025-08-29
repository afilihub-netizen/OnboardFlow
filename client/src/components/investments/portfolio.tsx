import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, TrendingUp, TrendingDown, PieChart, RefreshCw } from "lucide-react";
import { INVESTMENT_TYPES } from "@/lib/constants";

const investmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["fixed_income", "real_estate_fund", "stocks", "crypto", "savings", "other"]),
  initialAmount: z.string().min(1, "Valor inicial é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser um número positivo"),
  currentAmount: z.string().min(1, "Valor atual é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser um número positivo"),
  purchaseDate: z.string().min(1, "Data de compra é obrigatória"),
  notes: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

export function Portfolio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: "",
      type: "fixed_income",
      initialAmount: "",
      currentAmount: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const { data: investments, isLoading } = useQuery({
    queryKey: ['/api/financial/portfolio-data'],
    queryFn: async () => {
      const response = await fetch('/api/financial/portfolio-data', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch investments');
      return response.json();
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async (data: InvestmentFormData) => {
      await apiRequest('POST', '/api/investments', {
        ...data,
        initialAmount: data.initialAmount,
        currentAmount: data.currentAmount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Investimento criado com sucesso!",
      });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/financial/portfolio-data'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao criar investimento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvestmentFormData) => {
    createInvestmentMutation.mutate(data);
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const calculateGain = (initial: string, current: string) => {
    const initialVal = parseFloat(initial);
    const currentVal = parseFloat(current);
    const gain = currentVal - initialVal;
    const percentage = initialVal > 0 ? (gain / initialVal) * 100 : 0;
    return { amount: gain, percentage };
  };

  const getInvestmentTypeInfo = (type: string) => {
    return INVESTMENT_TYPES.find(t => t.value === type) || INVESTMENT_TYPES[5]; // fallback to "other"
  };

  const calculateTotalValue = () => {
    if (!investments) return 0;
    return investments.reduce((total, investment) => {
      return total + parseFloat(investment.currentAmount);
    }, 0);
  };

  const getPortfolioPercentage = (investmentValue: string) => {
    const totalValue = calculateTotalValue();
    return totalValue > 0 ? (parseFloat(investmentValue) / totalValue) * 100 : 0;
  };

  // Simulate market prices for demo (in real app, would use actual API)
  const generateMarketPrices = () => {
    const prices: Record<string, number> = {
      // Cryptocurrencies (USD prices)
      'BTC': 43250 + Math.random() * 1000 - 500,
      'ETH': 2580 + Math.random() * 100 - 50,
      'BNB': 315 + Math.random() * 20 - 10,
      'ADA': 0.48 + Math.random() * 0.05 - 0.025,
      'DOGE': 0.085 + Math.random() * 0.01 - 0.005,
      
      // Brazilian stocks (BRL prices)
      'ITSA4': 9.52 + Math.random() * 0.5 - 0.25,
      'PETR4': 38.45 + Math.random() * 2 - 1,
      'VALE3': 61.83 + Math.random() * 3 - 1.5,
      'BBDC4': 13.24 + Math.random() * 0.8 - 0.4,
      'ABEV3': 12.87 + Math.random() * 0.6 - 0.3,
      'MGLU3': 4.32 + Math.random() * 0.3 - 0.15,
      'WEGE3': 39.76 + Math.random() * 2 - 1,
      'RENT3': 62.18 + Math.random() * 3 - 1.5,
      
      // Indices and others
      'IBOV': 125430 + Math.random() * 2000 - 1000,
      'IFIX': 2847 + Math.random() * 50 - 25,
    };
    return prices;
  };

  const updateMarketPrices = () => {
    setMarketPrices(generateMarketPrices());
    setLastUpdated(new Date());
  };

  useEffect(() => {
    // Update prices on component mount and every 30 seconds
    updateMarketPrices();
    const interval = setInterval(updateMarketPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMarketPrice = (investmentName: string, type: string) => {
    // Extract ticker from investment name (e.g., "Bitcoin (BTC)" -> "BTC")
    const tickerMatch = investmentName.match(/\(([A-Z0-9]+)\)|\b([A-Z0-9]{3,5})\b/);
    const ticker = tickerMatch ? (tickerMatch[1] || tickerMatch[2]) : investmentName.toUpperCase();
    
    // For crypto and stocks, try to find market price
    if ((type === 'crypto' || type === 'stocks') && marketPrices[ticker]) {
      return marketPrices[ticker];
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portfólio de Investimentos</CardTitle>
            <Skeleton className="h-9 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfólio de Investimentos</CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={updateMarketPrices}
              className="text-xs"
              data-testid="button-refresh-prices"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar Preços
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                data-testid="button-new-investment"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Investimento
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Investimento</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Tesouro Selic, ITSA4..." data-testid="input-investment-name" />
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-investment-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INVESTMENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                      name="initialAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Inicial</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">R$</span>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="pl-8"
                                data-testid="input-initial-amount"
                              />
                            </div>
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
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">R$</span>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="pl-8"
                                data-testid="input-current-amount"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Compra</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date"
                            data-testid="input-purchase-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Notas sobre o investimento..."
                            rows={3}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-investment"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createInvestmentMutation.isPending}
                      data-testid="button-save-investment"
                    >
                      {createInvestmentMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        
        {lastUpdated && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Preços atualizados em: {lastUpdated.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {!investments || investments.length === 0 ? (
          <div className="text-center py-8">
            <PieChart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum investimento encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Comece a acompanhar seus investimentos adicionando o primeiro
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((investment, index) => {
              const typeInfo = getInvestmentTypeInfo(investment.type);
              const { amount: gain, percentage: gainPercentage } = calculateGain(
                investment.initialAmount, 
                investment.currentAmount
              );
              const portfolioPercentage = getPortfolioPercentage(investment.currentAmount);
              
              // Usar dados em tempo real se disponível
              const realTimePrice = investment.realTimePrice;
              const priceChange = investment.priceChange;
              const isRealTimeData = !!investment.marketData;
              
              return (
                <div 
                  key={investment.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  data-testid={`investment-card-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-${typeInfo.color}-100 dark:bg-${typeInfo.color}-900 rounded-lg flex items-center justify-center`}>
                        <i className={`${typeInfo.icon} text-${typeInfo.color}-600`}></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm" data-testid={`investment-name-${index}`}>
                          {investment.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {typeInfo.label}
                        </p>
                        {isRealTimeData && realTimePrice && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Tempo Real: {investment.type === 'crypto' ? 
                                `R$ ${realTimePrice.toFixed(2)}` : 
                                `R$ ${realTimePrice.toFixed(2)}`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        {priceChange !== undefined ? (
                          <>
                            {priceChange >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                            )}
                            <p className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                            </p>
                          </>
                        ) : (
                          <>
                            {gain >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                            )}
                            <p className={`text-xs ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainPercentage.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid={`investment-current-amount-${index}`}>
                      {formatCurrency(investment.currentAmount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rendimento: {gain >= 0 ? '+' : ''}{formatCurrency(gain.toString())}
                    </p>
                    {isRealTimeData && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        🟢 Dados atualizados em tempo real
                      </p>
                    )}
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                      <div 
                        className={`bg-${typeInfo.color}-500 h-1 rounded-full`} 
                        style={{ width: `${Math.min(portfolioPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
