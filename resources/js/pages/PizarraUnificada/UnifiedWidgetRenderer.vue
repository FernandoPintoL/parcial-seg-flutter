<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { UnifiedElement } from '@/Data/PizarraUnificada';

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
const isDragging = ref(false);
const isResizing = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const resizeStartSize = ref({ width: 0, height: 0 });
const initialPosition = ref({ x: 0, y: 0 });

// Computed properties
const elementStyle = computed(() => {
    const baseStyle: Record<string, any> = {
        position: 'absolute' as const,
        width: props.element.size?.width ? `${props.element.size.width}px` : 'auto',
        height: props.element.size?.height ? `${props.element.size.height}px` : 'auto',
        transform: props.element.transform || 'none',
        opacity: props.element.opacity || 1,
        // Transiciones suaves
        transition: 'all 0.3s ease',
        // Cursor apropiado
        cursor: 'grab',
    };

    // Aplicar posición desde el estado
    baseStyle.left = `${props.element.position?.x || 0}px`;
    baseStyle.top = `${props.element.position?.y || 0}px`;
    baseStyle.zIndex = props.isSelected ? 1000 : (props.element.zIndex || 1);

    if (props.isSelected) {
        baseStyle.outline = '2px solid #3b82f6';
        baseStyle.outlineOffset = '2px';
        baseStyle.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
        baseStyle.cursor = 'grab';
    }

    // Durante el arrastre
    if (isDragging.value) {
        baseStyle.cursor = 'grabbing';
        baseStyle.transition = 'none';
        baseStyle.zIndex = 1001;
    }

    return baseStyle;
});

