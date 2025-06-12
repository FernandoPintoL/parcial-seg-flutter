<script setup lang="ts">
defineProps({
    isLoading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['reiniciar']);

const handleReiniciar = () => {
    emit('reiniciar');
};
</script>

<template>
    <div class="flex min-h-full w-full items-center justify-center">
        <div class="rounded-lg bg-gray-100 p-4 text-center transition-colors dark:bg-gray-700">
            <p class="mb-3 text-lg font-medium">{{ isLoading ? 'Cargando pantalla...' : 'No hay pantalla disponible' }}</p>

            <button
                @click="handleReiniciar"
                class="mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
                Reiniciar pantalla
            </button>
        </div>
    </div>
</template>

<style scoped>

</style>
