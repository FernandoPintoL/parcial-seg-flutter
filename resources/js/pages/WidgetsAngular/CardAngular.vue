<template>
  <div class="card-angular" :class="cardClasses" :style="cardStyle">
    <!-- Card Header -->
    <div v-if="properties.showHeader" class="mat-card-header">
      <div v-if="properties.avatar" class="mat-card-avatar" :style="avatarStyle">
        {{ getAvatarText() }}
      </div>
      <div class="mat-card-header-text">
        <div v-if="properties.title" class="mat-card-title">{{ properties.title }}</div>
        <div v-if="properties.subtitle" class="mat-card-subtitle">{{ properties.subtitle }}</div>
      </div>
      <div v-if="properties.headerActions" class="mat-card-header-actions">
        <button class="mat-icon-button" @click="handleMenuClick">
          <span class="material-icons">more_vert</span>
        </button>
      </div>
    </div>

    <!-- Card Image -->
    <div v-if="properties.showImage && properties.imageUrl" class="mat-card-image">
      <img
        :src="properties.imageUrl"
        :alt="properties.imageAlt || 'Card image'"
        :style="imageStyle"
        @error="handleImageError"
      />
    </div>

    <!-- Card Content -->
    <div class="mat-card-content" :style="contentStyle">
      <slot>
        <div v-if="properties.content" class="card-text">
          {{ properties.content }}
        </div>
        <div v-else class="card-placeholder">
          <span class="material-icons">credit_card</span>
          <span class="placeholder-text">Card Content</span>
        </div>
      </slot>
    </div>

    <!-- Card Actions -->
    <div v-if="properties.showActions" class="mat-card-actions" :style="actionsStyle">
      <div class="card-actions-content">
        <button
          v-for="(action, index) in cardActions"
          :key="index"
          class="mat-button"
          :class="getActionButtonClasses(action)"
          @click="handleActionClick(action, index)"
        >
          <span v-if="action.icon" class="material-icons">{{ action.icon }}</span>
          <span>{{ action.text }}</span>
        </button>
      </div>
    </div>

    <!-- Card Footer -->
    <div v-if="properties.showFooter" class="mat-card-footer">
      <div class="footer-content">
        <span v-if="properties.footerText" class="footer-text">{{ properties.footerText }}</span>
        <span v-if="properties.timestamp" class="footer-timestamp">{{ formatTimestamp() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  properties: {
    title?: string;
    subtitle?: string;
    content?: string;
    imageUrl?: string;
    imageAlt?: string;
    avatar?: boolean;
    avatarText?: string;
    avatarColor?: string;
    showHeader?: boolean;
    showImage?: boolean;
    showActions?: boolean;
    showFooter?: boolean;
    headerActions?: boolean;
    footerText?: string;
    timestamp?: string;
    elevation?: number;
    backgroundColor?: string;
    borderRadius?: number;
    width?: number;
    height?: number;
    padding?: number;
    margin?: number;
    actions?: Array<{
      text: string;
      icon?: string;
      color?: 'primary' | 'accent' | 'warn';
      type?: 'raised' | 'stroked' | 'flat';
    }>;
    layout?: 'vertical' | 'horizontal';
    appearance?: 'raised' | 'outlined' | 'flat';
  };
}>();

const emit = defineEmits(['update:properties', 'action-click', 'menu-click', 'image-error']);

// Computed properties
const cardClasses = computed(() => [
  'mat-card',
  `mat-card-${props.properties.appearance || 'raised'}`,
  `layout-${props.properties.layout || 'vertical'}`,
]);

const cardStyle = computed(() => {
  const style: Record<string, any> = {};

  if (props.properties.elevation) {
    const elevation = props.properties.elevation;
    style.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.12), 0 ${Math.ceil(elevation / 2)}px ${elevation}px rgba(0, 0, 0, 0.24)`;
  }

  if (props.properties.backgroundColor) style.backgroundColor = props.properties.backgroundColor;
  if (props.properties.borderRadius) style.borderRadius = `${props.properties.borderRadius}px`;
  if (props.properties.width) style.width = `${props.properties.width}px`;
  if (props.properties.height) style.height = `${props.properties.height}px`;
  if (props.properties.padding) style.padding = `${props.properties.padding}px`;
  if (props.properties.margin) style.margin = `${props.properties.margin}px`;

  return style;
});

const avatarStyle = computed(() => ({
  backgroundColor: props.properties.avatarColor || '#1976d2',
}));

const imageStyle = computed(() => ({
  width: '100%',
  height: 'auto',
  display: 'block',
}));

const contentStyle = computed(() => ({
  padding: `${props.properties.padding || 16}px`,
}));

const actionsStyle = computed(() => ({
  padding: props.properties.layout === 'horizontal' ? '8px 16px' : '8px',
  justifyContent: props.properties.layout === 'horizontal' ? 'flex-end' : 'flex-start',
}));

const cardActions = computed(() => {
  return props.properties.actions || [
    { text: 'LIKE', icon: 'favorite_border', color: 'primary' },
    { text: 'SHARE', icon: 'share', color: 'primary' }
  ];
});

// Methods
const getAvatarText = (): string => {
  if (props.properties.avatarText) return props.properties.avatarText;
  if (props.properties.title) return props.properties.title.charAt(0).toUpperCase();
  return 'A';
};

const getActionButtonClasses = (action: any) => [
  'mat-button',
  `mat-${action.color || 'primary'}`,
  `mat-${action.type || 'flat'}`,
];

const handleActionClick = (action: any, index: number) => {
  emit('action-click', { action, index });
};

const handleMenuClick = () => {
  emit('menu-click');
};

const handleImageError = () => {
  emit('image-error');
};

const formatTimestamp = (): string => {
  if (!props.properties.timestamp) return '';
  const date = new Date(props.properties.timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
</script>

<style scoped>
.card-angular {
  font-family: 'Roboto', sans-serif;
}

.mat-card {
  background: white;
  border-radius: 4px;
  color: rgba(0, 0, 0, 0.87);
  display: block;
  overflow: hidden;
  position: relative;
  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

.mat-card-raised {
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
              0 1px 1px 0 rgba(0, 0, 0, 0.14),
              0 1px 3px 0 rgba(0, 0, 0, 0.12);
}

.mat-card-outlined {
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: none;
}

.mat-card-flat {
  box-shadow: none;
}

/* Card Header */
.mat-card-header {
  display: flex;
  align-items: center;
  padding: 16px 16px 0;
}

.mat-card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  margin-right: 16px;
  flex-shrink: 0;
}

.mat-card-header-text {
  flex: 1;
  overflow: hidden;
}

.mat-card-title {
  font-size: 20px;
  font-weight: 500;
  line-height: 32px;
  margin: 0;
  color: rgba(0, 0, 0, 0.87);
}

.mat-card-subtitle {
  font-size: 14px;
  line-height: 20px;
  margin: 0;
  color: rgba(0, 0, 0, 0.6);
}

.mat-card-header-actions {
  margin-left: 8px;
  flex-shrink: 0;
}

.mat-icon-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.54);
  transition: background-color 0.2s ease;
}

.mat-icon-button:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Card Image */
.mat-card-image {
  margin: 16px 0 0;
}

.mat-card-image img {
  border-radius: 0;
  object-fit: cover;
}

/* Card Content */
.mat-card-content {
  padding: 16px;
  font-size: 14px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.87);
}

.card-text {
  margin: 0;
}

.card-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: rgba(0, 0, 0, 0.38);
  text-align: center;
}

.card-placeholder .material-icons {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 16px;
  font-weight: 500;
}

/* Card Actions */
.mat-card-actions {
  display: flex;
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.card-actions-content {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mat-card-actions .mat-button {
  margin: 0;
  padding: 8px 16px;
  min-width: 64px;
  height: 36px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.75px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: #1976d2;
}

.mat-card-actions .mat-button:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

.mat-card-actions .mat-button.mat-accent {
  color: #ff4081;
}

.mat-card-actions .mat-button.mat-warn {
  color: #f44336;
}

.mat-card-actions .mat-button .material-icons {
  font-size: 18px;
}

/* Card Footer */
.mat-card-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background-color: rgba(0, 0, 0, 0.02);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-text {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.footer-timestamp {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.38);
}

/* Horizontal layout */
.layout-horizontal {
  display: flex;
}

.layout-horizontal .mat-card-image {
  flex-shrink: 0;
  width: 160px;
  margin: 0;
}

.layout-horizontal .mat-card-content {
  flex: 1;
}

/* Hover effects */
.mat-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .mat-card {
    background: #424242;
    color: rgba(255, 255, 255, 0.87);
  }

  .mat-card-title {
    color: rgba(255, 255, 255, 0.87);
  }

  .mat-card-subtitle {
    color: rgba(255, 255, 255, 0.6);
  }

  .mat-card-content {
    color: rgba(255, 255, 255, 0.87);
  }

  .mat-icon-button {
    color: rgba(255, 255, 255, 0.54);
  }

  .mat-icon-button:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .mat-card-actions {
    border-top-color: rgba(255, 255, 255, 0.12);
  }

  .mat-card-footer {
    border-top-color: rgba(255, 255, 255, 0.12);
    background-color: rgba(255, 255, 255, 0.02);
  }
}
</style>
