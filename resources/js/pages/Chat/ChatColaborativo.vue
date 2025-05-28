<script setup lang="ts">
import { ref, watch, defineProps } from 'vue';

const props = defineProps({
    showFloatingChat: {
        type: Boolean,
        required: true
    },
    chatMessages: {
        type: Array as () => { text: string; user: string; timestamp: number }[],
        required: true
    },
    chatTyping: {
        type: Object as () => { typing?: string },
        default: () => ({})
    },
    currentUser: {
        type: String,
        required: true
    },
    chatMessage: {
        type: String,
        default: ''
    }
});

const emit = defineEmits([
    'toggleFloatingChat',
    'sendChatMessage',
    'onChatInput',
    'update:chatMessage']);

// Variable local para el input
const localChatMessage = ref(props.chatMessage);
// Sincroniza la prop con la variable local
watch(() => props.chatMessage, (val : any) => {
    localChatMessage.value = val;
});

// Emite el evento al escribir
function onInput(e : any) {
    localChatMessage.value = e.target.value;
    emit('onChatInput', localChatMessage.value);
    emit('update:chatMessage', localChatMessage.value);
}

// emite toggleFloatingChat
function toggleFloatingChat() {
    emit('toggleFloatingChat');
}

// Emite el evento al enviar
function onSubmit() {
    emit('sendChatMessage');
}
</script>
<template>
    <div v-if="showFloatingChat"
         class="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col transition-colors">
        <!-- Chat Header -->
        <div class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
            <h3 class="font-semibold">Chat del Proyecto</h3>
            <button @click="toggleFloatingChat" class="text-white hover:text-gray-200 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-4">
            <div v-if="chatMessages.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-4">
                No hay mensajes aún
            </div>

            <div
                v-for="(msg, index) in chatMessages"
                :key="index"
                class="mb-3"
                :class="msg.user === currentUser ? 'text-right' : 'text-left'"
            >
                <div
                    class="inline-block px-3 py-2 rounded-lg max-w-[80%]"
                    :class="msg.user === currentUser ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30' : 'bg-gray-100 dark:bg-gray-700'"
                >
                    <div class="font-semibold text-xs text-gray-600 dark:text-gray-300">{{ msg.user }}</div>
                    <div class="dark:text-white">{{ msg.text }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ new Date(msg.timestamp).toLocaleTimeString() }}
                    </div>
                </div>
            </div>

            <p v-if="chatTyping.typing" class="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                {{ chatTyping.typing }}
            </p>
        </div>

        <!-- Chat Input -->
        <form @submit.prevent="onSubmit" class="border-t border-gray-300 dark:border-gray-600 p-2 flex gap-2">
            <input
                v-model="localChatMessage"
                type="text"
                placeholder="Escribe un mensaje..."
                class="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                @input="onInput"
            />
            <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
                Enviar
            </button>
        </form>
    </div>

</template>
