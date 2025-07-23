<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { UnifiedElement, UnifiedScreen } from '@/Data/PizarraUnificada';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';
import { unifiedDragDropService } from '@/services/UnifiedDragDropService';
import UnifiedWidgetRenderer from './UnifiedWidgetRenderer.vue';

const props = defineProps<{
    currentScreen: UnifiedScreen;
    availableWidgets: any[];
    selectedFramework: 'flutter' | 'angular' | 'both';
}>();

const emit = defineEmits([
    'select-element',
    'remove-element',
    'add-element',
    'update-element',
    'drag-enter',
    'drag-leave',
    'drop',
    'open-properties-panel',
    'unified-element-updated',
    'property-change'
]);

// Agregar selector de diseño: 'unified', 'web', 'mobile'
const selectedDesign = ref<'unified' | 'web' | 'mobile'>(
    props.selectedFramework === 'angular' ? 'web' :
    props.selectedFramework === 'flutter' ? 'mobile' :
    'unified'
);

// Tiempo actual para el diseño móvil
const currentTime = ref(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

// Actualizar el tiempo cada minuto
let timeInterval: number | null = null;

// Track the element being dragged over
// const dragOverElementId = ref<string | null>(null);

// Track selected element
const selectedElementId = ref<string | null>(null);

// Computed property for elements to ensure reactivity
const currentElements = computed(() => {
    console.log('🔄 Computing currentElements:', props.currentScreen.elements?.length || 0);
    return props.currentScreen.elements || [];
});

// Cambiar entre diseños (unified, web, mobile)
function changeDesign(design: 'unified' | 'web' | 'mobile') {
    selectedDesign.value = design;
}

// Handle element selection
function selectElement(element: UnifiedElement) {
    console.log('🔄 Selecting element with ID:', element.id, 'via double click');
    selectedElementId.value = element.id ?? null;
    emit('select-element', element);

    // Removido: setTimeout innecesario que causaba actualizaciones constantes
}

// Handle element deselection
function deselectElement() {
    console.log('🔄 Deselecting element:', selectedElementId.value);
    selectedElementId.value = null;
    emit('select-element', null);
}

// Handle click outside canvas
function handleClickOutside(event: MouseEvent) {
    const canvasElement = event.currentTarget as HTMLElement;
    const clickedElement = event.target as HTMLElement;

    // Verificar si algún elemento está siendo arrastrado
    const isAnyElementDragging = document.querySelector('.unified-widget-element.is-dragging');
    if (isAnyElementDragging) {
        console.log('🚫 Click outside ignored - element is being dragged');
        return;
    }

    // Si el click fue fuera del canvas o en el canvas pero no en un elemento
    if (!canvasElement.contains(clickedElement) ||
        clickedElement.classList.contains('canvas-content') ||
        clickedElement.classList.contains('unified-canvas')) {

        // Solo deseleccionar si hay un elemento seleccionado
        if (selectedElementId.value) {
            console.log('🖱️ Click outside detected, deselecting element');
            deselectElement();
        }
    }
}

// Handle keyboard events
function handleKeyDown(event: KeyboardEvent) {
    // Deseleccionar con Escape
    if (event.key === 'Escape' && selectedElementId.value) {
        console.log('⌨️ Escape key pressed, deselecting element');
        deselectElement();
        event.preventDefault();
    }
}

// Handle canvas click for deselection
function handleCanvasClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;

    // Verificar si algún elemento está siendo arrastrado
    const isAnyElementDragging = document.querySelector('.unified-widget-element.is-dragging');
    if (isAnyElementDragging) {
        console.log('🚫 Canvas click ignored - element is being dragged');
        return;
    }

    // Si el click fue directamente en el canvas (no en un elemento)
    if (clickedElement.classList.contains('canvas-content') ||
        clickedElement.classList.contains('unified-canvas') ||
        clickedElement.classList.contains('unified-frame')) {

        if (selectedElementId.value) {
            console.log('🎯 Canvas click detected, deselecting element');
            deselectElement();
        }
    }
}

// Handle element update
function updateElement(element: UnifiedElement) {
    emit('update-element', element);
}

