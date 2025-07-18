<script setup lang="ts">
import { ref, watch, defineProps, onUnmounted } from 'vue';

const props = defineProps({
    showAIChat: {
        type: Boolean,
        default: false
    },
    aiMessages: {
        type: Array as () => { text: string; isUser: boolean; widgets?: any[] }[],
        default: () => []
    },
    aiPrompt: {
        type: String,
        default: ''
    },
    isProcessingAI: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits([
    'toggleAIChat',
    'sendAIPrompt',
    'sendAudioPrompt',
    'addAIWidgetsToCanvas',
    'update:aiPrompt',
    'update:isProcessingAI',
    'onAIPromptInput'
]);
const localIsProcessingAI = ref(props.isProcessingAI);
const localAIPrompt = ref(props.aiPrompt);

// Audio recording state
const isRecording = ref(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);
const recordingTime = ref(0);
const recordingTimer = ref<number | null>(null);
const microphoneSupported = ref(false);
const microphonePermission = ref<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

// Alternative: Web Speech API (browser-based)
// Type definitions for Web Speech API
interface ISpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

const recognition = ref<ISpeechRecognition | null>(null);

// Initialize Web Speech API
function initSpeechRecognition() {
    const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
        recognition.value = new SpeechRecognitionConstructor() as ISpeechRecognition;

        recognition.value.continuous = true;
        recognition.value.interimResults = true;
        recognition.value.lang = 'es-ES';

        recognition.value.onresult = (event: SpeechRecognitionEvent) => {
            // Get the latest result
            const resultIndex = event.results.length - 1;
            const transcript = event.results[resultIndex][0].transcript;

            // Update the prompt with the transcribed text
            localAIPrompt.value = transcript;
            emit('update:aiPrompt', localAIPrompt.value);

            // Don't auto-send until recording is stopped
            // This allows the user to see the transcription in real-time
        };

        recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            alert('Error en el reconocimiento de voz. Intenta nuevamente.');
            isRecording.value = false;
        };

        recognition.value.onend = () => {
            // If recording was stopped manually, send the prompt
            if (isRecording.value) {
                isRecording.value = false;
                // Auto-send prompt when recording ends
                if (localAIPrompt.value.trim()) {
                    emit('sendAIPrompt');
                }
            }
        };
    }
}

// Real-time speech recognition using Web Speech API
async function startSpeechRecognition() {
    if (recognition.value) {
        // Reset the prompt
        localAIPrompt.value = '';
        emit('update:aiPrompt', '');

        // Start recording
        isRecording.value = true;

        try {
            recognition.value.start();

            // Start timer for recording time display
            recordingTime.value = 0;
            recordingTimer.value = window.setInterval(() => {
                recordingTime.value++;
            }, 1000);

            console.log('Speech recognition started');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            isRecording.value = false;
            alert('Error al iniciar el reconocimiento de voz. Intenta nuevamente.');
        }
    } else {
        alert('Tu navegador no soporta reconocimiento de voz.');
    }
}

function stopSpeechRecognition() {
    if (recognition.value) {
        recognition.value.stop();
        isRecording.value = false;

        // Clear timer
        if (recordingTimer.value) {
            clearInterval(recordingTimer.value);
            recordingTimer.value = null;
        }

        console.log('Speech recognition stopped');
    }
}

// Check microphone support and permissions on component mount
const checkMicrophoneSupport = async () => {
    try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('getUserMedia is not supported in this browser');
            microphoneSupported.value = false;
            return;
        }

        microphoneSupported.value = true;

        // Check permissions if available
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                microphonePermission.value = permission.state;

                // Listen for permission changes
                permission.onchange = () => {
                    microphonePermission.value = permission.state;
                };
            } catch (error) {
                console.warn('Could not query microphone permissions:', error);
                microphonePermission.value = 'unknown';
            }
        }
    } catch (error) {
        console.error('Error checking microphone support:', error);
        microphoneSupported.value = false;
    }
};

// Watch for changes in aiPrompt prop and update local variable
watch(() => props.aiPrompt, (val) => {
    localAIPrompt.value = val;
});
// Watch for changes in isProcessingAI prop and update local variable
watch(() => props.isProcessingAI, (val) => {
    localIsProcessingAI.value = val;
});

// Emit the updated aiPrompt when it changes
function onInput(e: any) {
    localAIPrompt.value = e.target.value;
    emit('update:aiPrompt', localAIPrompt.value);
    emit('onAIPromptInput');
}

