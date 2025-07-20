// services/UnifiedElementManagementService.ts
import type { UnifiedElement, UnifiedScreen } from '@/Data/PizarraUnificada';
import { WidgetUtils } from '@/utils/WidgetUtils';
import { UnifiedWidgetService } from './UnifiedWidgetService';

export interface ElementManagementOptions {
    currentScreen: UnifiedScreen;
    selectedFramework: 'flutter' | 'angular' | 'both';
    availableWidgets: any[];
}

export interface ElementUpdateResult {
    success: boolean;
    element?: UnifiedElement;
    error?: string;
}

export class UnifiedElementManagementService {
    private currentScreen: UnifiedScreen;
    private selectedFramework: 'flutter' | 'angular' | 'both';
    private availableWidgets: any[];
    private selectedElement: UnifiedElement | null = null;

    constructor(options: ElementManagementOptions) {
        this.currentScreen = options.currentScreen;
        this.selectedFramework = options.selectedFramework;
        this.availableWidgets = options.availableWidgets;
    }

    /**
     * Actualiza las opciones del servicio
     */
    updateOptions(options: Partial<ElementManagementOptions>) {
        if (options.currentScreen) this.currentScreen = options.currentScreen;
        if (options.selectedFramework) this.selectedFramework = options.selectedFramework;
        if (options.availableWidgets) this.availableWidgets = options.availableWidgets;
    }

    /**
     * Agrega un widget al canvas
     */
    addWidget(widgetType: string, position?: { x: number; y: number }, canvasWidth?: number): UnifiedElement | null {
        try {
            console.log('🏗️ Adding widget:', widgetType, 'at position:', position);

            // Calcular posición vertical automática basada en elementos existentes
            const existingElements = this.currentScreen.elements || [];
            const verticalSpacing = 80; // Espacio entre elementos
            const startY = 50; // Posición inicial Y
            const autoY = startY + (existingElements.length * verticalSpacing);
            
            // Usar posición proporcionada o calcular automáticamente
            const finalPosition = position || { x: 20, y: autoY };

            // Usa 'flutter' si el framework es 'both', para evitar error de tipado
            const targetFramework = this.selectedFramework === 'both' ? 'flutter' : this.selectedFramework;
            // Usa UnifiedWidgetService (que ya usa WidgetUtils) para crear el widget
            const newElement = UnifiedWidgetService.createElement(widgetType, targetFramework, finalPosition, canvasWidth);

            if (!newElement) {
                console.error('❌ Failed to create element for widget type:', widgetType);
                return null;
            }

            // Agregar al array de elementos de la pantalla actual
            if (!this.currentScreen.elements) {
                this.currentScreen.elements = [];
            }

            this.currentScreen.elements.push(newElement);
            console.log('✅ Widget added successfully:', newElement);

            return newElement;
        } catch (error) {
            console.error('❌ Error adding widget:', error);
            return null;
        }
    }

    /**
     * Selecciona un elemento
     */
    selectElement(element: UnifiedElement | null): void {
        if (element === null) {
            console.log('🎯 Deselecting element (null passed)');
            this.selectedElement = null;
            return;
        }
        
        console.log('🎯 Selecting element:', element.id);
        this.selectedElement = element;
    }

    /**
     * Deselecciona el elemento actual
     */
    deselectElement(): void {
        console.log('🎯 Deselecting element');
        this.selectedElement = null;
    }

    /**
     * Obtiene el elemento seleccionado
     */
    getSelectedElement(): UnifiedElement | null {
        return this.selectedElement;
    }

