<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    label?: string;
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    width?: string | number;
    height?: string | number;
    padding?: number | string;
    margin?: number | string;
}

const props = defineProps<Props>();

const textStyle = computed(() => ({
    color: props.color || '#212121',
    backgroundColor: props.backgroundColor || 'transparent',
    fontSize: (props.fontSize || 14) + 'px',
    fontWeight: props.fontWeight || 'normal',
    textAlign: props.textAlign || 'left',
    width: typeof props.width === 'number' ? props.width + 'px' : props.width || 'auto',
    height: typeof props.height === 'number' ? props.height + 'px' : props.height || 'auto',
    padding: typeof props.padding === 'number' ? props.padding + 'px' : props.padding || '0',
    margin: typeof props.margin === 'number' ? props.margin + 'px' : props.margin || '0',
    display: 'inline-block',
    lineHeight: '1.4',
    wordWrap: 'break-word',
}));
</script>

<template>
    <div :style="textStyle" class="text-flutter">
        <slot>{{ props.label || 'Text Widget' }}</slot>
    </div>
</template>

<style scoped>
.text-flutter {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    user-select: text;
}
</style>
