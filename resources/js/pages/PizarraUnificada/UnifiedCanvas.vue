<template>
    <div
        class="unified-canvas"
        @dragover.prevent
        @drop="handleDrop($event)"
    >
        <!-- Enhanced header with better visual design -->
        <div class="canvas-header">
            <div class="screen-info">
                <div class="screen-title-group">
                    <span class="material-icons screen-icon">{{ getFrameworkHeaderIcon(selectedFramework) }}</span>
                    <h3 class="screen-name">{{ currentScreen.name }}</h3>
                </div>
                <div class="framework-badges">
                    <span class="framework-badge" :class="`framework-${selectedFramework}`">
                        <span class="framework-icon">{{ getFrameworkIcon(selectedFramework) }}</span>
                        {{ selectedFramework.toUpperCase() }}
                    </span>
                </div>
            </div>
            <div class="canvas-controls">
                <button class="control-btn" title="Zoom In">
                    <span class="material-icons">zoom_in</span>
                </button>
                <button class="control-btn" title="Zoom Out">
                    <span class="material-icons">zoom_out</span>
                </button>
                <button class="control-btn" title="Fit to Screen">
                    <span class="material-icons">fit_screen</span>
                </button>
                <button class="control-btn" title="Toggle Device Frame" v-if="selectedFramework === 'flutter'">
                    <span class="material-icons">phone_iphone</span>
                </button>
            </div>
        </div>

        <!-- Enhanced canvas with framework-specific design -->
        <div class="canvas-container" :class="`canvas-${selectedFramework}`">
            <div class="canvas-grid" :class="`grid-${selectedFramework}`"></div>

            <!-- Flutter Mobile Frame -->
            <div v-if="selectedFramework === 'flutter'" class="mobile-frame">
                <div class="mobile-phone-device">
                    <!-- Home indicator top (notch area) -->
                    <div class="phone-notch"></div>

                    <div class="mobile-screen-container">
                        <!-- Enhanced Phone Status Bar based on your implementation -->
                        <div class="phone-status-bar">
                            <div class="status-bar-content">
                                <div class="status-left">
                                    <span class="time">9:41</span>
                                </div>
                                <div class="status-right">
                                    <!-- Signal strength bars -->
                                    <svg class="status-icon signal-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                                    </svg>
                                    <!-- WiFi icon -->
                                    <svg class="status-icon wifi-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                                    </svg>
                                    <!-- Battery icon -->
                                    <svg class="status-icon battery-icon" viewBox="0 0 24 20" fill="currentColor">
                                        <path d="M3 7a2 2 0 012-2h11a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                                        <path d="M21 9v2a1 1 0 01-1 1h-1V8h1a1 1 0 011 1z"/>
                                        <rect x="4" y="8" width="10" height="4" rx="1" fill="white"/>
                                    </svg>
                                    <span class="battery-percentage">100%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Phone content area -->
                        <div class="phone-content-area">
                            <div class="canvas-content framework-flutter">
                                <!-- Flutter widgets content -->
                                <template v-if="currentScreen.elements && currentScreen.elements.length > 0">
                                    <UnifiedWidgetRenderer
                                        v-for="element in currentScreen.elements"
                                        :key="element.id"
                                        :element="element"
                                        :is-editable="true"
                                        :is-selected="selectedElementId === element.id"
                                        @update:element="updateElement"
                                        @delete-element="deleteElement"
                                        @duplicate-element="duplicateElement"
                                        @select="selectElement"
                                        @widget-event="handleWidgetEvent"
                                        class="canvas-element"
                                    />
                                </template>
                                <!-- Enhanced Flutter empty state -->
                                <div v-else class="empty-canvas flutter-empty">
                                    <div class="empty-content mobile-empty">
                                        <div class="empty-icon-container">
                                            <span class="material-icons empty-icon">phone_iphone</span>
                                            <div class="empty-icon-glow flutter-glow"></div>
                                        </div>
                                        <h3 class="empty-title">App Flutter</h3>
                                        <p class="empty-description">
                                            Arrastra widgets para crear tu aplicación móvil
                                        </p>
                                        <div class="empty-framework-info">
                                            <span class="framework-label">
                                                Framework:
                                                <span class="framework-highlight flutter-highlight">Flutter</span>
                                            </span>
                                        </div>
                                        <div class="empty-suggestions">
                                            <div class="suggestion-item">
                                                <span class="material-icons">app_shortcut</span>
                                                <span>Comienza con un Scaffold</span>
                                            </div>
                                            <div class="suggestion-item">
                                                <span class="material-icons">text_fields</span>
                                                <span>Agrega widgets de texto</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Phone navigation bar (home indicator) -->
                        <div class="phone-nav-bar">
                            <div class="home-indicator"></div>
                        </div>
                    </div>

                    <!-- Phone side buttons -->
                    <div class="phone-buttons">
                        <div class="power-button"></div>
                        <div class="volume-buttons">
                            <div class="volume-up"></div>
                            <div class="volume-down"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Angular Web Frame -->
            <div v-else-if="selectedFramework === 'angular'" class="web-frame">
                <div class="browser-window">
                    <div class="browser-header">
                        <div class="browser-controls">
                            <span class="control-dot close"></span>
                            <span class="control-dot minimize"></span>
                            <span class="control-dot maximize"></span>
                        </div>
                        <div class="browser-url">
                            <span class="material-icons">lock</span>
                            <span class="url-text">localhost:4200</span>
                        </div>
                        <div class="browser-actions">
                            <span class="material-icons">refresh</span>
                            <span class="material-icons">more_vert</span>
                        </div>
                    </div>
                    <div class="browser-content">
                        <div class="canvas-content framework-angular">
                            <!-- Angular widgets content -->
                            <template v-if="currentScreen.elements && currentScreen.elements.length > 0">
                                <UnifiedWidgetRenderer
                                    v-for="element in currentScreen.elements"
                                    :key="element.id"
                                    :element="element"
                                    :is-editable="true"
                                    :is-selected="selectedElementId === element.id"
                                    @update:element="updateElement"
                                    @delete-element="deleteElement"
                                    @duplicate-element="duplicateElement"
                                    @select="selectElement"
                                    @widget-event="handleWidgetEvent"
                                    class="canvas-element"
                                />
                            </template>
                            <!-- Angular empty state -->
                            <div v-else class="empty-canvas angular-empty">
                                <div class="empty-content">
                                    <div class="empty-icon-container">
                                        <span class="material-icons empty-icon">web</span>
                                        <div class="empty-icon-glow angular-glow"></div>
                                    </div>
                                    <h3 class="empty-title">App Angular</h3>
                                    <p class="empty-description">
                                        Arrastra componentes para crear tu aplicación web
                                    </p>
                                    <div class="empty-framework-info">
                                        <span class="framework-label">
                                            Framework:
                                            <span class="framework-highlight angular-highlight">Angular</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Both frameworks view -->
            <div v-else class="unified-frame">
                <div class="canvas-content framework-both">
                    <template v-if="currentScreen.elements && currentScreen.elements.length > 0">
                        <UnifiedWidgetRenderer
                            v-for="element in currentScreen.elements"
                            :key="element.id"
                            :element="element"
                            @update:element="updateElement"
                            @widget-event="handleWidgetEvent"
                            @click.stop="selectElement(element)"
                            class="canvas-element"
                        />
                    </template>
                    <!-- Both frameworks empty state -->
                    <div v-else class="empty-canvas both-empty">
                        <div class="empty-content">
                            <div class="empty-icon-container">
                                <span class="material-icons empty-icon">dashboard</span>
                                <div class="empty-icon-glow both-glow"></div>
                            </div>
                            <h3 class="empty-title">Canvas Universal</h3>
                            <p class="empty-description">
                                Arrastra widgets para crear tu interfaz
                            </p>
                            <div class="empty-framework-info">
                                <span class="framework-label">
                                    Framework:
                                    <span class="framework-highlight both-highlight">Universal</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UnifiedElement, UnifiedScreen } from '@/Data/PizarraUnificada';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';
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
    'drop'
]);

