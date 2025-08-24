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

  const { data: commitments = [], isLoading } = useQuery({
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
  const thirdMonthName = getMonthName(currentMonth + 2, currentMonth >= 10 ? currentYear + 1 : currentYear);

  const currentMonthCommitments: FutureCommitment[] = [];
  const nextMonthCommitments: FutureCommitment[] = [];
  const thirdMonthCommitments: FutureCommitment[] = [];

  commitments.forEach(commitment => {
    if (commitment.type === 'monthly') {
      // Fixed expenses repeat monthly - add to all periods
      currentMonthCommitments.push(commitment);
      nextMonthCommitments.push(commitment);
      thirdMonthCommitments.push(commitment);
    } else {
      // Installment commitments - check remaining payments
      const remainingInstallments = commitment.totalInstallments! - commitment.paidInstallments!;
      if (remainingInstallments > 0) {
        currentMonthCommitments.push(commitment);
        if (remainingInstallments > 1) {
          nextMonthCommitments.push(commitment);
          if (remainingInstallments > 2) {
            thirdMonthCommitments.push(commitment);
          }
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
  const thirdMonthTotal = calculateMonthTotal(thirdMonthCommitments);
  const totalOutstanding = currentMonthTotal + nextMonthTotal + thirdMonthTotal;

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
        {/* Current Month */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{currentMonthName}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{currentMonthCommitments.length} compromisso{currentMonthCommitments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(currentMonthTotal.toString())}
            </p>
          </div>
        </div>

        {/* Next Month */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{nextMonthName}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{nextMonthCommitments.length} compromisso{nextMonthCommitments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-purple-600">
              {formatCurrency(nextMonthTotal.toString())}
            </p>
          </div>
        </div>

        {/* Third Month */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{thirdMonthName}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{thirdMonthCommitments.length} compromisso{thirdMonthCommitments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(thirdMonthTotal.toString())}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}