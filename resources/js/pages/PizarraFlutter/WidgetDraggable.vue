<script setup lang="ts">
import draggable from 'vuedraggable'
import WidgetContent from './WidgetContent.vue'
import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => [],
        required: true
    },
    selectedWidget: {
        type: Object,
        default: null
    },
    showAddChildMenu: {
        type: String,
        default: null
    },
    activeAddChildCategory: {
        type: Number,
        default: 0
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
    }
})

const emit = defineEmits([
    'update:modelValue',
    'select-widget',
    'remove-widget',
    'add-child-widget',
    'update:showAddChildMenu',
    'update:activeAddChildCategory',
    'drag-enter',
    'drag-leave',
    'drop'
])

// Crear un modelo computado para evitar la mutación directa de la prop
const internalModelValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Corregido: Se elimina el parámetro evt que no se usa
const emitChange = () => {
    // No es necesario emitir nuevamente aquí ya que el computed se encargará
    // de emitir cuando se modifique a través de v-model
}

const getWidgetClasses = (element: any) => {
    return {
        'selected-widget': element.id === props?.selectedWidget?.id,
        'text-widget dark:bg-blue-900 dark:bg-opacity-20': ['Text', 'h1', 'h2', 'h3'].includes(element.type),
        'input-widget dark:bg-orange-900 dark:bg-opacity-20': ['TextField', 'Checkbox', 'DropdownButton'].includes(element.type),
        'container-widget dark:bg-green-900 dark:bg-opacity-20': ['Container', 'SafeArea'].includes(element.type),
        'layout-widget dark:bg-pink-900 dark:bg-opacity-20': ['Row', 'Column', 'Padding'].includes(element.type),
        'display-widget dark:bg-purple-900 dark:bg-opacity-20': ['Image', 'Icon'].includes(element.type)
    }
}

const selectWidget = (widget: any) => {
    emit('select-widget', widget)
}

const removeWidget = (widget: any) => {
    emit('remove-widget', widget)
}

const addChildWidget = (parentId: any, type: any) => {
    emit('add-child-widget', parentId, type)
}

const setShowAddChildMenu = (id: any) => {
    emit('update:showAddChildMenu', id)
}

const setActiveCategory = (index: any) => {
    emit('update:activeAddChildCategory', index)
}

const handleDragEnter = (e: any) => {
    emit('drag-enter', e)
}

const handleDragLeave = (e: any) => {
    emit('drag-leave', e)
}

const handleDrop = (e: any) => {
    emit('drop', e)
}
</script>
<template>
    <draggable
        v-model="internalModelValue"
        group="widgets"
        item-key="id"
        class="w-full"
        :animation="150"
        ghost-class="ghost-widget"
        chosen-class="chosen-widget"
        @change="emitChange"
    >
        <template v-slot:item="{ element }">
            <div
                class="mobile-widget relative cursor-move transition-colors dark:bg-gray-700 dark:shadow-gray-900"
                :class="getWidgetClasses(element)"
                @click.stop="selectWidget(element)"
            >
                <!-- Contenido del widget -->
                <widget-content
                    :element="element"
                    :selected-widget="selectedWidget"
                    :show-add-child-menu="showAddChildMenu"
                    :active-add-child-category="activeAddChildCategory"
                    :input-widgets="inputWidgets"
                    :layout-widgets="layoutWidgets"
                    :display-widgets="displayWidgets"
                    @remove-widget="removeWidget"
                    @add-child-widget="addChildWidget"
                    @set-show-menu="setShowAddChildMenu"
                    @set-category="setActiveCategory"
                    @drag-enter="handleDragEnter"
                    @drag-leave="handleDragLeave"
                    @drop="handleDrop"
                />
            </div>
        </template>
    </draggable>
</template>
