<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import type { Message } from '@/Data/Pizarra';
import { UnifiedCollaborationService } from '@/services/UnifiedCollaborationService';
import axios from 'axios';

const props = defineProps<{
    collaborationService: UnifiedCollaborationService | null;
    roomId: string | null;
    currentUser: string;
    showChat: boolean;
    socketUrl?: string; // URL for socket server
}>();

// Variables del chat
const chatMessages = ref<Message[]>([]);
const chatMessage = ref<string>('');

const chatTyping = reactive<{ typing: string; timeout: number | null }>({
    typing: '',
    timeout: null
});

const emit = defineEmits<{
    'close': [],
    'send-message': [message: string],
    'typing': [],
}>();

// Función para cargar mensajes históricos
async function loadChatMessages() {
    try {
        // Use the provided socketUrl or fallback to default
        const baseUrl = props.socketUrl || 'http://localhost:4000';
        const response = await axios.get(`${baseUrl}/chat-history/${props.roomId}`);
        if (response.data && response.data.success && response.data.messages) {
            chatMessages.value = response.data.messages;
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
    }
}

const chatContainer = ref<HTMLElement | null>(null);
function scrollToBottom() {
    if (chatContainer.value) {
        console.log('Desplazando usando ref:', chatContainer.value);
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
}

function toggleFloatingChat() {
    emit('close');
}

// Emite el evento al enviar
function onSubmit() {
    if (!chatMessage.value.trim()) return;
    try {
        // Use collaboration service to send a message
        if (props.collaborationService && typeof props.collaborationService.emitChatMessage === 'function') {
            props.collaborationService.emitChatMessage(chatMessage.value);
        } else {
            console.log('Uso de respaldo para enviar mensajes');
            emit('send-message', chatMessage.value);
        }
    } catch (error) {
        console.error('Error sending chat message:', error);
        // Fallback to emit event if method call fails
        emit('send-message', chatMessage.value);
    }

    chatMessage.value = ''; // Limpiar el mensaje después de enviarlo
}

// Función para el evento de typing
function onInput() {
    try {
        // Use collaboration service to emit typing
        if (props.collaborationService && typeof props.collaborationService.emitTyping === 'function') {
            props.collaborationService.emitTyping();
        } else {
            console.log('Using fallback for typing indicator');
            emit('typing');
        }
    } catch (error) {
        console.error('Error emitting typing indicator:', error);
        // Fallback to emit event if method call fails
        emit('typing');
    }
}

// Watch for changes to showChat prop
watch(() => props.showChat, (newValue) => {
    if (newValue) {
        // When chat is opened, scroll to bottom
        setTimeout(scrollToBottom, 100); // Small delay to ensure DOM is updated
    }
});

// Variable para almacenar la referencia al event listener
const userTypingListener = ref<EventListener | null>(null);

onMounted(() => {
    try {
        /*if (props.collaborationService?.socket) {
            // Enviar un ping al servidor
            props.collaborationService.socket.emit('ping', { userId: props.currentUser, roomId: props.roomId });

            // Escuchar la respuesta
            props.collaborationService.socket.on('pong', (data) => {
                console.log('Conexión confirmada con el servidor:', data);
            });
        }*/

        // Comprueba si el socket existe y su estado
        if (props.collaborationService?.socket) {
            /*console.log('Estado del socket:', {
                id: props.collaborationService.socket.id,
                connected: props.collaborationService.socket.connected,
                disconnected: props.collaborationService.socket.disconnected
            });*/

            // Añadir un listener específico para verificar la conexión
            props.collaborationService.socket.on('connect', () => {
                console.log('Socket conectado con ID:', props.collaborationService!.socket.id ?? 0);
            });
        } else {
            console.error('No hay socket disponible');
        }

        if (props.collaborationService?.socket && props.roomId) {
            props.collaborationService.socket.emit('joinRoom', {
                pizarraId: props.collaborationService.pizarraId,
                userId: props.collaborationService.currentUserId,
                roomId: props.roomId,
                userName: props.currentUser
            });
        }

        // Load chat messages with error handling
        loadChatMessages().catch(error => {
            console.error('Error loading chat messages:', error);
        });

        // Si el chat ya está abierto cuando se monta el componente, desplácese hasta la parte inferior
        if (props.showChat) {
            // console.log('ChatColaborativo: Chat abierto, desplazándose hasta la parte inferior');
            setTimeout(scrollToBottom, 100);
        }

        // Validate collaboration service and socket
        if (!props.collaborationService) {
            console.log('ChatColaborativo: No collaboration service provided');
            console.warn('ChatColaborativo: No collaboration service available');
            return;
        }
        if (!props.collaborationService.socket) {
            console.log('ChatColaborativo: No socket available in collaboration service');
            console.warn('ChatColaborativo: No hay ningún socket disponible en el servicio de colaboración');
            return;
        }
        // console.log('ChatColaborativo: Collaboration service and socket are available');

        // Registrar listeners al conectar y reconectar
        const socket = props.collaborationService.socket;
        // Log el estado actual del socket
        // console.log('Estado del socket al montar:', socket.connected, socket.id);
        /*socket.on('connect', () => {
            console.log('ChatColaborativo: Socket conectado, registrando listeners...');
        });*/
        // Si el socket ya está conectado, registrar listeners manualmente
        if (socket.connected) {
            // console.log('Socket ya estaba conectado, registrando listeners manualmente...');
            setupSocketEventListeners();
        }
        // Registrar listeners inicialmente (por si acaso)
        // setupSocketEventListeners();
    } catch (error) {
        console.error('ChatColaborativo: Error in onMounted:', error);
    }
});

// Limpiar event listeners cuando el componente se desmonta
onUnmounted(() => {
    try {
        // Remover el event listener para el evento personalizado si existe
        if (userTypingListener.value) {
            document.removeEventListener('user-typing', userTypingListener.value);
        }

        // Limpiar el timeout si existe
        if (chatTyping.timeout) {
            clearTimeout(chatTyping.timeout);
        }

        console.log('ChatColaborativo: Event listeners cleaned up');
    } catch (error) {
        console.error('ChatColaborativo: Error in onUnmounted:', error);
    }
});

// Helper function to set up socket event listeners with proper error handling
function setupSocketEventListeners() {
    if (!props.collaborationService || !props.collaborationService.socket) return;
    try {
        const socket = props.collaborationService.socket;

        // Primero, eliminar los listeners existentes para evitar duplicados
        socket.off('chatMessage');
        socket.off('chatHistory');
        socket.off('escribiendo');
        socket.off('error');

        // console.log('Registrando listeners de socket en ChatColaborativo...', socket.id);

        // Escucha el evento de mensajes del servidor
        socket.on('chatMessage', (message: Message) => {
            console.log('Listener chatMessage ejecutado', message);
            try {
                if (message) {
                    chatMessages.value.push(message);
                    scrollToBottom();
                }
            } catch (error) {
                console.error('Error al procesar mensaje de chat:', error);
            }
        });

        // Escucha el evento del historial de chat
        socket.on('chatHistory', (data: { messages: Message[], roomId: string }) => {
            // console.log('Listener chatHistory ejecutado', data);
            try {
                if (data && Array.isArray(data.messages) && data.roomId === props.roomId) {
                    chatMessages.value = data.messages;
                    scrollToBottom();
                }
            } catch (error) {
                console.error('Error al procesar historial de chat:', error);
            }
        });

        // Escucha el evento de usuarios escribiendo (escribiendo = typing in Spanish)
        socket.on('escribiendo', (typingInfo: { user: string, roomId: string }) => {
            try {
                if (typingInfo && typingInfo.user) {
                    chatTyping.typing = `${typingInfo.user} está escribiendo...`;
                    if (chatTyping.timeout) clearTimeout(chatTyping.timeout);
                    chatTyping.timeout = window.setTimeout(() => {
                        chatTyping.typing = '';
                    }, 3000);
                }
            } catch (error) {
                console.error('Error al procesar evento de escritura:', error);
            }
        });

        // También escuchar el evento personalizado de escritura desde UnifiedCollaborationService
        const handleUserTyping = (event: CustomEvent) => {
            console.log('Manejo de eventos de escritura personalizados por parte del usuario:', event);
            try {
                const typingInfo = event.detail;
                if (typingInfo && typingInfo.user && typingInfo.roomId === props.roomId) {
                    chatTyping.typing = `${typingInfo.user} está escribiendo...`;
                    if (chatTyping.timeout) clearTimeout(chatTyping.timeout);
                    chatTyping.timeout = window.setTimeout(() => {
                        chatTyping.typing = '';
                    }, 3000);
                }
            } catch (error) {
                console.error('Error al procesar evento personalizado de escritura:', error);
            }
        };

        // Almacenar la referencia al event listener para poder removerlo después
        userTypingListener.value = handleUserTyping as EventListener;

        // Agregar el event listener para el evento personalizado
        document.addEventListener('user-typing', userTypingListener.value);

        // Add error event listener
        socket.on('error', (error: any) => {
            console.error('Socket error:', error);
        });

        console.log('ChatColaborativo: Los oyentes de eventos se configuraron correctamente');
    } catch (error) {
        console.error('ChatColaborativo: Error setting up event listeners:', error);
    }
}

</script>
<template>
    <div v-if="showChat"
        class="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col transition-colors">
        <!-- Chat Header -->
        <div class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-t-lg flex flex-col">
            <div class="flex justify-between items-center">
                <h3 class="font-semibold">Chat del Proyecto</h3>
                <button @click="toggleFloatingChat" class="text-white hover:text-gray-200 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div class="text-xs text-blue-100 mt-1">Sala: {{ roomId }}</div>
        </div>

        <!-- Chat Messages -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4">
            <div v-if="chatMessages.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-4">
                No hay mensajes aún
            </div>

            <div v-for="(msg, index) in chatMessages" :key="index" class="mb-3"
                :class="(msg.user_name) === currentUser ? 'text-right' : 'text-left'">
                <div class="inline-block px-3 py-2 rounded-lg max-w-[80%]"
                    :class="(msg.user_name) === currentUser ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30' : 'bg-gray-100 dark:bg-gray-700'">
                    <div class="font-semibold text-xs text-gray-600 dark:text-gray-300">{{ msg.user_name }}</div>
                    <div class="dark:text-white">{{ msg.text }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ new
                        Date(msg.timestamp).toLocaleTimeString() }}
                    </div>
                </div>
            </div>

            <p v-if="chatTyping.typing" class="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                {{ chatTyping.typing }}
            </p>
        </div>

        <!-- Chat Input -->
        <form @submit.prevent="onSubmit" class="border-t border-gray-300 dark:border-gray-600 p-2 flex gap-2">
            <input v-model="chatMessage" type="text" placeholder="Escribe un mensaje..."
                class="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                @input="onInput" />
            <button type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Enviar
            </button>
        </form>
    </div>

</template>
