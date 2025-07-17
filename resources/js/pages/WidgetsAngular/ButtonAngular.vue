<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    text?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    className?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['click']);

const buttonStyle = computed(() => {
    const variants = {
        primary: { bg: '#007bff', color: '#fff', hover: '#0056b3' },
        secondary: { bg: '#6c757d', color: '#fff', hover: '#545b62' },
        success: { bg: '#28a745', color: '#fff', hover: '#1e7e34' },
        danger: { bg: '#dc3545', color: '#fff', hover: '#c82333' },
        warning: { bg: '#ffc107', color: '#212529', hover: '#e0a800' },
        info: { bg: '#17a2b8', color: '#fff', hover: '#138496' },
    };

    const sizes = {
        small: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
        medium: { padding: '0.5rem 1rem', fontSize: '1rem' },
        large: { padding: '0.75rem 1.5rem', fontSize: '1.25rem' },
    };

    const variant = variants[props.variant || 'primary'];
    const size = sizes[props.size || 'medium'];

    return {
        backgroundColor: props.disabled ? '#e9ecef' : variant.bg,
        color: props.disabled ? '#6c757d' : variant.color,
        border: 'none',
        borderRadius: (props.borderRadius || 4) + 'px',
        padding: size.padding,
        fontSize: size.fontSize,
        fontWeight: '400',
        lineHeight: '1.5',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        width: typeof props.width === 'number' ? props.width + 'px' : props.width || 'auto',
        height: typeof props.height === 'number' ? props.height + 'px' : props.height || 'auto',
        transition: 'all 0.15s ease-in-out',
        outline: 'none',
        userSelect: 'none',
    };
});

function handleClick(event: Event) {
    if (!props.disabled) {
        emit('click', event);
    }
}
</script>

<template>
    <button
        :type="props.type || 'button'"
        :style="buttonStyle"
        :class="props.className"
        :disabled="props.disabled"
        class="angular-button"
        @click="handleClick"
    >
        <slot>{{ props.text || 'Button' }}</slot>
    </button>
</template>

<style scoped>
.angular-button:hover:not(:disabled) {
    filter: brightness(0.95);
    transform: translateY(-1px);
}

.angular-button:active:not(:disabled) {
    transform: translateY(0);
}

.angular-button:focus {
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}
</style>
