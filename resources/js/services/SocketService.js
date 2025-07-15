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
        this.socketConnected = true;
        this.socketError = '';
    }
    connect() {
        this.socket.connect();

        this.socket.on('connect', () => {
            this.socketConnected = true;
            console.log(`Connected to socket server: ${this.socket.io.uri}`);
        });

        this.socket.on('disconnect', () => {
            this.socketConnected = false;
            console.log('Disconnected from socket server');
            // AlertService.prototype.warning('Desconectado','Se perdió la conexión con el servidor de sockets.');
        });

        this.socket.on('connect_error', (error) => {
            this.socketError = error.message;
            console.error(`Socket connection error: ${error.message}`);
            AlertService.prototype.error('Error de conexión', 'No se pudo conectar al servidor de sockets. Verifique su conexión a Internet.'+error.message);
        });
        this.socket.on('reconnect', (attempt) => {
            console.log(`Reconnected to socket server after ${attempt} attempts`);
            AlertService.prototype.success('Reconectado', 'Se ha restablecido la conexión con el servidor de sockets.');
        });
        this.socket.on('reconnect_error', (error) => {
            console.error(`Socket reconnection error: ${error.message}`);
            AlertService.prototype.error('Error de reconexión', 'No se pudo establecer una conexión con el servidor de sockets. Verifique su conexión a Internet.'+error.message);
        });
    }
    joinRoomData(data) {
        this.socket.emit('joinRoom', data, (ack) =>{
            if (ack.status === 'success') {
                console.log(`Joined room: ${ack.roomId}`);
                AlertService.prototype.success('Unido a sala', `Te has unido a la sala: ${ack.roomId}`);
            } else {
                console.error(`Failed to join room: ${ack.message}`);
                AlertService.prototype.error('Error al unirse a la sala', ack.message);
            }
        });
    }
    on(event, callback) {
        this.socket.on(event, callback);
    }
    emit(event, data) {
        this.socket.emit(event, data, (ack) => {
            if (ack.status === 'success') {
                console.log(`Event emitted: ${event}`);
            } else {
                console.error(`Failed to emit event: ${ack.message}`);
                AlertService.prototype.error('Error al emitir evento', ack.message);
            }
        });
    }
    disconnect() {
        this.socket.disconnect();
        this.socket.removeAllListeners();
    }
}
