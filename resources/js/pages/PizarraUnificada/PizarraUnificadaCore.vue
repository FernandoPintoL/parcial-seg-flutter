<script setup lang="ts">
import type { PizarraUnificada, User } from '@/Data/PizarraUnificada';
import AppLayout from '@/layouts/AppLayout.vue';
import { Head } from '@inertiajs/vue3';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { AIService } from '@/services/AIService';

// Core Components
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import UnifiedAIChat from '@/pages/Chat/UnifiedAIChat.vue';
import CodeViewerModal from './components/CodeViewerModal.vue';
import CollaboratorManagementModal from '@/pages/PizarraUnificada/components/CollaboratorManagementModal.vue';
import DiagramUploadModal from './components/DiagramUploadModal.vue';
import ImageUploadModal from './components/ImageUploadModal.vue';
import PizarraHeader from './components/PizarraHeader.vue';
import PizarraModals from './components/PizarraModals.vue';
import PizarraToolbar from './components/PizarraToolbar.vue';
import UnifiedCanvas from './UnifiedCanvas.vue';
import UnifiedPropertiesPanel from './UnifiedPropertiesPanel.vue';

// Composables
import { useElementManagement } from '@/pages/PizarraUnificada/composables/useElementManagement';
import { usePizarraCollaboration } from '@/pages/PizarraUnificada/composables/usePizarraCollaboration';
import { usePizarraState } from '@/pages/PizarraUnificada/composables/usePizarraState';
import { usePizarraUI } from '@/pages/PizarraUnificada/composables/usePizarraUI';
import { usePizarraServices } from './composables/usePizarraServices';
import { usePizarraStorage } from './composables/usePizarraStorage';
import { useProcessingServices } from './composables/useProcessingServices';

// Props
const props = defineProps<{
    user: User;
    pizarra: PizarraUnificada;
    creador: User;
    isCreador: boolean;
    colaboradores: User[];
}>();

// Breadcrumbs
const breadcrumbs = computed(() => [
    {
        title: 'Pizarra Unificada',
        href: props.pizarra ? `/pizarra_unificada/${props.pizarra.id}/edit` : '/pizarra_unificada',
    },
]);

// Core State Management
const pizarraState = usePizarraState({ pizarra: props.pizarra });

// Element Management
const elementManagement = useElementManagement({
    currentScreen: pizarraState.currentScreen.value,
    selectedFramework: pizarraState.selectedFramework.value,
});

// Pizarra Services
const pizarraServices = usePizarraServices({
    pizarra: props.pizarra,
    defaultFramework: pizarraState.selectedFramework.value,
});

// Processing Services
const processingServices = useProcessingServices({
    defaultFramework: pizarraState.selectedFramework.value,
});

// Storage Services
const storageServices = usePizarraStorage({
    pizarra: props.pizarra,
});

