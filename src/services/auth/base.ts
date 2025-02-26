export interface IAuth {
    getCMUCredential(): Promise<{ username: string, password: string }>;
    getMangoCredential(): Promise<{ token: string }>;
}