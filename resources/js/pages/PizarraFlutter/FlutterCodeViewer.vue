<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
    show: boolean;
    flutterCode: string;
    selectedCodeTab: number;
    screens: any[];
    generateNavigationDrawerCode: () => string;
    generateScreenCode: (index: number) => string;
    downloadFlutterProject: (downloadType?: string) => void;
    copyFlutterCode: () => void;
    setSelectedCodeTab: (tab: number) => void;
    initNavigationDrawer: () => void;
    improvedCode?: string;
    generateImprovedCode?: () => void;
}>();

/**
 * Format the code to highlight different sections with colors and improve readability
 * @param code The code to format
 * @returns The formatted code with HTML tags for syntax highlighting
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatCode(code: string): string {
    if (!code) return '';

    // First, escape HTML to prevent XSS
    let formattedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Add extra line breaks between widget declarations for better readability
    formattedCode = formattedCode
        .replace(/(\w+)\(/g, '\n\n$1(')
        .replace(/^[\n\s]+/, ''); // Remove leading whitespace

    // Aplica resaltado de sintaxis
    formattedCode = formattedCode
        // Resalta nombres de widgets Flutter (palabras capitalizadas seguidas de paréntesis)
        .replace(/\b([A-Z]\w+)(\()/g, '<span class="class-name">$1</span>$2')

        // Resalta palabras clave - AQUÍ ESTÁ EL PROBLEMA
        .replace(/\b(const|final|var|void|return|if|else|for|while|switch|case|break|continue|class|extends|implements|new|this|super|static|import|export|as|show|hide)\b/g,
            '<span class="keyword">$1</span>') // Cambiado de "flutter-keyword" a "keyword"

        // Resalta strings
        .replace(/(['"])(.*?)\1/g, '<span class="string">$1$2$1</span>')

        // Resalta números
        .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>')

        // Resalta comentarios
        .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')

        // Resalta nombres de funciones
        .replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>');

    return formattedCode;

}

// Función simple para escapar HTML
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function escapeHTML(code: string): string {
    if (!code) return '';
    return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

</script>

<template>
    <div v-if="show" class="rounded-md bg-gray-800 p-4 text-white">
        <div class="mb-2 flex items-center justify-between">
            <h3 class="font-medium">Código Flutter</h3>
            <div class="flex gap-2">
                <div class="relative inline-block">
                    <button @click="props.downloadFlutterProject('complete')"
                            class="rounded bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700">
                        Descargar Proyecto
                    </button>
                    <button @click="props.downloadFlutterProject('individual')"
                            class="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700 ml-2">
                        Descargar Archivo
                    </button>
                </div>
                <button @click="props.copyFlutterCode"
                        class="rounded bg-gray-700 px-2 py-1 text-sm hover:bg-gray-600">Copiar
                </button>
            </div>
        </div>
        <div class="mb-2 flex border-b border-gray-700">
            <button
                @click="props.setSelectedCodeTab(0)"
                class="px-4 py-2 text-sm"
                :class="props.selectedCodeTab === 0 ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-400 hover:text-white'"
            >
                App Completa
            </button>
            <button
                @click="() => { props.setSelectedCodeTab(1); props.initNavigationDrawer(); }"
                class="px-4 py-2 text-sm"
                :class="props.selectedCodeTab === 1 ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-400 hover:text-white'"
            >
                NavigationDrawer
            </button>
            <button
                v-for="(screen, index) in props.screens"
                :key="screen.id"
                @click="props.setSelectedCodeTab(index + 2)"
                class="px-4 py-2 text-sm"
                :class="props.selectedCodeTab === index + 2 ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-400 hover:text-white'"
            >
                {{ screen.name }}
            </button>
            <button
                v-if="props.generateImprovedCode"
                @click="() => { props.setSelectedCodeTab(-1); props.generateImprovedCode?.(); }"
                class="px-4 py-2 text-sm"
                :class="props.selectedCodeTab === -1 ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-400 hover:text-white'"
            >
                Código Mejorado
            </button>
        </div>
        <div v-if="props.selectedCodeTab === 0" class="max-h-96 overflow-auto text-sm">
<!--            <pre class="code-block" v-html="formatCode(props.flutterCode)"></pre>-->
            <pre class="code-block">{{ props.flutterCode }}</pre>
        </div>
        <div v-else-if="props.selectedCodeTab === 1" class="max-h-96 overflow-auto text-sm">
<!--            <pre class="code-block" v-html="formatCode(props.generateNavigationDrawerCode())"></pre>-->
            <pre class="code-block">{{ props.generateNavigationDrawerCode() }}</pre>
        </div>
        <div v-else-if="props.selectedCodeTab === -1" class="max-h-96 overflow-auto text-sm">
            <div v-if="props.improvedCode" class="mb-2">
                <pre class="code-block">{{ props.improvedCode }}</pre>
            </div>
            <div v-else class="flex justify-center items-center h-32">
                <p class="text-gray-400">Generando código mejorado compatible con Flutter 3.0.0 y Dart 2.17.0...</p>
            </div>
        </div>
        <div v-else class="max-h-96 overflow-auto text-sm">
<!--            <pre class="code-block" v-html="formatCode(props.generateScreenCode(props.selectedCodeTab - 2))"></pre>-->
            <pre class="code-block">{{ props.generateScreenCode(props.selectedCodeTab - 2) }}</pre>
        </div>
    </div>
</template>

<style scoped>
.code-block {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    padding: 1rem;
    background-color: #1e1e1e;
    border-radius: 0.375rem;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
    color: #d4d4d4; /* Color claro para el texto */
}

/* Add some syntax highlighting */
.code-block :deep(.keyword) {
    color: #569cd6;
}

.code-block :deep(.string) {
    color: #ce9178;
}

.code-block :deep(.number) {
    color: #b5cea8;
}

.code-block :deep(.comment) {
    color: #6a9955;
}

.code-block :deep(.class-name) {
    color: #4ec9b0;
}

.code-block :deep(.function) {
    color: #dcdcaa;
}
</style>
