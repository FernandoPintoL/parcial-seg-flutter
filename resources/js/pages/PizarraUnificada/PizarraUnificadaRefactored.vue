<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { router } from '@inertiajs/vue3';
import { onMounted, onUnmounted, watch, unref } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import type { BreadcrumbItem } from '@/types';
import type { PizarraUnificada, User } from '@/Data/PizarraUnificada';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import ChatAI from '@/pages/Chat/ChatAI.vue';
import UnifiedWidgetPalette from './UnifiedWidgetPalette.vue';
import UnifiedCanvas from './UnifiedCanvas.vue';
import PizarraPropertiesPanel from './components/PizarraPropertiesPanel.vue';
import { usePizarraState } from './composables/usePizarraState';
import { useElementManagement } from './composables/useElementManagement';
import { useUIControls } from './composables/useUIControls';
import { usePizarraServices } from './composables/usePizarraServices';
import './PizarraUnificada.css';

// Props - Single Responsibility: Data Input
const props = defineProps({
    user: {
        type: Object as () => User,
        required: true,
    },
    pizarra: {
        type: Object as () => PizarraUnificada,
        required: false,
        default: () => ({
            id: 0,
            name: 'Nueva Pizarra',
            type: 'both',
            screens: [],
            elements: [],
            room_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }),
    },
    creador: {
        type: Object as () => User,
        required: true,
    },
    isCreador: {
        type: Boolean,
        default: false,
    },
    colaboradores: {
        type: Array as () => User[],
        default: () => [],
    },
});

// Early guard
if (!props.pizarra || !props.pizarra.id) {
    console.error('Pizarra data is required');
    router.visit('/pizarra_unificada');
}

// Breadcrumbs - Single Responsibility: Navigation
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pizarra Unificada',
        href: props.pizarra ? `/pizarra_unificada/${props.pizarra.id}/edit` : '/pizarra_unificada',
    },
];

// Composable Usage - Dependency Inversion: Depend on abstractions
const pizarraState = usePizarraState({ pizarra: props.pizarra });
const uiControls = useUIControls();
const services = usePizarraServices({ 
    pizarra: props.pizarra, 
    user: props.user 
});

// Element Management - Interface Segregation: Specific interface for elements
const elementManagement = useElementManagement({
    currentScreen: unref(pizarraState.currentScreen) as any,
    selectedFramework: unref(pizarraState.selectedFramework) as any
});

// Watchers - Open/Closed: Extensible through composables
watch(pizarraState.selectedFramework, (newFramework) => {
    elementManagement.updateAvailableWidgets();
    services.exportOptions.value.framework = newFramework;
    services.emitFrameworkSwitched(newFramework);
});

// Lifecycle - Single Responsibility: Initialization
onMounted(() => {
    services.initializeCollaboration();
    pizarraState.initializeScreens();
    elementManagement.updateAvailableWidgets();
    uiControls.applyDarkMode();
});

onUnmounted(() => {
    services.disconnect();
});

// Business Logic Functions - Single Responsibility: Each function has one purpose

// Framework switching
const switchFramework = (framework: 'flutter' | 'angular' | 'both') => {
    pizarraState.switchFramework(framework);
    savePizarra();
};

// Operaciones de elementos
const addWidget = (widgetType: string) => {
    const newElement = elementManagement.addWidget(widgetType);
    const currentScreen = pizarraState.currentScreen?.value;
    if (newElement && currentScreen) {
        services.emitElementAdded(newElement, currentScreen.id);
        savePizarra();
    }
};

const selectElement = (element: any) => {
    elementManagement.selectElement(element);
    uiControls.showPropertiesPanel.value = true;
    const currentScreen = pizarraState.currentScreen?.value;
    if (currentScreen) {
        services.emitElementSelected(element, currentScreen.id);
    }
};

const removeElement = (element: any) => {
    const success = elementManagement.removeElement(element);
    const currentScreen = pizarraState.currentScreen?.value;
    if (success && currentScreen) {
        services.emitElementDeleted(element.id, currentScreen.id);
        savePizarra();
    }
};

