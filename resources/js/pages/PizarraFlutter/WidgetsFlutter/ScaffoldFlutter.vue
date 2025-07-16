<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';

// Definir interfaces para mejorar el tipado
interface BottomNavigationItem {
    icon: string;
    label: string;
}

interface BottomNavigationBar {
    backgroundColor: string;
    selectedItemColor: string;
    unselectedItemColor: string;
    items: BottomNavigationItem[];
    currentIndex: number;
}

interface AppBar {
    title: string;
    backgroundColor: string;
    elevation: number;
    foregroundColor: string;
    centerTitle: boolean;
    actions: any[];
}

interface FloatingActionButton {
    backgroundColor: string;
    icon: string;
    position: 'endFloat' | 'centerFloat' | 'centerDocked';
}

const props = defineProps({
    // Colores y estilos
    backgroundColor: {
        type: String,
        default: '#FFFFFF'
    },
    appBar: {
        type: Object as () => AppBar,
        default: () => ({
            title: 'AppBar',
            backgroundColor: '#2196F3',
            elevation: 4,
            foregroundColor: '#FFFFFF',
            centerTitle: false,
            actions: []
        })
    },
    showAppBar: {
        type: Boolean,
        default: true
    },
    showBottomBar: {
        type: Boolean,
        default: false
    },
    showDrawer: {
        type: Boolean,
        default: false
    },
    showFAB: {
        type: Boolean,
        default: false
    },
    bottomNavigationBar: {
        type: Object as () => BottomNavigationBar,
        default: () => ({
            backgroundColor: '#FFFFFF',
            selectedItemColor: '#2196F3',
            unselectedItemColor: '#757575',
            items: [
                { icon: 'home', label: 'Home' },
                { icon: 'search', label: 'Search' },
                { icon: 'favorite', label: 'Favorites' },
                { icon: 'settings', label: 'Settings' }
            ],
            currentIndex: 0
        })
    },
    floatingActionButton: {
        type: Object as () => FloatingActionButton,
        default: () => ({
            backgroundColor: '#2196F3',
            icon: 'add',
            position: 'endFloat' // endFloat, centerFloat, centerDocked
        })
    },
    // Para interacción con la pizarra
    id: {
        type: String,
        default: ''
    },
    top: {
        type: Number,
        default: 0
    },
    left: {
        type: Number,
        default: 0
    },
    width: {
        type: Number,
        default: 360
    },
    height: {
        type: Number,
        default: 640
    },
    zIndex: {
        type: Number,
        default: 1
    },
    isSelected: {
        type: Boolean,
        default: false
    },
});

const emit = defineEmits(['update:props', 'select']);

const selectedNavItem = ref(props.bottomNavigationBar.currentIndex);

const containerStyle = computed(() => {
    return {
        backgroundColor: props.backgroundColor,
        position: 'relative',
        width: `${props.width}px`,
        height: `${props.height}px`,
        zIndex: props.zIndex,
        border: props.isSelected ? '2px solid #2196F3' : 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    };
});

const appBarStyle = computed(() => {
    return {
        backgroundColor: props.appBar.backgroundColor,
        color: props.appBar.foregroundColor,
        boxShadow: props.appBar.elevation > 0 ? `0px ${props.appBar.elevation}px ${props.appBar.elevation * 2}px rgba(0,0,0,0.2)` : 'none'
    };
});

const selectWidget = () => {
    emit('select', props.id);
};

// Corregido: Añadido tipo number al parámetro index
const handleBottomNavChange = (index: number) => {
    selectedNavItem.value = index;
    const updatedProps = { ...props, bottomNavigationBar: { ...props.bottomNavigationBar, currentIndex: index } };
    emit('update:props', updatedProps);
};

const getFabPosition = computed(() => {
    const position = props.floatingActionButton.position;
    let positionClass = 'absolute bottom-4 right-4';

    if (position === 'centerFloat') {
        positionClass = 'absolute bottom-4 left-1/2 transform -translate-x-1/2';
    } else if (position === 'centerDocked') {
        positionClass = 'absolute bottom-7 left-1/2 transform -translate-x-1/2';
    }

    return positionClass;
});
</script>

<template>
    <div
        :style="containerStyle"
        class="scaffold-container"
        @click="selectWidget"
    >
        <!-- AppBar -->
        <div v-if="showAppBar" class="scaffold-app-bar" :style="appBarStyle">
            <div class="flex items-center p-2">
                <i class="material-icons mr-2">menu</i>
                <h1 :style="{ textAlign: appBar.centerTitle ? 'center' : 'left' }" class="text-lg font-medium flex-grow">
                    {{ appBar.title }}
                </h1>
                <div class="flex">
                    <i class="material-icons mx-1">search</i>
                    <i class="material-icons mx-1">more_vert</i>
                </div>
            </div>
        </div>

        <!-- Body -->
        <div class="scaffold-body flex-grow overflow-auto p-4">
            <slot>
                <div class="h-full w-full flex items-center justify-center text-gray-400">
                    Contenido del Scaffold
                </div>
            </slot>
        </div>

        <!-- Floating Action Button -->
        <div
            v-if="showFAB"
            :class="getFabPosition"
            class="scaffold-fab"
            :style="{ backgroundColor: floatingActionButton.backgroundColor }"
        >
            <i class="material-icons text-white">{{ floatingActionButton.icon }}</i>
        </div>

        <!-- Bottom Navigation Bar -->
        <div v-if="showBottomBar" class="scaffold-bottom-nav" :style="{ backgroundColor: bottomNavigationBar.backgroundColor }">
            <div
                v-for="(item, index) in bottomNavigationBar.items"
                :key="index"
                class="flex flex-col items-center justify-center py-1 flex-grow cursor-pointer"
                @click="handleBottomNavChange(index)"
                :style="{ color: selectedNavItem === index ? bottomNavigationBar.selectedItemColor : bottomNavigationBar.unselectedItemColor }"
            >
                <i class="material-icons">{{ item.icon }}</i>
                <span class="text-xs">{{ item.label }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Para asegurar que se incluyan los íconos de Material Design */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.scaffold-container {
    font-family: 'Roboto', sans-serif;
    border-radius: 8px;
}

.scaffold-app-bar {
    min-height: 56px;
    display: flex;
    align-items: center;
}

.scaffold-body {
    position: relative;
}

.scaffold-fab {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10;
}

.scaffold-bottom-nav {
    height: 56px;
    display: flex;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
}

</style>
