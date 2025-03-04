import { Request } from "express";

export type JWTPayload = {
    id: number;
};

export type JWTRequest<Param = object, Query = object, Body = object> = Request<Param, object, Body, Query> & { auth: JWTPayload; };

export type Pagination<T> = {
    items: T[];
    total: number;
    limit: number;
    offset: number;
};
