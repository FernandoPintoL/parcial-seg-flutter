<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  // Opciones para los checkboxes
  options: {
    type: Array,
    default: () => [
      { id: '1', label: 'Opción 1', value: false },
      { id: '2', label: 'Opción 2', value: false },
      { id: '3', label: 'Opción 3', value: false }
    ]
  },
  // Color activo de los checkboxes
  activeColor: {
    type: String,
    default: '#2196F3' // Color primario por defecto de Flutter
  },
  // Tamaño de los checkboxes
  size: {
    type: Number,
    default: 20
  },
  // Orientación del grupo: horizontal o vertical
  orientation: {
    type: String,
    default: 'vertical', // 'horizontal' o 'vertical'
    validator: (value: string) => ['horizontal', 'vertical'].includes(value)
  },
  // Espacio entre los checkboxes
  spacing: {
    type: Number,
    default: 10
  },
  // Indica si todo el grupo está deshabilitado
  disabled: {
    type: Boolean,
    default: false
  },
  // Tipo de checkbox: square (cuadrado) o circle (circular, estilo Switch)
  type: {
    type: String,
    default: 'square', // 'square' o 'circle'
    validator: (value: string) => ['square', 'circle'].includes(value)
  }
});

const emit = defineEmits(['change', 'update:options']);

// Estado local de las opciones
const localOptions = ref(JSON.parse(JSON.stringify(props.options)));

// Maneja el cambio en un checkbox individual
function handleChange(id: string) {
  if (props.disabled) return;

  const optionIndex = localOptions.value.findIndex((option) => option.id === id);
  if (optionIndex !== -1) {
    localOptions.value[optionIndex].value = !localOptions.value[optionIndex].value;
    emit('change', localOptions.value);
    emit('update:options', localOptions.value);
  }
}

// Estilos para el contenedor del grupo
const groupStyles = computed(() => ({
  display: 'flex',
  flexDirection: props.orientation === 'vertical' ? 'column' : 'row',
  gap: `${props.spacing}px`,
}));

// Comprueba si un checkbox está marcado
const isChecked = (id: string) => {
  const option = localOptions.value.find(opt => opt.id === id);
  return option ? option.value : false;
};
</script>

<template>
  <div class="flutter-checkbox-group p-2" :style="groupStyles">
    <div
      v-for="option in localOptions"
      :key="option.id"
      class="checkbox-option"
      :class="{ 'disabled': disabled }"
      @click="handleChange(option.id)"
    >
      <div class="checkbox-wrapper">
        <div
          class="checkbox"
          :class="{
            'checked': isChecked(option.id),
            'square': type === 'square',
            'circle': type === 'circle'
          }"
          :style="{
            width: `${size}px`,
            height: `${size}px`,
            borderColor: isChecked(option.id) && !disabled ? activeColor : '#757575',
            backgroundColor: isChecked(option.id) ? (disabled ? '#BDBDBD' : activeColor) : 'transparent'
          }"
        >
          <!-- Icono de check -->
          <div v-if="isChecked(option.id) && type === 'square'" class="check-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :width="size * 0.75" :height="size * 0.75">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white"/>
            </svg>
          </div>

          <!-- Para tipo circle, mostramos un círculo interno -->
          <div
            v-if="isChecked(option.id) && type === 'circle'"
            class="inner-circle"
            :style="{
              width: `${size * 0.5}px`,
              height: `${size * 0.5}px`,
              backgroundColor: 'white'
            }"
          ></div>
        </div>
        <div class="checkbox-label" :style="{ fontSize: `${size * 0.75}px` }">{{ option.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flutter-checkbox-group {
  font-family: 'Roboto', sans-serif;
}

.checkbox-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
}

.checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.checkbox.square {
  border-radius: 2px;
}

.checkbox.circle {
  border-radius: 50%;
}

.check-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}

.inner-circle {
  border-radius: 50%;
}

.checkbox-label {
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.87);
}

.disabled {
  cursor: default;
  opacity: 0.6;
}

.disabled .checkbox-label {
  color: rgba(0, 0, 0, 0.38);
}

/* Efecto de ripple (simulado) */
.checkbox-option:not(.disabled):active .checkbox::after {
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
