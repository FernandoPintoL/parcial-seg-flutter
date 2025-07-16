import { BaseData } from '@/Data/BaseData';

export interface FormBuilder{
    id: number;
    name: string;
    elements: any[];
    user_id: number;
    created_at: string;
}

export class FormBuilderData extends BaseData<FormBuilder>{
    protected path_api_url: string = 'api.form-builder';
}
