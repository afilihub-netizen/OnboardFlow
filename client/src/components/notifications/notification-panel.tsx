import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, AlertCircle, CheckCircle, Clock, TrendingUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Notification } from "@shared/schema";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'budget_limit':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'goal_achieved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'payment_reminder':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'investment_milestone':
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    case 'ai_insight':
      return <Brain className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 border-red-500 dark:bg-red-900/20 dark:border-red-400';
    case 'high':
      return 'bg-orange-100 border-orange-500 dark:bg-orange-900/20 dark:border-orange-400';
    case 'medium':
      return 'bg-blue-100 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400';
    default:
      return 'bg-gray-100 border-gray-500 dark:bg-gray-900/20 dark:border-gray-400';
  }
};

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications?limit=50');
      return response;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications/unread-count');
      return response;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];
  const unreadCount = unreadData?.count || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PUT', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      setIsOpen(false);
      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-96" data-testid="panel-notifications">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-3">
                {notifications.map((notification: Notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                      !notification.isRead ? 'bg-muted/50' : ''
                    } ${getPriorityColor(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id || '');
                              }}
                              data-testid={`button-mark-read-${notification.id}`}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id || '');
                            }}
                            data-testid={`button-delete-${notification.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {notification.isActionRequired && (
                        <div className="mt-3">
                          <Badge variant="outline" className="text-xs">
                            Ação Requerida
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}