// Handle element deletion
function deleteElement(element: UnifiedElement) {
    console.log('🗑️ UnifiedCanvas deleteElement called for:', element.id);
    console.log('🗑️ Element to delete:', { id: element.id, type: element.type, framework: element.framework });

    // Validate the element object
    if (!element || !element.id) {
        console.error('❌ Invalid element object received in deleteElement:', element);
        return;
    }

    // Clear selection if this element is selected
    if (selectedElementId.value === element.id) {
        selectedElementId.value = null;
        console.log('🔄 Cleared selection for deleted element');
    }

    try {
        // Emit remove-element event to parent with the full element object
        console.log('📤 Emitting remove-element event with element:', element);
        emit('remove-element', element);
        console.log('📤 remove-element event emitted from UnifiedCanvas');

        // Removido: setTimeout innecesario
    } catch (error) {
        console.error('❌ Error in deleteElement function:', error);
    }
}

// Handle element duplication
function duplicateElement(element: UnifiedElement) {
    const duplicatedElement = UnifiedWidgetService.duplicateElement(element);
    if (duplicatedElement) {
        // Offset the duplicated element slightly
        if (duplicatedElement.position) {
            duplicatedElement.position.x += 20;
            duplicatedElement.position.y += 20;
        }
        emit('add-element', duplicatedElement);
    }
}

function handleDrop(event: DragEvent, targetElementId: string | null = null) {
    console.log('🎯 handleDrop:', targetElementId, event);
    const dropResult = unifiedDragDropService.handleDrop(event);

    if (!dropResult) {
        console.warn('⚠️ No drop result from service');
        return;
    }

    console.log('🎯 UnifiedCanvas handleDrop result:', dropResult);

    // Create a new element using the service with canvas width
    try {
        const targetFramework = props.selectedFramework === 'both' ? 'flutter' : props.selectedFramework;
        console.log('🎯 Target framework for drop:', targetFramework);

        const newElement = UnifiedWidgetService.createElement(
            dropResult.widgetType,
            targetFramework,
            dropResult.position,
            dropResult.canvasWidth
        );

        console.log('✨ Element created from drop:', newElement);
        emit('add-element', newElement, dropResult.targetElementId);
        console.log('📤 add-element event emitted');
    } catch (error) {
        console.error('❌ Error creating element from drop:', error);
    }
}

// Handle widget events from rendered components
function handleWidgetEvent(eventData: any) {
    console.log('Widget event:', eventData);

    if (eventData.type === 'delete' && eventData.elementId) {
        const element = props.currentScreen.elements.find(el => el.id === eventData.elementId);
        if (element) {
            console.log('🗑️ Deleting element via widget event:', element.id);
            deleteElement(element);
        }
    } else if (eventData.type === 'duplicate' && eventData.elementId) {
        const element = props.currentScreen.elements.find(el => el.id === eventData.elementId);
        if (element) {
            console.log('📋 Duplicating element via widget event:', element.id);
            duplicateElement(element);
        }
    } else if (eventData.type === 'open-properties') {
        // Manejar apertura del panel de propiedades
        console.log('⚙️ Opening properties panel for element:', eventData.elementId);

        // Emitir evento para seleccionar el elemento y abrir propiedades
        emit('select-element', eventData.element);

        // Emitir evento adicional para abrir el panel de propiedades
        // Este es el evento clave que estaba faltando para propagarse correctamente
        emit('open-properties-panel', eventData.element);

        console.log('📤 open-properties-panel event emitted for element:', eventData.elementId);
    } else if (eventData.type === 'remote-selection') {
        // Manejar evento de selección remota
        console.log('🔄 Remote selection event for element:', eventData.elementId);

        // Propagar el evento de selección para que sea visible para otros usuarios
        // Esto debería estar conectado al servicio de colaboración
        emit('select-element', eventData.element);
    } else if (eventData.type === 'remote-update') {
        // Manejar evento de actualización de propiedades en tiempo real
        console.log('🔄 Remote property update for element:', eventData.elementId);

        // Propagar la actualización del elemento para que sea visible para otros usuarios
        emit('update-element', eventData.element);

        // Emitir un evento específico para notificar al servicio de colaboración
        // que se ha actualizado un elemento y debe sincronizarse con otros usuarios
        emit('unified-element-updated', {
            element: eventData.element,
            property: eventData.property,
            value: eventData.value
        });
    }
}

