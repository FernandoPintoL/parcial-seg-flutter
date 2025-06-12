<script setup lang="ts">
// Define un tipo para las acciones
interface AppBarAction {
    icon: string;
    tooltip?: string;
    onClick?: () => void;
}

const props = defineProps({
    title: {
        type: String,
        default: 'App Bar'
    },
    backgroundColor: {
        type: String,
        default: '#2196F3'
    },
    elevation: {
        type: Number,
        default: 4
    },
    centerTitle: {
        type: Boolean,
        default: false
    },
    automaticallyImplyLeading: {
        type: Boolean,
        default: true
    },
    textColor: {
        type: String,
        default: '#FFFFFF'
    },
    actions: {
        type: Array as () => AppBarAction[],
        default: () => []
    }
});
</script>

<template>
    <div class="flutter-app-bar w-full flex items-center px-4 py-2 shadow"
         :style="{
             backgroundColor: props.backgroundColor,
             color: props.textColor,
             boxShadow: `0 ${props.elevation}px ${props.elevation * 2}px rgba(0,0,0,0.2)`,
             justifyContent: props.centerTitle ? 'center' : 'space-between'
         }">
        <button v-if="props.automaticallyImplyLeading" class="mr-2 focus:outline-none">
            <!-- Ícono de menú tipo hamburguesa -->
            <svg class="w-6 h-6" fill="none" :stroke="props.textColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>
        <span class="font-semibold text-sm" :style="{ textAlign: props.centerTitle ? 'center' : 'left' }">{{ props.title }}</span>
        <div class="flex items-center gap-2">
            <button
                v-for="(action, idx) in props.actions"
                :key="idx"
                @click="action.onClick"
                class="p-1 rounded focus:outline-none action-button"
                :title="action.tooltip"
            >
                <component :is="action.icon" class="w-5 h-5"/>
            </button>
        </div>
    </div>
</template>
<style scoped>
.flutter-app-bar {
    position: relative;
    font-family: 'Roboto', sans-serif;
    z-index: 10;
    width: 100%;
    display: flex;
    align-items: center;
    box-sizing: border-box;
}

.action-button {
    background-color: transparent;
}

.action-button:hover {
    background-color: rgba(255,255,255,0.1);
}
</style>
