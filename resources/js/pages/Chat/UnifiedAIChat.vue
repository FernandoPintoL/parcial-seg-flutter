<!-- pages/Chat/UnifiedAIChat.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAIChat } from '@/composables/useAIChat';
import type { AIModel } from './types';
import { JsonUtils } from '@/utils/JsonUtils';
import { AIService } from '@/services/AIService';
import { AlertService } from '@/services/AlertService';

interface Props {
    framework: 'flutter' | 'angular' | 'react' | 'vue' | 'both';
    isOpen: boolean;
    onClose: () => void;
    onWidgetsGenerated: (widgets: any[]) => void;
}

const props = defineProps<Props>();

// Estado para información del proveedor API
const apiProvider = ref<'azure' | 'openai' | 'backend'>('azure');
const apiVerificationMessage = ref<string>('');
const isApiVerifying = ref<boolean>(false);
const manualProviderSelection = ref<boolean>(false);
const selectedProvider = ref<'azure' | 'openai' | 'backend'>('azure');

// Mejorar el prompt del sistema para respuestas JSON válidas
const systemPrompt = `
Eres un asistente especializado en generación de interfaces de usuario.
Cuando el usuario solicite un formulario o componente, responde SIEMPRE con un bloque JSON válido, sin texto adicional, sin comentarios, y asegúrate de que la sintaxis sea correcta.
Ejemplo:
\`\`\`json
{
  "framework": "flutter",
  "widgets": [
    { "type": "TextField", "properties": { "label": "Usuario" } }
  ]
}
\`\`\`
`;

// AI Chat composable
const aiChat = useAIChat(
    (widgets) => props.onWidgetsGenerated(widgets),
    (code) => console.log('Code parsed:', code)
);
aiChat.updateSettings({ systemPrompt });

// UI State
const showSettings = ref(false);
const isRecording = ref(false);
const recordingTime = ref(0);
const recordingTimer = ref<number | null>(null);
const mediaRecorderRef = ref<MediaRecorder | null>(null);
const speechStatus = ref<'idle' | 'recording' | 'processing' | 'error'>('idle');
const speechErrorMessage = ref<string | null>(null);

// Variable local para el prompt del usuario
const localPrompt = ref('');

// Estado para error de parseo JSON
const jsonParseError = ref<string | null>(null);

// Available models
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

function extractJsonBlock(text: string) {
  const jsonStr = JsonUtils.extractJsonBlock(text);
  if (jsonStr) {
    try {
      jsonParseError.value = null;
      return JsonUtils.parseJsonSafe(jsonStr);
    } catch (e: any) {
      console.error('Error al parsear JSON del bloque:', e);
      jsonParseError.value = 'El formato JSON de la respuesta no es válido. Por favor, intenta de nuevo o revisa tu petición.';
    }
  }
  return null;
}

function extractExplanation(text: string): string | null {
  // Busca 'explanation:' (puede ser mayúsculas/minúsculas) y extrae el texto hasta el siguiente salto de línea doble o el final
  const match = text.match(/explanation\s*:\s*([\s\S]*?)(\n\n|$)/i);
  return match ? match[1].trim() : null;
}

function removeExplanation(text: string): string {
  // Elimina la sección explanation del texto
  return text.replace(/explanation\s*:\s*[\s\S]*?(\n\n|$)/i, '').trim();
}

// Función para detectar el framework solicitado en el prompt
function detectFramework(prompt: string, fallback: 'flutter' | 'angular' | 'react' | 'vue' = 'flutter'): 'flutter' | 'angular' | 'react' | 'vue' {
    const lower = prompt.toLowerCase();
    if (lower.includes('flutter')) return 'flutter';
    if (lower.includes('angular')) return 'angular';
    if (lower.includes('react')) return 'react';
    if (lower.includes('vue')) return 'vue';
    return fallback;
}

// Framework suggestions
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
        ],
        both: [
            "Crea un formulario de contacto responsive",
            "Diseña una landing page moderna",
            "Implementa un carrusel de imágenes",
            "Crea un componente de navegación adaptativo",
            "Diseña un sistema de alertas personalizable",
            "Implementa un selector de temas claro/oscuro",
            "Crea una galería de imágenes con filtros",
            "Diseña un dashboard de analíticas"
        ]
    };
    return suggestions[props.framework] || [];
});

