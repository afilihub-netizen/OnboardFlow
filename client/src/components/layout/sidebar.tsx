import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ui/theme-provider";
import { TrendingUp, Home, ArrowLeftRight, PieChart, FileText, Tags, User, Moon, Sun, Menu, X, Target, Upload } from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Lançamentos', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Investimentos', href: '/investments', icon: PieChart },
  { name: 'Metas', href: '/goals', icon: Target },
  { name: 'Importação', href: '/import', icon: Upload },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Categorias', href: '/categories', icon: Tags },
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

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
        "fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">FinanceFlow</h1>
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
                    isActive && "active"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-600 dark:text-gray-300")} />
                  <span>{item.name}</span>
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
                <User className={cn("w-5 h-5", location === "/profile" ? "text-white" : "text-gray-600 dark:text-gray-300")} />
                <span>Perfil</span>
              </Link>
              
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="sidebar-item w-full text-left"
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Monthly Goal Widget */}
        <div className="p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Meta Mensal</span>
              <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="text-xs mb-2">Economia: R$ 1.240 / R$ 2.000</div>
            <div className="w-full bg-green-400 rounded-full h-2">
              <div className="bg-white rounded-full h-2" style={{ width: '62%' }}></div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}