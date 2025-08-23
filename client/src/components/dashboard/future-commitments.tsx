import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CreditCard, FileText, Calendar, RefreshCw } from "lucide-react";

interface FutureCommitment {
  id: string;
  description: string;
  totalValue: string | null;
  totalInstallments: number | null;
  paidInstallments: number | null;
  installmentValue: string;
  paymentMethod: string;
  categoryName: string;
  type: 'installment' | 'monthly';
  dueDay?: number;
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

  const getPaymentMethodIcon = (method: string, type: string) => {
    if (type === 'monthly') {
      return <RefreshCw className="w-4 h-4" />;
    }
    
    switch (method) {
      case 'credit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'other':
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string, type: string) => {
    if (type === 'monthly') {
      return 'Conta Fixa';
    }
    
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

  // Separate commitments by time period
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
  const endOfNextTwoMonths = new Date(currentYear, currentMonth + 3, 0);

  const thisMonthCommitments: FutureCommitment[] = [];
  const nextTwoMonthsCommitments: FutureCommitment[] = [];

  commitments.forEach(commitment => {
    if (commitment.type === 'monthly') {
      // Fixed expenses repeat monthly - add to both periods
      thisMonthCommitments.push(commitment);
      nextTwoMonthsCommitments.push(commitment);
    } else {
      // Installment commitments - check remaining payments
      const remainingInstallments = commitment.totalInstallments! - commitment.paidInstallments!;
      if (remainingInstallments > 0) {
        thisMonthCommitments.push(commitment);
        if (remainingInstallments > 1) {
          nextTwoMonthsCommitments.push(commitment);
        }
      }
    }
  });

  const calculateTotal = (commitmentList: FutureCommitment[], monthsMultiplier: number = 1) => {
    return commitmentList.reduce((total, commitment) => {
      if (commitment.type === 'monthly') {
        return total + (parseFloat(commitment.installmentValue) * monthsMultiplier);
      } else {
        const remainingInstallments = commitment.totalInstallments! - commitment.paidInstallments!;
        const installmentsToCount = Math.min(remainingInstallments, monthsMultiplier);
        return total + (installmentsToCount * parseFloat(commitment.installmentValue));
      }
    }, 0);
  };

  const thisMonthTotal = calculateTotal(thisMonthCommitments, 1);
  const nextTwoMonthsTotal = calculateTotal(nextTwoMonthsCommitments, 2);
  const totalOutstanding = thisMonthTotal + nextTwoMonthsTotal;

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
      
      <CardContent className="space-y-6">
        {/* This Month Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Este Mês</h3>
            <span className="text-sm font-medium text-blue-600">
              {formatCurrency(thisMonthTotal.toString())}
            </span>
          </div>
          
          <div className="space-y-3" data-testid="this-month-commitments">
            {thisMonthCommitments.map((commitment, index) => {
              const isMonthly = commitment.type === 'monthly';
              const remainingInstallments = isMonthly ? null : commitment.totalInstallments! - commitment.paidInstallments!;
              const progressPercent = isMonthly ? 100 : (commitment.paidInstallments! / commitment.totalInstallments!) * 100;

              return (
                <div
                  key={`${commitment.type}-${commitment.id}`}
                  className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  data-testid={`commitment-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(commitment.paymentMethod, commitment.type)}
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {commitment.description}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getPaymentMethodLabel(commitment.paymentMethod, commitment.type)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {commitment.categoryName || 'Sem categoria'}
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      {formatCurrency(commitment.installmentValue)}
                    </span>
                  </div>

                  {!isMonthly && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{commitment.paidInstallments} de {commitment.totalInstallments} pagas</span>
                        <span>{remainingInstallments} restantes</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(progressPercent, 5)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Two Months Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Próximos 2 Meses</h3>
            <span className="text-sm font-medium text-purple-600">
              {formatCurrency(nextTwoMonthsTotal.toString())}
            </span>
          </div>
          
          <div className="space-y-3" data-testid="next-months-commitments">
            {nextTwoMonthsCommitments.map((commitment, index) => {
              const isMonthly = commitment.type === 'monthly';
              const remainingInstallments = isMonthly ? null : commitment.totalInstallments! - commitment.paidInstallments!;

              return (
                <div
                  key={`future-${commitment.type}-${commitment.id}`}
                  className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  data-testid={`future-commitment-${index}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(commitment.paymentMethod, commitment.type)}
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {commitment.description}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getPaymentMethodLabel(commitment.paymentMethod, commitment.type)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {isMonthly 
                        ? `${formatCurrency(commitment.installmentValue)} x 2 meses`
                        : `${Math.min(remainingInstallments!, 2)} parcela${Math.min(remainingInstallments!, 2) > 1 ? 's' : ''} de ${formatCurrency(commitment.installmentValue)}`
                      }
                    </span>
                    <span className="text-sm font-medium text-purple-600">
                      {isMonthly 
                        ? formatCurrency((parseFloat(commitment.installmentValue) * 2).toString())
                        : formatCurrency((Math.min(remainingInstallments!, 2) * parseFloat(commitment.installmentValue)).toString())
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}