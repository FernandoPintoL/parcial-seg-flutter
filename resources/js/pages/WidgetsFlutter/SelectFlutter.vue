<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  value?: string;
  items?: string[];
  label?: string;
  onChanged?: (value: string) => void;
}>();

const isOpen = ref(false);
const selectedValue = ref(props.value || (props.items && props.items.length > 0 ? props.items[0] : ''));

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectOption(option: string) {
  selectedValue.value = option;
  isOpen.value = false;
  if (props.onChanged) {
    props.onChanged(option);
  }
}

function closeDropdown() {
  isOpen.value = false;
}
</script>

<template>
  <div class="select-flutter">
    <label v-if="props.label" class="select-label">{{ props.label }}</label>
    <div class="select-container" @click.stop="toggleDropdown" @blur="closeDropdown" tabindex="0">
      <div class="select-value">{{ selectedValue }}</div>
      <div class="select-arrow" :class="{ 'open': isOpen }">▼</div>

      <div v-if="isOpen" class="select-options">
        <div
          v-for="(item, index) in props.items"
          :key="index"
          class="select-option"
          :class="{ 'selected': item === selectedValue }"
          @click.stop="selectOption(item)"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.select-flutter {
  font-family: 'Roboto', sans-serif;
  padding: 8px;
  width: 100%;
  max-width: 300px;
}

.select-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #757575;
}

.select-container {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px 16px;
  background-color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  outline: none;
}

.select-container:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.select-value {
  flex: 1;
}

.select-arrow {
  font-size: 12px;
  color: #757575;
  transition: transform 0.2s ease;
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.select-option {
  padding: 12px 16px;
  cursor: pointer;
}

.select-option:hover {
  background-color: #f5f5f5;
}

.select-option.selected {
  background-color: #e3f2fd;
  color: #2196F3;
}
</style>
