import { AxiosRegClient } from "../client/reg-cmu/axios.js";
import { IRegClient } from "../client/reg-cmu/base.js";
import { CMUOAuth, createCMUAxios } from "../helpers/reg-cmu.js";
import { AxiosOAuthClient } from "../client/oauth-cmu/axios.js";
import { LoginInfo } from "../services/user.service.js";

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
    private _cred: LoginInfo;
    constructor(cred: LoginInfo) {
        const axios = createCMUAxios();
        this._reg = new AxiosRegClient(axios);
        this._oauth = new CMUOAuth(new AxiosOAuthClient(axios));
        this._cred = cred;
    }

    public async validate(): Promise<Boolean> {
        try {
            await this._oauth.login(this._cred);
            return true;
        } catch(e) {
            if (process.env.DEBUG)
                console.log(e.stack);
            return false;
        }
    }

    public async getStudent(): Promise<StudentInfo> {
        await this._oauth.login(this._cred);
        const url = new URL(process.env.REG_BASE_URL);
        url.pathname = "/registrationoffice/student/main.php";
        url.searchParams.append("mainfile", "studentprofile");
        url.searchParams.append("page", "personal");
        return this._reg.getStudentInfo(url);
    }

    public async getCourses(): Promise<CourseInfo[]> {
        await this._oauth.login(this._cred);
        const url = new URL(process.env.REG_BASE_URL);
        url.pathname = "/registrationoffice/student/calendar_exam/";
        return this._reg.getCourses(url);
    }
}