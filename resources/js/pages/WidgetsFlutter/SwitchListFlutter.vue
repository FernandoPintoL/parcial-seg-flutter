<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  // Estado del switch (encendido/apagado)
  modelValue: {
    type: Boolean,
    default: false
  },
  // Título principal del SwitchList
  title: {
    type: String,
    default: 'Título del Switch'
  },
  // Subtítulo opcional
  subtitle: {
    type: String,
    default: ''
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
  // Tamaño del switch
  switchSize: {
    type: Number,
    default: 1.0 // Factor de escala
  },
  // Icono secundario opcional (izquierda)
  secondaryIcon: {
    type: String,
    default: ''
  },
  // Color del icono secundario
  secondaryIconColor: {
    type: String,
    default: '#757575'
  },
  // Indica si está deshabilitado
  disabled: {
    type: Boolean,
    default: false
  },
  // Densidad del tile (compacto/normal)
  dense: {
    type: Boolean,
    default: false
  },
  // Color del texto del título
  titleColor: {
    type: String,
    default: 'rgba(0, 0, 0, 0.87)'
  },
  // Color del texto del subtítulo
  subtitleColor: {
    type: String,
    default: 'rgba(0, 0, 0, 0.6)'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Altura y ancho del switch basados en el tamaño
const switchHeight = computed(() => Math.round(24 * props.switchSize));
const switchWidth = computed(() => Math.round(48 * props.switchSize));

// Diámetro del thumb (círculo)
const thumbSize = computed(() => Math.round(20 * props.switchSize));

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
  // Calculamos la posición considerando el tamaño del track y el thumb
  const trackPadding = (switchHeight.value - thumbSize.value) / 2;
  const movement = switchWidth.value - thumbSize.value - trackPadding * 2;

  return {
    width: `${thumbSize.value}px`,
    height: `${thumbSize.value}px`,
    backgroundColor: props.thumbColor,
    left: props.modelValue
      ? `${trackPadding + movement}px`
      : `${trackPadding}px`,
    boxShadow: '0 2px 2px 0 rgba(0,0,0,0.2)',
  };
});

// Maneja los eventos del switch
function toggleSwitch() {
  if (props.disabled) return;

  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
}

// Estilos para el contenedor según la densidad
const containerStyle = computed(() => {
  return {
    padding: props.dense ? '8px 16px' : '16px',
  };
});

// Estilos para el título
const titleStyle = computed(() => {
  return {
    color: props.disabled ? 'rgba(0, 0, 0, 0.38)' : props.titleColor,
    fontSize: props.dense ? '14px' : '16px',
  };
});

// Estilos para el subtítulo
const subtitleStyle = computed(() => {
  return {
    color: props.disabled ? 'rgba(0, 0, 0, 0.38)' : props.subtitleColor,
    fontSize: props.dense ? '12px' : '14px',
  };
});
</script>

<template>
  <div
    class="flutter-switch-list"
    :class="{ 'disabled': disabled }"
    @click="toggleSwitch"
    :style="containerStyle"
  >
    <!-- Icono secundario (opcional) -->
    <div v-if="secondaryIcon" class="secondary-icon">
      <span class="material-icons" :style="{ color: secondaryIconColor }">{{ secondaryIcon }}</span>
    </div>

    <!-- Contenido (título y subtítulo) -->
    <div class="content">
      <div class="title" :style="titleStyle">{{ title }}</div>
      <div v-if="subtitle" class="subtitle" :style="subtitleStyle">{{ subtitle }}</div>
    </div>

    <!-- Switch -->
    <div class="flutter-switch" role="switch" :aria-checked="modelValue">
      <!-- Track (fondo del switch) -->
      <div class="switch-track" :style="trackStyle">
        <!-- Thumb (círculo deslizante) -->
        <div class="switch-thumb" :style="thumbStyle"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flutter-switch-list {
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: #FFFFFF;
  border-radius: 4px;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.2s;
}

.flutter-switch-list:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.secondary-icon {
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  margin-bottom: 2px;
}

.subtitle {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
}

.flutter-switch {
  position: relative;
  display: inline-block;
  margin-left: 16px;
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

.disabled {
  cursor: default;
  opacity: 0.6;
}

/* Efecto de ripple (simulado) */
.flutter-switch-list:not(.disabled):active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background-color: currentColor;
  opacity: 0.1;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
</style>
