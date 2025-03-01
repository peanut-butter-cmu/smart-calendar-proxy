import { DataSource, Repository } from "typeorm";
import { Session } from "../models/session.entity.js";

export class SessionService {
    private _session: Repository<Session>;

    constructor(dataSource: DataSource) {
        this._session = dataSource.getRepository(Session);
    }

    public async findByUserId(userId: number): Promise<Session[]> {
        return this._session.find({
            where: { owner: { id: userId } },
            relations: ["owner"]
        });
    }

    public async findByUserIds(userIds: number[]): Promise<Session[]> {
        if (userIds.length === 0) return [];
        
        return this._session
            .createQueryBuilder("session")
            .leftJoinAndSelect("session.owner", "owner")
            .where("owner.id IN (:...ids)", { ids: userIds })
            .getMany();
    }

    public async findAll(): Promise<Session[]> {
        return this._session.find({
            relations: ["owner"]
        });
    }

    public async create(userId: number, fcmToken: string, deviceName: string): Promise<Session> {
        const session = this._session.create({
            fcmToken,
            deviceName,
            owner: { id: userId }
        });
        return this._session.save(session);
    }

    public async removeByToken(token: string): Promise<void> {
        const ses = await this._session.findOneBy({ fcmToken: token });
        if (!ses)
            throw new Error("Session not found.");
        await this._session.remove(ses);
    }

    public async removeByTokens(tokens: string[]): Promise<void> {
        const sess = await this._session.findBy(tokens.map(t => ({fcmToken: t})));
        if (sess.length !== tokens.length)
            throw new Error("Some Session not found.");
        await this._session.remove(sess);
    }
}