// Current model
const currentModel = computed(() =>
    availableModels.find(m => m.id === aiChat.state.selectedModel) || availableModels[0]
);

// Función para detectar si la petición es de formulario
function isFormRequest(prompt: string): boolean {
    return prompt.trim().toLowerCase().normalize('NFD').replace(/[ 0-\u036f]/g, '').startsWith('generame un formulario');
}

// Functions
const sendMessage = async (prompt?: string) => {
    const messageToSend = prompt ?? localPrompt.value;
    const isForm = isFormRequest(messageToSend);
    await aiChat.sendMessage(messageToSend);

    // Procesar la respuesta si hay mensajes
    if (aiChat.state.messages.length > 0) {
        const lastMessage = aiChat.state.messages[aiChat.state.messages.length - 1];

        // Si es un mensaje de la IA (no del usuario), procesarlo para insertar widgets
        if (lastMessage && !lastMessage.isUser) {
            // Si es una solicitud de formulario o contiene widgets, procesarlos automáticamente
            if (isForm ||
                lastMessage.text.toLowerCase().includes('form') ||
                lastMessage.text.toLowerCase().includes('widget') ||
                (lastMessage.widgets && lastMessage.widgets.length > 0)) {

                // Usar la función reutilizable para procesar widgets
                processWidgetsFromMessage(lastMessage, messageToSend);
            }
        }
    }

    localPrompt.value = '';
};

const applySuggestion = (suggestion: string) => {
    sendMessage(suggestion);
};

const startRecording = async () => {
    if (isRecording.value) return;

    try {
        // Reset status and errors
        speechStatus.value = 'recording';
        speechErrorMessage.value = null;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioChunks: Blob[] = [];

        // Create and store MediaRecorder instance
        mediaRecorderRef.value = new MediaRecorder(stream);

        mediaRecorderRef.value.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorderRef.value.onstop = async () => {
            try {
                speechStatus.value = 'processing';
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await aiChat.sendAudioPrompt(audioBlob);
                speechStatus.value = 'idle';
            } catch (error: any) {
                console.error('Error processing audio:', error);
                speechStatus.value = 'error';
                speechErrorMessage.value = error.message || 'Error al procesar el audio';
            } finally {
                stream.getTracks().forEach(track => track.stop());
            }
        };

        mediaRecorderRef.value.start();
        isRecording.value = true;
        recordingTime.value = 0;
        recordingTimer.value = window.setInterval(() => {
            recordingTime.value++;
        }, 1000);
    } catch (error: any) {
        console.error('Error starting recording:', error);
        speechStatus.value = 'error';
        speechErrorMessage.value = error.message || 'Error al iniciar la grabación de audio';
    }
};

const stopRecording = () => {
    if (!isRecording.value) return;

    isRecording.value = false;
    if (recordingTimer.value) {
        clearInterval(recordingTimer.value);
        recordingTimer.value = null;
    }

    // Stop the MediaRecorder to trigger the onstop event
    if (mediaRecorderRef.value && mediaRecorderRef.value.state !== 'inactive') {
        mediaRecorderRef.value.stop();
    }
};

const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
};

const formatRecordingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const resetToDefaults = () => {
    aiChat.updateSettings({
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: ''
    });
};

const saveSettings = () => {
    aiChat.updateSettings({
        temperature: aiChat.state.temperature,
        maxTokens: aiChat.state.maxTokens,
        systemPrompt: aiChat.state.systemPrompt
    });

    // Aplicar el proveedor seleccionado si ha cambiado
    if (apiProvider.value !== selectedProvider.value) {
        setAIProvider(apiProvider.value);
    }

    showSettings.value = false;
};

