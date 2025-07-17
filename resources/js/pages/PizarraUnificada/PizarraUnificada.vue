<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { getSocketConfig } from '@/lib/socketConfig';
import type { BreadcrumbItem } from '@/types';
import type { PizarraUnificada, UnifiedScreen, CodeExportOptions, User, UnifiedElement } from '@/Data/PizarraUnificada';
import { UnifiedCollaborationService } from '@/services/UnifiedCollaborationService';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';
import { UnifiedCodeGenerationService } from '@/services/UnifiedCodeGenerationService';
import { DiagramProcessingService } from '@/services/DiagramProcessingService';
import { AIService } from '@/services/AIService';
import { ImageProcessingService } from '@/services/ImageProcessingService';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import ChatAI from '@/pages/Chat/ChatAI.vue';
import UnifiedWidgetPalette from './UnifiedWidgetPalette.vue';
import UnifiedPropertiesPanel from './UnifiedPropertiesPanel.vue';
import UnifiedCanvas from './UnifiedCanvas.vue';
import './PizarraUnificada.css';

// Props
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

// Early guard to prevent errors if pizarra is not provided
if (!props.pizarra || !props.pizarra.id) {
    console.error('Pizarra data is required');
    router.visit('/pizarra-unificada');
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pizarra Unificada',
        href: props.pizarra ? `/pizarra-unificada/${props.pizarra.id}/edit` : '/pizarra-unificada',
    },
];

// Socket configuration
const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
const socketConfig = ref(getSocketConfig(useLocalSocket.value));
const roomId = ref<string | null>(props.pizarra?.room_id || null);
const currentUser = ref(props.user?.name || 'Usuario');
const socketConnected = ref<boolean>(false);
// const socketError = ref<string>('');

// Initialize collaboration service
let collaborationService: UnifiedCollaborationService;

// Project state
const projectName = ref<string>(props.pizarra?.name || 'Proyecto Unificado');
const projectType = ref<'flutter' | 'angular' | 'both'>(props.pizarra?.type || 'both');
const selectedFramework = ref<'flutter' | 'angular' | 'both'>(projectType.value);
const exportOptions = ref<CodeExportOptions>({
    framework: selectedFramework.value,
    format: 'preview',
    includeTests: false,
    includeDocumentation: false,
    version: 'latest',
    theme: 'default'
});

// Screens management
const screens = ref<UnifiedScreen[]>(props.pizarra?.screens || []);
const currentScreenIndex = ref<number>(0);
// const showScreenManager = ref<boolean>(false);

// Current screen
const currentScreen = computed(() => {
    if (screens.value.length === 0) {
        initializeScreens();
    }
    return screens.value[currentScreenIndex.value] || screens.value[0] || { elements: [] };
});

// Elements management
const availableWidgets = ref<any[]>([]);
/* const selectedElement = ref<UnifiedElement | null>(null);
const showWidgetPalette = ref<boolean>(true);
const showPropertiesPanel = ref<boolean>(true);
 */
// AI Chat
const showAIChat = ref<boolean>(false);
const aiMessages = ref<any[]>([]);
const aiPrompt = ref<string>('');
const isProcessingAI = ref<boolean>(false);

// Collaboration Chat
const showCollaborationChat = ref<boolean>(false);
const unreadMessages = ref<number>(0);
// const autoOpenChat = ref<boolean>(true);

// Image processing
const showImageUpload = ref<boolean>(false);
const selectedImage = ref<File | null>(null);
const previewImage = ref<string | null>(null);
const isProcessingImage = ref<boolean>(false);

// Diagram processing
const showDiagramUpload = ref<boolean>(false);
const selectedDiagramFile = ref<File | null>(null);
const diagramContent = ref<string>('');
const diagramType = ref<'image' | 'xml' | 'plantuml' | 'text'>('image');
const isProcessingDiagram = ref<boolean>(false);

// Code generation
const showCodeViewer = ref<boolean>(false);
const generatedCode = ref<string>('');
/* const selectedCodeTab = ref<number>(0);
const improvedCode = ref<string>(''); */

// Dark mode
const isDarkMode = ref<boolean>(localStorage.getItem('darkMode') === 'true');

