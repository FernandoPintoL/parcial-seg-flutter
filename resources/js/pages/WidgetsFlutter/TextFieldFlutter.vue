<template>
  <div class="text-field-flutter" :style="containerStyle">
    <div class="input-container">
      <input
        v-model="inputValue"
        :type="inputType"
        :placeholder="properties.label"
        :disabled="!properties.enabled"
        :class="inputClasses"
        :style="inputStyle"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <label v-if="properties.label" class="input-label" :style="labelStyle">
        {{ properties.label }}
      </label>
      <div v-if="isFocused || inputValue" class="input-underline" :style="underlineStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  properties: {
    label: string;
    decoration: string;
    controller: string;
    keyboardType: string;
    obscureText: boolean;
    enabled: boolean;
    width?: number;
    height?: number;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    focusColor?: string;
    hintText?: string;
  };
}>();

const emit = defineEmits(['update:properties', 'input-change']);

const inputValue = ref('');
const isFocused = ref(false);

// Computed properties
const inputType = computed(() => {
  if (props.properties.obscureText) return 'password';
  switch (props.properties.keyboardType) {
    case 'TextInputType.number':
      return 'number';
    case 'TextInputType.email':
      return 'email';
    case 'TextInputType.phone':
      return 'tel';
    default:
      return 'text';
  }
});

const containerStyle = computed(() => ({
  width: props.properties.width ? `${props.properties.width}px` : '100%',
  height: props.properties.height ? `${props.properties.height}px` : 'auto',
  backgroundColor: props.properties.backgroundColor || 'transparent',
  padding: '8px',
  marginBottom: '16px',
}));

const inputClasses = computed(() => [
  'flutter-input',
  {
    'input-focused': isFocused.value,
    'input-disabled': !props.properties.enabled,
    'input-filled': inputValue.value,
  }
]);

const inputStyle = computed(() => ({
  color: props.properties.textColor || '#000000',
  borderColor: isFocused.value
    ? (props.properties.focusColor || '#2196F3')
    : (props.properties.borderColor || '#E0E0E0'),
}));

const labelStyle = computed(() => ({
  color: isFocused.value
    ? (props.properties.focusColor || '#2196F3')
    : '#757575',
}));

const underlineStyle = computed(() => ({
  backgroundColor: props.properties.focusColor || '#2196F3',
  transform: isFocused.value ? 'scaleX(1)' : 'scaleX(0)',
}));

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
  emit('input-change', target.value);
};

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
};

// Watch for external changes
watch(() => props.properties, (newProps) => {
  if (newProps.controller) {
    inputValue.value = '';
  }
}, { deep: true });
</script>

<style scoped>
.text-field-flutter {
  position: relative;
  display: flex;
  flex-direction: column;
  font-family: 'Roboto', sans-serif;
}

.input-container {
  position: relative;
  display: flex;
  flex-direction: column;
}

.flutter-input {
  width: 100%;
  padding: 16px 12px 8px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1.5;
  background: transparent;
  transition: all 0.2s ease;
  outline: none;
}

.flutter-input:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.flutter-input:disabled {
  background-color: #F5F5F5;
  color: #BDBDBD;
  cursor: not-allowed;
}

.input-label {
  position: absolute;
  top: 16px;
  left: 12px;
  font-size: 16px;
  color: #757575;
  transition: all 0.2s ease;
  pointer-events: none;
  background: white;
  padding: 0 4px;
}

.input-focused .input-label,
.input-filled .input-label {
  top: -8px;
  left: 8px;
  font-size: 12px;
  color: #2196F3;
}

.input-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background-color: #2196F3;
  transform: scaleX(0);
  transition: transform 0.2s ease;
  transform-origin: center;
}

.input-focused .input-underline {
  transform: scaleX(1);
}

/* Material Design ripple effect */
.flutter-input:focus::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(33, 150, 243, 0.12);
  border-radius: 4px;
  pointer-events: none;
}
</style>