function toggleAIChat() {
    console.log('Toggling AI chat visibility desde ChatAI.vue');
    emit('toggleAIChat');
}

const sendAIPrompt = async () => {
    console.log('sendAIPrompt function called in ChatAI.vue');
    console.log('Current aiPrompt:', localAIPrompt.value);
    console.log('Current isProcessingAI:', localIsProcessingAI.value);
    emit('sendAIPrompt');
    console.log('sendAIPrompt event emitted from ChatAI.vue');
}

function addAIWidgetsToCanvas(widgets: any[]) {
    emit('addAIWidgetsToCanvas', widgets);
}

// Audio recording functions
async function toggleRecording() {
    if (isRecording.value) {
        if (recognition.value) {
            stopSpeechRecognition();
        } else {
            stopRecording();
        }
    } else {
        if (recognition.value) {
            // Use Web Speech API for real-time transcription
            await startSpeechRecognition();
        } else {
            // Fallback to MediaRecorder if Speech Recognition is not available
            await startRecording();
        }
    }
}

async function startRecording() {
    try {
        // Check if microphone is supported
        if (!microphoneSupported.value) {
            alert('Tu navegador no soporta grabación de audio. Por favor, usa un navegador moderno con HTTPS.');
            return;
        }

        // Check if we're in a secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
            alert('La grabación de audio requiere una conexión segura (HTTPS). Por favor, accede desde HTTPS o localhost.');
            return;
        }

        // Check permissions
        if (microphonePermission.value === 'denied') {
            alert('Los permisos del micrófono han sido denegados. Por favor, habilita los permisos en la configuración del navegador.');
            return;
        }

        // Reset recording state
        audioChunks.value = [];
        recordingTime.value = 0;

        // Request microphone access with error handling
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
        } catch (permissionError: any) {
            console.error('Permission error:', permissionError);

            if (permissionError.name === 'NotAllowedError') {
                alert('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono y recarga la página.');
            } else if (permissionError.name === 'NotFoundError') {
                alert('No se encontró ningún micrófono. Por favor, conecta un micrófono y intenta nuevamente.');
            } else if (permissionError.name === 'NotReadableError') {
                alert('El micrófono está siendo usado por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando el micrófono.');
            } else {
                alert('Error al acceder al micrófono: ' + permissionError.message);
            }
            return;
        }

        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
            alert('Tu navegador no soporta grabación de audio. Por favor, usa un navegador más reciente.');
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        // Create media recorder with format fallback
        const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        let selectedMimeType = '';
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                break;
            }
        }

        if (!selectedMimeType) {
            alert('Tu navegador no soporta ningún formato de audio compatible.');
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        mediaRecorder.value = new MediaRecorder(stream, { mimeType: selectedMimeType });

        // Set up event handlers
        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.value.push(event.data);
            }
        };

        mediaRecorder.value.onstop = async () => {
            // Create audio blob from chunks
            const audioBlob = new Blob(audioChunks.value, { type: selectedMimeType });

            // Stop all tracks in the stream
            stream.getTracks().forEach(track => track.stop());

            // Reset recording state
            isRecording.value = false;

            // Process audio with speech-to-text
            await processAudioToText(audioBlob);
        };

        mediaRecorder.value.onerror = (event: any) => {
            console.error('MediaRecorder error:', event);
            alert('Error durante la grabación. Por favor, intenta nuevamente.');

            // Clean up
            stream.getTracks().forEach(track => track.stop());
            isRecording.value = false;

            if (recordingTimer.value) {
                clearInterval(recordingTimer.value);
                recordingTimer.value = null;
            }
        };

        // Start recording
        mediaRecorder.value.start(1000); // Collect data every second
        isRecording.value = true;

        // Update permission status
        microphonePermission.value = 'granted';

        // Start timer
        recordingTimer.value = window.setInterval(() => {
            recordingTime.value++;
        }, 1000);

        console.log('Recording started successfully with format:', selectedMimeType);
    } catch (error: any) {
        console.error('Error starting recording:', error);

        // Reset state
        isRecording.value = false;
        if (recordingTimer.value) {
            clearInterval(recordingTimer.value);
            recordingTimer.value = null;
        }

        // User-friendly error messages
        if (error.name === 'NotSupportedError') {
            alert('Tu navegador no soporta grabación de audio. Por favor, usa Chrome, Firefox o Safari.');
        } else if (error.name === 'SecurityError') {
            alert('Error de seguridad. Asegúrate de estar usando HTTPS o localhost.');
        } else {
            alert('No se pudo iniciar la grabación. Verifica los permisos del micrófono en la configuración del navegador.');
        }
    }
}

