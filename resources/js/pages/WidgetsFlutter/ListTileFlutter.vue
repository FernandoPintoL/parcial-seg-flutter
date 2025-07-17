<template>
  <div class="list-tile-flutter" :style="containerStyle">
    <div class="list-tile-content" :class="tileClasses" @click="handleClick">
      <!-- Leading section -->
      <div v-if="properties.leading" class="leading-section" :style="leadingStyle">
        <span class="material-icons">{{ getIconName(properties.leading) }}</span>
      </div>

      <!-- Avatar section -->
      <div v-if="properties.avatar" class="avatar-section">
        <div class="avatar-circle" :style="avatarStyle">
          <span class="avatar-text">{{ getAvatarText() }}</span>
        </div>
      </div>

      <!-- Content section -->
      <div class="content-section">
        <div class="title-text" :style="titleStyle">
          {{ properties.title }}
        </div>
        <div v-if="properties.subtitle" class="subtitle-text" :style="subtitleStyle">
          {{ properties.subtitle }}
        </div>
      </div>

      <!-- Trailing section -->
      <div v-if="properties.trailing" class="trailing-section" :style="trailingStyle">
        <span class="material-icons">{{ getIconName(properties.trailing) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  properties: {
    title: string;
    subtitle?: string;
    leading?: string;
    trailing?: string;
    avatar?: string;
    dense?: boolean;
    enabled?: boolean;
    selected?: boolean;
    onTap?: string;
    contentPadding?: string;
    visualDensity?: string;
    backgroundColor?: string;
    selectedColor?: string;
    textColor?: string;
    iconColor?: string;
  };
}>();

const emit = defineEmits(['update:properties', 'tile-tap']);

// Computed properties
const containerStyle = computed(() => ({
  backgroundColor: props.properties.backgroundColor || 'transparent',
  fontFamily: 'Roboto, sans-serif',
}));

const tileClasses = computed(() => [
  'list-tile-base',
  {
    'tile-dense': props.properties.dense,
    'tile-disabled': !props.properties.enabled,
    'tile-selected': props.properties.selected,
  }
]);

const titleStyle = computed(() => ({
  color: props.properties.selected
    ? (props.properties.selectedColor || '#2196F3')
    : (props.properties.textColor || '#212121'),
  fontSize: props.properties.dense ? '14px' : '16px',
  fontWeight: '500',
  lineHeight: '1.5',
}));

const subtitleStyle = computed(() => ({
  color: props.properties.textColor ? `${props.properties.textColor}80` : '#757575',
  fontSize: props.properties.dense ? '12px' : '14px',
  lineHeight: '1.4',
  marginTop: '2px',
}));

const leadingStyle = computed(() => ({
  color: props.properties.selected
    ? (props.properties.selectedColor || '#2196F3')
    : (props.properties.iconColor || '#757575'),
  fontSize: props.properties.dense ? '20px' : '24px',
}));

const trailingStyle = computed(() => ({
  color: props.properties.iconColor || '#757575',
  fontSize: props.properties.dense ? '20px' : '24px',
}));

const avatarStyle = computed(() => ({
  backgroundColor: props.properties.selectedColor || '#2196F3',
  width: props.properties.dense ? '32px' : '40px',
  height: props.properties.dense ? '32px' : '40px',
}));

// Methods
const getIconName = (iconString: string): string => {
  const match = iconString.match(/Icons\.(\w+)/);
  return match ? match[1] : 'star';
};

const getAvatarText = (): string => {
  return props.properties.title.charAt(0).toUpperCase();
};

const handleClick = () => {
  if (!props.properties.enabled) return;
  emit('tile-tap');
};
</script>

<style scoped>
.list-tile-flutter {
  width: 100%;
  user-select: none;
}

.list-tile-base {
  display: flex;
  align-items: center;
  padding: 16px;
  min-height: 56px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.list-tile-base.tile-dense {
  min-height: 48px;
  padding: 12px 16px;
}

.list-tile-base:hover:not(.tile-disabled) {
  background-color: rgba(0, 0, 0, 0.04);
}

.list-tile-base.tile-selected {
  background-color: rgba(33, 150, 243, 0.12);
}

.list-tile-base.tile-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.leading-section {
  display: flex;
  align-items: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.avatar-section {
  margin-right: 16px;
  flex-shrink: 0;
}

.avatar-circle {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
}

.avatar-text {
  font-size: 16px;
}

.content-section {
  flex: 1;
  min-width: 0;
}

.title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtitle-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trailing-section {
  display: flex;
  align-items: center;
  margin-left: 16px;
  flex-shrink: 0;
}

/* Material Design ripple effect */
.list-tile-base:active:not(.tile-disabled)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.12);
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

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .list-tile-base:hover:not(.tile-disabled) {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .list-tile-base.tile-selected {
    background-color: rgba(100, 181, 246, 0.16);
  }
}
</style>

