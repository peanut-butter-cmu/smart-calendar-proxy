import { Request } from "express";

export type JWTPayload = {
    id: number;
};

export type JWTRequest<Param = {}, Query = {}, Body = {}> = Request<Param, any, Body, Query> & { auth: JWTPayload; };
