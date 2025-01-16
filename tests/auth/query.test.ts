import { QueryStringAuth } from "../../src/auth/query.js";

describe("testing QueryStringAuth", () => {
    describe("testing with empty query string", () => {
        const qsAuth = new QueryStringAuth("");

        test("cmu credentials both username and password are empty string", () => {
            return qsAuth.getCMUCredential().then(cred =>
                expect(cred).toEqual({
                    username: "",
                    password: ""
                })
            )
        });

        test("mango token is empty string", () => {
            return qsAuth.getMangoCredential().then(cred =>
                expect(cred).toEqual({
                    token: ""
                })
            )
        });
    });

    describe("testing with query string containing only cmu credentials", () => {
        const qsAuth = new QueryStringAuth("username=admin&password=secret");

        test("cmu credentials return correct username and password", () => {
            return qsAuth.getCMUCredential().then(cred =>
                expect(cred).toEqual({
                    username: "admin",
                    password: "secret"
                })
            )
        });

        test("mango token is still empty string", () => {
            return qsAuth.getMangoCredential().then(cred =>
                expect(cred).toEqual({
                    token: ""
                })
            )
        });
    });

    describe("testing with query string containing only mango token", () => {
        const qsAuth = new QueryStringAuth("mango_token=abc123");

        test("cmu credentials both username and password are empty string", () => {
            return qsAuth.getCMUCredential().then(cred =>
                expect(cred).toEqual({
                    username: "",
                    password: ""
                })
            )
        });

        test("mango token returns correct value", () => {
            return qsAuth.getMangoCredential().then(cred =>
                expect(cred).toEqual({
                    token: "abc123"
                })
            )
        });
    });

    describe("testing with query string containing both cmu credentials and mango token", () => {
        const qsAuth = new QueryStringAuth("username=admin&password=secret&mango_token=abc123");

        test("cmu credentials return correct username and password", () => {
            return qsAuth.getCMUCredential().then(cred =>
                expect(cred).toEqual({
                    username: "admin",
                    password: "secret"
                })
            )
        });

        test("mango token returns correct value", () => {
            return qsAuth.getMangoCredential().then(cred =>
                expect(cred).toEqual({
                    token: "abc123"
                })
            )
        });
    });

    describe("testing with additional unrelated query parameters", () => {
        const qsAuth = new QueryStringAuth("username=admin&password=secret&mango_token=abc123&extra=123");

        test("cmu credentials return correct username and password and ignore extra params", () => {
            return qsAuth.getCMUCredential().then(cred =>
                expect(cred).toEqual({
                    username: "admin",
                    password: "secret"
                })
            )
        });

        test("mango token returns correct value and ignores extra params", () => {
            return qsAuth.getMangoCredential().then(cred =>
                expect(cred).toEqual({
                    token: "abc123"
                })
            )
        });
    });

    describe("testing with invalid query parameters", () => {
        const qsAuth = new QueryStringAuth("randomparam=value");

        test("cmu credentials both username and password are empty string", () => {
            return qsAuth.getCMUCredential().then(cred =>
                expect(cred).toEqual({
                    username: "",
                    password: ""
                })
            )
        });

        test("mango token is empty string", () => {
            return qsAuth.getMangoCredential().then(cred =>
                expect(cred).toEqual({
                    token: ""
                })
            )
        });
    });

    describe("testing with malformed query string", () => {
        const qsAuth = new QueryStringAuth("usernameadmin&passwordsecret&mango_tokenabc123");

        test("cmu credentials both username and password are empty string", () => {
            return qsAuth.getCMUCredential().then(cred =>
                expect(cred).toEqual({
                    username: "",
                    password: ""
                })
            )
        });

        test("mango token is empty string", () => {
            return qsAuth.getMangoCredential().then(cred =>
                expect(cred).toEqual({
                    token: ""
                })
            )
        });
    });
});