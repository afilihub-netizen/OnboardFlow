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
    <header className={`shadow-sm border-b ${
      isBusinessAccount 
        ? 'business-header bg-gradient-to-r from-slate-700 to-slate-800 text-white border-slate-600' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="px-6 py-4 ml-0 md:ml-0 pl-16 md:pl-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-bold ${
                isBusinessAccount ? 'text-white' : 'text-gray-900 dark:text-white'
              }`} data-testid="page-title">
                {isBusinessAccount && companyName ? companyName : title}
              </h2>
              {isBusinessAccount && (
                <Badge className={getAccountBadgeColor()}>
                  <Building2 className="w-3 h-3 mr-1" />
                  Empresarial
                </Badge>
              )}
            </div>
            <p className={`text-sm ${
              isBusinessAccount ? 'text-slate-200' : 'text-gray-600 dark:text-gray-400'
            }`} data-testid="page-subtitle">
              {isBusinessAccount && industry ? `${industry} • ${subtitle}` : subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationPanel />
            
            {/* AI Assistant Button */}
            <Button 
              className={`transition-all duration-200 ${
                isBusinessAccount 
                  ? 'bg-slate-600 hover:bg-slate-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              }`}
              data-testid="button-ai-assistant"
            >
              <Bot className="w-4 h-4 mr-2" />
              {isBusinessAccount ? 'Consultoria IA' : 'Assistente IA'}
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.profileImageUrl} alt="Profile" />
                <AvatarFallback className={
                  isBusinessAccount 
                    ? 'bg-slate-200 text-slate-800' 
                    : 'bg-blue-100 text-blue-600'
                }>
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="hidden md:block">
                <p className={`text-sm font-medium ${
                  isBusinessAccount ? 'text-white' : 'text-gray-900 dark:text-white'
                }`} data-testid="user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email || 'Usuário'
                  }
                </p>
                <div className="flex items-center gap-1">
                  {getAccountIcon()}
                  <p className={`text-xs ${
                    isBusinessAccount ? 'text-slate-200' : 'text-gray-600 dark:text-gray-400'
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
