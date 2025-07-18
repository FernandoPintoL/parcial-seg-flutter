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
    'property-change',
    'delete-element',
    'duplicate-element'
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
        // Mejoro el sistema de z-index para evitar sobreposiciones
        zIndex: props.isSelected ? 1000 : (props.element.zIndex || 1),
        transform: props.element.transform || 'none',
        opacity: props.element.opacity || 1,
        // Añado contenment para mejor performance y evitar desbordamientos
        contain: 'layout style',
        // Mejoro la visibilidad de elementos pequeños
        minWidth: '20px',
        minHeight: '20px',
    };

    if (props.isSelected) {
        baseStyle.outline = '2px solid #3b82f6';
        baseStyle.outlineOffset = '2px';
        baseStyle.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
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
    // Ensure properties exist, even if empty
    const elementProperties = props.element.properties || {};
    const elementProps = props.element.props || {};

    // Merge properties and props
    const mergedProperties = { ...elementProperties, ...elementProps };

    // Base props for all frameworks
    const baseProps = {
        width: props.element.size?.width,
        height: props.element.size?.height,
    };

    // Add common props based on widget type
    if (props.element.framework === 'flutter') {
        // For Flutter components, ensure we always pass a 'properties' prop
        return {
            properties: mergedProperties,
            ...baseProps,
        };
    } else if (props.element.framework === 'angular') {
        // For Angular components, pass properties directly
        return {
            ...mergedProperties,
            ...baseProps,
            style: {
                width: props.element.size?.width ? `${props.element.size.width}px` : 'auto',
                height: props.element.size?.height ? `${props.element.size.height}px` : 'auto',
            },
        };
    }

    // Default fallback
    return {
        properties: mergedProperties,
        ...baseProps,
    };
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

    // Set dragging state
    isDragging.value = true;

    // Get element's current position
    const rect = elementRef.value?.getBoundingClientRect();
    if (!rect) return;

    // Calculate drag offset relative to the element
    dragOffset.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };

    // Bring element to front while dragging
    const updatedElement = {
        ...props.element,
        zIndex: 1000 // High z-index during drag
    };
    emit('update:element', updatedElement);

    // Add event listeners for drag operations
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Add a class to indicate dragging state
    if (elementRef.value) {
        elementRef.value.classList.add('is-dragging');
    }
}

function handleMouseMove(event: MouseEvent) {
    if (!isDragging.value || !props.isEditable) return;

    // Get the canvas container and its scroll position
    const canvas = document.querySelector('.canvas-container');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;

    // Calculate new position based on mouse movement, accounting for scroll
    const newPosition = {
        x: Math.max(0, event.clientX - canvasRect.left - dragOffset.value.x + scrollLeft),
        y: Math.max(0, event.clientY - canvasRect.top - dragOffset.value.y + scrollTop),
    };

    // Get element dimensions
    const elementRect = elementRef.value?.getBoundingClientRect();
    if (!elementRect) return;

    // Determine the container based on the framework
    let containerWidth = canvasRect.width;
    let containerHeight = canvasRect.height;

    // For Angular, check if we're in a browser-content container
    const browserContent = document.querySelector('.browser-content');
    if (browserContent && props.element.framework === 'angular') {
        const browserRect = browserContent.getBoundingClientRect();
        containerWidth = browserRect.width;
        containerHeight = browserRect.height;
    }

    // For Flutter, check if we're in a phone-content-area container
    const phoneContent = document.querySelector('.phone-content-area');
    if (phoneContent && props.element.framework === 'flutter') {
        const phoneRect = phoneContent.getBoundingClientRect();
        containerWidth = phoneRect.width;
        containerHeight = phoneRect.height;
    }

    // Ensure element stays within container boundaries with a small margin
    const margin = 5;
    const maxX = containerWidth - elementRect.width - margin;
    const maxY = containerHeight - elementRect.height - margin;

    newPosition.x = Math.min(Math.max(margin, newPosition.x), maxX);
    newPosition.y = Math.min(Math.max(margin, newPosition.y), maxY);

    // Update element with new position and increase z-index during dragging
    const updatedElement = {
        ...props.element,
        position: newPosition,
        zIndex: 1000, // Ensure dragged element is on top
    };

    emit('update:element', updatedElement);

    // Force browser repaint to ensure smooth dragging
    window.requestAnimationFrame(() => {
        if (elementRef.value) {
            elementRef.value.style.transform = 'translateZ(0)';
        }
    });
}

function handleMouseUp() {
    // Remove event listeners first
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Only proceed if we were actually dragging
    if (isDragging.value) {
        // Keep the element's current z-index instead of resetting it
        // This ensures elements maintain their stacking order after being moved
        const updatedElement = {
            ...props.element,
            // We don't modify the z-index here, keeping whatever value it had
        };

        // Update the element
        emit('update:element', updatedElement);

        // Remove dragging class
        if (elementRef.value) {
            elementRef.value.classList.remove('is-dragging');

            // Force a small delay to ensure UI updates properly
            setTimeout(() => {
                if (elementRef.value) {
                    elementRef.value.style.transform = '';
                }
            }, 50);
        }
    }

    // Set dragging state to false at the end
    isDragging.value = false;
}

