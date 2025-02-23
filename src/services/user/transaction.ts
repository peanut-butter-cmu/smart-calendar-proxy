import { CourseInfo, StudentInfo } from "../../fetcher/reg-cmu.js";
import { User } from "../../models/User.entity.js";
import { EntityManager, QueryRunner } from "typeorm";
import { LoginInfo } from "../user.service.js";
import { Course } from "../../models/Course.entity.js";

export class UserTransaction {
    private _manager: EntityManager;
    private _user: User | null;
    private _name: "sign in" | "sign up";
    constructor(name: "sign in" | "sign up", queryRunner: QueryRunner) {
        this._manager = queryRunner.manager;
        this._user = null;
        this._name = name;
    }

    private async _userInitValidation() {
        if (this._user)
            return;
        throw new Error(`User not initialized in ${this._name}.`);
    }

    public async initByStudentInfo(
        {givenName, middleName, familyName, studentNo}: StudentInfo, 
        {username, password}: LoginInfo
    ): Promise<User> {
        this._user = this._manager.create(User, {
            givenName, middleName, familyName, studentNo,
            CMUUsername: username, CMUPassword: password,
            mangoToken: ""
        });
        this._user = await this._manager.save(this._user);
        if (!this._user)
            throw new Error(`Unable to ${this._name}.`);
        return this._user;
    }

    public async initByStudentNo(studentNo: number): Promise<User> {
        this._user = await this._manager.findOneBy(User, { studentNo });
        if (!this._user)
            throw new Error(`Unable to ${this._name}.`);
        return this._user;
    }

    public async updateCourses(courses: CourseInfo[]) {
        await this._userInitValidation();
        const existingCourses = await this._manager.find(Course, {
            where: courses.map(course => ({
                code: course.courseNo,
                lecSection: course.section.lec,
                labSection: course.section.lab
            }))
        });
        const existingCoursesSet = new Set(existingCourses.map(course => course.code +  course.lecSection + course.labSection));
        let newCourses = this._manager.create(Course, 
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
        newCourses = await this._manager.save(newCourses);
        this._user.courses = [...existingCourses, ...newCourses];
        await this._manager.save(this._user);
    }

    public async finalize(): Promise<User> {
        if (!this._user)
            throw new Error(`Unable to ${this._name}.`);
        return this._user;
    }
}