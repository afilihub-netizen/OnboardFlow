import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CreditCard, FileText, Calendar, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
  const [expandedCurrentMonth, setExpandedCurrentMonth] = useState(false);
  const [expandedNextMonth, setExpandedNextMonth] = useState(false);

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

  // Get current month and next months dynamically  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get month names in Portuguese
  const getMonthName = (month: number, year: number) => {
    return new Date(year, month).toLocaleDateString('pt-BR', { month: 'long' });
  };
  
  const currentMonthName = getMonthName(currentMonth, currentYear);
  const nextMonthName = getMonthName(currentMonth + 1, currentMonth === 11 ? currentYear + 1 : currentYear);

  const currentMonthCommitments: FutureCommitment[] = [];
  const nextMonthCommitments: FutureCommitment[] = [];

  commitments.forEach(commitment => {
    if (commitment.type === 'monthly') {
      // Fixed expenses repeat monthly - add to both periods
      currentMonthCommitments.push(commitment);
      nextMonthCommitments.push(commitment);
    } else {
      // Installment commitments - check remaining payments
      const remainingInstallments = commitment.totalInstallments! - commitment.paidInstallments!;
      if (remainingInstallments > 0) {
        currentMonthCommitments.push(commitment);
        if (remainingInstallments > 1) {
          nextMonthCommitments.push(commitment);
        }
      }
    }
  });

  const calculateMonthTotal = (commitmentList: FutureCommitment[]) => {
    return commitmentList.reduce((total, commitment) => {
      if (commitment.type === 'monthly') {
        return total + parseFloat(commitment.installmentValue);
      } else {
        // Only count 1 installment per month
        return total + parseFloat(commitment.installmentValue);
      }
    }, 0);
  };

  const currentMonthTotal = calculateMonthTotal(currentMonthCommitments);
  const nextMonthTotal = calculateMonthTotal(nextMonthCommitments);
  const totalOutstanding = currentMonthTotal + nextMonthTotal;

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
      
      <CardContent className="space-y-4">
        {/* Current Month Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{currentMonthName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">
                {formatCurrency(currentMonthTotal.toString())}
              </span>
              {currentMonthCommitments.length > 4 && (
                <button 
                  onClick={() => setExpandedCurrentMonth(!expandedCurrentMonth)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {expandedCurrentMonth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          
          <div className="grid gap-2">
            {(expandedCurrentMonth ? currentMonthCommitments : currentMonthCommitments.slice(0, 4)).map((commitment, index) => (
              <div
                key={`current-${commitment.type}-${commitment.id}`}
                className="flex items-center justify-between p-2 rounded border bg-gray-50 dark:bg-gray-800"
                data-testid={`current-commitment-${index}`}
              >
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(commitment.paymentMethod, commitment.type)}
                  <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                    {commitment.description}
                  </span>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {formatCurrency(commitment.installmentValue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Month Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{nextMonthName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-600">
                {formatCurrency(nextMonthTotal.toString())}
              </span>
              {nextMonthCommitments.length > 4 && (
                <button 
                  onClick={() => setExpandedNextMonth(!expandedNextMonth)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {expandedNextMonth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          
          <div className="grid gap-2">
            {(expandedNextMonth ? nextMonthCommitments : nextMonthCommitments.slice(0, 4)).map((commitment, index) => (
              <div
                key={`next-${commitment.type}-${commitment.id}`}
                className="flex items-center justify-between p-2 rounded border bg-gray-50 dark:bg-gray-800"
                data-testid={`next-commitment-${index}`}
              >
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(commitment.paymentMethod, commitment.type)}
                  <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                    {commitment.description}
                  </span>
                </div>
                <span className="text-sm font-medium text-purple-600">
                  {formatCurrency(commitment.installmentValue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}