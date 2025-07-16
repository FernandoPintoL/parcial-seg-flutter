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

        recognition.value.continuous = false;
        recognition.value.interimResults = false;
        recognition.value.lang = 'es-ES';

        recognition.value.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            localAIPrompt.value = transcript;
            emit('update:aiPrompt', localAIPrompt.value);

            // Auto-send prompt
            emit('sendAIPrompt');
        };

        recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            alert('Error en el reconocimiento de voz. Intenta nuevamente.');
        };

        recognition.value.onend = () => {
            isRecording.value = false;
        };
    }
}

// Alternative speech recording using Web Speech API
/* async function startSpeechRecognition() {
    if (recognition.value) {
        isRecording.value = true;
        recognition.value.start();
    } else {
        alert('Tu navegador no soporta reconocimiento de voz.');
    }
} */

function stopSpeechRecognition() {
    if (recognition.value) {
        recognition.value.stop();
        isRecording.value = false;
    }
}

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
    emit('sendAIPrompt');
}

function addAIWidgetsToCanvas(widgets: any[]) {
    emit('addAIWidgetsToCanvas', widgets);
}

// Audio recording functions
async function toggleRecording() {
    if (isRecording.value) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        // Reset recording state
        audioChunks.value = [];
        recordingTime.value = 0;

        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create media recorder
        mediaRecorder.value = new MediaRecorder(stream);

        // Set up event handlers
        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.value.push(event.data);
            }
        };

        mediaRecorder.value.onstop = async () => {
            // Create audio blob from chunks
            const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' });

            // Stop all tracks in the stream
            stream.getTracks().forEach(track => track.stop());

            // Reset recording state
            isRecording.value = false;

            // Process audio with speech-to-text
            await processAudioToText(audioBlob);
        };

        // Start recording
        mediaRecorder.value.start();
        isRecording.value = true;

        // Start timer
        recordingTimer.value = window.setInterval(() => {
            recordingTime.value++;
        }, 1000);

        console.log('Recording started');
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('No se pudo acceder al micrófono. Por favor, verifica los permisos del navegador.');
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

</script>

<template>
    <div v-if="showAIChat"
        class="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col transition-colors">
        <!-- AI Chat Header -->
        <div
            class="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
            <h3 class="font-semibold">Asistente IA para Flutter</h3>
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
                <p>Bienvenido al asistente IA para Flutter.</p>
                <p class="mt-2">Describe la interfaz que deseas crear y la IA generará los widgets
                    correspondientes.</p>
                <p class="mt-2 text-xs">Ejemplo: "Crea un formulario flutter para login con campos para email y
                    contraseña, y un botón
                    para iniciar sesión"</p>
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
                    <span class="text-red-700 dark:text-red-300 text-sm">Grabando... {{
                        formatRecordingTime(recordingTime) }}</span>
                </div>
                <button type="button" @click="stopRecording"
                    class="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </div>

            <textarea v-model="localAIPrompt" rows="3" placeholder="Describe la interfaz que deseas crear..."
                class="w-full px-3 py-2 border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                :disabled="localIsProcessingAI || isRecording" @input="onInput"></textarea>

            <div class="flex gap-2">
                <!-- Microphone button -->
                <button type="button" @click="toggleRecording"
                    class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    :disabled="localIsProcessingAI" :class="{ 'bg-red-600 animate-pulse': isRecording }">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                            clip-rule="evenodd" />
                    </svg>
                </button>

                <!-- Send button -->
                <button type="submit"
                    class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    :disabled="localIsProcessingAI || (!localAIPrompt.trim() && !isRecording)">
                    {{ isProcessingAI ? 'Generando...' : 'Generar Widgets' }}
                </button>
            </div>
        </form>
    </div>
</template>
