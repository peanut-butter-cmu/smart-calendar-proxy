import { CMUOAuth, createCMUAxios } from "../helpers/reg-cmu.js";
import { User } from "../models/user.entity.js";
import { Course } from "../models/course.entity.js";
import { DataSource, QueryRunner, Repository } from "typeorm";
import { AxiosOAuthClient } from "../client/oauth-cmu/axios.js";
import { CourseInfo, RegCMUFetcher } from "../fetcher/reg-cmu.js";
import { AxiosRegClient } from "../client/reg-cmu/axios.js";
import { JWTPayload } from "../routes/calendar.js";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { CalendarEventGroup } from "../models/calendarEventGroup.entity.js";
import dayjs from "dayjs";
import { eachDayOfInterval } from "date-fns";
import { Session } from "../models/session.entity.js";

export type Title = "CMU" | "Class" | "Quiz" | "Assignment" | "Final" | "Midterm" | "Holiday" | "Owner";
export type LoginInfo = { username: string; password: string; };

export interface IUserService {
    signIn(cred: LoginInfo): Promise<JWTPayload | null>;
    signUp(cred: LoginInfo): Promise<JWTPayload | null>;
}

export class UserService implements IUserService {
    private _user: Repository<User>;
    private _oauth: CMUOAuth;
    private _reg: RegCMUFetcher;
    private _ds: DataSource;
    constructor(dataSource: DataSource) {
        const axios = createCMUAxios();
        const oauthClient = new AxiosOAuthClient(axios);
        const regClient = new AxiosRegClient(axios);
        this._oauth = new CMUOAuth(oauthClient);
        this._reg = new RegCMUFetcher(regClient, this._oauth);
        this._user = dataSource.getRepository(User);
        this._ds = dataSource;
    }

    private async _verifyCMU(cred: LoginInfo): Promise<boolean> {
        try {
            await this._oauth.login(cred);
            return true;
        } catch(e) {
            if (process.env.DEBUG)
                console.debug(e.stack);
            return false;
        }
    }

    private async _newCourse(queryRunner: QueryRunner, course: CourseInfo) {
        const { schedule } = course;
        const newCourse = queryRunner.manager.create(Course, {
            code: course.courseNo,
            lecSection: course.section.lec,
            labSection: course.section.lab,
            title: course.title,
            scheduleDays: schedule.days,
            scheduleStart: schedule.start,
            scheduleEnd: schedule.end,
            midtermExamStart: schedule.midterm?.start,
            midtermExamEnd: schedule.midterm?.end,
            finalExamStart: schedule.final?.start,
            finalExamEnd: schedule.final?.end,
            roster: []
        });
        return queryRunner.manager.save(newCourse);
    }

    private async _updateCourses(queryRunner: QueryRunner, cred: LoginInfo, user: User) {
        const REGCourses = await this._reg.getCourses(cred);
        const unawaitCourses = REGCourses.map(async course => await queryRunner.manager.findOne(Course, {
            where: {
                code: course.courseNo,
                lecSection: course.section.lec,
                labSection: course.section.lab,
            }
        }) || this._newCourse(queryRunner, course));
        user.courses = await Promise.all(unawaitCourses);
        return queryRunner.manager.save(user);
    }

    private static async _createDefaultGroups(queryRunner: QueryRunner, owner: User) {
        const groups = [{
            title: "CMU",
            system: true,
            owner
        }, {
            title: "Class",
            system: true,
            owner
        }, {
            title: "Quiz",
            system: true,
            owner
        }, {
            title: "Assignment",
            system: true,
            owner
        }, {
            title: "Final",
            system: true,
            owner
        }, {
            title: "Midterm",
            system: true,
            owner
        }, {
            title: "Holiday",
            system: true,
            owner
        }, {
            title: "Owner",
            system: true,
            owner
        }].map(group => queryRunner.manager.create(CalendarEventGroup, group));
        return queryRunner.manager.save(groups);
    }

    private static async _getSystemGroup(queryRunner: QueryRunner, title: Title, owner: User): Promise<CalendarEventGroup> {
        const group = await queryRunner.manager.findOneBy(CalendarEventGroup, { title, system: true, owner });
        if (!group) 
            throw new Error(`no '${title}' group of user '${owner.studentNo}'`);
        return group;
    }

    private static _createStartEndFromDate(date: Date, startSec: number, endSec: number) {
        const midnight = dayjs(date).startOf("day");        
        function addBy(sec: number) {
            return midnight.clone().add(sec, "seconds").toDate()
        }
        return {
            start: addBy(startSec),
            end: addBy(endSec)
        }
    }

