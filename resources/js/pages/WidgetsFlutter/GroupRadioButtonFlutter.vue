<script setup lang="ts">
import { ref, computed, watch, CSSProperties } from 'vue';

interface RadioOption {
    id: string | number;
    label: string;
    value: string | number;
}

const props = defineProps<{
    options: RadioOption[];
    modelValue: string | number | null;
    activeColor: string;
    size: number;
    orientation: string;
    spacing: number;
    disabled: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const selectedValue = ref(props.modelValue);

watch(
    () => props.modelValue,
    (newVal) => {
        selectedValue.value = newVal;
    }
);

function handleChange(value: string | number) {
    if (props.disabled) return;
    selectedValue.value = value;
    emit('update:modelValue', value);
    emit('change', value);
}

const groupStyles = computed<CSSProperties>(() => ({
    display: 'flex',
    flexDirection: props.orientation === 'vertical' ? 'column' : 'row',
    gap: `${props.spacing}px`,
}));

const getRadioStyles = (optionValue: string | number) => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    borderColor: selectedValue.value === optionValue && !props.disabled ? props.activeColor : '#757575',
});

const getInnerCircleStyles = (optionValue: string | number) => ({
    width: `${props.size * 0.5}px`,
    height: `${props.size * 0.5}px`,
    backgroundColor: props.disabled ? '#BDBDBD' : props.activeColor,
    display: selectedValue.value === optionValue ? 'block' : 'none',
});
</script>

<template>
  <div class="flutter-radio-group p-2" :style="groupStyles">
    <div
      v-for="option in options"
      :key="option.id"
      class="radio-option"
      :class="{ 'disabled': disabled }"
      @click="handleChange(option.value)"
    >
      <div class="radio-button-wrapper">
        <div class="radio-button" :style="getRadioStyles(option.value)">
          <div class="inner-circle" :style="getInnerCircleStyles(option.value)"></div>
        </div>
        <div class="radio-label" :style="{ fontSize: `${size * 0.75}px` }">{{ option.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flutter-radio-group {
  font-family: 'Roboto', sans-serif;
}

.radio-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  margin: 4px 0;
}

.radio-button-wrapper {
  display: flex;
  align-items: center;
}

.radio-button {
  border: 2px solid;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.inner-circle {
  border-radius: 50%;
  transition: all 0.3s ease;
}

.radio-label {
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.87);
}

.disabled {
  cursor: default;
  opacity: 0.6;
}

.disabled .radio-label {
  color: rgba(0, 0, 0, 0.38);
}

/* Efecto de ripple (simulado) */
.radio-option:not(.disabled):active .radio-button::after {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.12;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  transition: all 0.3s ease;
}
</style>
