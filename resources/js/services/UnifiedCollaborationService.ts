// services/UnifiedCollaborationService.ts
import { SocketService } from '@/services/SocketService';
import type { PizarraUnificada, UnifiedElement, CollaborationData } from '@/Data/PizarraUnificada';

export class UnifiedCollaborationService {
    private socketService: SocketService;
    private roomId: string;
    private currentUser: string;

    constructor(socketConfig: any, roomId: string, currentUser: string) {
        this.socketService = new SocketService(socketConfig, roomId, currentUser);
        this.roomId = roomId;
        this.currentUser = currentUser;
    }

    /**
     * Conecta al servicio de colaboración
     */
    connect(): void {
        this.socketService.connect();
        this.setupEventHandlers();
    }

    /**
     * Desconecta del servicio de colaboración
     */
    disconnect(): void {
        this.socketService.disconnect();
    }

    /**
     * Configura los manejadores de eventos
     */
    private setupEventHandlers(): void {
        // Eventos para elementos unificados
        this.socketService.socket.on('unified-element-added', this.handleElementAdded.bind(this));
        this.socketService.socket.on('unified-element-updated', this.handleElementUpdated.bind(this));
        this.socketService.socket.on('unified-element-deleted', this.handleElementDeleted.bind(this));
        this.socketService.socket.on('unified-element-selected', this.handleElementSelected.bind(this));

        // Eventos para colaboración
        this.socketService.socket.on('user-editing', this.handleUserEditing.bind(this));
        this.socketService.socket.on('user-stopped-editing', this.handleUserStoppedEditing.bind(this));
        this.socketService.socket.on('collaboration-data', this.handleCollaborationData.bind(this));

        // Eventos para frameworks
        this.socketService.socket.on('framework-switched', this.handleFrameworkSwitched.bind(this));
        this.socketService.socket.on('export-mode-changed', this.handleExportModeChanged.bind(this));
    }

    /**
     * Emite evento cuando se agrega un elemento
     */
    emitElementAdded(element: UnifiedElement, screenId?: string): void {
        this.socketService.socket.emit('unified-element-added', {
            roomId: this.roomId,
            element: element,
            screenId: screenId,
            userId: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se actualiza un elemento
     */
    emitElementUpdated(element: UnifiedElement, screenId?: string): void {
        this.socketService.socket.emit('unified-element-updated', {
            roomId: this.roomId,
            element: element,
            screenId: screenId,
            userId: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se elimina un elemento
     */
    emitElementDeleted(elementId: string, screenId?: string): void {
        this.socketService.socket.emit('unified-element-deleted', {
            roomId: this.roomId,
            elementId: elementId,
            screenId: screenId,
            userId: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se selecciona un elemento
     */
    emitElementSelected(element: UnifiedElement, screenId?: string): void {
        this.socketService.socket.emit('unified-element-selected', {
            roomId: this.roomId,
            element: {
                id: element.id,
                type: element.type,
                framework: element.framework
            },
            screenId: screenId,
            userId: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento de inicio de edición
     */
    emitUserStartedEditing(elementId: string, elementType: string): void {
        this.socketService.socket.emit('user-editing', {
            roomId: this.roomId,
            userId: this.currentUser,
            elementId: elementId,
            elementType: elementType,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento de finalización de edición
     */
    emitUserStoppedEditing(elementId: string): void {
        this.socketService.socket.emit('user-stopped-editing', {
            roomId: this.roomId,
            userId: this.currentUser,
            elementId: elementId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento de cambio de framework
     */
    emitFrameworkSwitched(framework: 'flutter' | 'angular' | 'both'): void {
        this.socketService.socket.emit('framework-switched', {
            roomId: this.roomId,
            framework: framework,
            userId: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento de cambio de modo de exportación
     */
    emitExportModeChanged(mode: 'preview' | 'download' | 'copy'): void {
        this.socketService.socket.emit('export-mode-changed', {
            roomId: this.roomId,
            mode: mode,
            userId: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite datos de colaboración
     */
    emitCollaborationData(data: CollaborationData): void {
        this.socketService.socket.emit('collaboration-data', {
            roomId: this.roomId,
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite mensaje de chat
     */
    emitChatMessage(message: string): void {
        this.socketService.socket.emit('chatMessage', {
            roomId: this.roomId,
            message: message,
            userId: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento de typing
     */
    emitTyping(): void {
        this.socketService.socket.emit('escribiendo', {
            roomId: this.roomId,
            user: this.currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Manejador para elemento agregado
     */
    private handleElementAdded(data: any): void {
        // Implementar lógica para manejar elemento agregado por otro usuario
        console.log('Element added by another user:', data);
    }

    /**
     * Manejador para elemento actualizado
     */
    private handleElementUpdated(data: any): void {
        // Implementar lógica para manejar elemento actualizado por otro usuario
        console.log('Element updated by another user:', data);
    }

    /**
     * Manejador para elemento eliminado
     */
    private handleElementDeleted(data: any): void {
        // Implementar lógica para manejar elemento eliminado por otro usuario
        console.log('Element deleted by another user:', data);
    }

    /**
     * Manejador para elemento seleccionado
     */
    private handleElementSelected(data: any): void {
        // Implementar lógica para manejar elemento seleccionado por otro usuario
        console.log('Element selected by another user:', data);
    }

    /**
     * Manejador para usuario editando
     */
    private handleUserEditing(data: any): void {
        // Implementar lógica para mostrar que otro usuario está editando
        console.log('User started editing:', data);
    }

    /**
     * Manejador para usuario dejó de editar
     */
    private handleUserStoppedEditing(data: any): void {
        // Implementar lógica para ocultar indicador de edición
        console.log('User stopped editing:', data);
    }

    /**
     * Manejador para cambio de framework
     */
    private handleFrameworkSwitched(data: any): void {
        // Implementar lógica para cambio de framework
        console.log('Framework switched:', data);
    }

    /**
     * Manejador para cambio de modo de exportación
     */
    private handleExportModeChanged(data: any): void {
        // Implementar lógica para cambio de modo de exportación
        console.log('Export mode changed:', data);
    }

    /**
     * Manejador para datos de colaboración
     */
    private handleCollaborationData(data: any): void {
        // Implementar lógica para datos de colaboración
        console.log('Collaboration data received:', data);
    }

    /**
     * Obtiene el socket para uso externo
     */
    get socket() {
        return this.socketService.socket;
    }
}
