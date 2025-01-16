import { Auth } from "@/auth/base.js";
import { CalendarEvent } from "@/models/event.js";
import { Fetcher } from "./base.js";
import { RegClient } from "@/client/reg-cmu.js";

const OAUTH_BASE_URL = process.env.OAUTH_BASE_URL!;
const REG_BASE_URL = process.env.REG_BASE_URL!;
const REG_RESPONSE_TYPE = process.env.REG_RESPONSE_TYPE!;
const REG_CLIENT_ID = process.env.REG_CLIENT_ID!;
const REG_REDIRECT_URI = process.env.REG_REDIRECT_URI!;
const REG_SCOPE = process.env.REG_SCOPE!;
const REG_OAUTH_CONTINUE = process.env.REG_OAUTH_CONTINUE!;

export type REGPayload = {
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
        __ASYNCPOST: boolean
    } | {
        txtUser: string,
        btnLogin_next: string
    });

export type OAuthState = {
    viewState: string;
    viewStateGenerator: string;
    eventValidation: string;
};

export function createREGPayload(
    info: {
        username: string,
        password?: string
    },
    oauth: OAuthState
): REGPayload {
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
        __ASYNCPOST: true
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
    return new URL(`${OAUTH_BASE_URL}/v1/Login/`)
}

export function createAuthorizationURL(): URL {
    return new URL(`${OAUTH_BASE_URL}/v1/Authorize.aspx`)
}

export class RegCMUFetcher implements Fetcher {
    private _auth: Auth;
    private _client: RegClient;
    private _state: string;
    private _oauth?: OAuthState;

    constructor(auth: Auth, client: RegClient) {
        this._auth = auth;
        this._client = client;
        this._state = Math.random().toString(36).slice(2, 15);
    }

    private async _fetchSessionID() {
        const url = createAuthorizationURL();
        url.searchParams.append("response_type", REG_RESPONSE_TYPE);
        url.searchParams.append("client_id", REG_CLIENT_ID);
        url.searchParams.append("redirect_uri", REG_REDIRECT_URI);
        url.searchParams.append("scope", REG_SCOPE);
        url.searchParams.append("state", this._state);
        this._oauth = await this._client.getOAuthState(url, { redirect: false });
    }

    private async _initOAuth() {
        await this._fetchSessionID();
        const url = createLoginURL();
        url.searchParams.append("continue", REG_OAUTH_CONTINUE);
        this._oauth = await this._client.getOAuthState(url);
    }

    private async _loginUser(username: string) {
        const url = createLoginURL();
        url.searchParams.append("continue", REG_OAUTH_CONTINUE);
        this._oauth = await this._client.postOAuthState(
            url, createREGPayload({ username }, this._oauth!)
        );
    }

    private async _loginPwd(username: string, password: string): Promise<URL> {
        const url = createLoginURL();
        url.searchParams.append("continue", REG_OAUTH_CONTINUE);
        return this._client.postURL(
            url, createREGPayload({ username, password }, this._oauth!)
        );
    }

    /* flow ของการ login ที่ oauth เป็นดังนี้
     * 1. เอา oauth states
     * 2. login ด้วย username
     * 3. login ด้วย password มันจะคืน redirect url พร้อม token
     * 4. ไปที่ redirect url นั้น เราก็จะได้ session id (cookie)
     */
    private async _login(username: string, password: string) {
        if (!this._oauth)
            await this._initOAuth();
        await this._loginUser(username);
        const url = await this._loginPwd(username, password);
        await this._client.getOAuthState(url);
    }

    /**
     * @throws `UnauthorzationErrorException` ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
     * @throws `BadGatewayErrorException` ติดต่อสำนักเบียนไม่ได้
     */
    async getEvents(): Promise<CalendarEvent[]> {
        const cred = await this._auth.getCMUCredential();
        await this._login(cred.username, cred.password);
        const url = new URL(REG_BASE_URL);
        url.pathname = "/registrationoffice/student/calendar_exam/";
        
        return []
        // return this._client.getOAuthState(url);
    }
}