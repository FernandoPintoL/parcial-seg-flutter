<template>
  <div class="padding-flutter" :style="paddingStyle">
    <div class="padding-content">
      <slot>
        <div class="padding-placeholder">
          <span class="material-icons">crop_free</span>
          <span class="placeholder-text">Padding Container</span>
          <span class="padding-info">{{ paddingInfo }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  properties?: {
    padding?: string;
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    margin?: string;
  };
}>();

const emit = defineEmits(['update:properties']);

// Computed properties
const paddingStyle = computed(() => {
  const style: Record<string, any> = {};

  // Safe access to properties with fallback
  const safeProperties = props.properties || {};

  // Parse Flutter EdgeInsets
  const paddingValue = parsePadding(safeProperties.padding);
  if (paddingValue) {
    style.padding = paddingValue;
  }

  // Parse margin if provided
  if (safeProperties.margin) {
    const marginValue = parsePadding(safeProperties.margin);
    if (marginValue) {
      style.margin = marginValue;
    }
  }

  // Apply other styles
  if (safeProperties.width) style.width = `${safeProperties.width}px`;
  if (safeProperties.height) style.height = `${safeProperties.height}px`;
  if (safeProperties.backgroundColor) style.backgroundColor = safeProperties.backgroundColor;
  if (safeProperties.borderRadius) style.borderRadius = `${safeProperties.borderRadius}px`;
  if (safeProperties.borderColor && safeProperties.borderWidth) {
    style.border = `${safeProperties.borderWidth}px solid ${safeProperties.borderColor}`;
  }

  return style;
});

const paddingInfo = computed(() => {
  const safeProperties = props.properties || {};
  const paddingValue = parsePadding(safeProperties.padding);
  return paddingValue || safeProperties.padding || 'No padding';
});

// Helper function to parse Flutter EdgeInsets
const parsePadding = (paddingString?: string): string | null => {
  if (!paddingString) return null;

  // Handle EdgeInsets.all(value)
  const allMatch = paddingString.match(/EdgeInsets\.all\((\d+(?:\.\d+)?)\)/);
  if (allMatch) {
    return `${allMatch[1]}px`;
  }

  // Handle EdgeInsets.symmetric(horizontal: value, vertical: value)
  const symmetricMatch = paddingString.match(/EdgeInsets\.symmetric\((?:horizontal:\s*(\d+(?:\.\d+)?))?,?\s*(?:vertical:\s*(\d+(?:\.\d+)?))?\)/);
  if (symmetricMatch) {
    const horizontal = symmetricMatch[1] || '0';
    const vertical = symmetricMatch[2] || '0';
    return `${vertical}px ${horizontal}px`;
  }

  // Handle EdgeInsets.only(left: value, top: value, right: value, bottom: value)
  const onlyMatch = paddingString.match(/EdgeInsets\.only\(([^)]+)\)/);
  if (onlyMatch) {
    const params = onlyMatch[1];
    const left = params.match(/left:\s*(\d+(?:\.\d+)?)/)?.[1] || '0';
    const top = params.match(/top:\s*(\d+(?:\.\d+)?)/)?.[1] || '0';
    const right = params.match(/right:\s*(\d+(?:\.\d+)?)/)?.[1] || '0';
    const bottom = params.match(/bottom:\s*(\d+(?:\.\d+)?)/)?.[1] || '0';
    return `${top}px ${right}px ${bottom}px ${left}px`;
  }

  // Handle EdgeInsets.fromLTRB(left, top, right, bottom)
  const ltrbMatch = paddingString.match(/EdgeInsets\.fromLTRB\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\)/);
  if (ltrbMatch) {
    return `${ltrbMatch[2]}px ${ltrbMatch[3]}px ${ltrbMatch[4]}px ${ltrbMatch[1]}px`;
  }

  // Handle direct CSS values
  if (paddingString.includes('px') || paddingString.includes('em') || paddingString.includes('rem')) {
    return paddingString;
  }

  return null;
};
</script>

<style scoped>
.padding-flutter {
  display: flex;
  font-family: 'Roboto', sans-serif;
  position: relative;
  transition: all 0.2s ease;
  min-height: 60px;
  box-sizing: border-box;
}

.padding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.padding-placeholder {
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

.padding-placeholder:hover {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.05);
  color: #2196F3;
}

.padding-placeholder .material-icons {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.padding-info {
  font-size: 12px;
  font-family: 'Fira Code', monospace;
  opacity: 0.7;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

/* Visual padding indicator */
.padding-flutter::before {
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

.padding-flutter:hover::before {
  opacity: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .padding-flutter {
    min-height: 50px;
  }

  .padding-placeholder {
    min-height: 50px;
    padding: 12px;
  }

  .padding-placeholder .material-icons {
    font-size: 24px;
  }

  .placeholder-text {
    font-size: 12px;
  }

  .padding-info {
    font-size: 10px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .padding-placeholder {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: #424242;
    color: #BDBDBD;
  }

  .padding-placeholder:hover {
    border-color: #64B5F6;
    background-color: rgba(100, 181, 246, 0.05);
    color: #64B5F6;
  }

  .padding-info {
    background-color: rgba(0, 0, 0, 0.3);
    color: #E0E0E0;
  }
}
</style>
