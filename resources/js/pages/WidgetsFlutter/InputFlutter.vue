<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  decoration?: string;
  keyboardType?: string;
  obscureText?: boolean;
  enabled?: boolean;
  value?: string;
  onChanged?: (value: string) => void;
  label?: string; // Add direct label prop
}>();

const inputValue = ref(props.value || '');

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
  if (props.onChanged) {
    props.onChanged(target.value);
  }
}

// Use direct label prop if provided, otherwise extract from decoration
const label = computed(() => {
  // If direct label prop is provided, use it
  if (props.label !== undefined) return props.label;

  // Otherwise, extract from decoration if provided
  if (!props.decoration) return '';

  const labelMatch = props.decoration.match(/labelText:\s*["']([^"']*)["']/);
  return labelMatch ? labelMatch[1] : '';
});

// Extract hint from decoration if provided
const hint = computed(() => {
  if (!props.decoration) return '';

  const hintMatch = props.decoration.match(/hintText:\s*["']([^"']*)["']/);
  return hintMatch ? hintMatch[1] : '';
});

// Determine input type based on keyboardType
const inputType = computed(() => {
  if (props.obscureText) return 'password';

  switch (props.keyboardType) {
    case 'TextInputType.number': return 'number';
    case 'TextInputType.email': return 'email';
    case 'TextInputType.phone': return 'tel';
    default: return 'text';
  }
});
</script>

<template>
  <div class="input-flutter" :class="{ 'disabled': props.enabled === false }">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :type="inputType"
      :placeholder="hint"
      :value="inputValue"
      :disabled="props.enabled === false"
      @input="handleInput"
      class="input-field"
    />
  </div>
</template>

<style scoped>
.input-flutter {
  font-family: 'Roboto', sans-serif;
  padding: 8px;
  width: 100%;
  max-width: 300px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #757575;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-field:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.input-field::placeholder {
  color: #9e9e9e;
}

.disabled .input-field {
  background-color: #f5f5f5;
  color: #9e9e9e;
  cursor: not-allowed;
}
</style>