const widgetComponent = computed(() => {
    const widgetMap: Record<string, any> = {
        // Flutter widgets
        'Container': LayoutsFlutter,
        'Button': ElevatedButtonFlutter,
        'ElevatedButton': ElevatedButtonFlutter,
        'TextButton': ElevatedButtonFlutter,
        'OutlinedButton': ElevatedButtonFlutter,
        'Text': InputFlutter,
        'TextField': InputFlutter,
        'TextFormField': InputFlutter,
        'Image': ImageFlutter,
        'Row': LayoutsFlutter,
        'Column': LayoutsFlutter,
        'Scaffold': LayoutsFlutter,
        'Padding': LayoutsFlutter,
        'Slider': LayoutsFlutter,
        'Switch': LayoutsFlutter,
        'Radio': LayoutsFlutter,
        'DropdownButton': DropdownFlutter,
        'Select': LayoutsFlutter, // Added mapping for Select widget
        'ListTile': LayoutsFlutter,
        'AppBar': AppBarFlutter,
        'ScaffoldWidget': LayoutsFlutter,
        'TextWidget': LayoutsFlutter,
        'IconWidget': LayoutsFlutter,
        'ImageWidget': LayoutsFlutter,
        'Checkbox': CheckboxFlutter,
        'Card': CardFlutter,

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
function handleElementClick(event: MouseEvent) {
    console.log('🎯 Element clicked:', props.element.type, props.element.id);

    // Solo manejar clic si no estamos arrastrando
    if (isDragging.value) {
        console.log('🔄 Ignoring click during drag');
        return;
    }

    // Prevenir la propagación para evitar conflictos
    event.preventDefault();
    event.stopPropagation();

    // Emitir el evento de selección
    emit('select', props.element);

    console.log('📤 Select event emitted for element:', props.element.id);
}

function handleElementDoubleClick(event: MouseEvent) {
    console.log('🎯 Element double-clicked:', props.element.type, props.element.id);

    // Solo manejar doble clic si no estamos arrastrando
    if (isDragging.value) {
        console.log('🔄 Ignoring double-click during drag');
        return;
    }

    // Prevenir la propagación
    event.preventDefault();
    event.stopPropagation();

    // Emitir evento para abrir editor de propiedades
    emit('widget-event', {
        type: 'edit-properties',
        elementId: props.element.id,
        element: props.element
    });
}

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

// Sistema de arrastre basado en JavaScript puro (como en el ejemplo)
function handleMouseDown(event: MouseEvent) {
    if (!props.isEditable) return;

    console.log('🖱️ Mouse down on element:', props.element.type, props.element.id);

    // Prevenir la propagación
    event.preventDefault();
    event.stopPropagation();

    // Obtener el canvas contenedor
    const canvas = document.querySelector('.unified-canvas') ||
                   document.querySelector('.canvas-container') ||
                   document.querySelector('.phone-content-area');

    if (!canvas) {
        console.warn('⚠️ No se encontró el contenedor del canvas');
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const elementRect = elementRef.value?.getBoundingClientRect();

    if (!elementRect) return;

    // Calcular offset relativo al punto de clic dentro del elemento
    dragOffset.value = {
        x: event.clientX - elementRect.left,
        y: event.clientY - elementRect.top,
    };

    console.log('📊 Canvas rect:', canvasRect);
    console.log('📊 Element rect:', elementRect);
    console.log('📊 Drag offset calculated:', dragOffset.value);

    // Set dragging state
    isDragging.value = true;

    // Bring element to front while dragging
    const updatedElement = {
        ...props.element,
        zIndex: 1001
    };
    emit('update:element', updatedElement);

    // Add event listeners for drag operations
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Add a class to indicate dragging state
    if (elementRef.value) {
        elementRef.value.classList.add('is-dragging');
    }

    console.log('✅ Drag started successfully');
}

function handleMouseMove(event: MouseEvent) {
    if (!isDragging.value || !props.isEditable) return;

    // Get the canvas container
    const canvas = document.querySelector('.unified-canvas') ||
                   document.querySelector('.canvas-container') ||
                   document.querySelector('.phone-content-area');

    if (!canvas) {
        console.warn('⚠️ No se encontró el contenedor del canvas');
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();

    // Calculate new position (como en el ejemplo)
    const newPosition = {
        x: event.clientX - canvasRect.left - dragOffset.value.x,
        y: event.clientY - canvasRect.top - dragOffset.value.y,
    };

    console.log('📍 New position calculated:', newPosition);

    // Ensure element stays within container boundaries
    const margin = 5;
    const maxX = canvasRect.width - (props.element.size?.width || 100) - margin;
    const maxY = canvasRect.height - (props.element.size?.height || 100) - margin;

    newPosition.x = Math.min(Math.max(margin, newPosition.x), maxX);
    newPosition.y = Math.min(Math.max(margin, newPosition.y), maxY);

    console.log('📍 Position after boundary check:', newPosition);

    // Update element with new position
    const updatedElement = {
        ...props.element,
        position: newPosition,
        zIndex: 1001,
    };

    // Emit the update
    emit('update:element', updatedElement);
}

function handleMouseUp() {
    console.log('🖱️ Mouse up - ending drag');

    // Remove event listeners first
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Only proceed if we were actually dragging
    if (isDragging.value) {
        console.log('🔄 Drag ended for element:', props.element.type, props.element.id);

        // Mantener el z-index alto después del arrastre y preservar la posición actual
        const updatedElement = {
            ...props.element,
            position: props.element.position, // Preserve the current position
            zIndex: Math.max(props.element.zIndex || 1, 100)
        };

        // Update the element
        emit('update:element', updatedElement);
        console.log('📍 Final position preserved:', updatedElement.position);

        // Remove dragging class
        if (elementRef.value) {
            elementRef.value.classList.remove('is-dragging');
        }
    }

    // Set dragging state to false at the end
    isDragging.value = false;
    console.log('✅ Drag state reset');
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

function handleDeleteElement() {
    console.log('🗑️ Delete element:', props.element.type, props.element.id);

    // Emitir evento para eliminar el elemento
    emit('delete-element', props.element);
}

function handleDuplicateElement() {
    console.log('📋 Duplicate element:', props.element.type, props.element.id);

    // Emitir evento para duplicar el elemento
    emit('duplicate-element', props.element);
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
                label: processedProps.label || 'Botón',
                onPressed: () => console.log('Botón presionado')
            };

        case 'DropdownButton':
            return {
                ...processedProps,
                label: processedProps.label || 'Seleccionar opción',
                items: processedProps.items || ['Opción 1', 'Opción 2', 'Opción 3'],
                value: processedProps.value || null
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

        case 'Image':
            return {
                ...processedProps,
                src: processedProps.src || '/images/placeholder.png',
                alt: processedProps.alt || 'Imagen'
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

    // Agregar event listeners globales para el canvas
    setupCanvasEventListeners();
});

onUnmounted(() => {
    console.log('🔄 UnifiedWidgetRenderer unmounted for element:', props.element.id);

    // Limpiar event listeners
    cleanupCanvasEventListeners();
});

// Funciones para manejar eventos del canvas (como en el ejemplo)
function setupCanvasEventListeners() {
    const canvas = document.querySelector('.unified-canvas') ||
                   document.querySelector('.canvas-container') ||
                   document.querySelector('.phone-content-area');

    if (!canvas) return;

    // Click en canvas para deseleccionar widgets (como en el ejemplo)
    canvas.addEventListener('click', handleCanvasClick as EventListener);

    // Event listener para crear widgets desde el panel lateral
    document.addEventListener('create-widget', handleCreateWidget as EventListener);
}

function cleanupCanvasEventListeners() {
    const canvas = document.querySelector('.unified-canvas') ||
                   document.querySelector('.canvas-container') ||
                   document.querySelector('.phone-content-area');

    if (!canvas) return;

    canvas.removeEventListener('click', handleCanvasClick as EventListener);
    document.removeEventListener('create-widget', handleCreateWidget as EventListener);
}

function handleCanvasClick(event: Event) {
    const mouseEvent = event as MouseEvent;
    // Solo deseleccionar si se hace clic directamente en el canvas
    if (mouseEvent.target === mouseEvent.currentTarget) {
        console.log('🎯 Canvas clicked - deselecting all widgets');

        // Emitir evento para deseleccionar todos los elementos
        emit('deselect-all');

        // Ocultar panel de propiedades
        hidePropertyPanel();
    }
}

function handleCreateWidget(event: Event) {
    const customEvent = event as CustomEvent;
    const { widgetType, x, y } = customEvent.detail;
    console.log('🆕 Creating widget:', widgetType, 'at position:', { x, y });

    // Emitir evento para crear nuevo widget
    emit('create-widget', {
        type: widgetType,
        position: { x, y },
        framework: 'flutter' // Por defecto Flutter
    });
}

// Funciones para manejar el panel de propiedades (como en el ejemplo)
function updateWidgetProperty(property: string, value: any) {
    console.log('🔧 Updating widget property:', property, value);

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

function showPropertyPanel() {
    const propertyPanel = document.querySelector('.property-panel');
    if (propertyPanel) {
        propertyPanel.classList.remove('hidden');

        // Actualizar contenido del panel con las propiedades del elemento
        updatePropertyPanelContent();
    }
}

function hidePropertyPanel() {
    const propertyPanel = document.querySelector('.property-panel');
    if (propertyPanel) {
        propertyPanel.classList.add('hidden');
        propertyPanel.innerHTML = '<p class="text-gray-500">Selecciona un widget para editar sus propiedades</p>';
    }
}

function updatePropertyPanelContent() {
    const propertyPanel = document.querySelector('.property-panel');
    if (!propertyPanel || !props.element) return;

    // Crear contenido del panel de propiedades basado en el tipo de widget
    const content = generatePropertyPanelContent();
    propertyPanel.innerHTML = content;

    // Agregar event listeners a los inputs del panel
    setupPropertyPanelListeners();
}

function generatePropertyPanelContent(): string {
    const element = props.element;

    let content = `
        <div class="p-4">
            <h3 class="text-lg font-semibold mb-4">Propiedades de ${element.type}</h3>
            <div class="space-y-4">
    `;

    // Propiedades comunes
    content += `
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Texto</label>
            <input type="text"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   value="${element.props?.text || ''}"
                   data-property="text">
        </div>
    `;

    // Propiedades específicas según el tipo
    if (element.type === 'ElevatedButton' || element.type === 'Button') {
        content += `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Color de fondo</label>
                <input type="color"
                       class="w-full h-10 border border-gray-300 rounded-md"
                       value="${element.props?.backgroundColor || '#3b82f6'}"
                       data-property="backgroundColor">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Color de texto</label>
                <input type="color"
                       class="w-full h-10 border border-gray-300 rounded-md"
                       value="${element.props?.textColor || '#ffffff'}"
                       data-property="textColor">
            </div>
        `;
    }

    if (element.type === 'Card') {
        content += `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Elevación</label>
                <input type="range"
                       min="0" max="24"
                       class="w-full"
                       value="${element.props?.elevation || 1}"
                       data-property="elevation">
            </div>
        `;
    }

    // Propiedades de tamaño
    content += `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ancho</label>
                <input type="number"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       value="${element.size?.width || 100}"
                       data-property="width">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Alto</label>
                <input type="number"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       value="${element.size?.height || 50}"
                       data-property="height">
            </div>
        </div>
    `;

    content += `
            </div>
        </div>
    `;

    return content;
}

function setupPropertyPanelListeners() {
    const propertyPanel = document.querySelector('.property-panel');
    if (!propertyPanel) return;

    // Event listeners para inputs de texto
    propertyPanel.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.addEventListener('input', (event) => {
            const target = event.target as HTMLInputElement;
            const property = target.dataset.property;
            const value = target.value;

            if (property) {
                updateWidgetProperty(property, value);
            }
        });
    });

    // Event listeners para inputs de color
    propertyPanel.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const property = target.dataset.property;
            const value = target.value;

            if (property) {
                updateWidgetProperty(property, value);
            }
        });
    });

    // Event listeners para inputs de rango
    propertyPanel.querySelectorAll('input[type="range"]').forEach(input => {
        input.addEventListener('input', (event) => {
            const target = event.target as HTMLInputElement;
            const property = target.dataset.property;
            const value = parseInt(target.value);

            if (property) {
                updateWidgetProperty(property, value);
            }
        });
    });
}
</script>

<template>
    <div ref="elementRef" :style="elementStyle" class="unified-widget-element" :class="{
        'is-selected': isSelected,
        'is-dragging': isDragging,
        'is-resizing': isResizing,
        'selected-widget': isSelected,
        [`framework-${element.framework}`]: true,
        [`widget-${element.type}`]: true,
        'mobile-widget': true,
    }"
    @click="handleElementClick"
    @dblclick="handleElementDoubleClick"
    @mousedown="handleMouseDown"
    :data-element-id="element.id"
    :data-element-type="element.type">

        <!-- Widget Header (estilo PizarraFlutter) - Always visible when selected -->
        <div v-if="isSelected" class="widget-header">
            <span class="widget-type">{{ getElementDisplayName(element.type) }}</span>
            <button class="widget-remove-btn" @click.stop="handleDeleteElement" title="Eliminar">
                ×
            </button>
        </div>

        <!-- Widget content -->
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

        <!-- Resize handle (como en el ejemplo) -->
        <div v-if="isSelected && isEditable" class="resize-handle" @mousedown="handleResizeStart($event, 'bottom-right')"></div>
    </div>
