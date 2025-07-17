<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Definir las propiedades
const props = defineProps({
  // Valor actual del slider
  value: {
    type: Number,
    default: 0.5,
  },
  // Valor mínimo del slider
  min: {
    type: Number,
    default: 0,
  },
  // Valor máximo del slider
  max: {
    type: Number,
    default: 1,
  },
  // Color principal del slider
  activeColor: {
    type: String,
    default: '#2196F3', // Color azul por defecto (similar a Flutter)
  },
  // Color de la pista inactiva
  inactiveColor: {
    type: String,
    default: '#BDBDBD', // Color gris por defecto
  },
  // Tamaño del punto (thumb)
  thumbSize: {
    type: Number,
    default: 20,
  },
  // Altura del slider
  height: {
    type: Number,
    default: 4,
  },
  // Si está deshabilitado
  disabled: {
    type: Boolean,
    default: false,
  },
  // Mostrar etiquetas de valor
  showLabels: {
    type: Boolean,
    default: false,
  }
});

// Emitir eventos
const emit = defineEmits(['update:value', 'changed']);

// Referencias y estados internos
const currentValue = ref(props.value);
const isDragging = ref(false);
const sliderRef = ref<HTMLElement | null>(null);

// Observar cambios en la prop value
watch(() => props.value, (newValue) => {
  currentValue.value = newValue;
});

// Calcular el porcentaje para mostrar visualmente
const percentage = computed(() => {
  const range = props.max - props.min;
  return ((currentValue.value - props.min) / range) * 100;
});

// Establecer el valor en base a la posición del mouse
const setValue = (event : MouseEvent) => {
  if (props.disabled) return;

  const slider = sliderRef.value;
  if (!slider) return;

  const rect = slider.getBoundingClientRect();
  const position = (event.clientX - rect.left) / rect.width;

  // Calcular el nuevo valor respetando el rango
  let newValue = props.min + position * (props.max - props.min);

  // Limitar el valor al rango permitido
  newValue = Math.max(props.min, Math.min(props.max, newValue));

  currentValue.value = newValue;
  emit('update:value', newValue);
};

// Manejar el inicio del arrastre
const startDrag = (event : MouseEvent) => {
  if (props.disabled) return;

  isDragging.value = true;
  setValue(event);

  // Añadir listeners para el arrastre
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
};

// Manejar el arrastre
const onDrag = (event : MouseEvent) => {
  if (isDragging.value) {
    setValue(event);
  }
};

// Finalizar el arrastre
const endDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
    emit('changed', currentValue.value);

    // Eliminar listeners
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
  }
};

// Estilos computados
const thumbStyles = computed(() => {
  return {
    width: `${props.thumbSize}px`,
    height: `${props.thumbSize}px`,
    backgroundColor: props.activeColor,
    left: `calc(${percentage.value}% - ${props.thumbSize / 2}px)`,
    cursor: props.disabled ? 'default' : 'pointer',
    opacity: props.disabled ? 0.6 : 1
  };
});

const trackStyles = computed(() => {
  return {
    height: `${props.height}px`,
    backgroundColor: props.inactiveColor,
    opacity: props.disabled ? 0.6 : 1
  };
});

const progressStyles = computed(() => {
  return {
    width: `${percentage.value}%`,
    backgroundColor: props.activeColor,
    height: `${props.height}px`,
    opacity: props.disabled ? 0.6 : 1
  };
});

</script>

<template>
  <div class="slider-container" :class="{ 'disabled': disabled }">
    <!-- Etiqueta del valor mínimo -->
    <div v-if="showLabels" class="slider-label min-label">{{ min }}</div>

    <!-- Slider actual -->
    <div
      class="slider-track"
      ref="sliderRef"
      @mousedown="startDrag"
      :style="trackStyles"
    >
      <div class="slider-progress" :style="progressStyles"></div>
      <div class="slider-thumb" :style="thumbStyles"></div>
    </div>

    <!-- Etiqueta del valor máximo -->
    <div v-if="showLabels" class="slider-label max-label">{{ max }}</div>

    <!-- Valor actual (opcional, se puede mostrar si es necesario) -->
    <div v-if="showLabels" class="slider-current-value">
      {{ Math.round(currentValue * 100) / 100 }}
    </div>
  </div>
</template>

<style scoped>
.slider-container {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 0;
  user-select: none;
}

.slider-track {
  position: relative;
  width: 100%;
  border-radius: 4px;
  margin: 0 12px;
}

.slider-progress {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 4px;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.2s;
}

.slider-thumb:hover {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.slider-label {
  font-size: 14px;
  color: #757575;
  width: 30px;
  text-align: center;
}

.slider-current-value {
  margin-left: 16px;
  font-size: 14px;
  color: #424242;
}

.disabled {
  pointer-events: none;
}
</style>
