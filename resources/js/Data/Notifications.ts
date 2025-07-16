import { BaseData } from '@/Data/BaseData';

export interface Notifications {
    id?: number;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: string;
    read_at?: string;
    created_at?: string;
    updated_at?: string;
}
export class NotificationsData extends BaseData<Notifications> {
    protected path_api_url: string = 'api.notifications';
}
