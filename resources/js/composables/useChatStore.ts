import { ref, reactive } from 'vue';

export interface ChatMessage {
    id: string;
    text: string;
    user: string;
    timestamp: Date;
    type: 'text' | 'image' | 'file' | 'widget';
    metadata?: any;
}

export interface AIMessage {
    id: string;
    text: string;
    isUser: boolean;
    widgets?: any[];
    timestamp: Date;
    confidence?: number;
    suggestions?: string[];
}

export interface ChatUser {
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'away' | 'offline';
    isTyping?: boolean;
    lastSeen?: Date;
}

export interface ChatRoom {
    id: string;
    name: string;
    type: 'public' | 'private' | 'project';
    participants: ChatUser[];
    messages: ChatMessage[];
    unreadCount: number;
    lastActivity: Date;
}

export interface ChatConfig {
    autoScroll: boolean;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    darkMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    showTimestamps: boolean;
    showAvatars: boolean;
    enableEmojis: boolean;
    enableFileSharing: boolean;
    maxMessages: number;
    language: string;
    theme: string;
}

export interface AIConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    enableVoice: boolean;
    autoGenerateWidgets: boolean;
    framework: 'flutter' | 'angular' | 'react' | 'vue';
    language: string;
}

// Estado global del chat
export const chatState = reactive({
    isInitialized: false,
    currentRoom: null as ChatRoom | null,
    rooms: [] as ChatRoom[],
    currentUser: null as ChatUser | null,
    onlineUsers: [] as ChatUser[],
    isConnected: false,
    connectionStatus: 'disconnected' as 'connected' | 'connecting' | 'disconnected' | 'error',
    lastError: null as string | null,
});

// Configuración del chat
export const chatConfig = reactive<ChatConfig>({
    autoScroll: true,
    soundEnabled: true,
    notificationsEnabled: true,
    darkMode: false,
    fontSize: 'medium',
    showTimestamps: true,
    showAvatars: true,
    enableEmojis: true,
    enableFileSharing: true,
    maxMessages: 100,
    language: 'es',
    theme: 'default',
});

// Configuración de IA
export const aiConfig = reactive<AIConfig>({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: 'Eres un asistente especializado en desarrollo de interfaces de usuario.',
    enableVoice: true,
    autoGenerateWidgets: true,
    framework: 'flutter',
    language: 'es',
});

// Funciones de configuración
export function loadChatConfig() {
    const saved = localStorage.getItem('chatConfig');
    if (saved) {
        Object.assign(chatConfig, JSON.parse(saved));
    }
}

export function saveChatConfig() {
    localStorage.setItem('chatConfig', JSON.stringify(chatConfig));
}

export function loadAIConfig() {
    const saved = localStorage.getItem('aiConfig');
    if (saved) {
        Object.assign(aiConfig, JSON.parse(saved));
    }
}

export function saveAIConfig() {
    localStorage.setItem('aiConfig', JSON.stringify(aiConfig));
}

// Funciones de utilidad
export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatMessageTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString();
}

export function playNotificationSound() {
    if (chatConfig.soundEnabled) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore errors if sound can't be played
        });
    }
}

export function showNotification(title: string, message: string, options?: NotificationOptions) {
    if (chatConfig.notificationsEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                ...options
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message, ...options });
                }
            });
        }
    }
}

// Funciones de validación
export function isValidMessage(message: string): boolean {
    return message.trim().length > 0 && message.length <= 1000;
}

export function sanitizeMessage(message: string): string {
    return message.trim().replace(/\s+/g, ' ');
}

// Funciones de emoji
export const emojiMap = {
    ':)': '😊',
    ':D': '😄',
    ':(': '😢',
    ':P': '😛',
    ':o': '😮',
    ';)': '😉',
    '<3': '❤️',
    ':thumbsup:': '👍',
    ':thumbsdown:': '👎',
    ':fire:': '🔥',
    ':rocket:': '🚀',
    ':heart:': '❤️',
    ':star:': '⭐',
    ':check:': '✅',
    ':cross:': '❌',
};

export function processEmojis(text: string): string {
    if (!chatConfig.enableEmojis) return text;

    let processedText = text;
    for (const [code, emoji] of Object.entries(emojiMap)) {
        processedText = processedText.replace(new RegExp(code, 'g'), emoji);
    }
    return processedText;
}

// Funciones de archivos
export function isValidFileType(file: File): boolean {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json',
    ];
    return allowedTypes.includes(file.type);
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Funciones de búsqueda
export function searchMessages(query: string, messages: ChatMessage[]): ChatMessage[] {
    if (!query.trim()) return messages;

    const lowercaseQuery = query.toLowerCase();
    return messages.filter(message =>
        message.text.toLowerCase().includes(lowercaseQuery) ||
        message.user.toLowerCase().includes(lowercaseQuery)
    );
}

// Funciones de filtrado
export function filterMessagesByUser(userId: string, messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(message => message.user === userId);
}

export function filterMessagesByDate(date: Date, messages: ChatMessage[]): ChatMessage[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return messages.filter(message =>
        message.timestamp >= startOfDay && message.timestamp <= endOfDay
    );
}

// Funciones de exportación
export function exportChatHistory(messages: ChatMessage[]): string {
    const exportData = {
        exportedAt: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map(msg => ({
            timestamp: msg.timestamp.toISOString(),
            user: msg.user,
            text: msg.text,
            type: msg.type
        }))
    };

    return JSON.stringify(exportData, null, 2);
}

export function downloadChatHistory(messages: ChatMessage[], filename: string = 'chat-history.json') {
    const data = exportChatHistory(messages);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Funciones de análisis
export function getChatStatistics(messages: ChatMessage[]) {
    const stats = {
        totalMessages: messages.length,
        uniqueUsers: new Set(messages.map(m => m.user)).size,
        averageMessageLength: 0,
        mostActiveUser: '',
        messagesByHour: new Array(24).fill(0),
        messagesByDay: {} as Record<string, number>,
        messageTypes: {} as Record<string, number>
    };

    if (messages.length === 0) return stats;

    // Calcular longitud promedio
    stats.averageMessageLength = messages.reduce((sum, msg) => sum + msg.text.length, 0) / messages.length;

    // Contar mensajes por usuario
    const userCounts = {} as Record<string, number>;
    messages.forEach(msg => {
        userCounts[msg.user] = (userCounts[msg.user] || 0) + 1;
    });

    stats.mostActiveUser = Object.keys(userCounts).reduce((a, b) =>
        userCounts[a] > userCounts[b] ? a : b
    );

    // Mensajes por hora y día
    messages.forEach(msg => {
        const hour = msg.timestamp.getHours();
        const day = msg.timestamp.toDateString();

        stats.messagesByHour[hour]++;
        stats.messagesByDay[day] = (stats.messagesByDay[day] || 0) + 1;
        stats.messageTypes[msg.type] = (stats.messageTypes[msg.type] || 0) + 1;
    });

    return stats;
}

// Inicializar configuraciones
export function initializeChatStore() {
    loadChatConfig();
    loadAIConfig();
    chatState.isInitialized = true;
}

// Limpiar datos
export function clearChatData() {
    chatState.rooms = [];
    chatState.currentRoom = null;
    chatState.onlineUsers = [];
    localStorage.removeItem('chatConfig');
    localStorage.removeItem('aiConfig');
}
