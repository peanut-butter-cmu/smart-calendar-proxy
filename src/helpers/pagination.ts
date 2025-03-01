type PaginationKey = "calendar" | "sharedEvents" | "notifications"

const DEFAULT_PAGINATION_LIMIT: Record<PaginationKey, number> = {
    calendar: 1000,
    sharedEvents: 1000,
    notifications: 1000
};

const DEFAULT_PAGINATION_OFFSET: Record<PaginationKey, number> = {
    calendar: 0,
    sharedEvents: 0,
    notifications: 0
};

export function createPaginationParam(key: PaginationKey, query: { limit?: string, offset?: string }) {
    const limit = parseInt(query?.limit, 10);
    if (limit && !isFinite(limit))
        throw new Error("`limit` must be finite");
    const offset = parseInt(query?.offset, 10);
    if (offset && !isFinite(offset))
        throw new Error("`offset` must be finite");
    return {
        limit: limit || DEFAULT_PAGINATION_LIMIT[key],
        offset: offset || DEFAULT_PAGINATION_OFFSET[key]
    }
}
