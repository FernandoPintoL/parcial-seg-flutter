<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits(['close']);

function emitClose() {
    emit('close');
}
</script>
<template>
    <div v-if="props.open" class="drawer-backdrop" @click.self="emitClose">
        <nav class="drawer">
            <header class="drawer-header">
                <slot name="header">
                    <div class="avatar"></div>
                    <div class="user-info">
                        <div class="user-name">Usuario</div>
                        <div class="user-email">usuario@email.com</div>
                    </div>
                </slot>
                <button class="close-btn" @click="emitClose">&times;</button>
            </header>
            <ul class="drawer-list">
                <slot>
                    <li class="drawer-item">Inicio</li>
                    <li class="drawer-item">Perfil</li>
                    <li class="drawer-item">Ajustes</li>
                </slot>
            </ul>
        </nav>
    </div>
</template>
<style scoped>
.drawer-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 1000;
    display: flex;
}
.drawer {
    width: 280px;
    background: #fff;
    height: 100%;
    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    animation: slideIn 0.25s;
}
@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}
.drawer-header {
    display: flex;
    align-items: center;
    padding: 24px 16px 16px 16px;
    border-bottom: 1px solid #eee;
    position: relative;
}
.avatar {
    width: 48px;
    height: 48px;
    background: #1976d2;
    border-radius: 50%;
    margin-right: 16px;
}
.user-info {
    flex: 1;
}
.user-name {
    font-weight: bold;
    font-size: 1.1em;
}
.user-email {
    font-size: 0.95em;
    color: #666;
}
.close-btn {
    background: none;
    border: none;
    font-size: 2em;
    color: #888;
    position: absolute;
    right: 12px;
    top: 12px;
    cursor: pointer;
}
.drawer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
}
.drawer-item {
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s;
}
.drawer-item:hover {
    background: #f5f5f5;
}
</style>
