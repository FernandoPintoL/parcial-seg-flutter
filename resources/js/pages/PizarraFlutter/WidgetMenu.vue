<script setup lang="ts">
// Define la interfaz para los widgets
interface Widget {
    type: string;
    label: string;
    [key: string]: any; // Para otras propiedades que puedan tener los widgets
}

// Define las props utilizando la sintaxis de script setup con tipos apropiados
defineProps({
    activeCategory: {
        type: Number,
        default: 0
    },
    inputWidgets: {
        type: Array as () => Widget[],
        default: () => []
    },
    layoutWidgets: {
        type: Array as () => Widget[],
        default: () => []
    },
    displayWidgets: {
        type: Array as () => Widget[],
        default: () => []
    }
});

// Define los emits utilizando la sintaxis de script setup
// Usaremos emit directamente en lugar de $emit en el template
const emit = defineEmits(['update:activeCategory', 'add-widget']);

// Funciones para manejar eventos desde el template
const updateCategory = (index: number) => {
    emit('update:activeCategory', index);
};

const addWidget = (type: string) => {
    emit('add-widget', type);
};
</script>

<template>
    <div class="add-child-widget-menu">
        <div class="widget-category-tabs">
            <button
                v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                :key="category"
                class="widget-category-tab"
                :class="{ 'active-tab': activeCategory === index }"
                @click.stop="updateCategory(index)"
            >
                {{ category }}
            </button>
        </div>
        <div class="widget-grid" v-if="activeCategory === 0">
            <button
                v-for="widget in inputWidgets"
                :key="widget.type"
                class="widget-button input-widget-btn"
                @click.stop="addWidget(widget.type)"
            >
                {{ widget.label }}
            </button>
        </div>
        <div class="widget-grid" v-if="activeCategory === 1">
            <button
                v-for="widget in layoutWidgets"
                :key="widget.type"
                class="widget-button layout-widget-btn"
                @click.stop="addWidget(widget.type)"
            >
                {{ widget.label }}
            </button>
        </div>
        <div class="widget-grid" v-if="activeCategory === 2">
            <button
                v-for="widget in displayWidgets"
                :key="widget.type"
                class="widget-button display-widget-btn"
                @click.stop="addWidget(widget.type)"
            >
                {{ widget.label }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.add-child-widget-menu {
    padding: 8px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.widget-category-tabs {
    display: flex;
    margin-bottom: 8px;
    border-bottom: 1px solid #eaeaea;
}

.widget-category-tab {
    padding: 6px 12px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    color: #666;
}

.active-tab {
    color: #2196F3;
    border-bottom: 2px solid #2196F3;
    font-weight: 500;
}

.widget-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    max-height: 200px;
    overflow-y: auto;
}

.widget-button {
    padding: 8px;
    border: 1px solid #eaeaea;
    border-radius: 4px;
    background-color: #f9f9f9;
    cursor: pointer;
    font-size: 13px;
    text-align: center;
    transition: all 0.2s;
}

.widget-button:hover {
    background-color: #f0f0f0;
    border-color: #d0d0d0;
}

.input-widget-btn {
    border-left: 3px solid #4CAF50;
}

.layout-widget-btn {
    border-left: 3px solid #2196F3;
}

.display-widget-btn {
    border-left: 3px solid #FF9800;
}
</style>
