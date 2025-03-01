import { Request } from "express";

export type JWTPayload = {
    id: number;
};

export type JWTRequest<Param = object, Query = object, Body = object> = Request<Param, object, Body, Query> & { auth: JWTPayload; };
