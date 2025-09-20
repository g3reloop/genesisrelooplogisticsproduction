import { supabase } from '../lib/supabase';
import { Notification, NotificationType, User } from '../types';

class NotificationService {
  private vapidPublicKey: string;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    this.initializeServiceWorker();
  }

  // Initialize service worker for push notifications
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      if (!this.registration) {
        throw new Error('Service Worker not registered');
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      // Save subscription to database
      await this.savePushSubscription(userId, subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
    try {
      if (!this.registration) {
        return false;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removePushSubscription(userId, subscription);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Send push notification
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title,
          body,
          data,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Create notification
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {}
  ): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Send push notification if user has subscribed
      await this.sendPushNotification(userId, title, message, data);

      return notification;
    } catch (error: any) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ data: Notification[]; total: number }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Send email notification
  async sendEmailNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          userId,
          type,
          title,
          message,
          data,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  // Send SMS notification
  async sendSMSNotification(
    userId: string,
    message: string,
    data: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          userId,
          message,
          data,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return false;
    }
  }

  // Job-specific notifications
  async notifyJobCreated(jobId: string, supplierName: string): Promise<void> {
    try {
      // Get all online drivers
      const { data: drivers } = await supabase
        .from('driver_locations')
        .select('driver_id')
        .eq('is_online', true);

      if (drivers) {
        for (const driver of drivers) {
          await this.createNotification(
            driver.driver_id,
            NotificationType.JOB_UPDATE,
            'New Job Available',
            `A new job has been posted by ${supplierName}`,
            { jobId, type: 'job_created' }
          );
        }
      }
    } catch (error) {
      console.error('Error notifying job created:', error);
    }
  }

  async notifyJobAccepted(jobId: string, driverName: string, supplierId: string): Promise<void> {
    try {
      await this.createNotification(
        supplierId,
        NotificationType.JOB_UPDATE,
        'Job Accepted',
        `Your job has been accepted by ${driverName}`,
        { jobId, type: 'job_accepted' }
      );
    } catch (error) {
      console.error('Error notifying job accepted:', error);
    }
  }

  async notifyJobCompleted(jobId: string, supplierId: string, driverId: string): Promise<void> {
    try {
      // Notify supplier
      await this.createNotification(
        supplierId,
        NotificationType.JOB_UPDATE,
        'Job Completed',
        'Your job has been completed successfully',
        { jobId, type: 'job_completed' }
      );

      // Notify driver
      await this.createNotification(
        driverId,
        NotificationType.EARNINGS,
        'Job Completed',
        'You have successfully completed the job and earned Genesis Points',
        { jobId, type: 'job_completed' }
      );
    } catch (error) {
      console.error('Error notifying job completed:', error);
    }
  }

  async notifyEarningsUpdate(userId: string, amount: number, description: string): Promise<void> {
    try {
      await this.createNotification(
        userId,
        NotificationType.EARNINGS,
        'Earnings Update',
        `You have earned ${amount} Genesis Points: ${description}`,
        { amount, type: 'earnings_update' }
      );
    } catch (error) {
      console.error('Error notifying earnings update:', error);
    }
  }

  // Save push subscription to database
  private async savePushSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(`Failed to save push subscription: ${error.message}`);
    }
  }

  // Remove push subscription from database
  private async removePushSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('subscription', JSON.stringify(subscription));

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(`Failed to remove push subscription: ${error.message}`);
    }
  }

  // Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Get notification permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
