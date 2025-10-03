import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  Mail,
  Filter
} from 'lucide-react';
import { Notification } from '@/types/enhanced-types';
import { toast } from 'sonner';
import { realtimeService } from '@/services/realtime-service';

interface NotificationSystemProps {
  userId?: string;
  className?: string;
}

// Mock notifications - in production, fetch from Supabase
const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'user-1',
    title: 'New Ticket Assigned',
    message: 'Ticket #12345 has been assigned to you: "Laptop screen flickering"',
    type: 'info',
    is_read: false,
    action_url: '/tickets/12345',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  },
  {
    id: '2',
    user_id: 'user-1',
    title: 'Ticket Resolution Overdue',
    message: 'Ticket #12340 is overdue for resolution. SLA deadline passed 2 hours ago.',
    type: 'warning',
    is_read: false,
    action_url: '/tickets/12340',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    user_id: 'user-1',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance window: Tonight 11 PM - 2 AM. Some services may be unavailable.',
    type: 'warning',
    is_read: true,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: '4',
    user_id: 'user-1',
    title: 'Ticket Resolved Successfully',
    message: 'Ticket #12338 "Password reset request" has been marked as resolved.',
    type: 'success',
    is_read: true,
    action_url: '/tickets/12338',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: '5',
    user_id: 'user-1',
    title: 'Knowledge Base Article Updated',
    message: 'Article "Password Reset Guidelines" has been updated with new security requirements.',
    type: 'info',
    is_read: true,
    action_url: '/knowledge-base/password-reset',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
];

export function NotificationSystem({ userId, className }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(false);

  // Initialize notifications
  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  // Set up real-time notifications
  useEffect(() => {
    const handleNotification = (event: any) => {
      if (event.type === 'notification') {
        const newNotification: Notification = event.data;
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast notification
        toast(newNotification.title, {
          description: newNotification.message,
          action: newNotification.action_url ? {
            label: 'View',
            onClick: () => window.location.href = newNotification.action_url!,
          } : undefined,
        });
      }
    };

    realtimeService.subscribe('notification', handleNotification);

    return () => {
      realtimeService.unsubscribe('notification', handleNotification);
    };
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
  }, []);

  const markAsUnread = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: false } : n
      )
    );
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    toast.success('All notifications cleared');
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filters and Actions */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="all">All ({notifications.length})</option>
                  <option value="unread">Unread ({unreadCount})</option>
                  <option value="read">Read ({notifications.length - unreadCount})</option>
                </select>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-6 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs h-6 px-2 text-red-600"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium truncate">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.is_read ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 p-0 hover:bg-green-100"
                                  title="Mark as read"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsUnread(notification.id)}
                                  className="h-6 w-6 p-0 hover:bg-blue-100"
                                  title="Mark as unread"
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                                title="Delete notification"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            
                            {notification.action_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.location.href = notification.action_url!;
                                  markAsRead(notification.id);
                                }}
                                className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700"
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


