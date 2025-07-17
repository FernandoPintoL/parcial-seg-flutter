<template>
  <button
    class="fab-flutter"
    :class="fabClasses"
    :style="fabStyle"
    @click="handleClick"
    :disabled="properties.disabled"
  >
    <div class="fab-content">
      <span v-if="properties.icon" class="material-icons fab-icon">
        {{ getIconName(properties.icon) }}
      </span>
      <span v-if="properties.label" class="fab-label">
        {{ properties.label }}
      </span>
    </div>

    <!-- Ripple effect container -->
    <div class="fab-ripple"></div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  properties: {
    onPressed: string;
    child?: string;
    icon?: string;
    label?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    elevation?: number;
    mini?: boolean;
    extended?: boolean;
    disabled?: boolean;
    shape?: string;
    heroTag?: string;
    tooltip?: string;
    focusElevation?: number;
    hoverElevation?: number;
    highlightElevation?: number;
  };
}>();

const emit = defineEmits(['update:properties', 'fab-pressed']);

// Computed properties
const fabClasses = computed(() => [
  'fab-base',
  {
    'fab-mini': props.properties.mini,
    'fab-extended': props.properties.extended,
    'fab-disabled': props.properties.disabled,
  }
]);

const fabStyle = computed(() => {
  const style: Record<string, any> = {};

  // Background color
  style.backgroundColor = props.properties.backgroundColor || '#2196F3';

  // Foreground color
  style.color = props.properties.foregroundColor || '#FFFFFF';

  // Elevation (box-shadow)
  const elevation = props.properties.elevation || 6;
  style.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.2)`;

  // Shape
  if (props.properties.shape === 'rectangular') {
    style.borderRadius = '8px';
  }

  return style;
});

// Methods
const getIconName = (iconString: string): string => {
  if (!iconString) return 'add';
  const match = iconString.match(/Icons\.(\w+)/);
  return match ? match[1] : iconString.toLowerCase();
};

const handleClick = () => {
  if (props.properties.disabled) return;
  emit('fab-pressed');
};
</script>

<style scoped>
.fab-flutter {
  position: relative;
  border: none;
  outline: none;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
}

.fab-base {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2196F3;
  color: white;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.fab-base.fab-mini {
  width: 40px;
  height: 40px;
}

.fab-base.fab-extended {
  width: auto;
  min-width: 80px;
  height: 48px;
  border-radius: 24px;
  padding: 0 16px;
}

.fab-base.fab-disabled {
  background-color: #E0E0E0 !important;
  color: #9E9E9E !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  cursor: not-allowed;
}

.fab-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 1;
  position: relative;
}

.fab-icon {
  font-size: 24px;
  line-height: 1;
}

.fab-base.fab-mini .fab-icon {
  font-size: 20px;
}

.fab-base.fab-extended .fab-icon {
  font-size: 20px;
}

.fab-label {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.75px;
  white-space: nowrap;
}

/* Hover effects */
.fab-base:hover:not(.fab-disabled) {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.fab-base:active:not(.fab-disabled) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transform: translateY(0);
}

/* Ripple effect */
.fab-ripple {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  pointer-events: none;
  overflow: hidden;
}

.fab-base:active:not(.fab-disabled) .fab-ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  animation: fab-ripple 0.6s ease-out;
}

@keyframes fab-ripple {
  to {
    width: 120px;
    height: 120px;
    opacity: 0;
  }
}

/* Focus styles for accessibility */
.fab-base:focus-visible {
  outline: 2px solid #64B5F6;
  outline-offset: 2px;
}

/* Animation for show/hide */
.fab-flutter {
  animation: fab-enter 0.2s ease-out;
}

@keyframes fab-enter {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .fab-base.fab-disabled {
    background-color: #424242 !important;
    color: #757575 !important;
  }
}
</style>
