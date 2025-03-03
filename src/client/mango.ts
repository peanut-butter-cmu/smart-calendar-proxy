import { createMangoAxios } from "../helpers/mango.js";
import { AxiosInstance } from "axios";

export type MangoCourse = {
    id: number;
    name: string;
    course_code: string;
    created_at: string;
    calendar: {
        ics: string;
    }
};

export type MangoAssignment = {
    id: number;
    name: string;
    due_at: string;
};

export class MangoClient {
    private _axios: AxiosInstance;
    private _token: string;
    constructor(token: string) {
        this._axios = createMangoAxios();
        this._token = token;
    }

    public async validate(): Promise<boolean> {
        const resp = await this._axios.get(`${process.env.MANGO_BASE_URL}/users/self`, {
            headers: { Authorization: `Bearer ${this._token}` },
            validateStatus: () => true,
        });
        return resp.status === 200;
    }

    public async getCourses(): Promise<MangoCourse[]> {
        const resp = await this._axios.get(`${process.env.MANGO_BASE_URL}/courses`, {
            headers: { Authorization: `Bearer ${this._token}` },
        });
        return resp.data;
    }
    
    public async getAssignments(courseId: number): Promise<MangoAssignment[]> {
        const resp = await this._axios.get(`${process.env.MANGO_BASE_URL}/courses/${courseId}/assignments`, {
            headers: { Authorization: `Bearer ${this._token}` },
        });
        return resp.data;
    }
    
}