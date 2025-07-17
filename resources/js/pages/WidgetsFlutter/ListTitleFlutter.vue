<script setup lang="ts">
import { ref, computed } from 'vue';

// Propiedades del componente
const props = defineProps({
  // Título principal del ListTile
  title: {
    type: String,
    default: 'Título de lista'
  },
  // Subtítulo opcional
  subtitle: {
    type: String,
    default: ''
  },
  // Icono o widget antes del título (leading)
  leadingIcon: {
    type: String,
    default: ''
  },
  // Icono o widget después del título (trailing)
  trailingIcon: {
    type: String,
    default: ''
  },
  // Si el ListTile es denso (más compacto)
  dense: {
    type: Boolean,
    default: false
  },
  // Si el ListTile está habilitado para interacciones
  enabled: {
    type: Boolean,
    default: true
  },
  // Color de fondo cuando está seleccionado
  selectedColor: {
    type: String,
    default: 'rgba(33, 150, 243, 0.1)'
  },
  // Si el ListTile está seleccionado
  selected: {
    type: Boolean,
    default: false
  },
  // Color del texto
  textColor: {
    type: String,
    default: '#000000'
  },
  // Color del subtítulo
  subtitleColor: {
    type: String,
    default: '#757575'
  },
  // Color del ícono leading
  leadingIconColor: {
    type: String,
    default: '#757575'
  },
  // Color del ícono trailing
  trailingIconColor: {
    type: String,
    default: '#757575'
  }
});

// Emisión de eventos
const emit = defineEmits(['tap']);

// Maneja el clic en el ListTile
const handleTap = () => {
  if (props.enabled) {
    emit('tap');
  }
};

// Estilos calculados
const containerStyle = computed(() => {
  return {
    padding: props.dense ? '8px 16px' : '16px',
    backgroundColor: props.selected ? props.selectedColor : 'transparent',
    opacity: props.enabled ? 1 : 0.5,
    cursor: props.enabled ? 'pointer' : 'default'
  };
});

const titleStyle = computed(() => {
  return {
    color: props.textColor,
    fontSize: props.dense ? '14px' : '16px'
  };
});

const subtitleStyle = computed(() => {
  return {
    color: props.subtitleColor,
    fontSize: props.dense ? '12px' : '14px'
  };
});

// Estado de hover para efectos visuales
const isHovering = ref(false);
</script>

<template>
  <div
    class="list-tile"
    :style="containerStyle"
    @click="handleTap"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <!-- Icono Leading (si existe) -->
    <div v-if="leadingIcon" class="list-tile-leading">
      <span class="material-icons" :style="{ color: leadingIconColor }">
        {{ leadingIcon }}
      </span>
    </div>

    <!-- Contenido del ListTile -->
    <div class="list-tile-content">
      <div class="list-tile-title" :style="titleStyle">
        {{ title }}
      </div>
      <div v-if="subtitle" class="list-tile-subtitle" :style="subtitleStyle">
        {{ subtitle }}
      </div>
    </div>

    <!-- Icono Trailing (si existe) -->
    <div v-if="trailingIcon" class="list-tile-trailing">
      <span class="material-icons" :style="{ color: trailingIconColor }">
        {{ trailingIcon }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.list-tile {
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: background-color 0.2s, opacity 0.2s;
  user-select: none;
  width: 100%;
}

.list-tile:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.list-tile-leading {
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-tile-content {
  flex: 1;
  min-width: 0;
}

.list-tile-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-tile-subtitle {
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-tile-trailing {
  margin-left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Para usar íconos de Material Design, asegúrate de importar la fuente de íconos */
.material-icons {
  font-family: 'Material Icons', sans-serif;
  font-size: 24px;
}
</style>
