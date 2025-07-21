<script setup lang="ts">
interface Props {
  show: boolean
  code: string
  framework: string
}

interface Emits {
  (e: 'close'): void
  (e: 'copy'): void
  (e: 'download'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const copyCode = () => {
  if (props.code) {
    navigator.clipboard.writeText(props.code)
    emit('copy')
  }
}

const downloadCode = () => {
  if (props.code) {
    const blob = new Blob([props.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-code.${getFileExtension(props.framework)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    emit('download')
  }
}

const getFileExtension = (framework: string): string => {
  const extensions: Record<string, string> = {
    'flutter': 'dart',
    'react': 'jsx',
    'vue': 'vue',
    'angular': 'ts',
    'html': 'html',
    'css': 'css'
  }
  return extensions[framework.toLowerCase()] || 'txt'
}
</script>
<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-blue-500 text-2xl">code</span>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              Código Generado ({{ framework.toUpperCase() }})
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
            <button @click="$emit('close')"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <span class="material-icons text-gray-500">close</span>
            </button>
          </div>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[70vh]">
        <pre class="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm font-mono border">{{
          code || 'Generando código...' }}</pre>
      </div>
    </div>
  </div>
</template>
