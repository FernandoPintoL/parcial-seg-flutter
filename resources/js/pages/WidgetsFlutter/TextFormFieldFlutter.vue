<template>
  <div class="text-form-field-flutter" :style="containerStyle">
    <div class="form-field-container">
      <input
        v-model="inputValue"
        :type="inputType"
        :placeholder="properties.hintText"
        :disabled="!properties.enabled"
        :class="inputClasses"
        :style="inputStyle"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <label v-if="properties.label" class="form-label" :style="labelStyle">
        {{ properties.label }}
      </label>
      <div v-if="isFocused || inputValue" class="form-underline" :style="underlineStyle"></div>
      <div v-if="errorMessage" class="error-message" :style="errorStyle">
        {{ errorMessage }}
      </div>
      <div v-if="properties.hintText && !inputValue && !isFocused" class="hint-text">
        {{ properties.hintText }}
      </div>
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
    validator: string;
    keyboardType: string;
    obscureText: boolean;
    enabled: boolean;
    hintText?: string;
    width?: number;
    height?: number;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    focusColor?: string;
    errorColor?: string;
  };
}>();

const emit = defineEmits(['update:properties', 'input-change', 'validation-change']);

const inputValue = ref('');
const isFocused = ref(false);
const errorMessage = ref('');
const isValid = ref(true);

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
  marginBottom: '24px',
}));

const inputClasses = computed(() => [
  'flutter-form-input',
  {
    'input-focused': isFocused.value,
    'input-disabled': !props.properties.enabled,
    'input-filled': inputValue.value,
    'input-error': !isValid.value,
  }
]);

const inputStyle = computed(() => ({
  color: props.properties.textColor || '#000000',
  borderColor: !isValid.value
    ? (props.properties.errorColor || '#F44336')
    : isFocused.value
      ? (props.properties.focusColor || '#2196F3')
      : (props.properties.borderColor || '#E0E0E0'),
}));

const labelStyle = computed(() => ({
  color: !isValid.value
    ? (props.properties.errorColor || '#F44336')
    : isFocused.value
      ? (props.properties.focusColor || '#2196F3')
      : '#757575',
}));

const underlineStyle = computed(() => ({
  backgroundColor: !isValid.value
    ? (props.properties.errorColor || '#F44336')
    : (props.properties.focusColor || '#2196F3'),
  transform: isFocused.value ? 'scaleX(1)' : 'scaleX(0)',
}));

const errorStyle = computed(() => ({
  color: props.properties.errorColor || '#F44336',
}));

// Validation logic
const validateInput = (value: string) => {
  if (!props.properties.validator) {
    isValid.value = true;
    errorMessage.value = '';
    return true;
  }

  // Simple validation rules based on validator string
  if (props.properties.validator.includes('isEmpty')) {
    if (!value || value.trim() === '') {
      isValid.value = false;
      errorMessage.value = 'Este campo es requerido';
      return false;
    }
  }

  if (props.properties.validator.includes('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid.value = false;
      errorMessage.value = 'Ingrese un email válido';
      return false;
    }
  }

  if (props.properties.validator.includes('length')) {
    if (value.length < 3) {
      isValid.value = false;
      errorMessage.value = 'Mínimo 3 caracteres';
      return false;
    }
  }

  isValid.value = true;
  errorMessage.value = '';
  return true;
};

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
  validateInput(target.value);
  emit('input-change', target.value);
  emit('validation-change', { isValid: isValid.value, error: errorMessage.value });
};

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
  validateInput(inputValue.value);
};

// Watch for external changes
watch(() => props.properties, (newProps) => {
  if (newProps.controller) {
    inputValue.value = '';
    isValid.value = true;
    errorMessage.value = '';
  }
}, { deep: true });
</script>

<style scoped>
.text-form-field-flutter {
  position: relative;
  display: flex;
  flex-direction: column;
  font-family: 'Roboto', sans-serif;
}

.form-field-container {
  position: relative;
  display: flex;
  flex-direction: column;
}

.flutter-form-input {
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

.flutter-form-input:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.flutter-form-input.input-error {
  border-color: #F44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

.flutter-form-input:disabled {
  background-color: #F5F5F5;
  color: #BDBDBD;
  cursor: not-allowed;
}

.form-label {
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

.input-focused .form-label,
.input-filled .form-label {
  top: -8px;
  left: 8px;
  font-size: 12px;
  color: #2196F3;
}

.input-error .form-label {
  color: #F44336;
}

.form-underline {
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

.input-focused .form-underline {
  transform: scaleX(1);
}

.error-message {
  margin-top: 4px;
  font-size: 12px;
  color: #F44336;
  min-height: 16px;
  display: flex;
  align-items: center;
}

.hint-text {
  position: absolute;
  top: 16px;
  left: 12px;
  font-size: 16px;
  color: #9E9E9E;
  pointer-events: none;
}

/* Animation for error shake effect */
.input-error {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>
