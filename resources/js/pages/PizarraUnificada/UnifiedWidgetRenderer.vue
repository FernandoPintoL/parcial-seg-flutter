<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { UnifiedElement } from '@/Data/PizarraUnificada';

// Import Flutter widgets
import ContainerFlutter from '@/pages/WidgetsFlutter/ContainerFlutter.vue';
import ButtonFlutter from '@/pages/WidgetsFlutter/ButtonFlutter.vue';
import TextFlutter from '@/pages/WidgetsFlutter/TextFlutter.vue';
import TextFieldFlutter from '@/pages/WidgetsFlutter/TextFieldFlutter.vue';
import ImageFlutter from '@/pages/WidgetsFlutter/ImageFlutter.vue';
import RowFlutter from '@/pages/WidgetsFlutter/RowFlutter.vue';
import ScaffoldFlutter from '@/pages/WidgetsFlutter/ScaffoldFlutter.vue';
import PaddingFlutter from '@/pages/WidgetsFlutter/PaddingFlutter.vue';
import SliderFlutter from '@/pages/WidgetsFlutter/SliderFlutter.vue';
import SwitchFlutter from '@/pages/WidgetsFlutter/SwitchFlutter.vue';
import RadioFlutter from '@/pages/WidgetsFlutter/RadioFlutter.vue';
import SelectFlutter from '@/pages/WidgetsFlutter/SelectFlutter.vue';
import ListTileFlutter from '@/pages/WidgetsFlutter/ListTileFlutter.vue';
import AppBarFlutter from '@/pages/WidgetsFlutter/AppBarFlutter.vue';
import ScaffoldWidget from '@/pages/WidgetsFlutter/ScaffoldWidget.vue';
import TextWidget from '@/pages/WidgetsFlutter/TextWidget.vue';
import IconWidget from '@/pages/WidgetsFlutter/IconWidget.vue';
import ImageWidget from '@/pages/WidgetsFlutter/ImageWidget.vue';

// Import Angular widgets
import BasicElement from '@/pages/WidgetsAngular/BasicElement.vue';
import InputAngular from '@/pages/WidgetsAngular/InputAngular.vue';
import ButtonComponent from '@/pages/WidgetsAngular/ButtonComponent.vue';

const props = defineProps<{
    element: UnifiedElement;
    isSelected?: boolean;
    isEditable?: boolean;
}>();

const emit = defineEmits([
    'update:element',
    'select',
    'widget-event',
    'property-change'
]);

// Reactive references
const elementRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const resizeStartSize = ref({ width: 0, height: 0 });

// Computed properties
const elementStyle = computed(() => {
    const baseStyle: Record<string, any> = {
        position: 'absolute' as const,
        left: `${props.element.position?.x || 0}px`,
        top: `${props.element.position?.y || 0}px`,
        width: props.element.size?.width ? `${props.element.size.width}px` : 'auto',
        height: props.element.size?.height ? `${props.element.size.height}px` : 'auto',
        zIndex: props.element.zIndex || 1,
        transform: props.element.transform || 'none',
        opacity: props.element.opacity || 1,
    };

    if (props.isSelected) {
        baseStyle.outline = '2px solid #3b82f6';
        baseStyle.outlineOffset = '2px';
    }

    return baseStyle;
});

const widgetComponent = computed(() => {
    const widgetMap: Record<string, any> = {
        // Flutter widgets
        'Container': ContainerFlutter,
        'Button': ButtonFlutter,
        'ElevatedButton': ButtonFlutter,
        'TextButton': ButtonFlutter,
        'OutlinedButton': ButtonFlutter,
        'Text': TextFlutter,
        'TextField': TextFieldFlutter,
        'TextFormField': TextFieldFlutter,
        'Image': ImageFlutter,
        'Row': RowFlutter,
        'Column': RowFlutter,
        'Scaffold': ScaffoldFlutter,
        'Padding': PaddingFlutter,
        'Slider': SliderFlutter,
        'Switch': SwitchFlutter,
        'Radio': RadioFlutter,
        'DropdownButton': SelectFlutter,
        'Select': SelectFlutter, // Added mapping for Select widget
        'ListTile': ListTileFlutter,
        'AppBar': AppBarFlutter,
        'ScaffoldWidget': ScaffoldWidget,
        'TextWidget': TextWidget,
        'IconWidget': IconWidget,
        'ImageWidget': ImageWidget,

        // Angular widgets
        'div': BasicElement,
        'span': BasicElement,
        'button': ButtonComponent,
        'input': InputAngular,
        'p': BasicElement,
        'h1': BasicElement,
        'h2': BasicElement,
        'h3': BasicElement,
        'select': BasicElement,
        'textarea': BasicElement,
        'form': BasicElement,
        'table': BasicElement,
        'ul': BasicElement,
        'ol': BasicElement,
        'li': BasicElement,
        'img': BasicElement,
        'nav': BasicElement,
        'header': BasicElement,
        'footer': BasicElement,
        'section': BasicElement,
        'article': BasicElement,
        'aside': BasicElement,
        'main': BasicElement,
        // Angular Material components
        'mat-button': ButtonComponent,
        'mat-input': InputAngular,
        'mat-select': BasicElement,
        'mat-card': BasicElement,
        'mat-toolbar': BasicElement,
    };

    return widgetMap[props.element.type] || BasicElement;
});

