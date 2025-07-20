<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import type { PizarraUnificada, User } from '@/Data/PizarraUnificada';

// Core Components
import PizarraHeader from '@/pages/PizarraUnificada/components/PizarraHeader.vue';
import PizarraWorkspace from '@/pages/PizarraUnificada/components/PizarraWorkspace.vue';
import PizarraToolbar from '@/pages/PizarraUnificada/components/PizarraToolbar.vue';
import PizarraModals from '@/pages/PizarraUnificada/components/PizarraModals.vue';
import ImageUploadModal from '@/pages/PizarraUnificada/components/ImageUploadModal.vue';
import DiagramUploadModal from '@/pages/PizarraUnificada/components/DiagramUploadModal.vue';
import CodeViewerModal from '@/pages/PizarraUnificada/components/CodeViewerModal.vue';
import UnifiedAIChat from '@/pages/Chat/UnifiedAIChat.vue';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import UnifiedCanvas from '../UnifiedCanvas.vue';
import UnifiedPropertiesPanel from '../UnifiedPropertiesPanel.vue';

// Composables
import { usePizarraState } from '@/pages/PizarraUnificada/composables/usePizarraState';
import { useElementManagement } from '@/pages/PizarraUnificada/composables/useElementManagement';
import { usePizarraServices } from '../composables/usePizarraServices';
import { useProcessingServices } from '../composables/useProcessingServices';
import { usePizarraStorage } from '../composables/usePizarraStorage';
import { usePizarraCollaboration } from '@/pages/PizarraUnificada/composables/usePizarraCollaboration';
import { usePizarraUI } from '@/pages/PizarraUnificada/composables/usePizarraUI';

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
    selectedFramework: pizarraState.selectedFramework.value
});

// Pizarra Services
const pizarraServices = usePizarraServices({
    pizarra: props.pizarra,
    defaultFramework: pizarraState.selectedFramework.value
});

// Processing Services
const processingServices = useProcessingServices({
    defaultFramework: pizarraState.selectedFramework.value
});

// Storage Services
const storageServices = usePizarraStorage({
    pizarra: props.pizarra
});

// Collaboration Management
const collaboration = usePizarraCollaboration({
    user: props.user,
    pizarra: props.pizarra,
    creador: props.creador,
    isCreador: props.isCreador,
    colaboradores: props.colaboradores
}, {
    onElementAdded: (element) => {
        console.log('Element added by collaborator:', element);
    },
    onElementUpdated: (element) => {
        console.log('Element updated by collaborator:', element);
    },
    onElementDeleted: (elementId) => {
        console.log('Element deleted by collaborator:', elementId);
    },
    onFrameworkSwitched: (framework) => {
        console.log('Framework switched by collaborator:', framework);
    }
});

// UI State Management
const {
    isDarkMode,
    showWidgetPalette,
    showPropertiesPanel,
    showScreenManager,
    isPanelsCollapsed,
    showAIChat,
    showCollaborationChat,
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
    toggleCollaborationChat,
    toggleImageUpload,
    toggleDiagramUpload,
    toggleCodeViewer,
    applyDarkMode
} = usePizarraUI();

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
        await storageServices.savePizarra({
            name: pizarraState.projectName.value,
            type: pizarraState.projectType.value,
            screens: pizarraState.screens.value,
            elements: pizarraState.currentScreen.value?.elements || []
        });
        console.log('✅ Pizarra guardada successfully');
    } catch (error) {
        console.error('❌ Error saving pizarra:', error);
    }
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
    } else {
        // Si element es null, cerrar el panel de propiedades
        showPropertiesPanel.value = false;
    }
};

