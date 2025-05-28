<script setup lang="ts">
import { ref, watch, defineProps } from 'vue';

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
    'addAIWidgetsToCanvas',
    'update:aiPrompt',
    'update:isProcessingAI',
    'onAIPromptInput'
]);
const localIsProcessingAI = ref(props.isProcessingAI);
const localAIPrompt = ref(props.aiPrompt);

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

</script>

<template>
    <div v-if="showAIChat"
         class="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col transition-colors">
        <!-- AI Chat Header -->
        <div class="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
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

            <div
                v-for="(msg, index) in aiMessages"
                :key="index"
                class="mb-4"
                :class="{'text-right': msg.isUser, 'text-left': !msg.isUser}"
            >
                <div
                    class="inline-block px-3 py-2 rounded-lg max-w-[90%]"
                    :class="msg.isUser ? 'bg-purple-100 dark:bg-purple-900 dark:bg-opacity-30' : 'bg-gray-100 dark:bg-gray-700'"
                >
                    <div class="font-semibold text-xs"
                         :class="msg.isUser ? 'text-purple-600 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'">
                        {{ msg.isUser ? 'Tú' : 'Asistente IA' }}
                    </div>
                    <div class="whitespace-pre-wrap dark:text-white">{{ msg.text }}</div>

                    <!-- Add to Canvas button for AI responses -->
                    <div v-if="!msg.isUser && msg.widgets && msg.widgets.length > 0" class="mt-2">
                        <button
                            @click="addAIWidgetsToCanvas(msg.widgets)"
                            class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                            Añadir a la Pizarra
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loading indicator -->
            <div v-if="localIsProcessingAI" class="flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 dark:border-purple-400"></div>
                <span class="ml-2 text-purple-600 dark:text-purple-400">Generando respuesta...</span>
            </div>
        </div>

        <!-- AI Chat Input -->
        <form @submit.prevent="sendAIPrompt" class="border-t border-gray-300 dark:border-gray-600 p-2 flex flex-col gap-2">
                    <textarea
                        v-model="localAIPrompt"
                        rows="3"
                        placeholder="Describe la interfaz que deseas crear..."
                        class="w-full px-3 py-2 border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        :disabled="localIsProcessingAI"
                        @input="onInput"
                    ></textarea>
            <button
                type="submit"
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :disabled="localIsProcessingAI || !localAIPrompt.trim()"
            >
                {{ isProcessingAI ? 'Generando...' : 'Generar Widgets' }}
            </button>
        </form>
    </div>
</template>