const widgetProps = computed(() => {
    const baseProps = { ...props.element.props, ...props.element.properties };

    // Add common props based on widget type
    if (props.element.framework === 'flutter') {
        // Special handling for TextFlutter component to maintain backward compatibility
        if (props.element.type === 'Text') {
            return {
                properties: props.element.properties || {},
                ...baseProps, // Also pass direct props for new format support
                width: props.element.size?.width,
                height: props.element.size?.height,
            };
        }

        return {
            ...baseProps,
            width: props.element.size?.width,
            height: props.element.size?.height,
        };
    } else if (props.element.framework === 'angular') {
        return {
            ...baseProps,
            style: {
                width: props.element.size?.width ? `${props.element.size.width}px` : 'auto',
                height: props.element.size?.height ? `${props.element.size.height}px` : 'auto',
                ...baseProps.style,
            },
        };
    }

    return baseProps;
});

// Event handlers
function handleElementClick(event: MouseEvent) {
    event.stopPropagation();
    emit('select', props.element);
}

function handlePropertyChange(property: string, value: any) {
    const updatedElement = {
        ...props.element,
        props: {
            ...props.element.props,
            [property]: value,
        },
    };
    emit('update:element', updatedElement);
    emit('property-change', property, value);
}

function handleMouseDown(event: MouseEvent) {
    if (!props.isEditable) return;

    event.preventDefault();
    event.stopPropagation();

    isDragging.value = true;
    const rect = elementRef.value?.getBoundingClientRect();
    if (rect) {
        dragOffset.value = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(event: MouseEvent) {
    if (!isDragging.value || !props.isEditable) return;

    const newPosition = {
        x: event.clientX - dragOffset.value.x,
        y: event.clientY - dragOffset.value.y,
    };

    const updatedElement = {
        ...props.element,
        position: newPosition,
    };

    emit('update:element', updatedElement);
}

function handleMouseUp() {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

function handleResizeStart(event: MouseEvent, direction: string) {
    if (!props.isEditable) return;

    event.preventDefault();
    event.stopPropagation();

    isResizing.value = true;
    resizeStartSize.value = {
        width: props.element.size?.width || 100,
        height: props.element.size?.height || 100,
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing.value) return;

        const deltaX = e.clientX - event.clientX;
        const deltaY = e.clientY - event.clientY;

        let newWidth = resizeStartSize.value.width;
        let newHeight = resizeStartSize.value.height;

        if (direction.includes('right')) newWidth += deltaX;
        if (direction.includes('bottom')) newHeight += deltaY;

        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(30, newHeight);

        const updatedElement = {
            ...props.element,
            size: {
                width: newWidth,
                height: newHeight,
            },
        };

        emit('update:element', updatedElement);
    };

    const handleResizeEnd = () => {
        isResizing.value = false;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
}

// Lifecycle
onMounted(() => {
    // Initialize widget-specific behavior
});

onUnmounted(() => {
    // Cleanup all event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
    <div ref="elementRef" :style="elementStyle" class="unified-widget-element" :class="{
        'is-selected': isSelected,
        'is-dragging': isDragging,
        'is-resizing': isResizing,
        [`framework-${element.framework}`]: true,
        [`widget-${element.type}`]: true,
    }" @click="handleElementClick" @mousedown="handleMouseDown">
        <!-- Widget content -->
        <div class="widget-content">
            <component :is="widgetComponent" v-bind="widgetProps" @update:property="handlePropertyChange"
                @widget-event="(event: any) => emit('widget-event', event)">
                <!-- Handle text content for simple elements -->
                <template v-if="element.textContent">
                    {{ element.textContent }}
                </template>

                <!-- Handle child elements -->
                <template v-if="element.children && element.children.length > 0">
                    <UnifiedWidgetRenderer v-for="child in element.children" :key="child.id" :element="child"
                        :is-editable="isEditable"
                        @update:element="(updatedChild: UnifiedElement) => emit('update:element', updatedChild)"
                        @select="(selectedChild: UnifiedElement) => emit('select', selectedChild)"
                        @widget-event="(event: any) => emit('widget-event', event)"
                        @property-change="(prop: string, val: any) => emit('property-change', prop, val)" />
                </template>
            </component>
        </div>

        <!-- Selection and editing controls -->
        <div v-if="isSelected && isEditable" class="widget-controls">
            <!-- Drag handle -->
            <div class="drag-handle" title="Arrastrar elemento">
                <span class="material-icons">drag_indicator</span>
            </div>

            <!-- Resize handles -->
            <div class="resize-handles">
                <div class="resize-handle resize-se" @mousedown="handleResizeStart($event, 'bottom-right')"
                    title="Redimensionar">
                    <span class="material-icons">open_in_full</span>
                </div>
            </div>

            <!-- Quick actions -->
            <div class="quick-actions">
                <button class="quick-action-btn" title="Eliminar"
                    @click.stop="emit('widget-event', { type: 'delete', elementId: element.id })">
                    <span class="material-icons">delete</span>
                </button>
                <button class="quick-action-btn" title="Duplicar"
                    @click.stop="emit('widget-event', { type: 'duplicate', elementId: element.id })">
                    <span class="material-icons">content_copy</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.unified-widget-element {
    position: absolute;
    transition: all 0.2s ease;
    user-select: none;
    cursor: pointer;
}

.unified-widget-element.is-selected {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.unified-widget-element.is-dragging {
    cursor: grabbing;
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.unified-widget-element.is-resizing {
    cursor: nw-resize;
}

.widget-content {
    width: 100%;
    height: 100%;
    position: relative;
}

/* Framework-specific styling */
.framework-flutter {
    border: 1px solid rgba(14, 165, 233, 0.2);
    border-radius: 4px;
    background: rgba(14, 165, 233, 0.02);
}

.framework-angular {
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 4px;
    background: rgba(239, 68, 68, 0.02);
}

/* Widget controls */
.widget-controls {
    position: absolute;
    top: -30px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
}

.drag-handle {
    background: #3b82f6;
    color: white;
    padding: 4px;
    border-radius: 4px;
    cursor: grab;
    pointer-events: all;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.drag-handle:hover {
    background: #2563eb;
}

.resize-handles {
    position: absolute;
    bottom: -8px;
    right: -8px;
    pointer-events: all;
}

.resize-handle {
    width: 16px;
    height: 16px;
    background: #3b82f6;
    color: white;
    border-radius: 2px;
    cursor: nw-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.resize-handle:hover {
    background: #2563eb;
}

.quick-actions {
    display: flex;
    gap: 4px;
    pointer-events: all;
}

.quick-action-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.quick-action-btn:hover {
    background: #dc2626;
    transform: scale(1.05);
}

.quick-action-btn:nth-child(2) {
    background: #10b981;
}

.quick-action-btn:nth-child(2):hover {
    background: #059669;
}

/* Widget-specific styles */
.widget-Text {
    min-height: 20px;
    min-width: 50px;
}

.widget-Button,
.widget-ElevatedButton {
    min-height: 40px;
    min-width: 80px;
}

.widget-TextField,
.widget-TextFormField {
    min-height: 40px;
    min-width: 200px;
}

.widget-Container {
    min-height: 60px;
    min-width: 60px;
}

.widget-Row,
.widget-Column {
    min-height: 40px;
    min-width: 100px;
}

/* Hover effects */
.unified-widget-element:hover:not(.is-selected) {
    outline: 1px solid #3b82f6;
    outline-offset: 1px;
}

/* Dark mode support */
.dark .unified-widget-element {
    border-color: rgba(255, 255, 255, 0.1);
}

.dark .drag-handle,
.dark .resize-handle {
    background: #1e293b;
    color: #f1f5f9;
}

.dark .drag-handle:hover,
.dark .resize-handle:hover {
    background: #334155;
}

/* Animation for smooth transitions */
@keyframes elementSelect {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}

.unified-widget-element.is-selected {
    animation: elementSelect 0.3s ease;
}
</style>