// Collaboration Management
const collaboration = usePizarraCollaboration(
    {
        user: props.user,
        pizarra: props.pizarra,
        creador: props.creador,
        isCreador: props.isCreador,
        colaboradores: props.colaboradores,
    },
    {
        onElementAdded: (element, screenId) => {
            console.log('Element added by collaborator:', element, 'to screen:', screenId);

            // Only update if the element belongs to the current screen
            if (screenId && pizarraState.currentScreen.value?.id !== screenId) {
                // Find the target screen and update it
                const screenIndex = pizarraState.screens.value.findIndex((s) => s.id === screenId);
                if (screenIndex >= 0) {
                    // Add the element to the screen
                    if (!pizarraState.screens.value[screenIndex].elements) {
                        pizarraState.screens.value[screenIndex].elements = [];
                    }
                    pizarraState.screens.value[screenIndex].elements.push(element);
                }
                return;
            }

            // Add the element to the current screen
            if (!pizarraState.currentScreen.value.elements) {
                pizarraState.currentScreen.value.elements = [];
            }
            pizarraState.currentScreen.value.elements.push(element);

            // Save the changes
            savePizarra();
        },
        onElementUpdated: (element, screenId) => {
            console.log('Element updated by collaborator:', element, 'in screen:', screenId);

            // Only update if the element belongs to the current screen
            if (screenId && pizarraState.currentScreen.value?.id !== screenId) {
                // Find the target screen and update it
                const screenIndex = pizarraState.screens.value.findIndex((s) => s.id === screenId);
                if (screenIndex >= 0 && pizarraState.screens.value[screenIndex].elements) {
                    // Find and update the element
                    const elementIndex = pizarraState.screens.value[screenIndex].elements.findIndex((e) => e.id === element.id);
                    if (elementIndex >= 0) {
                        pizarraState.screens.value[screenIndex].elements[elementIndex] = element;
                    }
                }
                return;
            }

            // Update the element in the current screen
            if (pizarraState.currentScreen.value.elements) {
                const elementIndex = pizarraState.currentScreen.value.elements.findIndex((e) => e.id === element.id);
                if (elementIndex >= 0) {
                    pizarraState.currentScreen.value.elements[elementIndex] = element;
                }
            }

            // Save the changes
            savePizarra();
        },
        onElementDeleted: (elementId, screenId) => {
            console.log('Element deleted by collaborator:', elementId, 'from screen:', screenId);

            // Only update if the element belongs to the current screen
            if (screenId && pizarraState.currentScreen.value?.id !== screenId) {
                // Find the target screen and update it
                const screenIndex = pizarraState.screens.value.findIndex((s) => s.id === screenId);
                if (screenIndex >= 0 && pizarraState.screens.value[screenIndex].elements) {
                    // Remove the element
                    pizarraState.screens.value[screenIndex].elements = pizarraState.screens.value[screenIndex].elements.filter(
                        (e) => e.id !== elementId,
                    );
                }
                return;
            }

            // Remove the element from the current screen
            if (pizarraState.currentScreen.value.elements) {
                pizarraState.currentScreen.value.elements = pizarraState.currentScreen.value.elements.filter((e) => e.id !== elementId);
            }

            // Deselect the element if it was selected
            if (elementManagement.selectedElement.value?.id === elementId) {
                elementManagement.deselectElement();
            }

            // Save the changes
            savePizarra();
        },
        onFrameworkSwitched: (framework) => {
            console.log('Framework switched by collaborator to:', framework);

            // Update the framework if it's different
            if (pizarraState.selectedFramework.value !== framework) {
                pizarraState.switchFramework(framework);
                elementManagement.updateAvailableWidgets();

                // Save the changes
                savePizarra();
            }
        },
        onElementSelected: (element, screenId, userId) => {
            console.log('Element selected by collaborator:', element, 'in screen:', screenId, 'by user:', userId);

            // Only update if the element belongs to the current screen
            if (screenId && pizarraState.currentScreen.value?.id !== screenId) {
                console.log('Element is in a different screen, not updating UI');
                return;
            }

            // Find the element in the current screen
            if (pizarraState.currentScreen.value.elements) {
                const foundElement = pizarraState.currentScreen.value.elements.find((e) => e.id === element.id);
                if (foundElement) {
                    // Add a visual indicator that this element is being selected by another user
                    // We'll add a temporary class or property to the element
                    foundElement.remoteSelectedBy = userId;

                    // Create a timeout to remove the indicator after a few seconds
                    setTimeout(() => {
                        if (foundElement.remoteSelectedBy === userId) {
                            foundElement.remoteSelectedBy = null;
                        }
                    }, 5000);

                    console.log('Added remote selection indicator to element:', element.id, 'by user:', userId);
                }
            }
        },
        onUserJoined: (user) => {
            console.log('User joined:', user);
            // You could show a notification or update the UI to indicate a new user joined
        },
        onUserLeft: (userId) => {
            console.log('User left:', userId);
            // You could show a notification or update the UI to indicate a user left
        },
    },
);

// UI State Management
const {
    isDarkMode,
    showWidgetPalette,
    showPropertiesPanel,
    showScreenManager,
    isPanelsCollapsed,
    showAIChat,
    showCollaborationChat: uiShowCollaborationChat,
    showImageUpload,
    showDiagramUpload,
    showCodeViewer,

    // Actions
    toggleDarkMode,
    toggleWidgetPalette,
    togglePropertiesPanel,
    toggleScreenManager,
    togglePanelsCollapse,
    toggleFullscreen,
    toggleAIChat,
    toggleCollaborationChat: uiToggleCollaborationChat,
    toggleImageUpload,
    toggleDiagramUpload,
    toggleCodeViewer,
    applyDarkMode,
} = usePizarraUI();

// Code Verification State
const codeVerificationResult = ref<{ isValid: boolean; message: string } | null>(null);
const codeCorrectedCode = ref<string | null>(null);
const codeHasCorrections = ref<boolean>(false);
const isVerifyingCode = ref<boolean>(false);

