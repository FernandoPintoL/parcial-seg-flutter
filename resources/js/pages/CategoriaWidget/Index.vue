<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import axios from 'axios';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/AppLayout.vue';

const props = defineProps({
  categorias: {
    type: Array,
    required: true,
  },
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categorías de Widgets',
        href: '/categoria-widget',
    },
];

const localCategorias = ref(props.categorias);
const loading = ref(false);
const error = ref("");

const fetchCategorias = async () => {
  try {
    loading.value = true;
    const response = await axios.get('/categoria-widget');
    localCategorias.value = response.data.categorias;
    loading.value = false;
  } catch (err) {
    error.value = 'Error al cargar las categorías';
    loading.value = false;
    console.error(err);
  }
};

const deleteCategoria = async (id) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
    try {
      await axios.delete(`/categoria-widget/${id}`);
      await fetchCategorias();
    } catch (err) {
      error.value = 'Error al eliminar la categoría';
      console.error(err);
    }
  }
};

onMounted(() => {
  // If props are empty, fetch data
  if (!props.categorias || props.categorias.length === 0) {
    fetchCategorias();
  }
});
</script>

<template>
  <Head title="Categorías de Widgets" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Gestor de Categorías de Widgets</h1>
        <Link
          href="/categoria-widget/create"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Crear Nueva Categoría
        </Link>
      </div>

      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </div>

      <div v-if="loading" class="text-center py-4">
        <p>Cargando categorías...</p>
      </div>

      <div v-else-if="localCategorias.length === 0" class="text-center py-4">
        <p>No hay categorías disponibles. Crea una nueva.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th class="py-2 px-4 border-b">ID</th>
              <th class="py-2 px-4 border-b">Categoría</th>
              <th class="py-2 px-4 border-b">Etiqueta</th>
              <th class="py-2 px-4 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="categoria in localCategorias" :key="categoria.id" class="hover:bg-gray-100">
              <td class="py-2 px-4 border-b">{{ categoria.id }}</td>
              <td class="py-2 px-4 border-b">{{ categoria.category }}</td>
              <td class="py-2 px-4 border-b">{{ categoria.label || 'Sin etiqueta' }}</td>
              <td class="py-2 px-4 border-b">
                <div class="flex space-x-2">
                  <Link
                    :href="`/categoria-widget/${categoria.id}/edit`"
                    class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    @click="deleteCategoria(categoria.id)"
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
