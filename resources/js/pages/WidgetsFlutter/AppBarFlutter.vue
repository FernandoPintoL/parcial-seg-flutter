<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    title?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    elevation?: number;
    centerTitle?: boolean;
    leading?: boolean;
    actions?: Array<{icon: string, label: string}>;
    height?: number;
}

const props = defineProps<Props>();

const appBarStyle = computed(() => ({
    height: (props.height || 56) + 'px',
    backgroundColor: props.backgroundColor || '#2196F3',
    color: props.foregroundColor || '#ffffff',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    boxShadow: props.elevation !== undefined ? `0 ${props.elevation}px ${props.elevation! * 2}px rgba(0,0,0,0.2)` : '0 2px 4px rgba(0,0,0,0.2)',
    position: 'relative',
    zIndex: 10,
}));

const titleStyle = computed(() => ({
    fontSize: '20px',
    fontWeight: '500',
    flex: 1,
    textAlign: props.centerTitle ? 'center' : 'left',
    marginLeft: props.leading ? '16px' : '0',
}));
</script>

<template>
    <div :style="appBarStyle" class="app-bar-flutter">
        <!-- Leading icon (back button, menu, etc.) -->
        <div v-if="props.leading" class="leading-icon">
            <span class="material-icons">arrow_back</span>
        </div>

        <!-- Title -->
        <div :style="titleStyle" class="app-bar-title">
            {{ props.title || 'App Title' }}
        </div>

        <!-- Action buttons -->
        <div v-if="props.actions && props.actions.length > 0" class="app-bar-actions">
            <button
                v-for="action in props.actions"
                :key="action.label"
                class="action-button"
                :title="action.label"
            >
                <span class="material-icons">{{ action.icon }}</span>
            </button>
        </div>

        <!-- Default actions if none provided -->
        <div v-else class="app-bar-actions">
            <button class="action-button" title="More options">
                <span class="material-icons">more_vert</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.app-bar-flutter {
    user-select: none;
    font-family: 'Roboto', sans-serif;
    width: 100%;
    min-height: 56px;
}

.leading-icon {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.leading-icon:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.app-bar-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.app-bar-actions {
    display: flex;
    gap: 8px;
}

.action-button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.action-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.action-button .material-icons {
    font-size: 24px;
}
</style>
