<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { getSocketConfig } from '@/lib/socketConfig';
import type { BreadcrumbItem } from '@/types';
import type { PizarraUnificada, UnifiedScreen, CodeExportOptions, User } from '@/Data/PizarraUnificada';
import { UnifiedCollaborationService } from '@/services/UnifiedCollaborationService';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';
import { UnifiedCodeGenerationService } from '@/services/UnifiedCodeGenerationService';
import { DiagramProcessingService } from '@/services/DiagramProcessingService';
import { AIService } from '@/services/AIService';
import { ImageProcessingService } from '@/services/ImageProcessingService';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import ChatAI from '@/pages/Chat/ChatAI.vue';
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
/*const addWidget = (widgetType: string) => {
    const newElement = UnifiedWidgetService.createUnifiedElement(
        widgetType,
        selectedFramework.value,
        availableWidgets.value
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

    UnifiedWidgetService.updateElementProperty(
        selectedElement.value,
        propertyName,
        value,
        selectedFramework.value
    );

    // Emit to collaborators
    if (collaborationService) {
        collaborationService.emitElementUpdated(selectedElement.value, currentScreen.value?.id);
    }

    savePizarra();
};

const removeElement = (element: UnifiedElement) => {
    if (!currentScreen.value) return;

    const index = currentScreen.value.elements.findIndex(e => e.id === element.id);
    if (index !== -1) {
        currentScreen.value.elements.splice(index, 1);

        // Emit to collaborators
        if (collaborationService) {
            collaborationService.emitElementDeleted(element.id, currentScreen.value.id);
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

    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

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
}; */

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
        const element = UnifiedWidgetService.convertFlutterToUnified(widget);
        currentScreen.value.elements.push(element);

        // Emit to collaborators
        if (collaborationService) {
            collaborationService.emitElementAdded(element, currentScreen.value.id);
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
            <template #header>
                <div class="flex justify-between items-center">
                    <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        {{ projectName }}
                    </h2>

                    <!-- Framework selector -->
                    <div class="flex items-center space-x-4">
                        <select v-model="selectedFramework" @change="switchFramework(selectedFramework)"
                            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="flutter">Flutter</option>
                            <option value="angular">Angular</option>
                            <option value="both">Ambos</option>
                        </select>

                        <!-- Dark mode toggle -->
                        <button @click="toggleDarkMode" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <svg v-if="isDarkMode" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M10 2L13.09 8.26L20 9L14 14.74L15.18 21.02L10 17.77L4.82 21.02L6 14.74L0 9L6.91 8.26L10 2Z" />
                            </svg>
                            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </template>

            <div class="py-12">
                <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-xl sm:rounded-lg">
                        <div class="p-6 bg-white dark:bg-gray-800">
                            <!-- Main content will be implemented here -->
                            <div class="text-center">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Pizarra Unificada
                                </h3>
                                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Framework seleccionado: {{ selectedFramework }}
                                </p>
                                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Pantalla actual: {{ currentScreen?.name }}
                                </p>
                                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Elementos en pantalla: {{ currentScreen?.elements?.length || 0 }}
                                </p>
                            </div>

                            <!-- Action buttons -->
                            <div class="mt-6 flex justify-center space-x-4">
                                <button @click="toggleCodeViewer"
                                    class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {{ showCodeViewer ? 'Ocultar' : 'Ver' }} Código
                                </button>

                                <button @click="toggleAIChat"
                                    class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                                    {{ showAIChat ? 'Ocultar' : 'Abrir' }} Chat AI
                                </button>

                                <button @click="toggleImageUpload"
                                    class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    {{ showImageUpload ? 'Ocultar' : 'Subir' }} Imagen
                                </button>

                                <button @click="toggleDiagramUpload"
                                    class="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    {{ showDiagramUpload ? 'Ocultar' : 'Subir' }} Diagrama
                                </button>
                            </div>

                            <!-- Code viewer -->
                            <div v-if="showCodeViewer" class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                                <div class="flex justify-between items-center mb-4">
                                    <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        Código Generado ({{ selectedFramework }})
                                    </h4>
                                    <div class="space-x-2">
                                        <button @click="copyCode"
                                            class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                                            Copiar
                                        </button>
                                        <button @click="downloadCode"
                                            class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
                                            Descargar
                                        </button>
                                    </div>
                                </div>
                                <pre class="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">{{ generatedCode ||
                                    'Generando código...' }}</pre>
                            </div>

                            <!-- Image upload -->
                            <div v-if="showImageUpload" class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                                <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    Subir Imagen
                                </h4>
                                <input type="file" @change="handleImageUpload" accept="image/*"
                                    class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                                <div v-if="previewImage" class="mt-4">
                                    <img :src="previewImage" alt="Preview" class="max-w-md mx-auto rounded-md" />
                                    <div class="mt-4 flex justify-center space-x-2">
                                        <button @click="processImage" :disabled="isProcessingImage"
                                            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                                            {{ isProcessingImage ? 'Procesando...' : 'Procesar Imagen' }}
                                        </button>
                                        <button @click="clearSelectedImage"
                                            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                            Limpiar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Diagram upload -->
                            <div v-if="showDiagramUpload" class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                                <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    Subir Diagrama de Clases
                                </h4>

                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tipo de diagrama:
                                    </label>
                                    <select v-model="diagramType"
                                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="image">Imagen</option>
                                        <option value="xml">XML</option>
                                        <option value="plantuml">PlantUML</option>
                                        <option value="text">Texto</option>
                                    </select>
                                </div>

                                <div v-if="diagramType === 'image'">
                                    <input type="file" @change="handleDiagramFileUpload" accept="image/*"
                                        class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                                </div>

                                <div v-else-if="diagramType === 'xml'">
                                    <input type="file" @change="handleDiagramFileUpload" accept=".xml"
                                        class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                                </div>

                                <div v-else-if="diagramType === 'plantuml'">
                                    <input type="file" @change="handleDiagramFileUpload" accept=".puml,.plantuml"
                                        class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                                </div>

                                <div v-else>
                                    <textarea v-model="diagramContent"
                                        placeholder="Pega aquí el contenido del diagrama..." rows="6"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                                </div>

                                <div class="mt-4 flex justify-center space-x-2">
                                    <button @click="processDiagram"
                                        :disabled="isProcessingDiagram || (!selectedDiagramFile && !diagramContent)"
                                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                                        {{ isProcessingDiagram ? 'Procesando...' : 'Procesar Diagrama' }}
                                    </button>
                                    <button @click="clearDiagramData"
                                        class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                        Limpiar
                                    </button>
                                </div>
                            </div>
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
/* Add any specific styles for the unified pizarra */
</style>
