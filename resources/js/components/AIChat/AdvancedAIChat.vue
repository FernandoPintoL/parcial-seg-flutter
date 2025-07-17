<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { aiConfig, type AIMessage } from '@/composables/useChatStore';

interface AIModel {
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    supportsVision: boolean;
    supportsCode: boolean;
    icon: string;
}

interface WidgetSuggestion {
    id: string;
    name: string;
    description: string;
    framework: string;
    complexity: 'simple' | 'medium' | 'complex';
    code: string;
    preview?: string;
}

const props = defineProps<{
    framework: 'flutter' | 'angular' | 'react' | 'vue';
    isOpen: boolean;
    messages: AIMessage[];
    isProcessing: boolean;
}>();

const emit = defineEmits<{
    'send-message': [message: string];
    'add-widgets': [widgets: any[]];
    'close': [];
    'clear-conversation': [];
    'export-conversation': [];
    'import-conversation': [data: any];
}>();

// Estado del chat AI
const aiState = reactive({
    currentPrompt: '',
    selectedModel: 'gpt-4',
    conversationContext: [] as any[],
    suggestions: [] as string[],
    isRecording: false,
    recordingTime: 0,
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: '',
    showSettings: false,
    autoSuggestWidgets: true,
    includeContext: true,
    streamResponse: true,
});

// Modelos de IA disponibles
const availableModels: AIModel[] = [
    {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Modelo más avanzado para tareas complejas',
        maxTokens: 8000,
        supportsVision: true,
        supportsCode: true,
        icon: '🧠'
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Rápido y eficiente para tareas generales',
        maxTokens: 4000,
        supportsVision: false,
        supportsCode: true,
        icon: '⚡'
    },
    {
        id: 'claude-3',
        name: 'Claude 3',
        description: 'Excelente para análisis y razonamiento',
        maxTokens: 100000,
        supportsVision: true,
        supportsCode: true,
        icon: '🎭'
    },
    {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Modelo multimodal de Google',
        maxTokens: 30000,
        supportsVision: true,
        supportsCode: true,
        icon: '💎'
    }
];

// Sugerencias de prompts por framework
const frameworkSuggestions = computed(() => {
    const suggestions = {
        flutter: [
            "Crea una pantalla de login con validación",
            "Diseña una lista de productos con imágenes",
            "Implementa un drawer de navegación",
            "Crea un formulario de registro completo",
            "Diseña una pantalla de perfil de usuario",
            "Implementa un sistema de tabs",
            "Crea un chat en tiempo real",
            "Diseña una pantalla de configuración"
        ],
        angular: [
            "Crea un componente de tabla con filtros",
            "Implementa un sistema de autenticación",
            "Diseña un dashboard con gráficos",
            "Crea un formulario reactivo complejo",
            "Implementa lazy loading en rutas",
            "Diseña un sistema de notificaciones",
            "Crea un módulo de productos",
            "Implementa guards de ruta"
        ],
        react: [
            "Crea un hook personalizado para fetch",
            "Implementa un sistema de estado global",
            "Diseña un componente de modal reutilizable",
            "Crea un sistema de routing dinámico",
            "Implementa infinite scroll",
            "Diseña un sistema de temas",
            "Crea un componente de calendario",
            "Implementa optimistic updates"
        ],
        vue: [
            "Crea un composable para API calls",
            "Implementa un sistema de store con Pinia",
            "Diseña un componente de datos dinámicos",
            "Crea un sistema de routing avanzado",
            "Implementa teleport para modales",
            "Diseña un sistema de plugins",
            "Crea un componente de formulario dinámico",
            "Implementa lazy loading de componentes"
        ]
    };
    return suggestions[props.framework] || [];
});

// Modelo actual
const currentModel = computed(() =>
    availableModels.find(m => m.id === aiState.selectedModel) || availableModels[0]
);

// Funciones principales
async function sendMessage() {
    if (!aiState.currentPrompt.trim() || props.isProcessing) return;

    const message = aiState.currentPrompt.trim();
    aiState.currentPrompt = '';

    // Añadir contexto si está habilitado
    const contextualMessage = aiState.includeContext
        ? buildContextualMessage(message)
        : message;

    emit('send-message', contextualMessage);

    // Actualizar sugerencias
    await updateSuggestions();
}

function buildContextualMessage(message: string): string {
    const context = [
        `Framework: ${props.framework}`,
        `Modelo: ${currentModel.value.name}`,
        `Temperatura: ${aiState.temperature}`,
        `Tokens máximos: ${aiState.maxTokens}`,
        aiState.systemPrompt ? `Contexto: ${aiState.systemPrompt}` : '',
        `Mensaje: ${message}`
    ].filter(Boolean).join('\n');

    return context;
}

async function updateSuggestions() {
    try {
        const response = await fetch('/api/ai/suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({
                framework: props.framework,
                conversationHistory: aiState.conversationContext.slice(-5), // Últimos 5 mensajes
                model: aiState.selectedModel
            })
        });

        const data = await response.json();
        if (data.success) {
            aiState.suggestions = data.data.suggestions;
        }
    } catch (error) {
        console.error('Error updating suggestions:', error);
    }
}

