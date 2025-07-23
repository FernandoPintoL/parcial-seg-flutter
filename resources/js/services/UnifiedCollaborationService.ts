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
    private _roomId: string;
    private _currentUser: string;
    private _currentUserId: string;
    private _pizarraId: string;

    // Añadido para el manejo de selecciones remotas
    private _remoteSelections: Record<string, string> = {}; // elementId -> userName

    get roomId(): string {
        return this._roomId;
    }

    get currentUser(): string {
        return this._currentUser;
    }

    get currentUserId(): string {
        return this._currentUserId;
    }

    get pizarraId(): string {
        return this._pizarraId;
    }

    // Getter para acceder a las selecciones remotas
    get remoteSelections(): Record<string, string> {
        return this._remoteSelections;
    }

    constructor(socketConfig: any, roomId: string, currentUser: string, currentUserId: string, pizarraId: string) {
        this.socketService = new SocketService(socketConfig, roomId, currentUser);
        this._roomId = roomId;
        this._currentUser = currentUser;
        this._currentUserId = currentUserId;
        this._pizarraId = pizarraId;
    }

    /**
     * Conecta al servicio de colaboración y se une automáticamente a la sala
     * @param {boolean} autoJoin - Si es true (por defecto), se unirá automáticamente a la sala
     */
    connect(autoJoin = true): Promise<void> {
        // Iniciar conexión con auto-unión y el ID de pizarra
        this.socketService.connect(autoJoin, parseInt(this._pizarraId));
        this.setupEventHandlers();

        // Devolver una promesa que se resuelve cuando se une a la sala (si autoJoin es true)
        if (autoJoin) {
            return this.joinRoom();
        }

        return Promise.resolve();
    }

    /**
     * Se une a la sala de colaboración
     * @returns {Promise<void>} Promesa que se resuelve cuando se une a la sala
     */
    joinRoom(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Si ya está conectado, utilizar el método joinRoom del SocketService
            if (this.socketService.socketConnected) {
                this._joinRoomWhenConnected(resolve, reject);
            } else {
                console.log('No hay conexión con el servidor de sockets. Esperando conexión...');

                // Establecer un tiempo máximo de espera para la conexión
                const connectionTimeout = setTimeout(() => {
                    reject('Timeout esperando la conexión del socket');
                }, 10000); // 10 segundos de espera máxima

                // Esperar a que el socket se conecte
                const connectHandler = () => {
                    console.log('Socket conectado, intentando unirse a la sala');
                    clearTimeout(connectionTimeout);
                    this._joinRoomWhenConnected(resolve, reject);
                };

                // Escuchar el evento 'connect' una sola vez
                this.socketService.on('connect', connectHandler);

                // También manejar errores de conexión
                const errorHandler = (error: any) => {
                    clearTimeout(connectionTimeout);
                    this.socketService.socket.removeListener('connect', connectHandler);
                    reject(`Error al conectar con el servidor: ${error.message || error}`);
                };

                this.socketService.on('connect_error', errorHandler);
            }
        });
    }

    /**
     * Método auxiliar para unirse a la sala una vez que la conexión está establecida
     * @private
     */
    private _joinRoomWhenConnected(resolve: Function, reject: Function): void {
        if (!this._pizarraId) {
            reject('No se ha especificado un ID de pizarra');
            return;
        }

        this.socketService.joinRoom(parseInt(this._pizarraId), this._currentUser)
            .then(() => {
                console.log(`UnifiedCollaborationService: Unido a la sala ${this._roomId} para pizarra ${this._pizarraId}`);
                resolve();
            })
            .catch(error => {
                console.error('UnifiedCollaborationService: Error al unirse a la sala:', error);
                reject(error);
            });
    }

    /**
     * Desconecta del servicio de colaboración
     */
    disconnect(): void {
        this.socketService.disconnect();
        // Limpiar las selecciones remotas al desconectar
        this._remoteSelections = {};
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

        // Evento para indicador de escritura (typing)
        this.socketService.socket.on('escribiendo', this.handleTyping.bind(this));

        // Eventos para frameworks
        this.socketService.socket.on('framework-switched', this.handleFrameworkSwitched.bind(this));
        this.socketService.socket.on('export-mode-changed', this.handleExportModeChanged.bind(this));

        // Eventos para selección remota
        this.socketService.socket.on('remote-selection', this.handleRemoteSelection.bind(this));
        this.socketService.socket.on('remote-deselection', this.handleRemoteDeselection.bind(this));

        // Manejo de usuarios desconectados para limpiar sus selecciones
        this.socketService.socket.on('user-left', this.handleUserLeft.bind(this));
    }

    /**
     * Emite evento cuando se agrega un elemento
     */
    emitElementAdded(element: UnifiedElement, screenId?: string): void {
        this.socketService.socket.emit('unified-element-added', {
            roomId: this._roomId,
            element: element,
            screenId: screenId,
            userId: this._currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se actualiza un elemento
     */
    emitElementUpdated(element: UnifiedElement, screenId?: string): void {
        this.socketService.socket.emit('unified-element-updated', {
            roomId: this._roomId,
            element: element,
            screenId: screenId,
            userId: this._currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se elimina un elemento
     */
    emitElementDeleted(elementId: string, screenId?: string): void {
        this.socketService.socket.emit('unified-element-deleted', {
            roomId: this._roomId,
            elementId: elementId,
            screenId: screenId,
            userId: this._currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento cuando se selecciona un elemento
     */
    emitElementSelected(element: UnifiedElement, screenId?: string): void {
        if (!element.id) return;

        // Emite evento de selección tradicional
        this.socketService.socket.emit('unified-element-selected', {
            roomId: this._roomId,
            element: {
                id: element.id,
                type: element.type,
                framework: element.framework
            },
            screenId: screenId,
            userId: this._currentUser,
            timestamp: new Date().toISOString()
        });

        // Emite evento de selección remota para actualizar remoteSelectedBy
        this.socketService.socket.emit('remote-selection', {
            roomId: this._roomId,
            elementId: element.id,
            userName: this._currentUser,
            userId: this._currentUserId,
            timestamp: new Date().toISOString()
        });

        // Actualiza el registro local
        this._remoteSelections[element.id] = this._currentUser;
    }

    /**
     * Emite evento cuando se deselecciona un elemento
     */
    emitElementDeselected(elementId: string): void {
        if (!elementId) return;

        // Emite evento de deselección
        this.socketService.socket.emit('remote-deselection', {
            roomId: this._roomId,
            elementId: elementId,
            userId: this._currentUserId,
            timestamp: new Date().toISOString()
        });

        // Elimina del registro local
        delete this._remoteSelections[elementId];
    }

    /**
     * Emite evento de inicio de edición
     */
    emitUserStartedEditing(elementId: string, elementType: string): void {
        this.socketService.socket.emit('user-editing', {
            roomId: this._roomId,
            userId: this._currentUser,
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
            roomId: this._roomId,
            userId: this._currentUser,
            elementId: elementId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento de cambio de framework
     */
    emitFrameworkSwitched(framework: 'flutter' | 'angular' | 'both'): void {
        this.socketService.socket.emit('framework-switched', {
            roomId: this._roomId,
            framework: framework,
            userId: this._currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite evento de cambio de modo de exportación
     */
    emitExportModeChanged(mode: 'preview' | 'download' | 'copy'): void {
        this.socketService.socket.emit('export-mode-changed', {
            roomId: this._roomId,
            mode: mode,
            userId: this._currentUser,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite datos de colaboración
     */
    emitCollaborationData(data: CollaborationData): void {
        this.socketService.socket.emit('collaboration-data', {
            roomId: this._roomId,
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emite mensaje de chat
     */
    emitChatMessage(message: string): void {
        console.log('usuario actual:', this._currentUser, 'id:', this._currentUserId, 'pizarraId:', this._pizarraId);
        const chatMessage = {
            roomId: this._roomId,
            message: message,
            userId: this._currentUserId,
            user: this._currentUser,
            pizarraId: this._pizarraId,
            timestamp: new Date().toISOString()
        };
        console.log('Emitting chat message:', chatMessage);
        this.socketService.socket.emit('chatMessage', chatMessage);
    }

    /**
     * Emite evento de typing
     */
    emitTyping(): void {
        const data = {
            roomId: this._roomId,
            user: this._currentUser,
            timestamp: new Date().toISOString()
        };
        this.socketService.socket.emit('escribiendo', data);
    }

    /**
     * Manejador para elemento agregado
     */
    private handleElementAdded(data: any): void {
        console.log('Element added by another user:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('unified-element-added', {
            detail: {
                element: data.element,
                screenId: data.screenId,
                userId: data.userId,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para elemento actualizado
     */
    private handleElementUpdated(data: any): void {
        console.log('Element updated by another user:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('unified-element-updated', {
            detail: {
                element: data.element,
                screenId: data.screenId,
                userId: data.userId,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para elemento eliminado
     */
    private handleElementDeleted(data: any): void {
        console.log('Element deleted by another user:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('unified-element-deleted', {
            detail: {
                elementId: data.elementId,
                screenId: data.screenId,
                userId: data.userId,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para elemento seleccionado
     */
    private handleElementSelected(data: any): void {
        console.log('Element selected by another user:', data);

        // Si el usuario es diferente al actual, registrar como selección remota
        if (data.userId !== this._currentUser) {
            this._remoteSelections[data.element.id] = data.userId;
        }

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('unified-element-selected', {
            detail: {
                element: data.element,
                screenId: data.screenId,
                userId: data.userId,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para selección remota
     */
    private handleRemoteSelection(data: any): void {
        // Solo registrar si no es el usuario actual
        if (data.userId !== this._currentUserId) {
            console.log('Remote selection received:', data);
            this._remoteSelections[data.elementId] = data.userName;

            // Disparar evento personalizado para notificar a los componentes
            const event = new CustomEvent('remote-selection-changed', {
                detail: {
                    elementId: data.elementId,
                    userName: data.userName,
                    userId: data.userId
                }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Manejador para deselección remota
     */
    private handleRemoteDeselection(data: any): void {
        console.log('Remote deselection received:', data);
        delete this._remoteSelections[data.elementId];

        // Disparar evento personalizado para notificar a los componentes
        const event = new CustomEvent('remote-selection-changed', {
            detail: {
                elementId: data.elementId,
                userName: null,
                userId: data.userId
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para usuario desconectado
     */
    private handleUserLeft(userId: string): void {
        console.log('User left:', userId);

        // Eliminar todas las selecciones de este usuario
        Object.entries(this._remoteSelections).forEach(([elementId, userName]) => {
            // Si el usuario asociado con esta selección es el que se desconectó
            if (userName === userId) {
                delete this._remoteSelections[elementId];

                // Disparar evento de cambio de selección
                const event = new CustomEvent('remote-selection-changed', {
                    detail: {
                        elementId,
                        userName: null,
                        userId
                    }
                });
                document.dispatchEvent(event);
            }
        });
    }

    /**
     * Manejador para usuario editando
     */
    private handleUserEditing(data: any): void {
        console.log('User editing:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('user-editing', {
            detail: {
                userId: data.userId,
                elementId: data.elementId,
                elementType: data.elementType,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para usuario que terminó de editar
     */
    private handleUserStoppedEditing(data: any): void {
        console.log('User stopped editing:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('user-stopped-editing', {
            detail: {
                userId: data.userId,
                elementId: data.elementId,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para datos de colaboración
     */
    private handleCollaborationData(data: any): void {
        console.log('Collaboration data received:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('collaboration-data', {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para indicador de escritura (typing)
     */
    private handleTyping(data: any): void {
        console.log('Typing indicator received:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('user-typing', {
            detail: {
                user: data.user,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para cambio de framework
     */
    private handleFrameworkSwitched(data: any): void {
        console.log('Framework switched by another user:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('framework-switched', {
            detail: {
                framework: data.framework,
                userId: data.userId,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manejador para cambio de modo de exportación
     */
    private handleExportModeChanged(data: any): void {
        console.log('Export mode changed by another user:', data);

        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('export-mode-changed', {
            detail: {
                mode: data.mode,
                userId: data.userId,
                timestamp: data.timestamp
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Aplica las selecciones remotas a una lista de elementos
     * @param elements Lista de elementos
     * @returns Lista de elementos con propiedad remoteSelectedBy actualizada
     */
    applyRemoteSelections(elements: UnifiedElement[]): UnifiedElement[] {
        return elements.map(element => {
            if (element.id) {
                // Verificar si este elemento está seleccionado remotamente
                const remoteUser = this.getElementRemoteSelection(element.id);

                // Crear una copia con la propiedad remoteSelectedBy actualizada
                const updatedElement = {
                    ...element,
                    remoteSelectedBy: remoteUser
                };

                // Procesar recursivamente los elementos hijos si existen
                if (updatedElement.children && updatedElement.children.length > 0) {
                    updatedElement.children = this.applyRemoteSelections(updatedElement.children);
                }

                return updatedElement;
            }
            return element;
        });
    }

    /**
     * Comprueba si un elemento está seleccionado por otro usuario
     * @param elementId ID del elemento
     * @returns Nombre del usuario que tiene seleccionado el elemento, o undefined si no está seleccionado
     */
    getElementRemoteSelection(elementId: string): string | undefined {
        const userName = this._remoteSelections[elementId];

        // No devolver el nombre del usuario actual
        if (userName === this._currentUser) {
            return undefined;
        }

        return userName;
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
                    pizarraId: this._pizarraId,
                    userEmail: email,
                    status: status,
                    roomId: this._roomId
                });

                // Escuchar la respuesta del servidor
                const handleResponse = (data: any) => {
                    if (data._pizarraId === this._pizarraId && data.action === 'add') {
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
                    pizarraId: this._pizarraId,
                    userId: userId,
                    roomId: this._roomId
                });

                // Escuchar la respuesta del servidor
                const handleResponse = (data: any) => {
                    if (data._pizarraId === this._pizarraId && data.action === 'remove') {
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
                    pizarraId: this._pizarraId,
                    userId: userId,
                    status: status,
                    roomId: this._roomId
                });

                // Escuchar la respuesta del servidor
                const handleResponse = (data: any) => {
                    if (data._pizarraId === this._pizarraId && data.action === 'update') {
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
        return `${baseUrl}/pizarra_unificada/join?roomId=${this._roomId}&pizarraId=${this._pizarraId}&t=${timestamp}`;
    }
}
