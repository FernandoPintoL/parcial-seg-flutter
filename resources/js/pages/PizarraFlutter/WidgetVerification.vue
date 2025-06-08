<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import type { FlutterWidget } from '@/types/Pizarra';

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits(['close']);

const widgets = ref<FlutterWidget[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

// Fetch all widgets from the database
const fetchWidgets = async () => {
  try {
    loading.value = true;
    const response = await axios.post('/widget/query');
    widgets.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Error fetching widgets:', err);
    error.value = 'Error al cargar los widgets';
    loading.value = false;
  }
};

// Group widgets by category
const widgetsByCategory = ref<Record<string, FlutterWidget[]>>({});

const groupWidgetsByCategory = () => {
  const grouped: Record<string, FlutterWidget[]> = {};

  widgets.value.forEach(widget => {
    const category = widget.categoria?.category || 'sin-categoria';

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(widget);
  });

  widgetsByCategory.value = grouped;
};

// Watch for changes in widgets and regroup
watch(widgets, () => {
  groupWidgetsByCategory();
}, { deep: true });

// Fetch widgets when component is mounted or becomes visible
onMounted(() => {
  if (props.isVisible) {
    fetchWidgets();
  }
});

// Watch for changes in visibility
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    fetchWidgets();
  }
});
</script>

<template>
  <div v-if="isVisible" class="widget-verification">
    <div class="widget-verification-header">
      <h2 class="widget-verification-title">Componentes Disponibles</h2>
      <button
        @click="emit('close')"
        class="close-button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Cargando componentes...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="widgets.length === 0" class="empty-state">
      <p>No hay componentes disponibles.</p>
    </div>

    <div v-else class="widget-categories">
      <div v-for="(categoryWidgets, category) in widgetsByCategory" :key="category" class="widget-category">
        <h3 class="category-title">{{ category.toUpperCase() }}</h3>
        <div class="widget-grid">
          <div v-for="widget in categoryWidgets" :key="widget.id" class="widget-item">
            <div class="widget-icon">
              <svg v-if="widget.icon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
              <span v-else>{{ widget.type.charAt(0) }}</span>
            </div>
            <div class="widget-details">
              <span class="widget-type">{{ widget.type }}</span>
              <span class="widget-label">{{ widget.label }}</span>
              <div v-if="widget.code_string" class="widget-code">
                {{ widget.code_string.substring(0, 30) }}{{ widget.code_string.length > 30 ? '...' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.widget-verification {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.widget-verification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f3f4f6;
}

.widget-verification-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  color: #4b5563;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #e5e7eb;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10rem;
  color: #6b7280;
}

.widget-categories {
  padding: 1rem;
}

.widget-category {
  margin-bottom: 1.5rem;
}

.category-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.widget-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.widget-item:hover {
  background-color: #f3f4f6;
}

.widget-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  background-color: #e5e7eb;
  color: #4b5563;
  margin-right: 0.75rem;
}

.widget-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.widget-type {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-label {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-code {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: monospace;
  background-color: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-top: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .widget-verification {
    background-color: #1f2937;
    border-color: #374151;
  }

  .widget-verification-header {
    background-color: #111827;
    border-color: #374151;
  }

  .widget-verification-title {
    color: #f9fafb;
  }

  .close-button {
    color: #d1d5db;
  }

  .close-button:hover {
    background-color: #374151;
  }

  .loading-state,
  .error-state,
  .empty-state {
    color: #9ca3af;
  }

  .category-title {
    color: #d1d5db;
  }

  .widget-item {
    background-color: #374151;
    border-color: #4b5563;
  }

  .widget-item:hover {
    background-color: #4b5563;
  }

  .widget-icon {
    background-color: #4b5563;
    color: #d1d5db;
  }

  .widget-type {
    color: #f9fafb;
  }

  .widget-label,
  .widget-code {
    color: #d1d5db;
  }

  .widget-code {
    background-color: #111827;
  }
}
</style>
