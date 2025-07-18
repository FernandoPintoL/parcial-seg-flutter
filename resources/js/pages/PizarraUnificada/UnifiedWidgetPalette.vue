<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
    availableWidgets: any[];
    selectedFramework: 'flutter' | 'angular' | 'both';
}>();

const emit = defineEmits(['add-widget', 'drag-start', 'drag-end']);

// Group widgets by category
const widgetCategories = computed(() => {
    const categories = new Map();

    props.availableWidgets.forEach(widget => {
        if (!categories.has(widget.category)) {
            categories.set(widget.category, {
                category: widget.category,
                label: getCategoryLabel(widget.category),
                widgets: []
            });
        }
        categories.get(widget.category).widgets.push(widget);
    });

    return Array.from(categories.values());
});

// Get a user-friendly label for a category
function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        'input': 'Entrada',
        'layout': 'Diseño',
        'containers': 'Contenedores',
        'display': 'Visualización',
        'material-cupertino': 'Material'
    };

    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// Active category index
const activeCategory = ref(0);

// Widgets in the active category
const widgetsByActiveCategory = computed(() => {
    if (widgetCategories.value.length === 0) return [];
    return widgetCategories.value[activeCategory.value]?.widgets || [];
});

// Handle widget drag start
function handleDragStart(widgetType: string, event: DragEvent) {
    if (event.dataTransfer) {
        event.dataTransfer.setData('widget-type', widgetType);
        event.dataTransfer.effectAllowed = 'copy';
    }
    emit('drag-start', widgetType);
}

// Handle the widget drag end
function handleDragEnd() {
    emit('drag-end');
}

// Get the framework icon based on the framework type
function getFrameworkIcon(framework: 'flutter' | 'angular'): string {
    switch (framework) {
        case 'flutter':
            return '🎯';
        case 'angular':
            return '🅰️';
        default:
            return '📦';
    }
}

// Get widget-specific icon based on a widget type
function getWidgetIcon(widgetType: string): string {
    const iconMap: Record<string, string> = {
        // Flutter
        'Container': 'crop_square',
        'Column': 'view_column',
        'Row': 'view_week',
        'Text': 'text_format',
        'Button': 'smart_button',
        'Image': 'image',
        'Icon': 'star',
        'Card': 'card_membership',
        'ListView': 'list',
        'TextField': 'text_fields',
        'AppBar': 'app_bar',
        'Scaffold': 'dashboard',

        // Angular
        'div': 'crop_square',
        'span': 'text_format',
        'p': 'text_snippet',
        'button': 'smart_button',
        'input': 'text_fields',
        'img': 'image',
        'mat-button': 'smart_button',
        'mat-card': 'card_membership',
        'mat-toolbar': 'app_bar',
    };

    return iconMap[widgetType] || 'widgets';
}

// Get user-friendly widget name
function getWidgetDisplayName(widget: any): string {
    const nameMap: Record<string, string> = {
        // Flutter
        'Container': 'Contenedor',
        'Column': 'Columna',
        'Row': 'Fila',
        'Text': 'Texto',
        'Button': 'Botón',
        'Image': 'Imagen',
        'Icon': 'Icono',
        'Card': 'Tarjeta',
        'ListView': 'Lista',
        'TextField': 'Campo',
        'AppBar': 'Barra',
        'Scaffold': 'Andamio',

        // Angular
        'div': 'División',
        'span': 'Span',
        'p': 'Párrafo',
        'button': 'Botón',
        'input': 'Entrada',
        'img': 'Imagen',
        'mat-button': 'Btn Mat.',
        'mat-card': 'Tarjeta Mat.',
        'mat-toolbar': 'Toolbar',
    };

    return nameMap[widget.type] || widget.name || widget.label || widget.type;
}
</script>

