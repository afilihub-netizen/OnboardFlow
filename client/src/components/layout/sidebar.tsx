import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ui/theme-provider";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Home, ArrowLeftRight, PieChart, FileText, Tags, User, Moon, Sun, Menu, X, Target, Upload, Crown, Building2, Users, Receipt, Package, Briefcase } from "lucide-react";

const getNavigation = (isBusinessAccount: boolean) => {
  const baseNavigation = [
    { name: isBusinessAccount ? 'Painel' : 'Dashboard', href: '/', icon: Home },
    { name: isBusinessAccount ? 'Movimentações' : 'Lançamentos', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Investimentos', href: '/investments', icon: PieChart },
    { name: isBusinessAccount ? 'Orçamentos' : 'Metas', href: '/goals', icon: Target },
    { name: 'Importação', href: '/import', icon: Upload },
    { name: 'Relatórios', href: '/reports', icon: FileText },
    { name: 'Categorias', href: '/categories', icon: Tags },
  ];

  if (isBusinessAccount) {
    return [
      ...baseNavigation,
      { name: 'Fornecedores', href: '/suppliers', icon: Building2 },
      { name: 'Departamentos', href: '/departments', icon: Users },
      { name: 'Notas Fiscais', href: '/invoices', icon: Receipt },
      { name: 'Premium', href: '/subscription', icon: Crown },
    ];
  }

  return [
    ...baseNavigation,
    { name: 'Premium', href: '/subscription', icon: Crown },
  ];
};

export function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { isBusinessAccount } = useBusinessTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const navigation = getNavigation(isBusinessAccount);

  // Mutation to toggle business mode
  const toggleBusinessModeMutation = useMutation({
    mutationFn: async () => {
      const newAccountType = isBusinessAccount ? 'individual' : 'business';
      const response = await apiRequest("PATCH", "/api/user/profile", {
        accountType: newAccountType
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isBusinessAccount ? "Modo Individual ativado" : "Modo Empresarial ativado",
        description: isBusinessAccount 
          ? "Você está agora no sistema pessoal/familiar." 
          : "Você está agora no sistema empresarial.",
      });
      // Invalidate user data to refresh the interface
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar modo do sistema.",
        variant: "destructive",
      });
    },
  });

  // Get current month dates
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Fetch budget goals
  const { data: budgetGoals } = useQuery({
    queryKey: ['/api/budget-goals'],
    queryFn: async () => {
      const response = await fetch('/api/budget-goals', {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch transactions for the current month to calculate spending
  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: async ({ queryKey }) => {
      const [, startDate, endDate] = queryKey;
      const response = await fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Calculate monthly savings goal progress
  const calculateMonthlySavings = () => {
    if (!budgetGoals || !transactions) {
      return { savedAmount: 0, totalGoal: 0, percentage: 0 };
    }

    // Filter active goals and calculate total budget
    const activeGoals = budgetGoals.filter((goal: any) => goal.isActive);
    const totalBudget = activeGoals.reduce((sum: number, goal: any) => sum + parseFloat(goal.targetAmount), 0);
    
    // Calculate total spent this month
    const totalSpent = transactions
      .filter((transaction: any) => transaction.type === 'expense')
      .reduce((sum: number, transaction: any) => sum + parseFloat(transaction.amount), 0);

    // Savings = Budget - Spent (assuming budget includes savings goal)
    const savedAmount = Math.max(0, totalBudget - totalSpent);
    const totalGoal = totalBudget;
    const percentage = totalGoal > 0 ? Math.min(100, (savedAmount / totalGoal) * 100) : 0;

    return { savedAmount, totalGoal, percentage };
  };

  const savingsData = calculateMonthlySavings();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
        data-testid="button-mobile-menu"
      >
        {isOpen ? <X className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
      </button>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-64 shadow-lg border-r h-screen flex flex-col transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isBusinessAccount 
          ? "bg-gradient-to-b from-white to-slate-50 border-slate-300" 
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      )}>
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isBusinessAccount 
                ? "bg-gradient-to-r from-slate-700 to-slate-800" 
                : "bg-gradient-to-r from-blue-500 to-blue-600"
            )}>
              <TrendingUp className="text-white text-lg" />
            </div>
            <div>
              <h1 className={cn(
                "text-xl font-bold",
                isBusinessAccount ? "text-slate-800" : "text-gray-900 dark:text-white"
              )}>
                FinanceFlow
              </h1>
              {isBusinessAccount && (
                <span className="text-xs text-slate-600 font-medium">EMPRESARIAL</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-8">
          <div className="px-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-item",
                    isActive && "active",
                    item.name === "Premium" && "premium-nav-item"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className={cn(
                    "w-5 h-5 sidebar-icon", 
                    isActive ? "sidebar-icon-active" : "",
                    item.name === "Premium" ? "text-yellow-500" : "text-gray-600 dark:text-gray-300"
                  )} />
                  <span className={item.name === "Premium" ? "font-semibold text-yellow-600 dark:text-yellow-500" : ""}>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className="px-6 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Link
                href="/profile"
                className={cn(
                  "sidebar-item",
                  location === "/profile" && "active"
                )}
                data-testid="nav-profile"
                onClick={() => setIsOpen(false)}
              >
                <User className={cn("w-5 h-5 sidebar-icon", location === "/profile" ? "sidebar-icon-active" : "text-gray-600 dark:text-gray-300")} />
                <span>Perfil</span>
              </Link>
              
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="sidebar-item w-full text-left"
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 sidebar-icon text-gray-600 dark:text-gray-300" /> : <Moon className="w-5 h-5 sidebar-icon text-gray-600 dark:text-gray-300" />}
                <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
              </button>

              <button
                onClick={() => toggleBusinessModeMutation.mutate()}
                className="sidebar-item w-full text-left"
                data-testid="button-business-mode-toggle"
                disabled={toggleBusinessModeMutation.isPending}
              >
                <Briefcase className={cn(
                  "w-5 h-5 sidebar-icon",
                  isBusinessAccount ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"
                )} />
                <span className={isBusinessAccount ? "text-blue-600 dark:text-blue-400 font-medium" : ""}>
                  {toggleBusinessModeMutation.isPending ? 'Alterando...' : 
                   isBusinessAccount ? "Modo Individual" : "Modo Empresarial"}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Monthly Goal Widget */}
        <div className="p-6">
          <Link href="/goals">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white cursor-pointer hover:from-green-600 hover:to-green-700 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Meta Mensal</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  savingsData.percentage >= 80 ? 'bg-green-300' : savingsData.percentage >= 50 ? 'bg-yellow-300' : 'bg-red-300'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
              <div className="text-xs mb-2">
                Economia: {formatCurrency(savingsData.savedAmount)} / {formatCurrency(savingsData.totalGoal)}
              </div>
              <div className="w-full bg-green-400 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300" 
                  style={{ width: `${Math.min(100, savingsData.percentage)}%` }}
                ></div>
              </div>
              {savingsData.totalGoal === 0 && (
                <div className="text-xs mt-1 opacity-80">
                  Configure suas metas
                </div>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}