// Track the element being dragged over
const dragOverElementId = ref<string | null>(null);

// Track selected element
const selectedElementId = ref<string | null>(null);

// Get framework icon
function getFrameworkIcon(framework: string): string {
    switch (framework) {
        case 'flutter':
            return '🎯';
        case 'angular':
            return '🅰️';
        case 'both':
            return '🔀';
        default:
            return '📦';
    }
}

// Get framework header icon
function getFrameworkHeaderIcon(framework: string): string {
    switch (framework) {
        case 'flutter':
            return 'phone_iphone';
        case 'angular':
            return 'web';
        case 'both':
            return 'dashboard';
        default:
            return 'dashboard';
    }
}

// Handle element selection
function selectElement(element: UnifiedElement) {
    selectedElementId.value = element.id ?? null;
    emit('select-element', element);
}

// Handle element removal
function removeElement(element: UnifiedElement) {
    emit('remove-element', element);
}

// Handle element update
function updateElement(element: UnifiedElement) {
    emit('update-element', element);
}

// Handle element deletion
function deleteElement(element: UnifiedElement) {
    selectedElementId.value = null;
    emit('remove-element', element);
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

// Handle drag events
function handleDragEnter(event: DragEvent, elementId: string) {
    event.preventDefault();
    dragOverElementId.value = elementId;
    emit('drag-enter', event, elementId);
}

function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragOverElementId.value = null;
    emit('drag-leave', event);
}

