import { Between, DataSource, Equal, Or, Repository } from "typeorm";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { CalendarEventType, SharedEventStatus } from "../types/enums.js";
import * as swagger from "../types/swagger.js";
import { Pagination } from "types/global.js";
import { CalendarEventGroup } from "../models/calendarEventGroup.entity.js";
import { EventGroupType, GroupTitle } from "../types/enums.js";
import { UserService } from "./user.service.js";
import { getDefaultColor, getDefaultPriority, getDefaultBusy, getDefaultReminders } from "../helpers/calendar.js";
import { Course } from "../models/course.entity.js";
import { CourseInfo } from "../fetcher/reg-cmu.js";

export class CalendarService {
    private _event: Repository<CalendarEvent>;
    private _group: Repository<CalendarEventGroup>;
    private _userService: UserService;
    private _course: Repository<Course>;

    constructor(ds: DataSource, userService: UserService) {
        this._event = ds.getRepository(CalendarEvent);
        this._group = ds.getRepository(CalendarEventGroup);
        this._userService = userService;
        this._course = ds.getRepository(Course);
    }

    public async getGroupsByOwner(ownerId: number): Promise<CalendarEventGroup[]> {
        return this._group.findBy({ owner: { id: ownerId } });
    }

    public async getGroupByCourseId(ownerId: number, courseId: string): Promise<CalendarEventGroup> {
        const course = await this._course.findOneBy({ code: courseId });
        if (!course)
            throw new Error(CalendarServiceError.COURSE_NOT_FOUND);
        const group = await this._group.findOneBy({ title: course.title, owner: { id: ownerId } });
        if (!group)
            throw errGroupNotFound(course.title);
        return group;
    }

    public async getGroupByTitle(ownerId: number, title: GroupTitle): Promise<CalendarEventGroup> {
        const group = await this._group.findOneBy({ title, owner: { id: ownerId } });
        if (!group)
            throw errGroupNotFound(title);
        return group;
    }

    public async getGroupByOwner(ownerId: number, groupId: number): Promise<CalendarEventGroup> {
        const group = await this._group.findOneBy({ id: groupId, owner: { id: ownerId } });
        if (!group)
            throw new Error(CalendarServiceError.GROUP_NOT_FOUND);
        return group;
    }

    public async getOwnerGroupByOwner(ownerId: number): Promise<CalendarEventGroup> {
        const group = await this._group.findOneBy({ 
            title: GroupTitle.OWNER, 
            owner: { id: ownerId } 
        });
        if (!group)
            throw errGroupNotFound(GroupTitle.OWNER);
        return group;
    }

    public async editGroupByOwner(ownerId: number, groupId: number, updatedGroup: swagger.EventGroupEdit): Promise<CalendarEventGroup> {
        const result = await this._group.update({ id: groupId, owner: { id: ownerId } }, updatedGroup);
        if (result.affected === 0)
            throw errGroupNotFound(GroupTitle.OWNER);
        return this.getGroupByOwner(ownerId, groupId);
    }

    public async createDefaultGroups(userId: number, courses: CourseInfo[]): Promise<void> {
        const systemGroups = [
            { title: GroupTitle.OWNER },
            { title: GroupTitle.CLASS },
            { title: GroupTitle.MIDTERM },
            { title: GroupTitle.FINAL },
            { title: GroupTitle.CMU },
            { title: GroupTitle.HOLIDAY },
        ];
        const courseGroups = courses.map(c => ({ title: c.title }));
        const user = await this._userService.getUserById(userId, { credential: true });
        if (user.mangoToken) {
            systemGroups.push({ title: GroupTitle.ASSIGNMENT });
            systemGroups.push({ title: GroupTitle.QUIZ });
        }
        const existingGroups = await this.getGroupsByOwner(userId);
        const newGroups = [
            ...systemGroups
                .filter(group => !existingGroups.some(g => g.title === group.title))
                .map(g => ({
                    ...g,
                    owner: { id: userId },
                    type: EventGroupType.SYSTEM,
                    readonly: true,
                    color: getDefaultColor(g.title),
                    priority: getDefaultPriority(g.title),
                    isBusy: getDefaultBusy(g.title),
                    reminders: getDefaultReminders(g.title),
                })),
            ...courseGroups
                .filter(group => !existingGroups.some(g => g.title === group.title))
                .map(g => ({
                    ...g,
                    owner: { id: userId },
                    type: EventGroupType.COURSE,
                    readonly: true,
                    color: getDefaultColor(GroupTitle.CLASS),
                    priority: getDefaultPriority(GroupTitle.CLASS),
                    isBusy: getDefaultBusy(GroupTitle.CLASS),
                    reminders: getDefaultReminders(GroupTitle.CLASS),
                })),
        ];
        await this._group.save(newGroups);
    }

