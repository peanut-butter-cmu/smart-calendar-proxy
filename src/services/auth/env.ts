import { IAuth } from "./base.js";

export class EnvAuth implements IAuth {
    async getCMUCredential(): Promise<{ username: string; password: string; }> {
        return {
            username: process.env.TEST_CMU_USERNAME!,
            password: process.env.TEST_CMU_PASSWORD!
        };
    }
    async getMangoCredential(): Promise<{ token: string; }> {
        return { token: process.env.TEST_MANGO_TOKEN! };
    }
}