const handleElementUpdate = (updatedElement: any) => {
    const success = elementManagement.updateElement(updatedElement);
    const currentScreen = pizarraState.currentScreen?.value;
    if (success && currentScreen) {
        services.emitElementUpdated(updatedElement, currentScreen.id);
        savePizarra();
    }
};

const duplicateElement = (element: any) => {
    const duplicatedElement = elementManagement.duplicateElement(element);
    const currentScreen = pizarraState.currentScreen?.value;
    if (duplicatedElement && currentScreen) {
        services.emitElementAdded(duplicatedElement, currentScreen.id);
        savePizarra();
    }
};

// Screen management
const addScreen = (screenName: string) => {
    const newScreen = pizarraState.addScreen(screenName);
    uiControls.showScreenManager.value = false;
    savePizarra();
};

const deleteScreen = async (index: number) => {
    const success = pizarraState.deleteScreen(index);
    if (success) {
        savePizarra();
    }
};

const selectScreen = (index: number) => {
    pizarraState.selectScreen(index);
    elementManagement.selectedElement.value = null;
};

const setHomeScreen = (index: number) => {
    pizarraState.setHomeScreen(index);
    savePizarra();
};

// Save functionality
const savePizarra = async () => {
    await services.savePizarra({
        name: pizarraState.projectName.value,
        type: pizarraState.projectType.value,
        screens: pizarraState.screens.value,
        // Corrección: acceder correctamente a los elementos de la pantalla actual
        elements: pizarraState.currentScreen?.value?.elements || []
    });
};

// AI functionality
const sendAIPrompt = async () => {
    await services.sendAIPrompt((code: string) => {
        console.log('Parsing AI code:', code);
        // TODO: Implement code parsing logic
    });
};

const addAIWidgetsToCanvas = (widgets: any[]) => {
    widgets.forEach((widget) => {
        try {
            // Determinar el framework correcto
            const framework = pizarraState.selectedFramework.value === 'both' ? 'flutter' : pizarraState.selectedFramework.value;
            // Calcular la posición óptima para el widget
            const position = elementManagement.calculateOptimalPosition(widget.type || 'Container');
            // Corregido: addWidget solo acepta dos argumentos (type, position)
            const newElement = elementManagement.addWidget(widget.type || 'Container');

            // Si el nuevo elemento y las props existen, actualizar las props del elemento recién creado
            // Corregido: updateElementProperty solo acepta dos argumentos (property, value)
            if (newElement && widget.props) {
                elementManagement.updateElementProperty('props', widget.props);
            }

            // Corregido: acceder correctamente al id de la pantalla actual
            if (newElement && pizarraState.currentScreen?.value) {
                services.emitElementAdded(newElement, pizarraState.currentScreen.value.id);
            }
        } catch (error) {
            console.error('Error al agregar el widget al canvas:', error);
        }
    });

    savePizarra();
};

// Image processing
const processImage = async () => {
    const success = await services.processImage(addAIWidgetsToCanvas);
    if (success) {
        uiControls.toggleImageUpload();
    }
};

// Diagram processing
const processDiagram = async () => {
    const success = await services.processDiagram(
        pizarraState.selectedFramework.value,
        addAIWidgetsToCanvas
    );
    if (success) {
        uiControls.toggleDiagramUpload();
    }
};

// Code generation
const generateCode = () => {
    services.generateCode(props.pizarra, services.exportOptions.value);
};

const downloadCode = () => {
    services.downloadCode(pizarraState.projectName.value, pizarraState.selectedFramework.value);
};

const copyCode = async () => {
    await services.copyCode();
};

// Chat functionality
const handleChatMessage = async (message: string) => {
    console.log('Chat message:', message);
    // TODO: Implement chat functionality
};

const handleTyping = () => {
    console.log('User typing...');
    // TODO: Implement typing indicator
};
</script>

