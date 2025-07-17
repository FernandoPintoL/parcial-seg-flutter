<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    icon?: string;
    size?: number;
    color?: string;
    semanticLabel?: string;
}

const props = defineProps<Props>();

const iconStyle = computed(() => ({
    fontSize: (props.size || 24) + 'px',
    color: props.color || '#757575',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
}));
</script>

<template>
    <span
        :style="iconStyle"
        class="material-icons icon-flutter"
        :title="props.semanticLabel"
    >
        {{ props.icon || 'star' }}
    </span>
</template>

<style scoped>
.icon-flutter {
    user-select: none;
    vertical-align: middle;
}
</style>
