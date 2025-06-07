<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
    show: boolean;
    flutterCode: string;
    selectedCodeTab: number;
    screens: any[];
    generateNavigationDrawerCode: () => string;
    generateScreenCode: (index: number) => string;
    downloadFlutterProject: () => void;
    copyFlutterCode: () => void;
    setSelectedCodeTab: (tab: number) => void;
    initNavigationDrawer: () => void;
}>();
</script>

<template>
    <div v-if="show" class="rounded-md bg-gray-800 p-4 text-white">
        <div class="mb-2 flex items-center justify-between">
            <h3 class="font-medium">Código Flutter</h3>
            <div class="flex gap-2">
                <button @click="props.downloadFlutterProject"
                        class="rounded bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700">
                    Descargar Proyecto
                </button>
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
        </div>
        <pre v-if="props.selectedCodeTab === 0" class="max-h-96 overflow-auto text-sm">{{ props.flutterCode }}</pre>
        <pre v-else-if="props.selectedCodeTab === 1" class="max-h-96 overflow-auto text-sm">{{ props.generateNavigationDrawerCode() }}</pre>
        <pre v-else class="max-h-96 overflow-auto text-sm">{{ props.generateScreenCode(props.selectedCodeTab - 2) }}</pre>
    </div>
</template>
