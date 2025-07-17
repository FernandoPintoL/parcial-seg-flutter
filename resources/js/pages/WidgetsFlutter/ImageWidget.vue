<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    src?: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight';
    alignment?: string;
    borderRadius?: number;
}

const props = defineProps<Props>();

const imageStyle = computed(() => ({
    width: typeof props.width === 'number' ? props.width + 'px' : props.width || '100px',
    height: typeof props.height === 'number' ? props.height + 'px' : props.height || '100px',
    objectFit: getObjectFit(props.fit || 'cover'),
    borderRadius: (props.borderRadius || 0) + 'px',
    display: 'block',
}));

function getObjectFit(fit: string): string {
    switch (fit) {
        case 'cover': return 'cover';
        case 'contain': return 'contain';
        case 'fill': return 'fill';
        case 'fitWidth': return 'cover';
        case 'fitHeight': return 'cover';
        default: return 'cover';
    }
}
</script>

<template>
    <img
        :src="props.src || 'https://via.placeholder.com/100x100/e0e0e0/757575?text=Image'"
        :alt="props.alt || 'Flutter Image'"
        :style="imageStyle"
        class="image-flutter"
    />
</template>

<style scoped>
.image-flutter {
    border: 1px solid #e0e0e0;
    user-select: none;
}
</style>
