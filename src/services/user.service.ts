import { DataSource, QueryRunner } from "typeorm";
import { RegCMUFetcher, StudentInfo } from "../fetcher/reg-cmu.js";
import { JWTPayload } from "../types/global.js";
import { UserTransaction } from "./user/transaction.js";
import { User } from "../models/User.entity.js";
import { CalendarTransaction } from "./calendar/transaction.js";
import { MangoClient } from "../client/mango.js";
import { Session } from "../models/Session.entity.js";
import { fJWTPayload } from "../helpers/formatter.js";

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

export class UserService {
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
        return fJWTPayload(await signInTrans.finalize());
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
        const user = await signUpTrans.finalize();
        const calendarTrans = new CalendarTransaction(queryRunner, user);
        const courseGroups = await calendarTrans.generateDefaultGroup(courses);
        await calendarTrans.generateClassEvent(courses, courseGroups);
        await calendarTrans.generateMidtermExamEvent(courses, courseGroups);
        await calendarTrans.generateFinalExamEvent(courses, courseGroups);
        return fJWTPayload(user);
    }
    public async getUserById(userId: number): Promise<User> {
        const user = await this._ds.manager.findOneBy(User, { id: userId });
        if (!user)
            throw new Error("User not found.");
        return user;
    }
    public async updateMangoToken(userId: number, token: string): Promise<void> {
        const user = await this._ds.manager.findOneBy(User, { id: userId });
        if (!user)
            throw new Error("User not found.");
        const mango = new MangoClient(token);
        if (!(await mango.validate()))
            throw new Error("Invalid mango token.");
        await this._ds.manager.save({
            mangoToken: token
        });
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
    public async deleteFCMToken(userId: number, tokenId: string): Promise<void> {
        const result = await this._ds.manager.delete(Session, {
            id: tokenId,
            owner: { id: userId }
        });
        if (result.affected !== 1)
            throw new Error("Unable to delete given FCM token.");
    }
}
