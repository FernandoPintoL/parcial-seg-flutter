<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue';
import { Socket } from 'socket.io-client';
import axios from 'axios';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import ChatAI from '@/pages/Chat/ChatAI.vue';

// Props
const props = defineProps<{
    socket: Socket;
    roomId: string | null;
    currentUser: string;
    socketUrl?: string;
    framework?: 'flutter' | 'angular' | 'react';
}>();

// Emits
const emit = defineEmits<{
    'add-widgets-to-canvas': [widgets: any[]];
    'chat-message': [message: string];
    'ai-response': [response: any];
}>();

// Estado del chat
const chatState = reactive({
    isOpen: false,
    activeTab: 'colaborativo' as 'colaborativo' | 'ai',
    isMinimized: false,
    unreadMessages: 0,
    unreadAIMessages: 0,
    position: { x: 0, y: 0 },
    isDragging: false,
    isFloating: true
});

// Chat colaborativo
const collaborativeChat = reactive({
    messages: [] as any[],
    message: '',
    typing: { user: '', timeout: null as number | null },
    isTyping: false,
    onlineUsers: [] as string[],
    isConnected: false
});

// Chat AI
const aiChat = reactive({
    messages: [] as { text: string; isUser: boolean; widgets?: any[]; timestamp: Date }[],
    prompt: '',
    isProcessing: false,
    conversationHistory: [] as any[],
    suggestions: [] as string[],
    language: 'es'
});

// Estado de grabación de audio
const audioRecording = reactive({
    isRecording: false,
    mediaRecorder: null as MediaRecorder | null,
    audioChunks: [] as Blob[],
    recordingTime: 0,
    timer: null as number | null
});

// Configuración del chat
const chatConfig = reactive({
    autoScroll: true,
    soundEnabled: true,
    darkMode: false,
    fontSize: 'medium',
    showTimestamps: true,
    enableEmojis: true,
    maxMessages: 100
});

// Computed properties
const totalUnreadMessages = computed(() =>
    chatState.unreadMessages + chatState.unreadAIMessages
);

const isAISupported = computed(() => {
    return props.framework && ['flutter', 'angular', 'react'].includes(props.framework);
});

// Funciones del chat colaborativo
async function loadChatHistory() {
    try {
        const baseUrl = props.socketUrl || 'http://localhost:4000';
        const response = await axios.get(`${baseUrl}/chat-history/${props.roomId}`);

        if (response.data?.success && response.data?.messages) {
            collaborativeChat.messages = response.data.messages;
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

function sendCollaborativeMessage() {
    if (!collaborativeChat.message.trim()) return;

    const messageData = {
        text: collaborativeChat.message,
        user: props.currentUser,
        room: props.roomId,
        timestamp: new Date().toISOString()
    };

    props.socket.emit('chatMessage', messageData);
    emit('chat-message', collaborativeChat.message);

    collaborativeChat.message = '';
    collaborativeChat.isTyping = false;
}

function handleTyping() {
    if (!collaborativeChat.isTyping) {
        collaborativeChat.isTyping = true;
        props.socket.emit('typing', {
            user: props.currentUser,
            room: props.roomId
        });
    }
}

// Funciones del chat AI
async function sendAIMessage() {
    if (!aiChat.prompt.trim() || aiChat.isProcessing) return;

    const userMessage = aiChat.prompt.trim();
    aiChat.messages.push({
        text: userMessage,
        isUser: true,
        timestamp: new Date()
    });

    aiChat.prompt = '';
    aiChat.isProcessing = true;

    try {
        const response = await axios.post('/api/ai/chat', {
            message: userMessage,
            framework: props.framework || 'flutter',
            history: aiChat.conversationHistory,
            language: aiChat.language
        });

        if (response.data.success) {
            const aiResponse = response.data.data;

            aiChat.messages.push({
                text: aiResponse.text,
                isUser: false,
                widgets: aiResponse.widgets,
                timestamp: new Date()
            });

            // Actualizar historial de conversación
            aiChat.conversationHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: aiResponse.text }
            );

            // Actualizar sugerencias
            if (aiResponse.suggestions) {
                aiChat.suggestions = aiResponse.suggestions;
            }

            emit('ai-response', aiResponse);
        }
    } catch (error) {
        console.error('Error sending AI message:', error);
        aiChat.messages.push({
            text: 'Error al procesar el mensaje. Por favor, intenta nuevamente.',
            isUser: false,
            timestamp: new Date()
        });
    } finally {
        aiChat.isProcessing = false;
        scrollToBottom();
    }
}

function addAIWidgetsToCanvas(widgets: any[]) {
    emit('add-widgets-to-canvas', widgets);
}

function applySuggestion(suggestion: string) {
    aiChat.prompt = suggestion;
    sendAIMessage();
}

// Funciones de grabación de audio
async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioRecording.mediaRecorder = new MediaRecorder(stream);
        audioRecording.audioChunks = [];
        audioRecording.recordingTime = 0;

        audioRecording.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioRecording.audioChunks.push(event.data);
            }
        };

        audioRecording.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioRecording.audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(track => track.stop());
            await processAudioToText(audioBlob);
        };

        audioRecording.mediaRecorder.start();
        audioRecording.isRecording = true;

        // Iniciar timer
        audioRecording.timer = window.setInterval(() => {
            audioRecording.recordingTime++;
        }, 1000);

    } catch (error) {
        console.error('Error starting audio recording:', error);
        alert('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
    }
}

