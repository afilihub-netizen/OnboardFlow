import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Bot, Building2, Users, User } from "lucide-react";
import NotificationPanel from "@/components/notifications/notification-panel";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const { isBusinessAccount, companyName, industry } = useBusinessTheme();

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getAccountIcon = () => {
    switch (user?.accountType) {
      case 'business':
        return <Building2 className="w-4 h-4" />;
      case 'family':
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getAccountBadgeColor = () => {
    switch (user?.accountType) {
      case 'business':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'family':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <header className={`backdrop-blur-xl shadow-lg border-b sticky top-0 z-40 ${
      isBusinessAccount 
        ? 'business-header bg-gradient-to-r from-slate-700/90 to-slate-800/90 text-white border-slate-600/50' 
        : 'bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60'
    }`}>
      <div className="px-6 py-5 ml-0 md:ml-0 pl-16 md:pl-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h2 className={`text-3xl font-bold bg-gradient-to-r ${
                isBusinessAccount 
                  ? 'from-white to-slate-200 bg-clip-text text-transparent' 
                  : 'from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent'
              }`} data-testid="page-title">
                {isBusinessAccount && companyName ? companyName : title}
              </h2>
              {isBusinessAccount && (
                <Badge className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30 transition-all duration-200">
                  <Building2 className="w-3 h-3 mr-1" />
                  Empresarial
                </Badge>
              )}
            </div>
            <p className={`text-sm font-medium ${
              isBusinessAccount ? 'text-slate-300' : 'text-gray-600 dark:text-gray-400'
            }`} data-testid="page-subtitle">
              {isBusinessAccount && industry ? `${industry} • ${subtitle}` : subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <NotificationPanel />
            
            {/* AI Assistant Button */}
            <Button 
              className={`modern-button-primary rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${
                isBusinessAccount 
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-slate-500'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              }`}
              data-testid="button-ai-assistant"
            >
              <Bot className="w-4 h-4 mr-2" />
              {isBusinessAccount ? 'Consultoria IA' : 'Assistente IA'}
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-gray-800/30 backdrop-blur border border-white/20 dark:border-gray-600/30">
              <Avatar className="ring-2 ring-white/30 dark:ring-gray-400/30 shadow-lg">
                <AvatarImage src={user?.profileImageUrl} alt="Profile" />
                <AvatarFallback className={`font-bold ${
                  isBusinessAccount 
                    ? 'bg-gradient-to-br from-white to-slate-100 text-slate-700' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                }`}>
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="hidden md:block">
                <p className={`text-sm font-semibold ${
                  isBusinessAccount ? 'text-white' : 'text-gray-900 dark:text-white'
                }`} data-testid="user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email || 'Usuário'
                  }
                </p>
                <div className="flex items-center gap-1">
                  {getAccountIcon()}
                  <p className={`text-xs font-medium ${
                    isBusinessAccount ? 'text-slate-300' : 'text-gray-600 dark:text-gray-400'
                  }`} data-testid="user-account-type">
                    {user?.accountType === 'business' ? 'Conta Empresarial' : 
                     user?.accountType === 'family' ? 'Conta Familiar' : 'Conta Individual'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
