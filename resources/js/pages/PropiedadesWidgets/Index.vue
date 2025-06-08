<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import axios from 'axios';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/AppLayout.vue';

const props = defineProps({
  propiedades: {
    type: Array,
    required: true,
  },
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Propiedades de Widgets',
        href: '/propiedad-widget',
    },
];

const localPropiedades = ref(props.propiedades);
const loading = ref(false);
const error = ref("");

const fetchPropiedades = async () => {
  try {
    loading.value = true;
    const response = await axios.get('/propiedad-widget');
    localPropiedades.value = response.data.propiedades;
    loading.value = false;
  } catch (err) {
    error.value = 'Error al cargar las propiedades';
    loading.value = false;
    console.error(err);
  }
};

const deletePropiedad = async (id) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
    try {
      await axios.delete(`/propiedad-widget/${id}`);
      await fetchPropiedades();
    } catch (err) {
      error.value = 'Error al eliminar la propiedad';
      console.error(err);
    }
  }
};

onMounted(() => {
  // If props are empty, fetch data
  if (!props.propiedades || props.propiedades.length === 0) {
    fetchPropiedades();
  }
});
</script>

<template>
  <Head title="Propiedades de Widgets" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Gestor de Propiedades de Widgets</h1>
        <Link
          href="/propiedad-widget/create"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Crear Nueva Propiedad
        </Link>
      </div>

      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </div>

      <div v-if="loading" class="text-center py-4">
        <p>Cargando propiedades...</p>
      </div>

      <div v-else-if="localPropiedades.length === 0" class="text-center py-4">
        <p>No hay propiedades disponibles. Crea una nueva.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th class="py-2 px-4 border-b">ID</th>
              <th class="py-2 px-4 border-b">Nombre</th>
              <th class="py-2 px-4 border-b">Tipo</th>
              <th class="py-2 px-4 border-b">Valor por Defecto</th>
              <th class="py-2 px-4 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="propiedad in localPropiedades" :key="propiedad.id" class="hover:bg-gray-100">
              <td class="py-2 px-4 border-b">{{ propiedad.id }}</td>
              <td class="py-2 px-4 border-b">{{ propiedad.name }}</td>
              <td class="py-2 px-4 border-b">{{ propiedad.type || 'Sin tipo' }}</td>
              <td class="py-2 px-4 border-b">{{ propiedad.defaultValue || 'Sin valor por defecto' }}</td>
              <td class="py-2 px-4 border-b">
                <div class="flex space-x-2">
                  <Link
                    :href="`/propiedad-widget/${propiedad.id}/edit`"
                    class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    @click="deletePropiedad(propiedad.id)"
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
