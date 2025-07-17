<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  // Estado del switch (encendido/apagado)
  modelValue: {
    type: Boolean,
    default: false
  },
  // Etiqueta del switch
  label: {
    type: String,
    default: 'Switch'
  },
  // Color cuando está activo
  activeColor: {
    type: String,
    default: '#2196F3' // Color primario por defecto de Flutter
  },
  // Color cuando está inactivo
  inactiveColor: {
    type: String,
    default: '#bdbdbd' // Gris por defecto
  },
  // Color del thumb (círculo)
  thumbColor: {
    type: String,
    default: '#FFFFFF'
  },
  // Tamaño del switch (afecta tanto alto como ancho proporcionalmente)
  size: {
    type: Number,
    default: 1.0 // Factor de escala
  },
  // Indica si está deshabilitado
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Estado local para manejar la animación
const isPressed = ref(false);

// Altura y ancho del switch basados en el tamaño
const switchHeight = computed(() => Math.round(24 * props.size));
const switchWidth = computed(() => Math.round(48 * props.size));

// Diámetro del thumb (círculo)
const thumbSize = computed(() => Math.round(20 * props.size));

// Calcula la posición y color del track (fondo) según el estado
const trackStyle = computed(() => {
  return {
    backgroundColor: props.modelValue ? props.activeColor : props.inactiveColor,
    opacity: props.modelValue ? 1 : 0.5,
    height: `${switchHeight.value}px`,
    width: `${switchWidth.value}px`,
  };
});

// Calcula la posición y tamaño del thumb (círculo) según el estado
const thumbStyle = computed(() => {
  // Durante la animación de presión, aumentamos un poco el tamaño del thumb
  const currentThumbSize = isPressed.value ? thumbSize.value * 1.2 : thumbSize.value;

  // Calculamos la posición considerando el tamaño del track y el thumb
  const trackPadding = (switchHeight.value - thumbSize.value) / 2;
  const movement = switchWidth.value - thumbSize.value - trackPadding * 2;

  return {
    width: `${currentThumbSize}px`,
    height: `${currentThumbSize}px`,
    backgroundColor: props.thumbColor,
    left: props.modelValue
      ? `${trackPadding + movement}px`
      : `${trackPadding}px`,
    boxShadow: isPressed.value
      ? '0 0 5px rgba(0,0,0,0.3)'
      : '0 2px 2px 0 rgba(0,0,0,0.2)',
  };
});

// Maneja los eventos del switch
function toggleSwitch() {
  if (props.disabled) return;

  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
}

// Maneja los eventos de presión para la animación
function handlePointerDown() {
  if (!props.disabled) {
    isPressed.value = true;
  }
}

function handlePointerUp() {
  isPressed.value = false;
}
</script>

<template>
  <div class="switch-container">
    <div
      class="flutter-switch"
      :class="{ 'disabled': disabled }"
      @click="toggleSwitch"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
      role="switch"
      :aria-checked="modelValue"
    >
      <!-- Track (fondo del switch) -->
      <div class="switch-track" :style="trackStyle">
        <!-- Thumb (círculo deslizante) -->
        <div class="switch-thumb" :style="thumbStyle"></div>
      </div>
    </div>
    <!-- Label (si existe) -->
    <div v-if="label" class="switch-label" @click="toggleSwitch">
      {{ label }}
    </div>
  </div>
</template>

<style scoped>
.switch-container {
  display: flex;
  align-items: center;
  font-family: 'Roboto', sans-serif;
  padding: 4px;
}

.flutter-switch {
  position: relative;
  display: inline-block;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.switch-track {
  position: relative;
  border-radius: 20px;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-label {
  margin-left: 12px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
  cursor: pointer;
  user-select: none;
}

.disabled {
  cursor: default;
  opacity: 0.6;
  pointer-events: none;
}

.disabled + .switch-label {
  opacity: 0.6;
  cursor: default;
}

/* Efecto de ripple (simulado) */
.flutter-switch:not(.disabled):active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.12;
  transition: all 0.3s ease;
}
</style>