// Función para cambiar el proveedor de IA
const setAIProvider = async (provider: 'azure' | 'openai' | 'backend') => {
    isApiVerifying.value = true;
    selectedProvider.value = provider;

    try {
        // Cambia el proveedor manualmente
        const response = await AIService.verifyApiKey();

        if (response.provider === provider) {
            apiProvider.value = provider;
            manualProviderSelection.value = true;
            apiVerificationMessage.value = `Usando ${provider.toUpperCase()} como proveedor de IA`;
            new AlertService().success(`Proveedor cambiado a ${provider.toUpperCase()}`);
        } else {
            // Si no se pudo configurar el proveedor solicitado
            apiProvider.value = response.provider;
            apiVerificationMessage.value = `No se pudo configurar ${provider}. Usando ${response.provider} como alternativa.`;
            new AlertService().warning(`No se pudo configurar ${provider}. Usando ${response.provider} como alternativa.`);
        }
    } catch (error: any) {
        console.error('Error al cambiar el proveedor de IA:', error);
        apiVerificationMessage.value = 'Error al cambiar el proveedor. Usando backend como alternativa.';
        new AlertService().error('Error al cambiar el proveedor de IA.');
    } finally {
        isApiVerifying.value = false;
    }
};

// Función para procesar widgets de un mensaje
const processWidgetsFromMessage = (message: any, originalPrompt: string) => {
    if (!message) return;

    // Si ya hay widgets procesados en el mensaje, los añadimos directamente
    if (message.widgets && message.widgets.length > 0) {
        props.onWidgetsGenerated([...message.widgets]);
        return;
    }

    // Si no hay widgets procesados, intentamos extraerlos del texto
    const jsonData = extractJsonBlock(message.text);
    if (jsonData) {
        // Verificamos si el JSON tiene un campo de widgets
        if (jsonData.widgets && Array.isArray(jsonData.widgets)) {
            // Determinamos el framework solicitado
            const requestedFramework = jsonData.framework || detectFramework(originalPrompt);

            // Añadimos información adicional a cada widget
            const processedWidgets = jsonData.widgets.map((widget: any, index: number) => ({
                ...widget,
                id: `widget-${Date.now()}-${index}`,
                framework: requestedFramework,
                // Añadimos metadatos si no existen
                metadata: widget.metadata || {
                    createdBy: 'ai',
                    prompt: originalPrompt
                }
            }));

            // Guardamos los widgets procesados en el mensaje para referencia futura
            message.widgets = processedWidgets;

            // Enviamos los widgets al canvas
            props.onWidgetsGenerated(processedWidgets);

            // Informamos al usuario
            new AlertService().success(`${processedWidgets.length} widgets añadidos a la pizarra`);
        } else {
            console.warn("JSON detectado pero no contiene un array de widgets válido");
        }
    } else {
        console.log("No se encontró un bloque JSON válido en la respuesta");
    }
};
</script>

<template>
    <div v-if="props.isOpen" class="ai-chat-unified fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col transition-colors">
        <!-- Header -->
        <div class="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <div class="text-2xl">🤖</div>
                <div>
                    <h3 class="font-semibold">Asistente IA</h3>
                    <div class="flex items-center gap-1">
                        <p class="text-sm opacity-90">{{ currentModel.name }} • {{ props.framework.toUpperCase() }}</p>
                        <span v-if="apiVerificationMessage" class="text-xs px-2 py-0.5 rounded-full ml-1"
                            :class="{
                                'bg-green-500 text-white': apiProvider === 'azure',
                                'bg-blue-500 text-white': apiProvider === 'openai',
                                'bg-yellow-500 text-gray-800': apiProvider === 'backend'
                            }"
                            :title="apiVerificationMessage"
                        >
                            {{ apiProvider === 'azure' ? 'Azure' : apiProvider === 'openai' ? 'OpenAI' : 'Backend' }}
                        </span>
                        <span v-if="isApiVerifying" class="ml-1">
                            <div class="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex items-center space-x-2">
