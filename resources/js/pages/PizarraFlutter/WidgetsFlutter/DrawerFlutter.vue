<script setup lang="ts">
import { computed, onMounted } from 'vue';
// Define interfaces para tipar correctamente los objetos
interface Screen {
    id?: string | number;
    name: string;
    isDrawer?: boolean;
}
const props = defineProps({
    open: {
        type: Boolean,
        default: true
    },
    width: {
        type: [Number, String],
        default: 250
    },
    backgroundColor: {
        type: String,
        default: '#FFFFFF'
    },
    elevation: {
        type: Number,
        default: 16
    },
    headerColor: {
        type: String,
        default: '#2196F3'
    },
    headerHeight: {
        type: [Number, String],
        default: 150
    },
    userName: {
        type: String,
        default: 'User Name'
    },
    userEmail: {
        type: String,
        default: 'user@example.com'
    },
    avatarColor: {
        type: String,
        default: '#2196F3'
    },
    avatarText: {
        type: String,
        default: 'U'
    },
    // Custom navigation items to display in the drawer
    navigationItems: {
        type: Array,
        default: () => ['Inicio', 'Configuración', 'Ayuda']
    },
    // Add screens prop to display in the drawer
    screens: {
        type: Array as () => Screen[],
        default: () => []
    },
    // Current screen index to highlight the active screen
    currentScreenIndex: {
        type: Number,
        default: 0
    }
});

const emit = defineEmits(['screen-selected']);

const drawerStyles = computed(() => ({
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%', // Use 100% instead of 100vh to fit within the wrapper
    width: `${props.width}px`,
    backgroundColor: props.backgroundColor,
    boxShadow: `0 0 ${props.elevation}px rgba(0,0,0,0.2)`,
    zIndex: 10,
    display: props.open ? 'flex' : 'none',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '0 8px 8px 0', // Redondeado en los bordes derecho
}));

// Function to handle screen selection
const selectScreen = (index : number) => {
    emit('screen-selected', index);
};

// We no longer need to manually update drawer content height since we're using flex layout
// The drawer content will automatically take up the remaining space

// Keep onMounted for potential future use
onMounted(() => {
    // Component is mounted
});
</script>
<template>
    <div class="flutter-drawer-component" :style="drawerStyles">
        <!-- User Account Drawer Header -->
        <div class="drawer-header" :style="{
            backgroundColor: props.headerColor,
            height: typeof props.headerHeight === 'number' ? `${props.headerHeight}px` : props.headerHeight
        }">
            <div class="user-account-section">
                <div class="user-avatar" :style="{ color: props.avatarColor }">
                    <span>{{ props.avatarText }}</span>
                </div>
                <div class="user-info">
                    <div class="user-name">{{ props.userName }}</div>
                    <div class="user-email">{{ props.userEmail }}</div>
                </div>
            </div>
        </div>

        <!-- Drawer content -->
        <div class="drawer-content">
            <slot></slot>

            <!-- Elementos por defecto si no hay contenido -->
            <div v-if="!$slots.default" class="default-menu-items">
                <!-- Home screen icon -->
                <div class="drawer-menu-item">
                    <div class="menu-item-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="menu-item-text">Inicio</div>
                </div>

                <!-- Screens from the application -->
                <div class="drawer-divider"></div>
                <div class="drawer-section-title">Pantallas</div>

                <!-- If no screens are available, show a message -->
                <div v-if="!props.screens || props.screens.length === 0" class="drawer-menu-item no-screens">
                    <div class="menu-item-text">No hay pantallas disponibles</div>
                </div>

                <!-- Display all screens except the drawer screen -->
                <div
                    v-for="(screen, index) in props.screens.filter(s => !s.isDrawer)"
                    :key="screen.id || index"
                    class="drawer-menu-item"
                    :class="{ 'active': index === props.currentScreenIndex }"
                    @click="selectScreen(index)"
                >
                    <div class="menu-item-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="menu-item-text">{{ screen.name }}</div>
                </div>

                <div class="drawer-divider"></div>
                <div class="drawer-section-title">Navegación</div>

                <!-- Custom navigation items -->
                <div
                    v-for="(item, index) in props.navigationItems"
                    :key="index"
                    class="drawer-menu-item"
                >
                    <div class="menu-item-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="menu-item-text">{{ item }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.flutter-drawer-component {
    font-family: 'Roboto', sans-serif;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%; /* Use 100% instead of 100vh to fit within the wrapper */
    min-height: 100%; /* Altura mínima del 100% */
    z-index: 10;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0 8px 8px 0;
    display: flex;
    box-sizing: border-box; /* Incluye padding y border en el cálculo del tamaño */
}

.drawer-header {
    color: white;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-shrink: 0; /* Asegura que el header no se encoja */
}

.user-account-section {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.user-avatar {
    width: 60px;
    height: 60px;
    border-radius: 30px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
}

.user-avatar span {
    font-size: 24px;
}

.user-name {
    font-weight: bold;
    font-size: 16px;
}

.user-email {
    font-size: 14px;
}

.drawer-content {
    flex: 1; /* Asegura que el contenido ocupe todo el espacio restante disponible */
    overflow-y: auto; /* Permite desplazamiento vertical si el contenido es largo */
    display: flex;
    flex-direction: column;
    /* Use flex: 1 instead of fixed height calculation to ensure it fits within the wrapper */
}

.default-menu-items {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0; /* Permite que se contraiga si es necesario */
}

.drawer-menu-item {
    padding: 16px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
}

.drawer-menu-item:hover {
    background-color: rgba(0, 0, 0, 0.04);
}

.menu-item-icon {
    margin-right: 16px;
    color: #757575;
}

.menu-item-text {
    flex: 1;
}

.drawer-divider {
    height: 1px;
    background-color: #e0e0e0;
    margin: 8px 0;
}

.drawer-section-title {
    padding: 8px 16px;
    font-size: 14px;
    color: #757575;
    font-weight: 500;
    text-transform: uppercase;
}

.drawer-menu-item.active {
    background-color: rgba(33, 150, 243, 0.1);
    border-left: 4px solid #2196F3;
}

.drawer-menu-item.no-screens {
    color: #9e9e9e;
    font-style: italic;
}
</style>