// Initialize component
onMounted(() => {
    initializeCollaboration();
    initializeScreens();
    updateAvailableWidgets();
    applyDarkMode();
});

onUnmounted(() => {
    if (collaborationService) {
        collaborationService.disconnect();
    }
});

// Watch for framework changes
watch(selectedFramework, (newFramework) => {
    updateAvailableWidgets();
    exportOptions.value.framework = newFramework;

    // Emit framework change to collaborators
    if (collaborationService) {
        collaborationService.emitFrameworkSwitched(newFramework);
    }
});

// Initialize collaboration
const initializeCollaboration = () => {
    if (roomId.value) {
        collaborationService = new UnifiedCollaborationService(
            socketConfig.value,
            roomId.value,
            currentUser.value
        );
        collaborationService.connect();
        socketConnected.value = true;
    }
};

// Initialize screens
const initializeScreens = () => {
    if (screens.value.length === 0) {
        const defaultScreen: UnifiedScreen = {
            id: `screen-${Date.now()}`,
            name: 'Pantalla Principal',
            elements: [],
            isHome: true,
            isDrawer: false,
            framework: selectedFramework.value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        screens.value.push(defaultScreen);
    }
};

// Update available widgets based on framework
const updateAvailableWidgets = () => {
    availableWidgets.value = UnifiedWidgetService.getAvailableWidgets(selectedFramework.value);
};

// Apply dark mode
const applyDarkMode = () => {
    if (isDarkMode.value) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

// Toggle dark mode
const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value.toString());
    applyDarkMode();
};

const switchFramework = (framework: 'flutter' | 'angular' | 'both') => {
    selectedFramework.value = framework;
    // Update local project type instead of mutating prop directly
    projectType.value = framework;
    savePizarra();
};

// Widget management
const selectedElement = ref<UnifiedElement | null>(null);
const showWidgetPalette = ref<boolean>(true);
const showPropertiesPanel = ref<boolean>(true);
const showScreenManager = ref<boolean>(false);

// UI State management for improved UX
const isPanelsCollapsed = ref<boolean>(false);
const isFullscreen = ref<boolean>(false);

// Panel visibility toggles
const toggleWidgetPalette = () => {
    showWidgetPalette.value = !showWidgetPalette.value;
};

const togglePropertiesPanel = () => {
    showPropertiesPanel.value = !showPropertiesPanel.value;
};

const togglePanelsCollapse = () => {
    isPanelsCollapsed.value = !isPanelsCollapsed.value;
    if (isPanelsCollapsed.value) {
        showWidgetPalette.value = false;
        showPropertiesPanel.value = false;
    } else {
        showWidgetPalette.value = true;
        showPropertiesPanel.value = true;
    }
};

const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value;
    if (isFullscreen.value) {
        document.documentElement.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
};

const addWidget = (widgetType: string) => {
    const framework = selectedFramework.value === 'both' ? 'flutter' : selectedFramework.value;
    const position = { x: 100, y: 100 }; // Posición por defecto
    const newElement = UnifiedWidgetService.createElement(
        widgetType,
        framework,
        position
    );

    if (newElement && currentScreen.value) {
        currentScreen.value.elements.push(newElement);

        // Emit to collaborators
        if (collaborationService) {
            collaborationService.emitElementAdded(newElement, currentScreen.value.id);
        }

        savePizarra();
    }
};

const selectElement = (element: UnifiedElement) => {
    selectedElement.value = element;

    // Emit to collaborators
    if (collaborationService) {
        collaborationService.emitElementSelected(element, currentScreen.value?.id);
    }
};

const updateElementProperty = (propertyName: string, value: any) => {
    if (!selectedElement.value) return;

    const updatedElement = UnifiedWidgetService.updateElementProperties(
        selectedElement.value,
        { [propertyName]: value }
    );

    // Update the selected element
    selectedElement.value = updatedElement;

    // Update in screen elements
    if (currentScreen.value) {
        const index = currentScreen.value.elements.findIndex(e => e.id === updatedElement.id);
        if (index !== -1) {
            currentScreen.value.elements[index] = updatedElement;
        }
    }

    // Emit to collaborators
    if (collaborationService) {
        collaborationService.emitElementUpdated(updatedElement, currentScreen.value?.id);
    }

    savePizarra();
};