function handleResizeStart(event: MouseEvent, direction: string) {
    if (!props.isEditable) return;

    event.preventDefault();
    event.stopPropagation();

    isResizing.value = true;
    const startPosition = { x: props.element.position?.x || 0, y: props.element.position?.y || 0 };
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
        let newX = startPosition.x;
        let newY = startPosition.y;

        // Manejar cambios de tamaño según la dirección
        switch (direction) {
            case 'top-left':
                newWidth -= deltaX;
                newHeight -= deltaY;
                newX += deltaX;
                newY += deltaY;
                break;
            case 'top-right':
                newWidth += deltaX;
                newHeight -= deltaY;
                newY += deltaY;
                break;
            case 'bottom-left':
                newWidth -= deltaX;
                newHeight += deltaY;
                newX += deltaX;
                break;
            case 'bottom-right':
                newWidth += deltaX;
                newHeight += deltaY;
                break;
            case 'top':
                newHeight -= deltaY;
                newY += deltaY;
                break;
            case 'bottom':
                newHeight += deltaY;
                break;
            case 'left':
                newWidth -= deltaX;
                newX += deltaX;
                break;
            case 'right':
                newWidth += deltaX;
                break;
        }

        // Aplicar límites mínimos
        const minWidth = 50;
        const minHeight = 30;

        if (newWidth < minWidth) {
            if (direction.includes('left')) {
                newX = startPosition.x + (resizeStartSize.value.width - minWidth);
            }
            newWidth = minWidth;
        }

        if (newHeight < minHeight) {
            if (direction.includes('top')) {
                newY = startPosition.y + (resizeStartSize.value.height - minHeight);
            }
            newHeight = minHeight;
        }

        const updatedElement = {
            ...props.element,
            size: {
                width: newWidth,
                height: newHeight,
            },
            position: {
                x: newX,
                y: newY,
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

const handleDeleteElement = (event: MouseEvent) => {
    // Ensure the event doesn't propagate and prevent default behavior
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    console.log('DELETE BUTTON CLICKED - Element:', {
        id: props.element.id,
        type: props.element.type,
        isSelected: props.isSelected,
        isEditable: props.isEditable,
        element: props.element
    });

    // Add more detailed logging
    console.log('Emitting delete-element event with full element object');

    // Emit the delete-element event with the full element object
    emit('delete-element', props.element);

    // Log after emission
    console.log('Delete event emitted successfully');

    // Force a small delay to ensure event processing
    setTimeout(() => {
        console.log('Delete operation should be complete');
    }, 100);
};

function handleDuplicateElement() {
    console.log('📋 Duplicate button clicked for element:', props.element.id);
    emit('duplicate-element', props.element);
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
            <div class="drag-handle" title="Arrastra para mover libremente el widget"
                @mousedown.stop="handleMouseDown($event)">
                <span class="material-icons">open_with</span>
                <span class="drag-handle-text">Mover</span>
            </div>

            <!-- Resize handles -->
            <div class="resize-handles">
                <!-- Esquinas -->
                <div class="resize-handle resize-nw" @mousedown="handleResizeStart($event, 'top-left')"
                    title="Redimensionar desde esquina superior izquierda">
                    <span class="material-icons">north_west</span>
                </div>
                <div class="resize-handle resize-ne" @mousedown="handleResizeStart($event, 'top-right')"
                    title="Redimensionar desde esquina superior derecha">
                    <span class="material-icons">north_east</span>
                </div>
                <div class="resize-handle resize-sw" @mousedown="handleResizeStart($event, 'bottom-left')"
                    title="Redimensionar desde esquina inferior izquierda">
                    <span class="material-icons">south_west</span>
                </div>
                <div class="resize-handle resize-se" @mousedown="handleResizeStart($event, 'bottom-right')"
                    title="Redimensionar desde esquina inferior derecha">
                    <span class="material-icons">south_east</span>
                </div>

                <!-- Bordes -->
                <div class="resize-handle resize-n" @mousedown="handleResizeStart($event, 'top')"
                    title="Redimensionar altura desde arriba">
                    <span class="material-icons">drag_indicator</span>
                </div>
                <div class="resize-handle resize-s" @mousedown="handleResizeStart($event, 'bottom')"
                    title="Redimensionar altura desde abajo">
                    <span class="material-icons">drag_indicator</span>
                </div>
                <div class="resize-handle resize-e" @mousedown="handleResizeStart($event, 'right')"
                    title="Redimensionar ancho desde la derecha">
                    <span class="material-icons">drag_indicator</span>
                </div>
                <div class="resize-handle resize-w" @mousedown="handleResizeStart($event, 'left')"
                    title="Redimensionar ancho desde la izquierda">
                    <span class="material-icons">drag_indicator</span>
                </div>
            </div>

            <!-- Quick actions -->
            <div class="quick-actions" v-if="props.isSelected">
                <button class="quick-action-btn delete-btn" title="Eliminar" @click.stop="handleDeleteElement"
                    @mousedown.stop @mouseup.stop
                    onclick="event.stopPropagation(); console.log('Direct onclick handler triggered');" type="button"
                    tabindex="0" style="z-index: 9999; position: relative;">
                    <span class="material-icons">delete</span>
                    <span class="delete-text"
                        style="position: absolute; width: 1px; height: 1px; overflow: hidden;">Eliminar</span>
                </button>
                <button class="quick-action-btn duplicate-btn" title="Duplicar" @click.stop="handleDuplicateElement"
                    @mousedown.stop @mouseup.stop>
                    <span class="material-icons">content_copy</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.unified-widget-element {
    position: absolute;
    transition: transform 0.1s ease, box-shadow 0.2s ease;
    user-select: none;
    cursor: move;
    /* Cambiado de pointer a move para indicar que es arrastrable */
    /* Mejoro el control de capas y overflow */
    isolation: isolate;
    overflow: visible;
    /* Añado mejor gestión de bordes para evitar sobreposiciones visuales */
    box-sizing: border-box;
    /* Añado un borde sutil para mejor visualización */
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.unified-widget-element.is-selected {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    /* Aseguro que el elemento seleccionado esté por encima */
    z-index: 999 !important;
}

.unified-widget-element.is-dragging {
    cursor: grabbing;
    transform: scale(1.03);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    /* Higher z-index during drag */
    z-index: 1001 !important;
    /* Disable transitions for immediate movement */
    transition: none !important;
    /* Add a more visible border during drag */
    border: 2px solid rgba(59, 130, 246, 0.8);
    /* Add a subtle glow effect */
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
    /* Improve performance */
    will-change: transform, left, top;
    /* Ensure pointer events work correctly */
    pointer-events: none;
}

.unified-widget-element.is-resizing {
    cursor: nw-resize;
    /* Z-index alto durante redimensionamiento */
    z-index: 1001 !important;
}

.widget-content {
    width: 100%;
    height: 100%;
    position: relative;
    /* Prevenir overflow que cause sobreposiciones */
    overflow: hidden;
    /* Mejoro el rendering */
    will-change: transform;
}

/* Framework-specific styling */
.framework-flutter {
    border: 1px solid rgba(14, 165, 233, 0.3);
    border-radius: 6px;
    background: rgba(14, 165, 233, 0.05);
    /* Añado backdrop para mejor visibilidad */
    backdrop-filter: blur(1px);
}

.framework-angular {
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.05);
    /* Añado backdrop para mejor visibilidad */
    backdrop-filter: blur(1px);
}

/* Widget controls */
.widget-controls {
    position: absolute;
    top: -35px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    /* Aseguro que los controles estén siempre visibles */
    z-index: 1002;
}

.drag-handle {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: grab;
    pointer-events: all;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    /* Añadir un borde para mayor visibilidad */
    border: 1px solid rgba(255, 255, 255, 0.3);
    /* Añadir un efecto de pulso sutil para llamar la atención */
    animation: pulse 2s infinite;
    /* Mejorar el espaciado para el texto */
    gap: 6px;
}

.drag-handle-text {
    font-size: 14px;
    font-weight: 500;
    margin-left: 2px;
    /* Asegurar que el texto sea legible */
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

@keyframes pulse {
    0% {
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }

    50% {
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    100% {
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
}

.drag-handle:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.resize-handles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1003;
}

.resize-handle {
    position: absolute;
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    pointer-events: all;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.resize-handle:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* Posicionamiento específico para cada handle */
.resize-nw {
    top: -10px;
    left: -10px;
    cursor: nw-resize;
}

.resize-ne {
    top: -10px;
    right: -10px;
    cursor: ne-resize;
}

.resize-sw {
    bottom: -10px;
    left: -10px;
    cursor: sw-resize;
}

.resize-se {
    bottom: -10px;
    right: -10px;
    cursor: se-resize;
}

.resize-n {
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    cursor: n-resize;
    width: 24px;
    height: 12px;
}

.resize-s {
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    cursor: s-resize;
    width: 24px;
    height: 12px;
}

.resize-e {
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    cursor: e-resize;
    width: 12px;
    height: 24px;
}

.resize-w {
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    cursor: w-resize;
    width: 12px;
    height: 24px;
}

/* Iconos específicos para diferentes direcciones */
.resize-n .material-icons,
.resize-s .material-icons {
    transform: rotate(90deg);
    font-size: 10px;
}

.resize-e .material-icons,
.resize-w .material-icons {
    font-size: 10px;
}

.resize-nw .material-icons,
.resize-ne .material-icons,
.resize-sw .material-icons,
.resize-se .material-icons {
    font-size: 10px;
}

/* Quick actions styling */
.quick-actions {
    position: absolute;
    top: -35px;
    right: 0;
    display: flex;
    gap: 8px;
    pointer-events: all;
    z-index: 1003;
}

.quick-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.quick-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
}

.delete-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
}

.delete-btn:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.duplicate-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}

.duplicate-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
}
</style>
