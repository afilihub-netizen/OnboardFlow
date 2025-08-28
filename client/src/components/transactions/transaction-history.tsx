import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Download, Filter, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { TransactionForm } from "./transaction-form";

export function TransactionHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("current-month");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'single' | 'multiple', id?: string}>({type: 'single'});

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

  const getFilterParams = () => {
    const params = new URLSearchParams();
    
    if (categoryFilter !== "all") {
      params.append("categoryId", categoryFilter);
    }
    
    if (typeFilter !== "all") {
      params.append("type", typeFilter);
    }

    // Add date filters based on period
    const now = new Date();
    let startDate, endDate;

    switch (periodFilter) {
      case "current-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last-3-months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "current-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    if (startDate && endDate) {
      params.append("startDate", startDate.toISOString());
      params.append("endDate", endDate.toISOString());
    }

    return params.toString();
  };

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions', categoryFilter, periodFilter, typeFilter],
    queryFn: async () => {
      const filterParams = getFilterParams();
      const url = filterParams ? `/api/transactions?${filterParams}` : '/api/transactions';
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/transactions/${id}`, null);
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recurring'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/future-commitments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-summary'] });
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
        description: "Falha ao excluir transação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMultipleTransactionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map(id => apiRequest('DELETE', `/api/transactions/${id}`, null))
      );
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Sucesso",
        description: `${selectedTransactions.size} transações excluídas com sucesso!`,
      });
      setSelectedTransactions(new Set());
      setIsSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recurring'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/future-commitments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-summary'] });
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
        description: "Falha ao excluir transações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    setDeleteTarget({ type: 'single', id });
    setIsDeleteModalOpen(true);
  };

  const handleMultipleDelete = () => {
    if (selectedTransactions.size === 0) return;
    setDeleteTarget({ type: 'multiple' });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget.type === 'single' && deleteTarget.id) {
      deleteTransactionMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === 'multiple') {
      deleteMultipleTransactionsMutation.mutate(Array.from(selectedTransactions));
    }
    setIsDeleteModalOpen(false);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget({ type: 'single' });
  };

  const toggleTransactionSelection = (id: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTransactions(newSelection);
  };

  const selectAllTransactions = () => {
    if (transactions) {
      setSelectedTransactions(new Set(transactions.map((t: any) => t.id)));
    }
  };

  const deselectAllTransactions = () => {
    setSelectedTransactions(new Set());
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedTransactions(new Set());
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditingTransaction(null);
    setIsEditDialogOpen(false);
  };

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: "Nada para exportar",
        description: "Não há transações para exportar com os filtros aplicados.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar cabeçalho CSV
      const headers = [
        'Data',
        'Tipo',
        'Descrição',
        'Categoria',
        'Forma de Pagamento',
        'Valor'
      ];

      // Converter transações para CSV
      const csvData = transactions.map(transaction => [
        formatDate(transaction.date),
        transaction.type === 'income' ? 'Receita' : 'Despesa',
        transaction.description,
        getCategoryName(transaction.categoryId),
        getPaymentMethodLabel(transaction.paymentMethod),
        `"${formatCurrency(transaction.amount)}"`
      ]);

      // Combinar cabeçalho com dados
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Nome do arquivo com data atual
        const today = new Date().toISOString().split('T')[0];
        const fileName = `transacoes_${today}.csv`;
        link.setAttribute('download', fileName);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Exportação concluída",
          description: `Arquivo ${fileName} baixado com sucesso!`,
        });
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: "Falha ao gerar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPaymentMethodLabel = (method: string) => {
    const paymentMethod = PAYMENT_METHODS.find(p => p.value === method);
    return paymentMethod?.label || method;
  };

  const getCategoryName = (categoryId: string) => {
    if (!categoryId || !categories) return 'Sem categoria';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <CardTitle>Histórico de Transações</CardTitle>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32" data-testid="select-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40" data-testid="select-period-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Este mês</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="current-year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleExport}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-export-transactions"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            
            {!isSelectionMode ? (
              <Button 
                onClick={() => setIsSelectionMode(true)}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                data-testid="button-start-selection"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleMultipleDelete}
                  disabled={selectedTransactions.size === 0 || deleteMultipleTransactionsMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  data-testid="button-delete-selected"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir ({selectedTransactions.size})
                </Button>
                <Button 
                  onClick={cancelSelectionMode}
                  variant="outline"
                  data-testid="button-cancel-selection"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Filter className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação encontrada.</p>
            <p className="text-sm">Ajuste os filtros ou adicione novas transações.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {isSelectionMode && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={transactions && selectedTransactions.size === transactions.length && transactions.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllTransactions();
                            } else {
                              deselectAllTransactions();
                            }
                          }}
                          data-testid="checkbox-select-all"
                        />
                        <span>Todos</span>
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Forma
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedTransactions.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`} data-testid={`transaction-row-${index}`}>
                    {isSelectionMode && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                          data-testid={`checkbox-transaction-${index}`}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-600' 
                            : 'bg-red-100 dark:bg-red-900 text-red-600'
                        }`}>
                          <i className={transaction.type === 'income' ? 'fas fa-arrow-up text-sm' : 'fas fa-arrow-down text-sm'}></i>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`transaction-description-${index}`}>
                          {transaction.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getCategoryName(transaction.categoryId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} data-testid={`transaction-amount-${index}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(transaction)}
                          data-testid={`button-edit-transaction-${index}`}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={deleteTransactionMutation.isPending}
                          data-testid={`button-delete-transaction-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Modifique os dados da transação abaixo.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm 
              editingTransaction={editingTransaction}
              onSuccess={handleEditClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              {deleteTarget.type === 'single' 
                ? "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
                : `Tem certeza que deseja excluir ${selectedTransactions.size} transação${selectedTransactions.size !== 1 ? 'ões' : ''}? Esta ação não pode ser desfeita.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={cancelDelete}
              data-testid="button-cancel-delete"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={deleteTransactionMutation.isPending || deleteMultipleTransactionsMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-confirm-delete"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteTarget.type === 'single' ? 'Excluir Transação' : `Excluir ${selectedTransactions.size}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