<template>
    <div>
        <Head :title="pizarraState.projectName.value" />

        <AppLayout :breadcrumbs="breadcrumbs">
            <!-- Header - Single Responsibility: UI Layout -->
            <template #header>
                <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg border-b-4 border-blue-500">
                    <div class="flex justify-between items-center p-4">
                        <!-- Left Section: Project Info -->
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <span class="material-icons text-white text-lg">dashboard</span>
                                </div>
                                <div>
                                    <h2 class="font-bold text-xl">{{ pizarraState.projectName }}</h2>
                                    <p class="text-blue-100 text-sm">Editor Unificado de Interfaces</p>
                                </div>
                            </div>
                        </div>

                        <!-- Center Section: Main Controls -->
                        <div class="flex items-center space-x-4">
                            <!-- Framework Selector -->
                            <div class="relative">
                                <select
                                    :value="pizarraState.selectedFramework.value"
                                    @change="switchFramework(($event.target as HTMLSelectElement).value as 'flutter' | 'angular' | 'both')"
                                    class="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-white/30"
                                >
                                    <option value="flutter" class="text-gray-800">🎯 Flutter</option>
                                    <option value="angular" class="text-gray-800">🅰️ Angular</option>
                                    <option value="both" class="text-gray-800">🔄 Ambos</option>
                                </select>
                                <span class="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none">
                                    expand_more
                                </span>
                            </div>

                            <!-- Screen Info & Status -->
                            <div class="flex items-center space-x-3">
                                <!-- Screen Info -->
                                <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span class="text-sm font-medium">{{ pizarraState.currentScreen.value.name }}</span>
                                    <span class="text-xs bg-white/20 px-2 py-1 rounded-full">
                                        {{ (pizarraState.currentScreen.value.elements?.length || 0) }} elementos
                                    </span>
                                </div>
                                
                                <!-- WebSocket Status -->
                                <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                                    <div :class="[services.socketConnected ? 'w-3 h-3 bg-green-400' : 'w-3 h-3 bg-red-400', 'rounded-full', 'animate-pulse', 'shadow-lg']"></div>
                                    <span class="text-sm font-medium">{{ services.socketConnected ? '🟢 Conectado' : '🔴 Desconectado' }}</span>
                                    <span class="text-xs bg-white/20 px-2 py-1 rounded-full">
                                        {{ services.currentUser }}
                                    </span>
                                </div>
                            </div>

                            <!-- Panel Controls -->
                            <div class="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                                <button @click="uiControls.toggleWidgetPalette"
                                    :class="[uiControls.showWidgetPalette ? 'bg-white/20' : 'hover:bg-white/10', 'p-2', 'rounded-md', 'transition-all', 'duration-200']"
                                    title="Paleta de Widgets">
                                    <span class="material-icons text-sm">widgets</span>
                                </button>
                                <button @click="uiControls.togglePropertiesPanel"
                                    :class="[uiControls.showPropertiesPanel ? 'bg-white/20' : 'hover:bg-white/10', 'p-2', 'rounded-md', 'transition-all', 'duration-200']"
                                    title="Panel de Propiedades">
                                    <span class="material-icons text-sm">tune</span>
                                </button>
                                <button @click="uiControls.togglePanelsCollapse"
                                    class="p-2 rounded-md hover:bg-white/10 transition-all duration-200" title="Colapsar Paneles">
                                    <span class="material-icons text-sm">
                                        {{ uiControls.isPanelsCollapsed ? 'unfold_more' : 'unfold_less' }}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <!-- Right Section: Actions -->
                        <div class="flex items-center space-x-3">
                            <!-- Screen Manager -->
                            <button @click="uiControls.showScreenManager.value = !uiControls.showScreenManager.value"
                                :class="[uiControls.showScreenManager.value ? 'bg-blue-500 shadow-lg' : 'hover:bg-white/10', 'flex', 'items-center', 'space-x-2', 'bg-white/10', 'backdrop-blur-sm', 'rounded-lg', 'px-3', 'py-2', 'transition-all', 'duration-200']"
                                title="Gestionar Pantallas">
                                <span class="material-icons text-sm">layers</span>
                                <span class="text-sm font-medium">{{ uiControls.showScreenManager.value ? 'Cerrar' : 'Pantallas' }}</span>
                                <span v-if="pizarraState.screens.value.length > 0" class="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{{ pizarraState.screens.value.length }}</span>
                            </button>

                            <!-- Quick Actions -->
                            <div class="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                                <button @click="uiControls.toggleFullscreen" class="p-2 rounded-md hover:bg-white/10 transition-all duration-200" title="Pantalla Completa">
                                    <span class="material-icons text-sm">fullscreen</span>
                                </button>
                                <button @click="savePizarra" class="p-2 rounded-md hover:bg-white/10 transition-all duration-200" title="Guardar">
                                    <span class="material-icons text-sm">save</span>
                                </button>
                                <button @click="uiControls.toggleAIChat" :class="[uiControls.showAIChat.value ? 'bg-green-500' : 'hover:bg-white/10', 'p-2', 'rounded-md', 'transition-all', 'duration-200']" title="Chat AI">
                                    <span class="material-icons text-sm">smart_toy</span>
                                </button>
                                <button @click="uiControls.toggleImageUpload" :class="[uiControls.showImageUpload.value ? 'bg-purple-500' : 'hover:bg-white/10', 'p-2', 'rounded-md', 'transition-all', 'duration-200']" title="Subir Imagen">
                                    <span class="material-icons text-sm">image</span>
                                </button>
                                <button @click="uiControls.toggleCodeViewer" :class="[uiControls.showCodeViewer.value ? 'bg-blue-500' : 'hover:bg-white/10', 'p-2', 'rounded-md', 'transition-all', 'duration-200']" title="Ver Código">
                                    <span class="material-icons text-sm">code</span>
                                </button>
                                <button @click="uiControls.toggleDiagramUpload" :class="[uiControls.showDiagramUpload.value ? 'bg-orange-500' : 'hover:bg-white/10', 'p-2', 'rounded-md', 'transition-all', 'duration-200']" title="Subir Diagrama">
                                    <span class="material-icons text-sm">account_tree</span>
                                </button>
                                <button @click="uiControls.toggleCollaborationChat" :class="[uiControls.showCollaborationChat.value ? 'bg-indigo-500' : 'hover:bg-white/10', 'p-2', 'rounded-md', 'transition-all', 'duration-200', 'relative']" title="Chat Colaborativo">
                                    <span class="material-icons text-sm">chat</span>
                                    <span v-if="services.unreadMessages.value > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{{ services.unreadMessages.value }}</span>
                                </button>
                            </div>

                            <!-- Dark Mode Toggle -->
                            <button @click="uiControls.toggleDarkMode"
                                class="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200" title="Modo Oscuro">
                                <svg v-if="uiControls.isDarkMode" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                        clip-rule="evenodd" />
                                </svg>
                                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Figma-like Main Dashboard -->
            <div class="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
                <!-- Main Workspace Container -->
                <div class="flex flex-1 overflow-hidden">
                    <!-- Left Sidebar - Widget Palette -->
                    <div v-if="uiControls.showWidgetPalette && !uiControls.isPanelsCollapsed"
                        class="w-64 sidebar transition-all duration-300 transform flex-shrink-0">
                        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center space-x-2">
                                <span class="material-icons text-blue-500">widgets</span>
                                <h3 class="font-semibold text-gray-800 dark:text-gray-200">Componentes</h3>
                            </div>
                        </div>
                        <div class="p-4 overflow-y-auto h-full">
                            <UnifiedWidgetPalette 
                                :available-widgets="elementManagement.availableWidgets.value"
                                :selected-framework="pizarraState.selectedFramework.value" 
                                @add-widget="addWidget"
                                @drag-start="(widgetType) => console.log('Drag start:', widgetType)"
                                @drag-end="() => console.log('Drag end')" />
                        </div>
                    </div>

                    <!-- Center Canvas Area - Main Focus -->
                    <div class="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0">
                        <!-- Canvas Header -->
                        <div class="header-bar px-4 py-2 flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <div class="flex items-center space-x-2">
                                        <span class="material-icons text-green-500">design_services</span>
                                        <span class="font-medium text-gray-700 dark:text-gray-300">
                                            {{ pizarraState.currentScreen.value?.name }}
                                        </span>
                                        <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                            {{ (pizarraState.currentScreen.value?.elements?.length || 0) }} elementos
                                        </span>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                        {{ pizarraState.selectedFramework.value ? pizarraState.selectedFramework.value.toUpperCase() : '' }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Canvas Content - Full Screen -->
                        <div class="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
                            <!-- Canvas Grid Background -->
                            <div class="absolute inset-0 bg-grid-pattern opacity-20"></div>
                            
                            <!-- Canvas Container -->
                            <div class="absolute inset-0 flex items-center justify-center p-8">
                                <div class="canvas-container w-full h-full max-w-6xl max-h-full overflow-hidden">
                                    <UnifiedCanvas 
                                        :current-screen="pizarraState.currentScreen.value"
                                        :available-widgets="elementManagement.availableWidgets.value"
                                        :selected-framework="pizarraState.selectedFramework.value" 
                                        @select-element="selectElement"
                                        @remove-element="removeElement" 
                                        @add-element="addWidget"
                                        @drop="(widgetType) => addWidget(widgetType)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Sidebar - Properties Panel -->
                    <div v-if="(uiControls.showPropertiesPanel && !uiControls.isPanelsCollapsed) || elementManagement.selectedElement"
                        class="w-80 sidebar border-l transition-all duration-300 transform flex-shrink-0">
                        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <span class="material-icons text-purple-500">tune</span>
                                    <h3 class="font-semibold text-gray-800 dark:text-gray-200">Propiedades</h3>
                                </div>
                                <button @click="uiControls.showPropertiesPanel.value = false"
                                    class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <span class="material-icons text-gray-500 text-sm">close</span>
                                </button>
                            </div>
                        </div>
                        <div class="p-4 overflow-y-auto h-full">
                            <PizarraPropertiesPanel
                                :selected-element="elementManagement.selectedElement.value"
                                @update-element="handleElementUpdate"
                                @delete-element="removeElement"
                                @duplicate-element="duplicateElement"
                                @close="() => { uiControls.showPropertiesPanel.value = false }"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Screen Manager Modal -->
            <div v-if="uiControls.showScreenManager"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="material-icons text-blue-500 text-2xl">layers</span>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Gestión de Pantallas</h3>
                            </div>
                            <button @click="uiControls.showScreenManager.value = false"
                                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <span class="material-icons text-gray-500">close</span>
                            </button>
                        </div>
                    </div>

                    <div class="p-6 overflow-y-auto max-h-[60vh]">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="(screen, index) in pizarraState.screens.value" :key="screen.id"
                                class="group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg"
                                :class="{
                                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg': pizarraState.currentScreenIndex.value === index,
                                    'border-gray-200 dark:border-gray-700 hover:border-blue-300': pizarraState.currentScreenIndex.value !== index
                                }" @click="selectScreen(index)">

                                <div class="flex items-center justify-between mb-3">
                                    <h4 class="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                        {{ screen.name }}
                                    </h4>
                                    <div class="flex items-center space-x-1">
                                        <button v-if="!screen.isHome" @click.stop="setHomeScreen(index)"
                                            class="px-2 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors">
                                            <span class="material-icons text-xs">home</span>
                                        </button>
                                        <button v-if="pizarraState.screens.value.length > 1" @click.stop="deleteScreen(index)"
                                            class="px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                                            <span class="material-icons text-xs">delete</span>
                                        </button>
                                    </div>
                                </div>

                                <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    {{ screen.elements.length }} elementos
                                </div>

                                <div class="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span class="material-icons text-gray-400 text-2xl">preview</span>
                                </div>

                                <!-- Home indicator -->
                                <div v-if="screen.isHome"
                                    class="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                                    <span class="material-icons text-xs">home</span>
                                </div>
                            </div>

                            <!-- Add Screen Card -->
                            <div class="group p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]"
                                @click="addScreen('Nueva Pantalla ' + (pizarraState.screens.value.length + 1))">
                                <span class="material-icons text-4xl text-gray-400 group-hover:text-blue-500 transition-colors mb-2">add_circle_outline</span>
                                <span class="text-gray-500 group-hover:text-blue-600 font-medium">Añadir Pantalla</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Feature Panels - Single Responsibility: Each panel has one purpose -->
            
            <!-- Code Viewer Modal -->
            <div v-if="uiControls.showCodeViewer"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="material-icons text-blue-500 text-2xl">code</span>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">
                                    Código Generado ({{ pizarraState.selectedFramework.value.toUpperCase() }})
                                </h3>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button @click="copyCode"
                                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
                                    <span class="material-icons text-sm">content_copy</span>
                                    <span>Copiar</span>
                                </button>
                                <button @click="downloadCode"
                                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
                                    <span class="material-icons text-sm">download</span>
                                    <span>Descargar</span>
                                </button>
                                <button @click="uiControls.toggleCodeViewer"
                                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <span class="material-icons text-gray-500">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[70vh]">
                        <pre class="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm font-mono border">{{
                            services.generatedCode.value || 'Generando código...' }}</pre>
                    </div>
                </div>
            </div>

            <!-- Image Upload Modal -->
            <div v-if="uiControls.showImageUpload"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="material-icons text-purple-500 text-2xl">image</span>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Subir Imagen</h3>
                            </div>
                            <button @click="uiControls.toggleImageUpload"
                                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <span class="material-icons text-gray-500">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                            <input type="file" @change="services.handleImageUpload" accept="image/*" class="hidden" id="imageInput" />
                            <label for="imageInput" class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">cloud_upload</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona una imagen</p>
                                    <p class="text-sm text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                </div>
                            </label>
                        </div>

                        <div v-if="services.previewImage && services.previewImage.value" class="mt-6">
                            <div class="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                                <img :src="services.previewImage.value ?? ''" alt="Vista previa" class="max-w-full h-auto rounded-lg mx-auto" />
                            </div>
                            <div class="mt-4 flex justify-center space-x-3">
                                <button @click="processImage" :disabled="services.isProcessingImage.value"
                                    class="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2">
                                    <span class="material-icons text-sm" :class="{ 'animate-spin': services.isProcessingImage.value }">
                                        {{ services.isProcessingImage.value ? 'refresh' : 'auto_awesome' }}
                                    </span>
                                    <span>{{ services.isProcessingImage.value ? 'Procesando...' : 'Procesar Imagen' }}</span>
                                </button>
                                <button @click="services.clearSelectedImage"
                                    class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
                                    <span class="material-icons text-sm">clear</span>
                                    <span>Limpiar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Diagram Upload Modal -->
            <div v-if="uiControls.showDiagramUpload"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="material-icons text-orange-500 text-2xl">account_tree</span>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Subir Diagrama de Clases</h3>
                            </div>
                            <button @click="uiControls.toggleDiagramUpload"
                                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <span class="material-icons text-gray-500">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[70vh]">
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Tipo de diagrama:
                            </label>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button v-for="type in [
                                    { value: 'image' as const, label: 'Imagen', icon: 'image' },
                                    { value: 'xml' as const, label: 'XML', icon: 'code' },
                                    { value: 'plantuml' as const, label: 'PlantUML', icon: 'schema' },
                                    { value: 'text' as const, label: 'Texto', icon: 'text_fields' }
                                ]" :key="type.value" @click="services.diagramType.value = type.value"
                                    :class="services.diagramType.value === type.value ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                                    class="p-3 rounded-lg transition-colors flex flex-col items-center space-y-1">
                                    <span class="material-icons text-sm">{{ type.icon }}</span>
                                    <span class="text-xs font-medium">{{ type.label }}</span>
                                </button>
                            </div>
                        </div>

                        <div v-if="services.diagramType.value === 'image'"
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                            <input type="file" @change="services.handleDiagramFileUpload" accept="image/*" class="hidden" id="diagramImageInput" />
                            <label for="diagramImageInput" class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">image</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona imagen del diagrama</p>
                                    <p class="text-sm text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                </div>
                            </label>
                        </div>

                        <div v-else-if="services.diagramType.value === 'xml'"
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                            <input type="file" @change="services.handleDiagramFileUpload" accept=".xml" class="hidden" id="diagramXmlInput" />
                            <label for="diagramXmlInput" class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">code</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona archivo XML</p>
                                    <p class="text-sm text-gray-500">Archivos .xml</p>
                                </div>
                            </label>
                        </div>

                        <div v-else-if="services.diagramType.value === 'plantuml'"
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                            <input type="file" @change="services.handleDiagramFileUpload" accept=".puml,.plantuml" class="hidden" id="diagramPlantUmlInput" />
                            <label for="diagramPlantUmlInput" class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">schema</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona archivo PlantUML</p>
                                    <p class="text-sm text-gray-500">Archivos .puml, .plantuml</p>
                                </div>
                            </label>
                        </div>

                        <div v-else class="space-y-4">
                            <textarea v-model="services.diagramContent.value" placeholder="Pega aquí el contenido del diagrama..."
                                rows="8"
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"></textarea>
                        </div>

                        <div class="mt-6 flex justify-center space-x-3">
                            <button @click="processDiagram"
                                :disabled="services.isProcessingDiagram.value || (!services.selectedDiagramFile.value && !services.diagramContent.value)"
                                class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2">
                                <span class="material-icons text-sm" :class="{ 'animate-spin': services.isProcessingDiagram.value }">
                                    {{ services.isProcessingDiagram.value ? 'refresh' : 'auto_awesome' }}
                                </span>
                                <span>{{ services.isProcessingDiagram.value || !services.selectedDiagramFile.value && !services.diagramContent.value ? 'Procesando...' : 'Procesar Diagrama' }}</span>
                            </button>
                            <button @click="services.clearDiagramData"
                                class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
                                <span class="material-icons text-sm">clear</span>
                                <span>Limpiar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Action Buttons -->
            <div class="fixed bottom-6 right-6 flex flex-col space-y-3 z-40">
                <!-- AI Chat Button -->
                <div class="group relative">
                    <button @click="uiControls.toggleAIChat"
                        :class="uiControls.showAIChat.value ? 'bg-green-600 scale-110' : 'bg-green-500 hover:bg-green-600'"
                        class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm btn-enhanced">
                        <span class="material-icons text-xl">smart_toy</span>
                    </button>
                    <div class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Chat AI
                        <div class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                </div>

                <!-- Image Upload Button -->
                <div class="group relative">
                    <button @click="uiControls.toggleImageUpload"
                        :class="uiControls.showImageUpload.value ? 'bg-purple-600 scale-110' : 'bg-purple-500 hover:bg-purple-600'"
                        class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm btn-enhanced">
                        <span class="material-icons text-xl">image</span>
                    </button>
                    <div class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Subir Imagen
                        <div class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                </div>

                <!-- Diagram Upload Button -->
                <div class="group relative">
                    <button @click="uiControls.toggleDiagramUpload"
                        :class="uiControls.showDiagramUpload.value ? 'bg-orange-600 scale-110' : 'bg-orange-500 hover:bg-orange-600'"
                        class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm btn-enhanced">
                        <span class="material-icons text-xl">account_tree</span>
                    </button>
                    <div class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Subir Diagrama
                        <div class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                </div>

                <!-- Code Viewer Button -->
                <div class="group relative">
                    <button @click="uiControls.toggleCodeViewer"
                        :class="uiControls.showCodeViewer.value ? 'bg-blue-600 scale-110' : 'bg-blue-500 hover:bg-blue-600'"
                        class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm btn-enhanced">
                        <span class="material-icons text-xl">code</span>
                    </button>
                    <div class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Ver Código
                        <div class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                </div>

                <!-- Collaboration Chat Button -->
                <div class="group relative">
                    <button @click="uiControls.toggleCollaborationChat"
                        :class="uiControls.showCollaborationChat ? 'bg-indigo-600 scale-110' : 'bg-indigo-500 hover:bg-indigo-600'"
                        class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm btn-enhanced relative">
                        <span class="material-icons text-xl">chat</span>
                        <span v-if="services.unreadMessages.value > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">{{ services.unreadMessages.value }}</span>
                    </button>
                    <div class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Chat Colaborativo
                        <div class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                </div>

                <!-- Save Button -->
                <div class="group relative">
                    <button @click="savePizarra"
                        class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm bg-emerald-500 hover:bg-emerald-600 btn-enhanced">
                        <span class="material-icons text-xl">save</span>
                    </button>
                    <div class="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Guardar Pizarra
                        <div class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                </div>
            </div>
            <!-- AI Chat -->
            <ChatAI v-if="uiControls.showAIChat" 
                :showAIChat="uiControls.showAIChat.value" 
                :aiMessages="services.aiMessages.value" 
                :aiPrompt="services.aiPrompt.value"
                :isProcessingAI="services.isProcessingAI.value" 
                @toggleAIChat="uiControls.toggleAIChat" 
                @sendAIPrompt="sendAIPrompt"
                @update:aiPrompt="services.aiPrompt.value = $event" 
                @update:isProcessingAI="services.isProcessingAI.value = $event"
                @addAIWidgetsToCanvas="addAIWidgetsToCanvas" 
                @onAIPromptInput="() => console.log('AI prompt input changed')" />

                         <!-- Chat Colaborativo -->
             <ChatColaborativo 
                 v-if="uiControls.showCollaborationChat.value"
                 :socket="null as any"
                 :room-id="props.pizarra?.room_id as any"
                 :current-user="services.currentUser?.value"
                 :show-chat="uiControls.showCollaborationChat.value"
                 @send-message="handleChatMessage"
                 @typing="handleTyping" 
                 @close="uiControls.toggleCollaborationChat" 
             />
        </AppLayout>
    </div>
