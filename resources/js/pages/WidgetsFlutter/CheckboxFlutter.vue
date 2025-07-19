<script setup lang="ts">


const props = defineProps({
    value: {
        type: Boolean,
        default: false,
    },
    activeColor: {
        type: String,
        default: '#2196F3',
    },
    checkColor: {
        type: String,
        default: '#FFFFFF',
    },
    size: {
        type: Number,
        default: 24,
    },
    focusColor: {
        type: String,
        default: '#BBDEFB',
    },
    hoverColor: {
        type: String,
        default: '#E3F2FD',
    },
    isEnabled: {
        type: Boolean,
        default: true,
    },
    borderColor: {
        type: String,
        default: '#757575',
    },
    label: {
        type: String,
        default: 'Checkbox',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:value', 'change']);

function toggleCheckbox(event: Event) {
    if (!props.disabled) {
        // Corregido: Tipamos correctamente el event.target como HTMLInputElement
        const target = event.target as HTMLInputElement;
        const newValue = target.checked;

        emit('update:value', newValue);
        emit('change', newValue);
    }
}
</script>

<template>
    <div class="checkbox-flutter" :class="{ 'checkbox-disabled': disabled }">
        <label class="checkbox-container">
            <input type="checkbox" :checked="value" :disabled="disabled" @change="toggleCheckbox" />
            <span
                class="checkmark"
                :style="{
                    backgroundColor: value ? activeColor : 'transparent',
                    borderColor: borderColor,
                    width: `${size}px`,
                    height: `${size}px`,
                }"
            ></span>
            <span v-if="label" class="checkbox-label">{{ label }}</span>
            <slot v-else></slot>
        </label>
    </div>
</template>

<style scoped>
.checkbox-flutter {
    font-family: 'Roboto', sans-serif;
    padding: 8px;
}

.checkbox-container {
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 35px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 16px;
    user-select: none;
}

.checkbox-disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.checkbox-disabled .checkbox-container {
    cursor: not-allowed;
}

.checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    position: absolute;
    left: 0;
    height: 24px;
    width: 24px;
    border: 2px solid #757575;
    border-radius: 2px;
    transition: all 0.2s ease;
}

.checkbox-container:hover input:not(:disabled) ~ .checkmark {
    border-color: #2196f3;
}

.checkmark:after {
    content: '';
    position: absolute;
    display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
    display: block;
}

.checkbox-container .checkmark:after {
    left: 8px;
    top: 4px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.checkbox-label {
    margin-left: 8px;
}
</style>
