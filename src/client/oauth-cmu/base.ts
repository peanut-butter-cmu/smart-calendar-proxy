import { RequestOptions } from "../base.js";
import { OAuthState, OAuthPayload } from "../../helpers/reg-cmu.js";

export interface IOAuthClient {
    getOAuthState(url: URL, options?: RequestOptions): Promise<OAuthState>;
    
    postOAuthState(url: URL, body: OAuthPayload, options?: RequestOptions): Promise<OAuthState>;
    postURL(url: URL, body: OAuthPayload, options?: RequestOptions): Promise<URL | null>;
}