const removeElement = (element: UnifiedElement) => {
    if (!currentScreen.value) return;

    const index = currentScreen.value.elements.findIndex(e => e.id === element.id);
    if (index !== -1) {
        currentScreen.value.elements.splice(index, 1);

        // Emit to collaborators
        if (collaborationService && currentScreen.value.id) {
            collaborationService.emitElementDeleted(element.id || '', currentScreen.value.id);
        }

        if (selectedElement.value?.id === element.id) {
            selectedElement.value = null;
        }

        savePizarra();
    }
};

// Screen management
const addScreen = (screenName: string) => {
    const newScreen: UnifiedScreen = {
        id: `screen-${Date.now()}`,
        name: screenName,
        elements: [],
        isHome: false,
        isDrawer: false,
        framework: selectedFramework.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    screens.value.push(newScreen);
    currentScreenIndex.value = screens.value.length - 1;
    showScreenManager.value = false;

    savePizarra();
};

const deleteScreen = async (index: number) => {
    if (screens.value.length <= 1) {
        await AlertService.prototype.error('Error', 'No puedes eliminar la única pantalla');
        return;
    }

    const result = await AlertService.prototype.confirm(
        '¿Estás seguro?',
        'Esta acción no se puede deshacer'
    );

    if (result.isConfirmed) {
        screens.value.splice(index, 1);
        if (currentScreenIndex.value >= screens.value.length) {
            currentScreenIndex.value = screens.value.length - 1;
        }
        savePizarra();
    }
};

const selectScreen = (index: number) => {
    currentScreenIndex.value = index;
    selectedElement.value = null;
};

const setHomeScreen = (index: number) => {
    screens.value.forEach((screen, i) => {
        screen.isHome = i === index;
    });
    savePizarra();
};

// AI functionality
const toggleAIChat = () => {
    showAIChat.value = !showAIChat.value;
    if (showAIChat.value) {
        showCollaborationChat.value = false;
    }
};

const sendAIPrompt = async () => {
    if (!aiPrompt.value.trim() || isProcessingAI.value) return;

    aiMessages.value.push({
        text: aiPrompt.value,
        isUser: true,
        timestamp: Date.now(),
    });

    const prompt = aiPrompt.value;
    aiPrompt.value = '';
    isProcessingAI.value = true;

    try {
        const result = await AIService.sendAIPrompt(
            prompt,
            aiMessages.value,
            isProcessingAI.value,
            (code: string) => parseAICode(code)
        );

        aiMessages.value = result.aiMessages;
        isProcessingAI.value = result.isProcessingAI;
    } catch (error: any) {
        console.error('Error AI:', error);
        aiMessages.value.push({
            text: `Error: ${error.message || 'Error interno del servidor'}`,
            isUser: false,
            timestamp: Date.now(),
        });
        isProcessingAI.value = false;
    }
};

const parseAICode = (code: string) => {
    // Parse AI-generated code and create elements
    console.log('Parsing AI code:', code);
    // TODO: Implement code parsing logic
};

// Image processing
const toggleImageUpload = () => {
    showImageUpload.value = !showImageUpload.value;
    if (!showImageUpload.value) {
        clearSelectedImage();
    }
};

const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        selectedImage.value = input.files[0];

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.value = e.target?.result as string;
        };
        reader.readAsDataURL(selectedImage.value);
    }
};

const clearSelectedImage = () => {
    selectedImage.value = null;
    previewImage.value = null;
};

const processImage = async () => {
    if (!selectedImage.value) return;

    try {
        isProcessingImage.value = true;
        const result = await ImageProcessingService.processImage(
            selectedImage.value,
            Date.now(),
            (widgets: any[]) => addProcessedWidgets(widgets)
        );

        if (result.success) {
            await AlertService.prototype.success('Éxito', 'Imagen procesada correctamente');
            toggleImageUpload();
        }
    } catch (error: any) {
        console.error('Error processing image:', error);
        await AlertService.prototype.error('Error', error.message || 'Error al procesar la imagen');
    } finally {
        isProcessingImage.value = false;
    }
};

