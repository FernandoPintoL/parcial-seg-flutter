<script setup lang="ts">
import type { UnifiedScreen, UnifiedElement } from '@/Data/PizarraUnificada';
import UnifiedWidgetPalette from '../UnifiedWidgetPalette.vue';
import UnifiedCanvas from '../UnifiedCanvas.vue';
import UnifiedPropertiesPanel from '../UnifiedPropertiesPanel.vue';

interface Props {
    currentScreen: UnifiedScreen;
    availableWidgets: any[];
    selectedFramework: 'flutter' | 'angular' | 'both';
    selectedElement: UnifiedElement | null;
    showWidgetPalette: boolean;
    showPropertiesPanel: boolean;
    isPanelsCollapsed: boolean;
    socketConnected: boolean;
}

interface Emits {
    addWidget: [widgetType: string];
    addElement: [element: UnifiedElement]; // Agregado para manejar elementos completos
    selectElement: [element: UnifiedElement];
    updateElement: [element: UnifiedElement];
    updateElementProperty: [propertyName: string, value: any];
    removeElement: [element: UnifiedElement];
    toggleScreenManager: [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
    <div
        class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div class="mx-auto p-4">
            <!-- Main Workspace Container -->
            <div
                class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">

                <!-- Status Bar - Compact -->
                <div
                    class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-2">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-3">
                            <div class="flex items-center space-x-2">
                                <div
                                    :class="['w-2 h-2 rounded-full', { 'animate-pulse': socketConnected, 'bg-green-400': socketConnected, 'bg-red-400': !socketConnected }]">
                                </div>
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {{ currentScreen?.name }}
                                </span>
                                <span
                                    class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                    {{ currentScreen?.elements?.length || 0 }} elem.
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2">
                            <!-- Screen Manager Button - Compact -->
                            <button @click="$emit('toggleScreenManager')"
                                class="px-3 py-1 rounded-md transition-all duration-200 border border-gray-200 dark:border-gray-600 backdrop-blur-sm flex items-center space-x-1 bg-white/50 text-gray-700 hover:bg-white/70">
                                <span class="material-icons text-sm">layers</span>
                                <span class="text-sm font-medium">Pantallas</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Workspace - Compact Layout -->
                <div class="p-3">
                    <div class="flex gap-3" :class="{ 'justify-center': isPanelsCollapsed }">

                        <!-- Widget Palette - Compact Mode -->
                        <div v-if="showWidgetPalette && !isPanelsCollapsed"
                            class="w-64 transition-all duration-300 transform">
                            <div
                                class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 h-full">
                                <div class="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                                    <div class="flex items-center space-x-2">
                                        <span class="material-icons text-blue-500 text-lg">widgets</span>
                                        <h3 class="font-medium text-sm text-gray-800 dark:text-gray-200">Componentes
                                        </h3>
                                    </div>
                                </div>
                                <div class="p-2">
                                    <UnifiedWidgetPalette :available-widgets="availableWidgets"
                                        :selected-framework="selectedFramework" @add-widget="$emit('addWidget', $event)"
                                        @drag-start="(widgetType) => console.log('Drag start:', widgetType)"
                                        @drag-end="() => console.log('Drag end')" />
                                </div>
                            </div>
                        </div>

                        <!-- Canvas Area - Maximized for Whiteboard Focus -->
                        <div class="flex-1 transition-all duration-300">
                            <div
                                class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 min-h-[85vh]">
                                <div class="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-2">
                                            <span class="material-icons text-green-500 text-lg">design_services</span>
                                            <h3 class="font-medium text-sm text-gray-800 dark:text-gray-200">Pizarra
                                            </h3>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <div
                                                class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                                {{ selectedFramework }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-1">
                                    <UnifiedCanvas :current-screen="currentScreen" :available-widgets="availableWidgets"
                                        :selected-framework="selectedFramework"
                                        @select-element="(element) => { console.log('🎯 Canvas select-element:', element.id); $emit('selectElement', element); }"
                                        @remove-element="(element) => { console.log('🗑️ Canvas remove-element:', element.id); $emit('removeElement', element); }"
                                        @update-element="(element) => { console.log('📝 Canvas update-element:', element.id); $emit('updateElement', element); }"
                                        @add-element="(element) => { console.log('➕ Canvas add-element:', element.type, element.framework); $emit('addElement', element); }"
                                        @drop="(widgetType) => $emit('addWidget', widgetType)" />
                                </div>
                            </div>
                        </div>

                        <!-- Properties Panel - Compact Mode -->
                        <div v-if="showPropertiesPanel && !isPanelsCollapsed"
                            class="w-64 transition-all duration-300 transform">
                            <div
                                class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 h-full">
                                <div class="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                                    <div class="flex items-center space-x-2">
                                        <span class="material-icons text-purple-500 text-lg">tune</span>
                                        <h3 class="font-medium text-sm text-gray-800 dark:text-gray-200">Propiedades
                                        </h3>
                                    </div>
                                </div>
                                <div class="p-2">
                                    <UnifiedPropertiesPanel :selected-element="selectedElement"
                                        :available-widgets="availableWidgets" :framework="selectedFramework"
                                        @update-element="(element) => $emit('updateElement', element)"
                                        @update-property="$emit('updateElementProperty', $event.propertyName, $event.value)"
                                        @update-color-property="$emit('updateElementProperty', $event.propertyName, $event.value)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Workspace specific styles */
.workspace-container {
    min-height: calc(100vh - 200px);
}

.panel-transition {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-card {
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.dark .panel-card {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(75, 85, 99, 0.3);
}

.status-indicator {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.element-counter {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.dark .element-counter {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
    border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Smooth animations for panel visibility */
.panel-enter-active,
.panel-leave-active {
    transition: all 0.3s ease-in-out;
}

.panel-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.panel-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

/* Enhanced scrollbars */
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.8);
}

/* Button hover effects */
.screen-manager-btn {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    transition: all 0.2s ease-in-out;
}

.screen-manager-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .screen-manager-btn:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
