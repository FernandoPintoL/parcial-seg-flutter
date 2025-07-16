import { BaseNegocio } from '@/Negocio/BaseNegocio';
import { FormBuilder, FormBuilderData } from '@/Data/FormBuilder';

export class FormBuilderNegocio extends BaseNegocio<FormBuilder>{
    public model: string = 'api.form-builder';
    protected dataService: FormBuilderData;
    constructor() {
        super();
        this.dataService = new FormBuilderData();
    }
    protected validar(formBuilder: FormBuilder) {
        if (!formBuilder.name) {
            throw new Error('El nombre del formulario es requerido');
        }
        if (!formBuilder.user_id) {
            throw new Error('El ID del usuario es requerido');
        }
        if (!Array.isArray(formBuilder.elements) || formBuilder.elements.length === 0) {
            throw new Error('Los elementos del formulario son requeridos y deben ser un arreglo');
        }
        // ... otras validaciones específicas para el formulario
    }

}