</template>

<style scoped>
/* Estilos base del elemento unificado */
.unified-widget-element {
    position: absolute;
    transition: all 0.3s ease;
    user-select: none;
    cursor: grab;
    isolation: isolate;
    overflow: visible;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.05);
    pointer-events: auto;
    z-index: 1;
    /* Asegurar que el elemento sea interactivo */
    touch-action: none;
}

.unified-widget-element:active {
    cursor: grabbing;
}

/* Estilos de PizarraFlutter para selección visual */
.mobile-widget {
    margin-bottom: 10px;
    border-radius: 8px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: visible;
    transition: all 0.3s ease;
    position: relative;
    width: 100%;
    /* Asegurar que sea clickeable */
    pointer-events: auto;
}

:root.dark .mobile-widget {
    background-color: #1f2937;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.selected-widget {
    box-shadow: 0 0 0 2px #23ac4a, 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: scale(1.01);
    /* Asegurar que el elemento seleccionado esté por encima */
    z-index: 1000 !important;
}

:root.dark .selected-widget {
    box-shadow: 0 0 0 2px #23ac4a, 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Widget header (estilo PizarraFlutter) */
.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #f8f8f8;
    border-bottom: 1px solid #e0e0e0;
    transition: background-color 0.2s, border-color 0.2s;
    /* Asegurar que el header sea clickeable */
    pointer-events: auto;
}

:root.dark .widget-header {
    background-color: #111827;
    border-bottom: 1px solid #374151;
}

.widget-type {
    font-weight: 600;
    font-size: 14px;
    color: #333;
    transition: color 0.2s;
}

:root.dark .widget-type {
    color: #e5e7eb;
}

.widget-remove-btn {
    width: 24px;
    height: 24px;
    border-radius: 12px;
    background-color: #ff3b30;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    line-height: 1;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    /* Asegurar que el botón sea clickeable */
    pointer-events: auto;
}

:root.dark .widget-remove-btn {
    background-color: #ef4444;
}

.widget-remove-btn:hover {
    background-color: #dc2626;
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
