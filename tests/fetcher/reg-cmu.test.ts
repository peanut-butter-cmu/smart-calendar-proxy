import { EnvAuth } from "../../src/auth/env.js";
import { KyRegClient } from "../../src/client/ky.js";
import { createREGPayload, RegCMUFetcher } from "../../src/fetcher/reg-cmu.js";
import { EnvRepository } from "../../src/repositories/env.js";

describe("testing createREGPayload", () => {
    test("testing username login", () => {
        expect(createREGPayload({
            username: "username_123_USERNAME"
        }, {
            viewState: "view_state_123_VIEW_STATE",
            viewStateGenerator: "view_state_generator_123_VIEW_STATE_GENERATOR",
            eventValidation: "event_validation_123_EVENT_VALIDATION"
        })).toEqual({
            __LASTFOCUS: "",
            __EVENTTARGET: "",
            __EVENTARGUMENT: "",
            __VIEWSTATE: "view_state_123_VIEW_STATE",
            __VIEWSTATEGENERATOR: "view_state_generator_123_VIEW_STATE_GENERATOR",
            __EVENTVALIDATION: "event_validation_123_EVENT_VALIDATION",
            txtUser: "username_123_USERNAME",
            btnLogin_next: "Next",
        });
    });

    test("testing password login", () => {
        expect(createREGPayload({
            username: "username_123_USERNAME",
            password: "password_123_PASSWORD_!@#$"
        }, {
            viewState: "view_state_123_VIEW_STATE",
            viewStateGenerator: "view_state_generator_123_VIEW_STATE_GENERATOR",
            eventValidation: "event_validation_123_EVENT_VALIDATION"
        })).toEqual({
            __LASTFOCUS: "",
            __EVENTTARGET: "",
            __EVENTARGUMENT: "",
            __VIEWSTATE: "view_state_123_VIEW_STATE",
            __VIEWSTATEGENERATOR: "view_state_generator_123_VIEW_STATE_GENERATOR",
            __EVENTVALIDATION: "event_validation_123_EVENT_VALIDATION",
            ScriptManager1: "UpdatePanel1|btnLogin_submit",
            user: "username_123_USERNAME",
            password: "password_123_PASSWORD_!@#$",
            chkbxKeepmesignin: "on",
            btnLogin_submit: "Sign in",
            __ASYNCPOST: true
        });
    });
});

describe("testing RegCMUFetcher", () => {
    test("test get events", () => {
        const auth = new EnvAuth();
        const repo = new EnvRepository();
        const client = new KyRegClient(repo)
        const fetcher = new RegCMUFetcher(auth, client);
    });
});
