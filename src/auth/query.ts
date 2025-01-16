import { Auth } from "./base.js";

export class QueryStringAuth implements Auth {
    private _username: string;
    private _password: string;
    private _token: string;

    constructor(
        query: string, 
        username_var = 'username',
        password_var = 'password',
        mango_token_var = 'mango_token'
    ) {
        this._username = this.getQueryVariable(query, username_var) || '';
        this._password = this.getQueryVariable(query, password_var) || '';
        this._token    = this.getQueryVariable(query, mango_token_var) || ''
    }

    /*
     * https://stackoverflow.com/a/2091331
     */
    private getQueryVariable(query: string, variable: string): string | undefined {
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
    }

    async getCMUCredential(): Promise<{ username: string; password: string; }> {
        return {
            username: this._username,
            password: this._password
        }
    }

    async getMangoCredential(): Promise<{ token: string; }> {
        return {
            token: this._token
        }
    }
}