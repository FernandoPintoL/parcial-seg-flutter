import { ref, computed, watch } from 'vue';
import type { PizarraUnificada, UnifiedScreen, User, UnifiedElement } from '@/Data/PizarraUnificada';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';
import { AlertService } from '@/services/AlertService';
import axios from 'axios';

interface PizarraStateProps {
    user: User;
    pizarra: PizarraUnificada;
    creador: User;
    isCreador: boolean;
    colaboradores: User[];
}

export function usePizarraState(props: PizarraStateProps) {
    // Core State
    const projectName = ref<string>(props.pizarra?.name || 'Proyecto Unificado');
    const selectedFramework = ref<'flutter' | 'angular' | 'both'>(props.pizarra?.type || 'both');
    const screens = ref<UnifiedScreen[]>(props.pizarra?.screens || []);
    const currentScreenIndex = ref<number>(0);
    const selectedElement = ref<UnifiedElement | null>(null);
    const availableWidgets = ref<any[]>([]);

    // Computed Properties
    const currentScreen = computed(() => {
        if (screens.value.length === 0) {
            initializeScreens();
        }
        return screens.value[currentScreenIndex.value] || screens.value[0] || { elements: [] };
    });

    // Watchers
    watch(selectedFramework, () => {
        updateAvailableWidgets();
    });

    // Methods
    const initializeScreens = () => {
        if (screens.value.length === 0) {
            const defaultScreen: UnifiedScreen = {
                id: `screen-${Date.now()}`,
                name: 'Pantalla Principal',
                elements: [],
                isHome: true,
                isDrawer: false,
                framework: selectedFramework.value,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            screens.value.push(defaultScreen);
        }
    };

    const updateAvailableWidgets = () => {
        availableWidgets.value = UnifiedWidgetService.getAvailableWidgets(selectedFramework.value);
    };

    const savePizarra = async () => {
        try {
            await axios.put(`/api/pizarra_unificada/${props.pizarra.id}`, {
                name: projectName.value,
                type: selectedFramework.value,
                screens: screens.value,
                elements: currentScreen.value?.elements || []
            });
            console.log('Pizarra saved successfully');
        } catch (error) {
            console.error('Error saving pizarra:', error);
            await AlertService.prototype.error('Error', 'No se pudo guardar la pizarra');
        }
    };

    const addElement = (element: UnifiedElement) => {
        console.log('🔧 usePizarraState addElement called with:', element);

        if (element && currentScreen.value) {
            currentScreen.value.elements.push(element);
            console.log('📝 Element added to screen. Total elements:', currentScreen.value.elements.length);

            // Log the current screen elements for debugging
            console.log('📊 Current screen elements:', currentScreen.value.elements.map(e => ({ id: e.id, type: e.type, framework: e.framework })));

            savePizarra();
            console.log('💾 Pizarra saved after adding element');
        } else {
            console.error('❌ Failed to add element - element or currentScreen is null');
        }
    };

    const addWidget = (widgetType: string) => {
        console.log('🔧 usePizarraState addWidget called with:', { widgetType, selectedFramework: selectedFramework.value });

        // Primero, buscar el widget en la lista de widgets disponibles para determinar su framework
        const allAvailableWidgets = UnifiedWidgetService.getAvailableWidgets('both');
        const widgetDefinition = allAvailableWidgets.find(w => w.type === widgetType);

        if (!widgetDefinition) {
            console.error('❌ Widget definition not found for type:', widgetType);
            return;
        }

        console.log('📋 Widget definition found:', { type: widgetDefinition.type, framework: widgetDefinition.framework });

        // Usar el framework del widget o el seleccionado si es específico
        let targetFramework = widgetDefinition.framework;
        if (selectedFramework.value !== 'both') {
            targetFramework = selectedFramework.value;
        }

        console.log('🎯 Target framework:', targetFramework);

        const position = { x: 100, y: 100 };
        const newElement = UnifiedWidgetService.createElement(
            widgetType,
            targetFramework,
            position
        );

        console.log('✨ New element created:', newElement);

        if (newElement && currentScreen.value) {
            currentScreen.value.elements.push(newElement);
            console.log('📝 Element added to screen. Total elements:', currentScreen.value.elements.length);

            // Log the current screen elements for debugging
            console.log('📊 Current screen elements:', currentScreen.value.elements.map(e => ({ id: e.id, type: e.type, framework: e.framework })));

            savePizarra();
            console.log('💾 Pizarra saved after adding widget');
        } else {
            console.error('❌ Failed to add widget - newElement or currentScreen is null');
        }
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

        if (currentScreen.value) {
            const index = currentScreen.value.elements.findIndex(e => e.id === updatedElement.id);
            if (index !== -1) {
                currentScreen.value.elements[index] = updatedElement;
            }
        }

        savePizarra();
    };

    const updateElement = (element: UnifiedElement) => {
        console.log('📝 usePizarraState updateElement called for:', element.id);
        if (!currentScreen.value) return;

        const index = currentScreen.value.elements.findIndex(e => e.id === element.id);
        if (index !== -1) {
            currentScreen.value.elements[index] = element;

            // Update selectedElement if it's the same element
            if (selectedElement.value?.id === element.id) {
                selectedElement.value = element;
            }

            savePizarra();
            console.log('✅ Element updated successfully:', element.id);
        } else {
            console.warn('⚠️ Element not found for update:', element.id);
        }
    };

    const removeElement = (element: UnifiedElement) => {
        console.log('🗑️ usePizarraState removeElement called for:', element.id);
        console.log('🗑️ Current screen elements before removal:', currentScreen.value?.elements?.length || 0);
        console.log('🗑️ Element to remove:', { id: element.id, type: element.type, framework: element.framework });

        if (!currentScreen.value) {
            console.error('❌ No current screen available for element removal');
            return;
        }

        if (!currentScreen.value.elements) {
            console.error('❌ No elements array in current screen');
            return;
        }

        // Find the element index
        const index = currentScreen.value.elements.findIndex(e => e.id === element.id);
        console.log('🔍 Element index found:', index);

        if (index !== -1) {
            // Log before removal
            console.log('📋 Elements before removal:', currentScreen.value.elements.map(e => ({ id: e.id, type: e.type })));

            // Remove the element
            currentScreen.value.elements.splice(index, 1);

            // Log after removal
            console.log('📋 Elements after removal:', currentScreen.value.elements.map(e => ({ id: e.id, type: e.type })));
            console.log('📊 Total elements after removal:', currentScreen.value.elements.length);

            // Clear selection if the removed element was selected
            if (selectedElement.value?.id === element.id) {
                selectedElement.value = null;
                console.log('🔄 Cleared selected element');
            }

            // Force reactivity by triggering a change to the screens array
            screens.value = [...screens.value];

            savePizarra();
            console.log('✅ Element removed successfully:', element.id);
        } else {
            console.warn('⚠️ Element not found for removal:', element.id);
            console.log('⚠️ Available element IDs:', currentScreen.value.elements.map(e => e.id));
        }
    };

    // Screen Management
    const addScreen = (screenName: string) => {
        const newScreen: UnifiedScreen = {
            id: `screen-${Date.now()}`,
            name: screenName,
            elements: [],
            isHome: false,
            isDrawer: false,
            framework: selectedFramework.value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        screens.value.push(newScreen);
        currentScreenIndex.value = screens.value.length - 1;
        savePizarra();
    };

    const deleteScreen = async (index: number) => {
        if (screens.value.length <= 1) {
            await AlertService.prototype.error('Error', 'No puedes eliminar la única pantalla');
            return;
        }

        const result = await AlertService.prototype.confirm(
            '¿Estás seguro?',
            'Esta acción no se puede deshacer'
        );

        if (result.isConfirmed) {
            screens.value.splice(index, 1);
            if (currentScreenIndex.value >= screens.value.length) {
                currentScreenIndex.value = screens.value.length - 1;
            }
            savePizarra();
        }
    };

    const selectScreen = (index: number) => {
        currentScreenIndex.value = index;
        selectedElement.value = null;
    };

    const setHomeScreen = (index: number) => {
        screens.value.forEach((screen, i) => {
            screen.isHome = i === index;
        });
        savePizarra();
    };

    return {
        // State
        projectName,
        selectedFramework,
        screens,
        currentScreenIndex,
        currentScreen,
        selectedElement,
        availableWidgets,

        // Actions
        initializeScreens,
        updateAvailableWidgets,
        savePizarra,
        addWidget,
        addElement,
        selectElement,
        updateElement,
        updateElementProperty,
        removeElement,

        // Screen Management
        addScreen,
        deleteScreen,
        selectScreen,
        setHomeScreen
    };
}
