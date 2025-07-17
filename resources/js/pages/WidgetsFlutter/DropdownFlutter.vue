<script setup lang="ts">
import { defineProps, ref, computed } from 'vue';

const props = defineProps<{
  value?: string;
  items?: string[] | any[];
  onChanged?: (value: string) => void;
}>();

const isOpen = ref(false);
const selectedValue = ref(props.value || '');

// Parse items if they're provided as a string array
const dropdownItems = computed(() => {
  if (!props.items) return [];

  if (typeof props.items === 'string') {
    try {
      // Try to parse as JSON if it's a string
      return JSON.parse(props.items);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  }

  return props.items;
});

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
  <div class="dropdown-flutter p-2">
    <div class="dropdown-button" @click.stop="toggleDropdown" @blur="closeDropdown" tabindex="0">
      <span class="dropdown-selected">{{ selectedValue || 'Select an option' }}</span>
      <span class="dropdown-arrow" :class="{ 'open': isOpen }">▼</span>
    </div>

    <div v-if="isOpen" class="dropdown-menu">
      <div
        v-for="(item, index) in dropdownItems"
        :key="index"
        class="dropdown-item"
        :class="{ 'selected': item === selectedValue }"
        @click.stop="selectOption(item)"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-flutter {
  font-family: 'Roboto', sans-serif;
  position: relative;
  width: 100%;
  max-width: 300px;
}

.dropdown-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dropdown-button:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.dropdown-selected {
  flex: 1;
}

.dropdown-arrow {
  font-size: 12px;
  color: #757575;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.selected {
  background-color: #e3f2fd;
  color: #2196F3;
}
</style>
