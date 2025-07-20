// composables/useElementManagement.ts
import { ref, computed, watch, readonly } from 'vue';
import type { UnifiedElement, UnifiedScreen } from '@/Data/PizarraUnificada';
import { UnifiedElementManagementService } from '@/services/UnifiedElementManagementService';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';

export interface UseElementManagementOptions {
    currentScreen: UnifiedScreen;
    selectedFramework: 'flutter' | 'angular' | 'both';
}

export function useElementManagement(options: UseElementManagementOptions) {
    // Reactive state
    const selectedElement = ref<UnifiedElement | null>(null);
    const availableWidgets = ref<any[]>([]);

    // Service instance
    const elementService = new UnifiedElementManagementService({
        currentScreen: options.currentScreen,
        selectedFramework: options.selectedFramework,
        availableWidgets: availableWidgets.value
    });

    // Computed properties
    const currentElements = computed(() => {
        return options.currentScreen.elements || [];
    });

    const selectedElementId = computed(() => selectedElement.value?.id || null);

    // Watchers
    watch(() => options.selectedFramework, (newFramework) => {
        updateAvailableWidgets();
        elementService.updateOptions({ selectedFramework: newFramework });
    });

    watch(() => options.currentScreen, (newScreen) => {
        elementService.updateOptions({ currentScreen: newScreen });
    });

    // Methods
    const updateAvailableWidgets = () => {
        availableWidgets.value = UnifiedWidgetService.getAvailableWidgets(options.selectedFramework);
        elementService.updateOptions({ availableWidgets: availableWidgets.value });
    };

    const addWidget = (widgetType: string, position?: { x: number; y: number }, canvasWidth?: number): UnifiedElement | null => {
        const element = elementService.addWidget(widgetType, position, canvasWidth);
        if (element) {
            console.log('✅ Widget added via service:', element);
        }
        return element;
    };

    const selectElement = (element: UnifiedElement | null) => {
        selectedElement.value = element;
        elementService.selectElement(element);
    };

    const deselectElement = () => {
        selectedElement.value = null;
        elementService.deselectElement();
    };

    const updateElement = (updatedElement: UnifiedElement): boolean => {
        const result = elementService.updateElement(updatedElement);
        if (result.success && result.element) {
            // Update selected element if it's the same
            if (selectedElement.value && selectedElement.value.id === updatedElement.id) {
                selectedElement.value = result.element;
            }
            return true;
        }
        console.error('❌ Failed to update element:', result.error);
        return false;
    };

    const removeElement = (element: UnifiedElement): boolean => {
        const success = elementService.removeElement(element);
        if (success) {
            // Deselect if it was the selected element
            if (selectedElement.value && selectedElement.value.id === element.id) {
                selectedElement.value = null;
            }
        }
        return success;
    };

    // Exponer directamente el método del servicio para evitar wrapper innecesario
    const duplicateElement = elementService.duplicateElement.bind(elementService);

    const updateElementProperties = (elementId: string, properties: Record<string, any>): boolean => {
        const result = elementService.updateElementProperties(elementId, properties);
        if (result.success && result.element) {
            // Update selected element if it's the same
            if (selectedElement.value && selectedElement.value.id === elementId) {
                selectedElement.value = result.element;
            }
            return true;
        }
        console.error('❌ Failed to update element properties:', result.error);
        return false;
    };

    const updateElementPosition = (elementId: string, position: { x: number; y: number }): boolean => {
        const result = elementService.updateElementPosition(elementId, position);
        if (result.success && result.element) {
            // Update selected element if it's the same
            if (selectedElement.value && selectedElement.value.id === elementId) {
                selectedElement.value = result.element;
            }
            return true;
        }
        console.error('❌ Failed to update element position:', result.error);
        return false;
    };

    const updateElementSize = (elementId: string, size: { width: number; height: number }): boolean => {
        const result = elementService.updateElementSize(elementId, size);
        if (result.success && result.element) {
            // Update selected element if it's the same
            if (selectedElement.value && selectedElement.value.id === elementId) {
                selectedElement.value = result.element;
            }
            return true;
        }
        console.error('❌ Failed to update element size:', result.error);
        return false;
    };

    const getElements = () => {
        return elementService.getElements();
    };

    const findElementById = (elementId: string) => {
        return elementService.findElementById(elementId);
    };

    const getElementsByType = (type: string) => {
        return elementService.getElementsByType(type);
    };

    const getElementsByFramework = (framework: string) => {
        return elementService.getElementsByFramework(framework);
    };

    const validateElement = (element: UnifiedElement) => {
        return elementService.validateElement(element);
    };

    // Initialize
    updateAvailableWidgets();

    return {
        // State
        selectedElement,
        availableWidgets,
        currentElements,
        selectedElementId,

        // Methods
        addWidget,
        selectElement,
        deselectElement,
        updateElement,
        removeElement,
        duplicateElement,
        updateElementProperties,
        updateElementPosition,
        updateElementSize,
        getElements,
        findElementById,
        getElementsByType,
        getElementsByFramework,
        validateElement,
        updateAvailableWidgets,

        // Service access
        elementService
    };
} 