<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-purple-500 text-2xl">image</span>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Subir Imagen</h3>
          </div>
          <button @click="$emit('close')"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span class="material-icons text-gray-500">close</span>
          </button>
        </div>
      </div>
      <div class="p-6">
        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
          <input type="file" @change="handleFileChange" accept="image/*" class="hidden" id="imageInput" />
          <label for="imageInput" class="cursor-pointer flex flex-col items-center space-y-4">
            <span class="material-icons text-6xl text-gray-400">cloud_upload</span>
            <div>
              <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Selecciona una imagen</p>
              <p class="text-sm text-gray-500">PNG, JPG, GIF hasta 10MB</p>
            </div>
          </label>
        </div>

        <div v-if="previewImage" class="mt-6">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
            <img :src="previewImage" alt="Vista previa" class="max-w-full h-auto rounded-lg mx-auto" />
          </div>
          <div class="mt-4 flex justify-center space-x-3">
            <button @click="$emit('process')" :disabled="isProcessing"
              class="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2">
              <span class="material-icons text-sm" :class="{ 'animate-spin': isProcessing }">
                {{ isProcessing ? 'refresh' : 'auto_awesome' }}
              </span>
              <span>{{ isProcessing ? 'Procesando...' : 'Procesar Imagen' }}</span>
            </button>
            <button @click="clearImage"
              class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
              <span class="material-icons text-sm">clear</span>
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  show: boolean
  isProcessing?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'file-change', event: Event): void
  (e: 'process'): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false
})
const emit = defineEmits<Emits>()

const previewImage = ref<string | null>(null)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    emit('file-change', event)
  }
}

const clearImage = () => {
  previewImage.value = null
  emit('clear')
}
</script> 