export enum CalendarEventType {
    Assignment,
    Class,
    Exam,
    Quiz,
    Personal
}

export type CalendarEventBase = {
    title: string;
}

export type CalendarEvent =
    | { type: CalendarEventType.Assignment, 
        date: Date 
    } & CalendarEventBase
    | { type: CalendarEventType.Class 
              | CalendarEventType.Exam 
              | CalendarEventType.Quiz,
        start: Date,
        end: Date
    } & CalendarEventBase

