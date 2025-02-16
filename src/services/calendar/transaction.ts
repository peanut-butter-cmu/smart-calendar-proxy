import { CourseInfo } from "../../fetcher/reg-cmu.js";
import { eachDayOfInterval } from "date-fns";
import { EntityManager, QueryRunner } from "typeorm";
import { GroupTitle } from "../user/index.js";
import { createStartEndInRegDate, getDefaultBusy, getDefaultColor, getDefaultPriority, getDefaultReminders } from "../../helpers/calendar.js";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { CalendarEventGroup, EventGroupType } from "../../models/calendarEventGroup.entity.js";

export class CalendarTransaction {
    private _ownerId: number;
    private _manager: EntityManager;
    constructor(qRnr: QueryRunner, ownerId: number) {
        this._ownerId = ownerId;
        this._manager = qRnr.manager;
    }

    public async generateDefaultGroup(courses: CourseInfo[]): Promise<CalendarEventGroup[]> {
        const categoryGroups = Object.values(GroupTitle).map(title => ({ 
            title, 
            type: EventGroupType.SYSTEM,
            readonly: true, 
            owner: { id: this._ownerId },
            color: getDefaultColor(title),
            priority: getDefaultPriority(title),
            isBusy: getDefaultBusy(title),
            reminders: getDefaultReminders(title),
        }));
        const courseGroups = courses.map(course => ({
            title: course.title,
            type: EventGroupType.COURSE,
            readonly: true,
            owner: { id: this._ownerId },
            color: getDefaultColor(GroupTitle.CLASS),
            priority: getDefaultPriority(GroupTitle.CLASS),
            isBusy: getDefaultBusy(GroupTitle.CLASS),
            reminders: getDefaultReminders(GroupTitle.CLASS),
        }));
        const groups = this._manager.create(
            CalendarEventGroup, 
            [ ...categoryGroups, ...courseGroups ]
        );
        return this._manager.save(groups); 
    }

    public async generateClassEvent(courses: CourseInfo[], groups: CalendarEventGroup[]) {
        const startPeriod = new Date("2024-11-11");
        const endPeriod = new Date("2025-03-11");
        const dayInSemester = eachDayOfInterval({ start: startPeriod, end: endPeriod });
        const classGroup = groups.find(({ title, type }) => title === GroupTitle.CLASS && type === EventGroupType.SYSTEM)!;        
        const classEvents = this._manager.create(CalendarEvent, courses.map(({ title, schedule }) => {
            return dayInSemester
            .filter(day => schedule.days.includes(day.getDay()))
            .map(date => createStartEndInRegDate(date, schedule.start, schedule.end))
            .map(evnt => ({
                ...evnt,
                title,
                groups: [ classGroup, groups.find(group => group.title === title) ],
                owner: { id: this._ownerId }
            }))
        }).flat());
        return this._manager.save(classEvents);
    }

    private async _generateExamEvent(group: GroupTitle.MIDTERM | GroupTitle.FINAL, courses: CourseInfo[], groups: CalendarEventGroup[]) {
        const desiredGroup = groups.find(({ title, type }) => title === group && type === EventGroupType.SYSTEM)!;
        const examEvents = this._manager.create(CalendarEvent, courses
            .map(course => group === GroupTitle.MIDTERM ? 
                { ...course, exam: course.schedule.midterm } : 
                { ...course, exam: course.schedule.final }
            )
            .filter(course => course.exam)
            .map(({title, exam}) => ({
                title,
                groups: [desiredGroup, groups.find(group => group.title === title && group.type === EventGroupType.COURSE)],
                start: exam.start,
                end: exam.end,
                owner: { id: this._ownerId }
            })
        ));
        return this._manager.save(examEvents);
    }

    public async generateMidtermExamEvent(courses: CourseInfo[], groups: CalendarEventGroup[]) {
        return this._generateExamEvent(GroupTitle.MIDTERM, courses, groups);
    }

    public async generateFinalExamEvent(courses: CourseInfo[], groups: CalendarEventGroup[]) {
        return this._generateExamEvent(GroupTitle.FINAL, courses, groups);
    }

    public async cleanMidtermExamEvent() {
        const allMidtermEvents = await this._manager.find(CalendarEvent, {
            where: {
                groups: [{ title: GroupTitle.MIDTERM, type: EventGroupType.SYSTEM, owner: { id: this._ownerId } }],
                owner: { id: this._ownerId }
            }
        });
        const toRemove = allMidtermEvents.filter(({created, modified}) => created.getTime() === modified.getTime());
        await this._manager.remove(toRemove);
    }

    public async cleanFinalExamEvent() {
        const allFinalEvents = await this._manager.find(CalendarEvent, {
            where: {
                groups: [{ title: GroupTitle.FINAL, type: EventGroupType.SYSTEM, owner: { id: this._ownerId } }],
                owner: { id: this._ownerId }
            }
        });
        const toRemove = allFinalEvents.filter(({created, modified}) => created.getTime() === modified.getTime());
        await this._manager.remove(toRemove);
    }

    public async cleanClassEvent() {
        const allClassEvents = await this._manager.find(CalendarEvent, {
            where: {
                groups: [{ title: GroupTitle.CLASS, type: EventGroupType.COURSE, owner: { id: this._ownerId } }],
                owner: { id: this._ownerId }
            }
        });
        const toRemove = allClassEvents.filter(({created, modified}) => created.getTime() === modified.getTime());
        await this._manager.remove(toRemove);
    }
}
