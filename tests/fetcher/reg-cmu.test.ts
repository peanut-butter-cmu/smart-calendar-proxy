import { RegCMUFetcher } from "@/fetcher/reg-cmu.js";
import { createOAuthPayload } from "@/helpers/reg-cmu.js";

jest.setTimeout(30 * 60 * 1000); // Only limit the time out to 30 seconds.
describe("testing createREGPayload", () => {
    test("testing username login", () => {
        expect(createOAuthPayload({
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
        expect(createOAuthPayload({
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
            __ASYNCPOST: "true"
        });
    });
});

const testUsers: {username: string, password: string}[] = JSON.parse(process.env.TEST_CMU_USERS);
describe("test REGFetcher", () => {
    describe("testing on working user", () => {
        const fetcher = new RegCMUFetcher(testUsers[0]);
        test("testing validate credential", async () => {
            expect(await fetcher.validate()).toBe(true);
        });
        test("get courses of single user", async () => {
            expect(await fetcher.getCourses());
        });
    });
});
