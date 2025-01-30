import { RequestOptions } from "../base.js";
import { OAuthState, OAuthPayload } from "../../helpers/reg-cmu.js";
import { IOAuthClient } from "./base.js";
import { AxiosInstance, AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";

export type RegCourse = {
    course_no: string;
    title: string;
    lec_section: string;
    lab_section: string;
    lec_credit: string;
    lab_credit: string;
    schedule_day: string;
    schedule_time: string;
    type: string;
    midterm_day: string;
    midterm_time: string;
    final_day: string;
    final_time: string;
}

export class AxiosOAuthClient implements IOAuthClient {
    private _instance: AxiosInstance;
    constructor(instance: AxiosInstance) {
        this._instance = instance;
    }

    private static _parseOAuthState(txt: string): OAuthState {
        const $ = cheerio.load(txt);
        return {
            viewState: $("input#__VIEWSTATE").val()?.toString() || "",
            viewStateGenerator: $("input#__VIEWSTATEGENERATOR").val()?.toString() || "",
            eventValidation: $("input#__EVENTVALIDATION").val()?.toString() || ""
        }
    }
    
    private static _convertRequestOptions(options?: RequestOptions): AxiosRequestConfig {
        if (!options)
            return {}
        return {
            maxRedirects: options.manualRedirect ? 0 : -1,
            validateStatus: options.manualRedirect ? status => (status < 300 || status == 302) : undefined
        }
    }

    async getOAuthState(url: URL, options?: RequestOptions): Promise<OAuthState> {
        const resp = await this._instance.get(url.toString(), AxiosOAuthClient._convertRequestOptions(options));
        return AxiosOAuthClient._parseOAuthState(resp.data);
    }

    private static _createURLSearchParams<T>(obj: T) {
        const urlSearchParams = new URLSearchParams();
        for (const k of Object.keys(obj))
            urlSearchParams.append(k, obj[k]);
        return urlSearchParams;
    }

    async postOAuthState(url: URL, body: OAuthPayload, options?: RequestOptions): Promise<OAuthState> {
        const resp = await this._instance.post(
            url.toString(), 
            AxiosOAuthClient._createURLSearchParams(body), 
            AxiosOAuthClient._convertRequestOptions(options)
        );
        return AxiosOAuthClient._parseOAuthState(resp.data);
    }

    // https://stackoverflow.com/a/432503
    private static _getFirstGroup(regexp: RegExp, str: string): string {
        const mayNullArr = regexp.exec(str);
        if (!mayNullArr && mayNullArr.length !== 2)
            throw new Error(`exec failed with ${str}!`);
        return mayNullArr[1];
    }

    async postURL(url: URL, body: OAuthPayload, options?: RequestOptions): Promise<URL | null> {
        const resp = await this._instance
            .post<string>(
                url.toString(), 
                AxiosOAuthClient._createURLSearchParams(body),
                AxiosOAuthClient._convertRequestOptions(options)
            );
        try {
            const encodedURL = AxiosOAuthClient._getFirstGroup(/pageRedirect\|\|(.+)\|/g, resp.data);
            return new URL(decodeURIComponent(encodedURL));
        } catch(e) {
            if (process.env.DEBUG)
                console.log(e.stack);
            throw new Error(`invalid server response (${resp.data})!`);
        }
    }
}