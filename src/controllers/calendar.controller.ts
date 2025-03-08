import { CalendarService } from "../services/calendar.service.js";
import { SharedCalendarService } from "../services/sharedCalendar.service.js";
import { Response } from "express";
import { JWTRequest } from "../types/global.js";
import { DataSource } from "typeorm";
import * as swagger from "../types/swagger.js";
import { createPaginationParam } from "../helpers/pagination.js";
import { fCalendarEvent, fSharedEvent, fSharedEventPagination, fCalendarEventPagination } from "../helpers/formatter.js";
import { UserService } from "../services/user.service.js";

export class CalendarController {
    private _calendar: CalendarService
    private _shared: SharedCalendarService
    private _user: UserService;
    constructor(ds: DataSource) {
        this._shared = new SharedCalendarService(ds);
        this._user = new UserService(ds);
        this._calendar = new CalendarService(ds, this._user);
    }

    getGroups = async (
        req: JWTRequest,
        res: Response<swagger.EventGroup[] | swagger.Error>
    ) => {
        try {
            res.send(await this._calendar.getGroupsByOwner(req.auth.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getGroup = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.EventGroup | swagger.Error>
    ) => {
        try {
            res.send(await this._calendar.getGroupByOwner(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    editGroup = async (
        req: JWTRequest<{ id: number }, object, swagger.EventGroupEdit>,
        res: Response<swagger.EventGroup | swagger.Error>
    ) => {
        try {
            res.send(await this._calendar.editGroupByOwner(req.auth.id, req.params.id, req.body));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getEvents = async (
        req: JWTRequest<object, { startDate: Date, endDate: Date } & swagger.PaginationRequest>,
        res: Response<swagger.Pagination<swagger.CalendarEvent> | swagger.Error>
    ) => {
        try {
            res.send(fCalendarEventPagination(await this._calendar.getEventsByOwner(req.auth.id, {
                ...req.query,
                ...createPaginationParam("calendar", req.query)
            })));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.CalendarEvent | swagger.Error>
    ) => {
        try {
            res.send(fCalendarEvent(await this._calendar.getEventByOwner(req.auth.id, req.params.id)));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    addEvent = async (
        req: JWTRequest<object, object, swagger.CalendarEventNew>,
        res: Response<swagger.CalendarEvent | swagger.Error>
    ) => {
        try {
            res.send(fCalendarEvent(await this._calendar.addEvent(req.auth.id, req.body)));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    editEvent = async (
        req: JWTRequest<{ id: number }, object, swagger.CalendarEventEdit>,
        res: Response<swagger.CalendarEvent | swagger.Error>
    ) => {
        try {
            res.send(fCalendarEvent(await this._calendar.editEventByID(req.auth.id, req.params.id, req.body)));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    deleteEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._calendar.deleteEventByID(req.auth.id, req.params.id);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getSharedEvents = async (
        req: JWTRequest<object, swagger.PaginationRequest>,
        res: Response<swagger.Pagination<swagger.SharedEvent> | swagger.Error>
    ) => {
        try {
            res.send(
                fSharedEventPagination(
                    await this._shared.getSharedEventsByOwner(req.auth.id, { ...createPaginationParam("sharedEvents", req.query) })
                )
            );
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.SharedEvent | swagger.Error>
    ) => {
        try {
            res.send(fSharedEvent(await this._shared.getSharedEventByID(req.auth.id, req.params.id)));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    addSharedEvent = async (
        req: JWTRequest<object, object, swagger.SharedEventNew>,
        res: Response<swagger.SharedEvent | swagger.Error>
    ) => {
        try {
            res.send(fSharedEvent(await this._shared.addSharedEvent(req.auth.id, req.body)));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    deleteSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._shared.deleteSharedEventByID(req.auth.id, req.params.id);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    acceptSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._shared.acceptSharedEventByID(req.auth.id, req.params.id);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    rejectSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._shared.rejectSharedEventByID(req.auth.id, req.params.id);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    arrangeSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.SharedEvent | swagger.Error>
    ) => {
        try {
            res.send(fSharedEvent(await this._shared.arrangeSharedEventByID(req.auth.id, req.params.id)));
        } catch (error) {
            const message = (error as Error).message;
            if (message === "No suitable time slots found for all members.")
                res.status(409);
            else
                res.status(400);
            res.send({ message });
        }
    }

    saveSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.SharedEvent | swagger.Error>
    ) => {
        try {
            res.send(fSharedEvent(await this._shared.saveSharedEventByID(req.auth.id, req.params.id)));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }
}
