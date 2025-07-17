<template>
  <div class="radio-flutter" :style="containerStyle">
    <div class="radio-container" :class="radioClasses" @click="handleClick">
      <div class="radio-outer-circle" :style="outerCircleStyle">
        <div v-if="isSelected" class="radio-inner-circle" :style="innerCircleStyle"></div>
      </div>
      <span v-if="properties.title" class="radio-label" :style="labelStyle">
        {{ properties.title }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  properties: {
    value: string;
    groupValue: string;
    onChanged: string;
    activeColor: string;
    title: string;
    disabled: boolean;
    size?: number;
    textColor?: string;
    focusColor?: string;
  };
}>();

const emit = defineEmits(['update:properties', 'value-change']);

// Computed properties
const isSelected = computed(() => props.properties.value === props.properties.groupValue);

const containerStyle = computed(() => ({
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
}));

const radioClasses = computed(() => [
  'radio-group',
  {
    'radio-disabled': props.properties.disabled,
    'radio-selected': isSelected.value,
  }
]);

const outerCircleStyle = computed(() => ({
  width: `${props.properties.size || 20}px`,
  height: `${props.properties.size || 20}px`,
  borderColor: isSelected.value
    ? props.properties.activeColor || '#2196F3'
    : '#757575',
  borderWidth: isSelected.value ? '2px' : '1px',
}));

const innerCircleStyle = computed(() => ({
  width: `${(props.properties.size || 20) * 0.5}px`,
  height: `${(props.properties.size || 20) * 0.5}px`,
  backgroundColor: props.properties.activeColor || '#2196F3',
}));

const labelStyle = computed(() => ({
  color: props.properties.disabled
    ? '#BDBDBD'
    : (props.properties.textColor || '#212121'),
  fontSize: '16px',
  marginLeft: '8px',
  cursor: props.properties.disabled ? 'not-allowed' : 'pointer',
}));

// Event handlers
const handleClick = () => {
  if (props.properties.disabled) return;

  emit('value-change', props.properties.value);
  emit('update:properties', {
    ...props.properties,
    groupValue: props.properties.value
  });
};
</script>

<style scoped>
.radio-flutter {
  font-family: 'Roboto', sans-serif;
  user-select: none;
}

.radio-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.radio-container:hover:not(.radio-disabled) {
  background-color: rgba(33, 150, 243, 0.08);
}

.radio-container.radio-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.radio-outer-circle {
  border-radius: 50%;
  border: 1px solid #757575;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.radio-outer-circle:hover:not(.radio-disabled .radio-outer-circle) {
  box-shadow: 0 0 0 8px rgba(33, 150, 243, 0.12);
}

.radio-inner-circle {
  border-radius: 50%;
  background-color: #2196F3;
  transition: all 0.2s ease;
  transform: scale(0);
  animation: radioSelect 0.2s ease forwards;
}

.radio-label {
  font-size: 16px;
  line-height: 1.5;
  transition: color 0.2s ease;
}

.radio-disabled .radio-label {
  color: #BDBDBD;
}

/* Animation for radio selection */
@keyframes radioSelect {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Material Design ripple effect */
.radio-container:active:not(.radio-disabled) .radio-outer-circle::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(33, 150, 243, 0.3);
  transform: scale(0);
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
