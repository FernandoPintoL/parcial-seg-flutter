<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    maxlength?: number;
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    className?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:value', 'input', 'change', 'focus', 'blur']);

const inputValue = ref(props.value || '');

const inputStyle = computed(() => ({
    width: typeof props.width === 'number' ? props.width + 'px' : props.width || '200px',
    height: typeof props.height === 'number' ? props.height + 'px' : props.height || '40px',
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    lineHeight: '1.5',
    color: '#495057',
    backgroundColor: props.disabled ? '#e9ecef' : '#fff',
    border: '1px solid #ced4da',
    borderRadius: (props.borderRadius || 4) + 'px',
    outline: 'none',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    cursor: props.disabled ? 'not-allowed' : 'text',
}));

function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    inputValue.value = target.value;
    emit('update:value', target.value);
    emit('input', event);
}

function handleChange(event: Event) {
    emit('change', event);
}

function handleFocus(event: Event) {
    emit('focus', event);
}

function handleBlur(event: Event) {
    emit('blur', event);
}
</script>

<template>
    <input
        :type="props.type || 'text'"
        :placeholder="props.placeholder || 'Enter text...'"
        :value="inputValue"
        :disabled="props.disabled"
        :readonly="props.readonly"
        :required="props.required"
        :maxlength="props.maxlength"
        :style="inputStyle"
        :class="props.className"
        class="angular-input"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
    />
</template>

<style scoped>
.angular-input:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.angular-input:invalid {
    border-color: #dc3545;
}

.angular-input:invalid:focus {
    border-color: #dc3545;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
}
</style>
