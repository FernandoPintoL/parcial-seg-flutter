import { io } from 'socket.io-client';
import { AlertService } from './AlertService';
export class SocketService{
    currentUser;
    socketConnected;
    socketError;
    constructor(config, roomId, currentUser) {
        this.socket = io(config.url, config.options);
        this.roomId = roomId;
        this.currentUser = currentUser;
        this.socketConnected = false; // Initialize to false, will be set to true on 'connect' event
        this.socketError = '';
        this.autoJoin = false; // Flag to control auto-join behavior
        this.pizarraId = null; // Store pizarraId for room joining
    }

    /**
     * Establece la conexión con el servidor de sockets
     * @param {boolean} autoJoinRoom - Si es true, se unirá automáticamente a la sala especificada al conectar
     * @param {number} pizarraId - ID de la pizarra (requerido para unirse a la sala)
     */
    connect(autoJoinRoom = false, pizarraId = null) {
        this.socket.connect();
        this.autoJoin = autoJoinRoom;
        this.pizarraId = pizarraId;

        this.socket.on('connect', () => {
            this.socketConnected = true;
            console.log(`Conectado al servidor de sockets: ${this.socket.io.uri}`);

            // Si se activó la opción de auto-unirse y tenemos los datos necesarios
            if (this.autoJoin && this.roomId && this.pizarraId) {
                console.log(`Auto-uniendo a sala ${this.roomId} para pizarra ${this.pizarraId}`);
                this.joinRoom(this.pizarraId);
            }
        });

        this.socket.on('disconnect', () => {
            this.socketConnected = false;
            console.log('Desconectado del servidor de sockets');
            // AlertService.prototype.warning('Desconectado','Se perdió la conexión con el servidor de sockets.');
        });

        this.socket.on('connect_error', (error) => {
            this.socketError = error.message;
            console.error(`Error de conexión de socket: ${error.message}`);
            AlertService.prototype.error('Error de conexión', 'No se pudo conectar al servidor de sockets. Verifique su conexión a Internet.'+error.message);
        });
        this.socket.on('reconnect', (attempt) => {
            console.log(`Reconectado al servidor de sockets después de ${attempt} intentos`);
            AlertService.prototype.success('Reconectado', 'Se ha restablecido la conexión con el servidor de sockets.');

            // Al reconectar, volver a unirse a la sala si estaba configurado el auto-join
            if (this.autoJoin && this.roomId && this.pizarraId) {
                console.log(`Re-uniendo a sala ${this.roomId} después de reconexión`);
                this.joinRoom(this.pizarraId);
            }
        });
        this.socket.on('reconnect_error', (error) => {
            console.error(`Error de reconexión de socket: ${error.message}`);
            AlertService.prototype.error('Error de reconexión', 'No se pudo establecer una conexión con el servidor de sockets. Verifique su conexión a Internet.'+error.message);
        });
    }

    /**
     * Método simplificado para unirse a una sala usando los datos del constructor
     * @param {number} pizarraId - ID de la pizarra
     * @param {string} userName - Nombre del usuario (opcional, usa this.currentUser.name por defecto)
     * @returns {Promise} - Promesa que se resuelve cuando el servidor confirma la unión o se rechaza en caso de error
     */
    joinRoom(pizarraId, userName = null) {
        if (!this.socketConnected) {
            console.error('No se puede unir a la sala: no hay conexión con el servidor');
            return Promise.reject('No hay conexión con el servidor');
        }

        if (!pizarraId) {
            console.error('No se puede unir a la sala: no se especificó ID de pizarra');
            return Promise.reject('ID de pizarra no especificado');
        }

        // Guardar pizarraId para futuras reconexiones
        this.pizarraId = pizarraId;

        // Construir datos para unirse a la sala
        const joinData = {
            pizarraId: pizarraId,
            userId: this.currentUser?.id,
            roomId: this.roomId,
            userName: userName || this.currentUser?.name || 'Usuario'
        };

        console.log(`Intentando unirse a la sala ${this.roomId} para pizarra ${pizarraId}`);

        // Devolver una promesa que se resuelve cuando el servidor confirma la unión
        return new Promise((resolve, reject) => {
            // Emitir el evento joinRoom al servidor
            this.socket.emit('joinRoom', joinData);

            // Configurar un timeout para detectar si no hay respuesta
            const timeout = setTimeout(() => {
                reject('Timeout al unirse a la sala: no se recibió respuesta del servidor');
            }, 5000); // 5 segundos de timeout

            // Escuchar el evento error solo una vez
            this.socket.once('error', (errorData) => {
                clearTimeout(timeout);
                console.error(`Error al unirse a la sala: ${errorData.message}`);
                AlertService.prototype.error('Error', `Error al unirse a la sala: ${errorData.message}`);
                reject(errorData.message);
            });

            // Escuchar eventos que indican unión exitosa (solo una vez)
            const successEvents = ['formUpdate', 'roomUsers'];
            const successHandler = (data) => {
                clearTimeout(timeout);
                // Limpiar los otros listeners
                successEvents.forEach(evt => this.socket.removeListener(evt, successHandler));
                this.socket.removeListener('error', errorHandler);

                console.log(`Unido exitosamente a la sala ${this.roomId}`);
                AlertService.prototype.success('Conectado', `Te has unido a la sala: ${this.roomId}`);
                resolve(data);
            };

            const errorHandler = (errorData) => {
                clearTimeout(timeout);
                // Limpiar los otros listeners
                successEvents.forEach(evt => this.socket.removeListener(evt, successHandler));
                reject(errorData.message);
            };

            // Escuchar cualquiera de estos eventos indica unión exitosa
            successEvents.forEach(evt => this.socket.once(evt, successHandler));
        });
    }

    /**
     * Método original para unirse a una sala con datos personalizados
     * @deprecated Use joinRoom instead for simpler usage
     */
    joinRoomData(data) {
        console.log('Uniendo a sala con datos personalizados:', data);
        this.socket.emit('joinRoom', data);

        // Nota: Este método no espera confirmación del servidor
        // Se mantiene por compatibilidad pero se recomienda usar joinRoom()
    }

    on(event, callback) {
        this.socket.on(event, callback);
    }

    emit(event, data) {
        console.log(`Emitiendo evento ${event}:`, data);
        this.socket.emit(event, data);
    }

    disconnect() {
        // Si estamos en una sala, notificar que salimos antes de desconectar
        if (this.socketConnected && this.roomId) {
            this.socket.emit('leaveRoom', {
                roomId: this.roomId,
                user: this.currentUser?.id,
                userName: this.currentUser?.name,
                pizarraId: this.pizarraId
            });
        }

        this.socket.disconnect();
        this.socket.removeAllListeners();
        console.log('Desconectado del servidor de sockets');
    }
}
