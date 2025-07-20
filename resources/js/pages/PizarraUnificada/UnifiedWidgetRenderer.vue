<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { UnifiedElement } from '@/Data/PizarraUnificada';
import { UnifiedInteractionService } from '@/services/UnifiedInteractionService';

// Importar componentes de Flutter para renderizado real
import AppBarFlutter from '@/pages/WidgetsFlutter/AppBarFlutter.vue';
import InputFlutter from '@/pages/WidgetsFlutter/InputFlutter.vue';
import ElevatedButtonFlutter from '@/pages/WidgetsFlutter/ElevatedButtonFlutter.vue';
import CheckboxFlutter from '@/pages/WidgetsFlutter/CheckboxFlutter.vue';
import DropdownFlutter from '@/pages/WidgetsFlutter/DropdownFlutter.vue';
import CardFlutter from '@/pages/WidgetsFlutter/CardFlutter.vue';
import ImageFlutter from '@/pages/WidgetsFlutter/ImageFlutter.vue';
import IconFlutter from '@/pages/WidgetsFlutter/IconFlutter.vue';
import LayoutsFlutter from '@/pages/WidgetsFlutter/LayoutsFlutter.vue';

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
    'duplicate-element',
    'deselect-all',
    'create-widget'
]);

// Reactive references
const elementRef = ref<HTMLElement | null>(null);

// Interaction service instance
let interactionService: UnifiedInteractionService | null = null;

// Computed properties
const elementStyle = computed(() => {
    const style: Record<string, any> = {
        position: 'relative',
        display: 'block',
        marginBottom: '10px',
        zIndex: props.element.zIndex || 1,
    };

    // Si está arrastrando, cambiar a posición absoluta
    if (interactionService?.getState().isDragging) {
        style.position = 'absolute';
        style.zIndex = 1001;
        if (props.element.position) {
            style.left = `${props.element.position.x}px`;
            style.top = `${props.element.position.y}px`;
        }
    }

    return style;
});

