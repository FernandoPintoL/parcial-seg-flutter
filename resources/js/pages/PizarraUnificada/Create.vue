<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { router } from '@inertiajs/vue3';
import { ref, reactive } from 'vue';
import Swal from 'sweetalert2';

// Form data
const form = reactive({
    name: '',
    framework: 'flutter',
    description: '',
});

const isSubmitting = ref(false);

// Framework options
const frameworkOptions = [
    {
        value: 'flutter',
        label: 'Flutter',
        description: 'Aplicaciones móviles',
        icon: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.37zm.159 11.871L11.4 14.944l4.07 4.07 3.073-3.074-4.07-4.07z"/>
        </svg>`
    },
    {
        value: 'angular',
        label: 'Angular',
        description: 'Aplicaciones web',
        icon: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 6l1.5 15L12 23l8.5-2L22 6 12 2zm0 2.5l6.84 2.2L12 17.5 5.16 6.7 12 4.5z"/>
        </svg>`
    },
    {
        value: 'both',
        label: 'Ambos',
        description: 'Soporte completo',
        icon: `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`
    }
];

// Methods
const createPizarra = async () => {
    if (isSubmitting.value) return;

    isSubmitting.value = true;

    try {
        const response = await router.post('/pizarra-unificada', form);
        console.log('Pizarra creada:', response);

        Swal.fire({
            icon: 'success',
            title: 'Pizarra creada',
            text: 'Tu pizarra ha sido creada exitosamente',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error: any) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la pizarra' + (error.response?.data?.message || ''),
        });
    } finally {
        isSubmitting.value = false;
    }
};

const goBack = () => {
    router.visit('/pizarra-unificada');
};
</script>

<template>
    <AppLayout>

        <Head title="Crear Pizarra Unificada" />

        <div class="min-h-screen bg-gray-50">
            <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="bg-white rounded-lg shadow-md p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">
                        Crear Nueva Pizarra Unificada
                    </h1>

                    <form @submit.prevent="createPizarra" class="space-y-6">
                        <!-- Nombre -->
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Pizarra
                            </label>
                            <input id="name" v-model="form.name" type="text" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: Mi Aplicación Móvil" />
                        </div>

                        <!-- Framework -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Framework Inicial
                            </label>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div v-for="option in frameworkOptions" :key="option.value" class="relative">
                                    <input :id="`framework-${option.value}`" v-model="form.framework" type="radio"
                                        :value="option.value" class="sr-only" />
                                    <label :for="`framework-${option.value}`"
                                        class="block w-full p-4 text-center border-2 rounded-lg cursor-pointer transition-all duration-200"
                                        :class="form.framework === option.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'">
                                        <div class="flex flex-col items-center">
                                            <div class="w-8 h-8 mb-2" v-html="option.icon"></div>
                                            <span class="font-medium">{{ option.label }}</span>
                                            <span class="text-xs text-gray-500 mt-1">{{ option.description }}</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Descripción -->
                        <div>
                            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                                Descripción (Opcional)
                            </label>
                            <textarea id="description" v-model="form.description" rows="4"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe tu proyecto..."></textarea>
                        </div>

                        <!-- Botones -->
                        <div class="flex justify-end space-x-4">
                            <button type="button" @click="goBack"
                                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" :disabled="!form.name || !form.framework || isSubmitting"
                                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2">
                                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>
                                <span>{{ isSubmitting ? 'Creando...' : 'Crear Pizarra' }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
