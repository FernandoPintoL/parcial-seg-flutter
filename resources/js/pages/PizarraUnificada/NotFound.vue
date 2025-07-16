<template>
    <AppLayout>

        <Head title="Pizarra No Encontrada" />

        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
            <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                <div class="mb-6">
                    <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>

                <h1 class="text-2xl font-bold text-gray-900 mb-4">
                    Pizarra No Encontrada
                </h1>

                <p class="text-gray-600 mb-6">
                    La pizarra que estás buscando no existe o no tienes permisos para acceder a ella.
                </p>

                <div class="space-y-3">
                    <button @click="goToList"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Ver Mis Pizarras
                    </button>

                    <button @click="createNew"
                        class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Crear Nueva Pizarra
                    </button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';

const goToList = () => {
    router.visit('/pizarra-unificada');
};

const createNew = () => {
    router.visit('/pizarra-unificada/create');
};
</script>
