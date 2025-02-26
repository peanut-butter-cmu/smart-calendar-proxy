type PaginationKey = "calendar" | "sharedEvents" | "notifications"

export const DEFAULT_PAGINATION_LIMIT: Record<PaginationKey, number> = {
    calendar: 1000,
    sharedEvents: 1000,
    notifications: 1000
};

export const DEFAULT_PAGINATION_OFFSET: Record<PaginationKey, number> = {
    calendar: 0,
    sharedEvents: 0,
    notifications: 0
};

export function createPaginationParam(query: { limit?: string, offset?: string }) {
    const limit = query?.limit && parseInt(query?.limit, 10);
    if (limit && !isFinite(limit))
        throw new Error("`limit` must be finite");
    const offset = query?.limit && parseInt(query?.offset, 19);
    if (offset && !isFinite(offset))
        throw new Error("`offset` must be finite");
    return {
        limit,
        offset
    }
}
