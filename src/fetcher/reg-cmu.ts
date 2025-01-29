import { IRegClient } from "../client/reg-cmu/base.js";
import { CMUOAuth } from "@/helpers/reg-cmu.js";
import { LoginInfo } from "@/services/user.js";

export type StudentInfo = {
    givenName: string,
    middleName: string,
    familyName: string,
    studentNo: number
};

export type CourseInfo = {
    courseNo: string;
    section: {
        lec: string;
        lab: string;
    };
    title: string;
    schedule: {
        days: number[];   // DayJS format
        start: number; // seconds after 00:00
        end: number;   // seconds after 00:00
        midterm?: { start: Date, end: Date };
        final?: { start: Date, end: Date };
    };
    credit: {
        lec: number;
        lab: number;
    };
};

export class RegCMUFetcher {
    private _reg: IRegClient;
    private _oauth: CMUOAuth;
    constructor(client: IRegClient, oauth: CMUOAuth) {
        this._reg = client;
        this._oauth = oauth;
    }

    public async getInfo(cred: LoginInfo): Promise<StudentInfo> {
        await this._oauth.login(cred);
        const url = new URL(process.env.REG_BASE_URL);
        url.pathname = "/registrationoffice/student/main.php";
        url.searchParams.append("mainfile", "studentprofile");
        url.searchParams.append("page", "personal");
        return this._reg.getStudentInfo(url);
    }

    public async getCourses(cred: LoginInfo): Promise<CourseInfo[]> {
        await this._oauth.login(cred);
        const url = new URL(process.env.REG_BASE_URL);
        url.pathname = "/registrationoffice/student/calendar_exam/";
        return this._reg.getCourses(url);
    }
}