export type ApiResponse<T> = {
    data: T;
    message: string;
    pagination?: Pagination;
    warning?: string;
    meta?: Record<string, unknown>;
}

export type PaginatedApiResponse<T> = Omit<ApiResponse<T[]>, "data"> & {
    data: T[];
    pagination: Pagination;
}

export type Pagination = {
    hasMore: boolean;
}

export type ErrorResponse = {
    name: string;
    code: string;
    message: string;
    status: number;
}