    /**
     * Actualiza un elemento
     */
    updateElement(updatedElement: UnifiedElement): ElementUpdateResult {
        try {
            console.log('🔧 Updating element:', updatedElement.id);

            if (!this.currentScreen.elements) {
                return { success: false, error: 'No elements array found' };
            }

            const index = this.currentScreen.elements.findIndex(el => el.id === updatedElement.id);
            if (index === -1) {
                return { success: false, error: 'Element not found' };
            }

            this.currentScreen.elements[index] = updatedElement;

            // Si es el elemento seleccionado, actualizarlo también
            if (this.selectedElement && this.selectedElement.id === updatedElement.id) {
                this.selectedElement = updatedElement;
            }

            console.log('✅ Element updated successfully');
            return { success: true, element: updatedElement };
        } catch (error) {
            console.error('❌ Error updating element:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Elimina un elemento
     */
    removeElement(element: UnifiedElement): boolean {
        try {
            console.log('🗑️ Removing element:', element.id);

            if (!this.currentScreen.elements) {
                console.warn('⚠️ No elements array found');
                return false;
            }

            const index = this.currentScreen.elements.findIndex(el => el.id === element.id);
            if (index === -1) {
                console.warn('⚠️ Element not found for removal');
                return false;
            }

            this.currentScreen.elements.splice(index, 1);

            // Si es el elemento seleccionado, deseleccionarlo
            if (this.selectedElement && this.selectedElement.id === element.id) {
                this.selectedElement = null;
            }

            console.log('✅ Element removed successfully');
            return true;
        } catch (error) {
            console.error('❌ Error removing element:', error);
            return false;
        }
    }

    /**
     * Duplica un elemento
     */
    duplicateElement(element: UnifiedElement): UnifiedElement | null {
        try {
            console.log('📋 Duplicating element:', element.id);

            // Usar WidgetUtils directamente en lugar del wrapper
            const duplicatedElement = WidgetUtils.duplicateWidget(element);
            if (!duplicatedElement) {
                console.error('❌ Failed to duplicate element');
                return null;
            }

            console.log('✅ Element duplicated successfully');
            return duplicatedElement;
        } catch (error) {
            console.error('❌ Error duplicating element:', error);
            return null;
        }
    }

    /**
     * Actualiza las propiedades de un elemento
     */
    updateElementProperties(elementId: string, properties: Record<string, any>): ElementUpdateResult {
        try {
            console.log('🔧 Updating element properties:', elementId, properties);

            if (!this.currentScreen.elements) {
                return { success: false, error: 'No elements array found' };
            }

            const element = this.currentScreen.elements.find(el => el.id === elementId);
            if (!element) {
                return { success: false, error: 'Element not found' };
            }

            const updatedElement = {
                ...element,
                props: {
                    ...element.props,
                    ...properties
                }
            };

            return this.updateElement(updatedElement);
        } catch (error) {
            console.error('❌ Error updating element properties:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Actualiza la posición de un elemento
     */
    updateElementPosition(elementId: string, position: { x: number; y: number }): ElementUpdateResult {
        try {
            console.log('📍 Updating element position:', elementId, position);

            if (!this.currentScreen.elements) {
                return { success: false, error: 'No elements array found' };
            }

            const element = this.currentScreen.elements.find(el => el.id === elementId);
            if (!element) {
                return { success: false, error: 'Element not found' };
            }

            const updatedElement = {
                ...element,
                position
            };

            return this.updateElement(updatedElement);
        } catch (error) {
            console.error('❌ Error updating element position:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Actualiza el tamaño de un elemento
     */
    updateElementSize(elementId: string, size: { width: number; height: number }): ElementUpdateResult {
        try {
            console.log('📏 Updating element size:', elementId, size);

            if (!this.currentScreen.elements) {
                return { success: false, error: 'No elements array found' };
            }

            const element = this.currentScreen.elements.find(el => el.id === elementId);
            if (!element) {
                return { success: false, error: 'Element not found' };
            }

            const updatedElement = {
                ...element,
                size
            };

            return this.updateElement(updatedElement);
        } catch (error) {
            console.error('❌ Error updating element size:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Obtiene todos los elementos de la pantalla actual
     */
    getElements(): UnifiedElement[] {
        return this.currentScreen.elements || [];
    }

    /**
     * Busca un elemento por ID
     */
    findElementById(elementId: string): UnifiedElement | null {
        if (!this.currentScreen.elements) return null;
        return this.currentScreen.elements.find(el => el.id === elementId) || null;
    }

    /**
     * Obtiene elementos por tipo
     */
    getElementsByType(type: string): UnifiedElement[] {
        if (!this.currentScreen.elements) return [];
        return this.currentScreen.elements.filter(el => el.type === type);
    }

    /**
     * Obtiene elementos por framework
     */
    getElementsByFramework(framework: string): UnifiedElement[] {
        if (!this.currentScreen.elements) return [];
        return this.currentScreen.elements.filter(el => el.framework === framework);
    }

    /**
     * Valida un elemento
     */
    validateElement(element: UnifiedElement): boolean {
        // Usa UnifiedWidgetService (que ya usa WidgetUtils) para validar el widget
        return UnifiedWidgetService.validateElementProperties(element);
    }

    /**
     * Limpia el estado del servicio
     */
    cleanup() {
        this.selectedElement = null;
    }
} 