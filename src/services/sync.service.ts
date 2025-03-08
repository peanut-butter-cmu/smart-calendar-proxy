import { MangoClient } from "../client/mango.js";
import { DataSource, EntityManager, Repository } from "typeorm";
import { UserService } from "./user.service.js";
import { CalendarServiceError, CalendarService } from "./calendar.service.js";
import { CourseInfo } from "../fetcher/reg-cmu.js";
import { CalendarEventGroup } from "../models/calendarEventGroup.entity.js";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { eachDayOfInterval } from "date-fns";
import { createStartEndInRegDate } from "../helpers/calendar.js";
import { CalendarEventType, EventGroupType, GroupTitle } from "../types/enums.js";
import { User } from "../models/user.entity.js";
import { RegCMUFetcher } from "../fetcher/reg-cmu.js";
import { MangoAssignment, MangoCourse } from "../client/mango.js";
import dayjs from "dayjs";
import axios from "axios";
import { parseIcsCalendar } from "ts-ics";
import { Course } from "../models/course.entity.js";
import { fMangoCourseID } from "../helpers/formatter.js";
import { promptGlobalEvents } from "../helpers/prompt.js";
import { OpenAI } from "openai";
import { GlobalEvent } from "../models/globalEvent.entity.js";
import { ICSEvent } from "../types/global.js";

export class SyncService {
    private _userService: UserService;
    private _calendarService: CalendarService;
    private _globalEvent: Repository<GlobalEvent>;


    constructor(private readonly _ds: DataSource, services: { userService?: UserService, calendarService?: CalendarService } = {}) {
        this._userService = services.userService || new UserService(_ds);
        this._calendarService = services.calendarService || new CalendarService(_ds, this._userService);
        this._globalEvent = _ds.getRepository(GlobalEvent);
    }
    
    private async _generateClassEvent(
        manager: EntityManager,
        ownerId: number,
        courses: CourseInfo[],
        groups: CalendarEventGroup[]
    ): Promise<CalendarEvent[]> {
        const startPeriod = new Date("2024-11-11");
        const endPeriod = new Date("2025-03-11");
        const dayInSemester = eachDayOfInterval({ start: startPeriod, end: endPeriod });
        const classGroup = groups.find(({ title, type }) => title === GroupTitle.CLASS && type === EventGroupType.SYSTEM)!;        
        const classEvents = manager.create(CalendarEvent, courses.map(({ title, schedule }) => {
            return dayInSemester
            .filter(day => schedule.days.includes(day.getDay()))
            .map(date => createStartEndInRegDate(date, schedule.start, schedule.end))
            .map(evnt => ({
                ...evnt,
                title,
                groups: [ classGroup, groups.find(group => group.title === title) ],
                owner: { id: ownerId }
            }))
        }).flat());
        return manager.save(classEvents);
    }

