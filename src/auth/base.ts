export interface Auth {
    getCMUCredential(): Promise<{ username: string, password: string }>;
    getMangoCredential(): Promise<{ token: string }>;
}