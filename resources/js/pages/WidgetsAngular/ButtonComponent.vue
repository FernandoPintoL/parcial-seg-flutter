<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg';
    outline?: boolean;
    rounded?: boolean;
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
    icon?: string;
    iconPosition?: 'left' | 'right';
    text?: string;
    type?: 'button' | 'submit' | 'reset';
}

const props = defineProps<Props>();
const emit = defineEmits(['click']);

const buttonClasses = computed(() => {
    const classes = ['btn-angular'];

    // Variant classes
    if (props.outline) {
        classes.push(`btn-outline-${props.variant || 'primary'}`);
    } else {
        classes.push(`btn-${props.variant || 'primary'}`);
    }

    // Size classes
    classes.push(`btn-${props.size || 'md'}`);

    // Modifier classes
    if (props.rounded) classes.push('btn-rounded');
    if (props.disabled) classes.push('btn-disabled');
    if (props.loading) classes.push('btn-loading');
    if (props.block) classes.push('btn-block');

    return classes.join(' ');
});

function handleClick(event: Event) {
    if (!props.disabled && !props.loading) {
        emit('click', event);
    }
}
</script>

<template>
    <button
        :type="props.type || 'button'"
        :class="buttonClasses"
        :disabled="props.disabled || props.loading"
        @click="handleClick"
        class="btn-angular"
    >
        <!-- Loading spinner -->
        <span v-if="props.loading" class="btn-spinner">
            <span class="spinner"></span>
        </span>

        <!-- Left icon -->
        <span
            v-if="props.icon && props.iconPosition !== 'right' && !props.loading"
            class="material-icons btn-icon btn-icon-left"
        >
            {{ props.icon }}
        </span>

        <!-- Button text -->
        <span v-if="!props.loading" class="btn-text">
            <slot>{{ props.text || 'Button' }}</slot>
        </span>

        <!-- Right icon -->
        <span
            v-if="props.icon && props.iconPosition === 'right' && !props.loading"
            class="material-icons btn-icon btn-icon-right"
        >
            {{ props.icon }}
        </span>
    </button>
</template>

<style scoped>
.btn-angular {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    user-select: none;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.btn-angular:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--btn-focus-color), 0.25);
}

/* Sizes */
.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

.btn-md {
    padding: 8px 16px;
    font-size: 14px;
}

.btn-lg {
    padding: 12px 20px;
    font-size: 16px;
}

/* Block button */
.btn-block {
    width: 100%;
}

/* Rounded button */
.btn-rounded {
    border-radius: 50px;
}

/* Disabled state */
.btn-disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Loading state */
.btn-loading {
    cursor: wait;
}

/* Primary variant */
.btn-primary {
    --btn-focus-color: 0, 123, 255;
    background-color: #007bff;
    border-color: #007bff;
    color: #fff;
}

.btn-primary:hover:not(:disabled) {
    background-color: #0056b3;
    border-color: #0056b3;
}

.btn-outline-primary {
    --btn-focus-color: 0, 123, 255;
    background-color: transparent;
    border-color: #007bff;
    color: #007bff;
}

.btn-outline-primary:hover:not(:disabled) {
    background-color: #007bff;
    color: #fff;
}

/* Secondary variant */
.btn-secondary {
    --btn-focus-color: 108, 117, 125;
    background-color: #6c757d;
    border-color: #6c757d;
    color: #fff;
}

.btn-secondary:hover:not(:disabled) {
    background-color: #545b62;
    border-color: #545b62;
}

.btn-outline-secondary {
    --btn-focus-color: 108, 117, 125;
    background-color: transparent;
    border-color: #6c757d;
    color: #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
    background-color: #6c757d;
    color: #fff;
}

/* Success variant */
.btn-success {
    --btn-focus-color: 40, 167, 69;
    background-color: #28a745;
    border-color: #28a745;
    color: #fff;
}

.btn-success:hover:not(:disabled) {
    background-color: #1e7e34;
    border-color: #1e7e34;
}

.btn-outline-success {
    --btn-focus-color: 40, 167, 69;
    background-color: transparent;
    border-color: #28a745;
    color: #28a745;
}

.btn-outline-success:hover:not(:disabled) {
    background-color: #28a745;
    color: #fff;
}

/* Danger variant */
.btn-danger {
    --btn-focus-color: 220, 53, 69;
    background-color: #dc3545;
    border-color: #dc3545;
    color: #fff;
}

.btn-danger:hover:not(:disabled) {
    background-color: #c82333;
    border-color: #c82333;
}

.btn-outline-danger {
    --btn-focus-color: 220, 53, 69;
    background-color: transparent;
    border-color: #dc3545;
    color: #dc3545;
}

.btn-outline-danger:hover:not(:disabled) {
    background-color: #dc3545;
    color: #fff;
}

/* Warning variant */
.btn-warning {
    --btn-focus-color: 255, 193, 7;
    background-color: #ffc107;
    border-color: #ffc107;
    color: #212529;
}

.btn-warning:hover:not(:disabled) {
    background-color: #e0a800;
    border-color: #e0a800;
}

.btn-outline-warning {
    --btn-focus-color: 255, 193, 7;
    background-color: transparent;
    border-color: #ffc107;
    color: #ffc107;
}

.btn-outline-warning:hover:not(:disabled) {
    background-color: #ffc107;
    color: #212529;
}

/* Info variant */
.btn-info {
    --btn-focus-color: 23, 162, 184;
    background-color: #17a2b8;
    border-color: #17a2b8;
    color: #fff;
}

.btn-info:hover:not(:disabled) {
    background-color: #138496;
    border-color: #138496;
}

.btn-outline-info {
    --btn-focus-color: 23, 162, 184;
    background-color: transparent;
    border-color: #17a2b8;
    color: #17a2b8;
}

.btn-outline-info:hover:not(:disabled) {
    background-color: #17a2b8;
    color: #fff;
}

/* Light variant */
.btn-light {
    --btn-focus-color: 248, 249, 250;
    background-color: #f8f9fa;
    border-color: #f8f9fa;
    color: #212529;
}

.btn-light:hover:not(:disabled) {
    background-color: #e2e6ea;
    border-color: #e2e6ea;
}

.btn-outline-light {
    --btn-focus-color: 248, 249, 250;
    background-color: transparent;
    border-color: #f8f9fa;
    color: #f8f9fa;
}

.btn-outline-light:hover:not(:disabled) {
    background-color: #f8f9fa;
    color: #212529;
}

/* Dark variant */
.btn-dark {
    --btn-focus-color: 52, 58, 64;
    background-color: #343a40;
    border-color: #343a40;
    color: #fff;
}

.btn-dark:hover:not(:disabled) {
    background-color: #23272b;
    border-color: #23272b;
}

.btn-outline-dark {
    --btn-focus-color: 52, 58, 64;
    background-color: transparent;
    border-color: #343a40;
    color: #343a40;
}

.btn-outline-dark:hover:not(:disabled) {
    background-color: #343a40;
    color: #fff;
}

/* Icons */
.btn-icon {
    font-size: 16px;
    line-height: 1;
}

.btn-icon-left {
    margin-right: 4px;
}

.btn-icon-right {
    margin-left: 4px;
}

/* Spinner */
.btn-spinner {
    display: inline-block;
    margin-right: 8px;
}

.spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 576px) {
    .btn-angular {
        padding: 6px 12px;
        font-size: 13px;
    }

    .btn-sm {
        padding: 3px 6px;
        font-size: 11px;
    }

    .btn-lg {
        padding: 10px 16px;
        font-size: 15px;
    }
}
</style>