    private async _generateExamEvent(
        manager: EntityManager,
        ownerId: number,
        group: GroupTitle.MIDTERM | GroupTitle.FINAL,
        courses: CourseInfo[],
        groups: CalendarEventGroup[]
    ): Promise<CalendarEvent[]> {
        const desiredGroup = await this._calendarService.getGroupByTitle(ownerId, group);
        const examEvents = await manager.save(manager.create(CalendarEvent, courses
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
                owner: { id: ownerId }
            })
        )));
        return examEvents;
    }

    private async _generateMidtermExamEvent(
        manager: EntityManager,
        ownerId: number,
        courses: CourseInfo[],
        groups: CalendarEventGroup[]
    ): Promise<CalendarEvent[]> {
        return this._generateExamEvent(manager, ownerId, GroupTitle.MIDTERM, courses, groups);
    }

    private async _generateFinalExamEvent(
        manager: EntityManager,
        ownerId: number,
        courses: CourseInfo[],
        groups: CalendarEventGroup[]
    ): Promise<CalendarEvent[]> {
        return this._generateExamEvent(manager, ownerId, GroupTitle.FINAL, courses, groups);
    }

    private async _cleanEventsByTitle(
        manager: EntityManager,
        ownerId: number,
        title: GroupTitle
    ): Promise<void> {
        const events = await manager.findBy(CalendarEvent, {
            owner: { id: ownerId },
            groups: { title: title, type: EventGroupType.SYSTEM }
        });
        await manager.remove(events.filter(e => dayjs(e.created).isSame(dayjs(e.modified)))); // delete event that is not modified by user
    }

    private async _generateAssignment(
        manager: EntityManager,
        owner: User,
        course: MangoCourse,
        assignments: MangoAssignment[]
    ): Promise<CalendarEvent[]> {
        try {
            const classGroup = await this._calendarService.getGroupByCourseId(owner.id, fMangoCourseID(course.name));
            const assignmentGroup = await this._calendarService.getGroupByTitle(owner.id, GroupTitle.ASSIGNMENT);
            return await manager.save(
                manager.create(CalendarEvent, assignments.map(({ name, due_at }) => ({
                    title: name,
                    groups: [{ id: assignmentGroup.id }, { id: classGroup.id }],
                    start: new Date(due_at),
                    end: new Date(due_at),
                    owner: { id: owner.id }
                })))
            );
        } catch(e) {
            // user not enrolled in the course 
            if (e.message === CalendarServiceError.COURSE_NOT_FOUND) {
                return [];
            }
            throw e;
        }
    }

    private async _generateQuiz(
        manager: EntityManager,
        owner: User,
        quizzes: MangoAssignment[]
    ): Promise<CalendarEvent[]> {
        const quizGroup = await this._calendarService.getGroupByTitle(owner.id, GroupTitle.QUIZ);
        return manager.save(
            manager.create(CalendarEvent, quizzes.map(({name, due_at}) => ({
                title: name,
                groups: [{ id: quizGroup.id }],
                start: new Date(due_at),
                end: new Date(due_at),
                owner: { id: owner.id }
            })))
        );
    }

    public async syncUserClassAndExam(userId: number, courses: CourseInfo[]): Promise<void> {
        const courseGroups = await this._calendarService.getGroupsByOwner(userId);
        const qr = this._ds.createQueryRunner();
        const m = qr.manager;
        await qr.connect();
        await qr.startTransaction();
        try {
            await this._cleanEventsByTitle(m, userId, GroupTitle.CLASS);
            await this._cleanEventsByTitle(m, userId, GroupTitle.MIDTERM);
            await this._cleanEventsByTitle(m, userId, GroupTitle.FINAL);
            await this._generateClassEvent(m, userId, courses, courseGroups);
            await this._generateMidtermExamEvent(m, userId, courses, courseGroups);
            await this._generateFinalExamEvent(m, userId, courses, courseGroups);
            await qr.commitTransaction();
            await qr.release();
        } catch(e) {
            await qr.rollbackTransaction();
            await qr.release();
            throw e;
        }
    }

    public async syncUserAssignmentAndQuiz(userId: number): Promise<void> {
        const user = await this._userService.getUserById(userId, { credential: true });
        const qr = this._ds.createQueryRunner();
        const man = qr.manager;
        await qr.connect();
        await qr.startTransaction();
        const mango = new MangoClient(user.mangoToken);
        try {
            await this._cleanEventsByTitle(man, userId, GroupTitle.ASSIGNMENT);
            await this._cleanEventsByTitle(man, userId, GroupTitle.QUIZ);
            const courses = await mango.getCourses();
            const assignments = await Promise.all(
                courses.map(async c => ({ 
                    course: c,
                    assignments: await mango.getAssignments(c.id) 
                }))
            );
            await Promise.all(
                assignments.map(({ course, assignments }) => this._generateAssignment(man, user, course, assignments))
            );
            await this._generateQuiz(man, user, []); // TODO: add quiz, but mango doesn't have quiz, talk more
            await qr.commitTransaction();
            await qr.release();
        } catch(e) {
            await qr.rollbackTransaction();
            await qr.release();
            throw e;
        }
    }

    
    public async syncUserEvents(userId: number): Promise<void> {
        const u = await this._userService.getUserById(userId, { credential: true });
        const reg = new RegCMUFetcher({ username: u.CMUUsername, password: u.CMUPassword });
        const courses = await reg.getCourses();
        await this._calendarService.createDefaultGroups(userId, courses);
        await this.syncCMUEvents(userId);
        await this.syncUserClassAndExam(userId, courses);
        if (u.mangoToken) {
            await this.syncCourse(userId);
            await this.syncUserAssignmentAndQuiz(userId);
        }
    }

    private async _updateUserCourses(
        manager: EntityManager,
        userId: number,
        courses: CourseInfo[]
    ): Promise<void> {
        const user = await this._userService.getUserById(userId);
        const existingCourses = await manager.find(Course, {
            where: courses.map(course => ({
                code: course.courseNo,
                lecSection: course.section.lec,
                labSection: course.section.lab
            }))
        });
        const existingCoursesSet = new Set(existingCourses.map(course => course.code + course.lecSection + course.labSection));
        let newCourses = manager.create(Course, 
            courses.filter(course => !existingCoursesSet.has(course.courseNo + course.section.lec + course.section.lab))
            .map(({courseNo, section, title, schedule}) => ({
                code: courseNo,
                lecSection: section.lec,
                labSection: section.lab,
                title: title,
                scheduleDays: schedule.days,
                scheduleStart: schedule.start,
                scheduleEnd: schedule.end,
                midtermExamStart: schedule.midterm?.start,
                midtermExamEnd: schedule.midterm?.end,
                finalExamStart: schedule.final?.start,
                finalExamEnd: schedule.final?.end,
                roster: []
            }))
        );
        newCourses = await manager.save(newCourses);
        user.courses = [...existingCourses, ...newCourses];
        await manager.save(user);
    }

    public async syncCourse(userId: number): Promise<void> {
        const user = await this._userService.getUserById(userId, { credential: true });
        const reg = new RegCMUFetcher({ username: user.CMUUsername, password: user.CMUPassword });
        const courses = await reg.getCourses();
        await this._updateUserCourses(this._ds.manager, userId, courses);
    }

    private async _generateCMUEvents(
        manager: EntityManager,
        userId: number
    ): Promise<void> {
        const globalEvents = await this._globalEvent.find();
        const cmuGroup = await this._calendarService.getGroupByTitle(userId, GroupTitle.CMU);
        await manager.save(
            manager.create(CalendarEvent, globalEvents.map(e => ({
                title: e.title,
                start: new Date(e.start),
                end: new Date(e.end),
                groups: [{ id: cmuGroup.id }],
                owner: { id: userId },
                type: CalendarEventType.NON_SHARED
            })))
        );
    }

    public async syncCMUEvents(userId: number): Promise<void> {
        const qr = this._ds.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            await this._cleanEventsByTitle(qr.manager, userId, GroupTitle.CMU);
            await this._generateCMUEvents(qr.manager, userId);
            await qr.commitTransaction();
            await qr.release();
        } catch(e) {
            await qr.rollbackTransaction();
            await qr.release();
            throw e;
        }
    }

    public async syncGlobalEvents(): Promise<void> {
        if (process.env.NODE_ENV !== "development") throw new Error("Not allowed in production.");
        const response = await axios.get(process.env.GLOBAL_EVENTS_URL!);
        const calendar = parseIcsCalendar(response.data);
        const prompt = promptGlobalEvents(calendar);

        // send prompt to openai
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL
        });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        const result = JSON.parse(completion.choices[0].message.content!) as { events: ICSEvent[] };
        console.log(result);
        const events = await this._globalEvent.findBy(result.events.map(e => ({ uid: e.uid })));
        await this._globalEvent.save(this._globalEvent.create(result.events.filter(e => !events.find(ev => ev.uid === e.uid))));
    }
}
