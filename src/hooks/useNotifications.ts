import { useState, useEffect } from 'react';
import { NotificationService, Notification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [userNotifications, count] = await Promise.all([
        NotificationService.getUserNotifications(user.id),
        NotificationService.getUnreadCount(user.id)
      ]);
      
      setNotifications(userNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Errore caricamento notifiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Errore mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const success = await NotificationService.markAllAsRead(user.id);
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Errore mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const success = await NotificationService.deleteNotification(notificationId);
      if (success) {
        // Se la notifica era non letta, decrementa il contatore
        const notif = notifications.find(n => n.id === notificationId);
        if (notif && !notif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('❌ Errore eliminazione notifica:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
