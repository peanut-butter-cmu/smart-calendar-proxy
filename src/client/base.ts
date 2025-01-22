export type RequestOptions = {
    manualRedirect?: boolean
}

export interface IClient {
    get<T>(url: URL, options?: RequestOptions): Promise<T>;
    post<U, T>(url: URL, body: T, options?: RequestOptions): Promise<U>;
}