import { CalendarService } from "../services/calendar.service.js";
import { SharedCalendarService } from "../services/sharedCalendar.service.js";
import { Response } from "express";
import { JWTRequest } from "../types/global.js";
import { DataSource } from "typeorm";
import * as swagger from "../types/swagger.js";
import { createPaginationParam } from "../helpers/pagination.js";
import { fCalendarEvent } from "../helpers/formatter.js";

export class CalendarController {
    private _service: CalendarService
    private _servicea: SharedCalendarService
    constructor(ds: DataSource) {
        this._service = new CalendarService(ds);
        this._servicea = new SharedCalendarService(ds);
    }

    getGroups = async (
        req: JWTRequest,
        res: Response<swagger.EventGroup[] | swagger.Error>
    ) => {
        try {
            res.send(await this._service.getGroupsByOwner(req.auth.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getGroup = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.EventGroup | swagger.Error>
    ) => {
        try {
            res.send(await this._service.getGroupByOwner(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    editGroup = async (
        req: JWTRequest<{ id: number }, object, swagger.EventGroupEdit>,
        res: Response<swagger.EventGroup | swagger.Error>
    ) => {
        try {
            res.send(await this._service.editGroupByOwner(req.auth.id, req.params.id, req.body));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getEvents = async (
        req: JWTRequest<object, { startDate: Date, endDate: Date } & swagger.PaginationRequest>,
        res: Response<swagger.Pagination<swagger.CalendarEvent> | swagger.Error>
    ) => {
        try {
            res.send(await this._service.getEventsByOwner(req.auth.id, {
                ...req.query,
                ...createPaginationParam("calendar", req.query)
            }));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.CalendarEvent | swagger.Error>
    ) => {
        try {
            res.send(await this._service.getEventByOwner(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    addEvent = async (
        req: JWTRequest<object, object, swagger.CalendarEventNew>,
        res: Response<swagger.CalendarEvent | swagger.Error>
    ) => {
        try {
            res.send(fCalendarEvent(await this._service.addEvent(req.auth.id, req.body)));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    editEvent = async (
        req: JWTRequest<{ id: number }, object, swagger.CalendarEventEdit>,
        res: Response<swagger.CalendarEvent | swagger.Error>
    ) => {
        try {
            res.send(await this._service.editEventByID(
                req.auth.id, req.params.id, req.body
            ));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    deleteEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            res.send(await this._service.deleteEventByID(
                req.auth.id, req.params.id
            ));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getSharedEvents = async (
        req: JWTRequest<object, swagger.PaginationRequest>,
        res: Response<swagger.Pagination<swagger.SharedEvent> | swagger.Error>
    ) => {
        try {
            res.send((await this._servicea.getSharedEventsByOwner(req.auth.id, {
                ...createPaginationParam("sharedEvents", req.query)
            })));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.SharedEvent | swagger.Error>
    ) => {
        try {
            res.send(await this._servicea.getSharedEventByID(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    addSharedEvent = async (
        req: JWTRequest<object, object, swagger.SharedEventNew>,
        res: Response<swagger.SharedEvent | swagger.Error>
    ) => {
        try {
            res.send(await this._servicea.addSharedEvent(req.auth.id, req.body));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    deleteSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            res.send(await this._servicea.deleteSharedEventByID(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    acceptSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            res.send(await this._servicea.acceptSharedEventByID(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    rejectSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            res.send(await this._servicea.rejectSharedEventByID(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    arrangeSharedEvent = async (
        req: JWTRequest<{ id: number }>,
        res: Response<swagger.SharedEvent | swagger.Error>
    ) => {
        try {
            res.send(await this._servicea.arrangeSharedEventByID(req.auth.id, req.params.id));
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
            res.send(await this._servicea.saveSharedEventByID(req.auth.id, req.params.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }
}
