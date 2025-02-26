import { NotificationType } from '../../models/notification.entity.js';
import { NotificationDeliveryType, NotificationTemplate } from './types.js';

export const templates: Record<NotificationType, Record<NotificationDeliveryType, NotificationTemplate>> = {
    [NotificationType.GROUP_INVITE]: {
        in_app: {
            title: 'New Group Invite',
            body: 'You have been invited to join {{eventName}}'
        },
        email_registered: {
            title: 'Smart Calendar - New Group Invite',
            body: `
                <h2>You've Been Invited!</h2>
                <p>You have been invited to join the event: {{eventName}}</p>
                <p>Log in to your Smart Calendar account to respond to the invitation.</p>
            `
        },
        email_unregistered: {
            title: 'Smart Calendar - New Group Invite',
            body: `
                <h2>You've Been Invited!</h2>
                <p>You have been invited to join the event: {{eventName}}</p>
                <p>Create your Smart Calendar account to manage your events and respond to invitations.</p>
                <p>Sign up now: ${process.env.APP_BASE}</p>
            `
        },
        fcm: {
            title: 'Smart Calendar',
            body: 'New group invite for {{eventName}}',
            data: {
                type: 'GROUP_INVITE',
                eventId: '{{eventId}}'
            }
        }
    },
    [NotificationType.INVITE_ACCEPTED]: {
        in_app: {
            title: 'Invite Accepted',
            body: '{{memberEmail}} has accepted your invitation to {{eventName}}'
        },
        email_registered: {
            title: 'Smart Calendar - Invite Accepted',
            body: `
                <h2>Invite Accepted</h2>
                <p>{{memberEmail}} has accepted your invitation to {{eventName}}.</p>
                <p>Log in to your Smart Calendar account to view the event details.</p>
            `
        },
        email_unregistered: {
            title: 'Smart Calendar - Invite Accepted',
            body: `
                <h2>Invite Accepted</h2>
                <p>{{memberEmail}} has accepted your invitation to {{eventName}}.</p>
                <p>Create your Smart Calendar account to manage your events.</p>
                <p>Sign up now: ${process.env.APP_BASE}</p>
            `
        },
        fcm: {
            title: 'Smart Calendar',
            body: '{{memberEmail}} accepted invite to {{eventName}}',
            data: {
                type: 'INVITE_ACCEPTED',
                eventId: '{{eventId}}'
            }
        }
    },
    [NotificationType.INVITE_REJECTED]: {
        in_app: {
            title: 'Invite Rejected',
            body: '{{memberEmail}} has declined your invitation to {{eventName}}'
        },
        email_registered: {
            title: 'Smart Calendar - Invite Declined',
            body: `
                <h2>Invite Declined</h2>
                <p>{{memberEmail}} has declined your invitation to {{eventName}}.</p>
                <p>Log in to your Smart Calendar account to view the event details.</p>
            `
        },
        email_unregistered: {
            title: 'Smart Calendar - Invite Declined',
            body: `
                <h2>Invite Declined</h2>
                <p>{{memberEmail}} has declined your invitation to {{eventName}}.</p>
                <p>Create your Smart Calendar account to manage your events.</p>
                <p>Sign up now: ${process.env.APP_BASE}/register</p>
            `
        },
        fcm: {
            title: 'Smart Calendar',
            body: '{{memberEmail}} declined invite to {{eventName}}',
            data: {
                type: 'INVITE_REJECTED',
                eventId: '{{eventId}}'
            }
        }
    },
    [NotificationType.MEMBER_ADDED]: {
        in_app: {
            title: 'New Member Added',
            body: '{{memberEmail}} has been added to {{eventName}}'
        },
        email_registered: {
            title: 'Smart Calendar - New Member Added',
            body: `
                <h2>New Member Added</h2>
                <p>{{memberEmail}} has been added to {{eventName}}.</p>
                <p>Log in to your Smart Calendar account to view the event details.</p>
            `
        },
        email_unregistered: {
            title: 'Smart Calendar - New Member Added',
            body: `
                <h2>New Member Added</h2>
                <p>{{memberEmail}} has been added to {{eventName}}.</p>
                <p>Create your Smart Calendar account to manage your events.</p>
                <p>Sign up now: ${process.env.APP_BASE}</p>
            `
        },
        fcm: {
            title: 'Smart Calendar',
            body: '{{memberEmail}} added to {{eventName}}',
            data: {
                type: 'MEMBER_ADDED',
                eventId: '{{eventId}}'
            }
        }
    },
    [NotificationType.MEMBER_REMOVED]: {
        in_app: {
            title: 'Member Removed',
            body: '{{memberEmail}} has been removed from {{eventName}}'
        },
        email_registered: {
            title: 'Smart Calendar - Member Removed',
            body: `
                <h2>Member Removed</h2>
                <p>{{memberEmail}} has been removed from {{eventName}}.</p>
                <p>Log in to your Smart Calendar account to view the event details.</p>
            `
        },
        email_unregistered: {
            title: 'Smart Calendar - Member Removed',
            body: `
                <h2>Member Removed</h2>
                <p>{{memberEmail}} has been removed from {{eventName}}.</p>
                <p>Create your Smart Calendar account to manage your events.</p>
                <p>Sign up now: ${process.env.APP_BASE}</p>
            `
        },
        fcm: {
            title: 'Smart Calendar',
            body: '{{memberEmail}} removed from {{eventName}}',
            data: {
                type: 'MEMBER_REMOVED',
                eventId: '{{eventId}}'
            }
        }
    },
    [NotificationType.MEETING_SCHEDULED]: {
        in_app: {
            title: 'Meeting Scheduled',
            body: 'A meeting for {{eventName}} has been scheduled for {{meetingTime}}'
        },
        email_registered: {
            title: 'Smart Calendar - Meeting Scheduled',
            body: `
                <h2>Meeting Scheduled</h2>
                <p>A meeting for {{eventName}} has been scheduled for {{meetingTime}}.</p>
                <p>Log in to your Smart Calendar account to view the meeting details.</p>
            `
        },
        email_unregistered: {
            title: 'Smart Calendar - Meeting Scheduled',
            body: `
                <h2>Meeting Scheduled</h2>
                <p>A meeting for {{eventName}} has been scheduled for {{meetingTime}}.</p>
                <p>Create your Smart Calendar account to manage your events and meetings.</p>
                <p>Sign up now: ${process.env.APP_BASE}</p>
            `
        },
        fcm: {
            title: 'Smart Calendar',
            body: 'Meeting scheduled: {{eventName}} at {{meetingTime}}',
            data: {
                type: 'MEETING_SCHEDULED',
                eventId: '{{eventId}}',
                meetingId: '{{meetingId}}'
            }
        }
    },
    [NotificationType.EVENT_DELETED]: {
        in_app: {
            title: 'Event Deleted',
            body: 'The event {{eventName}} has been deleted'
        },
        email_registered: {
            title: 'Smart Calendar - Event Deleted',
            body: `
                <h2>Event Deleted</h2>
                <p>The event {{eventName}} has been deleted.</p>
                <p>Log in to your Smart Calendar account to view your updated calendar.</p>
            `
        },
        email_unregistered: {
            title: 'Smart Calendar - Event Deleted',
            body: `
                <h2>Event Deleted</h2>
                <p>The event {{eventName}} has been deleted.</p>
                <p>Create your Smart Calendar account to manage your events.</p>
                <p>Sign up now: ${process.env.APP_BASE}</p>
            `
        },
        fcm: {
            title: 'Smart Calendar',
            body: 'Event deleted: {{eventName}}',
            data: {
                type: 'EVENT_DELETED',
                eventId: '{{eventId}}'
            }
        }
    }
};
