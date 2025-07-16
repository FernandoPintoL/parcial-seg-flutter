// BaseData.ts
import axios from 'axios';
import { route } from 'ziggy-js';
import { ParamsConsulta } from '@/Data/PaginacionLaravel';
import ResponsiveService from '@/Data/ResponsiveService';

export abstract class BaseData<T> {
    protected abstract path_api_url: string;
    async consultar(params: ParamsConsulta): Promise<ResponsiveService> {
        try {
            const url = route(this.path_api_url + '.query', {
                query: params.query,
                is_query_table: params.is_query_table,
                page: params.page,
                perPage: params.perPage,
                attributes: params.attributes,
                dateStart: params.dateStart,
                dateEnd: params.dateEnd
            });
            console.log("consultar URL:", this.path_api_url);
            const response = await axios.post(url);
            console.log("consultar RESPONSE:"+this.path_api_url, response);
            return response.data as ResponsiveService;
        } catch (e) {
            console.error('Error en consultar:', e);
            throw e;
        }
    }
    async guardar(model: T): Promise<ResponsiveService> {
        try {
            const url = route(this.path_api_url + '.store');
            const response = await axios.post(url, model);
            return response.data as ResponsiveService;
        } catch (error) {
            console.error('Error al guardar:', error);
            throw error;
        }
    }
    async actualizar(model: T, id: number | string): Promise<ResponsiveService> {
        try {
            const url = route(this.path_api_url + '.update', id);
            const response = await axios.put(url, model);
            return response.data as ResponsiveService;
        } catch (error) {
            console.error('Error al actualizar:', error);
            throw error;
        }
    }
    async eliminar(id: number | string): Promise<ResponsiveService> {
        try {
            const url = route(this.path_api_url + '.destroy', id);
            const response = await axios.delete(url);
            return response.data as ResponsiveService;
        } catch (error) {
            console.error('Error al eliminar:', error);
            throw error;
        }
    }
}
