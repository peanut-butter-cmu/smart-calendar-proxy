import { DataSource, Not, Repository } from "typeorm";
import { SharedEvent, SharedEventStatus } from "../models/sharedEvent.entity.js";
import { SharedEventInvite, InviteStatus } from "../models/sharedEventInvite.entity.js";
import { NotificationService } from "./notification.service.js";
import { NotificationType } from "../models/notification.entity.js";
import { User } from "../models/user.entity.js";
import * as swagger from "../types/swagger.js";
import { fCMUEmail, fSharedEvent } from "../helpers/formatter.js";

export class SharedCalendarService {
    private _shared: Repository<SharedEvent>;
    private _invite: Repository<SharedEventInvite>;
    private _user: Repository<User>;
    private _notificationService: NotificationService;
    constructor(dataSource: DataSource) {
        this._shared = dataSource.getRepository(SharedEvent);
        this._invite = dataSource.getRepository(SharedEventInvite);
        this._user = dataSource.getRepository(User);
        this._notificationService = new NotificationService(dataSource);
    }

    public async getSharedEventsByOwner(ownerId: number, params: { limit: number, offset: number }): Promise<swagger.Pagination<swagger.SharedEvent>> {
        const user = await this._user.findOneBy({ id: ownerId });
        if (!user) throw new Error("User not found.");
        const [events, total] = await this._shared.findAndCount({
            where: [
                { status: Not(SharedEventStatus.DELETED), owner: { id: ownerId } }, 
                { status: Not(SharedEventStatus.DELETED), invites: { email: fCMUEmail(user.CMUUsername) } },
            ],
            relations: ["invites", "members", "events", "owner"],
            take: params.limit,
            skip: params.offset,
            order: { id: "DESC" }
        });
        return {
            sharedEvents: events.map(fSharedEvent),
            pagination: {
                total,
                limit: params.limit,
                offset: params.offset
            }
        };
    }
    
    public async getSharedEventByID(ownerId: number, eventId: number): Promise<swagger.SharedEvent> {
        const user = await this._user.findOneBy({ id: ownerId });
        if (!user)
            throw new Error("User not found.");
        const event = await this._shared.findOne({
            where: [
                { id: eventId, status: Not(SharedEventStatus.DELETED), owner: { id: ownerId } }, 
                { id: eventId, status: Not(SharedEventStatus.DELETED), invites: { email: fCMUEmail(user.CMUUsername) } },
            ],
            relations: ["invites", "members", "events", "owner"],
            order: { id: "DESC" }
        });
        if (!event)
            throw new Error("Event not found.");
        return fSharedEvent(event);
    }

    async addSharedEvent(ownerId: number, params: {
        title: string;
        reminders: number[];
        idealDays: number[];
        idealTimeRange: { 
            startDate: Date;
            endDate: Date;
            dailyStartMin: number;
            dailyEndMin: number;
        },
        invites: string[];
        duration: number
    }): Promise<swagger.SharedEvent> {
        const user = await this._user.findOneBy({ id: ownerId });
        if (!user)
            throw new Error("User not found.");
        if (params.invites.some(email => fCMUEmail(user.CMUUsername) === email))
            throw new Error("Cannot invite owner into thier own event.");
        const savedEvent = await this._shared.save(
            this._shared.create({
                owner: { id: ownerId },
                title: params.title,
                reminders: params.reminders,
                idealDays: params.idealDays,
                idealTimeRange: params.idealTimeRange,
                duration: params.duration,
                status: SharedEventStatus.PENDING,
                members: [user],
                invites: []
            })
        );
        savedEvent.invites = await this._invite.save(
            this._invite.create(params.invites.map(email => ({
                event: { id: savedEvent.id },
                email
            })
        )));
        await this._notificationService.notifyByEmails(
            params.invites,
            NotificationType.EVENT_CREATED,
            { eventId: savedEvent.id }
        );
        return fSharedEvent(savedEvent);
    }

    async editSharedEventByID(ownerId: number, id: number, params: swagger.SharedEventEdit): Promise<swagger.SharedEvent> {
        console.log([ownerId, id, params]);
        throw new Error("Not implemented");
    }

    async deleteSharedEventByID(ownerId: number, id: number): Promise<void> {
        const event = await this._shared.findOne({
            where: {
                id, 
                status: Not(SharedEventStatus.DELETED),
                owner: { id: ownerId }
            },
            relations: ["members"]
        });
        if (!event) throw new Error("Event not found.");
        await this._shared.save({
            status: SharedEventStatus.DELETED
        });
        await this._notificationService.notifyByEmails(
            event.members.map(member => member.CMUUsername),
            NotificationType.EVENT_DELETED,
            { eventId: event.id }
        )
    }

    async _handleInvite(status: InviteStatus.ACCEPTED | InviteStatus.REJECTED, userId: number, eventId: number) {
        const user = await this._user.findOneBy({ id: userId });
        if (!user)
            throw new Error("User not found.");
        const email = fCMUEmail(user.CMUUsername);
        const event = await this._shared.findOne({
            where: {
                id: eventId, 
                status: SharedEventStatus.PENDING,
                invites: { 
                    email: email,
                    status: InviteStatus.PENDING
                }
            },
            relations: ["owner", "invites", "members"]
        });
        if (!event)
            throw new Error("Invite not found.");
        if (event.owner.id === userId)
            throw new Error(`Cannot get ${status} by your own event.`);
        const invite = event.invites.find(invite => invite.email === email);
        invite.status = status;
        await this._invite.save(invite);
        if (status === InviteStatus.ACCEPTED) {
            event.members.push(user);
            await this._shared.save(event);
        }
        await this._notificationService.notifyByIDs(
            [event.owner.id],
            InviteStatus.ACCEPTED ? NotificationType.INVITE_ACCEPTED : NotificationType.INVITE_REJECTED,
            { email: fCMUEmail(user.CMUUsername) }
        );
    }

    async acceptSharedEventByID(ownerId: number, eventId: number): Promise<void> {
        return this._handleInvite(InviteStatus.ACCEPTED, ownerId, eventId);
    }

    async rejectSharedEventByID(ownerId: number, eventId: number): Promise<void> {
        return this._handleInvite(InviteStatus.REJECTED, ownerId, eventId);
    }

    async arrangeSharedEventByID(ownerId: number, eventId: number): Promise<swagger.SharedEvent> {
        console.log([ownerId, eventId]);
        throw new Error("Not implemented.");
    }
}
