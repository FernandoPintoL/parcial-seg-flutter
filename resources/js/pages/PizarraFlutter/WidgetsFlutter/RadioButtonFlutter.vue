<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  // Valor del radio button
  value: {
    type: String,
    required: true
  },
  // Valor del grupo al que pertenece
  groupValue: {
    type: String,
    default: null
  },
  // Indica si está seleccionado
  selected: {
    type: Boolean,
    default: false
  },
  // Color principal del radio button cuando está activo
  activeColor: {
    type: String,
    default: '#2196F3' // Color primario por defecto de Flutter
  },
  // Color cuando está deshabilitado
  disabledColor: {
    type: String,
    default: '#BDBDBD' // Gris claro
  },
  // Tamaño del radio button
  size: {
    type: Number,
    default: 20
  },
  // Etiqueta o texto del radio button
  label: {
    type: String,
    default: ''
  },
  // Indica si está deshabilitado
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:groupValue']);

// Para manejar el estado interno si es necesario
const isHovered = ref(false);

// Computa si el radio button está seleccionado
const isSelected = computed(() => {
  if (props.groupValue !== null) {
    return props.value === props.groupValue;
  }
  return props.selected;
});

// Estilos para el radio button
const radioStyles = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderColor: props.disabled ? props.disabledColor : isSelected.value ? props.activeColor : '#757575',
}));

// Estilos para el círculo interno
const innerCircleStyles = computed(() => ({
  width: `${props.size * 0.5}px`,
  height: `${props.size * 0.5}px`,
  backgroundColor: props.disabled ? props.disabledColor : props.activeColor,
  display: isSelected.value ? 'block' : 'none',
}));

// Maneja el clic en el radio button
function handleClick() {
  if (!props.disabled) {
    emit('update:groupValue', props.value);
  }
}
</script>

<template>
  <div
    class="flutter-radio-button-container"
    :class="{ 'disabled': disabled }"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="radio-button-wrapper">
      <div class="radio-button" :style="radioStyles">
        <div class="inner-circle" :style="innerCircleStyles"></div>
      </div>
      <div class="radio-label" v-if="label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.flutter-radio-button-container {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  margin: 8px;
  font-family: 'Roboto', sans-serif;
}

.radio-button-wrapper {
  display: flex;
  align-items: center;
}

.radio-button {
  border: 2px solid;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.inner-circle {
  border-radius: 50%;
  transition: all 0.3s ease;
}

.radio-label {
  margin-left: 8px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.87);
}

.disabled {
  cursor: default;
  opacity: 0.6;
}

.disabled .radio-label {
  color: rgba(0, 0, 0, 0.38);
}

/* Efecto de ripple (simulado) */
.flutter-radio-button-container:not(.disabled):active .radio-button::after {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.12;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  transition: all 0.3s ease;
}
</style>
