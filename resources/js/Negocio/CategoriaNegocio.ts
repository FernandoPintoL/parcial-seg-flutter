import { CategoriaData, Categoria } from '@/Data/Categoria';
import { BaseNegocio } from '@/Negocio/BaseNegocio';

export class CategoriaNegocio extends BaseNegocio<Categoria>{
    public model: string = 'categoria';
    protected dataService: CategoriaData;
    constructor() {
        super();
        this.dataService = new CategoriaData();
    }
    protected validar(categoria: Categoria) {
        if (!categoria.sigla) {
            throw new Error('La sigla es requerida');
        }
        if (!categoria.detalle) {
            throw new Error('El detalle es requerido');
        }
        // ... otras validaciones
    }
    protected prepararCategoriaParaCrear(categoria: Categoria) {
        // Lógica de negocio para preparar la categoría
        return {
            ...categoria,
            created_at: new Date()
        };
    }
    protected prepararCategoriaParaActualizar(categoria: Categoria) {
        // Lógica de negocio para preparar la categoría
        return {
            ...categoria,
            updated_at: new Date()
        };
    }
}