// Set up event listeners on mount
onMounted(() => {
    console.log('🔄 Setting up keyboard event listeners');
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('click', handleCanvasClick);

    // Actualizar el tiempo cada minuto para el diseño móvil
    timeInterval = window.setInterval(() => {
        currentTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 60000);
});

// Clean up event listeners on unmounting
onUnmounted(() => {
    console.log('🔄 Removing keyboard event listeners');
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('click', handleCanvasClick);

    // Limpiar el intervalo de tiempo
    if (timeInterval !== null) {
        window.clearInterval(timeInterval);
    }
});
</script>
<template>
    <div class="unified-canvas" @click="handleCanvasClick">
        <!-- Botones para cambiar entre diseños -->
        <div class="design-selector">
            <button
                @click="changeDesign('unified')"
                :class="{'active': selectedDesign === 'unified'}"
                title="Diseño unificado">
                <span class="material-icons">dashboard</span>
                <span class="button-text">Unificado</span>
            </button>
            <button
                @click="changeDesign('web')"
                :class="{'active': selectedDesign === 'web'}"
                title="Diseño web (Angular)">
                <span class="material-icons">web</span>
                <span class="button-text">Web</span>
            </button>
            <button
                @click="changeDesign('mobile')"
                :class="{'active': selectedDesign === 'mobile'}"
                title="Diseño móvil (Flutter)">
                <span class="material-icons">smartphone</span>
                <span class="button-text">Móvil</span>
            </button>
        </div>

        <div class="canvas-content">
            <!-- Diseño unificado (default) -->
            <div v-if="selectedDesign === 'unified'"
                class="unified-frame"
                :style="{
                    width: `${props.currentScreen.size?.width || 375}px`,
                    height: `${props.currentScreen.size?.height || 812}px`,
                    backgroundColor: props.currentScreen.backgroundColor || '#ffffff'
                }">
                <UnifiedWidgetRenderer
                    v-for="element in currentElements"
                    :key="element.id"
                    :element="element"
                    :is-selected="selectedElementId === element.id"
                    :is-editable="true"
                    @select="selectElement"
                    @update:element="updateElement"
                    @delete-element="deleteElement"
                    @duplicate-element="duplicateElement"
                    @widget-event="handleWidgetEvent"
                    @property-change="(property, value) => emit('property-change', element, property, value)"
                />
            </div>

            <!-- Diseño web (Angular) -->
            <div v-if="selectedDesign === 'web'" class="web-frame">
                <div class="browser-window">
                    <div class="browser-header">
                        <div class="browser-controls">
                            <div class="control-dot close"></div>
                            <div class="control-dot minimize"></div>
                            <div class="control-dot maximize"></div>
                        </div>
                        <div class="browser-url">
                            <span class="material-icons">lock</span>
                            <span>myapp.com/{{ props.currentScreen.name || 'home' }}</span>
                        </div>
                        <div class="browser-actions">
                            <span class="material-icons">refresh</span>
                            <span class="material-icons">bookmark</span>
                            <span class="material-icons">more_vert</span>
                        </div>
                    </div>
                    <div class="browser-content">
                        <UnifiedWidgetRenderer
                            v-for="element in currentElements"
                            :key="element.id"
                            :element="element"
                            :is-selected="selectedElementId === element.id"
                            :is-editable="true"
                            @select="selectElement"
                            @update:element="updateElement"
                            @delete-element="deleteElement"
                            @duplicate-element="duplicateElement"
                            @widget-event="handleWidgetEvent"
                            @property-change="(property, value) => emit('property-change', element, property, value)"
                        />
                    </div>
                </div>
            </div>

            <!-- Diseño móvil (Flutter) -->
            <div v-if="selectedDesign === 'mobile'" class="mobile-frame">
                <div class="mobile-phone-device">
                    <div class="phone-notch"></div>
                    <div class="mobile-screen-container">
                        <div class="phone-status-bar">
                            <div class="status-bar-content">
                                <div class="status-left">
                                    <div class="time">{{ currentTime }}</div>
                                </div>
                                <div class="status-right">
                                    <svg class="status-icon" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                    <svg class="status-icon" viewBox="0 0 24 24">
                                        <path d="M17 5.33C17 4.6 16.4 4 15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33V13h10V5.33z"/>
                                        <path d="M7 13v7.67C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V13H7z"/>
                                    </svg>
                                    <span class="battery-percentage">89%</span>
                                </div>
                            </div>
                        </div>
                        <div class="phone-content-area">
                            <UnifiedWidgetRenderer
                                v-for="element in currentElements"
                                :key="element.id"
                                :element="element"
                                :is-selected="selectedElementId === element.id"
                                :is-editable="true"
                                @select="selectElement"
                                @update:element="updateElement"
                                @delete-element="deleteElement"
                                @duplicate-element="duplicateElement"
                                @widget-event="handleWidgetEvent"
                                @property-change="(property, value) => emit('property-change', element, property, value)"
                            />
                        </div>
                        <div class="phone-nav-bar">
                            <div class="home-indicator"></div>
                        </div>
                    </div>
                    <div class="phone-buttons">
                        <div class="power-button"></div>
                        <div class="volume-buttons">
                            <div class="volume-up"></div>
                            <div class="volume-down"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Modern Canvas Design - Maximized for Whiteboard */
