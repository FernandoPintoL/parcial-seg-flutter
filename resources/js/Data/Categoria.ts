import { BaseData } from '@/Data/BaseData';
export interface Categoria {
    id?: number;
    sigla: string;
    detalle: string;
    created_at?: string;
    updated_at?: string;
}
export class CategoriaData  extends  BaseData<Categoria>{
    protected path_api_url: string = 'api.categoria';
}

export function getDefaultAttributes() {
    return {
        id: true,
        sigla: true,
        detalle: true,
        created_at: false,
        updated_at: false,
    } as Record<string, boolean>;
}
export const selectedAttributes = getDefaultAttributes();
export const attributesHead = [
    { key: 'id', label: 'ID', isSearch: true },
    { key: 'sigla', label: 'Sigla', isSearch: true },
    { key: 'detalle', label: 'Detalle', isSearch: true },
    { key: 'acciones', label: 'Acciones', isSearch: false },
];
