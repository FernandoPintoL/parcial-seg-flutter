<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import axios from 'axios';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/AppLayout.vue';

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false
  },
  propiedad: {
    type: Object,
    default: null
  }
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Propiedades de Widgets',
        href: '/propiedad-widget',
    },
    {
        title: props.isEditing ? 'Editar Propiedad' : 'Crear Propiedad',
        href: props.isEditing ? `/propiedad-widget/${props.propiedad?.id}/edit` : '/propiedad-widget/create',
    },
];

const propiedad = ref({
  name: props.propiedad?.name || '',
  type: props.propiedad?.type || '',
  defaultValue: props.propiedad?.defaultValue || ''
});

const loading = ref(false);
const submitting = ref(false);
const error = ref('');

const submitForm = async () => {
  try {
    submitting.value = true;

    if (props.isEditing) {
      // Update existing property
      await axios.put(`/propiedad-widget/${props.propiedad.id}`, propiedad.value);
    } else {
      // Create new property
      await axios.post('/propiedad-widget', propiedad.value);
    }

    // Redirect to properties list
    router.visit('/propiedad-widget');
  } catch (err) {
    error.value = props.isEditing
      ? 'Error al actualizar la propiedad'
      : 'Error al crear la propiedad';
    submitting.value = false;
    console.error(err);
  }
};

onMounted(() => {
  // Initialize form with existing data if editing
  if (props.isEditing && props.propiedad) {
    propiedad.value = {
      name: props.propiedad.name,
      type: props.propiedad.type || '',
      defaultValue: props.propiedad.defaultValue || ''
    };
  }
});
</script>

<template>
  <Head :title="isEditing ? 'Editar Propiedad' : 'Crear Propiedad'" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="container mx-auto p-4">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">{{ isEditing ? 'Editar Propiedad' : 'Crear Nueva Propiedad' }}</h1>
        <a href="/propiedad-widget" class="text-blue-500 hover:underline">Volver a la lista</a>
      </div>

      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </div>

      <div v-if="loading" class="text-center py-4">
        <p>Cargando datos...</p>
      </div>

      <form @submit.prevent="submitForm" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
            Nombre
          </label>
          <input
            id="name"
            v-model="propiedad.name"
            type="text"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="type">
            Tipo
          </label>
          <input
            id="type"
            v-model="propiedad.type"
            type="text"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="string, int, bool, etc."
          >
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="defaultValue">
            Valor por Defecto
          </label>
          <input
            id="defaultValue"
            v-model="propiedad.defaultValue"
            type="text"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
        </div>

        <div class="flex items-center justify-between">
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            :disabled="submitting"
          >
            {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar Propiedad' : 'Guardar Propiedad') }}
          </button>
          <a
            href="/propiedad-widget"
            class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  </AppLayout>
</template>

<style scoped>
.container {
  max-width: 800px;
}
</style>
