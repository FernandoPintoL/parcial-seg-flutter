<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
    title: string;
    showMenu?: boolean;
    actions?: { icon: any; onClick: () => void; tooltip?: string }[];
}>();
</script>

<template>
    <div class="flex items-center justify-between px-4 py-2 bg-blue-600 text-white shadow">
        <button v-if="props.showMenu" class="mr-2 focus:outline-none">
            <!-- Ícono de menú tipo hamburguesa -->
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>
        <span class="font-semibold text-sm">{{ props.title }}</span>
        <div class="flex items-center gap-2">
            <button
                v-for="(action, idx) in props.actions"
                :key="idx"
                @click="action.onClick"
                class="p-1 rounded hover:bg-blue-700 focus:outline-none"
                :title="action.tooltip"
            >
                <component :is="action.icon" class="w-5 h-5"/>
            </button>
        </div>
    </div>
</template>
