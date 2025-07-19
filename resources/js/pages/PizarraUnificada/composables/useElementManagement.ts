import { ref, computed } from 'vue';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';
import type { UnifiedElement, UnifiedScreen } from '@/Data/PizarraUnificada';

export interface UseElementManagementProps {
    currentScreen: UnifiedScreen;
    selectedFramework: 'flutter' | 'angular' | 'both';
}

export function useElementManagement(props: UseElementManagementProps) {
    const selectedElement = ref<UnifiedElement | null>(null);
    const availableWidgets = ref<any[]>([]);

    // Update available widgets based on framework
    const updateAvailableWidgets = () => {
        availableWidgets.value = UnifiedWidgetService.getAvailableWidgets(props.selectedFramework);
    };

    // Calculate optimal position for new elements
    const calculateOptimalPosition = (widgetType: string): { x: number, y: number } => {
        if (!props.currentScreen || !props.currentScreen.elements || props.currentScreen.elements.length === 0) {
            return { x: 50, y: 50 };
        }

        const existingElements = props.currentScreen.elements;
        const startX = 50;
        const startY = 50;
        const margin = 30;

        const framework = props.selectedFramework === 'both' ? 'flutter' : props.selectedFramework;

        if (framework === 'flutter') {
            return calculateFlutterFormPosition(widgetType, existingElements, startX, startY, margin);
        } else {
            return calculateAngularGridPosition(widgetType, existingElements, startX, startY, margin);
        }
    };

    const calculateFlutterFormPosition = (widgetType: string, existingElements: any[], startX: number, startY: number, margin: number): { x: number, y: number } => {
        let maxBottom = startY;

        existingElements.forEach(element => {
            if (element.position && element.size) {
                const elementBottom = element.position.y + (element.size.height || 0);
                if (elementBottom > maxBottom) {
                    maxBottom = elementBottom;
                }
            }
        });

        const newY = maxBottom + margin;
        const mobileWidth = 300;
        const mobileMargin = 20;
        const newX = mobileMargin;

        return { x: newX, y: newY };
    };

    const calculateAngularGridPosition = (widgetType: string, existingElements: any[], startX: number, startY: number, margin: number): { x: number, y: number } => {
        const maxElementsPerRow = 3;
        let maxX = startX;
        let maxBottom = startY;

        existingElements.forEach(element => {
            if (element.position && element.size) {
                const elementRight = element.position.x + (element.size.width || 0);
                const elementBottom = element.position.y + (element.size.height || 0);

                if (elementRight > maxX) {
                    maxX = elementRight;
                }
                if (elementBottom > maxBottom) {
                    maxBottom = elementBottom;
                }
            }
        });

        let newX = startX;
        let newY = startY;

        const elementsInCurrentRow = existingElements.filter(element => {
            if (element.position) {
                return Math.abs(element.position.y - maxBottom) < margin;
            }
            return false;
        }).length;

        if (elementsInCurrentRow >= maxElementsPerRow) {
            newX = startX;
            newY = maxBottom + margin;
        } else {
            newX = maxX + margin;
            newY = maxBottom;
        }

        return { x: newX, y: newY };
    };

    // Element management functions
    const addWidget = (widgetType: string): UnifiedElement | null => {
        const framework = props.selectedFramework === 'both' ? 'flutter' : props.selectedFramework;
        const position = calculateOptimalPosition(widgetType);

        const newElement = UnifiedWidgetService.createElement(
            widgetType,
            framework,
            position
        );

        if (newElement && props.currentScreen) {
            // Assign z-index
            if (props.currentScreen.elements.length > 0) {
                const highestZIndex = Math.max(
                    ...props.currentScreen.elements.map(el => el.zIndex || 1)
                );
                newElement.zIndex = highestZIndex + 1;
            } else {
                newElement.zIndex = 1;
            }

            props.currentScreen.elements.push(newElement);
            return newElement;
        }

        return null;
    };

    const selectElement = (element: UnifiedElement) => {
        selectedElement.value = element;
    };

    const updateElementProperty = (propertyName: string, value: any) => {
        if (!selectedElement.value) return;

        const updatedElement = UnifiedWidgetService.updateElementProperties(
            selectedElement.value,
            { [propertyName]: value }
        );

        selectedElement.value = updatedElement;

        if (props.currentScreen) {
            const index = props.currentScreen.elements.findIndex(e => e.id === updatedElement.id);
            if (index !== -1) {
                props.currentScreen.elements[index] = updatedElement;
            }
        }

        return updatedElement;
    };

    const updateElement = (element: UnifiedElement) => {
        if (!props.currentScreen) return false;

        const index = props.currentScreen.elements.findIndex(e => e.id === element.id);
        if (index !== -1) {
            props.currentScreen.elements[index] = element;

            if (selectedElement.value?.id === element.id) {
                selectedElement.value = element;
            }

            return true;
        }

        return false;
    };

    const removeElement = (element: UnifiedElement): boolean => {
        if (!props.currentScreen) return false;

        const index = props.currentScreen.elements.findIndex(e => e.id === element.id);
        if (index !== -1) {
            props.currentScreen.elements.splice(index, 1);

            if (selectedElement.value?.id === element.id) {
                selectedElement.value = null;
            }

            return true;
        }

        return false;
    };

    const duplicateElement = (element: UnifiedElement): UnifiedElement | null => {
        const duplicatedElement = UnifiedWidgetService.duplicateElement(element);
        if (duplicatedElement && props.currentScreen) {
            if (duplicatedElement.position) {
                duplicatedElement.position.x += 20;
                duplicatedElement.position.y += 20;
            }

            props.currentScreen.elements.push(duplicatedElement);
            return duplicatedElement;
        }

        return null;
    };

    return {
        // State
        selectedElement,
        availableWidgets,

        // Actions
        updateAvailableWidgets,
        addWidget,
        selectElement,
        updateElementProperty,
        updateElement,
        removeElement,
        duplicateElement,
        calculateOptimalPosition
    };
} 