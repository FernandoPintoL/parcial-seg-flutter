<script setup lang="ts">
import { computed, ref, watch } from 'vue';

// Definición de propiedades
const props = defineProps({
  // URL de la imagen
  src: {
    type: String,
    default: '',
  },
  // Box fit (similar a Flutter)
  fit: {
    type: String,
    default: 'cover',
    validator: (value: string) => {
      // Accept both 'cover' and 'BoxFit.cover' formats
      const allowedValues = ['fill', 'contain', 'cover', 'none', 'scaleDown', 'fitWidth', 'fitHeight'];
      if (allowedValues.includes(value)) {
        return true;
      }
      // Check if it's a value with 'BoxFit.' prefix
      if (value.startsWith('BoxFit.')) {
        const valueWithoutPrefix = value.substring(7); // Remove 'BoxFit.'
        return allowedValues.includes(valueWithoutPrefix);
      }
      return false;
    }
  },
  // Ancho de la imagen
  width: {
    type: [String, Number],
    default: '100%'
  },
  // Alto de la imagen
  height: {
    type: [String, Number],
    default: 'auto'
  },
  // Radio de borde
  borderRadius: {
    type: [String, Number],
    default: 0
  },
  // Color de borde
  borderColor: {
    type: String,
    default: 'transparent'
  },
  // Ancho de borde
  borderWidth: {
    type: [String, Number],
    default: 0
  },
  // Opacidad de la imagen
  opacity: {
    type: Number,
    default: 1.0
  },
  // Sombra (equivalente a BoxShadow)
  boxShadow: {
    type: String,
    default: 'none'
  },
  // Texto alternativo
  alt: {
    type: String,
    default: 'Image'
  },
  // Indicador de error de carga
  showErrorPlaceholder: {
    type: Boolean,
    default: false
  }
});

// Computar estilos de imagen
const imageStyles = computed(() => {
  const widthVal = typeof props.width === 'number' ? `${props.width}px` : props.width;
  const heightVal = typeof props.height === 'number' ? `${props.height}px` : props.height;
  const borderRadiusVal = typeof props.borderRadius === 'number' ? `${props.borderRadius}px` : props.borderRadius;
  const borderWidthVal = typeof props.borderWidth === 'number' ? `${props.borderWidth}px` : props.borderWidth;

  // Handle 'BoxFit.' prefix for objectFit
  let objectFitValue = props.fit;
  if (typeof objectFitValue === 'string' && objectFitValue.startsWith('BoxFit.')) {
    objectFitValue = objectFitValue.substring(7); // Remove 'BoxFit.'
  }

  return {
    width: widthVal,
    height: heightVal,
    objectFit: objectFitValue,
    borderRadius: borderRadiusVal,
    borderColor: props.borderColor,
    borderWidth: borderWidthVal,
    borderStyle: props.borderWidth ? 'solid' : 'none',
    opacity: props.opacity,
    boxShadow: props.boxShadow
  };
});

// Estado para manejar errores de carga
const hasError = ref(false);

const handleError = () => {
  hasError.value = true;
};

const resetError = () => {
  hasError.value = false;
};

// Verificar URL al cambiar
watch(() => props.src, () => {
  resetError();
});
</script>

<template>
  <div class="image-flutter-container">
    <!-- Imagen normal cuando no hay error -->
    <img
      v-if="!hasError"
      :src="src"
      :style="imageStyles"
      :alt="alt"
      @error="handleError"
      class="image-flutter"
    />

    <!-- Placeholder para error -->
    <div
      v-else-if="showErrorPlaceholder"
      class="error-placeholder"
      :style="imageStyles"
    >
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="error-text">Image not found</div>
    </div>
  </div>
</template>

<style scoped>
.image-flutter-container {
  display: inline-block;
  overflow: hidden;
}

.image-flutter {
  display: block;
}

.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #616161;
}

.error-icon {
  margin-bottom: 8px;
}

.error-text {
  font-size: 14px;
}
</style>
