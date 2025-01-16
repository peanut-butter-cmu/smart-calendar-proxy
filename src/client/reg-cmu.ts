import { RequestOptions } from "./base.js";
import { OAuthState, REGPayload } from "@/fetcher/reg-cmu.js";
import { CalendarEvent } from "@/models/event.js";

export interface RegClient {
    getOAuthState(url: URL, options?: RequestOptions): Promise<OAuthState>;
    getCalendarEvents(url: URL, options?: RequestOptions): Promise<CalendarEvent[]>;
    
    postOAuthState(url: URL, body: REGPayload, options?: RequestOptions): Promise<OAuthState>;
    postURL(url: URL, body: REGPayload, options?: RequestOptions): Promise<URL>;
}