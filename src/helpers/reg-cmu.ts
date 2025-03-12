import { IOAuthClient } from "../client/oauth-cmu/base.js";
import { LoginInfo } from "../services/user.service.js";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { eachDayOfInterval } from "date-fns";
import dayjs, { Dayjs } from "dayjs";
import { CookieJar } from "tough-cookie";

export function formatDays(shortDays: string) {
    return {
        "-": [],
        "TBA": [],
        "Su": [0],
        "Mo": [1],
        "Tu": [2],
        "We": [3],
        "Th": [4],
        "Fr": [5],
        "Sa": [6],
        "MWF": [1, 3, 5],
        "TT": [2, 4],
        "M-F": [1, 2, 3, 4, 5],
        "M-Sa": [1, 2, 3, 4, 5, 6],
        "M-Su": [0, 1, 2, 3, 4, 5, 6],
        "MW": [1, 3],
        "WF": [3, 5],
        "MTu": [1, 2],
        "TuW": [2, 3],
        "WTh": [3, 4],
        "ThF": [4, 5],
        "MF": [1, 5],
        "MTT": [1, 2, 4],
        "MTuW": [1, 2, 3],
        "MWTh": [1, 3, 4],
        "MTuWF": [1, 2, 3, 5],
        "M-Th": [1, 2, 3, 4],
        "TuWTh": [2, 3, 4],
        "MTuThF": [1, 2, 4, 5],
        "TTF": [2, 4, 5],
        "MWThF": [1, 3, 4, 5],
        "TuF": [2, 5],
        "FSa": [5, 6],
        "Tu-F": [2, 3, 4, 5],
        "WThF": [3, 4, 5],
        "MTh": [1, 4],
        "TuSa": [2, 6],
        "TuWF": [2, 3, 5],
        "SaSu": [0, 6],
        "MSu": [0, 1],
        "FSu": [0, 5],
        "MTuTh": [1, 2, 4]
    }[shortDays] || []
}

export function courseScheduleDates(schedule_day: string, schedule_time: string, semester: { start: Date, end: Date }): { start: Date, end: Date }[] {
    const days = formatDays(schedule_day);
    const [ start, end ] = schedule_time.split('-').map(time => dayjs(time, "HHmm"));
    function setHMS(input: Date, hms: Dayjs): Date {
        return dayjs(input)
            .set("h", hms.hour())
            .set("m", hms.minute())
            .set("s", hms.second())
            .toDate();
    }
    return eachDayOfInterval(semester)
        .filter(date => days.includes(date.getDay()))
        .map(date => ({ start: setHMS(date, start), end: setHMS(date, end) }));
}

export function formatStartEndSec(timeRange: string): { start: number, end: number } {
    const [ start, end ] = timeRange
        .split("-")
        .map(time => dayjs(time, "HHmm"));
    const midnight = start.startOf("day");
    return {
        start: start.diff(midnight, "seconds"),
        end: end.diff(midnight, "seconds")
    };
}

export function formatREGDate(dateStr: string): Dayjs {
    const [dayStr, monthStr, yearStr] = dateStr.split(" ");
    const monthFormatted = {
        "jan": "01", "feb": "02", "mar": "03",
        "apr": "04", "may": "05", "jun": "06",
        "jul": "07", "aug": "08", "sep": "09",
        "oct": "10", "nov": "11", "dec": "12",
    }[monthStr.toLowerCase()];
    return dayjs(`${yearStr}-${monthFormatted}-${dayStr}`);
}

export function formatExamDate(day: string, timeRange: string): { start: Date, end: Date } | undefined {
    if (day === "Contact Lecturer" || day === "REGULAR EXAM or NONE")
        return;
    const date = formatREGDate(day);
    const { start, end } = formatStartEndSec(timeRange);
    function addBy(sec: number) {
        return date.clone().add(sec, "seconds").toDate();
    }
    return {
        start: addBy(start),
        end: addBy(end)
    };
}

export function createCMUAxios() {
    const jar = new CookieJar();
    return wrapper(axios.create({
        headers: { "User-Agent": process.env.REG_CLIENT_UAGENT },
        jar,
        timeout: 10000
    }));
}

/*
 * CMU OAuth
 */
