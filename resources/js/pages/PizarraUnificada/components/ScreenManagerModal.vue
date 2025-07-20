<script setup lang="ts">
interface Screen {
  id: string | number
  name: string
  elements: any[]
  isHome?: boolean
}

interface Props {
  show: boolean
  screens: Screen[]
  currentScreenIndex: number
}

interface Emits {
  (e: 'close'): void
  (e: 'select-screen', index: number): void
  (e: 'add-screen', name: string): void
  (e: 'delete-screen', index: number): void
  (e: 'set-home-screen', index: number): void
}

defineProps<Props>()
defineEmits<Emits>()
</script> 
<template>
  <div v-if="show && screens.length > 0" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-blue-500 text-2xl">layers</span>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Gestión de Pantallas</h3>
          </div>
          <button @click="$emit('close')"
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
            }" @click="$emit('select-screen', index)">

            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-gray-800 dark:text-gray-200 truncate">
                {{ screen.name }}
              </h4>
              <div class="flex items-center space-x-1">
                <button v-if="!screen.isHome" @click.stop="$emit('set-home-screen', index)"
                  class="px-2 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors">
                  <span class="material-icons text-xs">home</span>
                </button>
                <button v-if="screens.length > 1" @click.stop="$emit('delete-screen', index)"
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
            @click="$emit('add-screen', 'Nueva Pantalla ' + (screens.length + 1))">
            <span class="material-icons text-4xl text-gray-400 group-hover:text-blue-500 transition-colors mb-2">add_circle_outline</span>
            <span class="text-gray-500 group-hover:text-blue-600 font-medium">Añadir Pantalla</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>