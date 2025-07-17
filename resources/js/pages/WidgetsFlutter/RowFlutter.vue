<template>
  <div class="row-flutter" :style="rowStyle">
    <div class="row-content" :style="contentStyle">
      <slot>
        <div class="row-placeholder">
          <span class="material-icons">view_week</span>
          <span class="placeholder-text">Row Layout</span>
          <span class="layout-info">{{ layoutInfo }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  properties: {
    mainAxisAlignment: string;
    crossAxisAlignment: string;
    mainAxisSize?: string;
    crossAxisSize?: string;
    textDirection?: string;
    verticalDirection?: string;
    width?: number;
    height?: number;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
  };
}>();

const emit = defineEmits(['update:properties']);

// Computed properties
const rowStyle = computed(() => {
  const style: Record<string, any> = {};

  if (props.properties.width) style.width = `${props.properties.width}px`;
  if (props.properties.height) style.height = `${props.properties.height}px`;
  if (props.properties.backgroundColor) style.backgroundColor = props.properties.backgroundColor;
  if (props.properties.padding) style.padding = parsePadding(props.properties.padding);
  if (props.properties.margin) style.margin = parsePadding(props.properties.margin);

  return style;
});

const contentStyle = computed(() => {
  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: 'row',
  };

  // Main axis alignment (horizontal for Row)
  switch (props.properties.mainAxisAlignment) {
    case 'MainAxisAlignment.start':
      style.justifyContent = 'flex-start';
      break;
    case 'MainAxisAlignment.center':
      style.justifyContent = 'center';
      break;
    case 'MainAxisAlignment.end':
      style.justifyContent = 'flex-end';
      break;
    case 'MainAxisAlignment.spaceBetween':
      style.justifyContent = 'space-between';
      break;
    case 'MainAxisAlignment.spaceAround':
      style.justifyContent = 'space-around';
      break;
    case 'MainAxisAlignment.spaceEvenly':
      style.justifyContent = 'space-evenly';
      break;
    default:
      style.justifyContent = 'flex-start';
  }

  // Cross axis alignment (vertical for Row)
  switch (props.properties.crossAxisAlignment) {
    case 'CrossAxisAlignment.start':
      style.alignItems = 'flex-start';
      break;
    case 'CrossAxisAlignment.center':
      style.alignItems = 'center';
      break;
    case 'CrossAxisAlignment.end':
      style.alignItems = 'flex-end';
      break;
    case 'CrossAxisAlignment.stretch':
      style.alignItems = 'stretch';
      break;
    case 'CrossAxisAlignment.baseline':
      style.alignItems = 'baseline';
      break;
    default:
      style.alignItems = 'center';
  }

  // Text direction
  if (props.properties.textDirection === 'TextDirection.rtl') {
    style.flexDirection = 'row-reverse';
  }

  return style;
});

const layoutInfo = computed(() => {
  const main = props.properties.mainAxisAlignment?.replace('MainAxisAlignment.', '') || 'start';
  const cross = props.properties.crossAxisAlignment?.replace('CrossAxisAlignment.', '') || 'center';
  return `Main: ${main}, Cross: ${cross}`;
});

// Helper function to parse Flutter EdgeInsets
const parsePadding = (paddingString: string): string | null => {
  if (!paddingString) return null;

  const allMatch = paddingString.match(/EdgeInsets\.all\((\d+(?:\.\d+)?)\)/);
  if (allMatch) {
    return `${allMatch[1]}px`;
  }

  const symmetricMatch = paddingString.match(/EdgeInsets\.symmetric\((?:horizontal:\s*(\d+(?:\.\d+)?))?,?\s*(?:vertical:\s*(\d+(?:\.\d+)?))?\)/);
  if (symmetricMatch) {
    const horizontal = symmetricMatch[1] || '0';
    const vertical = symmetricMatch[2] || '0';
    return `${vertical}px ${horizontal}px`;
  }

  if (paddingString.includes('px') || paddingString.includes('em') || paddingString.includes('rem')) {
    return paddingString;
  }

  return null;
};
</script>

<style scoped>
.row-flutter {
  display: flex;
  font-family: 'Roboto', sans-serif;
  position: relative;
  transition: all 0.2s ease;
  min-height: 60px;
  box-sizing: border-box;
}

.row-content {
  flex: 1;
  min-height: 100%;
  position: relative;
}

.row-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: #9E9E9E;
  border: 2px dashed #E0E0E0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  background-color: rgba(158, 158, 158, 0.05);
  transition: all 0.2s ease;
}

.row-placeholder:hover {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.05);
  color: #2196F3;
}

.row-placeholder .material-icons {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.layout-info {
  font-size: 12px;
  font-family: 'Fira Code', monospace;
  opacity: 0.7;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

/* Visual layout indicator */
.row-flutter::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 4px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.row-flutter:hover::before {
  opacity: 1;
}

/* Alignment indicators */
.row-flutter::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 8px;
  right: 8px;
  height: 1px;
  background: linear-gradient(to right,
    rgba(33, 150, 243, 0.3) 0%,
    rgba(33, 150, 243, 0.6) 50%,
    rgba(33, 150, 243, 0.3) 100%);
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.row-flutter:hover::after {
  opacity: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .row-flutter {
    min-height: 50px;
  }

  .row-placeholder {
    min-height: 50px;
    padding: 12px;
  }

  .row-placeholder .material-icons {
    font-size: 24px;
  }

  .placeholder-text {
    font-size: 12px;
  }

  .layout-info {
    font-size: 10px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .row-placeholder {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: #424242;
    color: #BDBDBD;
  }

  .row-placeholder:hover {
    border-color: #64B5F6;
    background-color: rgba(100, 181, 246, 0.05);
    color: #64B5F6;
  }

  .layout-info {
    background-color: rgba(0, 0, 0, 0.3);
    color: #E0E0E0;
  }
}
</style>
