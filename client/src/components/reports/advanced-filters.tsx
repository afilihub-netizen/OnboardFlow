import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, TrendingUp, TrendingDown, PieChart, BarChart3 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FilterCriteria {
  startDate: Date | undefined;
  endDate: Date | undefined;
  categories: string[];
  transactionType: string;
  amountRange: {
    min: string;
    max: string;
  };
  paymentMethod: string;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterCriteria) => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
}

export function AdvancedFilters({ onFiltersChange, onAnalyze, isAnalyzing = false }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    startDate: undefined,
    endDate: undefined,
    categories: [],
    transactionType: "all",
    amountRange: { min: "", max: "" },
    paymentMethod: "all",
  });

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

  const updateFilters = (newFilters: Partial<FilterCriteria>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilters({ categories: newCategories });
  };

  const resetFilters = () => {
    const resetFilters: FilterCriteria = {
      startDate: undefined,
      endDate: undefined,
      categories: [],
      transactionType: "all",
      amountRange: { min: "", max: "" },
      paymentMethod: "all",
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const paymentMethods = [
    { value: "all", label: "Todos os métodos" },
    { value: "pix", label: "PIX" },
    { value: "debit_card", label: "Cartão de Débito" },
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "cash", label: "Dinheiro" },
    { value: "transfer", label: "Transferência" },
    { value: "other", label: "Outros" },
  ];

  const transactionTypes = [
    { value: "all", label: "Todos" },
    { value: "income", label: "Receitas" },
    { value: "expense", label: "Despesas" },
  ];

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros Avançados
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Limpar Filtros
            </Button>
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              size="sm"
              data-testid="button-analyze-advanced"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Analisando..." : "Analisar"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-start-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => updateFilters({ startDate: date })}
                  initialFocus
                  locale={ptBR}
                  data-testid="calendar-start-date"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-end-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => updateFilters({ endDate: date })}
                  initialFocus
                  locale={ptBR}
                  data-testid="calendar-end-date"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Transaction Type and Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tipo de Transação</Label>
            <Select
              value={filters.transactionType}
              onValueChange={(value) => updateFilters({ transactionType: value })}
            >
              <SelectTrigger data-testid="select-transaction-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Método de Pagamento</Label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) => updateFilters({ paymentMethod: value })}
            >
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount Range */}
        <div>
          <Label>Faixa de Valor (R$)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Valor mínimo"
              value={filters.amountRange.min}
              onChange={(e) => updateFilters({
                amountRange: { ...filters.amountRange, min: e.target.value }
              })}
              data-testid="input-amount-min"
            />
            <Input
              type="number"
              placeholder="Valor máximo"
              value={filters.amountRange.max}
              onChange={(e) => updateFilters({
                amountRange: { ...filters.amountRange, max: e.target.value }
              })}
              data-testid="input-amount-max"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-3 block">Categorias</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category: any) => (
              <Badge
                key={category.id}
                variant={filters.categories.includes(category.id) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20"
                onClick={() => toggleCategory(category.id)}
                data-testid={`category-filter-${category.id}`}
              >
                {category.name}
              </Badge>
            ))}
          </div>
          {filters.categories.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {filters.categories.length} categoria(s) selecionada(s)
            </p>
          )}
        </div>

        {/* Active Filters Summary */}
        {(filters.startDate || filters.endDate || filters.categories.length > 0 || 
          filters.transactionType !== "all" || filters.paymentMethod !== "all" ||
          filters.amountRange.min || filters.amountRange.max) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Filtros Ativos:</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              {filters.startDate && (
                <Badge variant="outline">
                  Início: {format(filters.startDate, "dd/MM/yyyy")}
                </Badge>
              )}
              {filters.endDate && (
                <Badge variant="outline">
                  Fim: {format(filters.endDate, "dd/MM/yyyy")}
                </Badge>
              )}
              {filters.transactionType !== "all" && (
                <Badge variant="outline">
                  {transactionTypes.find(t => t.value === filters.transactionType)?.label}
                </Badge>
              )}
              {filters.paymentMethod !== "all" && (
                <Badge variant="outline">
                  {paymentMethods.find(p => p.value === filters.paymentMethod)?.label}
                </Badge>
              )}
              {filters.amountRange.min && (
                <Badge variant="outline">
                  Min: R$ {filters.amountRange.min}
                </Badge>
              )}
              {filters.amountRange.max && (
                <Badge variant="outline">
                  Max: R$ {filters.amountRange.max}
                </Badge>
              )}
              {filters.categories.length > 0 && (
                <Badge variant="outline">
                  {filters.categories.length} categoria(s)
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}