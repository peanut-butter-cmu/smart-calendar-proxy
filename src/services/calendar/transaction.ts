import { CourseInfo } from "../../fetcher/reg-cmu.js";
import { eachDayOfInterval } from "date-fns";
import { EntityManager, QueryRunner } from "typeorm";
import { GroupTitle } from "../user/index.js";
import { createStartEndInRegDate } from "../../helpers/calendar.js";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { CalendarEventGroup } from "../../models/calendarEventGroup.entity.js";

export class CalendarTransaction {
    private _qRnr: QueryRunner;
    private _ownerId: number;
    private _manager: EntityManager;
    constructor(qRnr: QueryRunner, ownerId: number) {
        this._qRnr = qRnr;
        this._ownerId = ownerId;
        this._manager = qRnr.manager;
    }

    public async init() {
        await this._qRnr.startTransaction();
    }

    public async generateDefaultGroup() {
        const groups = this._manager.create(
            CalendarEventGroup, 
            Object.values(GroupTitle).map(title => ({ 
                title, 
                system: true, 
                owner: { id: this._ownerId } 
            })
        ));
        return this._manager.save(groups);
    }

    public async generateClassEvent(courses: CourseInfo[]) {
        const startPeriod = new Date("2024-11-11");
        const endPeriod = new Date("2025-03-11");
        const dayInSemester = eachDayOfInterval({ start: startPeriod, end: endPeriod });
        const classGroup = await this._manager.findOneByOrFail(CalendarEventGroup, {
            title: GroupTitle.CLASS,
            system: true,
            owner: { id: this._ownerId } 
        });
        const classEvents = this._manager.create(CalendarEvent, courses.map(({title, schedule}) => {
            return dayInSemester
            .filter(day => schedule.days.includes(day.getDay()))
            .map(date => createStartEndInRegDate(date, schedule.start, schedule.end))
            .map(evnt => ({
                ...evnt,
                title: title,
                groups: [classGroup],
                owner: { id: this._ownerId }
            }))
        }).flat());
        return this._manager.save(classEvents);
    }

    private async _generateExamEvent(group: GroupTitle.MIDTERM | GroupTitle.FINAL, courses: CourseInfo[]) {
        const desiredGroup = await this._manager.findOneByOrFail(CalendarEventGroup, {
            title: group,
            system: true,
            owner: { id: this._ownerId } 
        });
        const examEvents = this._manager.create(CalendarEvent, courses
            .map(course => group === GroupTitle.MIDTERM ? 
                { ...course, exam: course.schedule.midterm } : 
                { ...course, exam: course.schedule.final }
            )
            .filter(course => course.exam)
            .map(({title, exam}) => ({
                title,
                groups: [desiredGroup],
                start: exam.start,
                end: exam.end,
                owner: { id: this._ownerId }
            })
        ));
        return this._manager.save(examEvents);
    }

    public async generateMidtermExamEvent(courses: CourseInfo[]) {
        return this._generateExamEvent(GroupTitle.MIDTERM, courses);
    }

    public async generateFinalExamEvent(courses: CourseInfo[]) {
        return this._generateExamEvent(GroupTitle.FINAL, courses);
    }

    public async cleanClassEvent() {
        const allClassEvents = await this._manager.find(CalendarEvent, {
            where: {
                groups: [{ title: GroupTitle.CLASS, system: true, owner: { id: this._ownerId } }],
                owner: { id: this._ownerId }
            }
        });
        const toRemove = allClassEvents.filter(({created, modified}) => created.getTime() === modified.getTime());
        await this._manager.remove(toRemove);
    }

    public async finalize() {
        return this._qRnr.commitTransaction();
    }
}