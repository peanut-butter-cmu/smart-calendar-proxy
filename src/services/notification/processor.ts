import { Notification } from '../../models/Notification.entity.js';
import { templates } from './templates.js';
import { NotificationDeliveryType, NotificationStatus } from './types.js';

export class MockNotificationProcessor {
    private replaceTemplateVars(text: string, data: Record<string, any>): string {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (key === 'meetingTime' && data[key]) {
                // Format date for better readability
                return new Date(data[key]).toLocaleString();
            }
            return data[key]?.toString() || match;
        });
    }

    async processNotification(notification: Notification): Promise<boolean> {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const template = templates[notification.type][notification.deliveryType];
            const processedTemplate = {
                title: this.replaceTemplateVars(template.title, notification.data),
                body: this.replaceTemplateVars(template.body, notification.data),
                data: template.data ? JSON.parse(
                    this.replaceTemplateVars(JSON.stringify(template.data), notification.data)
                ) : undefined
            };

            // Update notification metadata
            notification.deliveryMetadata = {
                ...notification.deliveryMetadata,
                lastAttempt: new Date()
            };

            switch (notification.deliveryType) {
                case NotificationDeliveryType.EMAIL_REGISTERED:
                case NotificationDeliveryType.EMAIL_UNREGISTERED:
                    console.log(`[MOCK EMAIL] To: ${notification.deliveryMetadata.emailTo}`);
                    console.log(`Type: ${notification.deliveryType}`);
                    console.log(`Subject: ${processedTemplate.title}`);
                    console.log(`Body: ${processedTemplate.body}`);
                    break;

                case NotificationDeliveryType.FCM:
                    console.log(`[MOCK FCM] Token: ${notification.deliveryMetadata.fcmToken}`);
                    console.log(`Title: ${processedTemplate.title}`);
                    console.log(`Body: ${processedTemplate.body}`);
                    console.log(`Data: ${JSON.stringify(processedTemplate.data)}`);
                    break;

                case NotificationDeliveryType.IN_APP:
                    console.log(`[MOCK IN-APP] User: ${notification.user.id}`);
                    console.log(`Title: ${processedTemplate.title}`);
                    console.log(`Body: ${processedTemplate.body}`);
                    break;

                default:
                    throw new Error(`Unsupported delivery type: ${notification.deliveryType}`);
            }

            // Update notification status
            notification.status = NotificationStatus.SENT;
            return true;
        } catch (error) {
            // Update notification metadata with error
            notification.deliveryMetadata = {
                ...notification.deliveryMetadata,
                lastAttempt: new Date(),
                errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
            };
            notification.status = NotificationStatus.FAILED;
            notification.retryCount++;
            return false;
        }
    }

    async processBatch(notifications: Notification[]): Promise<void> {
        // Process notifications in parallel with a concurrency limit
        const concurrencyLimit = 5;
        for (let i = 0; i < notifications.length; i += concurrencyLimit) {
            const batch = notifications.slice(i, i + concurrencyLimit);
            await Promise.all(batch.map(notification => this.processNotification(notification)));
            // Add a small delay between batches to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}
