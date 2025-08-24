import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, CheckCircle2, X, Calendar, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Goal {
  id: string;
  categoryId: string | null;
  targetAmount: string;
  month: number;
  year: number;
  createdAt: string;
  category?: {
    name: string;
    color: string;
  };
}

export function InvestmentNotifications() {
  const [dismissedGoals, setDismissedGoals] = useState<string[]>([]);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  const isEndOfMonth = currentDate.getDate() > 25; // Consider end of month after day 25

  // Fetch current month goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['/api/budget-goals', currentMonth, currentYear],
    queryFn: async () => {
      const response = await fetch(`/api/budget-goals?month=${currentMonth}&year=${currentYear}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch goals');
      return response.json();
    },
  });

  // Fetch current month financial summary to calculate progress
  const { data: summary } = useQuery({
    queryKey: ['/api/financial-summary', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`, `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`],
    queryFn: async () => {
      const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endDate = new Date(currentYear, currentMonth, 0).toISOString();
      const response = await fetch(`/api/financial-summary?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch financial summary');
      return response.json();
    },
  });

  const calculateInvestmentGoalProgress = (goal: Goal) => {
    const targetAmount = parseFloat(goal.targetAmount);
    
    // Investment goals are savings goals (categoryId is null)
    const currentBalance = summary ? parseFloat(summary.balance) : 0;
    const progress = Math.min(100, (currentBalance / targetAmount) * 100);
    
    return {
      spent: 0,
      remaining: Math.max(0, targetAmount - currentBalance),
      progress,
      isOverBudget: false,
      categoryName: 'Meta de Investimento',
      currentAmount: currentBalance
    };
  };

  const getGoalStatus = (goal: Goal, progressData: any) => {
    const { progress } = progressData;
    
    if (progress >= 100) {
      return {
        status: 'success',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle2,
        message: 'Meta alcançada!'
      };
    } else if (isEndOfMonth && progress < 80) {
      return {
        status: 'danger',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: AlertTriangle,
        message: 'Meta em risco!'
      };
    } else if (progress >= 70) {
      return {
        status: 'warning',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: TrendingUp,
        message: 'No caminho certo'
      };
    } else {
      return {
        status: 'info',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: Target,
        message: 'Acompanhe o progresso'
      };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const dismissGoal = (goalId: string) => {
    setDismissedGoals(prev => [...prev, goalId]);
  };

  if (isLoading) {
    return null;
  }

  // Filter only investment goals (those without categoryId - savings goals)
  const investmentGoals = goals.filter((goal: Goal) => 
    goal.categoryId === null && !dismissedGoals.includes(goal.id)
  );

  if (investmentGoals.length === 0) {
    return null;
  }

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Notificações de Metas de Investimento
          </div>
          <Badge variant="outline" className="text-xs">
            {investmentGoals.length} ativas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {investmentGoals.map((goal: Goal) => {
          const progressData = calculateInvestmentGoalProgress(goal);
          const statusInfo = getGoalStatus(goal, progressData);
          const StatusIcon = statusInfo.icon;

          return (
            <Alert
              key={goal.id}
              className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}
              data-testid={`investment-goal-notification-${goal.id}`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start space-x-3 flex-1">
                  <StatusIcon className={`h-5 w-5 mt-0.5 ${statusInfo.color}`} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${statusInfo.color}`}>
                        {progressData.categoryName}
                      </h4>
                      <span className={`text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.message}
                      </span>
                    </div>
                    
                    <AlertDescription className="text-gray-600 dark:text-gray-400">
                      Meta: {formatCurrency(parseFloat(goal.targetAmount))} | 
                      Atual: {formatCurrency(progressData.currentAmount || 0)} | 
                      Falta: {formatCurrency(progressData.remaining)}
                    </AlertDescription>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className={statusInfo.color}>{Math.round(progressData.progress)}%</span>
                      </div>
                      <Progress 
                        value={progressData.progress} 
                        className="h-2"
                        data-testid={`investment-progress-${goal.id}`}
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissGoal(goal.id)}
                  className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  data-testid={`dismiss-investment-goal-${goal.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          );
        })}
        
        {isEndOfMonth && (
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Final do mês:</strong> Revise suas metas de investimento e planeje para o próximo mês!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}