<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { router } from '@inertiajs/vue3';
import axios from 'axios';

const widget = ref({
  type: '',
  label: '',
  icon: '',
  hasChildren: false,
  categoria_widget_id: null,
  code_string: ''
});

const propiedades = ref([]);
const categorias = ref([]);
const selectedPropiedades = ref([]);
const loading = ref(true);
const submitting = ref(false);
const error = ref(null);

// Fetch categories and properties
const fetchData = async () => {
  try {
    loading.value = true;
    const [categoriasResponse, propiedadesResponse] = await Promise.all([
      axios.get('/categoria-widget'),
      axios.get('/propiedad-widget')
    ]);

    categorias.value = categoriasResponse.data;
    propiedades.value = propiedadesResponse.data;
    loading.value = false;
  } catch (err) {
    error.value = 'Error al cargar datos';
    loading.value = false;
    console.error(err);
  }
};

// Toggle property selection
const togglePropiedad = (propiedadId) => {
  const index = selectedPropiedades.value.findIndex(p => p.propiedad_id === propiedadId);

  if (index === -1) {
    // Add property with default values
    selectedPropiedades.value.push({
      propiedad_id: propiedadId,
      value: '',
      defaultValue: ''
    });
  } else {
    // Remove property
    selectedPropiedades.value.splice(index, 1);
  }
};

// Check if property is selected
const isPropiedadSelected = (propiedadId) => {
  return selectedPropiedades.value.some(p => p.propiedad_id === propiedadId);
};

// Get property name by ID
const getPropiedadName = (propiedadId) => {
  const propiedad = propiedades.value.find(p => p.id === propiedadId);
  return propiedad ? propiedad.name : 'Desconocido';
};

// Submit form
const submitForm = async () => {
  try {
    submitting.value = true;

    // Create widget
    const widgetResponse = await axios.post('/widget', widget.value);
    const widgetId = widgetResponse.data.id;

    // Create widget properties
    if (selectedPropiedades.value.length > 0) {
      const propiedadesPromises = selectedPropiedades.value.map(prop => {
        return axios.post('/widgets-propiedades', {
          widget_id: widgetId,
          propiedad_id: prop.propiedad_id,
          value: prop.value,
          defaultValue: prop.defaultValue
        });
      });

      await Promise.all(propiedadesPromises);
    }

    // Redirect to widgets list
    router.visit('/widget');
  } catch (err) {
    error.value = 'Error al crear el widget';
    submitting.value = false;
    console.error(err);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Crear Nuevo Widget</h1>
      <a href="/widget" class="text-blue-500 hover:underline">Volver a la lista</a>
    </div>

    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-4">
      <p>Cargando datos...</p>
    </div>

    <form v-else @submit.prevent="submitForm" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="type">
          Tipo
        </label>
        <input
          id="type"
          v-model="widget.type"
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
          v-model="widget.label"
          type="text"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
      </div>

      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="icon">
          Icono
        </label>
        <input
          id="icon"
          v-model="widget.icon"
          type="text"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
      </div>

      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="code_string">
          Código Flutter
        </label>
        <textarea
          id="code_string"
          v-model="widget.code_string"
          rows="4"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Ingrese el código Flutter para este widget"
        ></textarea>
        <p class="text-sm text-gray-500 mt-1">Este código se utilizará para generar el widget en Flutter.</p>
      </div>

      <div class="mb-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            v-model="widget.hasChildren"
            class="mr-2"
          >
          <span class="text-gray-700 text-sm font-bold">Tiene hijos</span>
        </label>
      </div>

      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="categoria">
          Categoría
        </label>
        <select
          id="categoria"
          v-model="widget.categoria_widget_id"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        >
          <option value="" disabled>Selecciona una categoría</option>
          <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
            {{ categoria.category }} - {{ categoria.label }}
          </option>
        </select>
      </div>

      <div class="mb-6">
        <h2 class="text-lg font-bold mb-2">Propiedades</h2>

        <div class="mb-4">
          <div v-for="propiedad in propiedades" :key="propiedad.id" class="mb-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                :checked="isPropiedadSelected(propiedad.id)"
                @change="togglePropiedad(propiedad.id)"
                class="mr-2"
              >
              <span>{{ propiedad.name }} ({{ propiedad.type }})</span>
            </label>
          </div>
        </div>

        <div v-if="selectedPropiedades.length > 0" class="border-t pt-4">
          <h3 class="text-md font-bold mb-2">Configurar propiedades seleccionadas</h3>

          <div v-for="(prop, index) in selectedPropiedades" :key="index" class="mb-4 p-3 border rounded">
            <h4 class="font-bold">{{ getPropiedadName(prop.propiedad_id) }}</h4>

            <div class="mt-2">
              <label class="block text-gray-700 text-sm mb-1">
                Valor
              </label>
              <input
                v-model="prop.value"
                type="text"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
            </div>

            <div class="mt-2">
              <label class="block text-gray-700 text-sm mb-1">
                Valor por defecto
              </label>
              <input
                v-model="prop.defaultValue"
                type="text"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          :disabled="submitting"
        >
          {{ submitting ? 'Guardando...' : 'Guardar Widget' }}
        </button>
        <a
          href="/widget"
          class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
        >
          Cancelar
        </a>
      </div>
    </form>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
}
</style>