function stopRecording() {
    if (mediaRecorder.value && isRecording.value) {
        // Stop recording
        mediaRecorder.value.stop();

        // Clear timer
        if (recordingTimer.value) {
            clearInterval(recordingTimer.value);
            recordingTimer.value = null;
        }

        console.log('Recording stopped');
    }
}

// Format recording time as MM:SS
function formatRecordingTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Process audio to text using speech-to-text service
async function processAudioToText(audioBlob: Blob) {
    try {
        // Show processing state
        localIsProcessingAI.value = true;
        emit('update:isProcessingAI', true);

        // Create FormData to send audio file
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', 'es'); // Spanish by default

        // Send audio to backend for transcription
        const response = await fetch('/api/speech/speech-to-text', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data.text) {
            // Update the prompt with transcribed text
            localAIPrompt.value = result.data.text;
            emit('update:aiPrompt', localAIPrompt.value);

            // Automatically send the prompt to AI
            emit('sendAIPrompt');
        } else {
            console.error('Error transcribing audio:', result.message);
            alert('Error al transcribir el audio. Por favor, intenta nuevamente.');
        }
    } catch (error) {
        console.error('Error processing audio:', error);
        alert('Error al procesar el audio. Por favor, intenta nuevamente.');
    } finally {
        // Reset processing state
        localIsProcessingAI.value = false;
        emit('update:isProcessingAI', false);
    }
}

// Clean up on component unmount
onUnmounted(() => {
    if (recordingTimer.value) {
        clearInterval(recordingTimer.value);
    }
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop();
    }
    stopSpeechRecognition();
});

initSpeechRecognition();
checkMicrophoneSupport();

</script>

