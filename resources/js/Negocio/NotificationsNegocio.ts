import { BaseNegocio } from '@/Negocio/BaseNegocio';
import { Notifications, NotificationsData } from '@/Data/Notifications';

export class NotificationsNegocio extends BaseNegocio<Notifications> {
    public model: string = 'api.notifications';
    protected dataService: NotificationsData;

    constructor() {
        super();
        this.dataService = new NotificationsData();
    }

    protected validar(notification: Notifications) {
        if (!notification.type) {
            throw new Error('El tipo de notificación es requerido');
        }
        if (!notification.notifiable_type) {
            throw new Error('El tipo de entidad notificada es requerido');
        }
        if (!notification.notifiable_id) {
            throw new Error('El ID de la entidad notificada es requerido');
        }
        if (!notification.data) {
            throw new Error('Los datos de la notificación son requeridos');
        }
        // ... otras validaciones específicas para las notificaciones
    }
}