.unified-canvas {
    width: 100%;
    height: 100%;
    min-height: 80vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .unified-canvas {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-color: rgba(255, 255, 255, 0.1);
}

/* Compact Header */

.dark .canvas-header {
    background: rgba(15, 23, 42, 0.8);
    border-bottom-color: rgba(255, 255, 255, 0.1);
}


.dark .screen-name {
    color: #f9fafb;
}

.control-btn:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dark .control-btn {
    background: rgba(30, 41, 59, 0.8);
    color: #f9fafb;
}

.dark .control-btn:hover {
    background: rgba(30, 41, 59, 1);
}

/* Canvas Container with Grid */
.canvas-container {
    flex: 1;
    position: relative;
    overflow: auto;
}

.canvas-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
        linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
}

.dark .canvas-grid {
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}

.canvas-content {
    position: relative;
    z-index: 1;
    min-height: 100%;
    padding: 20px;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

/* Angular Web Frame */
.web-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 700px;
}

.browser-window {
    width: 800px;
    height: 600px;
    background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
    border-radius: 8px;
    box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.1),
        0 10px 20px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin: 20px auto;
}

.browser-header {
    height: 40px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    padding: 0 10px;
}

.browser-controls {
    display: flex;
    gap: 6px;
    margin-right: 10px;
}

.control-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.control-dot.close {
    background-color: #ff5f57;
}

.control-dot.minimize {
    background-color: #ffbd2e;
}

.control-dot.maximize {
    background-color: #28c940;
}

.browser-url {
    flex: 1;
    background-color: #e0e0e0;
    border-radius: 4px;
    height: 24px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-size: 12px;
    color: #333;
}

.browser-url .material-icons {
    font-size: 14px;
    margin-right: 4px;
}

.browser-actions {
    display: flex;
    gap: 8px;
    margin-left: 10px;
}

.browser-actions .material-icons {
    font-size: 16px;
    color: #666;
}

.browser-content {
    flex: 1;
    background-color: #ffffff;
    overflow: auto;
    position: relative;
    min-height: 500px;
    padding: 20px;
}

/* Flutter Mobile Frame */
.mobile-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 700px;
}

.mobile-phone-device {
    width: 320px;
    height: 550px;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-radius: 36px;
    box-shadow:
        0 0 0 10px #111,
        0 0 0 11px #222,
        0 20px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    margin: 10px auto;
    display: flex;
    flex-direction: column;
}

.dark .mobile-phone-device {
    background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
    box-shadow:
        0 0 0 10px #000,
        0 0 0 11px #333,
        0 20px 30px rgba(0, 0, 0, 0.5);
}

.phone-notch {
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 5px;
    background: #333;
    border-radius: 3px;
    z-index: 10;
}

.mobile-screen-container {
    width: 100%;
    height: 100%;
    background: #fff;
    border-radius: 32px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
}

.dark .mobile-screen-container {
    background: #1f2937;
}

/* Enhanced Phone Status Bar - Exactly like your implementation */
.phone-status-bar {
    height: 30px;
    background-color: #f8f8f8;
    border-bottom: 1px solid #e0e0e0;
    color: #333;
    font-weight: 500;
    transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.dark .phone-status-bar {
    background-color: #1f2937;
    border-bottom: 1px solid #374151;
    color: #e5e7eb;
}

.status-bar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 100%;
}

.status-left .time {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
}

.status-right {
    display: flex;
    align-items: center;
    gap: 4px;
}

.status-icon {
    width: 12px;
    height: 12px;
    fill: currentColor;
}

.battery-percentage {
    font-size: 10px;
    margin-left: 2px;
}

