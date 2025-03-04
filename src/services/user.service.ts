import { DataSource, Repository } from "typeorm";
import { RegCMUFetcher } from "../fetcher/reg-cmu.js";
import { User } from "../models/user.entity.js";
import { MangoClient } from "../client/mango.js";
import { Session } from "../models/session.entity.js";
import { CalendarService } from "./calendar.service.js";
import { SyncService } from "./sync.service.js";

export type LoginInfo = { username: string; password: string; };

export enum LoginError {
    INVALID_USER_CRED = "Invalid user credentials.",
};

export class UserService {
    private _ds: DataSource;
    private _user: Repository<User>;
    private _calendarService: CalendarService;
    private _syncService: SyncService;
    private _session: Repository<Session>;

    constructor(dataSource: DataSource, services: { calendarService?: CalendarService, syncService?: SyncService } = {}) {
        this._ds = dataSource;
        this._user = dataSource.getRepository(User);
        this._session = dataSource.getRepository(Session);
        this._calendarService = services.calendarService || new CalendarService(dataSource, this);
        this._syncService = services.syncService || new SyncService(dataSource, { userService: this, calendarService: this._calendarService });
    }

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
        await this._syncService.syncUserEvents(user.id);
        return user;
    }

    public async getUserById(userId: number, params: { credential?: boolean } = {}): Promise<User> {
        const user = await this._user.findOne({ 
            where: { id: userId }, 
            select: params.credential ? { id: true, CMUUsername: true, CMUPassword: true, mangoToken: true } : undefined
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
            throw new Error(UserServiceError.INVALID_MANGO_TOKEN);
        await this._user.update({ id: userId }, this._user.create({ mangoToken: token }));
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
}

export enum UserServiceError {
    USER_NOT_FOUND = "User not found.",
    NO_MANGO_TOKEN = "No mango token specified.",
    INVALID_MANGO_TOKEN = "Invalid mango token."
}
