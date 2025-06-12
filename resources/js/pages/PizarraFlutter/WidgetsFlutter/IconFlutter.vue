<script setup lang="ts">
import { computed } from 'vue';

// Definición de propiedades
const props = defineProps({
  // Nombre del icono (compatible con Material Icons)
  name: {
    type: String,
    default: 'star',
  },
  // Color del icono
  color: {
    type: String,
    default: '#000000',
  },
  // Tamaño del icono (equivalente a size en Flutter)
  size: {
    type: [Number, String],
    default: 24,
  },
  // Opacidad del icono
  opacity: {
    type: Number,
    default: 1.0,
  },
  // Si el icono está habilitado (similar a enabled en Fluter)
  disabled: {
    type: Boolean,
    default: false,
  },
  // Tipo de conjunto de iconos (material, fontawesome, etc.)
  iconSet: {
    type: String,
    default: 'material',
    validator: (value: string) => ['material', 'fontawesome'].includes(value)
  },
  // Rotación del icono (en grados)
  rotate: {
    type: Number,
    default: 0
  },
  // Indicador para icono relleno vs contorno (en Material Icons)
  filled: {
    type: Boolean,
    default: true
  },
  // Sombra del icono
  shadow: {
    type: String,
    default: 'none'
  }
});

// Computar estilos del icono
const iconStyles = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size;

  return {
    color: props.color,
    fontSize: sizeValue,
    opacity: props.disabled ? 0.5 : props.opacity,
    transform: props.rotate ? `rotate(${props.rotate}deg)` : 'none',
    transition: 'all 0.3s',
    filter: props.shadow !== 'none' ? `drop-shadow(${props.shadow})` : 'none',
    cursor: props.disabled ? 'default' : 'inherit'
  };
});

// Determinar la clase del icono según el conjunto
const iconClass = computed(() => {
  if (props.iconSet === 'material') {
    return props.filled ? 'material-icons' : 'material-icons-outlined';
  } else if (props.iconSet === 'fontawesome') {
    return ['fas', `fa-${props.name}`];
  }
  return 'material-icons';
});
</script>

<template>
  <div class="icon-flutter">
    <!-- Material Icons -->
    <i v-if="iconSet === 'material'" :class="iconClass" :style="iconStyles">
      {{ name }}
    </i>

    <!-- Font Awesome (si está disponible) -->
    <i v-else-if="iconSet === 'fontawesome'" :class="iconClass" :style="iconStyles"></i>

    <!-- Soporte adicional para SVG o iconos personalizados se puede agregar aquí -->
  </div>
</template>

<style scoped>
.icon-flutter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.material-icons, .material-icons-outlined {
  font-family: 'Material Icons', sans-serif;
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}

.material-icons-outlined {
  font-family: 'Material Icons Outlined', sans-serif;
}
</style>
