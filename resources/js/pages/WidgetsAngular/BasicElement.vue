<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    tag?: string;
    text?: string;
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    width?: string | number;
    height?: string | number;
    padding?: string;
    margin?: string;
    borderRadius?: number;
    border?: string;
    className?: string;
}

const props = defineProps<Props>();

const elementStyle = computed(() => ({
    color: props.color || '#212529',
    backgroundColor: props.backgroundColor || 'transparent',
    fontSize: (props.fontSize || 14) + 'px',
    fontWeight: props.fontWeight || 'normal',
    textAlign: props.textAlign || 'left',
    width: typeof props.width === 'number' ? props.width + 'px' : props.width || 'auto',
    height: typeof props.height === 'number' ? props.height + 'px' : props.height || 'auto',
    padding: props.padding || '0',
    margin: props.margin || '0',
    borderRadius: (props.borderRadius || 0) + 'px',
    border: props.border || 'none',
    display: 'block',
    lineHeight: '1.5',
}));

const tagName = computed(() => props.tag || 'div');
</script>

<template>
    <component
        :is="tagName"
        :style="elementStyle"
        :class="props.className"
        class="angular-element"
    >
        <slot>{{ props.text || 'Angular Element' }}</slot>
    </component>
</template>

<style scoped>
.angular-element {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
}
</style>