function stopAudioRecording() {
    if (audioRecording.mediaRecorder && audioRecording.isRecording) {
        audioRecording.mediaRecorder.stop();
        audioRecording.isRecording = false;

        if (audioRecording.timer) {
            clearInterval(audioRecording.timer);
            audioRecording.timer = null;
        }
    }
}

async function processAudioToText(audioBlob: Blob) {
    try {
        aiChat.isProcessing = true;

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', aiChat.language);

        const response = await fetch('/api/speech/speech-to-text', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            },
        });

        const result = await response.json();

        if (result.success && result.data.text) {
            aiChat.prompt = result.data.text;
            await sendAIMessage();
        }
    } catch (error) {
        console.error('Error processing audio:', error);
        alert('Error al procesar el audio. Intenta nuevamente.');
    } finally {
        aiChat.isProcessing = false;
    }
}

// Funciones de interfaz
function toggleChat() {
    chatState.isOpen = !chatState.isOpen;
    if (chatState.isOpen) {
        chatState.unreadMessages = 0;
        chatState.unreadAIMessages = 0;
        scrollToBottom();
    }
}

function switchTab(tab: 'colaborativo' | 'ai') {
    chatState.activeTab = tab;
    if (tab === 'colaborativo') {
        chatState.unreadMessages = 0;
    } else {
        chatState.unreadAIMessages = 0;
    }
    scrollToBottom();
}

function minimizeChat() {
    chatState.isMinimized = !chatState.isMinimized;
}