export type OAuthPayload = {
    __LASTFOCUS: string,
    __EVENTTARGET: string,
    __EVENTARGUMENT: string,
    __VIEWSTATE: string,
    __VIEWSTATEGENERATOR: string,
    __EVENTVALIDATION: string
} & ({
    ScriptManager1: string,
    user: string,
    password: string,
    chkbxKeepmesignin: string,
    btnLogin_submit: string,
    __ASYNCPOST: string
} | {
    txtUser: string,
    btnLogin_next: string
});

export type OAuthState = {
viewState: string;
viewStateGenerator: string;
eventValidation: string;
};

export function createOAuthPayload(
    info: {
        username: string,
        password?: string
    },
    oauth: OAuthState
): OAuthPayload {
    return info.password ? {
        __LASTFOCUS: "",
        __EVENTTARGET: "",
        __EVENTARGUMENT: "",
        __VIEWSTATE: oauth.viewState,
        __VIEWSTATEGENERATOR: oauth.viewStateGenerator,
        __EVENTVALIDATION: oauth.eventValidation,
        ScriptManager1: "UpdatePanel1|btnLogin_submit",
        user: info.username,
        password: info.password,
        chkbxKeepmesignin: "on",
        btnLogin_submit: "Sign in",
        __ASYNCPOST: "true"
    } : {
        __LASTFOCUS: "",
        __EVENTTARGET: "",
        __EVENTARGUMENT: "",
        __VIEWSTATE: oauth.viewState,
        __VIEWSTATEGENERATOR: oauth.viewStateGenerator,
        __EVENTVALIDATION: oauth.eventValidation,
        txtUser: info.username,
        btnLogin_next: "Next"
    }
}

export function createLoginURL(): URL {
    return new URL(`${process.env.OAUTH_BASE_URL}/v1/Login/`)
}

export function createAuthorizationURL(): URL {
    return new URL(`${process.env.OAUTH_BASE_URL}/v1/Authorize.aspx`)
}

export class CMUOAuth {
    private _client: IOAuthClient;
    private _state: string;
    private _oauth?: OAuthState;
    constructor(client: IOAuthClient) {
        this._client = client;
        this._state = Math.random().toString(36).slice(2, 15);
    }

    private async _fetchSessionID() {
        const url = createAuthorizationURL();
        url.searchParams.append("response_type", process.env.REG_RESPONSE_TYPE);
        url.searchParams.append("client_id", process.env.REG_CLIENT_ID);
        url.searchParams.append("redirect_uri", process.env.REG_REDIRECT_URI);
        url.searchParams.append("scope", process.env.REG_SCOPE);
        url.searchParams.append("state", this._state);
        this._oauth = await this._client.getOAuthState(url, { manualRedirect: true });
    }

    private async _initOAuth() {
        await this._fetchSessionID();
        const url = createLoginURL();
        url.searchParams.append("continue", process.env.REG_OAUTH_CONTINUE);
        this._oauth = await this._client.getOAuthState(url);
    }

    private async _loginUser(username: string) {
        const url = createLoginURL();
        url.searchParams.append("continue", process.env.REG_OAUTH_CONTINUE);    
        this._oauth = await this._client.postOAuthState(
            url, createOAuthPayload({ username }, this._oauth!)
        );
    }

    private async _loginPwd(username: string, password: string): Promise<URL | null> {
        const url = createLoginURL();
        url.searchParams.append("continue", process.env.REG_OAUTH_CONTINUE);
        return this._client.postURL(
            url, createOAuthPayload({ username, password }, this._oauth!)
        ).catch(err => {
            console.error(err);
            return null;
        });
    }

    /* flow ของการ login ที่ oauth เป็นดังนี้
     * 1. เอา oauth states
     * 2. login ด้วย username
     * 3. login ด้วย password มันจะคืน redirect url พร้อม token
     * 4. ไปที่ redirect url นั้น เราก็จะได้ session id (cookie)
     */
    /**
     * Login with CMU Account
     * @param username CMU Username with @cmu.ac.th
     * @param password CMU Password
     * @throws Error if username or password is invalid
     */
    public async login({ username, password }: LoginInfo) {
        await this._initOAuth();
        await this._loginUser(username);
        const url = await this._loginPwd(username, password);
        if (!url)
            throw new Error("Invalid username or password");
        await this._client.getOAuthState(url);
    }
}