function applySuggestion(suggestion: string) {
    aiState.currentPrompt = suggestion;
    sendMessage();
}

function generateWidgetSuggestions() {
    const suggestions: WidgetSuggestion[] = [];

    if (props.framework === 'flutter') {
        suggestions.push({
            id: 'login_form',
            name: 'Formulario de Login',
            description: 'Formulario completo con validación',
            framework: 'flutter',
            complexity: 'medium',
            code: `
Container(
  padding: EdgeInsets.all(16),
  child: Column(
    children: [
      TextFormField(
        decoration: InputDecoration(labelText: 'Email'),
        validator: (value) => value?.isEmpty == true ? 'Requerido' : null,
      ),
      TextFormField(
        decoration: InputDecoration(labelText: 'Contraseña'),
        obscureText: true,
        validator: (value) => value?.isEmpty == true ? 'Requerido' : null,
      ),
      ElevatedButton(
        onPressed: () => {},
        child: Text('Iniciar Sesión'),
      ),
    ],
  ),
)
            `.trim()
        });
    }

    return suggestions;
}

function exportConversation() {
    const data = {
        framework: props.framework,
        model: aiState.selectedModel,
        messages: props.messages,
        settings: {
            temperature: aiState.temperature,
            maxTokens: aiState.maxTokens,
            systemPrompt: aiState.systemPrompt
        },
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${props.framework}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importConversation(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            emit('import-conversation', data);
        } catch (error) {
            console.error('Error importing conversation:', error);
            alert('Error al importar la conversación');
        }
    };
    reader.readAsText(file);
}

// Funciones de configuración
function resetToDefaults() {
    aiState.temperature = 0.7;
    aiState.maxTokens = 1000;
    aiState.systemPrompt = '';
    aiState.selectedModel = 'gpt-4';
    aiState.autoSuggestWidgets = true;
    aiState.includeContext = true;
    aiState.streamResponse = true;
}

function saveSettings() {
    localStorage.setItem('aiChatSettings', JSON.stringify({
        temperature: aiState.temperature,
        maxTokens: aiState.maxTokens,
        systemPrompt: aiState.systemPrompt,
        selectedModel: aiState.selectedModel,
        autoSuggestWidgets: aiState.autoSuggestWidgets,
        includeContext: aiState.includeContext,
        streamResponse: aiState.streamResponse
    }));
    aiState.showSettings = false;
}

function loadSettings() {
    const saved = localStorage.getItem('aiChatSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        Object.assign(aiState, settings);
    }
}

// Funciones de teclado
function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Watchers
watch(() => props.framework, () => {
    updateSuggestions();
});

watch(() => aiState.selectedModel, () => {
    updateSuggestions();
});

// Montaje
onMounted(() => {
    loadSettings();
    updateSuggestions();
});
</script>