    public async addEvent(ownerId: number, event: swagger.CalendarEventNew, params: { type?: CalendarEventType } = {}): Promise<CalendarEvent> {
        if (event.start > event.end)
            throw new Error(CalendarServiceError.EVENT_END_BEFORE_START);
        const ownerGroup = await this.getOwnerGroupByOwner(ownerId);
        const newEventUnsaved = this._event.create({
            ...event,
            type: params.type,
            owner: { id: ownerId },
            groups: [{ id: ownerGroup.id }]
        });
        return this._event.save(newEventUnsaved);
    }

    public async getEventByOwner(ownerId: number, eventId: number): Promise<CalendarEvent> {
        const event = await this._event.findOne({ 
            where : { 
                id: eventId,
                type: Or(
                    Equal(CalendarEventType.NON_SHARED),
                    Equal(CalendarEventType.SAVED_SHARED)
                ),
                owner: { id: ownerId }
            },
            relations: ["groups"]
        });
        if (!event)
            throw new Error(CalendarServiceError.EVENT_NOT_FOUND);
        return event;
    }

    public async editEventByID(ownerId: number, eventId: number, newEvent: swagger.CalendarEventEdit): Promise<CalendarEvent> {
        if (newEvent.start > newEvent.end)
            throw new Error(CalendarServiceError.EVENT_END_BEFORE_START);
        const originalEvent = await this._event.findOne({ 
            where: { 
                id: eventId,
                type: CalendarEventType.NON_SHARED,
                owner: { id: ownerId }
            },
            relations: ["groups"]
        });
        if (!originalEvent)
            throw new Error(CalendarServiceError.EVENT_NOT_FOUND);
        const modifiedEvent = await this._event.save({...originalEvent, ...newEvent});
        return modifiedEvent;
    }

    public async deleteUnsavedSharedEventByID(ownerId: number, eventId: number): Promise<CalendarEvent> {
        return this._event.createQueryBuilder("event")
            .innerJoin("shared_event_events_calendar_event", "see", "see.calendarEventId = event.id")
            .innerJoin("shared_event", "se", "se.id = see.sharedEventId")
            .where("event.id = :eventId", { eventId })
            .andWhere("se.ownerId = :ownerId", { ownerId })
            .andWhere("se.status = :status", { status: SharedEventStatus.ARRANGED })
            .andWhere("event.type = :type", { type: CalendarEventType.UNSAVED_SHARED })
            .getOne();
    }

    public async deleteEventByID(ownerId: number, eventId: number): Promise<void> {
        const event = (await this._event.findOneBy({
            id: eventId,
            type: CalendarEventType.NON_SHARED,
            owner: { id: ownerId } 
        }));
        if (!event)
            throw new Error("Event not found.");
        await this._event.remove(event);
    }

    public async getEventsByOwner(ownerId, params: { startDate: Date, endDate: Date, limit: number, offset: number }): Promise<Pagination<CalendarEvent>> {
        const [events, total] = await this._event.findAndCount({
            where: { 
                owner: { id: ownerId },
                type: Or(
                    Equal(CalendarEventType.NON_SHARED),
                    Equal(CalendarEventType.SAVED_SHARED)
                ),
                start: Between(params.startDate, params.endDate)
            },
            relations: ["groups"],
            take: params.limit,
            skip: params.offset,
            order: { start: "ASC" }
        });
        return {
            items: events,
            total,
            limit: params.limit,
            offset: params.offset
        };
    }

    public async getNotifiableEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
        return await this._event
            .createQueryBuilder("event")
            .innerJoin("event.groups", "grp")
            .leftJoinAndSelect("event.owner", "owner")
            .where("grp.reminders <> '{}'")
            .andWhere(`EXISTS (
                SELECT 1
                FROM unnest(grp.reminders) AS reminder_minutes
                WHERE (event.start - (reminder_minutes * interval '1 minute')) BETWEEN :start AND :end
            )`, { start, end })
            .getMany();
    }

    public async deleteAllEvents(userId: number): Promise<void> {
        const events = await this._event.find({
            where: { owner: { id: userId } }
        });
        await this._event.remove(events);
    }
}

function errGroupNotFound(title: string): Error {
    return new Error(`Group ${title} not found.`);
}

export enum CalendarServiceError {
    GROUP_NOT_FOUND = "Group not found.",
    EVENT_NOT_FOUND = "Event not found.",
    EVENT_END_BEFORE_START = "Event end before it start.",
    COURSE_NOT_FOUND = "Course not found."
}
