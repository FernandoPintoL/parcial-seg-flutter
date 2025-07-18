<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import type { PizarraUnificada, User } from '@/Data/PizarraUnificada';

// Core Components
import PizarraHeader from '@/pages/PizarraUnificada/components/PizarraHeader.vue';
import PizarraWorkspace from '@/pages/PizarraUnificada/components/PizarraWorkspace.vue';
import PizarraToolbar from '@/pages/PizarraUnificada/components/PizarraToolbar.vue';
// import PizarraModals from './PizarraModals.vue';
// Update the import path below if the file exists elsewhere, for example:
// import PizarraModals from '@/pages/PizarraUnificada/components/PizarraModals.vue';

// Composables
import { usePizarraState } from '@/pages/PizarraUnificada/composables/usePizarraState';
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
const {
    // Project State
    projectName,
    selectedFramework,
    screens,
    currentScreenIndex,
    currentScreen,
    selectedElement,
    availableWidgets,

    // Actions
    initializeScreens,
    updateAvailableWidgets,
    savePizarra,
    addWidget,
    addElement,
    selectElement,
    updateElement,
    updateElementProperty,
    removeElement,

    // Screen Management
    addScreen,
    deleteScreen,
    selectScreen,
    setHomeScreen
} = usePizarraState(props);

// Collaboration Management
const {
    collaborationService,
    socketConnected,
    initializeCollaboration,
    cleanup: cleanupCollaboration
} = usePizarraCollaboration(props, {
    onElementAdded: () => {
        // Handle collaborative element addition
    },
    onElementUpdated: () => {
        // Handle collaborative element update
    },
    onElementDeleted: () => {
        // Handle collaborative element deletion
    }
});

// UI State Management
const {
    isDarkMode,
    showWidgetPalette,
    showPropertiesPanel,
    showScreenManager,
    isPanelsCollapsed,

    // Actions
    toggleDarkMode,
    toggleWidgetPalette,
    togglePropertiesPanel,
    toggleScreenManager,
    togglePanelsCollapse,
    toggleFullscreen,
    applyDarkMode
} = usePizarraUI();

// Framework switching
const switchFramework = (framework: 'flutter' | 'angular' | 'both') => {
    selectedFramework.value = framework;
    updateAvailableWidgets();
    savePizarra();

    // Emit framework change to collaborators
    if (collaborationService.value) {
        collaborationService.value.emitFrameworkSwitched(framework);
    }
};

// Initialize component
onMounted(() => {
    initializeCollaboration();
    initializeScreens();
    updateAvailableWidgets();
    applyDarkMode();
});

onUnmounted(() => {
    cleanupCollaboration();
});
</script>

<template>
    <div>

        <Head :title="projectName" />

        <AppLayout :breadcrumbs="breadcrumbs">
            <!-- Header -->
            <template #header>
                <PizarraHeader :project-name="projectName" :selected-framework="selectedFramework"
                    :show-widget-palette="showWidgetPalette" :show-properties-panel="showPropertiesPanel"
                    :is-panels-collapsed="isPanelsCollapsed" :is-dark-mode="isDarkMode"
                    @switch-framework="switchFramework" @toggle-widget-palette="toggleWidgetPalette"
                    @toggle-properties-panel="togglePropertiesPanel" @toggle-panels-collapse="togglePanelsCollapse"
                    @toggle-fullscreen="toggleFullscreen" @toggle-dark-mode="toggleDarkMode"
                    @save-pizarra="savePizarra" />
            </template>

            <!-- Main Workspace -->
            <PizarraWorkspace :current-screen="currentScreen" :available-widgets="availableWidgets"
                :selected-framework="selectedFramework" :selected-element="selectedElement"
                :show-widget-palette="showWidgetPalette" :show-properties-panel="showPropertiesPanel"
                :is-panels-collapsed="isPanelsCollapsed" :socket-connected="socketConnected"
                @add-widget="(widgetType) => { console.log('🎯 Core add-widget:', widgetType); addWidget(widgetType); }"
                @add-element="(element) => { console.log('➕ Core add-element:', element.type, element.framework); addElement(element); }"
                @select-element="(element) => { console.log('🎯 Core select-element:', element.id); selectElement(element); }"
                @update-element="(element) => { console.log('📝 Core update-element:', element.id); updateElement(element); }"
                @update-element-property="(propertyName, value) => { console.log('🔧 Core update-element-property:', propertyName, value); updateElementProperty(propertyName, value); }"
                @remove-element="(element) => { console.log('🗑️ Core remove-element:', element.id); removeElement(element); }"
                @toggle-screen-manager="toggleScreenManager" />

            <!-- Floating Toolbar -->
            <PizarraToolbar />

            <!-- Modals and Overlays -->
            <!-- TODO: Create PizarraModals component -->
            <!--
            <PizarraModals :show-screen-manager="showScreenManager" :screens="screens"
                :current-screen-index="currentScreenIndex" @close-screen-manager="toggleScreenManager"
                @add-screen="addScreen" @delete-screen="deleteScreen" @select-screen="selectScreen"
                @set-home-screen="setHomeScreen" />
            -->
        </AppLayout>
    </div>
</template>
