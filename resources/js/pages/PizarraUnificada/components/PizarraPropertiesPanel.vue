<template>
    <div v-if="selectedElement" class="properties-panel">
        <div class="panel-header">
            <div class="element-info">
                <span class="material-icons element-icon">{{ getElementIcon(selectedElement.type) }}</span>
                <div class="element-details">
                    <h3 class="element-title">{{ getElementName(selectedElement.type) }}</h3>
                    <p class="element-type">{{ selectedElement.framework.toUpperCase() }} - {{ selectedElement.type }}</p>
                </div>
            </div>
            <button @click="$emit('close')" class="close-btn" title="Cerrar panel">
                <span class="material-icons">close</span>
            </button>
        </div>

        <div class="panel-content">
            <!-- Posición y Tamaño -->
            <div class="property-section">
                <h4 class="section-title">
                    <span class="material-icons">straighten</span>
                    Posición y Tamaño
                </h4>
                <div class="property-grid">
                    <div class="property-item">
                        <label>Posición X</label>
                        <input 
                            type="number" 
                            :value="selectedElement.position?.x || 0"
                            @input="updatePosition('x', $event)"
                            class="property-input"
                        />
                    </div>
                    <div class="property-item">
                        <label>Posición Y</label>
                        <input 
                            type="number" 
                            :value="selectedElement.position?.y || 0"
                            @input="updatePosition('y', $event)"
                            class="property-input"
                        />
                    </div>
                    <div class="property-item">
                        <label>Ancho</label>
                        <input 
                            type="number" 
                            :value="selectedElement.size?.width || 0"
                            @input="updateSize('width', $event)"
                            class="property-input"
                        />
                    </div>
                    <div class="property-item">
                        <label>Alto</label>
                        <input 
                            type="number" 
                            :value="selectedElement.size?.height || 0"
                            @input="updateSize('height', $event)"
                            class="property-input"
                        />
                    </div>
                </div>
            </div>

            <!-- Propiedades del Widget -->
            <div class="property-section">
                <h4 class="section-title">
                    <span class="material-icons">tune</span>
                    Propiedades
                </h4>
                <div class="properties-list">
                    <div 
                        v-for="(value, key) in selectedElement.props" 
                        :key="key"
                        class="property-item"
                    >
                        <label>{{ formatPropertyName(key) }}</label>
                        <input 
                            :type="getInputType(key, value)"
                            :value="value"
                            @input="updateProperty(key, $event)"
                            class="property-input"
                            :placeholder="getPropertyPlaceholder(key)"
                        />
                    </div>
                </div>
            </div>

            <!-- Acciones -->
            <div class="property-section">
                <h4 class="section-title">
                    <span class="material-icons">build</span>
                    Acciones
                </h4>
                <div class="action-buttons">
                    <button @click="duplicateElement" class="action-btn duplicate-btn">
                        <span class="material-icons">content_copy</span>
                        Duplicar
                    </button>
                    <button @click="deleteElement" class="action-btn delete-btn">
                        <span class="material-icons">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UnifiedElement } from '@/Data/PizarraUnificada';

const props = defineProps<{
    selectedElement: UnifiedElement | null;
}>();

const emit = defineEmits([
    'update-element',
    'delete-element',
    'duplicate-element',
    'close'
]);

// Obtener icono del elemento
function getElementIcon(type: string): string {
    const iconMap: Record<string, string> = {
        'Container': 'crop_square',
        'Text': 'text_fields',
        'Button': 'smart_button',
        'ElevatedButton': 'smart_button',
        'TextField': 'input',
        'TextFormField': 'input',
        'Image': 'image',
        'Row': 'view_column',
        'Column': 'view_column',
        'Label': 'label',
        'div': 'crop_square',
        'span': 'text_fields',
        'button': 'smart_button',
        'input': 'input',
        'p': 'text_snippet',
        'h1': 'title',
        'h2': 'title',
        'h3': 'title',
    };
    return iconMap[type] || 'widgets';
}

// Obtener nombre del elemento
function getElementName(type: string): string {
    const nameMap: Record<string, string> = {
        'Container': 'Contenedor',
        'Text': 'Texto',
        'Button': 'Botón',
        'ElevatedButton': 'Botón Elevado',
        'TextField': 'Campo de Texto',
        'TextFormField': 'Campo de Formulario',
        'Image': 'Imagen',
        'Row': 'Fila',
        'Column': 'Columna',
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

// Formatear nombre de propiedad
function formatPropertyName(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/([A-Z])/g, ' $1')
        .trim();
}

// Obtener tipo de input
function getInputType(key: string, value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'checkbox';
    if (key.toLowerCase().includes('color')) return 'color';
    return 'text';
}

// Obtener placeholder
function getPropertyPlaceholder(key: string): string {
    return `Ingrese ${formatPropertyName(key).toLowerCase()}`;
}

// Actualizar posición
function updatePosition(axis: 'x' | 'y', event: Event) {
    if (!props.selectedElement) return;
    
    const value = parseInt((event.target as HTMLInputElement).value) || 0;
    const updatedElement = {
        ...props.selectedElement,
        position: {
            ...props.selectedElement.position,
            [axis]: value
        }
    };
    emit('update-element', updatedElement);
}

// Actualizar tamaño
function updateSize(dimension: 'width' | 'height', event: Event) {
    if (!props.selectedElement) return;
    
    const value = parseInt((event.target as HTMLInputElement).value) || 0;
    const updatedElement = {
        ...props.selectedElement,
        size: {
            ...props.selectedElement.size,
            [dimension]: value
        }
    };
    emit('update-element', updatedElement);
}

// Actualizar propiedad
function updateProperty(key: string, event: Event) {
    if (!props.selectedElement) return;
    
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    // Convertir tipos según el input
    if (target.type === 'number') {
        value = parseInt(value) || 0;
    } else if (target.type === 'checkbox') {
        value = target.checked;
    }
    
    const updatedElement = {
        ...props.selectedElement,
        props: {
            ...props.selectedElement.props,
            [key]: value
        }
    };
    emit('update-element', updatedElement);
}

// Duplicar elemento
function duplicateElement() {
    if (props.selectedElement) {
        emit('duplicate-element', props.selectedElement);
    }
}

// Eliminar elemento
function deleteElement() {
    if (props.selectedElement) {
        emit('delete-element', props.selectedElement);
    }
}
</script>

<style scoped>
.properties-panel {
    width: 320px;
    background: white;
    border-left: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
}

.element-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.element-icon {
    font-size: 24px;
    color: #3b82f6;
    background: #eff6ff;
    padding: 8px;
    border-radius: 8px;
}

.element-details {
    flex: 1;
}

.element-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 4px 0;
}

.element-type {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

.panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.property-section {
    margin-bottom: 24px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px 0;
}

.section-title .material-icons {
    font-size: 16px;
    color: #6b7280;
}

.property-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.property-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.property-item label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
}

.property-input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
}

.property-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.properties-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.duplicate-btn {
    background: #eff6ff;
    color: #1d4ed8;
}

.duplicate-btn:hover {
    background: #dbeafe;
}

.delete-btn {
    background: #fef2f2;
    color: #dc2626;
}

.delete-btn:hover {
    background: #fee2e2;
}

.action-btn .material-icons {
    font-size: 16px;
}
</style> 