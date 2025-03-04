import { DataSource, EntityManager, Repository } from "typeorm";
import { CourseInfo, RegCMUFetcher } from "../fetcher/reg-cmu.js";
import { User } from "../models/user.entity.js";
import { MangoClient, MangoAssignment } from "../client/mango.js";
import { Session } from "../models/session.entity.js";
import { eachDayOfInterval } from "date-fns";
import { createStartEndInRegDate } from "../helpers/calendar.js";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { CalendarEventGroup } from "../models/calendarEventGroup.entity.js";
import { EventGroupType, GroupTitle } from "../types/enums.js";
import { CalendarService } from "./calendar.service.js";
import dayjs from "dayjs";

export type LoginInfo = { username: string; password: string; };

export enum LoginError {
    INVALID_USER_CRED = "Invalid user credentials.",
};

export class UserService {
    private _ds: DataSource;
    private _user: Repository<User>;
    private _calendarService: CalendarService;
    private _session: Repository<Session>;

    constructor(dataSource: DataSource) {
        this._ds = dataSource;
        this._user = dataSource.getRepository(User);
        this._calendarService = new CalendarService(dataSource, this);
        this._session = dataSource.getRepository(Session);
    }

    // private async _isStudentExist(
    //     studentNo: number
    // ): Promise<boolean> {
    //     const student = await this._user.findOneBy({ studentNo });
    //     return student !== null;
    // }

    private async _isUserExist(
        cred: LoginInfo
    ): Promise<boolean> {
        const student = await this._user.findOneBy({ CMUUsername: cred.username });
        return student !== null;
    }

    public async auth(cred: LoginInfo): Promise<User> {
        return (await this._isUserExist(cred)) ? this.signIn(cred) : this.signUp(cred);
    }

    public async signIn(cred: LoginInfo): Promise<User> {
        const user = await this._user.findOne({ 
            where: { CMUUsername: cred.username },
            select: { id: true, CMUPassword: true }
        });
        if (!user || cred.password !== user.decrypt(user.CMUPassword))
            throw new Error(LoginError.INVALID_USER_CRED);
        return user;
    }

    // private static async _initUserByStudentInfo(
    //     manager: EntityManager,
    //     { givenName, middleName, familyName, studentNo }: StudentInfo,
    //     { username, password }: LoginInfo
    // ): Promise<User> {
    //     let user = manager.create(User, {
    //         givenName, middleName, familyName, studentNo,
    //         CMUUsername: username, CMUPassword: password,
    //         mangoToken: ""
    //     });
    //     user = await manager.save(user);
    //     if (!user)
    //         throw new Error("Unable to sign up.");
    //     return user;
    // }

    // private static async _initUserByStudentNo(
    //     manager: EntityManager,
    //     studentNo: number
    // ): Promise<User> {
    //     const user = await manager.findOneBy(User, { studentNo });
    //     if (!user)
    //         throw new Error("Unable to sign in.");
    //     return user;
    // }

    // private static async _updateUserCourses(
    //     manager: EntityManager,
    //     user: User,
    //     courses: CourseInfo[]
    // ): Promise<void> {
    //     const existingCourses = await manager.find(Course, {
    //         where: courses.map(course => ({
    //             code: course.courseNo,
    //             lecSection: course.section.lec,
    //             labSection: course.section.lab
    //         }))
    //     });
    //     const existingCoursesSet = new Set(existingCourses.map(course => course.code + course.lecSection + course.labSection));
    //     let newCourses = manager.create(Course, 
    //         courses.filter(course => !existingCoursesSet.has(course.courseNo + course.section.lec + course.section.lab))
    //         .map(({courseNo, section, title, schedule}) => ({
    //             code: courseNo,
    //             lecSection: section.lec,
    //             labSection: section.lab,
    //             title: title,
    //             scheduleDays: schedule.days,
    //             scheduleStart: schedule.start,
    //             scheduleEnd: schedule.end,
    //             midtermExamStart: schedule.midterm?.start,
    //             midtermExamEnd: schedule.midterm?.end,
    //             finalExamStart: schedule.final?.start,
    //             finalExamEnd: schedule.final?.end,
    //             roster: []
    //         }))
    //     );
    //     newCourses = await manager.save(newCourses);
    //     user.courses = [...existingCourses, ...newCourses];
    //     await manager.save(user);
    // }

    // Calendar transaction methods
    // private static async _generateDefaultGroup(
    //     manager: EntityManager,
    //     owner: User,
    //     courses: CourseInfo[]
    // ): Promise<CalendarEventGroup[]> {
    //     const categoryGroups = Object.values(GroupTitle)
    //         .filter(t => t !== GroupTitle.ASSIGNMENT && t !== GroupTitle.QUIZ)
    //         .map(title => ({ 
    //             title, 
    //             type: EventGroupType.SYSTEM,
    //             readonly: true, 
    //             owner: { id: owner.id },
    //             color: getDefaultColor(title),
    //             priority: getDefaultPriority(title),
    //             isBusy: getDefaultBusy(title),
    //             reminders: getDefaultReminders(title),
    //         }));
    //     const courseGroups = courses.map(course => ({
    //         title: course.title,
    //         type: EventGroupType.COURSE,
    //         readonly: true,
    //         owner: { id: owner.id },
    //         color: getDefaultColor(GroupTitle.CLASS),
    //         priority: getDefaultPriority(GroupTitle.CLASS),
    //         isBusy: getDefaultBusy(GroupTitle.CLASS),
    //         reminders: getDefaultReminders(GroupTitle.CLASS),
    //     }));
    //     const groups = manager.create(
    //         CalendarEventGroup, 
    //         [ ...categoryGroups, ...courseGroups ]
    //     );
    //     return manager.save(groups);
    // }

