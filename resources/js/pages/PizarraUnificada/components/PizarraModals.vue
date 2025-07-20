<script setup lang="ts">
import type { UnifiedScreen } from '@/Data/PizarraUnificada';
import ScreenManagerModal from './ScreenManagerModal.vue';
import ImageUploadModal from './ImageUploadModal.vue';
import DiagramUploadModal from './DiagramUploadModal.vue';
import CodeViewerModal from './CodeViewerModal.vue';

interface Props {
    showScreenManager: boolean;
    screens: UnifiedScreen[];
    currentScreenIndex: number;
    showImageUpload?: boolean;
    showDiagramUpload?: boolean;
    showCodeViewer?: boolean;
    selectedImage?: File | null;
    selectedDiagram?: File | null;
    diagramContent?: string;
    diagramType?: string;
    codeContent?: string;
    codeLanguage?: string;
}

interface Emits {
    closeScreenManager: [];
    addScreen: [screenName: string];
    deleteScreen: [index: number];
    selectScreen: [index: number];
    setHomeScreen: [index: number];
    closeImageUpload: [];
    closeDiagramUpload: [];
    closeCodeViewer: [];
    imageUploaded: [file: File];
    diagramUploaded: [file: File, content: string, type: string];
    codeProcessed: [code: string];
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
    <div>
        <!-- Screen Manager Modal -->
        <ScreenManagerModal 
            :show="showScreenManager"
            :screens="screens"
            :current-screen-index="currentScreenIndex"
            @close="$emit('closeScreenManager')"
            @add-screen="$emit('addScreen', $event)"
            @delete-screen="$emit('deleteScreen', $event)"
            @select-screen="$emit('selectScreen', $event)"
            @set-home-screen="$emit('setHomeScreen', $event)" />

        <!-- Image Upload Modal -->
        <ImageUploadModal 
            :show="showImageUpload ?? false"
            :selected-image="selectedImage"
            @close="$emit('closeImageUpload')"
            @image-uploaded="$emit('imageUploaded', $event)" />

        <!-- Modal de carga de diagramas -->
        <DiagramUploadModal 
            :show="showDiagramUpload ?? false"
            :selected-file="selectedDiagram"
            :diagram-content="diagramContent"
            :diagram-type="diagramType"
            @close="$emit('closeDiagramUpload')"
            @diagram-uploaded="$emit('diagramUploaded', $event.file, $event.content, $event.type)" />

        <!-- Modal de visor de código -->
        <CodeViewerModal 
            :show="showCodeViewer ?? false"
            :code="codeContent ?? ''"
            :framework="codeLanguage ?? 'flutter'"
            @close="$emit('closeCodeViewer')"
            @code-processed="$emit('codeProcessed', $event)" />

            
    </div>
</template>

<style scoped>
/* Modal overlay styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
}

.dark .modal-content {
    background: #1f2937;
    color: #f9fafb;
}
</style> 