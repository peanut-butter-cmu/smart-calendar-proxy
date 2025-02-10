import { DataSource, QueryRunner } from "typeorm";
import { RegCMUFetcher } from "../../fetcher/reg-cmu.js";
import { JWTPayload } from "../../routes/calendar/index.js";
import { UserTransaction } from "./transaction.js";
import { User } from "../../models/user.entity.js";
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
export type UserInfo = {
    firstName: string;
    middleName: string;
    lastName: string;
    studentNo: number;
}

export interface IUserService {
    auth(cred: LoginInfo): Promise<JWTPayload | null>;
    userInfo(userId: number): Promise<UserInfo | null>;
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
        try {
            return await UserService._signIn(reg, queryRunner) || await UserService._signUp(reg, queryRunner, cred);
        } catch(err) {
            if (process.env.DEBUG)
                console.log(err.stack);
            console.error(`cred = ${JSON.stringify(cred)}, error = ${err}}`);
            return null;
        }
    }

    private static async _signIn(reg: RegCMUFetcher, queryRunner: QueryRunner): Promise<JWTPayload | null> {
        const { studentNo } = await reg.getStudent();
        const signInTrans = new UserTransaction("SignIn", queryRunner);
        await signInTrans.initByStudentNo(studentNo);
        return signInTrans.finalize();
    }

    private static async _signUp(reg: RegCMUFetcher, queryRunner: QueryRunner, cred: LoginInfo): Promise<JWTPayload | null> {
        const [ student, courses ] = await Promise.all([reg.getStudent(), reg.getCourses()]);
        const signUpTrans = new UserTransaction("SignUp", queryRunner);
        await signUpTrans.initByStudentInfo(student);
        await signUpTrans.updateSession(cred);
        await signUpTrans.updateCourses(courses);
        const authToken = await signUpTrans.finalize();
        if (!authToken)
            return null;
        const calendarTrans = new CalendarTransaction(queryRunner, authToken.id);
        await calendarTrans.init();
        const courseGroups = await calendarTrans.generateDefaultGroup(courses);
        await calendarTrans.generateClassEvent(courses, courseGroups);
        await calendarTrans.generateMidtermExamEvent(courses, courseGroups);
        await calendarTrans.generateFinalExamEvent(courses, courseGroups);
        await calendarTrans.finalize();
        return authToken;
    }

    public async userInfo(userId: number): Promise<UserInfo | null> {
        const user = await this._ds.manager.findOneBy(User, { id: userId });
        if (!user)
            return null;
        return {
            firstName: user.givenName,
            middleName: user.middleName,
            lastName: user.familyName,
            studentNo: user.studentNo
        }
    }
}