<template>
    <div class="widget-palette-compact">
        <!-- Compact Category Tabs -->
        <div class="category-tabs-compact">
            <button v-for="(category, index) in widgetCategories" :key="category.category" class="category-tab-compact"
                :class="{ 'active': activeCategory === index }" @click="activeCategory = index">
                {{ category.label }}
            </button>
        </div>

        <!-- Compact Widget Grid -->
        <div class="widgets-grid-compact">
            <div v-for="widget in widgetsByActiveCategory" :key="widget.type" class="widget-item-compact" :class="{
                'framework-flutter': widget.framework === 'flutter',
                'framework-angular': widget.framework === 'angular',
            }" @click="$emit('add-widget', widget.type)" draggable="true"
                @dragstart="handleDragStart(widget.type, $event)" @dragend="handleDragEnd()"
                :title="getWidgetDisplayName(widget)">

                <!-- Framework Badge -->
                <div v-if="widget.framework && widget.framework !== 'both'" class="framework-indicator" :class="{
                    'flutter': widget.framework === 'flutter',
                    'angular': widget.framework === 'angular'
                }">
                    {{ getFrameworkIcon(widget.framework) }}
                </div>

                <!-- Widget Icon -->
                <div class="widget-icon">
                    <span class="material-icons">{{ getWidgetIcon(widget.type) }}</span>
                </div>

                <!-- Widget Name -->
                <div class="widget-name">
                    {{ getWidgetDisplayName(widget) }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Compact Widget Palette - Figma-like Design */
.widget-palette-compact {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
}

.dark .widget-palette-compact {
    background: #1f2937;
}

/* Compact Category Tabs */
.category-tabs-compact {
    display: flex;
    padding: 4px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
    gap: 2px;
}

.dark .category-tabs-compact {
    background: #374151;
    border-bottom-color: #4b5563;
}

.category-tab-compact {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.category-tab-compact:hover {
    background: #e5e7eb;
    color: #374151;
}

.category-tab-compact.active {
    background: #3b82f6;
    color: #ffffff;
}

.dark .category-tab-compact {
    color: #9ca3af;
}

.dark .category-tab-compact:hover {
    background: #4b5563;
    color: #f3f4f6;
}

.dark .category-tab-compact.active {
    background: #3b82f6;
    color: #ffffff;
}

/* Compact Widget Grid */
.widgets-grid-compact {
    flex: 1;
    padding: 8px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    max-height: calc(100vh - 200px);
}

/* Compact Widget Items */
.widget-item-compact {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 60px;
}

.widget-item-compact:hover {
    border-color: #3b82f6;
    background: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .widget-item-compact {
    background: #374151;
    border-color: #4b5563;
}

.dark .widget-item-compact:hover {
    border-color: #3b82f6;
    background: #4b5563;
}

/* Framework Indicators */
.framework-indicator {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    z-index: 10;
}

.framework-indicator.flutter {
    background: #0ea5e9;
    color: white;
}

.framework-indicator.angular {
    background: #ef4444;
    color: white;
}

/* Widget Icons */
.widget-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
}

.widget-icon .material-icons {
    font-size: 18px;
    color: #6b7280;
}

.widget-item-compact:hover .widget-icon .material-icons {
    color: #3b82f6;
}

.dark .widget-icon .material-icons {
    color: #9ca3af;
}

.dark .widget-item-compact:hover .widget-icon .material-icons {
    color: #60a5fa;
}

/* Widget Names */
.widget-name {
    font-size: 10px;
    font-weight: 500;
    color: #374151;
    text-align: center;
    line-height: 1.2;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    max-width: 100%;
}

.dark .widget-name {
    color: #f3f4f6;
}

/* Framework-specific styling */
.widget-item-compact.framework-flutter {
    border-left: 2px solid #0ea5e9;
}

.widget-item-compact.framework-angular {
    border-left: 2px solid #ef4444;
}

/* Scrollbar styling */
.widgets-grid-compact::-webkit-scrollbar {
    width: 4px;
}

.widgets-grid-compact::-webkit-scrollbar-track {
    background: transparent;
}

.widgets-grid-compact::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
}

.widgets-grid-compact::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.dark .widgets-grid-compact::-webkit-scrollbar-thumb {
    background: #4b5563;
}

.dark .widgets-grid-compact::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .widgets-grid-compact {
        grid-template-columns: 1fr;
    }

    .widget-name {
        font-size: 9px;
    }

    .widget-icon .material-icons {
        font-size: 16px;
    }
}
</style>
