<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    backgroundColor?: string;
    body?: string;
    floatingActionButton?: boolean;
    fabIcon?: string;
    fabColor?: string;
    drawer?: boolean;
    appBar?: boolean;
    appBarTitle?: string;
    appBarColor?: string;
}

const props = defineProps<Props>();

const scaffoldStyle = computed(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: props.backgroundColor || '#fafafa',
    position: 'relative',
    overflow: 'hidden',
}));

const bodyStyle = computed(() => ({
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    backgroundColor: 'inherit',
}));

const fabStyle = computed(() => ({
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: props.fabColor || '#2196F3',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.2s',
    zIndex: 1000,
}));
</script>

<template>
    <div :style="scaffoldStyle" class="scaffold-flutter">
        <!-- App Bar -->
        <div v-if="props.appBar" class="scaffold-app-bar">
            <div class="app-bar" :style="{ backgroundColor: props.appBarColor || '#2196F3' }">
                <div class="app-bar-content">
                    <span class="app-bar-title">{{ props.appBarTitle || 'Flutter App' }}</span>
                    <div class="app-bar-actions">
                        <span class="material-icons action-icon">search</span>
                        <span class="material-icons action-icon">more_vert</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Body -->
        <div :style="bodyStyle" class="scaffold-body">
            <slot>
                <div class="scaffold-placeholder">
                    <div class="placeholder-content">
                        <span class="material-icons placeholder-icon">dashboard</span>
                        <p class="placeholder-text">Scaffold Body</p>
                        <p class="placeholder-subtitle">Arrastra widgets aquí</p>
                    </div>
                </div>
            </slot>
        </div>

        <!-- Floating Action Button -->
        <button
            v-if="props.floatingActionButton"
            :style="fabStyle"
            class="floating-action-button"
            title="Floating Action Button"
        >
            <span class="material-icons">{{ props.fabIcon || 'add' }}</span>
        </button>

        <!-- Drawer overlay (visual representation) -->
        <div v-if="props.drawer" class="drawer-indicator">
            <span class="material-icons">menu</span>
        </div>
    </div>
</template>

<style scoped>
.scaffold-flutter {
    font-family: 'Roboto', sans-serif;
    box-sizing: border-box;
}

.scaffold-app-bar {
    height: 56px;
    background: #2196F3;
    color: white;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.app-bar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 16px;
}

.app-bar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.app-bar-title {
    font-size: 20px;
    font-weight: 500;
    color: white;
}

.app-bar-actions {
    display: flex;
    gap: 8px;
}

.action-icon {
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.action-icon:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.scaffold-body {
    position: relative;
}

.scaffold-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    text-align: center;
}

.placeholder-content {
    max-width: 200px;
}

.placeholder-icon {
    font-size: 48px;
    color: #ccc;
    margin-bottom: 16px;
}

.placeholder-text {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 8px 0;
}

.placeholder-subtitle {
    font-size: 14px;
    color: #999;
    margin: 0;
}

.floating-action-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(0,0,0,0.4);
}

.drawer-indicator {
    position: absolute;
    top: 50%;
    left: 16px;
    transform: translateY(-50%);
    background: rgba(33, 150, 243, 0.1);
    color: #2196F3;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    opacity: 0.7;
}
</style>
