<script setup lang="ts">
import { ref, onMounted, defineProps, PropType } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import axios from 'axios';
import type { FlutterWidget } from '@/types/Pizarra';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/AppLayout.vue';

const props = defineProps({
  widgets: {
    type: Array as PropType<FlutterWidget[]>,
    required: true,
  },
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Widgets',
        href: '/widget',
    },
];

const localWidgets = ref<FlutterWidget[]>([]);
const loading = ref<boolean>(true);
const error = ref<string>("");

const fetchWidgets = async () => {
    loading.value = true;
    error.value = "";
    try {
        const response = await axios.get('/widget/query');
        localWidgets.value = response.data;
    } catch (err : any) {
        error.value = 'Error al cargar los widgets';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const deleteWidget = async (id : number) => {
  if (confirm('¿Estás seguro de que deseas eliminar este widget?')) {
    try {
      await axios.delete(`/widget/${id}`);
      await fetchWidgets();
    } catch (err : any) {
      error.value = 'Error al eliminar el widget';
      console.error(err);
    }
  }
};

onMounted(() => {
    localWidgets.value = props.widgets;
    loading.value = false;
});
</script>

<template>
    <Head title="Widgets" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="container mx-auto p-4">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold">Gestor de Widgets</h1>
                <Link
                    href="/widget/create"
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Crear Nuevo Widget
                </Link>
            </div>

            <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {{ error }}
            </div>

            <div v-if="loading" class="text-center py-4">
                <p>Cargando widgets...</p>
            </div>

            <div v-else-if="widgets.length === 0" class="text-center py-4">
                <p>No hay widgets disponibles. Crea uno nuevo.</p>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead>
                    <tr>
                        <th class="py-2 px-4 border-b">ID</th>
                        <th class="py-2 px-4 border-b">Tipo</th>
                        <th class="py-2 px-4 border-b">Label</th>
                        <th class="py-2 px-4 border-b">Categoría</th>
                        <th class="py-2 px-4 border-b">Código Flutter</th>
                        <th class="py-2 px-4 border-b">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="widget in localWidgets" :key="widget.id" class="hover:bg-gray-100">
                        <td class="py-2 px-4 border-b">{{ widget.id }}</td>
                        <td class="py-2 px-4 border-b">{{ widget.type }}</td>
                        <td class="py-2 px-4 border-b">{{ widget.label }}</td>
                        <td class="py-2 px-4 border-b">
                            {{ (widget.categoria?.category).toUpperCase() || 'Sin categoría' }}
                        </td>
                        <td class="py-2 px-4 border-b">
                            <div v-if="widget.code_string" class="max-w-xs truncate" :title="widget.code_string">
                                {{ widget.code_string.substring(0, 30) }}{{ widget.code_string.length > 30 ? '...' : '' }}
                            </div>
                            <div v-else class="text-gray-400 italic">
                                Sin código
                            </div>
                        </td>
                        <td class="py-2 px-4 border-b">
                            <div class="flex space-x-2">
                                <Link
                                    :href="`/widget/${widget.id}/edit`"
                                    class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm"
                                >
                                    Editar
                                </Link>
                                <button
                                    @click="deleteWidget(widget.id)"
                                    class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </AppLayout>

</template>

<style scoped>
.container {
  max-width: 1200px;
}
</style>
