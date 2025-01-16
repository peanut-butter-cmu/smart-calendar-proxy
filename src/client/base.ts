export type RequestOptions = {
    redirect?: boolean
}

export interface Client {
    get<T>(url: URL, options?: RequestOptions): Promise<T>;
    post<U, T>(url: URL, body: T, options?: RequestOptions): Promise<U>;
}