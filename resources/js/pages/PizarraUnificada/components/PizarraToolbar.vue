<script setup lang="ts">
import { ref } from 'vue';

// Local state for toolbar
const showTooltips = ref(false);

interface Emits {
    toggleAiChat: [];
    toggleImageUpload: [];
    toggleDiagramUpload: [];
    toggleCodeViewer: [];
    toggleCollaborationChat: [];
    toggleCollaboratorManagement: [];
}

defineEmits<Emits>();

// Tooltip management
const showTooltip = () => {
    showTooltips.value = true;
};

const hideTooltip = () => {
    showTooltips.value = false;
};
</script>

<template>
    <div class="fixed bottom-6 right-6 flex flex-col space-y-3 z-40" @mouseenter="showTooltip"
        @mouseleave="hideTooltip">

        <!-- AI Chat Button -->
        <div class="relative group">
            <button @click="$emit('toggleAiChat')"
                class="p-4 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm fab-button"
                title="Chat con IA (Ctrl+Shift+A)">
                <span class="material-icons text-xl">smart_toy</span>
            </button>
            <div v-if="showTooltips"
                class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-90 tooltip">
                Chat con IA
                <div
                    class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent">
                </div>
            </div>
        </div>

        <!-- Image Upload Button -->
        <div class="relative group">
            <button @click="$emit('toggleImageUpload')"
                class="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm fab-button"
                title="Subir Imagen">
                <span class="material-icons text-xl">image</span>
            </button>
            <div v-if="showTooltips"
                class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-90 tooltip">
                Procesar Imagen
                <div
                    class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent">
                </div>
            </div>
        </div>

        <!-- Diagram Upload Button -->
        <div class="relative group">
            <button @click="$emit('toggleDiagramUpload')"
                class="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm fab-button"
                title="Subir Diagrama">
                <span class="material-icons text-xl">account_tree</span>
            </button>
            <div v-if="showTooltips"
                class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-90 tooltip">
                Procesar Diagrama
                <div
                    class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent">
                </div>
            </div>
        </div>

        <!-- Code Viewer Button -->
        <div class="relative group">
            <button @click="$emit('toggleCodeViewer')"
                class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm fab-button"
                title="Ver Código Generado">
                <span class="material-icons text-xl">code</span>
            </button>
            <div v-if="showTooltips"
                class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-90 tooltip">
                Ver Código
                <div
                    class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent">
                </div>
            </div>
        </div>

        <!-- Collaboration Chat Button -->
        <div class="relative group">
            <button @click="$emit('toggleCollaborationChat')"
                class="p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm fab-button"
                title="Chat Colaborativo">
                <span class="material-icons text-xl">forum</span>
            </button>
            <div v-if="showTooltips"
                class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-90 tooltip">
                Chat Colaborativo
                <div
                    class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent">
                </div>
            </div>
        </div>

        <!-- Collaborator Management Button -->
        <div class="relative group">
            <button @click="$emit('toggleCollaboratorManagement')"
                class="p-4 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm fab-button"
                title="Gestión de Colaboradores">
                <span class="material-icons text-xl">people</span>
            </button>
            <div v-if="showTooltips"
                class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-90 tooltip">
                Gestión de Colaboradores
                <div
                    class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent">
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Floating Action Button Effects */
.fab-button {
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
}

.fab-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.fab-button:hover::before {
    left: 100%;
}

.fab-button:hover {
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
    transform: scale(1.1) translateY(-2px);
}

.fab-button:active {
    transform: scale(1.05) translateY(0);
}

/* Tooltip animations */
.tooltip {
    animation: slideInLeft 0.3s ease-out;
    z-index: 1000;
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(10px) translateY(-50%);
    }

    to {
        opacity: 0.9;
        transform: translateX(0) translateY(-50%);
    }
}

/* Staggered animation for buttons */
.fab-button:nth-child(1) {
    animation-delay: 0s;
}

.fab-button:nth-child(2) {
    animation-delay: 0.1s;
}

.fab-button:nth-child(3) {
    animation-delay: 0.2s;
}

.fab-button:nth-child(4) {
    animation-delay: 0.3s;
}

.fab-button:nth-child(5) {
    animation-delay: 0.4s;
}

/* Bounce animation for buttons */
.fab-bounce {
    animation: fab-bounce 2s infinite ease-in-out;
}

@keyframes fab-bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-5px);
    }

    60% {
        transform: translateY(-3px);
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .fab-button {
        padding: 12px;
    }

    .tooltip {
        display: none;
    }
}

/* Enhanced shadow effects */
.fab-button {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.fab-button:hover {
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
}

/* Color-specific hover effects */
.fab-button.bg-green-500:hover {
    box-shadow: 0 12px 35px rgba(34, 197, 94, 0.3);
}

.fab-button.bg-purple-500:hover {
    box-shadow: 0 12px 35px rgba(168, 85, 247, 0.3);
}

.fab-button.bg-orange-500:hover {
    box-shadow: 0 12px 35px rgba(249, 115, 22, 0.3);
}

.fab-button.bg-blue-500:hover {
    box-shadow: 0 12px 35px rgba(59, 130, 246, 0.3);
}

.fab-button.bg-indigo-500:hover {
    box-shadow: 0 12px 35px rgba(99, 102, 241, 0.3);
}
</style>