    private static async _createClassEvents(queryRunner: QueryRunner, owner: User, startPeriod: Date, endPeriod: Date) {
        const dayInSemester = eachDayOfInterval({ start: startPeriod, end: endPeriod });
        const classGroup = await UserService._getSystemGroup(queryRunner, "Class", owner);
        const classEvents = owner.courses.map(course => {
        return dayInSemester
            .filter(day => course.scheduleDays.includes(day.getDay()))
            .map(date => UserService._createStartEndFromDate(date, course.scheduleStart, course.scheduleEnd))
            .map(evnt => ({
                ...evnt,
                title: course.title,
                groups: [classGroup],
                owner
            }))
            .map(evnt => queryRunner.manager.create(CalendarEvent, evnt));
        }).flat();
        return queryRunner.manager.save(CalendarEvent, classEvents);
    }

    private static async _createMidtermEvents(queryRunner: QueryRunner, owner: User): Promise<CalendarEvent[]> {
        const midtermGroup = await UserService._getSystemGroup(queryRunner, "Midterm", owner);
        const midtermEvents = owner.courses
            .filter(course => course.midtermExamStart && course.midtermExamEnd)
            .map(course => ({
                title: course.title,
                groups: [midtermGroup],
                start: course.midtermExamStart,
                end: course.midtermExamEnd,
                owner
            }))
            .map(evnt => queryRunner.manager.create(CalendarEvent, evnt));
        return queryRunner.manager.save(CalendarEvent, midtermEvents);
    }

    private static async _createFinalEvents(queryRunner: QueryRunner, owner: User): Promise<CalendarEvent[]> {
        const finalGroup = await UserService._getSystemGroup(queryRunner, "Final", owner);
        const finalEvents = owner.courses
            .filter(course => course.finalExamStart && course.finalExamEnd)
            .map(course => ({
                title: course.title,
                groups: [finalGroup],
                start: course.finalExamStart,
                end: course.finalExamEnd,
                owner
            }))
            .map(evnt => queryRunner.manager.create(CalendarEvent, evnt));
        return queryRunner.manager.save(CalendarEvent, finalEvents);
    }

    private static async _createDefaultEvents(queryRunner: QueryRunner, owner: User): Promise<CalendarEvent[]> {
       /* Procedures
        * 1. Create class event
        * 2. Create midterm event
        * 3. Create final event
        * 4. TODO: Create quiz event
        * 5. TODO: Create assignment event
        * 6. TODO: Create CMU event
        * 7. TODO: Create Holiday event
        */
        const startPeriod = new Date("2024-11-11");
        const endPeriod = new Date("2025-03-11");
        return [
            ...(await UserService._createClassEvents(queryRunner, owner, startPeriod, endPeriod)),
            ...(await UserService._createMidtermEvents(queryRunner, owner)),
            ...(await UserService._createFinalEvents(queryRunner, owner)),
        ]
    }

    private static async _updateSession(queryRunner: QueryRunner, cred: LoginInfo, owner: User) {
        const session = await queryRunner.manager.findOneBy(Session, { owner });
        if (!session) {
            const newSession = queryRunner.manager.create(Session, {
                owner,
                CMUUsername: cred.username,
                CMUPassword: cred.password,
                mangoToken: "",
            });
            await queryRunner.manager.save(Session, newSession);
        } else {
            session.CMUUsername = cred.username;
            session.CMUPassword = cred.password;
            await queryRunner.manager.save(Session, session);
        }
    }

    async signIn(cred: LoginInfo): Promise<JWTPayload | null> {
        if (!(await this._verifyCMU(cred)))
            return null;
        const { studentNo } = await this._reg.getInfo(cred);
        const user = await this._user.findOne({ where: { studentNo }, relations: ["courses"] });
        if (!user) return this.signUp(cred);
        return {
            id: user.id,
            studentNo,
            username: cred.username,
            password: cred.password
        };
    }

    async signUp(cred: LoginInfo): Promise<JWTPayload | null> {
        if (!(await this._verifyCMU(cred)))
            return null;
        const { studentNo, givenName, middleName, familyName } = await this._reg.getInfo(cred);
        let user = await this._user.findOneBy({ studentNo });
        if (user) return this.signIn(cred);

        const queryRunner = this._ds.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            user = queryRunner.manager.create(User, { 
                givenName, middleName, familyName, 
                studentNo,
                courses: []
            });
            user = await queryRunner.manager.save(user);
            user = await this._updateCourses(queryRunner, cred, user);
            await UserService._updateSession(queryRunner, cred, user);
            await UserService._createDefaultGroups(queryRunner, user);
            await UserService._createDefaultEvents(queryRunner, user);
            await queryRunner.commitTransaction()
        } catch(e) {
            await queryRunner.rollbackTransaction();
            console.log(e.stack);
            throw new Error(`unable to sign up '${studentNo}' by (${e})`);
        } finally {
            await queryRunner.release();
        }

        return {
            id: user.id,
            studentNo,
            username: cred.username,
            password: cred.password
        };
    }
}