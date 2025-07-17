import { notification } from 'antd';

/**
 * Notification service that provides a centralized way to show notifications
 * This avoids the antd static function context warning by using a service pattern
 */
class NotificationService {
  private static instance: NotificationService;
  private api: any = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Set the notification API from App context
  setNotificationApi(api: any) {
    this.api = api;
  }

  // Show error notification
  error(config: { message: string; description?: string }) {
    if (this.api) {
      this.api.error(config);
    } else {
      // Fallback to static API if App context not available
      notification.error(config);
    }
  }

  // Show success notification
  success(config: { message: string; description?: string }) {
    if (this.api) {
      this.api.success(config);
    } else {
      notification.success(config);
    }
  }

  // Show info notification
  info(config: { message: string; description?: string }) {
    if (this.api) {
      this.api.info(config);
    } else {
      notification.info(config);
    }
  }

  // Show warning notification
  warning(config: { message: string; description?: string }) {
    if (this.api) {
      this.api.warning(config);
    } else {
      notification.warning(config);
    }
  }
}

export const notificationService = NotificationService.getInstance();