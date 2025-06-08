<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { Chrome } from '@ckpack/vue-color';

interface Props {
  modelValue: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'change']);

// Convert hex color to rgba object for vue-color
const colorValue = ref({
  hex: props.modelValue || '#000000',
  rgba: { r: 0, g: 0, b: 0, a: 1 }
});

// Initialize the color value
const initColor = () => {
  const hex = props.modelValue || '#000000';
  // Convert hex to rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  colorValue.value = {
    hex,
    rgba: { r, g, b, a: 1 }
  };
};

// Watch for changes in the prop
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal !== colorValue.value.hex) {
    initColor();
  }
}, { immediate: true });

// Handle color change from the picker
const handleColorChange = (val: any) => {
  colorValue.value = val;
  emit('update:modelValue', val.hex);
  emit('change', val.hex);
};

// Toggle color picker visibility
const showPicker = ref(false);
const togglePicker = () => {
  showPicker.value = !showPicker.value;
};
</script>

<template>
  <div class="color-picker-container">
    <div class="color-preview-container">
      <div
        class="color-preview"
        :style="{ backgroundColor: modelValue }"
        @click="togglePicker"
      ></div>
      <input
        v-model="colorValue.hex"
        type="text"
        class="color-input"
        @change="handleColorChange(colorValue)"
      />
    </div>

    <div v-if="showPicker" class="color-picker-popup">
      <Chrome
        v-model="colorValue"
        @update:modelValue="handleColorChange"
      />
    </div>
  </div>
</template>

<style scoped>
.color-picker-container {
  position: relative;
}

.color-preview-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
}

.color-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.color-picker-popup {
  position: absolute;
  z-index: 100;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px;
}
</style>
