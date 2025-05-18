export interface User{
    id: number;
    name: string;
    email: string;
    password: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    role_id: number;
    role_name: string;
    role_description: string;
    role_created_at: string;
    role_updated_at: string;
    role_deleted_at: string | null;
}
