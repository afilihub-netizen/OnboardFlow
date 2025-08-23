import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CreditCard, FileText } from "lucide-react";

interface FutureCommitment {
  id: string;
  description: string;
  totalValue: string;
  totalInstallments: number;
  paidInstallments: number;
  installmentValue: string;
  paymentMethod: string;
  categoryName: string;
}

export function FutureCommitments() {
  const { data: commitments, isLoading } = useQuery({
    queryKey: ['/api/transactions/future-commitments'],
    queryFn: async () => {
      const response = await fetch('/api/transactions/future-commitments', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch future commitments');
      return response.json() as FutureCommitment[];
    },
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'other':
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'other':
        return 'Financiamento';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>Compromissos Futuros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!commitments || commitments.length === 0) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <CardTitle>Compromissos Futuros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum compromisso futuro encontrado.</p>
            <p className="text-sm">Compras parceladas aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalOutstanding = commitments.reduce((total, commitment) => {
    const remainingInstallments = commitment.totalInstallments - commitment.paidInstallments;
    const remainingValue = remainingInstallments * parseFloat(commitment.installmentValue);
    return total + remainingValue;
  }, 0);

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <CardTitle>Compromissos Futuros</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total pendente</p>
            <p className="text-lg font-bold text-orange-600" data-testid="total-outstanding">
              {formatCurrency(totalOutstanding.toString())}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4" data-testid="commitments-list">
          {commitments.map((commitment, index) => {
            const remainingInstallments = commitment.totalInstallments - commitment.paidInstallments;
            const remainingValue = remainingInstallments * parseFloat(commitment.installmentValue);
            const progressPercent = (commitment.paidInstallments / commitment.totalInstallments) * 100;

            return (
              <div
                key={commitment.id}
                className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                data-testid={`commitment-${index}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(commitment.paymentMethod)}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {commitment.description}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getPaymentMethodLabel(commitment.paymentMethod)}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {commitment.categoryName || 'Sem categoria'}
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatCurrency(remainingValue.toString())}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{commitment.paidInstallments} de {commitment.totalInstallments} pagas</span>
                    <span>{remainingInstallments} restantes</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(progressPercent, 5)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Parcela: {formatCurrency(commitment.installmentValue)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Total: {formatCurrency(commitment.totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}