<template>
  <div class="checkbox-list-tile-flutter" :style="containerStyle">
    <div class="checkbox-list-container" :class="orientationClass">
      <div
        v-for="item in properties.items"
        :key="item.id"
        class="checkbox-list-item"
        :class="getItemClasses(item)"
        :style="itemStyle"
        @click="handleItemClick(item)"
      >
        <div class="checkbox-section">
          <div class="checkbox-container" :style="getCheckboxStyle(item)">
            <div v-if="item.value" class="checkbox-checkmark" :style="checkmarkStyle">
              <span class="material-icons">check</span>
            </div>
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
    value: boolean;
    onChanged: string;
    secondary: string;
    activeColor: string;
    items: Array<{
      id: string;
      label: string;
      value: boolean;
    }>;
    orientation: 'vertical' | 'horizontal';
    subtitle?: string;
    disabled?: boolean;
    textColor?: string;
    backgroundColor?: string;
    checkColor?: string;
  };
}>();

const emit = defineEmits(['update:properties', 'value-change']);

// Computed properties
const containerStyle = computed(() => ({
  backgroundColor: props.properties.backgroundColor || 'transparent',
  padding: '8px',
  fontFamily: 'Roboto, sans-serif',
}));

const orientationClass = computed(() => ({
  'horizontal': props.properties.orientation === 'horizontal'
}));

const itemStyle = computed(() => ({
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

const checkmarkStyle = computed(() => ({
  color: props.properties.checkColor || '#FFFFFF',
  fontSize: '18px',
}));

// Methods
const getItemClasses = (item: any) => [
  'checkbox-list-item-base',
  {
    'item-checked': item.value,
    'item-disabled': props.properties.disabled,
  }
];

const getCheckboxStyle = (item: any) => ({
  width: '20px',
  height: '20px',
  backgroundColor: item.value
    ? (props.properties.activeColor || '#2196F3')
    : 'transparent',
  borderColor: item.value
    ? (props.properties.activeColor || '#2196F3')
    : '#757575',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderRadius: '2px',
  transition: 'all 0.2s ease',
});

const getSecondaryIcon = () => {
  // Extract icon name from secondary property
  const match = props.properties.secondary.match(/Icons\.(\w+)/);
  return match ? match[1] : 'check';
};

// Event handlers
const handleItemClick = (item: any) => {
  if (props.properties.disabled) return;

  const newValue = !item.value;
  const updatedItems = props.properties.items.map(i =>
    i.id === item.id ? { ...i, value: newValue } : i
  );

  emit('value-change', { itemId: item.id, value: newValue });
  emit('update:properties', {
    ...props.properties,
    items: updatedItems
  });
};
</script>

<style scoped>
.checkbox-list-tile-flutter {
  width: 100%;
  user-select: none;
}

.checkbox-list-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-list-container.horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox-list-container.horizontal .checkbox-list-item {
  flex: 1;
  min-width: 120px;
}

.checkbox-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.checkbox-list-item:hover:not(.item-disabled) {
  background-color: rgba(33, 150, 243, 0.08);
}

.checkbox-list-item.item-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkbox-section {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-container:hover:not(.item-disabled .checkbox-container) {
  box-shadow: 0 0 0 8px rgba(33, 150, 243, 0.12);
  border-radius: 2px;
}

.checkbox-checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: checkboxCheck 0.2s ease forwards;
}

.checkbox-checkmark .material-icons {
  font-size: 16px;
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

/* Animation for checkbox check */
@keyframes checkboxCheck {
  0% {
    transform: translate(-50%, -50%) scale(0);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Material Design ripple effect */
.checkbox-list-item:active:not(.item-disabled)::after {
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

/* Checked state animation */
.item-checked .checkbox-container {
  transform: scale(1.1);
}

/* Focus states for accessibility */
.checkbox-list-item:focus {
  outline: 2px solid #2196F3;
  outline-offset: 2px;
}
</style>