</template>

<style scoped>
/* Enhanced Dashboard Styles */
.dashboard-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.panel-glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .panel-glass {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
    background: #374151;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #6b7280;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Floating Action Button Effects */
.fab-bounce {
    animation: fab-bounce 2s infinite ease-in-out;
}

@keyframes fab-bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-5px);
    }
    60% {
        transform: translateY(-3px);
    }
}

/* Enhanced button hover effects */
.btn-enhanced {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.btn-enhanced::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.btn-enhanced:hover::before {
    left: 100%;
}

/* Notification badge */
.notification-badge {
    position: relative;
}

.notification-badge::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid white;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* Figma-like Grid Pattern */
.bg-grid-pattern {
    background-image: 
        linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
}

.dark .bg-grid-pattern {
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
}

/* Canvas Container Styles */
.canvas-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}

.dark .canvas-container {
    background: #1f2937;
    border: 1px solid #374151;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

/* Sidebar Styles */
.sidebar {
    background: white;
    border-right: 1px solid #e5e7eb;
    transition: all 0.3s ease;
}

.dark .sidebar {
    background: #1f2937;
    border-right: 1px solid #374151;
}

/* Header Styles */
.header-bar {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    backdrop-filter: blur(10px);
}

.dark .header-bar {
    background: #1f2937;
    border-bottom: 1px solid #374151;
}

/* Floating Action Buttons */
.fab-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 1000;
}

.fab-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.fab-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Responsive Design */
@media (max-width: 1024px) {
    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }
    
    .sidebar.open {
        transform: translateX(0);
    }
}

/* Smooth Transitions */
.transition-smooth {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus States */
.focus-ring:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

/* Loading States */
.loading-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}
</style> 