import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Bot } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm" data-testid="page-subtitle">
              {subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* AI Assistant Button */}
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              data-testid="button-ai-assistant"
            >
              <Bot className="w-4 h-4 mr-2" />
              Assistente IA
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.profileImageUrl} alt="Profile" />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white" data-testid="user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email || 'Usuário'
                  }
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400" data-testid="user-account-type">
                  {user?.accountType === 'family' ? 'Conta Familiar' : 'Conta Individual'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
