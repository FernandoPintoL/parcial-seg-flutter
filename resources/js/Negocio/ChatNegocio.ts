import { BaseNegocio } from '@/Negocio/BaseNegocio';
import { ChatData, Chats } from '@/Data/Pizarra';
export class ChatNegocio extends BaseNegocio<Chats> {
    public model: string = 'chat';
    protected dataService: ChatData;
    constructor() {
        super();
        this.dataService = new ChatData();
    }
    protected validar(chat: Chats) {
        if (!chat.pizarra_id) {
            throw new Error('El ID de la pizarra es requerido');
        }
        if (!chat.user_id) {
            throw new Error('El ID del usuario es requerido');
        }
        if (!chat.message) {
            throw new Error('Los mensajes son requeridos');
        }
        // ... otras validaciones
    }

}
