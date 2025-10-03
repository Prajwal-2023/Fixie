import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types/enhanced-types';
import { toast } from 'sonner';

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'user-1',
    title: 'New Ticket Assigned',
    message: 'Ticket #12345 has been assigned to you: "Laptop screen flickering"',
    type: 'info',
    is_read: false,
    action_url: '/tickets/12345',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: 'user-1',
    title: 'Ticket Resolution Overdue',
    message: 'Ticket #12340 is overdue for resolution. SLA deadline passed 2 hours ago.',
    type: 'warning',
    is_read: false,
    action_url: '/tickets/12340',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

// Notification Hook for easy integration
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // In production, fetch from Supabase
    setNotifications(mockNotifications);
  }, [userId]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.is_read).length);
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast
    toast(newNotification.title, {
      description: newNotification.message,
    });
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
  };
}