<!--                <button
                    @click="verifyApiKey"
                    class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title="Verificar API Key"
                    :disabled="isApiVerifying"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                </button>-->
                <button
                    @click="showSettings = !showSettings"
                    class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title="Configuración"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </button>

                <button
                    @click="props.onClose"
                    class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Settings Panel -->
        <div v-if="showSettings" class="p-4 bg-gray-50 dark:bg-gray-800 border-b">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Model Selection -->
                <div>
                    <label class="block text-sm font-medium mb-2">Modelo de IA</label>
                    <select
                        v-model="aiChat.state.selectedModel"
                        class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option v-for="model in availableModels" :key="model.id" :value="model.id">
                            {{ model.icon }} {{ model.name }}
                        </option>
                    </select>
                </div>

                <!-- Temperature -->
                <div>
                    <label class="block text-sm font-medium mb-2">
                        Creatividad ({{ aiChat.state.temperature }})
                    </label>
                    <input
                        v-model.number="aiChat.state.temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        class="w-full"
                    />
                </div>

                <!-- Max Tokens -->
                <div>
                    <label class="block text-sm font-medium mb-2">Tokens máximos</label>
                    <input
                        v-model.number="aiChat.state.maxTokens"
                        type="number"
                        min="100"
                        :max="currentModel.maxTokens"
                        class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>

                <!-- AI Provider Selection -->
                <div>
                    <label class="block text-sm font-medium mb-2">Proveedor de IA</label>
                    <select
                        v-model="apiProvider"
                        @change="selectedProvider = apiProvider"
                        class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="azure">Azure</option>
                        <option value="openai">OpenAI</option>
                        <option value="backend">Backend</option>
                    </select>
                </div>

                <!-- Options -->
                <div class="space-y-2">
                    <label class="flex items-center space-x-2">
                        <input v-model="aiChat.state.autoSuggestWidgets" type="checkbox" class="rounded">
                        <span class="text-sm">Auto-sugerir widgets</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input v-model="aiChat.state.includeContext" type="checkbox" class="rounded">
                        <span class="text-sm">Incluir contexto</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input v-model="aiChat.state.streamResponse" type="checkbox" class="rounded">
                        <span class="text-sm">Respuesta en tiempo real</span>
                    </label>
                </div>
            </div>

            <!-- System Prompt -->
            <div class="mt-4">
                <label class="block text-sm font-medium mb-2">Prompt del sistema</label>
                <textarea
                    v-model="aiChat.state.systemPrompt"
                    placeholder="Instrucciones adicionales para la IA..."
                    class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    rows="3"
                ></textarea>
            </div>

            <!-- Settings Buttons -->
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

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-2 py-16 space-y-4">
            <div v-if="jsonParseError" class="text-red-600 text-xs mt-2">
              {{ jsonParseError }}
            </div>
            <div v-if="!aiChat.hasMessages" class="text-center text-gray-500 dark:text-gray-400 py-8">
                <div class="text-6xl mb-4">🚀</div>
                <h3 class="text-xl font-semibold mb-2">¡Bienvenido al Asistente IA!</h3>
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
                v-for="(message, index) in aiChat.state.messages"
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
                    <!-- Explicación resaltada -->
                    <div
                      v-if="!message.isUser && extractExplanation(message.text)"
                      class="my-2 p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 flex items-start gap-2"
                    >
                      <span class="material-icons text-yellow-400">info</span>
                      <span class="font-medium">Explicación:</span>
                      <span class="ml-2">{{ extractExplanation(message.text) }}</span>
                    </div>

                    <div class="flex items-center space-x-2 mb-2">
                        <div class="text-sm font-medium">
                            {{ message.isUser ? 'Tú' : currentModel.name }}
                        </div>
                        <div class="text-xs opacity-75">
                            {{ message.timestamp.toLocaleTimeString() }}
                        </div>
                    </div>

                    <div class="prose dark:prose-invert max-w-none">
                        <pre v-if="removeExplanation(message.text).includes('```')" class="whitespace-pre-wrap">{{ removeExplanation(message.text) }}</pre>
                        <div v-else class="whitespace-pre-wrap">{{ removeExplanation(message.text) }}</div>
                    </div>

                    <!-- Generated Widgets -->
                    <div v-if="!message.isUser && message.widgets?.length" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium">Widgets generados:</span>
                            <button
                                @click="aiChat.addWidgetsToCanvas([...message.widgets])"
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

                    <!-- Botón para insertar en la pizarra -->
