<script setup lang="ts">
import { ref } from 'vue';
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
    addElement: [element: UnifiedElement];
    selectElement: [element: UnifiedElement | null];
    updateElement: [element: UnifiedElement];
    updateElementProperty: [propertyName: string, value: any];
    removeElement: [element: UnifiedElement];
    toggleScreenManager: [];
}

defineProps<Props>();
const emit = defineEmits<Emits>();
function handleDeleteElement(element: any) {
  emit('removeElement', element);
  emit('selectElement', null);
}

// Sidebar state
const tabs = ['Pizarras', 'Pantallas', 'Componentes'];
const activeTab = ref('Pizarras');
const sidebarAccordions = {
  Pizarras: [
    { title: 'Mis pizarras', items: ['Pizarra 1', 'Pizarra 2'] },
    { title: 'Favoritas', items: ['Favorita 1'] }
  ],
  Pantallas: [
    { title: 'Pantallas del proyecto', items: ['Pantalla Principal'] }
  ],
  Componentes: [
    { title: 'Navegación', items: ['Cajón de Navegación', 'Barra'] },
    { title: 'Entrada', items: ['TextField', 'Checkbox'] }
  ]
};
</script>

<template>
  <div class="workspace-layout flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
    <!-- Sidebar -->
    <aside class="sidebar bg-white/95 dark:bg-gray-900/90 border-r border-gray-200 dark:border-gray-700 min-w-[240px] max-w-xs flex flex-col h-full shadow-xl">
      <!-- Tabs -->
      <div class="flex border-b">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          :class="['flex-1 py-2 text-center font-semibold transition', activeTab === tab ? 'bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 text-blue-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200']"
        >
          {{ tab }}
        </button>
      </div>
      <!-- Accordions -->
      <div class="flex-1 overflow-y-auto p-3">
        <div
          v-for="section in sidebarAccordions[activeTab as keyof typeof sidebarAccordions]"
          :key="section.title"
          class="mb-3"
        >
          <details class="group" open>
            <summary class="font-bold cursor-pointer flex items-center gap-2 py-1 px-2 rounded group-open:bg-blue-50 dark:group-open:bg-blue-900/30">
              <span class="material-icons text-blue-500 dark:text-blue-300">folder</span>
              {{ section.title }}
            </summary>
            <ul class="pl-6 pt-2">
              <li v-for="item in section.items" :key="item" class="py-1 px-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer">
                {{ item }}
              </li>
            </ul>
          </details>
        </div>
      </div>
    </aside>

    <!-- Canvas centrado -->
    <main class="flex-1 flex justify-center items-center relative overflow-auto">
      <div class="canvas-container bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 my-8 mx-auto max-w-3xl min-h-[600px] flex items-center justify-center">
        <UnifiedCanvas
          :current-screen="currentScreen"
          :available-widgets="availableWidgets"
          :selected-framework="selectedFramework"
          @select-element="(element) => emit('selectElement', element)"
          @remove-element="handleDeleteElement"
          @update-element="(element) => emit('updateElement', element)"
          @add-element="(element) => emit('addElement', element)"
        />
      </div>
    </main>

    <!-- Panel de propiedades a la derecha -->
    <aside v-if="showPropertiesPanel && !isPanelsCollapsed" class="properties-panel bg-white/95 dark:bg-gray-900/90 border-l border-gray-200 dark:border-gray-700 w-[340px] max-w-xs flex flex-col h-full shadow-xl">
      <UnifiedPropertiesPanel
        :selected-element="selectedElement"
        :available-widgets="availableWidgets"
        :framework="selectedFramework"
        @update-element="(element) => emit('updateElement', element)"
        @update-property="(propertyName, value) => emit('updateElementProperty', propertyName, value)"
        @delete-element="handleDeleteElement"
        @duplicate-element="emit('addElement', $event)"
      />
    </aside>
  </div>
</template>

<style scoped>
.workspace-layout {
  min-height: 100vh;
}
.sidebar {
  min-width: 240px;
  max-width: 320px;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 2px 0 8px rgba(59, 130, 246, 0.05);
  z-index: 10;
}
.properties-panel {
  width: 340px;
  max-width: 100vw;
  min-width: 240px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: 100vh;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: -2px 0 8px rgba(59, 130, 246, 0.08);
}
.canvas-container {
  min-width: 350px;
  min-height: 600px;
  max-width: 900px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  border-radius: 24px;
  border: 1.5px solid #e0e7ef;
  background: linear-gradient(135deg, #f8fafc 80%, #e0e7ef 100%);
  position: relative;
}
</style>
