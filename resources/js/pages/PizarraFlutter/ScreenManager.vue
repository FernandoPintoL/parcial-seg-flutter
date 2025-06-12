<script setup lang="ts">
import { ref } from 'vue';

interface Screen {
    id: string;
    name: string;
    isHome: boolean;
    isDrawer: boolean;
}

const props = defineProps({
    screens: {
        type: Array as () => Screen[],
        required: true
    },
    currentScreenIndex: {
        type: Number,
        required: true
    }
});

const emit = defineEmits([
    'add-screen',
    'delete-screen',
    'set-home-screen',
    'select-screen',
    'toggle-flutter-code'
]);

const newScreenName = ref('');
const showFlutterCode = ref(false);

const addScreen = () => {
    if (!newScreenName.value.trim()) return;
    emit('add-screen', newScreenName.value);
    newScreenName.value = '';
};

// Se usa como handler en template, no eliminar
const selectScreen = (index: number) => {
    const screenId = props.screens.filter((s: Screen) => !s.isDrawer)[index].id;
    emit('select-screen', screenId);
};

const setHomeScreen = (index: number) => {
    const screenId = props.screens.filter((s: Screen) => !s.isDrawer)[index].id;
    emit('set-home-screen', screenId);
};

const deleteScreen = (index: number) => {
    const screenId = props.screens.filter((s: Screen) => !s.isDrawer)[index].id;
    emit('delete-screen', screenId);
};

// Se usa como handler en template, no eliminar
const toggleFlutterCode = () => {
    showFlutterCode.value = !showFlutterCode.value;
    emit('toggle-flutter-code');
};
</script>
<template>
    <div class="screen-manager">
        <!-- Interfaz de administración de pantallas -->
        <div class="mb-1">
            <!-- Screen Manager Panel Gestion de Pantallas -->
            <div
                class="mb-4 rounded-lg border bg-white p-4 shadow transition-colors dark:border-gray-600 dark:bg-gray-800"
            >
                <h4 class="mb-2 font-semibold dark:text-white">Gestionar Pantallas</h4>

                <!-- Add new screen -->
                <div class="mb-4 flex">
                    <input
                        v-model="newScreenName"
                        type="text"
                        placeholder="Nombre de la nueva pantalla"
                        class="flex-1 rounded-l border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button @click="addScreen"
                            class="rounded-r bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
                        Añadir
                    </button>
                </div>

                <!-- Screen list -->
                <div class="max-h-60 overflow-y-auto">
                    <div
                        v-for="(screen, index) in screens.filter(s => !s.isDrawer)"
                        :key="screen.id"
                        class="flex items-center justify-between border-b p-2 dark:border-gray-600"
                    >
                        <div class="flex items-center">
                            <span class="mr-2 dark:text-white">{{ screen.name }}</span>
                            <span v-if="screen.isHome"
                                  class="rounded bg-green-500 px-1 text-xs text-white">Home</span>
                        </div>
                        <div class="flex">
                            <button
                                @click="setHomeScreen(index)"
                                class="mr-1 rounded bg-green-500 px-2 py-1 text-xs text-white transition-colors hover:bg-green-600"
                                :disabled="screen.isHome"
                                :class="{ 'cursor-not-allowed opacity-50': screen.isHome }"
                            >
                                Set Home
                            </button>
                            <button
                                @click="deleteScreen(index)"
                                class="rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600"
                                :disabled="screens.filter(s => !s.isDrawer).length <= 1"
                                :class="{ 'cursor-not-allowed opacity-50': screens.filter(s => !s.isDrawer).length <= 1 }"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