// Diagram processing
const toggleDiagramUpload = () => {
    showDiagramUpload.value = !showDiagramUpload.value;
    if (!showDiagramUpload.value) {
        clearDiagramData();
    }
};

const handleDiagramFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        selectedDiagramFile.value = input.files[0];

        if (selectedDiagramFile.value.type.includes('image')) {
            diagramType.value = 'image';
        } else if (selectedDiagramFile.value.name.endsWith('.xml')) {
            diagramType.value = 'xml';
            // Read XML content
            const reader = new FileReader();
            reader.onload = (e) => {
                diagramContent.value = e.target?.result as string;
            };
            reader.readAsText(selectedDiagramFile.value);
        } else if (selectedDiagramFile.value.name.endsWith('.puml') || selectedDiagramFile.value.name.endsWith('.plantuml')) {
            diagramType.value = 'plantuml';
            // Read PlantUML content
            const reader = new FileReader();
            reader.onload = (e) => {
                diagramContent.value = e.target?.result as string;
            };
            reader.readAsText(selectedDiagramFile.value);
        }
    }
};

const clearDiagramData = () => {
    selectedDiagramFile.value = null;
    diagramContent.value = '';
    diagramType.value = 'image';
};

const processDiagram = async () => {
    if (!selectedDiagramFile.value && !diagramContent.value) return;

    try {
        isProcessingDiagram.value = true;
        let result;

        if (diagramType.value === 'image' && selectedDiagramFile.value) {
            result = await DiagramProcessingService.processImageDiagram(
                selectedDiagramFile.value,
                Date.now()
            );
        } else if (diagramType.value === 'xml' && diagramContent.value) {
            result = await DiagramProcessingService.processXMLDiagram(diagramContent.value);
        } else if (diagramType.value === 'plantuml' && diagramContent.value) {
            result = await DiagramProcessingService.processPlantUMLDiagram(diagramContent.value);
        }

        if (result?.success && result.data) {
            const elements = DiagramProcessingService.convertDiagramToUnifiedElements(
                result.data.elements,
                selectedFramework.value,
                Date.now()
            );

            addProcessedWidgets(elements);
            await AlertService.prototype.success('Éxito', 'Diagrama procesado correctamente');
            toggleDiagramUpload();
        }
    } catch (error: any) {
        console.error('Error processing diagram:', error);
        await AlertService.prototype.error('Error', error.message || 'Error al procesar el diagrama');
    } finally {
        isProcessingDiagram.value = false;
    }
};

// Code generation
const toggleCodeViewer = () => {
    showCodeViewer.value = !showCodeViewer.value;
    if (showCodeViewer.value) {
        generateCode();
    }
};

const generateCode = () => {
    generatedCode.value = UnifiedCodeGenerationService.generateCode(
        props.pizarra,
        exportOptions.value
    );
};