// Collaborator Management State
const showCollaboratorManagement = ref<boolean>(false);

// Toggle collaborator management modal
const toggleCollaboratorManagement = () => {
    // If trying to open the modal
    if (!showCollaboratorManagement.value) {
        // Check if socket is connected
        if (!collaboration.socketConnected.value || !collaboration.collaborationService) {
            console.warn('Cannot open collaborator management: Socket not connected or collaboration service not available');
            // Try to initialize collaboration if not already done
            if (!collaboration.isCollaborating.value) {
                console.log('Attempting to initialize collaboration...');
                collaboration.initializeCollaboration();
            }
            // Show an alert to the user
            alert('No se puede abrir la gestión de colaboradores. Verifique su conexión al servidor de sockets.');
            return;
        }
    }

    // Toggle the modal visibility
    showCollaboratorManagement.value = !showCollaboratorManagement.value;
};

// Handle collaborator events
const handleAddCollaborator = async (email: string) => {
    try {
        console.log('Adding collaborator with email:', email);
        // In a real implementation, you would need to find the user ID from the email
        // For now, we'll just use a placeholder

        //const userEmail = email; // This is a simplification

        const result = await collaboration.addCollaborator(email);

        if (result.success) {
            console.log('Collaborator added successfully:', result.message);
            // You might want to refresh the collaborators list here
        } else {
            console.error('Failed to add collaborator:', result.error);
            alert(`Error al agregar colaborador: ${result.error}`);
        }
    } catch (error) {
        console.error('Error adding collaborator:', error);
        alert('Error al agregar colaborador. Por favor, inténtelo de nuevo.');
    }
};

const handleRemoveCollaborator = async (userId: string) => {
    try {
        const result = await collaboration.removeCollaborator(userId);

        if (result.success) {
            console.log('Collaborator removed successfully:', result.message);
            // You might want to refresh the collaborators list here
        } else {
            console.error('Failed to remove collaborator:', result.error);
            alert(`Error al eliminar colaborador: ${result.error}`);
        }
    } catch (error) {
        console.error('Error removing collaborator:', error);
        alert('Error al eliminar colaborador. Por favor, inténtelo de nuevo.');
    }
};

// Custom implementation of toggleCollaborationChat that checks if socket is connected
const toggleCollaborationChat = () => {
    // If trying to open the chat
    if (!uiShowCollaborationChat.value) {
        // Check if socket is connected
        if (!collaboration.socketConnected.value || !collaboration.collaborationService) {
            console.warn('Cannot open chat: Socket not connected or collaboration service not available');
            // Try to initialize collaboration if not already done
            if (!collaboration.isCollaborating.value) {
                console.log('Attempting to initialize collaboration...');
                collaboration.initializeCollaboration();
            }
            // Show an alert to the user
            alert('No se puede abrir el chat colaborativo. Verifique su conexión al servidor de sockets.');
            return;
        }
    }

    // Toggle the chat visibility
    uiToggleCollaborationChat();
};

// Framework switching
const switchFramework = (framework: 'flutter' | 'angular' | 'both') => {
    pizarraState.switchFramework(framework);
    elementManagement.updateAvailableWidgets();

    // Save pizarra
    savePizarra();

    // Emitir el cambio de framework a los colaboradores
    if (collaboration.collaborationService) {
        collaboration.emitFrameworkSwitched(framework);
    }
};

// Save pizarra function
const savePizarra = async () => {
    try {
        // Update the current screen's elements in the screens array to ensure all changes are saved
        if (pizarraState.currentScreen.value && pizarraState.currentScreenIndex.value >= 0) {
            const currentIndex = pizarraState.currentScreenIndex.value;
            if (pizarraState.screens.value[currentIndex]) {
                // Ensure we're updating the correct screen by matching IDs
                if (pizarraState.screens.value[currentIndex].id === pizarraState.currentScreen.value.id) {
                    pizarraState.screens.value[currentIndex].elements = pizarraState.currentScreen.value.elements || [];
                }
            }
        }

        await storageServices.savePizarra({
            name: pizarraState.projectName.value,
            type: pizarraState.projectType.value,
            screens: pizarraState.screens.value,
            // Removed redundant elements property to avoid confusion
        });
        console.log('✅ Pizarra guardada successfully');
    } catch (error) {
        console.error('❌ Error saving pizarra:', error);
    }
};

