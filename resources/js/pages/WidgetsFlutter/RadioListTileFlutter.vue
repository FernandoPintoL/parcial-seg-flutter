<template>
  <div class="radio-list-tile-flutter" :style="containerStyle">
    <div class="radio-list-container">
      <div
        v-for="item in properties.items"
        :key="item.id"
        class="radio-list-item"
        :class="getItemClasses(item)"
        :style="itemStyle"
        @click="handleItemClick(item)"
      >
        <div class="radio-section">
          <div class="radio-outer-circle" :style="getOuterCircleStyle(item)">
            <div v-if="isSelected(item)" class="radio-inner-circle" :style="innerCircleStyle"></div>
          </div>
        </div>

        <div class="content-section">
          <div class="title-text" :style="titleStyle">{{ item.label }}</div>
          <div v-if="properties.subtitle" class="subtitle-text" :style="subtitleStyle">
            {{ properties.subtitle }}
          </div>
        </div>

        <div v-if="properties.secondary" class="secondary-section" :style="secondaryStyle">
          <span class="material-icons">{{ getSecondaryIcon() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  properties: {
    title: string;
    value: string;
    groupValue: string;
    onChanged: string;
    secondary: string;
    activeColor: string;
    items: Array<{
      id: string;
      label: string;
      value: string;
    }>;
    orientation: 'vertical' | 'horizontal';
    subtitle?: string;
    disabled?: boolean;
    textColor?: string;
    backgroundColor?: string;
  };
}>();

const emit = defineEmits(['update:properties', 'value-change']);

// Computed properties
const containerStyle = computed(() => ({
  backgroundColor: props.properties.backgroundColor || 'transparent',
  padding: '8px',
  fontFamily: 'Roboto, sans-serif',
}));

const itemStyle = computed(() => ({
  flexDirection: props.properties.orientation === 'horizontal' ? 'row' : 'column',
  padding: '12px 16px',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  cursor: props.properties.disabled ? 'not-allowed' : 'pointer',
}));

const titleStyle = computed(() => ({
  color: props.properties.disabled ? '#BDBDBD' : (props.properties.textColor || '#212121'),
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '1.5',
}));

const subtitleStyle = computed(() => ({
  color: props.properties.disabled ? '#BDBDBD' : '#757575',
  fontSize: '14px',
  lineHeight: '1.4',
  marginTop: '2px',
}));

const secondaryStyle = computed(() => ({
  color: props.properties.disabled ? '#BDBDBD' : '#757575',
  fontSize: '20px',
}));

const innerCircleStyle = computed(() => ({
  width: '10px',
  height: '10px',
  backgroundColor: props.properties.activeColor || '#2196F3',
}));

// Methods
const isSelected = (item: any) => {
  return item.value === props.properties.groupValue;
};

const getItemClasses = (item: any) => [
  'radio-list-item-base',
  {
    'item-selected': isSelected(item),
    'item-disabled': props.properties.disabled,
  }
];

const getOuterCircleStyle = (item: any) => ({
  width: '20px',
  height: '20px',
  borderColor: isSelected(item)
    ? (props.properties.activeColor || '#2196F3')
    : '#757575',
  borderWidth: isSelected(item) ? '2px' : '1px',
});

const getSecondaryIcon = () => {
  // Extract icon name from secondary property
  const match = props.properties.secondary.match(/Icons\.(\w+)/);
  return match ? match[1] : 'radio_button_checked';
};

// Event handlers
const handleItemClick = (item: any) => {
  if (props.properties.disabled) return;

  emit('value-change', item.value);
  emit('update:properties', {
    ...props.properties,
    groupValue: item.value
  });
};
</script>

<style scoped>
.radio-list-tile-flutter {
  width: 100%;
  user-select: none;
}

.radio-list-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.radio-list-item:hover:not(.item-disabled) {
  background-color: rgba(33, 150, 243, 0.08);
}

.radio-list-item.item-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.radio-section {
  display: flex;
  align-items: center;
  margin-right: 16px;
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

.radio-outer-circle:hover:not(.item-disabled .radio-outer-circle) {
  box-shadow: 0 0 0 8px rgba(33, 150, 243, 0.12);
}

.radio-inner-circle {
  border-radius: 50%;
  background-color: #2196F3;
  transition: all 0.2s ease;
  transform: scale(0);
  animation: radioSelect 0.2s ease forwards;
}

.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title-text {
  font-weight: 500;
  line-height: 1.5;
  transition: color 0.2s ease;
}

.subtitle-text {
  font-size: 14px;
  line-height: 1.4;
  margin-top: 2px;
  transition: color 0.2s ease;
}

.secondary-section {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.secondary-section .material-icons {
  font-size: 20px;
  transition: color 0.2s ease;
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
.radio-list-item:active:not(.item-disabled)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(33, 150, 243, 0.3);
  transform: translate(-50%, -50%);
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

/* Horizontal orientation */
.radio-list-container.horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

.radio-list-container.horizontal .radio-list-item {
  flex: 1;
  min-width: 120px;
}
</style>