function handleDrop(event: DragEvent, targetElementId: string | null = null) {
    event.preventDefault();
    dragOverElementId.value = null;

    // Get the widget type from the dataTransfer
    const widgetType = event.dataTransfer?.getData('widget-type');
    if (!widgetType) return;

    // Get canvas container to calculate its width
    const canvasContainer = document.querySelector('.canvas-content') as HTMLElement;
    const canvasWidth = canvasContainer ? canvasContainer.clientWidth : 400;

    // Calculate drop position
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    // Create new element using the service with canvas width
    try {
        const newElement = UnifiedWidgetService.createElement(
            widgetType,
            props.selectedFramework === 'both' ? 'flutter' : props.selectedFramework,
            position,
            canvasWidth // Pass canvas width for full-width widgets
        );

        emit('add-element', newElement, targetElementId);
    } catch (error) {
        console.error('Error creating element:', error);
    }
}

// Enhanced positioning system to prevent overlapping
const getSmartPosition = (elementType: string, existingElements: any[]) => {
    const basePositions = {
        'Container': { x: 50, y: 50 },
        'Text': { x: 100, y: 100 },
        'Button': { x: 150, y: 150 },
        'TextField': { x: 200, y: 200 },
        'Image': { x: 250, y: 250 },
        'Row': { x: 50, y: 300 },
        'Column': { x: 300, y: 50 }
    };

    const basePosition = basePositions[elementType as keyof typeof basePositions] || { x: 100, y: 100 };

    // Calculate grid-based positioning to avoid overlaps
    const gridSize = 20; // Grid spacing
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const offsetX = (attempt % 10) * gridSize;
        const offsetY = Math.floor(attempt / 10) * gridSize;

        const newPosition = {
            x: basePosition.x + offsetX,
            y: basePosition.y + offsetY
        };

        // Check if this position overlaps with existing elements
        const hasOverlap = existingElements.some(element => {
            if (!element.position) return false;

            const distance = Math.sqrt(
                Math.pow(element.position.x - newPosition.x, 2) +
                Math.pow(element.position.y - newPosition.y, 2)
            );

            return distance < 80; // Minimum distance between elements
        });

        if (!hasOverlap) {
            return newPosition;
        }
    }

    // Fallback to random position if no good spot found
    return {
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 50
    };
};

