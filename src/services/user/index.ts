import { DataSource, QueryRunner } from "typeorm";
import { CourseInfo, RegCMUFetcher, StudentInfo } from "../../fetcher/reg-cmu.js";
import { JWTPayload } from "../../routes/calendar/index.js";
import { UserTransaction } from "./transaction.js";
import { CalendarTransaction } from "../calendar/transaction.js";

export enum GroupTitle {
    CMU = "CMU",
    CLASS = "Class",
    QUIZ = "Quiz",
    ASSIGNMENT = "Assignment",
    FINAL = "Final",
    MIDTERM = "Midterm",
    HOLIDAY = "Holiday",
    OWNER = "Owner"
}
export type LoginInfo = { username: string; password: string; };

export interface IUserService {
    auth(cred: LoginInfo): Promise<JWTPayload | null>;
}

export class UserService implements IUserService {
    private _ds: DataSource;
    constructor(dataSource: DataSource) {
        this._ds = dataSource;
    }

    public async auth(cred: LoginInfo): Promise<JWTPayload | null> {
        const reg = new RegCMUFetcher(cred);
        const queryRunner = this._ds.createQueryRunner();
        await queryRunner.connect();
        return await UserService._signIn(reg, queryRunner) || await UserService._signUp(reg, queryRunner, cred);
    }

    private static async _handleError<T, A extends any[]>(name: string, fn: (...args: A) => Promise<T>, ...args: A): Promise<T | null> {
        try {
            return fn(...args)
        } catch(err) {
            console.error(`${name}: error ${err}}`);
            return null;
        }
    }

    private static async _signIn(reg: RegCMUFetcher, queryRunner: QueryRunner): Promise<JWTPayload | null> {
        const maybeStudent = await UserService._handleError("SignIn", reg.getStudent);
        if (!maybeStudent)
            return null;
        const { studentNo } = maybeStudent;
        const signInTrans = new UserTransaction("SignIn", queryRunner);
        await signInTrans.initByStudentNo(studentNo);
        return signInTrans.finalize();
    }

    private static async _signUp(reg: RegCMUFetcher, queryRunner: QueryRunner, cred: LoginInfo): Promise<JWTPayload | null> {
        const maybeResult = await UserService._handleError("SignUp", () => Promise.all([reg.getStudent(), reg.getCourses()]));
        if (!maybeResult)
            return null;
        const [ student, courses ] = maybeResult;
        const signUpTrans = new UserTransaction("SignUp", queryRunner);
        await signUpTrans.initByStudentInfo(student);
        await signUpTrans.updateSession(cred);
        await signUpTrans.updateCourses(courses);
        const payload = await signUpTrans.finalize();
        if (!payload)
            return null;
        const calendarTrans = new CalendarTransaction(queryRunner, payload.id);
        await calendarTrans.init();
        await calendarTrans.generateDefaultGroup();
        await calendarTrans.generateClassEvent(courses);
        await calendarTrans.generateMidtermExamEvent(courses);
        await calendarTrans.generateFinalExamEvent(courses);
        await calendarTrans.finalize();
        return payload;
    }
}
