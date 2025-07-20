<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-orange-500 text-2xl">account_tree</span>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Subir Diagrama de Clases</h3>
          </div>
          <button @click="$emit('close')"
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
            <button v-for="type in diagramTypes" :key="type.value" @click="selectedType = type.value"
              :class="selectedType === type.value ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
              class="p-3 rounded-lg transition-colors flex flex-col items-center space-y-1">
              <span class="material-icons text-sm">{{ type.icon }}</span>
              <span class="text-xs font-medium">{{ type.label }}</span>
            </button>
          </div>
        </div>

        <!-- Image Upload -->
        <div v-if="selectedType === 'image'"
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
          <input type="file" @change="handleFileChange" accept="image/*" class="hidden" id="diagramImageInput" />
          <label for="diagramImageInput" class="cursor-pointer flex flex-col items-center space-y-4">
            <span class="material-icons text-6xl text-gray-400">image</span>
            <div>
              <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona imagen del diagrama</p>
              <p class="text-sm text-gray-500">PNG, JPG, GIF hasta 10MB</p>
            </div>
          </label>
        </div>

        <!-- XML Upload -->
        <div v-else-if="selectedType === 'xml'"
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
          <input type="file" @change="handleFileChange" accept=".xml" class="hidden" id="diagramXmlInput" />
          <label for="diagramXmlInput" class="cursor-pointer flex flex-col items-center space-y-4">
            <span class="material-icons text-6xl text-gray-400">code</span>
            <div>
              <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona archivo XML</p>
              <p class="text-sm text-gray-500">Archivos .xml</p>
            </div>
          </label>
        </div>

        <!-- PlantUML Upload -->
        <div v-else-if="selectedType === 'plantuml'"
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
          <input type="file" @change="handleFileChange" accept=".puml,.plantuml" class="hidden" id="diagramPlantUmlInput" />
          <label for="diagramPlantUmlInput" class="cursor-pointer flex flex-col items-center space-y-4">
            <span class="material-icons text-6xl text-gray-400">schema</span>
            <div>
              <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona archivo PlantUML</p>
              <p class="text-sm text-gray-500">Archivos .puml, .plantuml</p>
            </div>
          </label>
        </div>

        <!-- Text Input -->
        <div v-else class="space-y-4">
          <textarea v-model="diagramContent" placeholder="Pega aquí el contenido del diagrama..." rows="8"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"></textarea>
        </div>

        <div class="mt-6 flex justify-center space-x-3">
          <button @click="processDiagram"
            :disabled="isProcessing || (!selectedFile && !diagramContent)"
            class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2">
            <span class="material-icons text-sm" :class="{ 'animate-spin': isProcessing }">
              {{ isProcessing ? 'refresh' : 'auto_awesome' }}
            </span>
            <span>{{ isProcessing ? 'Procesando...' : 'Procesar Diagrama' }}</span>
          </button>
          <button @click="clearData"
            class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
            <span class="material-icons text-sm">clear</span>
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

type DiagramType = 'image' | 'xml' | 'plantuml' | 'text'

interface Props {
  show: boolean
  isProcessing?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'file-change', file: File, type: DiagramType, extra?: any): void
  (e: 'content-change', content: string): void
  (e: 'process', type: DiagramType, data: File | string): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false
})
const emit = defineEmits<Emits>()

const selectedType = ref<DiagramType>('image')
const selectedFile = ref<File | null>(null)
const diagramContent = ref('')

const diagramTypes = [
  { value: 'image' as const, label: 'Imagen', icon: 'image' },
  { value: 'xml' as const, label: 'XML', icon: 'code' },
  { value: 'plantuml' as const, label: 'PlantUML', icon: 'schema' },
  { value: 'text' as const, label: 'Texto', icon: 'text_fields' }
]

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    selectedFile.value = file
    emit('file-change', file, selectedType.value, event)
  }
}

const processDiagram = () => {
  if (selectedType.value === 'text' && diagramContent.value) {
    emit('process', selectedType.value, diagramContent.value)
  } else if (selectedFile.value) {
    emit('process', selectedType.value, selectedFile.value)
  }
}

const clearData = () => {
  selectedFile.value = null
  diagramContent.value = ''
  emit('clear')
}

// Watch for content changes
watch(diagramContent, (newContent) => {
  if (newContent) {
    emit('content-change', newContent)
  }
})
</script> 