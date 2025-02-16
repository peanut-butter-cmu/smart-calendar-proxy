export enum NotificationDeliveryType {
  IN_APP = 'in_app',
  EMAIL_REGISTERED = 'email_registered',
  EMAIL_UNREGISTERED = 'email_unregistered',
  FCM = 'fcm'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, any>;
}