// Widget component mapping
const widgetComponent = computed(() => {
    const widgetMap: Record<string, any> = {
        // Flutter widgets
        'TextField': InputFlutter,
        'TextFormField': InputFlutter,
        'ElevatedButton': ElevatedButtonFlutter,
        'Text': LayoutsFlutter,
        'Container': LayoutsFlutter,
        'Row': LayoutsFlutter,
        'Column': LayoutsFlutter,
        'Image': ImageFlutter,
        'Icon': IconFlutter,
        'Checkbox': CheckboxFlutter,
        'DropdownButton': DropdownFlutter,
        'Card': CardFlutter,
        'AppBar': AppBarFlutter,
        'Scaffold': LayoutsFlutter,
        'SafeArea': LayoutsFlutter,
        'Padding': LayoutsFlutter,
        'Center': LayoutsFlutter,
        'SizedBox': LayoutsFlutter,
        'Label': LayoutsFlutter,
        'Slider': LayoutsFlutter,
        'Switch': LayoutsFlutter,
        'Radio': LayoutsFlutter,
        'Select': LayoutsFlutter,
        'ListTile': LayoutsFlutter,
        'ScaffoldWidget': LayoutsFlutter,
        'TextWidget': LayoutsFlutter,
        'IconWidget': LayoutsFlutter,
        'ImageWidget': LayoutsFlutter,

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
        // Angular Material component
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
function handlePropertyChange(property: string, value: any) {
    console.log('🔧 Property changed:', property, value);
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

function handleDeleteElement() {
    console.log('🗑️ Delete element requested from UnifiedWidgetRenderer:', props.element.id);
    console.log('🗑️ Element details:', { id: props.element.id, type: props.element.type, framework: props.element.framework });
    
    // Emitir el evento de eliminación
    emit('delete-element', props.element);
    
    console.log('📤 delete-element event emitted from UnifiedWidgetRenderer');
}

function handleElementClick() {
    console.log('🖱️ Element clicked:', props.element.id);
    
    // Verificar si no está siendo arrastrado
    if (!interactionService?.getState().isDragging) {
        console.log('✅ Emitting select event for element:', props.element.id);
        emit('select', props.element);
    } else {
        console.log('🚫 Click ignored - element is being dragged');
    }
}

function handleDuplicateElement() {
    console.log('📋 Duplicate element requested:', props.element.id);
    emit('duplicate-element', props.element);
}

function handleToggleProperties() {
    console.log('⚙️ Toggle properties requested for:', props.element.id);
    
    // Emitir evento para abrir el panel de propiedades
    emit('widget-event', {
        type: 'open-properties',
        elementId: props.element.id,
        element: props.element
    });
    
    // También emitir el evento de selección para asegurar que el elemento esté seleccionado
    emit('select', props.element);
}

function handleMoveStart(event: MouseEvent) {
    console.log('🖱️ Move start on element:', props.element.type, props.element.id);
    // El servicio de interacciones manejará esto automáticamente
}

// Función para obtener el nombre de visualización del elemento
function getElementDisplayName(type: string): string {
    const nameMap: Record<string, string> = {
        'TextField': 'Campo de Texto',
        'TextFormField': 'Campo de Formulario',
        'ElevatedButton': 'Botón Elevado',
        'Text': 'Texto',
        'Container': 'Contenedor',
        'Row': 'Fila',
        'Column': 'Columna',
        'Image': 'Imagen',
        'Icon': 'Icono',
        'Checkbox': 'Casilla de Verificación',
        'DropdownButton': 'Menú Desplegable',
        'Card': 'Tarjeta',
        'AppBar': 'Barra de Aplicación',
        'Scaffold': 'Estructura',
        'SafeArea': 'Área Segura',
        'Padding': 'Relleno',
        'Center': 'Centro',
        'SizedBox': 'Caja de Tamaño',
        'Label': 'Etiqueta',
        'div': 'Div',
        'span': 'Span',
        'button': 'Botón',
        'input': 'Entrada',
        'p': 'Párrafo',
        'h1': 'Título 1',
        'h2': 'Título 2',
        'h3': 'Título 3',
    };
    return nameMap[type] || type;
}

// Función para obtener el componente real de Flutter
function getRealWidgetComponent(type: string) {
    const componentMap: Record<string, any> = {
        'TextField': InputFlutter,
        'TextFormField': InputFlutter,
        'ElevatedButton': ElevatedButtonFlutter,
        'Checkbox': CheckboxFlutter,
        'DropdownButton': DropdownFlutter,
        'Card': CardFlutter,
        'Image': ImageFlutter,
        'Icon': IconFlutter,
        'AppBar': AppBarFlutter,
        'Row': LayoutsFlutter,
        'Column': LayoutsFlutter,
        'Container': LayoutsFlutter,
        'SafeArea': LayoutsFlutter,
        'Padding': LayoutsFlutter,
        'Center': LayoutsFlutter,
        'SizedBox': LayoutsFlutter,
    };

    return componentMap[type] || widgetComponent.value;
}

// Función para obtener las propiedades del widget
function getWidgetProps(element: UnifiedElement) {
    // Procesar propiedades para componentes de Flutter
    const processedProps = { ...element.props };

    // Casos especiales para diferentes tipos de widgets
    switch (element.type) {
        case 'TextField':
        case 'TextFormField':
            return {
                ...processedProps,
                label: processedProps.label || 'Campo de texto',
                hint: processedProps.hint || 'Ingrese texto',
                value: processedProps.value || '',
                type: 'text'
            };

        case 'ElevatedButton':
            return {
                ...processedProps,
                text: processedProps.text || 'Botón',
                onPressed: processedProps.onPressed || '() {}'
            };

        case 'Text':
            return {
                ...processedProps,
                text: processedProps.text || 'Texto de ejemplo',
                style: processedProps.style || 'TextStyle(fontSize: 16)'
            };

        case 'Container':
            return {
                ...processedProps,
                child: processedProps.child || 'Text("Contenedor")',
                decoration: processedProps.decoration || 'BoxDecoration()'
            };

        case 'Row':
        case 'Column':
            return {
                ...processedProps,
                children: processedProps.children || '[]',
                mainAxisAlignment: processedProps.mainAxisAlignment || 'MainAxisAlignment.start',
                crossAxisAlignment: processedProps.crossAxisAlignment || 'CrossAxisAlignment.center'
            };

        case 'Image':
            return {
                ...processedProps,
                src: processedProps.src || '/images/placeholder.png',
                width: processedProps.width || 100,
                height: processedProps.height || 100,
                alt: processedProps.alt || 'Imagen'
            };

        case 'Icon':
            return {
                ...processedProps,
                icon: processedProps.icon || 'Icons.star',
                size: processedProps.size || 24,
                color: processedProps.color || 'Colors.black'
            };

        case 'Checkbox':
            return {
                ...processedProps,
                label: processedProps.label || 'Opción',
                value: processedProps.value || false
            };

        case 'Card':
            return {
                ...processedProps,
                title: processedProps.title || 'Título de la tarjeta',
                content: processedProps.content || 'Contenido de la tarjeta'
            };

        case 'AppBar':
            return {
                ...processedProps,
                title: processedProps.title || 'Mi Aplicación',
                backgroundColor: processedProps.backgroundColor || '#2196F3'
            };

        default:
            return processedProps;
    }
}

// Lifecycle hooks
onMounted(() => {
    console.log('🔄 UnifiedWidgetRenderer mounted for element:', props.element.id);

    if (elementRef.value && props.isEditable) {
        // Configurar el canvas provider para el servicio
        const canvasProvider = {
            getCanvasContainer: () => elementRef.value?.closest('.canvas-content') as HTMLElement,
            getCanvasBounds: () => elementRef.value?.closest('.canvas-content')?.getBoundingClientRect() || null
        };

        // Crear instancia del servicio de interacciones
        interactionService = new UnifiedInteractionService({
            isEditable: props.isEditable,
            canvasProvider,
            onElementUpdate: (element) => {
                emit('update:element', element);
            },
            onElementSelect: (element) => {
                emit('select', element);
            }
        });

        // Inicializar interacciones para este elemento
        interactionService.initializeElement(props.element, elementRef.value);
    }
});

onUnmounted(() => {
    console.log('🔄 UnifiedWidgetRenderer unmounted for element:', props.element.id);

    // Limpiar el servicio de interacciones
    if (interactionService) {
        interactionService.cleanup();
        interactionService = null;
    }
});
</script>

<template>
    <div ref="elementRef" :style="elementStyle" class="unified-widget-element" :class="{
        'is-selected': isSelected,
        'is-dragging': interactionService?.getState().isDragging,
        'is-resizing': false, // No hay lógica de resize aquí, el servicio la maneja
        'selected-widget': isSelected,
        [`framework-${element.framework}`]: true,
        [`widget-${element.type}`]: true,
        'mobile-widget': true,
    }"

    :data-element-id="element.id"
    :data-element-type="element.type"
    @click.stop="handleElementClick">

        <!-- Widget content - Componente real -->
        <div class="widget-content">
            <!-- Renderizar widget real basado en el tipo -->
            <component
                :is="getRealWidgetComponent(element.type)"
                v-bind="getWidgetProps(element)"
                @update:property="handlePropertyChange"
                @widget-event="(event: any) => emit('widget-event', event)"
            >
                <!-- Handle text content for simple elements -->
                <template v-if="element.textContent">
                    {{ element.textContent }}
                </template>

                <!-- Handle child elements -->
                <template v-if="element.children && element.children.length > 0">
                    <UnifiedWidgetRenderer
                        v-for="child in element.children"
                        :key="child.id"
                        :element="child"
                        :is-editable="isEditable"
                        @update:element="(updatedChild: UnifiedElement) => emit('update:element', updatedChild)"
                        @select="(selectedChild: UnifiedElement) => emit('select', selectedChild)"
                        @widget-event="(event: any) => emit('widget-event', event)"
                        @property-change="(prop: string, val: any) => emit('property-change', prop, val)"
                    />
                </template>
            </component>
        </div>

        <!-- Properties toggle button - Solo visible cuando está seleccionado -->
        <button 
            v-if="isSelected" 
            class="properties-button" 
            @click.stop="handleToggleProperties" 
            title="Abrir/Cerrar propiedades">
            <span class="material-icons">settings</span>
        </button>

        <!-- Move button - Solo visible cuando está seleccionado -->
        <button 
            v-if="isSelected" 
            class="move-button" 
            @mousedown.stop="handleMoveStart" 
            title="Mover elemento">
            <span class="material-icons">drag_indicator</span>
        </button>

        <!-- Delete button - Solo visible cuando está seleccionado -->
        <button 
            v-if="isSelected" 
            class="delete-button" 
            @click="() => { console.log('🔍 Click detected on delete button for element:', props.element.id); handleDeleteElement(); }"
            style="position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; background: red; color: white; border: none; border-radius: 50%; cursor: pointer; z-index: 1005; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold;"
            title="Eliminar elemento">
            ✕
        </button>
        
        <!-- Debug info -->
        <div v-if="isSelected" style="position: absolute; top: -30px; left: 0; background: red; color: white; padding: 2px; font-size: 10px; z-index: 1005;">
            Selected: {{ isSelected }} | ID: {{ element.id }}
        </div>

        <!-- Resize handle - Solo visible cuando está seleccionado -->
        <div v-if="isSelected && isEditable" class="resize-handle" data-direction="bottom-right"></div>
    </div>
</template>

<style scoped>
/* Estilos base del elemento unificado */
.unified-widget-element {
    position: relative;
    transition: all 0.3s ease;
    user-select: none;
    cursor: grab;
    isolation: isolate;
    overflow: visible;
    box-sizing: border-box;
    pointer-events: auto;
    z-index: 1;
    /* Asegurar que el elemento sea interactivo */
    touch-action: none;
    /* Padding para el borde de selección */
    padding: 2px;
    /* Layout vertical */
    display: block;
    margin-bottom: 10px;
}

.unified-widget-element:active {
    cursor: grabbing;
}

/* Cuando está arrastrando, cambiar a posición absoluta */
.unified-widget-element.is-dragging {
    position: absolute !important;
    z-index: 1001;
}

/* Estilos de PizarraFlutter para selección visual */
.mobile-widget {
    margin-bottom: 10px;
    border-radius: 8px;
    background-color: transparent;
    overflow: visible;
    transition: all 0.3s ease;
    position: relative;
    width: 100%;
    /* Asegurar que sea clickeable */
    pointer-events: auto;
}

:root.dark .mobile-widget {
    background-color: transparent;
}

.selected-widget {
    box-shadow: 0 0 0 2px #3b82f6, 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: scale(1.01);
    /* Asegurar que el elemento seleccionado esté por encima */
    z-index: 1000 !important;
    /* Borde azul que encapsula todo el componente */
    border: 2px solid #3b82f6;
    border-radius: 8px;
}

:root.dark .selected-widget {
    box-shadow: 0 0 0 2px #3b82f6, 0 4px 8px rgba(0, 0, 0, 0.3);
    border: 2px solid #3b82f6;
}

/* Widget content - Componente real */
.widget-content {
    position: relative;
    width: 100%;
    height: 100%;
    /* Permitir que el componente se vea natural */
    background: transparent;
    border: none;
    box-shadow: none;
}

/* Properties button - Estilo mejorado */
.properties-button {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #4f46e5;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid white;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    pointer-events: auto;
}

.properties-button:hover {
    background-color: #3730a3;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.properties-button .material-icons {
    font-size: 14px;
    font-weight: bold;
}

:root.dark .properties-button {
    border-color: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Move button - Estilo mejorado */
.move-button {
    position: absolute;
    top: -8px;
    left: 20px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #10b981;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid white;
    cursor: grab;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    pointer-events: auto;
}

.move-button:hover {
    background-color: #059669;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: grabbing;
}

.move-button:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.move-button .material-icons {
    font-size: 14px;
    font-weight: bold;
}

:root.dark .move-button {
    border-color: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Delete button - Estilo mejorado */
.delete-button {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #ef4444;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid white;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    pointer-events: auto;
}

.delete-button:hover {
    background-color: #dc2626;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.delete-button .material-icons {
    font-size: 14px;
    font-weight: bold;
}

:root.dark .delete-button {
    border-color: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Estados de selección */
.unified-widget-element.is-selected {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    z-index: 1000 !important;
    pointer-events: auto;
}

/* Widget controls */
.widget-controls {
    position: absolute;
    top: -45px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
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
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.3);
    animation: pulse 2s infinite;
    gap: 6px;
    min-width: 80px;
    /* Asegurar que el handle sea muy visible */
    z-index: 1004;
}

.drag-handle:active {
    cursor: grabbing;
    transform: scale(0.95);
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.drag-handle-text {
    font-size: 12px;
    font-weight: 500;
    margin-left: 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
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

/* Estados de arrastre */
.unified-widget-element.is-dragging {
    cursor: grabbing;
    z-index: 1001 !important;
    transition: none !important;
    pointer-events: none;
}

.unified-widget-element.is-dragging .widget-content {
    pointer-events: none;
}

.unified-widget-element.is-dragging .widget-header {
    pointer-events: none;
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
    width: 10px;
    height: 10px;
    background-color: #4f46e5;
    position: absolute;
    right: 0;
    bottom: 0;
    cursor: nwse-resize;
    border-radius: 2px;
    z-index: 1002;
}

.resize-handle:hover {
    background-color: #3730a3;
    transform: scale(1.1);
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

.duplicate-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}

.duplicate-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
}
</style>