/* Enhanced Phone Content Area - Like your implementation */
.phone-content-area {
    flex: 1;
    overflow-y: auto;
    background-color: #f5f5f7;
    position: relative;
    transition: background-color 0.2s;
}

.dark .phone-content-area {
    background-color: #111827;
}

/* Enhanced Phone Navigation Bar */
.phone-nav-bar {
    height: 34px;
    background-color: #f8f8f8;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.dark .phone-nav-bar {
    background-color: #1f2937;
    border-top: 1px solid #374151;
}

.home-indicator {
    width: 134px;
    height: 5px;
    background-color: #000;
    border-radius: 3px;
    opacity: 0.3;
}

.dark .home-indicator {
    background-color: #fff;
    opacity: 0.6;
}

/* Phone Side Buttons */
.phone-buttons {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}

.power-button {
    position: absolute;
    right: -3px;
    top: 120px;
    width: 6px;
    height: 80px;
    background: linear-gradient(135deg, #333, #555);
    border-radius: 3px 0 0 3px;
}

.volume-buttons {
    position: absolute;
    left: -3px;
    top: 100px;
}

.volume-up,
.volume-down {
    width: 6px;
    height: 40px;
    background: linear-gradient(135deg, #333, #555);
    border-radius: 0 3px 3px 0;
    margin-bottom: 8px;
}

/* Enhanced Empty State for Mobile */
.mobile-empty {
    max-width: 240px;
    padding: 20px 15px;
}

.empty-suggestions {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.suggestion-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(33, 150, 243, 0.1);
    border-radius: 12px;
    font-size: 12px;
    color: #2196F3;
    transition: all 0.2s ease;
}

.suggestion-item:hover {
    background: rgba(33, 150, 243, 0.2);
    transform: translateX(4px);
}

.suggestion-item .material-icons {
    font-size: 16px;
}

/* Mobile Device Hover Effects */
.mobile-phone-device:hover {
    animation: mobileGlow 3s ease-in-out infinite;
    transform: scale(1.02);
}

/* Realistic Lighting Effects */
.mobile-phone-device::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), transparent, rgba(255, 255, 255, 0.05));
    border-radius: 42px;
    z-index: -1;
}

/* Screen Reflection Effect */
.mobile-screen-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
    border-radius: 32px;
}

/* Responsive Mobile Frame */
@media (max-width: 768px) {
    .mobile-phone-device {
        width: 300px;
        height: 533px;
        margin: 10px auto;
    }

    .phone-notch {
        width: 120px;
        top: 15px;
    }

    .mobile-empty {
        max-width: 240px;
        padding: 20px 15px;
    }

    .empty-title {
        font-size: 18px;
    }

    .empty-description {
        font-size: 13px;
    }
}

@media (max-width: 480px) {
    .mobile-phone-device {
        width: 280px;
        height: 497px;
    }

    .mobile-empty {
        max-width: 220px;
        padding: 15px 10px;
    }
}

/* Deselection Button Styles */
.deselect-button {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f44336; /* Red color for deselection */
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 100; /* Ensure it's above other elements */
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
}

.deselect-button:hover {
    background-color: #d32f2f; /* Darker red on hover */
    opacity: 1;
}

.dark .deselect-button {
    background-color: #9a0007; /* Darker red for dark mode */
}

.dark .deselect-button:hover {
    background-color: #780000; /* Even darker red for dark mode */
}

.deselect-text {
    display: none; /* Hide text by default, show on hover */
}

.deselect-button:hover .deselect-text {
    display: inline;
}

/* Deselection Hint Styles */
.deselection-hint {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    z-index: 99; /* Ensure it's above other elements */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(5px);
}

.hint-visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.deselection-hint .material-icons {
    font-size: 20px;
}

.design-selector {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 10px;
    z-index: 101;
}

.design-selector button {
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 4px;
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
}

.design-selector button:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
}

.design-selector button.active {
    background: rgba(33, 150, 243, 0.2);
    backdrop-filter: blur(5px);
}

.design-selector .material-icons {
    font-size: 18px;
    color: #2196F3;
}

.button-text {
    font-size: 14px;
    color: #333;
}

.dark .design-selector button {
    background: rgba(255, 255, 255, 0.1);
}

.dark .design-selector button:hover {
    background: rgba(255, 255, 255, 0.2);
}

.dark .design-selector button.active {
    background: rgba(255, 255, 255, 0.3);
}
</style>
