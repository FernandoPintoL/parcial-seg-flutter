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
  categoria: {
    type: Object,
    default: null
  }
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categorías de Widgets',
        href: '/categoria-widget',
    },
    {
        title: props.isEditing ? 'Editar Categoría' : 'Crear Categoría',
        href: props.isEditing ? `/categoria-widget/${props.categoria?.id}/edit` : '/categoria-widget/create',
    },
];

const categoria = ref({
  category: props.categoria?.category || '',
  label: props.categoria?.label || ''
});

const loading = ref(false);
const submitting = ref(false);
const error = ref('');

const submitForm = async () => {
  try {
    submitting.value = true;

    if (props.isEditing) {
      // Update existing category
      await axios.put(`/categoria-widget/${props.categoria.id}`, categoria.value);
    } else {
      // Create new category
      await axios.post('/categoria-widget', categoria.value);
    }

    // Redirect to categories list
    router.visit('/categoria-widget');
  } catch (err) {
    error.value = props.isEditing
      ? 'Error al actualizar la categoría'
      : 'Error al crear la categoría';
    submitting.value = false;
    console.error(err);
  }
};

onMounted(() => {
  // Initialize form with existing data if editing
  if (props.isEditing && props.categoria) {
    categoria.value = {
      category: props.categoria.category,
      label: props.categoria.label || ''
    };
  }
});
</script>

<template>
  <Head :title="isEditing ? 'Editar Categoría' : 'Crear Categoría'" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="container mx-auto p-4">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">{{ isEditing ? 'Editar Categoría' : 'Crear Nueva Categoría' }}</h1>
        <a href="/categoria-widget" class="text-blue-500 hover:underline">Volver a la lista</a>
      </div>

      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </div>

      <div v-if="loading" class="text-center py-4">
        <p>Cargando datos...</p>
      </div>

      <form @submit.prevent="submitForm" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="category">
            Categoría
          </label>
          <input
            id="category"
            v-model="categoria.category"
            type="text"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="label">
            Etiqueta
          </label>
          <input
            id="label"
            v-model="categoria.label"
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
            {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar Categoría' : 'Guardar Categoría') }}
          </button>
          <a
            href="/categoria-widget"
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
