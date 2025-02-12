import { createMangoAxios } from "../helpers/mango.js";
import { AxiosInstance } from "axios";

export class MangoClient {
    private _axios: AxiosInstance;
    private _token: string;
    constructor(token: string) {
        this._axios = createMangoAxios();
        this._token = token;
    }

    public async validate(): Promise<boolean> {
        const resp = await this._axios.get(`${process.env.MANGO_BASE_URL}/users/self`, {
            headers: { Authorization: `Bearer ${this._token}` },
            validateStatus: () => true,
        });
        return resp.status === 200;
    }
}