// Handle code viewer toggle with code generation and verification
const handleCodeViewerToggle = async () => {
    try {
        console.log('🚀 Generating code for framework:', pizarraState.selectedFramework.value);

        // Reset verification state
        codeVerificationResult.value = null;
        codeCorrectedCode.value = null;
        codeHasCorrections.value = false;

        // Show loading message
        isVerifyingCode.value = true;

        // Save pizarra first to ensure all changes are included
        await savePizarra();

        // Generate code based on the selected framework
        const result = await pizarraServices.generateCode();

        if (result.success) {
            console.log('✅ Code generated successfully for:', pizarraState.selectedFramework.value);

            try {
                console.log('🔍 Verifying generated code...');

                // Use appropriate verification method based on framework
                let correctedCode: string;
                if (pizarraState.selectedFramework.value === 'flutter') {
                    correctedCode = await AIService.correctFlutterCode(pizarraServices.generatedCode.value);
                } else if (pizarraState.selectedFramework.value === 'angular') {
                    correctedCode = await AIService.correctAngularCode(pizarraServices.generatedCode.value);
                } else {
                    // For other frameworks, just use the original code
                    correctedCode = pizarraServices.generatedCode.value;
                }

                // Check if code needed corrections
                const isValid = correctedCode === pizarraServices.generatedCode.value;

                // Set verification result
                codeVerificationResult.value = {
                    isValid,
                    message: isValid
                        ? `El código ${pizarraState.selectedFramework.value.toUpperCase()} es válido y sigue las mejores prácticas.`
                        : `Se encontraron problemas en el código ${pizarraState.selectedFramework.value.toUpperCase()}. Se han aplicado correcciones automáticamente.`,
                };

                // If code needed corrections, automatically apply them
                if (!isValid) {
                    codeCorrectedCode.value = correctedCode;
                    codeHasCorrections.value = true;
                    console.log('🔧 Code corrections applied');

                    // Automatically apply corrections
                    pizarraServices.generatedCode.value = correctedCode;
                    console.log('✅ Code automatically updated with corrections');
                } else {
                    console.log('✅ Code verification passed, no corrections needed');
                }
            } catch (verifyError) {
                console.error('❌ Error verifying code:', verifyError);
                codeVerificationResult.value = {
                    isValid: false,
                    message: 'Error al verificar el código. Se mostrará el código original.',
                };
            } finally {
                isVerifyingCode.value = false;
            }

            // Show the code viewer modal
            toggleCodeViewer();
        } else {
            console.error('❌ Error generating code:', result.error);
            // Show error notification or handle the error
            alert(`Error generating code: ${result.error || 'Unknown error'}`);
            isVerifyingCode.value = false;
        }
    } catch (error) {
        console.error('❌ Error in handleCodeViewerToggle:', error);
        alert('Error generating code. Please try again.');
        isVerifyingCode.value = false;
    }
};

