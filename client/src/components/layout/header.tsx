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
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-6 py-4 ml-0 md:ml-0 pl-16 md:pl-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationPanel />
            
            {/* User Profile */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl} alt="Profile" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName || "Usuário"}
              </span>
              
              {isBusinessAccount && (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                  <Building2 className="w-3 h-3 mr-1" />
                  MODO EMPRESARIAL
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
