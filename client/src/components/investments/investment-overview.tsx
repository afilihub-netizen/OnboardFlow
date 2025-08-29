import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Trophy, Star, Zap, Crown, Medal, Award, Flame, Gift } from "lucide-react";
import { InvestmentGoals } from "./investment-goals";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function InvestmentOverview() {

  const { data: investments, isLoading } = useQuery({
    queryKey: ['/api/investments'],
    queryFn: async () => {
      const response = await fetch('/api/investments', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch investments');
      return response.json();
    },
  });

  // Sistema de gamificação
  const getInvestorLevel = (totalValue: number, investmentCount: number) => {
    if (totalValue === 0) {
      return { name: 'Iniciante', icon: Star, color: 'gray', progress: 0, nextLevel: 'Novato', requirement: 'Faça seu primeiro investimento' };
    }
    if (totalValue < 1000 || investmentCount < 3) {
      return { name: 'Novato', icon: Zap, color: 'blue', progress: Math.min((totalValue / 1000) * 100, 100), nextLevel: 'Explorador', requirement: 'R$ 1.000 investidos + 3 ativos' };
    }
    if (totalValue < 5000 || investmentCount < 5) {
      return { name: 'Explorador', icon: Target, color: 'green', progress: Math.min(((totalValue - 1000) / 4000) * 100, 100), nextLevel: 'Estrategista', requirement: 'R$ 5.000 investidos + 5 ativos' };
    }
    if (totalValue < 15000 || investmentCount < 8) {
      return { name: 'Estrategista', icon: Trophy, color: 'purple', progress: Math.min(((totalValue - 5000) / 10000) * 100, 100), nextLevel: 'Mestre', requirement: 'R$ 15.000 investidos + 8 ativos' };
    }
    return { name: 'Mestre', icon: Crown, color: 'yellow', progress: 100, nextLevel: null, requirement: 'Nível máximo atingido!' };
  };

  const getAchievements = (totalValue: number, investmentCount: number, totalGain: number) => {
    const achievements = [
      {
        id: 'first-investment',
        title: 'Primeiro Passo',
        description: 'Realizou o primeiro investimento',
        icon: Medal,
        unlocked: investmentCount > 0,
        color: 'bg-blue-500'
      },
      {
        id: 'diversified',
        title: 'Diversificado',
        description: 'Possui 3 ou mais investimentos',
        icon: Award,
        unlocked: investmentCount >= 3,
        color: 'bg-green-500'
      },
      {
        id: 'thousand-club',
        title: 'Clube dos Mil',
        description: 'Investiu mais de R$ 1.000',
        icon: Star,
        unlocked: totalValue >= 1000,
        color: 'bg-purple-500'
      },
      {
        id: 'profitable',
        title: 'Lucrativo',
        description: 'Teve ganhos positivos',
        icon: TrendingUp,
        unlocked: totalGain > 0,
        color: 'bg-emerald-500'
      },
      {
        id: 'five-thousand',
        title: 'Investidor Sério',
        description: 'Patrimônio de R$ 5.000+',
        icon: Trophy,
        unlocked: totalValue >= 5000,
        color: 'bg-orange-500'
      },
      {
        id: 'master-investor',
        title: 'Mestre Investidor',
        description: 'Patrimônio de R$ 15.000+',
        icon: Crown,
        unlocked: totalValue >= 15000,
        color: 'bg-yellow-500'
      }
    ];
    return achievements;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateTotalValue = () => {
    if (!investments) return 0;
    return investments.reduce((total: number, investment: any) => {
      return total + parseFloat(investment.currentAmount);
    }, 0);
  };

  const calculateTotalGain = () => {
    if (!investments) return { amount: 0, percentage: 0 };
    
    const totalCurrent = calculateTotalValue();
    const totalInitial = investments.reduce((total: number, investment: any) => {
      return total + parseFloat(investment.initialAmount);
    }, 0);
    
    const gain = totalCurrent - totalInitial;
    const percentage = totalInitial > 0 ? (gain / totalInitial) * 100 : 0;
    
    return { amount: gain, percentage };
  };

  const totalValue = calculateTotalValue();
  const gainData = calculateTotalGain();
  const totalGain = gainData.amount;
  const gainPercentage = gainData.percentage;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>🎮 Evolução Gamificada</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const investmentCount = investments?.length || 0;
  const level = getInvestorLevel(totalValue, investmentCount);
  const achievements = getAchievements(totalValue, investmentCount, totalGain);
  const unlockedAchievements = achievements.filter((a: any) => a.unlocked);
  const nextAchievement = achievements.find((a: any) => !a.unlocked);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎮 Evolução Gamificada
              <Badge variant="outline" className="ml-auto">
                {unlockedAchievements.length}/{achievements.length} conquistas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nível do Investidor */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-xl border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-${level.color}-100 dark:bg-${level.color}-900 rounded-full flex items-center justify-center`}>
                    <level.icon className={`w-6 h-6 text-${level.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{level.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {level.nextLevel ? `Próximo: ${level.nextLevel}` : 'Nível máximo!'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalValue)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {investmentCount} {investmentCount === 1 ? 'ativo' : 'ativos'}
                  </p>
                </div>
              </div>
              
              {level.nextLevel && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progresso para {level.nextLevel}</span>
                    <span className="font-medium">{Math.round(level.progress)}%</span>
                  </div>
                  <Progress value={level.progress} className="h-3" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    📋 {level.requirement}
                  </p>
                </div>
              )}
            </div>

            {/* Conquistas */}
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🏆 Conquistas
                {nextAchievement && (
                  <Badge variant="secondary" className="text-xs">
                    Próxima: {nextAchievement.title}
                  </Badge>
                )}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`relative p-4 rounded-lg border transition-all duration-300 ${
                      achievement.unlocked 
                        ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-800 shadow-lg transform scale-105' 
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    {achievement.unlocked && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`w-10 h-10 ${achievement.unlocked ? achievement.color : 'bg-gray-300'} rounded-lg flex items-center justify-center mb-3`}>
                      <achievement.icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <h5 className="font-medium text-sm mb-1">{achievement.title}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {(!investments || investments.length === 0) && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100">🚀 Comece sua jornada!</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">Faça seu primeiro investimento e desbloqueie conquistas</p>
                  </div>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  💡 Vá para a seção "Portfólio" abaixo e adicione seu primeiro investimento para começar a ganhar XP e medalhas!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        {/* Investment Summary */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Investido</p>
                <p className="text-2xl font-bold" data-testid="total-investment-value">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-lg p-3">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-purple-100 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span data-testid="investment-gain">
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({gainPercentage.toFixed(1)}%) este ano
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Investment Goal */}
        <InvestmentGoals />
      </div>
    </div>
  );
}
