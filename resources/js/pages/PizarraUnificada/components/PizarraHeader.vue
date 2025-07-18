<script setup lang="ts">
interface Props {
    projectName: string;
    selectedFramework: 'flutter' | 'angular' | 'both';
    showWidgetPalette: boolean;
    showPropertiesPanel: boolean;
    isPanelsCollapsed: boolean;
    isDarkMode: boolean;
}

interface Emits {
    switchFramework: [framework: 'flutter' | 'angular' | 'both'];
    toggleWidgetPalette: [];
    togglePropertiesPanel: [];
    togglePanelsCollapse: [];
    toggleFullscreen: [];
    toggleDarkMode: [];
    savePizarra: [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
    <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div class="flex justify-between items-center px-4 py-2">
            <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                        <span class="material-icons text-white text-sm">dashboard</span>
                    </div>
                    <div>
                        <h2 class="font-bold text-lg">{{ projectName }}</h2>
                        <p class="text-blue-100 text-xs">Editor Unificado</p>
                    </div>
                </div>
            </div>

            <!-- Compact Toolbar -->
            <div class="flex items-center space-x-2">
                <!-- Framework Selector - Compact -->
                <div class="relative">
                    <select :value="selectedFramework"
                        @change="$emit('switchFramework', ($event.target as HTMLSelectElement).value as 'flutter' | 'angular' | 'both')"
                        class="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-md px-3 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm">
                        <option value="flutter" class="text-gray-800">🎯 Flutter</option>
                        <option value="angular" class="text-gray-800">🅰️ Angular</option>
                        <option value="both" class="text-gray-800">🔄 Ambos</option>
                    </select>
                    <span
                        class="material-icons absolute right-1 top-1/2 transform -translate-y-1/2 text-white pointer-events-none text-sm">
                        expand_more
                    </span>
                </div>

                <!-- Panel Controls - Compact -->
                <div class="flex items-center bg-white/10 backdrop-blur-sm rounded-md">
                    <button @click="$emit('toggleWidgetPalette')"
                        :class="showWidgetPalette ? 'bg-white/20' : 'hover:bg-white/10'"
                        class="p-1.5 transition-all duration-200 group" title="Componentes (Ctrl+Shift+P)">
                        <span class="material-icons text-sm">widgets</span>
                    </button>
                    <button @click="$emit('togglePropertiesPanel')"
                        :class="showPropertiesPanel ? 'bg-white/20' : 'hover:bg-white/10'"
                        class="p-1.5 transition-all duration-200 group" title="Propiedades (Ctrl+Shift+R)">
                        <span class="material-icons text-sm">tune</span>
                    </button>
                    <button @click="$emit('togglePanelsCollapse')"
                        class="p-1.5 hover:bg-white/10 transition-all duration-200" title="Colapsar Paneles">
                        <span class="material-icons text-sm">
                            {{ isPanelsCollapsed ? 'unfold_more' : 'unfold_less' }}
                        </span>
                    </button>
                </div>

                <!-- Quick Actions - Compact -->
                <div class="flex items-center bg-white/10 backdrop-blur-sm rounded-md">
                    <button @click="$emit('toggleFullscreen')"
                        class="p-1.5 hover:bg-white/10 transition-all duration-200"
                        title="Pantalla Completa (Ctrl+Shift+F)">
                        <span class="material-icons text-sm">fullscreen</span>
                    </button>
                    <button @click="$emit('savePizarra')" class="p-1.5 hover:bg-white/10 transition-all duration-200"
                        title="Guardar (Ctrl+S)">
                        <span class="material-icons text-sm">save</span>
                    </button>
                </div>

                <!-- Dark Mode Toggle - Compact -->
                <button @click="$emit('toggleDarkMode')"
                    class="p-1.5 rounded-md bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
                    title="Modo Oscuro (Ctrl+Shift+D)">
                    <svg v-if="isDarkMode" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Adicionar animaciones y efectos específicos del header */
.header-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.panel-button-active {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.1);
}

.framework-selector:focus {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

/* Hover effects for buttons */
.toolbar-button {
    transition: all 0.2s ease-in-out;
}

.toolbar-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-button:active {
    transform: translateY(0);
}
</style>