const openPropertiesPanel = (element: any) => {
    // Seleccionar el elemento y abrir el panel de propiedades
    elementManagement.selectElement(element);
    togglePropertiesPanel();
    
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
        const success = elementManagement.updateElementProperties(
            elementManagement.selectedElement.value.id,
            { [propertyName]: value }
        );
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
    widgets.forEach(widget => {
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
    
    console.log('PizarraUnificadaCore mounted');
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
          @save-pizarra="savePizarra" />
      </template>

      <!-- Layout con menú lateral fijo y canvas centrado -->
      <div class="workspace-layout flex h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 overflow-hidden">
        <!-- Menú lateral fijo -->
        <aside class="sidebar bg-white/95 dark:bg-gray-900/95 border-r border-indigo-200 dark:border-blue-900 w-[300px] flex flex-col h-full shadow-2xl rounded-tr-3xl rounded-br-3xl transition-all duration-300 z-20 flex-shrink-0">
          <!-- Tabs -->
          <div class="flex border-b border-indigo-100 dark:border-blue-900 flex-shrink-0">
            <button
              v-for="tab in tabs"
              :key="tab"
              @click="activeTab = tab"
              :class="['flex-1 py-2 text-center font-bold tracking-wide transition-all duration-200',
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-200 via-blue-200 to-purple-200 text-indigo-900 dark:text-white shadow-md scale-105'
                  : 'hover:bg-indigo-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200']"
            >
              {{ tab }}
            </button>
          </div>
          <!-- Contenido dinámico del menú -->
          <div class="flex-1 overflow-y-auto p-4 transition-all duration-300">
            <!-- Pantallas -->
            <template v-if="activeTab === 'Pantallas'">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-indigo-700 dark:text-indigo-200 font-semibold">Pantallas</h3>
                <button @click="addScreen('Nueva pantalla')" class="ml-2 px-2 py-1 rounded bg-indigo-500 text-white text-xs hover:bg-indigo-600 transition">+ Agregar</button>
              </div>
              <ul>
                <li v-for="(pantalla, idx) in pantallas" :key="pantalla.id" class="py-2 px-3 rounded-lg flex items-center justify-between hover:bg-indigo-100 dark:hover:bg-blue-900 cursor-pointer mb-1"
                  :class="{'bg-indigo-200 dark:bg-blue-800': pizarraState.currentScreen.value?.id === pantalla.id}">
                  <span @click="selectScreen(idx)">{{ pantalla.name || 'Pantalla ' + (idx+1) }}</span>
                  <button @click.stop="deleteScreen(idx)" class="ml-2 text-red-500 hover:text-red-700 text-xs">🗑️</button>
                </li>
              </ul>
            </template>
            <!-- Elementos (Componentes) -->
            <template v-else-if="activeTab === 'Elementos'">
              <h3 class="text-indigo-700 dark:text-indigo-200 font-semibold mb-2">Componentes disponibles</h3>
              <ul>
                <li v-for="comp in componentes" :key="comp.type" class="py-2 px-3 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer mb-1 flex items-center gap-2"
                  @click="addWidget(comp.type)">
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
                <div class="flex flex-1 flex-col items-center justify-center text-center text-indigo-400 dark:text-indigo-200 px-6">
                  <span class="material-icons text-6xl mb-4">touch_app</span>
                  <p class="text-lg font-semibold mb-2">Selecciona un elemento</p>
                  <p class="text-sm">Haz click en un elemento del canvas para ver y editar sus propiedades aquí.</p>
                </div>
              </template>
            </template>
          </div>
        </aside>

        <!-- Canvas centrado -->
        <main class="flex-1 flex justify-center items-center relative overflow-hidden">
          <div class="canvas-container bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl border border-indigo-200 dark:border-blue-900 p-4 mx-4 my-4 w-full h-full max-w-5xl max-h-[calc(100vh-2rem)] flex items-center justify-center transition-all duration-300">
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
        @toggle-code-viewer="toggleCodeViewer"
        @toggle-collaboration-chat="toggleCollaborationChat" />

      <!-- Modals and Overlays -->
      <PizarraModals 
        :show-screen-manager="showScreenManager" 
        :screens="pizarraState.screens.value"
        :current-screen-index="pizarraState.currentScreenIndex.value" 
        @close-screen-manager="toggleScreenManager"
        @add-screen="addScreen" 
        @delete-screen="deleteScreen" 
        @select-screen="selectScreen"
        @set-home-screen="setHomeScreen" />

      <!-- AI Chat Modal -->
      <UnifiedAIChat
        v-if="showAIChat"
        :framework="pizarraState.selectedFramework.value as 'flutter' | 'angular' | 'vue' | 'react'"
        :is-open="showAIChat"
        :on-close="() => toggleAIChat()"
        :on-widgets-generated="addAIWidgetsToCanvas" />
      <!-- Collaborative Chat Modal -->
      <ChatColaborativo
        v-if="showCollaborationChat && collaboration.socketConnected.value && collaboration.collaborationService"
        :collaboration-service="collaboration.collaborationService as any"
        :room-id="collaboration.roomId.value"
        :current-user="collaboration.currentUser.value"
        :show-chat="showCollaborationChat"
        @close="toggleCollaborationChat"
        @send-message="collaboration.emitChatMessage"
        @typing="collaboration.emitTyping" />
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
        @close="toggleImageUpload" />
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
        @close="toggleDiagramUpload" />
      <!-- Code Viewer Modal -->
      <CodeViewerModal
        v-if="showCodeViewer"
        :show="showCodeViewer"
        :code="pizarraServices.generatedCode.value"
        :framework="pizarraState.selectedFramework.value"
        @close="toggleCodeViewer"
        @download="() => pizarraServices.downloadCode(pizarraState.projectName.value, pizarraState.selectedFramework.value)"
        @copy="pizarraServices.copyCode" />
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
  background: rgba(255,255,255,0.95);
  box-shadow: 4px 0 24px 0 rgba(99,102,241,0.08);
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
  box-shadow: 0 8px 32px rgba(99,102,241,0.10);
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