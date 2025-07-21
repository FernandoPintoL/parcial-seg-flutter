// services/UnifiedCollaborationService.ts
import { SocketService } from '@/services/SocketService';
import type { UnifiedElement, CollaborationData } from '@/Data/PizarraUnificada';

export interface CollaboratorManagementResult {
    success: boolean;
    message?: string;
    error?: string;
}

export class UnifiedCollaborationService {
    private socketService: SocketService;
    private roomId: string;
    private currentUser: string;
    private currentUserId: string;
    private pizarraId: string;

    constructor(socketConfig: any, roomId: string, currentUser: string, currentUserId: string, pizarraId: string) {
        this.socketService = new SocketService(socketConfig, roomId, currentUser);
        this.roomId = roomId;
        this.currentUser = currentUser;
        this.currentUserId = currentUserId;
        this.pizarraId = pizarraId;
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
        console.log('usuario actual:', this.currentUser, 'id:', this.currentUserId, 'pizarraId:', this.pizarraId);
        const chatMessage = {
            roomId: this.roomId,
            message: message,
            userId: this.currentUserId,
            user: this.currentUser,
            pizarraId: this.pizarraId,
            timestamp: new Date().toISOString()
        };
        console.log('Emitting chat message:', chatMessage);
        this.socketService.socket.emit('chatMessage', chatMessage);
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

    /**
     * Agrega un colaborador a la pizarra
     * @param email
     * @param status Estado del colaborador (default: 'active')
     * @returns Resultado de la operación
     */
    addCollaborator(email: string, status: string = 'pending'): Promise<CollaboratorManagementResult> {
        return new Promise((resolve) => {
            try {
                this.socketService.socket.emit('manageCollaborator', {
                    action: 'add',
                    pizarraId: this.pizarraId,
                    userEmail: email,
                    status: status,
                    roomId: this.roomId
                });

                // Escuchar la respuesta del servidor
                const handleResponse = (data: any) => {
                    if (data.pizarraId === this.pizarraId && data.action === 'add') {
                        this.socketService.socket.off('collaboratorUpdate', handleResponse);
                        resolve({
                            success: true,
                            message: `Colaborador ${email} agregado exitosamente`
                        });
                    }
                };

                // Escuchar errores
                const handleError = (error: any) => {
                    this.socketService.socket.off('error', handleError);
                    resolve({
                        success: false,
                        error: error.message || 'Error al agregar colaborador'
                    });
                };

                this.socketService.socket.on('collaboratorUpdate', handleResponse);
                this.socketService.socket.on('error', handleError);
                // Se elimina el timeout, la promesa solo se resuelve con respuesta del servidor
            } catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido al agregar colaborador'
                });
            }
        });
    }

    /**
     * Elimina un colaborador de la pizarra
     * @param userId ID del usuario a eliminar como colaborador
     * @returns Resultado de la operación
     */
    removeCollaborator(userId: string): Promise<CollaboratorManagementResult> {
        return new Promise((resolve) => {
            try {
                this.socketService.socket.emit('manageCollaborator', {
                    action: 'remove',
                    pizarraId: this.pizarraId,
                    userId: userId,
                    roomId: this.roomId
                });

                // Escuchar la respuesta del servidor
                const handleResponse = (data: any) => {
                    if (data.pizarraId === this.pizarraId && data.action === 'remove') {
                        this.socketService.socket.off('collaboratorUpdate', handleResponse);
                        resolve({
                            success: true,
                            message: `Colaborador ${userId} eliminado exitosamente`
                        });
                    }
                };

                // Escuchar errores
                const handleError = (error: any) => {
                    this.socketService.socket.off('error', handleError);
                    resolve({
                        success: false,
                        error: error.message || 'Error al eliminar colaborador'
                    });
                };

                this.socketService.socket.on('collaboratorUpdate', handleResponse);
                this.socketService.socket.on('error', handleError);

                // Timeout para evitar que la promesa quede pendiente indefinidamente
                setTimeout(() => {
                    this.socketService.socket.off('collaboratorUpdate', handleResponse);
                    this.socketService.socket.off('error', handleError);
                    resolve({
                        success: false,
                        error: 'Tiempo de espera agotado al eliminar colaborador'
                    });
                }, 5000);
            } catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido al eliminar colaborador'
                });
            }
        });
    }

    /**
     * Actualiza el estado de un colaborador
     * @param userId ID del usuario a actualizar
     * @param status Nuevo estado del colaborador
     * @returns Resultado de la operación
     */
    updateCollaboratorStatus(userId: string, status: string): Promise<CollaboratorManagementResult> {
        return new Promise((resolve) => {
            try {
                this.socketService.socket.emit('manageCollaborator', {
                    action: 'update',
                    pizarraId: this.pizarraId,
                    userId: userId,
                    status: status,
                    roomId: this.roomId
                });

                // Escuchar la respuesta del servidor
                const handleResponse = (data: any) => {
                    if (data.pizarraId === this.pizarraId && data.action === 'update') {
                        this.socketService.socket.off('collaboratorUpdate', handleResponse);
                        resolve({
                            success: true,
                            message: `Estado del colaborador ${userId} actualizado exitosamente`
                        });
                    }
                };

                // Escuchar errores
                const handleError = (error: any) => {
                    this.socketService.socket.off('error', handleError);
                    resolve({
                        success: false,
                        error: error.message || 'Error al actualizar estado del colaborador'
                    });
                };

                this.socketService.socket.on('collaboratorUpdate', handleResponse);
                this.socketService.socket.on('error', handleError);

                // Timeout para evitar que la promesa quede pendiente indefinidamente
                setTimeout(() => {
                    this.socketService.socket.off('collaboratorUpdate', handleResponse);
                    this.socketService.socket.off('error', handleError);
                    resolve({
                        success: false,
                        error: 'Tiempo de espera agotado al actualizar estado del colaborador'
                    });
                }, 5000);
            } catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido al actualizar estado del colaborador'
                });
            }
        });
    }

    /**
     * Genera un enlace de invitación para la pizarra
     * @returns Enlace de invitación
     */
    generateInvitationLink(): string {
        const baseUrl = window.location.origin;
        const timestamp = new Date().getTime();
        return `${baseUrl}/pizarra_unificada/join?roomId=${this.roomId}&pizarraId=${this.pizarraId}&t=${timestamp}`;
    }
}
