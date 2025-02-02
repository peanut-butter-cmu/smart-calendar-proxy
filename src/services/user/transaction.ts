import { CourseInfo, StudentInfo } from "../../fetcher/reg-cmu.js";
import { User } from "../../models/user.entity.js";
import { JWTPayload } from "../../routes/calendar/index.js";
import { EntityManager, QueryRunner } from "typeorm";
import { Session } from "../../models/session.entity.js";
import { LoginInfo } from "./index.js";
import { Course } from "../../models/course.entity.js";

export class UserTransaction {
    private _qRnr: QueryRunner;
    private _manager: EntityManager;
    private _user: { instance: User | null, username: string, password: string };
    private _name: "SignIn" | "SignUp";
    constructor(name: "SignIn" | "SignUp", queryRunner: QueryRunner) {
        this._qRnr = queryRunner;
        this._manager = queryRunner.manager;
        this._user = { instance: null, username: "", password: "" };
        this._name = name;
    }

    private _userInitValidation() {
        if (this._user.instance)
            return;
        this._qRnr.rollbackTransaction();
        throw new Error(`user not init in ${this._name}`);
    }

    private _rollbackIfException(error: Error) {
        this._qRnr.rollbackTransaction();
        throw error;
    }

    public async initByStudentInfo({givenName, middleName, familyName, studentNo}: StudentInfo): Promise<User> {
        await this._qRnr.startTransaction();
        this._user.instance = this._manager.create(User, {
            givenName, middleName, familyName, studentNo
        });
        return this._user.instance = await this._manager.save(this._user.instance);
    }

    public async initByStudentNo(studentNo: number): Promise<User> {
        await this._qRnr.startTransaction();
        return this._user.instance = await this._manager.findOneBy(User, { studentNo });
    }

    public async rollback() {
        await this._qRnr.rollbackTransaction();
    }

    public async updateCourses(courses: CourseInfo[]) {
        this._userInitValidation();
        const existingCourses = await this._manager.findBy(Course, courses.map(course => ({
            code: course.courseNo,
            lecSection: course.section.lec,
            labSection: course.section.lab
        })));
        const existingCoursesMap = new Map<{
            code: string, 
            lecSection: string, 
            labSection: string
        }, boolean>(existingCourses.map(course => [{
            code: course.code,
            lecSection: course.lecSection,
            labSection: course.labSection
        }, true]));
        const newCourses = courses.filter(course => !existingCoursesMap.has({
            code: course.courseNo,
            lecSection: course.section.lec,
            labSection: course.section.lab
        })).map(({courseNo, section, title, schedule}) => ({
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
        })).map(course => this._manager.create(Course, course));
        await this._manager.save(newCourses);
    }

    public async updateSession(cred: LoginInfo) {
        this._userInitValidation();
        let session = await this._manager.findOneBy(Session, { owner: this._user.instance }).catch(this._rollbackIfException);
        if (!session) {
            session = this._manager.create(Session, {
                owner: this._user.instance,
                CMUUsername: cred.username,
                CMUPassword: cred.password,
                mangoToken: "",
            });
        } else {
            session.CMUUsername = cred.username;
            session.CMUPassword = cred.password;
        }
        this._user.username = cred.username;
        this._user.password = cred.password;
        await this._manager.save(Session, session).catch(this._rollbackIfException);
    }

    public async finalize(): Promise<JWTPayload | null> {
        if (!this._user.instance) {
            await this._qRnr.rollbackTransaction();
            return null;
        }
        await this._qRnr.commitTransaction();
        return {
            id: this._user.instance.id,
            username: this._user.username,
            password: this._user.password
        }
    }
}