// Handle code download (single file or complete project)
const handleCodeDownload = async (downloadType: 'single' | 'complete' = 'single', verifiedCode?: string) => {
    try {
        console.log('📥 Downloading code as:', downloadType);

        // If verified code is provided, update the generated code in the services
        if (verifiedCode && verifiedCode !== pizarraServices.generatedCode.value) {
            console.log('🔄 Using verified code for download');
            pizarraServices.generatedCode.value = verifiedCode;
        }

        if (downloadType === 'complete') {
            // Download complete project as ZIP
            await pizarraServices.downloadZipFile(pizarraState.projectName.value);

            // Create and download instructions file
            const framework = pizarraState.selectedFramework.value;
            const instructions = getFrameworkInstructions(framework);

            if (instructions) {
                const blob = new Blob([instructions], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${pizarraState.projectName.value}-${framework}-instructions.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } else {
            // Download single file
            pizarraServices.downloadCode(pizarraState.projectName.value, pizarraState.selectedFramework.value);
        }

        // Show success message
        console.log('✅ Code downloaded successfully');
        alert('Código descargado correctamente. Se ha verificado y corregido automáticamente para asegurar su compatibilidad.');
    } catch (error) {
        console.error('❌ Error downloading code:', error);
        alert('Error downloading code. Please try again.');
    }
};

// Handle code update from code verification
const handleCodeUpdate = (updatedCode: string) => {
    try {
        console.log('🔄 Updating generated code with corrected version');

        // Update the generated code in the services
        pizarraServices.generatedCode.value = updatedCode;

        // Show a notification to the user
        alert('El código ha sido actualizado con las correcciones automáticas.');

        // Log the success
        console.log('✅ Code updated successfully with corrections');
    } catch (error) {
        console.error('❌ Error updating code:', error);
        alert('Error al actualizar el código. Por favor, inténtelo de nuevo.');
    }
};

// Get framework-specific instructions
const getFrameworkInstructions = (framework: string): string => {
    if (framework === 'angular') {
        return `# Angular Installation Instructions

## Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

## Steps to run the project
1. Extract the downloaded ZIP file
2. Open a terminal and navigate to the project folder
3. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
4. Start the development server:
   \`\`\`
   npm start
   \`\`\`
5. Open your browser and navigate to http://localhost:4200

## Project Structure
- \`src/app\`: Contains all the application components and modules
- \`src/assets\`: Contains static assets like images
- \`src/environments\`: Contains environment configuration

## Additional Commands
- Build for production: \`npm run build\`
- Run tests: \`npm test\`
`;
    } else if (framework === 'flutter') {
        return `# Flutter Installation Instructions

## Prerequisites
- Flutter SDK (v3.0 or later)
- Dart SDK (v2.17 or later)
- Android Studio or VS Code with Flutter extensions

## Steps to run the project
1. Extract the downloaded ZIP file
2. Open a terminal and navigate to the project folder
3. Install dependencies:
   \`\`\`
   flutter pub get
   \`\`\`
4. Run the application:
   \`\`\`
   flutter run
   \`\`\`

## Project Structure
- \`lib\`: Contains all the Dart code for the application
- \`lib/screens\`: Contains screen widgets
- \`lib/widgets\`: Contains reusable widgets
- \`assets\`: Contains static assets like images

## Additional Commands
- Build APK: \`flutter build apk\`
- Run tests: \`flutter test\`
`;
    }
    return '';
};

// Element management functions
const addWidget = (widgetType: string) => {
    const element = elementManagement.addWidget(widgetType);
    if (element) {
        // Emit to collaboration
        if (collaboration.collaborationService) {
            collaboration.emitElementAdded(element, pizarraState.currentScreen.value?.id);
        }
        savePizarra();
    }
    return element;
};

const addElement = (element: any) => {
    // This would be handled by the element management service
    console.log('Adding element:', element);
    savePizarra();
};

const selectElement = (element: any) => {
    elementManagement.selectElement(element);

    // Solo abrir el panel de propiedades si hay un elemento seleccionado
    if (element) {
        togglePropertiesPanel();

        // Emit to collaboration if an element is selected
        if (collaboration.collaborationService) {
            collaboration.emitElementSelected(element, pizarraState.currentScreen.value?.id);
            console.log('🔄 Element selection broadcasted to collaborators:', element.id);
        }
    } else {
        // Sí element és null, cerrar el panel de propiedades
        showPropertiesPanel.value = false;
    }
};

const openPropertiesPanel = (element: any) => {
    // Seleccionar el elemento y abrir el panel de propiedades
    elementManagement.selectElement(element);
    togglePropertiesPanel();

    // Emit to collaboration
    if (collaboration.collaborationService) {
        collaboration.emitElementSelected(element, pizarraState.currentScreen.value?.id);
        console.log('🔄 Element selection broadcasted to collaborators from properties panel:', element.id);
    }

    console.log('⚙️ Properties panel opened for element:', element.id);
};

const updateElement = (element: any) => {
    const success = elementManagement.updateElement(element);
    if (success) {
        // Emit to collaboration
        if (collaboration.collaborationService) {
            collaboration.emitElementUpdated(element, pizarraState.currentScreen.value?.id);
        }
        savePizarra();
    }
    return success;
};

const updateElementProperty = (propertyName: string, value: any) => {
    if (elementManagement.selectedElement.value?.id) {
        const success = elementManagement.updateElementProperties(elementManagement.selectedElement.value.id, { [propertyName]: value });
        if (success) {
            savePizarra();
        }
        return success;
    }
    return false;
};

const removeElement = (element: any) => {
    const success = elementManagement.removeElement(element);
    if (success) {
        // Emit to collaboration
        if (collaboration.collaborationService) {
            collaboration.emitElementDeleted(element.id, pizarraState.currentScreen.value?.id);
        }
        savePizarra();
    }
    return success;
};

// Screen management functions
const addScreen = (screenName: string) => {
    const newScreen = pizarraState.addScreen(screenName);
    toggleScreenManager();
    savePizarra();
    return newScreen;
};

const deleteScreen = async (index: number) => {
    const success = pizarraState.deleteScreen(index);
    if (success) {
        savePizarra();
    }
    return success;
};

const selectScreen = (index: number) => {
    pizarraState.selectScreen(index);
    elementManagement.deselectElement();
};

const setHomeScreen = (index: number) => {
    pizarraState.setHomeScreen(index);
    savePizarra();
};

// Function to add AI widgets to canvas
const addAIWidgetsToCanvas = (widgets: any[]) => {
    widgets.forEach((widget) => {
        const element = elementManagement.addWidget(widget.type);
        if (element) {
            // Emit to collaboration
            if (collaboration.collaborationService) {
                collaboration.emitElementAdded(element, pizarraState.currentScreen.value?.id);
            }
        }
    });
    savePizarra();
};

// Initialize component
onMounted(() => {
    collaboration.initializeCollaboration();
    pizarraState.initializeScreens();
    elementManagement.updateAvailableWidgets();
    applyDarkMode();
});

onUnmounted(() => {
    collaboration.disconnect();
});

// Sidebar state
const tabs = ['Pantallas', 'Elementos', 'Propiedades de Elementos'];
const activeTab = ref('Pantallas');
const pantallas = computed(() => pizarraState.screens.value);
const componentes = computed(() => elementManagement.availableWidgets.value);

function handleDeleteElement(element: any) {
    removeElement(element);
    // No deseleccionar automáticamente para evitar conflictos con drag & drop
    // elementManagement.deselectElement();
}
</script>

<template>
    <div>
        <Head :title="pizarraState.projectName.value" />
        <AppLayout :breadcrumbs="breadcrumbs">
            <!-- Header -->
            <template #header>
                <PizarraHeader
                    :project-name="pizarraState.projectName.value"
                    :selected-framework="pizarraState.selectedFramework.value"
                    :show-widget-palette="showWidgetPalette"
                    :show-properties-panel="showPropertiesPanel"
                    :is-panels-collapsed="isPanelsCollapsed"
                    :is-dark-mode="isDarkMode"
                    @switch-framework="switchFramework"
                    @toggle-widget-palette="toggleWidgetPalette"
                    @toggle-properties-panel="togglePropertiesPanel"
                    @toggle-panels-collapse="togglePanelsCollapse"
                    @toggle-fullscreen="toggleFullscreen"
                    @toggle-dark-mode="toggleDarkMode"
                    @save-pizarra="savePizarra"
                />
            </template>

            <!-- Layout con menú lateral fijo y canvas centrado -->
            <div
                class="workspace-layout flex h-screen overflow-hidden bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900"
            >
                <!-- Menú lateral fijo -->
                <aside
                    class="sidebar z-20 flex h-full w-[300px] flex-shrink-0 flex-col rounded-br-3xl rounded-tr-3xl border-r border-indigo-200 bg-white/95 shadow-2xl transition-all duration-300 dark:border-blue-900 dark:bg-gray-900/95"
                >
                    <!-- Tabs -->
                    <div class="flex flex-shrink-0 border-b border-indigo-100 dark:border-blue-900">
                        <button
                            v-for="tab in tabs"
                            :key="tab"
                            @click="activeTab = tab"
                            :class="[
                                'flex-1 py-2 text-center font-bold tracking-wide transition-all duration-200',
                                activeTab === tab
                                    ? 'scale-105 bg-gradient-to-r from-indigo-200 via-blue-200 to-purple-200 text-indigo-900 shadow-md dark:text-white'
                                    : 'text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-blue-900',
                            ]"
                        >
                            {{ tab }}
                        </button>
                    </div>
                    <!-- Contenido dinámico del menú -->
                    <div class="flex-1 overflow-y-auto p-4 transition-all duration-300">
                        <!-- Pantallas -->
                        <template v-if="activeTab === 'Pantallas'">
                            <div class="mb-2 flex items-center justify-between">
                                <h3 class="font-semibold text-indigo-700 dark:text-indigo-200">Pantallas</h3>
                                <button
                                    @click="addScreen('Nueva pantalla')"
                                    class="ml-2 rounded bg-indigo-500 px-2 py-1 text-xs text-white transition hover:bg-indigo-600"
                                >
                                    + Agregar
                                </button>
                            </div>
                            <ul>
                                <li
                                    v-for="(pantalla, idx) in pantallas"
                                    :key="pantalla.id"
                                    class="mb-1 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-indigo-100 dark:hover:bg-blue-900"
                                    :class="{ 'bg-indigo-200 dark:bg-blue-800': pizarraState.currentScreen.value?.id === pantalla.id }"
                                >
                                    <span @click="selectScreen(idx)">{{ pantalla.name || 'Pantalla ' + (idx + 1) }}</span>
                                    <button @click.stop="deleteScreen(idx)" class="ml-2 text-xs text-red-500 hover:text-red-700">🗑️</button>
                                </li>
                            </ul>
                        </template>
                        <!-- Elementos (Componentes) -->
                        <template v-else-if="activeTab === 'Elementos'">
                            <h3 class="mb-2 font-semibold text-indigo-700 dark:text-indigo-200">Componentes disponibles</h3>
                            <ul>
                                <li
                                    v-for="comp in componentes"
                                    :key="comp.type"
                                    class="mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-purple-100 dark:hover:bg-purple-900"
                                    @click="addWidget(comp.type)"
                                >
                                    <span class="material-icons text-indigo-400">widgets</span>
                                    {{ comp.label || comp.type }}
                                </li>
                            </ul>
                        </template>
                        <!-- Propiedades de Elementos -->
                        <template v-else-if="activeTab === 'Propiedades de Elementos'">
                            <template v-if="elementManagement.selectedElement.value">
                                <UnifiedPropertiesPanel
                                    :selected-element="elementManagement.selectedElement.value"
                                    :available-widgets="elementManagement.availableWidgets.value"
                                    :framework="pizarraState.selectedFramework.value"
                                    @update-element="updateElement"
                                    @update-property="updateElementProperty"
                                    @delete-element="handleDeleteElement"
                                    @duplicate-element="addElement"
                                />
                            </template>
                            <template v-else>
                                <div class="flex flex-1 flex-col items-center justify-center px-6 text-center text-indigo-400 dark:text-indigo-200">
                                    <span class="material-icons mb-4 text-6xl">touch_app</span>
                                    <p class="mb-2 text-lg font-semibold">Selecciona un elemento</p>
                                    <p class="text-sm">Haz click en un elemento del canvas para ver y editar sus propiedades aquí.</p>
                                </div>
                            </template>
                        </template>
                    </div>
                </aside>

                <!-- Canvas centrado -->
                <main class="relative flex flex-1 items-center justify-center overflow-hidden">
                    <div
                        class="canvas-container mx-4 my-4 flex h-full max-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center rounded-3xl border border-indigo-200 bg-white/95 p-4 shadow-2xl transition-all duration-300 dark:border-blue-900 dark:bg-gray-800/95"
                    >
                        <UnifiedCanvas
                            :current-screen="pizarraState.currentScreen.value"
                            :available-widgets="elementManagement.availableWidgets.value"
                            :selected-framework="pizarraState.selectedFramework.value"
                            @select-element="selectElement"
                            @remove-element="handleDeleteElement"
                            @update-element="updateElement"
                            @add-element="addElement"
                            @open-properties-panel="openPropertiesPanel"
                        />
                    </div>
                </main>
            </div>

            <!-- Floating Toolbar -->
            <PizarraToolbar
                @toggle-ai-chat="toggleAIChat"
                @toggle-image-upload="toggleImageUpload"
                @toggle-diagram-upload="toggleDiagramUpload"
                @toggle-code-viewer="handleCodeViewerToggle"
                @toggle-collaboration-chat="toggleCollaborationChat"
                @toggle-collaborator-management="toggleCollaboratorManagement"
            />

            <!-- Modals and Overlays -->
            <PizarraModals
                :show-screen-manager="showScreenManager"
                :screens="pizarraState.screens.value"
                :current-screen-index="pizarraState.currentScreenIndex.value"
                @close-screen-manager="toggleScreenManager"
                @add-screen="addScreen"
                @delete-screen="deleteScreen"
                @select-screen="selectScreen"
                @set-home-screen="setHomeScreen"
            />

            <!-- AI Chat Modal -->
            <UnifiedAIChat
                v-if="showAIChat"
                :framework="
                    ['flutter', 'angular', 'both'].includes(pizarraState.selectedFramework.value) ? pizarraState.selectedFramework.value : 'vue'
                "
                :is-open="showAIChat"
                :on-close="() => toggleAIChat()"
                :on-widgets-generated="addAIWidgetsToCanvas"
            />
            <!-- Collaborative Chat Modal -->
            <ChatColaborativo
                v-if="
                    uiShowCollaborationChat &&
                    collaboration.socketConnected.value &&
                    collaboration.collaborationService.value &&
                    collaboration.socketConfig
                "
                :collaboration-service="collaboration.collaborationService.value"
                :room-id="String(collaboration.roomId.value || '')"
                :current-user="String(collaboration.currentUser.value || '')"
                :show-chat="uiShowCollaborationChat"
                :socket-url="collaboration.socketConfig?.value?.url || 'http://localhost:4000'"
                @close="toggleCollaborationChat"
                @send-message="collaboration.emitChatMessage"
                @typing="collaboration.emitTyping"
            />
            <!-- Image Upload Modal -->
            <ImageUploadModal
                v-if="showImageUpload"
                :show="showImageUpload"
                :selected-image="processingServices.selectedImage.value"
                :preview-image="processingServices.previewImage.value"
                :is-processing="processingServices.isProcessingImage.value"
                @upload="processingServices.handleImageUpload"
                @clear="processingServices.clearSelectedImage"
                @process="() => processingServices.processImage(addAIWidgetsToCanvas)"
                @close="toggleImageUpload"
            />
            <!-- Diagram Upload Modal -->
            <DiagramUploadModal
                v-if="showDiagramUpload"
                :show="showDiagramUpload"
                :selected-file="processingServices.selectedDiagramFile.value"
                :diagram-content="processingServices.diagramContent.value"
                :diagram-type="processingServices.diagramType.value"
                :is-processing="processingServices.isProcessingDiagram.value"
                @upload="processingServices.handleDiagramFileUpload"
                @clear="processingServices.clearDiagramData"
                @process="() => processingServices.processDiagram(pizarraState.selectedFramework.value, addAIWidgetsToCanvas)"
                @close="toggleDiagramUpload"
            />
            <!-- Code Viewer Modal -->
            <CodeViewerModal
                v-if="showCodeViewer"
                :show="showCodeViewer"
                :code="pizarraServices.generatedCode.value"
                :framework="pizarraState.selectedFramework.value"
                :pizarra="pizarra"
                :initial-verification-result="codeVerificationResult"
                :initial-corrected-code="codeCorrectedCode"
                :initial-has-corrections="codeHasCorrections"
                @close="() => (showCodeViewer = false)"
                @download="handleCodeDownload"
                @copy="pizarraServices.copyCode"
                @update-code="handleCodeUpdate"
            />

            <!-- Collaborator Management Modal -->
            <CollaboratorManagementModal
                v-if="showCollaboratorManagement"
                :show="showCollaboratorManagement"
                :collaborators="props.colaboradores"
                :current-user="props.user"
                :is-creator="props.isCreador"
                :room-id="String(collaboration.roomId.value || '')"
                :pizarra-id="String(collaboration.pizarraId.value || '')"
                @close="toggleCollaboratorManagement"
                @remove-collaborator="handleRemoveCollaborator"
                @add-collaborator="handleAddCollaborator"
            />
        </AppLayout>
    </div>
</template>

<style scoped>
.workspace-layout {
    height: 100vh;
    background: linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%);
    overflow: hidden;
    display: flex;
}

.sidebar {
    width: 300px;
    border-right: 1.5px solid #c7d2fe;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 4px 0 24px 0 rgba(99, 102, 241, 0.08);
    z-index: 20;
    border-top-right-radius: 2rem;
    border-bottom-right-radius: 2rem;
    transition: all 0.3s;
    height: 100vh;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.canvas-container {
    width: 100%;
    height: 100%;
    max-width: 1400px;
    max-height: calc(100vh - 2rem);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
    border-radius: 2rem;
    border: 1.5px solid #c7d2fe;
    background: linear-gradient(135deg, #f8fafc 80%, #e0e7ef 100%);
    position: relative;
    transition: all 0.3s;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

::-webkit-scrollbar {
    width: 8px;
    background: #e0e7ff;
}

::-webkit-scrollbar-thumb {
    background: #c7d2fe;
    border-radius: 8px;
}
</style>
