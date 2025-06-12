<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import WidgetMenu from './WidgetMenu.vue';
import WidgetContent from './WidgetContent.vue';

const props = defineProps({
    element: {
        type: Object,
        required: true
    },
    inputWidgets: {
        type: Array,
        default: () => []
    },
    layoutWidgets: {
        type: Array,
        default: () => []
    },
    displayWidgets: {
        type: Array,
        default: () => []
    },
    showAddChildMenu: {
        type: [String, Number, null],
        default: null
    },
    activeAddChildCategory: {
        type: Number,
        default: 0
    }
});

const emit = defineEmits([
    'update:showAddChildMenu',
    'update:activeAddChildCategory',
    'add-child-widget',
    'handle-drag-enter',
    'handle-drag-leave',
    'handle-drop'
]);

function getContainerStyle() {
    if (props.element.type === 'Container') {
        return {
            width: (props.element.props.width || 200) + 'px',
            height: 'auto',
            minHeight: (props.element.props.height || 200) + 'px',
            backgroundColor: props.element.props.color || '#FFFFFF',
            padding: '16px',
            margin: '8px',
            borderRadius: '4px',
            boxShadow: props.element.props.decoration?.includes('boxShadow')
                ? '0 2px 5px rgba(0,0,0,0.2)'
                : 'none',
            overflowY: 'auto',
        };
    } else if (props.element.type === 'Row') {
        return {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: props.element.props.mainAxisAlignment || 'flex-start',
            alignItems: props.element.props.crossAxisAlignment || 'center',
            flexWrap: 'wrap',
            width: '100%',
        };
    } else if (props.element.type === 'Column') {
        return {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: props.element.props.mainAxisAlignment || 'flex-start',
            alignItems: props.element.props.crossAxisAlignment || 'center',
            width: '100%',
        };
    } else if (props.element.type === 'ScrollChildren') {
        return {
            width: '100%',
            minHeight: '200px',
            maxHeight: '400px',
            overflowX: props.element.props.scrollDirection === 'Axis.horizontal' ? 'auto' : 'hidden',
            overflowY: 'auto',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '4px',
        };
    }
    return {};
}

function handleAddWidget(widgetType) {
    emit('add-child-widget', {
        parentId: props.element.id,
        widgetType
    });
    emit('update:showAddChildMenu', null);
}
</script>
<template>
    <div
        :class="['flutter-' + element.type.toLowerCase(), 'droppable-container']"
        :style="getContainerStyle()"
        @dragenter.prevent="$emit('handle-drag-enter', $event)"
        @dragover.prevent="$emit('handle-drag-enter', $event)"
        @dragleave.prevent="$emit('handle-drag-leave', $event)"
        @drop.prevent="$emit('handle-drop', $event)"
    >
        <div
            v-if="!element.children || !Array.isArray(element.children) || element.children.length === 0"
            :class="element.type.toLowerCase() + '-placeholder'"
        >
            <div class="drop-here-indicator">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                <span>Arrastra componentes aquí</span>
            </div>
            <div class="add-child-widget-container">
                <button @click.stop="$emit('update:showAddChildMenu', element.id)" class="add-child-widget-btn">
                    Agregar Widget Hijo
                </button>
                <widget-menu
                    v-if="showAddChildMenu === element.id"
                    :activeCategory="activeAddChildCategory"
                    :inputWidgets="inputWidgets"
                    :layoutWidgets="layoutWidgets"
                    :displayWidgets="displayWidgets"
                    @update:activeCategory="$emit('update:activeAddChildCategory', $event)"
                    @add-widget="handleAddWidget"
                />
            </div>
        </div>
        <div v-else-if="Array.isArray(element.children)" :class="element.type.toLowerCase() + '-children'">
            <div class="add-child-widget-container children-container-btn">
                <button @click.stop="$emit('update:showAddChildMenu', element.id)" class="add-child-widget-btn">
                    + Agregar Widget Hijo
                </button>
                <widget-menu
                    v-if="showAddChildMenu === element.id"
                    :activeCategory="activeAddChildCategory"
                    :inputWidgets="inputWidgets"
                    :layoutWidgets="layoutWidgets"
                    :displayWidgets="displayWidgets"
                    @update:activeCategory="$emit('update:activeAddChildCategory', $event)"
                    @add-widget="handleAddWidget"
                />
            </div>
            <div v-for="child in element.children" :key="child.id" :class="element.type.toLowerCase() + '-child'">
                <widget-content
                    :element="child"
                    :inputWidgets="inputWidgets"
                    :layoutWidgets="layoutWidgets"
                    :displayWidgets="displayWidgets"
                />
            </div>
        </div>
    </div>
</template>