<!--                    <div v-if="!message.isUser && (message.widgets?.length || extractJsonBlock(message.text))" class="mt-2 flex justify-end">
                        <button
                            @click="insertMessageToCanvas(message)"
                            class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                            🖼️ Insertar en la pizarra
                        </button>
                    </div>-->
                </div>
            </div>

            <!-- Processing Indicator -->
            <div v-if="aiChat.state.isProcessing" class="flex justify-start">
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

        <!-- Input -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <!-- Mensaje de ayuda para el usuario -->
            <div class="mb-2 text-xs text-gray-600 dark:text-gray-300 bg-purple-50 dark:bg-purple-900 p-2 rounded">
              <strong>Tip:</strong> Para solicitar un formulario o componente, inicia tu mensaje con <b>"Generame un formulario para..."</b> y el resultado se insertará automáticamente en la pizarra.
            </div>

            <!-- Speech Status Indicators -->
            <!-- Recording Indicator -->
            <div v-if="isRecording" class="flex items-center justify-between bg-red-100 dark:bg-red-900 p-2 rounded-md mb-2">
                <div class="flex items-center">
                    <div class="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                    <span class="text-red-700 dark:text-red-300 text-sm">Grabando... {{ formatRecordingTime(recordingTime) }}</span>
                </div>
                <span class="text-red-700 dark:text-red-300 text-xs">Suelta para enviar</span>
            </div>

            <!-- Processing Indicator -->
            <div v-if="!isRecording && speechStatus === 'processing'" class="flex items-center justify-between bg-blue-100 dark:bg-blue-900 p-2 rounded-md mb-2">
                <div class="flex items-center">
                    <div class="animate-pulse h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                    <span class="text-blue-700 dark:text-blue-300 text-sm">Procesando audio...</span>
                </div>
            </div>

            <!-- Error Indicator -->
            <div v-if="speechStatus === 'error' && speechErrorMessage" class="flex items-center justify-between bg-yellow-100 dark:bg-yellow-900 p-2 rounded-md mb-2">
                <div class="flex items-center">
                    <div class="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span class="text-yellow-700 dark:text-yellow-300 text-sm">{{ speechErrorMessage }}</span>
                </div>
                <button
                    @click="speechStatus = 'idle'; speechErrorMessage = null"
                    class="text-xs text-yellow-700 dark:text-yellow-300 hover:underline"
                >
                    Cerrar
                </button>
            </div>

            <div class="flex space-x-2">
                <div class="flex-1">
                    <textarea
                        v-model="localPrompt"
                        @keydown="handleKeyPress"
                        placeholder="Describe tu interfaz..."
                        class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows="3"
                        :disabled="aiChat.state.isProcessing"
                        :readonly="isRecording"
                        :class="{ 'bg-gray-50 dark:bg-gray-600': isRecording }"
                    ></textarea>
                </div>

                <div class="flex flex-col space-y-2">
                    <!-- Microphone Button -->
                    <button
                        @mousedown="startRecording"
                        @mouseup="stopRecording"
                        @mouseleave="stopRecording"
                        @touchstart.prevent="startRecording"
                        @touchend.prevent="stopRecording"
                        @touchcancel.prevent="stopRecording"
                        class="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        :disabled="aiChat.state.isProcessing"
                        :class="{
                            'bg-red-600 animate-pulse': isRecording,
                            'bg-red-500 hover:bg-red-600': !isRecording
                        }"
                        title="Mantén presionado para grabar por voz"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
                        </svg>
                    </button>

                    <!-- Send Button -->
                    <button
                        @click="() => sendMessage()"
                        :disabled="!localPrompt.trim() || aiChat.state.isProcessing"
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        type="button"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                    </button>

                    <!-- Export Button -->
                    <button
                        @click="aiChat.exportConversation"
                        :disabled="!aiChat.hasMessages"
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        title="Exportar conversación"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-between items-center mt-2">
                <div class="flex space-x-2">
                    <button
                        @click="aiChat.clearConversation"
                        class="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        Limpiar conversación
                    </button>
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ localPrompt.length }}/1000
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

.ai-chat-unified {
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

/* Mejora visual del header del chat AI */
.ai-chat-unified > div:first-child {
  position: sticky;
  top: 0;
  z-index: 20;
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  background: #9333ea;
  color: #fff;
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
</style>
