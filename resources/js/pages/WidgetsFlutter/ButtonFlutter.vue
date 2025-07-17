<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    label?: string;
    backgroundColor?: string;
    textColor?: string;
    elevation?: number;
    borderRadius?: number;
    disabled?: boolean;
    width?: string | number;
    height?: string | number;
}

const props = defineProps<Props>();

const btnStyle = computed(() => ({
    background: props.disabled ? '#BDBDBD' : props.backgroundColor || '#1976D2',
    color: props.textColor || '#fff',
    boxShadow: props.elevation !== undefined ? `0 ${props.elevation}px ${props.elevation! * 2}px rgba(0,0,0,0.2)` : '0 2px 4px rgba(0,0,0,0.2)',
    borderRadius: (props.borderRadius ?? 6) + 'px',
    border: 'none',
    outline: 'none',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    width: typeof props.width === 'number' ? props.width + 'px' : props.width || 'auto',
    height: typeof props.height === 'number' ? props.height + 'px' : props.height || '40px',
    fontWeight: 500,
    fontSize: '1rem',
    transition: 'box-shadow 0.2s, background 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    userSelect: 'none',
}));
</script>

<template>
    <button :style="btnStyle" :disabled="props.disabled">
        <slot>{{ props.label || 'Elevated Button' }}</slot>
    </button>
</template>

<style scoped>
button:active:not(:disabled) {
    filter: brightness(0.95);
}

button:focus-visible {
    outline: 2px solid #1565c0;
}
</style>
