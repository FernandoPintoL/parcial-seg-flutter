// composables/useAIChat.ts
import { ref, reactive, computed, readonly } from 'vue';
import { AIService } from '@/services/AIService';
import { AlertService } from '@/services/AlertService';
import type { AIMessage, AIConfig } from '@/composables/useChatStore';

export interface AIChatState {
    messages: AIMessage[];
    currentPrompt: string;
    isProcessing: boolean;
    showChat: boolean;
    selectedModel: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    autoSuggestWidgets: boolean;
    includeContext: boolean;
    streamResponse: boolean;
}

export interface AIChatActions {
    sendMessage: (message?: string) => Promise<void>;
    sendAudioPrompt: (audioBlob: Blob) => Promise<void>;
    clearConversation: () => void;
    exportConversation: () => void;
    importConversation: (data: any) => void;
    toggleChat: () => void;
    updateSettings: (settings: Partial<AIConfig>) => void;
    addWidgetsToCanvas: (widgets: any[]) => void;
}

export function useAIChat(
    onWidgetsGenerated?: (widgets: any[]) => void,
    onCodeParsed?: (code: string) => void
) {
    // State
    const state = reactive<AIChatState>({
        messages: [],
        currentPrompt: '',
        isProcessing: false,
        showChat: false,
        selectedModel: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: '',
        autoSuggestWidgets: true,
        includeContext: true,
        streamResponse: true,
    });

    // Computed
    const hasMessages = computed(() => state.messages.length > 0);
    const lastMessage = computed(() => state.messages[state.messages.length - 1]);
    const userMessages = computed(() => state.messages.filter(msg => msg.isUser));
    const aiMessages = computed(() => state.messages.filter(msg => !msg.isUser));

    // Extraer función para obtener el framework válido
    function getFramework(): 'vue' | 'flutter' | 'angular' | 'react' {
        // Si el estado tiene framework válido, úsalo, si no, por defecto 'flutter'
        const validFrameworks = ['vue', 'flutter', 'angular', 'react'];
        // @ts-ignore
        if (validFrameworks.includes(state.framework)) return state.framework;
        return 'flutter';
    }

    // Actions
    const sendMessage = async (message?: string) => {
        const prompt = message || state.currentPrompt;
        if (!prompt.trim() || state.isProcessing) return;

        state.currentPrompt = '';
        state.isProcessing = true;

        try {
            const request = {
                prompt,
                aiMessages: state.messages,
                isProcessingAI: state.isProcessing,
                config: {
                    model: state.selectedModel,
                    temperature: state.temperature,
                    maxTokens: state.maxTokens,
                    systemPrompt: state.systemPrompt,
                    enableVoice: true,
                    autoGenerateWidgets: state.autoSuggestWidgets,
                    framework: getFramework(),
                    language: 'es'
                }
            };

            const response = await AIService.sendAIPrompt(request);
            state.messages = response.aiMessages;
            state.isProcessing = response.isProcessingAI;

            // Handle widgets if generated
            const lastAIMessage = response.aiMessages[response.aiMessages.length - 1];
            if (lastAIMessage && !lastAIMessage.isUser && Array.isArray(lastAIMessage.widgets) && lastAIMessage.widgets.length > 0) {
                onWidgetsGenerated?.(lastAIMessage.widgets);
            } else if (lastAIMessage && !lastAIMessage.isUser) {
                onWidgetsGenerated?.([]);
            }
        } catch (error: any) {
            console.error('Error sending AI message:', error);
            await AlertService.prototype.error('Error', error.message || 'Error al enviar mensaje');
        } finally {
            state.isProcessing = false;
        }
    };

    const sendAudioPrompt = async (audioBlob: Blob) => {
        if (state.isProcessing) return;

        state.isProcessing = true;

        try {
            const request = {
                prompt: '',
                aiMessages: state.messages,
                isProcessingAI: state.isProcessing,
                config: {
                    model: state.selectedModel,
                    temperature: state.temperature,
                    maxTokens: state.maxTokens,
                    systemPrompt: state.systemPrompt,
                    enableVoice: true,
                    autoGenerateWidgets: state.autoSuggestWidgets,
                    framework: getFramework(),
                    language: 'es'
                }
            };

            const response = await AIService.processAudioPrompt(audioBlob, request);
            state.messages = response.aiMessages;
            state.isProcessing = response.isProcessingAI;

            // Handle widgets if generated
            const lastAIMessage = response.aiMessages[response.aiMessages.length - 1];
            if (lastAIMessage && !lastAIMessage.isUser && Array.isArray(lastAIMessage.widgets) && lastAIMessage.widgets.length > 0) {
                onWidgetsGenerated?.(lastAIMessage.widgets);
            } else if (lastAIMessage && !lastAIMessage.isUser) {
                onWidgetsGenerated?.([]);
            }
        } catch (error: any) {
            console.error('Error processing audio prompt:', error);
            await AlertService.prototype.error('Error', error.message || 'Error al procesar audio');
        } finally {
            state.isProcessing = false;
        }
    };

    const clearConversation = () => {
        state.messages = [];
        state.currentPrompt = '';
    };

    const exportConversation = () => {
        const data = {
            messages: state.messages,
            settings: {
                selectedModel: state.selectedModel,
                temperature: state.temperature,
                maxTokens: state.maxTokens,
                systemPrompt: state.systemPrompt,
                autoSuggestWidgets: state.autoSuggestWidgets,
                includeContext: state.includeContext,
                streamResponse: state.streamResponse
            },
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-conversation-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importConversation = (data: any) => {
        if (data.messages) {
            state.messages = data.messages;
        }
        if (data.settings) {
            Object.assign(state, data.settings);
        }
    };

    const toggleChat = () => {
        state.showChat = !state.showChat;
    };

    const updateSettings = (settings: Partial<AIConfig>) => {
        Object.assign(state, settings);
        localStorage.setItem('aiChatSettings', JSON.stringify(settings));
    };

    const addWidgetsToCanvas = (widgets: any[]) => {
        onWidgetsGenerated?.(widgets);
    };

    // Load saved settings
    const loadSettings = () => {
        const saved = localStorage.getItem('aiChatSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            Object.assign(state, settings);
        }
    };

    // Initialize
    loadSettings();

    return {
        // State
        state: readonly(state),
        hasMessages,
        lastMessage,
        userMessages,
        aiMessages,

        // Actions
        sendMessage,
        sendAudioPrompt,
        clearConversation,
        exportConversation,
        importConversation,
        toggleChat,
        updateSettings,
        addWidgetsToCanvas,
    };
} 