const downloadCode = () => {
    if (!generatedCode.value) {
        generateCode();
    }

    const element = document.createElement('a');
    const file = new Blob([generatedCode.value], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${projectName.value}-${selectedFramework.value}-code.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

const copyCode = async () => {
    if (!generatedCode.value) {
        generateCode();
    }

    try {
        await navigator.clipboard.writeText(generatedCode.value);
        await AlertService.prototype.success('Éxito', 'Código copiado al portapapeles');
    } catch (error) {
        console.error('Error copying code:', error);
        await AlertService.prototype.error('Error', 'No se pudo copiar el código');
    }
};

// Collaboration chat
const toggleCollaborationChat = () => {
    showCollaborationChat.value = !showCollaborationChat.value;
    if (showCollaborationChat.value) {
        showAIChat.value = false;
        unreadMessages.value = 0;
    }
};

const handleChatMessage = async (message: string) => {
    // Handle collaboration chat message
    console.log('Chat message:', message);
    // TODO: Implement chat functionality
};

const handleTyping = () => {
    // Handle typing indicator
    console.log('User typing...');
    // TODO: Implement typing indicator
};

// Utility functions
const addProcessedWidgets = (widgets: any[]) => {
    if (!currentScreen.value) return;

    widgets.forEach(widget => {
        // Create a unified element from the widget data
        const framework = selectedFramework.value === 'both' ? 'flutter' : selectedFramework.value;
        const position = { x: Math.random() * 100, y: Math.random() * 100 };

        try {
            const element = UnifiedWidgetService.createElement(
                widget.type || 'Container',
                framework,
                position
            );

            // Update element properties with widget data
            if (widget.props) {
                const updatedElement = UnifiedWidgetService.updateElementProperties(
                    element,
                    widget.props
                );
                currentScreen.value.elements.push(updatedElement);
            } else {
                currentScreen.value.elements.push(element);
            }

            // Emit to collaborators
            if (collaborationService) {
                collaborationService.emitElementAdded(element, currentScreen.value.id);
            }
        } catch (error) {
            console.error('Error creating element from widget:', error);
        }
    });

    savePizarra();
};
const savePizarra = async () => {
    try {
        await axios.put(`/pizarra-unificada/${props.pizarra.id}`, {
            name: projectName.value,
            type: projectType.value,
            screens: screens.value,
            elements: currentScreen.value?.elements || []
        });
    } catch (error) {
        console.error('Error saving pizarra:', error);
    }
};

/* const toggleSocketServer = () => {
    if (collaborationService) {
        collaborationService.disconnect();
    }

    useLocalSocket.value = !useLocalSocket.value;
    socketConfig.value = toggleSocketEnvironment(useLocalSocket.value);

    initializeCollaboration();

    AlertService.prototype.info(
        `Servidor socket cambiado a ${useLocalSocket.value ? 'local' : 'producción'}: ${socketConfig.value.url}`
    );
}; */
</script>

<template>
    <div>

        <Head :title="projectName" />

        <AppLayout :breadcrumbs="breadcrumbs">
            <!-- Enhanced Header -->
            <template #header>
                <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
                    <div class="flex justify-between items-center p-4">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <span class="material-icons text-white text-lg">dashboard</span>
                                </div>
                                <div>
                                    <h2 class="font-bold text-xl">{{ projectName }}</h2>
                                    <p class="text-blue-100 text-sm">Editor Unificado de Interfaces</p>
                                </div>
                            </div>
                        </div>

                        <!-- Enhanced Toolbar -->
                        <div class="flex items-center space-x-3">
                            <!-- Framework Selector with improved styling -->
                            <div class="relative">
                                <select v-model="selectedFramework" @change="switchFramework(selectedFramework)"
                                    class="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-white/30">
                                    <option value="flutter" class="text-gray-800">🎯 Flutter</option>
                                    <option value="angular" class="text-gray-800">🅰️ Angular</option>
                                    <option value="both" class="text-gray-800">🔄 Ambos</option>
                                </select>
                                <span
                                    class="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-white pointer-events-none">
                                    expand_more
                                </span>
                            </div>

                            <!-- Panel Controls -->
                            <div class="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                                <button @click="toggleWidgetPalette"
                                    :class="showWidgetPalette ? 'bg-white/20' : 'hover:bg-white/10'"
                                    class="p-2 rounded-md transition-all duration-200 group">
                                    <span class="material-icons text-sm">widgets</span>
                                </button>
                                <button @click="togglePropertiesPanel"
                                    :class="showPropertiesPanel ? 'bg-white/20' : 'hover:bg-white/10'"
                                    class="p-2 rounded-md transition-all duration-200 group">
                                    <span class="material-icons text-sm">tune</span>
                                </button>
                                <button @click="togglePanelsCollapse"
                                    class="p-2 rounded-md hover:bg-white/10 transition-all duration-200">
                                    <span class="material-icons text-sm">
                                        {{ isPanelsCollapsed ? 'unfold_more' : 'unfold_less' }}
                                    </span>
                                </button>
                            </div>

                            <!-- Quick Actions -->
                            <div class="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                                <button @click="toggleFullscreen"
                                    class="p-2 rounded-md hover:bg-white/10 transition-all duration-200">
                                    <span class="material-icons text-sm">fullscreen</span>
                                </button>
                                <button @click="savePizarra"
                                    class="p-2 rounded-md hover:bg-white/10 transition-all duration-200">
                                    <span class="material-icons text-sm">save</span>
                                </button>
                            </div>

                            <!-- Dark Mode Toggle with enhanced styling -->
                            <button @click="toggleDarkMode"
                                class="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200">
                                <svg v-if="isDarkMode" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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

            <!-- Enhanced Main Dashboard -->
            <div
                class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
                <div class="mx-auto p-4">
                    <!-- Main Workspace Container -->
                    <div
                        class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">

                        <!-- Status Bar -->
                        <div
                            class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-3">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center space-x-4">
                                    <div class="flex items-center space-x-2">
                                        <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {{ currentScreen?.name }}
                                        </span>
                                        <span
                                            class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                            {{ currentScreen?.elements?.length || 0 }} elementos
                                        </span>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <!-- Screen Manager Button -->
                                    <button @click="showScreenManager = !showScreenManager"
                                        :class="showScreenManager ? 'bg-blue-500 text-white' : 'bg-white/50 text-gray-700 hover:bg-white/70'"
                                        class="px-4 py-2 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-600 backdrop-blur-sm flex items-center space-x-2">
                                        <span class="material-icons text-sm">layers</span>
                                        <span class="font-medium">Gestionar Pantallas</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Enhanced Main Workspace -->
                        <div class="p-6">
                            <div class="flex gap-6" :class="{ 'justify-center': isPanelsCollapsed }">

                                <!-- Widget Palette - Enhanced -->
                                <div v-if="showWidgetPalette && !isPanelsCollapsed"
                                    class="w-80 transition-all duration-300 transform">
                                    <div
                                        class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 h-full">
                                        <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                                            <div class="flex items-center space-x-2">
                                                <span class="material-icons text-blue-500">widgets</span>
                                                <h3 class="font-semibold text-gray-800 dark:text-gray-200">Componentes
                                                </h3>
                                            </div>
                                        </div>
                                        <div class="p-4">
                                            <UnifiedWidgetPalette :available-widgets="availableWidgets"
                                                :selected-framework="selectedFramework" @add-widget="addWidget"
                                                @drag-start="(widgetType) => console.log('Drag start:', widgetType)"
                                                @drag-end="() => console.log('Drag end')" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Canvas Area - Enhanced -->
                                <div class="flex-1 transition-all duration-300">
                                    <div
                                        class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 min-h-[600px]">
                                        <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center space-x-2">
                                                    <span class="material-icons text-green-500">design_services</span>
                                                    <h3 class="font-semibold text-gray-800 dark:text-gray-200">Canvas de
                                                        Diseño</h3>
                                                </div>
                                                <div class="flex items-center space-x-2">
                                                    <div
                                                        class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                        {{ selectedFramework.toUpperCase() }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="p-4">
                                            <UnifiedCanvas :current-screen="currentScreen"
                                                :available-widgets="availableWidgets"
                                                :selected-framework="selectedFramework" @select-element="selectElement"
                                                @remove-element="removeElement" @add-element="addWidget"
                                                @drop="(widgetType) => addWidget(widgetType)" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Properties Panel - Enhanced -->
                                <div v-if="showPropertiesPanel && !isPanelsCollapsed"
                                    class="w-80 transition-all duration-300 transform">
                                    <div
                                        class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 h-full">
                                        <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                                            <div class="flex items-center space-x-2">
                                                <span class="material-icons text-purple-500">tune</span>
                                                <h3 class="font-semibold text-gray-800 dark:text-gray-200">Propiedades
                                                </h3>
                                            </div>
                                        </div>
                                        <div class="p-4">
                                            <UnifiedPropertiesPanel :selected-element="selectedElement"
                                                :available-widgets="availableWidgets" :framework="selectedFramework"
                                                @update-property="updateElementProperty"
                                                @update-color-property="updateElementProperty" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Enhanced Screen Manager Modal -->
                    <div v-if="showScreenManager"
                        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div
                            class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
                            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <span class="material-icons text-blue-500 text-2xl">layers</span>
                                        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Gestión de
                                            Pantallas</h3>
                                    </div>
                                    <button @click="showScreenManager = false"
                                        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <span class="material-icons text-gray-500">close</span>
                                    </button>
                                </div>
                            </div>

                            <div class="p-6 overflow-y-auto max-h-[60vh]">
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div v-for="(screen, index) in screens" :key="screen.id"
                                        class="group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg"
                                        :class="{
                                            'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg': currentScreenIndex === index,
                                            'border-gray-200 dark:border-gray-700 hover:border-blue-300': currentScreenIndex !== index
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
                                                <button v-if="screens.length > 1" @click.stop="deleteScreen(index)"
                                                    class="px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                                                    <span class="material-icons text-xs">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            {{ screen.elements.length }} elementos
                                        </div>

                                        <div
                                            class="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
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
                                        @click="addScreen('Nueva Pantalla ' + (screens.length + 1))">
                                        <span
                                            class="material-icons text-4xl text-gray-400 group-hover:text-blue-500 transition-colors mb-2">add_circle_outline</span>
                                        <span class="text-gray-500 group-hover:text-blue-600 font-medium">Añadir
                                            Pantalla</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Action Buttons -->
            <div class="fixed bottom-6 right-6 flex flex-col space-y-3 z-40">
                <!-- AI Chat Button -->
                <button @click="toggleAIChat"
                    :class="showAIChat ? 'bg-green-600 scale-110' : 'bg-green-500 hover:bg-green-600'"
                    class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                    <span class="material-icons text-xl">smart_toy</span>
                </button>

                <!-- Image Upload Button -->
                <button @click="toggleImageUpload"
                    :class="showImageUpload ? 'bg-purple-600 scale-110' : 'bg-purple-500 hover:bg-purple-600'"
                    class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                    <span class="material-icons text-xl">image</span>
                </button>

                <!-- Diagram Upload Button -->
                <button @click="toggleDiagramUpload"
                    :class="showDiagramUpload ? 'bg-orange-600 scale-110' : 'bg-orange-500 hover:bg-orange-600'"
                    class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                    <span class="material-icons text-xl">account_tree</span>
                </button>

                <!-- Code Viewer Button -->
                <button @click="toggleCodeViewer"
                    :class="showCodeViewer ? 'bg-blue-600 scale-110' : 'bg-blue-500 hover:bg-blue-600'"
                    class="p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                    <span class="material-icons text-xl">code</span>
                </button>
            </div>

            <!-- Enhanced Feature Panels -->

            <!-- Enhanced Code Viewer Modal -->
            <div v-if="showCodeViewer"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="material-icons text-blue-500 text-2xl">code</span>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">
                                    Código Generado ({{ selectedFramework.toUpperCase() }})
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
                                <button @click="toggleCodeViewer"
                                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <span class="material-icons text-gray-500">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[70vh]">
                        <pre class="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm font-mono border">{{
                            generatedCode || 'Generando código...' }}</pre>
                    </div>
                </div>
            </div>

            <!-- Enhanced Image Upload Modal -->
            <div v-if="showImageUpload"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="material-icons text-purple-500 text-2xl">image</span>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Subir Imagen</h3>
                            </div>
                            <button @click="toggleImageUpload"
                                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <span class="material-icons text-gray-500">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                            <input type="file" @change="handleImageUpload" accept="image/*" class="hidden"
                                id="imageInput" />
                            <label for="imageInput" class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">cloud_upload</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona una
                                        imagen</p>
                                    <p class="text-sm text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                </div>
                            </label>
                        </div>

                        <div v-if="previewImage" class="mt-6">
                            <div class="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                                <img :src="previewImage" alt="Preview" class="max-w-full h-auto rounded-lg mx-auto" />
                            </div>
                            <div class="mt-4 flex justify-center space-x-3">
                                <button @click="processImage" :disabled="isProcessingImage"
                                    class="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2">
                                    <span class="material-icons text-sm" :class="{ 'animate-spin': isProcessingImage }">
                                        {{ isProcessingImage ? 'refresh' : 'auto_awesome' }}
                                    </span>
                                    <span>{{ isProcessingImage ? 'Procesando...' : 'Procesar Imagen' }}</span>
                                </button>
                                <button @click="clearSelectedImage"
                                    class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
                                    <span class="material-icons text-sm">clear</span>
                                    <span>Limpiar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Diagram Upload Modal -->
            <div v-if="showDiagramUpload"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="material-icons text-orange-500 text-2xl">account_tree</span>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Subir Diagrama de Clases
                                </h3>
                            </div>
                            <button @click="toggleDiagramUpload"
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
                                ]" :key="type.value" @click="diagramType = type.value"
                                    :class="diagramType === type.value ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                                    class="p-3 rounded-lg transition-colors flex flex-col items-center space-y-1">
                                    <span class="material-icons text-sm">{{ type.icon }}</span>
                                    <span class="text-xs font-medium">{{ type.label }}</span>
                                </button>
                            </div>
                        </div>

                        <div v-if="diagramType === 'image'"
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                            <input type="file" @change="handleDiagramFileUpload" accept="image/*" class="hidden"
                                id="diagramImageInput" />
                            <label for="diagramImageInput" class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">image</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona imagen
                                        del diagrama
                                    </p>
                                    <p class="text-sm text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                </div>
                            </label>
                        </div>

                        <div v-else-if="diagramType === 'xml'"
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                            <input type="file" @change="handleDiagramFileUpload" accept=".xml" class="hidden"
                                id="diagramXmlInput" />
                            <label for="diagramXmlInput" class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">code</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona archivo
                                        XML</p>
                                    <p class="text-sm text-gray-500">Archivos .xml</p>
                                </div>
                            </label>
                        </div>

                        <div v-else-if="diagramType === 'plantuml'"
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                            <input type="file" @change="handleDiagramFileUpload" accept=".puml,.plantuml" class="hidden"
                                id="diagramPlantUmlInput" />
                            <label for="diagramPlantUmlInput"
                                class="cursor-pointer flex flex-col items-center space-y-4">
                                <span class="material-icons text-6xl text-gray-400">schema</span>
                                <div>
                                    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona archivo
                                        PlantUML</p>
                                    <p class="text-sm text-gray-500">Archivos .puml, .plantuml</p>
                                </div>
                            </label>
                        </div>

                        <div v-else class="space-y-4">
                            <textarea v-model="diagramContent" placeholder="Pega aquí el contenido del diagrama..."
                                rows="8"
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"></textarea>
                        </div>

                        <div class="mt-6 flex justify-center space-x-3">
                            <button @click="processDiagram"
                                :disabled="isProcessingDiagram || (!selectedDiagramFile && !diagramContent)"
                                class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2">
                                <span class="material-icons text-sm" :class="{ 'animate-spin': isProcessingDiagram }">
                                    {{ isProcessingDiagram ? 'refresh' : 'auto_awesome' }}
                                </span>
                                <span>{{ isProcessingDiagram ? 'Procesando...' : 'Procesar Diagrama' }}</span>
                            </button>
                            <button @click="clearDiagramData"
                                class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
                                <span class="material-icons text-sm">clear</span>
                                <span>Limpiar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>

        <!-- AI Chat -->
        <ChatAI v-if="showAIChat" :messages="aiMessages" :is-processing="isProcessingAI" @send-message="sendAIPrompt"
            @close="toggleAIChat" />

        <!-- Collaboration Chat -->
        <ChatColaborativo v-if="showCollaborationChat" :socket="collaborationService?.socket" :room-id="roomId"
            :current-user="currentUser" :show-chat="showCollaborationChat" @send-message="handleChatMessage"
            @typing="handleTyping" @close="toggleCollaborationChat" />
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

/* Floating Action Button Effects */
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

/* Gradient text effects */
.gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    transform: scale(0.9);
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

/* Panel slide animations */
.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: all 0.3s ease-in-out;
}

.panel-slide-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}

.panel-slide-leave-to {
    transform: translateX(-100%);
    opacity: 0;
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

/* Enhanced card hover effects */
.card-hover {
    transition: all 0.3s ease;
}

.card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.dark .card-hover:hover {
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Glassmorphism effect */
.glass-morphism {
    background: rgba(255, 255, 255, 0.25);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
}

.dark .glass-morphism {
    background: rgba(0, 0, 0, 0.25);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

/* Status indicator */
.status-online {
    position: relative;
}

.status-online::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    animation: status-pulse 2s infinite;
}

@keyframes status-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
}
</style>