<template>
    <div
        class="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col transition-colors">
        <!-- AI Chat Header -->
        <div
            class="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
            <h3 class="font-semibold">Asistente IA para Flutter y Angular</h3>
            <button @click="toggleAIChat" class="text-white hover:text-gray-200 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <!-- AI Chat Messages -->
        <div class="flex-1 overflow-y-auto p-4">
            <div v-if="aiMessages.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-4">
                <p>Bienvenido al asistente IA para Flutter y Angular.</p>
                <p class="mt-2">Describe la interfaz que deseas crear y la IA generará los componentes
                    correspondientes para el framework que elijas.</p>
                <p class="mt-2 text-sm font-semibold">Ejemplos de comandos por voz:</p>
                <div class="mt-1 text-xs space-y-2">
                    <p class="bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 p-2 rounded">
                        <span class="font-semibold">Flutter:</span> "Genera un formulario Flutter para registro de usuarios con campos para nombre, email, contraseña y botón de registro"
                    </p>
                    <p class="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-2 rounded">
                        <span class="font-semibold">Angular:</span> "Crea un componente Angular para un dashboard con tarjetas de estadísticas y un gráfico de barras"
                    </p>
                </div>
            </div>

            <div v-for="(msg, index) in aiMessages" :key="index" class="mb-4"
                :class="{ 'text-right': msg.isUser, 'text-left': !msg.isUser }">
                <div class="inline-block px-3 py-2 rounded-lg max-w-[90%]"
                    :class="msg.isUser ? 'bg-purple-100 dark:bg-purple-900 dark:bg-opacity-30' : 'bg-gray-100 dark:bg-gray-700'">
                    <div class="font-semibold text-xs"
                        :class="msg.isUser ? 'text-purple-600 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'">
                        {{ msg.isUser ? 'Tú' : 'Asistente IA' }}
                    </div>
                    <div class="whitespace-pre-wrap dark:text-white">{{ msg.text }}</div>

                    <!-- Add to Canvas button for AI responses -->
                    <div v-if="!msg.isUser && msg.widgets && msg.widgets.length > 0" class="mt-2">
                        <button @click="addAIWidgetsToCanvas(msg.widgets)"
                            class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors">
                            Añadir a la Pizarra
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loading indicator -->
            <div v-if="localIsProcessingAI" class="flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 dark:border-purple-400">
                </div>
                <span class="ml-2 text-purple-600 dark:text-purple-400">Generando respuesta...</span>
            </div>
        </div>

        <!-- AI Chat Input -->
        <form @submit.prevent="sendAIPrompt"
            class="border-t border-gray-300 dark:border-gray-600 p-2 flex flex-col gap-2">
            <!-- Recording indicator -->
            <div v-if="isRecording"
                class="flex items-center justify-between bg-red-100 dark:bg-red-900 p-2 rounded-md mb-2">
                <div class="flex items-center">
                    <div class="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                    <span class="text-red-700 dark:text-red-300 text-sm">Grabando... {{ formatRecordingTime(recordingTime) }}</span>
                </div>
                <button type="button" @click="toggleRecording"
                    class="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </div>

            <textarea v-model="localAIPrompt" rows="3" placeholder="Solicita un formulario o componente para Flutter o Angular (ej: 'Genera un formulario Flutter para login' o 'Crea un componente Angular para galería de imágenes')..."
                class="w-full px-3 py-2 border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                :disabled="localIsProcessingAI"
                :readonly="isRecording"
                :class="{'bg-gray-50 dark:bg-gray-600': isRecording}"
                @input="onInput"></textarea>

            <div class="flex gap-2">
                <!-- Microphone button with enhanced status indication -->
                <div class="relative">
                    <button type="button" @click="toggleRecording"
                        class="px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        :disabled="localIsProcessingAI || !microphoneSupported"
                        :class="{
                            'bg-red-600 animate-pulse': isRecording,
                            'bg-red-500 hover:bg-red-600': !isRecording && microphoneSupported,
                            'bg-gray-400 cursor-not-allowed': !microphoneSupported
                        }"
                        :title="!microphoneSupported ? 'Micrófono no soportado en este navegador' :
                               microphonePermission === 'denied' ? 'Permisos de micrófono denegados' :
                               isRecording ? 'Detener grabación' : 'Iniciar grabación por voz'">

                        <!-- Microphone icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                                clip-rule="evenodd" />
                        </svg>

                        <!-- Status indicator for microphone state -->
                        <span v-if="!microphoneSupported" class="text-xs">No soportado</span>
                        <span v-else-if="microphonePermission === 'denied'" class="text-xs">Sin permisos</span>
                        <span v-else-if="isRecording" class="text-xs">Grabando</span>
                    </button>

                    <!-- Permission status indicator -->
                    <div v-if="microphoneSupported" class="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                        :class="{
                            'bg-green-500': microphonePermission === 'granted',
                            'bg-yellow-500': microphonePermission === 'prompt' || microphonePermission === 'unknown',
                            'bg-red-500': microphonePermission === 'denied'
                        }"
                        :title="microphonePermission === 'granted' ? 'Permisos concedidos' :
                               microphonePermission === 'denied' ? 'Permisos denegados' :
                               'Estado de permisos desconocido'">
                    </div>
                </div>

                <!-- Send button -->
                <button type="submit"
                    class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    :disabled="localIsProcessingAI || (!localAIPrompt.trim() && !isRecording)">
                    {{ isProcessingAI ? 'Generando...' : 'Generar Widgets' }}
                </button>
            </div>

            <!-- Microphone setup help message -->
            <div v-if="!microphoneSupported || microphonePermission === 'denied'"
                 class="text-xs text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 p-2 rounded-md">
                <div v-if="!microphoneSupported" class="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                        <p class="font-semibold text-yellow-800 dark:text-yellow-200">Grabación de voz no disponible</p>
                        <p class="mt-1">Para usar grabación de voz:</p>
                        <ul class="mt-1 list-disc list-inside space-y-1">
                            <li>Usa un navegador moderno (Chrome, Firefox, Safari)</li>
                            <li>Accede desde HTTPS o localhost</li>
                            <li>Verifica que tengas un micrófono conectado</li>
                        </ul>
                    </div>
                </div>

                <div v-else-if="microphonePermission === 'denied'" class="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                    <div>
                        <p class="font-semibold text-red-800 dark:text-red-200">Permisos de micrófono denegados</p>
                        <p class="mt-1">Para habilitar la grabación de voz:</p>
                        <ul class="mt-1 list-disc list-inside space-y-1">
                            <li>Haz clic en el ícono de micrófono en la barra de direcciones</li>
                            <li>Selecciona "Permitir" para el micrófono</li>
                            <li>Recarga la página si es necesario</li>
                        </ul>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>