    private static async _generateClassEvent(
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

    // private static async _cleanMidtermExamEvent(
    //     manager: EntityManager,
    //     ownerId: number
    // ): Promise<void> {
    //     await manager.createQueryBuilder(CalendarEvent, "event")
    //         .delete()
    //         .where("event.ownerId = :ownerId", { ownerId: ownerId })
    //         .andWhere("event.groups = :groups", { groups: [{ title: GroupTitle.MIDTERM, type: EventGroupType.SYSTEM }] })
    //         .andWhere("event.created = event.modified")
    //         .execute();
    // }

    // private static async _cleanFinalExamEvent(
    //     manager: EntityManager,
    //     ownerId: number
    // ): Promise<void> {
    //     await manager.createQueryBuilder(CalendarEvent, "event")
    //         .delete()
    //         .where("event.ownerId = :ownerId", { ownerId: ownerId })
    //         .andWhere("event.groups = :groups", { groups: [{ title: GroupTitle.FINAL, type: EventGroupType.SYSTEM }] })
    //         .andWhere("event.created = event.modified")
    //         .execute();
    // }

    private static async _cleanEventsByTitle(
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

    // private static async _cleanAssignment(
    //     manager: EntityManager,
    //     ownerId: number
    // ): Promise<void> {
    //     await manager.createQueryBuilder(CalendarEvent, "event")
    //         .delete()
    //         .where("event.ownerId = :ownerId", { ownerId: ownerId })
    //         .andWhere("event.groups = :groups", { groups: [{ title: GroupTitle.ASSIGNMENT, type: EventGroupType.SYSTEM }] })
    //         .andWhere("event.created = event.modified")
    //         .execute();
    // }

    private static async _generateAssignment(
        manager: EntityManager,
        owner: User,
        assignments: MangoAssignment[]
    ): Promise<CalendarEvent[]> {
        const assignmentGroup = await manager.findOneBy(CalendarEventGroup, {
            title: GroupTitle.ASSIGNMENT,
            type: EventGroupType.SYSTEM,
            owner: { id: owner.id }
        });
        if (!assignmentGroup) throw new Error("Assignment group not found");

        const assignmentEvents = manager.create(CalendarEvent, assignments.map(({name, due_at}) => ({
            title: name,
            groups: [assignmentGroup],
            start: new Date(due_at),
            end: new Date(due_at),
            owner: { id: owner.id }
        })));
        return manager.save(assignmentEvents);
    }

    // private static async _firstSync(
    //     queryRunner: QueryRunner,
    //     user: User,
    //     courses: CourseInfo[]
    // ): Promise<void> {
    //     const manager = queryRunner.manager;
    //     const courseGroups = await UserService._generateDefaultGroup(manager, user, courses);
    //     await UserService._generateClassEvent(manager, user, courses, courseGroups);
    //     await UserService._generateMidtermExamEvent(manager, user, courses, courseGroups);
    //     await UserService._generateFinalExamEvent(manager, user, courses, courseGroups);
    // }

    // private static async _signIn(queryRunner: QueryRunner, { studentNo }: StudentInfo): Promise<JWTPayload> {
    //     const user = await UserService._initUserByStudentNo(queryRunner.manager, studentNo);
    //     return fJWTPayload(user);
    // }

    public async signUp(cred: LoginInfo): Promise<User> {
        const reg = new RegCMUFetcher(cred);
        const student = await reg.getStudent();
        const courses = await reg.getCourses();
        const user = await this._user.save(
            this._user.create({
                givenName: student.givenName,
                middleName: student.middleName,
                familyName: student.familyName,
                studentNo: student.studentNo,
                CMUUsername: cred.username,
                CMUPassword: cred.password,
                mangoToken: ""
            })
        );
        await this._calendarService.createDefaultGroups(user.id, courses);
        return user;
    }

    // private async _signUp(
    //     reg: RegCMUFetcher, 
    //     queryRunner: QueryRunner, 
    //     cred: LoginInfo,
    //     student: StudentInfo
    // ): Promise<User> {
    //     return this._user.save(
    //         this._user.create({
    //             givenName: student.givenName,
    //             middleName: student.middleName,
    //             familyName: student.familyName,
    //             studentNo: student.studentNo,
    //             CMUUsername: cred.username,
    //             CMUPassword: cred.password,
    //             mangoToken: ""
    //         })
    //     );
    //     this._calendarService.createDefaultGroups(user.id);
    //     return user;
    // }

    public async getUserById(userId: number, params: { credential?: boolean } = {}): Promise<User> {
        const user = await this._user.findOne({ 
            where: { id: userId }, 
            select: params.credential ? { CMUUsername: true, CMUPassword: true, mangoToken: true } : undefined
        });
        if (!user)
            throw new Error("User not found.");
        if (params.credential) {
            user.CMUPassword = user.decrypt(user.CMUPassword);
            user.mangoToken = user.decrypt(user.mangoToken);
        }
        return user;
    }

    public async updateMangoToken(userId: number, token: string): Promise<void> {
        const mango = new MangoClient(token);
        if (!(await mango.validate()))
            throw new Error("Invalid mango token.");
        const courses = await mango.getCourses();
        console.log(await Promise.all(courses.flatMap(c => mango.getAssignments(c.id))));
        await this._user.update({ id: userId }, {  mangoToken: token });
    }

    public async addFCMToken(userId: number, token: string, deviceName: string): Promise<{id: number, deviceName: string, createdAt: Date}> {
        const user = await this._ds.manager.findOneBy(User, { id: userId });
        if (!user)
            throw new Error("User not found");
        const existingTokens = await this._ds.manager.count(Session, { where: { owner: { id: userId } } });
        if (existingTokens >= 10)
            throw new Error("Maximum number of FCM tokens reached (10)");
        const session = this._ds.manager.create(Session, {
            fcmToken: token,
            deviceName: deviceName,
            owner: user
        });
        const savedSession = await this._ds.manager.save(session);
        return {
            id: savedSession.id,
            deviceName: savedSession.deviceName,
            createdAt: savedSession.created
        };
    }

    public async listFCMTokens(userId: number): Promise<{id: number, deviceName: string, createdAt: Date}[]> {
        const sessions = await this._ds.manager.find(Session, {
            where: { owner: { id: userId } },
            select: ["id", "deviceName"]
        });
        return sessions.map(session => ({
            id: session.id,
            deviceName: session.deviceName,
            createdAt: session.created
        }));
    }

    public async deleteFCMToken(userId: number, tokenId: number): Promise<void> {
        const result = await this._session.delete({
            id: tokenId,
            owner: { id: userId }
        });
        if (result.affected !== 1)
            throw new Error("Unable to delete FCM token.");
    }

    public async getAllUsers(params: { includeSensitiveData?: boolean }): Promise<User[]> {
        if (params.includeSensitiveData) {
            return await this._ds.getRepository(User).find({
                select: {
                    id: true,
                    givenName: true,
                    middleName: true,
                    familyName: true,
                    studentNo: true,
                    createdAt: true,
                    updatedAt: true,
                    CMUUsername: true,
                    CMUPassword: true,
                    mangoToken: true
                }
            });
        }
        return await this._ds.getRepository(User).find({});
    }

    public async syncClassAndExam(ownerId: number, courses: CourseInfo[]): Promise<void> {
        const courseGroups = await this._calendarService.getGroupsByOwner(ownerId);
        
        const qr = this._ds.createQueryRunner();
        const m = qr.manager;
        await qr.connect();
        await qr.startTransaction();
        try {
            await UserService._cleanEventsByTitle(m, ownerId, GroupTitle.CLASS);
            await UserService._cleanEventsByTitle(m, ownerId, GroupTitle.MIDTERM);
            await UserService._cleanEventsByTitle(m, ownerId, GroupTitle.FINAL);

            await UserService._generateClassEvent(m, ownerId, courses, courseGroups);
            await this._generateMidtermExamEvent(m, ownerId, courses, courseGroups);
            await this._generateFinalExamEvent(m, ownerId, courses, courseGroups);
            await qr.commitTransaction();
        } catch(e) {
            await qr.rollbackTransaction();
            throw e;
        }
    }

    public async syncAssignmentAndQuiz(ownerId: number): Promise<void> {
        const u = await this.getUserById(ownerId, { credential: true });
        if (!u.mangoToken)
            throw new Error(UserServiceError.NO_MANGO_TOKEN);

        const qr = this._ds.createQueryRunner();
        const m = qr.manager;
        await qr.connect();
        await qr.startTransaction();
        try {
            const mangoToken = u.decrypt(u.mangoToken);
            const client = new MangoClient(mangoToken);
            const courses = await client.getCourses();
            const assignments = (await Promise.all(courses.map(c => client.getAssignments(c.id)))).flat();

            // await UserService._cleanAssignment(m, u);
            await UserService._generateAssignment(m, u, assignments);
            await qr.commitTransaction();
        } catch(e) {
            await qr.rollbackTransaction();
            throw e;
        }
    }

    public async syncEvents(ownerId: number): Promise<void> {
        const u = await this.getUserById(ownerId, { credential: true });
        const reg = new RegCMUFetcher({ username: u.CMUUsername, password: u.CMUPassword });
        const courses = await reg.getCourses();
        await this._calendarService.createDefaultGroups(ownerId, courses);
        await this.syncClassAndExam(ownerId, courses);
        // await this.syncAssignmentAndQuiz(ownerId);
    }   
}

export enum UserServiceError {
    USER_NOT_FOUND = "User not found.",
    NO_MANGO_TOKEN = "No mango token specify."
}
