import { supabase } from './supabase';
import { AuthService } from './authService';

export interface Notification {
  id: string;
  userId: string;
  type: 'review_reply' | 'favorite_update' | 'recommendation' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export class NotificationService {
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase getUserNotifications error', error);
        return [];
      }
      return (data || []).map(this.mapFromDb);
    } catch (e) {
      console.error('❌ getUserNotifications error', e);
      return [];
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) {
        console.error('❌ Supabase getUnreadCount error', error);
        return 0;
      }
      return count || 0;
    } catch (e) {
      console.error('❌ getUnreadCount error', e);
      return 0;
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('❌ markAsRead error', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('❌ markAsRead error', e);
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) {
        console.error('❌ markAllAsRead error', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('❌ markAllAsRead error', e);
      return false;
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('❌ deleteNotification error', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('❌ deleteNotification error', e);
      return false;
    }
  }

  static async createNotification(params: {
    userId: string;
    type: 'review_reply' | 'favorite_update' | 'recommendation' | 'system';
    title: string;
    message: string;
    data?: any;
  }): Promise<boolean> {
    try {
      const payload = {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || null,
        read: false,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) {
        console.error('❌ createNotification error', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('❌ createNotification error', e);
      return false;
    }
  }

  private static mapFromDb(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      read: row.read,
      createdAt: row.created_at,
    };
  }
}
