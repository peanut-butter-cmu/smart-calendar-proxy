export enum EventGroupType {
    SYSTEM = "system",
    COURSE = "course"
};

export enum Priority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
};

export enum ReminderOptions {
    AT_TIME_EVENT = 0,
    FIVE_MINUTES = 5,
    TEN_MINUTES = 10,
    FIFTEEN_MINUTES = 15,
    THIRTY_MINUTES = 30,
    ONE_HOUR = 60,
    TWO_HOURS = 120,
    ONE_DAY = 1440,// 24 hours * 60 minutes
    TWO_DAYS = 2880,// 48 hours * 60 minutes
    ONE_WEEK = 10080 // 7 days * 24 hours * 60 minutes
};

export enum GroupTitle {
    CMU = "CMU",
    CLASS = "Class",
    QUIZ = "Quiz",
    ASSIGNMENT = "Assignment",
    FINAL = "Final",
    MIDTERM = "Midterm",
    HOLIDAY = "Holiday",
    OWNER = "Owner"
};

export enum InviteStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
};

export enum NotificationType {
    EVENT_CREATED = "event_created",
    MEETING_SCHEDULED = "event_scheduled",
    EVENT_DELETED = "event_deleted",
    INVITE_ACCEPTED = "invite_accepted",
    INVITE_REJECTED = "invite_rejected",
    EVENT_REMINDER = "event_reminder"
};

export enum CalendarEventType {
    NON_SHARED = "non_shared",
    UNSAVED_SHARED = "unsaved_shared",
    SAVED_SHARED = "saved_shared"
};

export enum SharedEventStatus {
    PENDING = "pending",
    ARRANGED = "arranged",
    SAVED = "saved",
    DELETED = "deleted"
};
