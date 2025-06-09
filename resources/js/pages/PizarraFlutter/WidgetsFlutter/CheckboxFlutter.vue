<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  value: boolean;
  activeColor?: string;
  onChanged?: (value: boolean) => void;
}>();

function toggleCheckbox() {
  if (props.onChanged) {
    props.onChanged(!props.value);
  }
}
</script>

<template>
  <div class="checkbox-flutter">
    <label class="checkbox-container">
      <input
        type="checkbox"
        :checked="props.value"
        @change="toggleCheckbox"
      >
      <span
        class="checkmark"
        :style="{ backgroundColor: props.value ? (props.activeColor || '#2196F3') : 'transparent' }"
      ></span>
      <slot>Checkbox</slot>
    </label>
  </div>
</template>

<style scoped>
.checkbox-flutter {
  font-family: 'Roboto', sans-serif;
  padding: 8px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 35px;
  margin-bottom: 12px;
  cursor: pointer;
  font-size: 16px;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  left: 0;
  height: 24px;
  width: 24px;
  border: 2px solid #757575;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: #2196F3;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 8px;
  top: 4px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
