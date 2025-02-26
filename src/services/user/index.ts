import { DataSource, QueryRunner } from "typeorm";
import { RegCMUFetcher, StudentInfo } from "../../fetcher/reg-cmu.js";
import { JWTPayload } from "../../routes/calendar/index.js";
import { UserTransaction } from "./transaction.js";
import { User } from "../../models/user.entity.js";
import { CalendarTransaction } from "../calendar/transaction.js";
import { MangoClient } from "../../client/mango.js";
import { Session } from "../../models/session.entity.js";

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
    updateMangoToken(userId: number, token: string): Promise<boolean>;
    addFCMToken(userId: number, token: string, deviceName: string): Promise<{id: string, deviceName: string}>;
    listFCMTokens(userId: number): Promise<{id: string, deviceName: string}[]>;
    deleteFCMToken(userId: number, tokenId: string): Promise<boolean>;
}

export class UserService implements IUserService {
    private _ds: DataSource;
    constructor(dataSource: DataSource) {
        this._ds = dataSource;
    }

    private async _isStudentExist(
        studentNo: number
    ): Promise<boolean> {
        const student = await this._ds.manager.findOneBy(User, { studentNo });
        return student !== null;
    }

    public async auth(cred: LoginInfo): Promise<JWTPayload> {
        const queryRunner = this._ds.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const reg = new RegCMUFetcher(cred);
            const student = await reg.getStudent();
            const userPromise = (await this._isStudentExist(student.studentNo)) ?
                UserService._signIn(queryRunner, student) : 
                UserService._signUp(reg, queryRunner, cred, student);
            const user = await userPromise;
            await queryRunner.commitTransaction();
            return user;
        } catch(error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }

    private static async _signIn(queryRunner: QueryRunner, { studentNo }: StudentInfo): Promise<JWTPayload> {
        const signInTrans = new UserTransaction("sign in", queryRunner);
        await signInTrans.initByStudentNo(studentNo);
        return signInTrans.finalize();
    }

    private static async _signUp(
        reg: RegCMUFetcher, 
        queryRunner: QueryRunner, 
        cred: LoginInfo,
        student: StudentInfo
    ): Promise<JWTPayload> {
        const courses = await reg.getCourses();
        const signUpTrans = new UserTransaction("sign up", queryRunner);
        await signUpTrans.initByStudentInfo(student, cred);
        await signUpTrans.updateCourses(courses);
        const authToken = await signUpTrans.finalize();
        const calendarTrans = new CalendarTransaction(queryRunner, authToken.id);
        const courseGroups = await calendarTrans.generateDefaultGroup(courses);
        await calendarTrans.generateClassEvent(courses, courseGroups);
        await calendarTrans.generateMidtermExamEvent(courses, courseGroups);
        await calendarTrans.generateFinalExamEvent(courses, courseGroups);
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

    public async updateMangoToken(userId: number, token: string): Promise<boolean> {
        const user = await this._ds.manager.findOneBy(User, { id: userId });
        if (!user)
            return false;
        const mango = new MangoClient(token);
        if (!(await mango.validate()))
            return false;
        user.mangoToken = token;
        const result = await this._ds.manager.save(user);
        return result !== null;
    }

    public async addFCMToken(userId: number, token: string, deviceName: string): Promise<{id: string, deviceName: string}> {
        const user = await this._ds.manager.findOneBy(User, { id: userId });
        if (!user) {
            throw new Error("User not found");
        }

        // Check if user has less than 10 tokens
        const existingTokens = await this._ds.manager.count(Session, { where: { owner: { id: userId } } });
        if (existingTokens >= 10) {
            throw new Error("Maximum number of FCM tokens reached (10)");
        }

        const session = this._ds.manager.create(Session, {
            fcmToken: token,
            deviceName: deviceName,
            owner: user
        });

        const savedSession = await this._ds.manager.save(session);
        return {
            id: savedSession.id,
            deviceName: savedSession.deviceName
        };
    }

    public async listFCMTokens(userId: number): Promise<{id: string, deviceName: string}[]> {
        const sessions = await this._ds.manager.find(Session, {
            where: { owner: { id: userId } },
            select: ["id", "deviceName"]
        });
        return sessions;
    }

    public async deleteFCMToken(userId: number, tokenId: string): Promise<boolean> {
        const result = await this._ds.manager.delete(Session, {
            id: tokenId,
            owner: { id: userId }
        });
        return result.affected === 1;
    }
}
