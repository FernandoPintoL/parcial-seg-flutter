import { BaseNegocio } from '@/Negocio/BaseNegocio';
import { Pizarra, PizarraData } from '@/Data/Pizarra';

export class PizarraNegocio extends BaseNegocio<Pizarra> {
    public model: string = 'api.pizarra';
    protected dataService: PizarraData;

    constructor() {
        super();
        this.dataService = new PizarraData();
    }

    protected validar(pizarra: Pizarra) {
        if (!pizarra.name) {
            throw new Error('El nombre de la pizarra es requerido');
        }
        if (!pizarra.user_id) {
            throw new Error('El ID del usuario es requerido');
        }
        // ... otras validaciones específicas para las pizarras
    }
}