function scrollToBottom() {
    setTimeout(() => {
        if (chatConfig.autoScroll) {
            const chatContainer = document.querySelector('.chat-messages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    }, 100);
}

function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRecordingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Inicialización y eventos socket
onMounted(() => {
    loadChatHistory();

    // Eventos socket para chat colaborativo
    props.socket.on('chatMessage', (message) => {
        collaborativeChat.messages.push(message);
        if (!chatState.isOpen || chatState.activeTab !== 'colaborativo') {
            chatState.unreadMessages++;
        }
        scrollToBottom();
    });

    props.socket.on('userTyping', (data) => {
        if (data.user !== props.currentUser) {
            collaborativeChat.typing.user = data.user;
            if (collaborativeChat.typing.timeout) {
                clearTimeout(collaborativeChat.typing.timeout);
            }
            collaborativeChat.typing.timeout = setTimeout(() => {
                collaborativeChat.typing.user = '';
            }, 3000);
        }
    });

    props.socket.on('userJoined', (data) => {
        collaborativeChat.onlineUsers = data.users;
        collaborativeChat.isConnected = true;
    });

    props.socket.on('userLeft', (data) => {
        collaborativeChat.onlineUsers = data.users;
    });

    props.socket.on('disconnect', () => {
        collaborativeChat.isConnected = false;
    });
});

onUnmounted(() => {
    if (audioRecording.timer) {
        clearInterval(audioRecording.timer);
    }
    if (audioRecording.mediaRecorder && audioRecording.isRecording) {
        audioRecording.mediaRecorder.stop();
    }
});

// Watch para limpiar mensajes antiguos
watch(() => collaborativeChat.messages.length, (newLength) => {
    if (newLength > chatConfig.maxMessages) {
        collaborativeChat.messages.splice(0, newLength - chatConfig.maxMessages);
    }
});

watch(() => aiChat.messages.length, (newLength) => {
    if (newLength > chatConfig.maxMessages) {
        aiChat.messages.splice(0, newLength - chatConfig.maxMessages);
    }
});
</script>

<template>
    <!-- Botón flotante para abrir chat -->
    <div
        v-if="!chatState.isOpen"
        class="fixed bottom-4 right-4 z-50"
    >
        <button
            @click="toggleChat"
            class="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>

            <!-- Contador de mensajes no leídos -->
            <div
                v-if="totalUnreadMessages > 0"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
            >
                {{ totalUnreadMessages > 99 ? '99+' : totalUnreadMessages }}
            </div>
        </button>
    </div>

    <!-- Ventana de chat -->
    <div
        v-if="chatState.isOpen"
        class="fixed bottom-4 right-4 z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col transition-all duration-300"
        :class="{ 'h-16': chatState.isMinimized, 'h-[600px]': !chatState.isMinimized }"
    >
        <!-- Header del chat -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <h3 class="font-semibold">Chat Sistema</h3>
                <div class="flex items-center space-x-1">
                    <div
                        class="w-2 h-2 rounded-full"
                        :class="collaborativeChat.isConnected ? 'bg-green-400' : 'bg-red-400'"
                    ></div>
                    <span class="text-xs">{{ collaborativeChat.isConnected ? 'Conectado' : 'Desconectado' }}</span>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <button
                    @click="minimizeChat"
                    class="text-white hover:text-gray-200 transition-colors p-1"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                    </svg>
                </button>
                <button
                    @click="toggleChat"
                    class="text-white hover:text-gray-200 transition-colors p-1"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Contenido del chat (oculto cuando está minimizado) -->
        <div v-if="!chatState.isMinimized" class="flex-1 flex flex-col">
            <!-- Tabs -->
            <div class="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    @click="switchTab('colaborativo')"
                    class="flex-1 py-3 px-4 text-sm font-medium transition-colors relative"
                    :class="chatState.activeTab === 'colaborativo'
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                >
                    Chat Grupal
                    <span
                        v-if="chatState.unreadMessages > 0 && chatState.activeTab !== 'colaborativo'"
                        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {{ chatState.unreadMessages }}
                    </span>
                </button>

                <button
                    v-if="isAISupported"
                    @click="switchTab('ai')"
                    class="flex-1 py-3 px-4 text-sm font-medium transition-colors relative"
                    :class="chatState.activeTab === 'ai'
                        ? 'bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                >
                    Chat IA
                    <span
                        v-if="chatState.unreadAIMessages > 0 && chatState.activeTab !== 'ai'"
                        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {{ chatState.unreadAIMessages }}
                    </span>
                </button>
            </div>

            <!-- Chat colaborativo -->
            <div v-if="chatState.activeTab === 'colaborativo'" class="flex-1 flex flex-col">
                <!-- Usuarios online -->
                <div v-if="collaborativeChat.onlineUsers.length > 0" class="p-2 bg-gray-50 dark:bg-gray-700 border-b">
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-600 dark:text-gray-400">En línea:</span>
                        <div class="flex space-x-1">
                            <span
                                v-for="user in collaborativeChat.onlineUsers.slice(0, 3)"
                                :key="user"
                                class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                            >
                                {{ user }}
                            </span>
                            <span
                                v-if="collaborativeChat.onlineUsers.length > 3"
                                class="text-xs text-gray-500 dark:text-gray-400"
                            >
                                +{{ collaborativeChat.onlineUsers.length - 3 }} más
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Mensajes -->
                <div class="flex-1 overflow-y-auto p-4 chat-messages">
                    <div v-if="collaborativeChat.messages.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
                        <div class="text-4xl mb-4">💬</div>
                        <p>No hay mensajes aún</p>
                        <p class="text-sm">¡Inicia la conversación!</p>
                    </div>

                    <div
                        v-for="(message, index) in collaborativeChat.messages"
                        :key="index"
                        class="mb-4"
                        :class="message.user === props.currentUser ? 'text-right' : 'text-left'"
                    >
                        <div
                            class="inline-block px-4 py-2 rounded-lg max-w-[80%] shadow-sm"
                            :class="message.user === props.currentUser
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'"
                        >
                            <div v-if="message.user !== props.currentUser" class="font-semibold text-xs mb-1 opacity-75">
                                {{ message.user }}
                            </div>
                            <div class="break-words">{{ message.text || message.message }}</div>
                            <div v-if="chatConfig.showTimestamps" class="text-xs mt-1 opacity-75">
                                {{ formatTime(new Date(message.timestamp || message.created_at)) }}
                            </div>
                        </div>
                    </div>

                    <!-- Indicador de escritura -->
                    <div v-if="collaborativeChat.typing.user" class="text-sm text-gray-500 dark:text-gray-400 italic">
                        {{ collaborativeChat.typing.user }} está escribiendo...
                    </div>
                </div>

                <!-- Input de mensaje -->
                <form @submit.prevent="sendCollaborativeMessage" class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex space-x-2">
                        <input
                            v-model="collaborativeChat.message"
                            @input="handleTyping"
                            type="text"
                            placeholder="Escribe un mensaje..."
                            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            :disabled="!collaborativeChat.message.trim()"
                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </div>
                </form>
            </div>

            <!-- Chat AI -->
            <div v-if="chatState.activeTab === 'ai'" class="flex-1 flex flex-col">
                <!-- Mensajes AI -->
                <div class="flex-1 overflow-y-auto p-4 chat-messages">
                    <div v-if="aiChat.messages.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
                        <div class="text-4xl mb-4">🤖</div>
                        <p>Asistente IA para {{ props.framework?.toUpperCase() }}</p>
                        <p class="text-sm mt-2">Describe la interfaz que deseas crear</p>
                    </div>

                    <div
                        v-for="(message, index) in aiChat.messages"
                        :key="index"
                        class="mb-4"
                        :class="message.isUser ? 'text-right' : 'text-left'"
                    >
                        <div
                            class="inline-block px-4 py-2 rounded-lg max-w-[90%] shadow-sm"
                            :class="message.isUser
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'"
                        >
                            <div class="font-semibold text-xs mb-1 opacity-75">
                                {{ message.isUser ? 'Tú' : 'Asistente IA' }}
                            </div>
                            <div class="break-words whitespace-pre-wrap">{{ message.text }}</div>

                            <!-- Botón para añadir widgets -->
                            <div v-if="!message.isUser && message.widgets?.length" class="mt-2">
                                <button
                                    @click="addAIWidgetsToCanvas(message.widgets)"
                                    class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                                >
                                    ✨ Añadir a la Pizarra
                                </button>
                            </div>

                            <div v-if="chatConfig.showTimestamps" class="text-xs mt-1 opacity-75">
                                {{ formatTime(message.timestamp) }}
                            </div>
                        </div>
                    </div>

                    <!-- Indicador de procesamiento -->
                    <div v-if="aiChat.isProcessing" class="text-center py-4">
                        <div class="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Procesando...</span>
                        </div>
                    </div>
                </div>

                <!-- Sugerencias -->
                <div v-if="aiChat.suggestions.length > 0" class="p-2 border-t border-gray-200 dark:border-gray-700">
                    <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">Sugerencias:</div>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="suggestion in aiChat.suggestions"
                            :key="suggestion"
                            @click="applySuggestion(suggestion)"
                            class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                            {{ suggestion }}
                        </button>
                    </div>
                </div>

                <!-- Input de mensaje AI -->
                <form @submit.prevent="sendAIMessage" class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex space-x-2">
                        <input
                            v-model="aiChat.prompt"
                            type="text"
                            placeholder="Describe tu interfaz..."
                            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <!-- Botón de grabación -->
                        <button
                            type="button"
                            @click="audioRecording.isRecording ? stopAudioRecording() : startAudioRecording()"
                            class="px-3 py-2 rounded-lg transition-colors"
                            :class="audioRecording.isRecording
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                            </svg>
                        </button>

                        <button
                            type="submit"
                            :disabled="!aiChat.prompt.trim() || aiChat.isProcessing"
                            class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Indicador de grabación -->
                    <div v-if="audioRecording.isRecording" class="mt-2 text-center">
                        <div class="inline-flex items-center space-x-2 text-red-500">
                            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span class="text-sm">Grabando: {{ formatRecordingTime(audioRecording.recordingTime) }}</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-messages {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
}

.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
    background: #f7fafc;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
}

.dark .chat-messages::-webkit-scrollbar-track {
    background: #2d3748;
}

.dark .chat-messages::-webkit-scrollbar-thumb {
    background: #4a5568;
}

.dark .chat-messages::-webkit-scrollbar-thumb:hover {
    background: #718096;
}
</style>