// Auto-arrange elements to prevent overlapping
const autoArrangeElements = () => {
    if (!props.currentScreen.elements) return;

    const arrangedElements = props.currentScreen.elements.map((element, index) => {
        const newPosition = getSmartPosition(element.type, props.currentScreen.elements.slice(0, index));
        return {
            ...element,
            position: newPosition,
            zIndex: index + 1 // Assign incremental z-index
        };
    });

    // Emit updated elements
    arrangedElements.forEach(element => {
        emit('update-element', element);
    });
};

// Collision detection system
const detectCollisions = (elements: UnifiedElement[]) => {
    const collisions: string[] = [];

    for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
            const elementA = elements[i];
            const elementB = elements[j];

            if (isColliding(elementA, elementB)) {
                collisions.push(`${elementA.id}-${elementB.id}`);
            }
        }
    }

    return collisions;
};

// Check if two elements are colliding
const isColliding = (elementA: UnifiedElement, elementB: UnifiedElement) => {
    if (!elementA.position || !elementB.position || !elementA.size || !elementB.size) {
        return false;
    }

    const rectA = {
        left: elementA.position.x,
        top: elementA.position.y,
        right: elementA.position.x + elementA.size.width,
        bottom: elementA.position.y + elementA.size.height
    };

    const rectB = {
        left: elementB.position.x,
        top: elementB.position.y,
        right: elementB.position.x + elementB.size.width,
        bottom: elementB.position.y + elementB.size.height
    };

    return !(rectA.right < rectB.left ||
             rectB.right < rectA.left ||
             rectA.bottom < rectB.top ||
             rectB.bottom < rectA.top);
};

// Snap to grid functionality
const snapToGrid = (position: { x: number, y: number }, gridSize: number = 10) => {
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize
    };
};

// Handle widget events from rendered components
function handleWidgetEvent(eventData: any) {
    console.log('Widget event:', eventData);

    if (eventData.type === 'delete' && eventData.elementId) {
        const element = props.currentScreen.elements.find(el => el.id === eventData.elementId);
        if (element) {
            deleteElement(element);
        }
    } else if (eventData.type === 'duplicate' && eventData.elementId) {
        const element = props.currentScreen.elements.find(el => el.id === eventData.elementId);
        if (element) {
            duplicateElement(element);
        }
    }
}
</script>

<style scoped>
/* Modern Canvas Design */
.unified-canvas {
    width: 100%;
    height: 100%;
    min-height: 600px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .unified-canvas {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-color: rgba(255, 255, 255, 0.1);
}

/* Enhanced Header */
.canvas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    position: relative;
}

.dark .canvas-header {
    background: rgba(15, 23, 42, 0.8);
    border-bottom-color: rgba(255, 255, 255, 0.1);
}

.canvas-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    pointer-events: none;
}

.screen-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.screen-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.screen-icon {
    color: #3b82f6;
    font-size: 20px;
}

.screen-name {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #1f2937;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.dark .screen-name {
    color: #f9fafb;
}

.framework-badges {
    display: flex;
    gap: 8px;
}

.framework-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.framework-badge.framework-flutter {
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: white;
}

.framework-badge.framework-angular {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
}

.framework-badge.framework-both {
    background: linear-gradient(135deg, #64748b, #475569);
    color: white;
}

.framework-icon {
    font-size: 14px;
}

.canvas-controls {
    display: flex;
    gap: 8px;
}

.control-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
}

.canvas-element {
    position: relative;
    transition: all 0.2s ease;
}

.canvas-element:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Framework-specific canvas styling */
.canvas-flutter {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.canvas-angular {
    background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.canvas-both {
    background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
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
    width: 375px;
    height: 667px;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-radius: 36px;
    box-shadow:
        0 0 0 10px #111,
        0 0 0 11px #222,
        0 20px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    margin: 20px auto;
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
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 6px;
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
    max-width: 280px;
    padding: 30px 20px;
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
    background: linear-gradient(45deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.05));
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
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
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
</style>
