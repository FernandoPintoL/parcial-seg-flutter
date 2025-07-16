export default interface PaginacionLaravel {
    query: string;
    is_query_table?: boolean;
    current_page?: number;
    data?: any[];
    first_page_url?: string;
    from?: number | null;
    last_page?: number;
    last_page_url?: string;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url?: string | null;
    path?: string;
    per_page?: number;
    prev_page_url?: string | null;
    to?: number;
    total?: number;
}

export interface ParamsConsulta {
    query: string,
    is_query_table?: boolean,
    page?: number,
    perPage?: number,
    attributes?: any,
    dateStart?: string,
    dateEnd?: string
}
