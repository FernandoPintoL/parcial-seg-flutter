// BaseNegocio.ts
import { BaseData } from '@/Data/BaseData';
import { ParamsConsulta } from '@/Data/PaginacionLaravel';
import ResponsiveService from '@/Data/ResponsiveService';

export abstract class BaseNegocio<T> {
    protected abstract dataService: BaseData<T>;
    public abstract model: string;
    async consultar(params: ParamsConsulta): Promise<ResponsiveService> {
        try {
            return await this.dataService.consultar(params);
        } catch (error) {
            console.error(`Error al obtener ${this.model}:`, error);
            throw error;
        }
    }

    async guardar(entity: T): Promise<ResponsiveService> {
        try {
            await this.validar(entity);
            return await this.dataService.guardar(entity);
        } catch (error) {
            console.error(`Error al crear ${this.model}:`, error);
            throw error;
        }
    }

    async actualizar(entity: T, id: number | string): Promise<ResponsiveService> {
        try {
            await this.validar(entity);
            return await this.dataService.actualizar(entity, id);
        } catch (error) {
            console.error(`Error al actualizar ${this.model}:`, error);
            throw error;
        }
    }

    async eliminar(id: number | string): Promise<ResponsiveService> {
        try {
            return await this.dataService.eliminar(id);
        } catch (error) {
            console.error(`Error al eliminar ${this.model}:`, error);
            throw error;
        }
    }

    protected abstract validar(entity: T): void | Promise<void>;
}
