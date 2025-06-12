<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  // Propiedades de la tarjeta
  elevation: {
    type: Number,
    default: 2
  },
  color: {
    type: String,
    default: '#FFFFFF'
  },
  borderRadius: {
    type: Number,
    default: 8
  },
  margin: {
    type: [Number, String, Object],
    default: 8
  },
  width: {
    type: [Number, String],
    default: 300
  },
  height: {
    type: [Number, String],
    default: null
  },
  // Propiedades del contenido
  title: {
    type: String,
    default: 'Card Title'
  },
  subtitle: {
    type: String,
    default: ''
  },
  showImage: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/300x150'
  },
  imageHeight: {
    type: Number,
    default: 150
  },
  content: {
    type: String,
    default: 'Card content goes here. You can display information in this area.'
  },
  showDivider: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  actionButtons: {
    type: Array,
    default: () => [
      { text: 'ACTION 1', icon: 'favorite' },
      { text: 'ACTION 2', icon: 'share' }
    ]
  },
  // Propiedades para la pizarra
  id: {
    type: String,
    default: ''
  },
  top: {
    type: Number,
    default: 0
  },
  left: {
    type: Number,
    default: 0
  },
  zIndex: {
    type: Number,
    default: 1
  },
  isSelected: {
    type: Boolean,
    default: false
  },
});

const emit = defineEmits(['select']);

const getMargin = computed(() => {
  if (typeof props.margin === 'number') {
    return `${props.margin}px`;
  } else if (typeof props.margin === 'object') {
    const m = props.margin;
    return `${m.top || 0}px ${m.right || 0}px ${m.bottom || 0}px ${m.left || 0}px`;
  }
  return props.margin;
});

const cardStyle = computed(() => {
  return {
    backgroundColor: props.color,
    borderRadius: `${props.borderRadius}px`,
    boxShadow: `0 ${props.elevation}px ${props.elevation * 2}px rgba(0, 0, 0, ${props.elevation * 0.05})`,
    margin: getMargin.value,
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height: props.height ? (typeof props.height === 'number' ? `${props.height}px` : props.height) : 'auto',
    overflow: 'hidden',
    outline: props.isSelected ? '2px solid #2196F3' : 'none',
  };
});

const selectWidget = () => {
  emit('select', props.id);
};
</script>

<template>
  <div
    :style="cardStyle"
    class="card-flutter"
    @click.stop="selectWidget"
  >
    <!-- Card Image -->
    <div v-if="showImage" class="card-image">
      <img :src="imageUrl" :style="{ height: `${imageHeight}px`, width: '100%', objectFit: 'cover' }" alt="Card image" />
    </div>

    <!-- Card Header -->
    <div v-if="title || subtitle" class="card-header">
      <div v-if="title" class="card-title">{{ title }}</div>
      <div v-if="subtitle" class="card-subtitle">{{ subtitle }}</div>
    </div>

    <!-- Card Content -->
    <div class="card-content">
      {{ content }}
    </div>

    <!-- Card Divider -->
    <div v-if="showDivider" class="card-divider"></div>

    <!-- Card Actions -->
    <div v-if="showActions" class="card-actions">
      <button
        v-for="(button, index) in actionButtons"
        :key="index"
        class="card-action-button"
      >
        <i v-if="button.icon" class="material-icons card-button-icon">{{ button.icon }}</i>
        {{ button.text }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-flutter {
  font-family: 'Roboto', sans-serif;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.card-header {
  padding: 16px;
  padding-bottom: 0;
}

.card-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.87);
}

.card-subtitle {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

.card-content {
  padding: 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
}

.card-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  margin: 0 16px;
}

.card-actions {
  display: flex;
  padding: 8px;
  justify-content: flex-end;
}

.card-action-button {
  background: none;
  border: none;
  padding: 8px 12px;
  margin-left: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2196F3;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  letter-spacing: 0.75px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.card-action-button:hover {
  background-color: rgba(33, 150, 243, 0.1);
}

.card-button-icon {
  font-size: 18px;
  margin-right: 4px;
}

/* Para asegurar que se incluyan los íconos de Material Design */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
</style>