<template>
    <div class="ai-chat-advanced flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div class="flex items-center space-x-3">
                <div class="text-2xl">🤖</div>
                <div>
                    <h3 class="font-semibold">Chat IA Avanzado</h3>
                    <p class="text-sm opacity-90">{{ currentModel.name }} • {{ props.framework.toUpperCase() }}</p>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <button
                    @click="aiState.showSettings = !aiState.showSettings"
                    class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title="Configuración"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </button>

                <button
                    @click="emit('close')"
                    class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Panel de configuración -->
        <div v-if="aiState.showSettings" class="p-4 bg-gray-50 dark:bg-gray-800 border-b">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Selección de modelo -->
                <div>
                    <label class="block text-sm font-medium mb-2">Modelo de IA</label>
                    <select
                        v-model="aiState.selectedModel"
                        class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option v-for="model in availableModels" :key="model.id" :value="model.id">
                            {{ model.icon }} {{ model.name }}
                        </option>
                    </select>
                </div>

                <!-- Temperatura -->
                <div>
                    <label class="block text-sm font-medium mb-2">
                        Creatividad ({{ aiState.temperature }})
                    </label>
                    <input
                        v-model.number="aiState.temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        class="w-full"
                    />
                </div>

                <!-- Tokens máximos -->
                <div>
                    <label class="block text-sm font-medium mb-2">Tokens máximos</label>
                    <input
                        v-model.number="aiState.maxTokens"
                        type="number"
                        min="100"
                        :max="currentModel.maxTokens"
                        class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>

                <!-- Opciones -->
                <div class="space-y-2">
                    <label class="flex items-center space-x-2">
                        <input v-model="aiState.autoSuggestWidgets" type="checkbox" class="rounded">
                        <span class="text-sm">Auto-sugerir widgets</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input v-model="aiState.includeContext" type="checkbox" class="rounded">
                        <span class="text-sm">Incluir contexto</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input v-model="aiState.streamResponse" type="checkbox" class="rounded">
                        <span class="text-sm">Respuesta en tiempo real</span>
                    </label>
                </div>
            </div>

            <!-- Prompt del sistema -->
            <div class="mt-4">
                <label class="block text-sm font-medium mb-2">Prompt del sistema</label>
                <textarea
                    v-model="aiState.systemPrompt"
                    placeholder="Instrucciones adicionales para la IA..."
                    class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    rows="3"
                ></textarea>
            </div>

            <!-- Botones de configuración -->
            <div class="flex justify-end space-x-2 mt-4">
                <button
                    @click="resetToDefaults"
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    Restablecer
                </button>
                <button
                    @click="saveSettings"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Guardar
                </button>
            </div>
        </div>

        <!-- Mensajes -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-if="props.messages.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
                <div class="text-6xl mb-4">🚀</div>
                <h3 class="text-xl font-semibold mb-2">¡Bienvenido al Chat IA Avanzado!</h3>
                <p class="mb-4">Describe tu interfaz y la IA generará código para {{ props.framework }}</p>
                <div class="flex flex-wrap gap-2 justify-center">
                    <button
                        v-for="suggestion in frameworkSuggestions.slice(0, 3)"
                        :key="suggestion"
                        @click="applySuggestion(suggestion)"
                        class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    >
                        {{ suggestion }}
                    </button>
                </div>
            </div>

            <div
                v-for="(message, index) in props.messages"
                :key="index"
                class="flex"
                :class="message.isUser ? 'justify-end' : 'justify-start'"
            >
                <div
                    class="max-w-[85%] p-4 rounded-lg shadow-sm"
                    :class="message.isUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'"
                >
                    <div class="flex items-center space-x-2 mb-2">
                        <div class="text-sm font-medium">
                            {{ message.isUser ? 'Tú' : currentModel.name }}
                        </div>
                        <div class="text-xs opacity-75">
                            {{ message.timestamp.toLocaleTimeString() }}
                        </div>
                    </div>

                    <div class="prose dark:prose-invert max-w-none">
                        <pre v-if="message.text.includes('```')" class="whitespace-pre-wrap">{{ message.text }}</pre>
                        <div v-else class="whitespace-pre-wrap">{{ message.text }}</div>
                    </div>

                    <!-- Widgets generados -->
                    <div v-if="!message.isUser && message.widgets?.length" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium">Widgets generados:</span>
                            <button
                                @click="emit('add-widgets', message.widgets)"
                                class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                            >
                                ✨ Añadir todos
                            </button>
                        </div>
                        <div class="space-y-2">
                            <div
                                v-for="widget in message.widgets"
                                :key="widget.id"
                                class="p-2 bg-gray-50 dark:bg-gray-800 rounded border text-sm"
                            >
                                <div class="font-medium">{{ widget.name || widget.type }}</div>
                                <div class="text-xs text-gray-600 dark:text-gray-400">
                                    {{ widget.description || 'Widget generado por IA' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Indicador de procesamiento -->
            <div v-if="props.isProcessing" class="flex justify-start">
                <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-lg shadow-sm">
                    <div class="flex items-center space-x-2">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                            {{ currentModel.name }} está procesando...
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sugerencias -->
        <div v-if="aiState.suggestions.length > 0" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t">
            <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">Sugerencias:</div>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="suggestion in aiState.suggestions"
                    :key="suggestion"
                    @click="applySuggestion(suggestion)"
                    class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                    {{ suggestion }}
                </button>
            </div>
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex space-x-2">
                <div class="flex-1">
                    <textarea
                        v-model="aiState.currentPrompt"
                        @keydown="handleKeyPress"
                        placeholder="Describe tu interfaz..."
                        class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows="3"
                    ></textarea>
                </div>

                <div class="flex flex-col space-y-2">
                    <button
                        @click="sendMessage"
                        :disabled="!aiState.currentPrompt.trim() || props.isProcessing"
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                    </button>

                    <button
                        @click="exportConversation"
                        :disabled="props.messages.length === 0"
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        title="Exportar conversación"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex justify-between items-center mt-2">
                <div class="flex space-x-2">
                    <button
                        @click="emit('clear-conversation')"
                        class="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        Limpiar conversación
                    </button>

                    <input
                        type="file"
                        accept=".json"
                        @change="importConversation"
                        class="hidden"
                        id="import-conversation"
                    />
                    <label
                        for="import-conversation"
                        class="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer transition-colors"
                    >
                        Importar conversación
                    </label>
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ aiState.currentPrompt.length }}/1000
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.prose pre {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.875rem;
}

.dark .prose pre {
    background-color: #374151;
    border-color: #4b5563;
}

.ai-chat-advanced {
    min-height: 600px;
}

.animate-bounce {
    animation: bounce 1s infinite;
}

@keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
    }
    40%, 43% {
        transform: translate3d(0, -8px, 0);
    }
    70% {
        transform: translate3d(0, -4px, 0);
    }
    90% {
        transform: translate3d(0, -2px, 0);
    }
}
</style>
