import { ref, computed } from 'vue';
import type { PizarraUnificada, UnifiedScreen, UnifiedElement } from '@/Data/PizarraUnificada';

export interface UsePizarraStateProps {
    pizarra: PizarraUnificada;
}

export function usePizarraState(props: UsePizarraStateProps) {
    // Project state
    const projectName = ref<string>(props.pizarra?.name || 'Proyecto Unificado');
    const projectType = ref<'flutter' | 'angular' | 'both'>(props.pizarra?.type || 'both');
    const selectedFramework = ref<'flutter' | 'angular' | 'both'>(projectType.value);

    // Screens management
    const screens = ref<UnifiedScreen[]>(props.pizarra?.screens || []);
    const currentScreenIndex = ref<number>(0);

    // Current screen computed
    const currentScreen = computed(() => {
        if (screens.value.length === 0) {
            initializeScreens();
        }
        return screens.value[currentScreenIndex.value] || screens.value[0] || { elements: [] };
    });

    // Initialize screens
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

    // Screen management functions
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
        return newScreen;
    };

    const deleteScreen = (index: number) => {
        if (screens.value.length > 1) {
            screens.value.splice(index, 1);
            if (currentScreenIndex.value >= screens.value.length) {
                currentScreenIndex.value = screens.value.length - 1;
            }
            return true;
        }
        return false;
    };

    const selectScreen = (index: number) => {
        if (index >= 0 && index < screens.value.length) {
            currentScreenIndex.value = index;
        }
    };

    const setHomeScreen = (index: number) => {
        screens.value.forEach((screen, i) => {
            screen.isHome = i === index;
        });
    };

    const switchFramework = (framework: 'flutter' | 'angular' | 'both') => {
        selectedFramework.value = framework;
        projectType.value = framework;
    };

    return {
        // State
        projectName,
        projectType,
        selectedFramework,
        screens,
        currentScreenIndex,
        currentScreen,
        
        // Actions
        initializeScreens,
        addScreen,
        deleteScreen,
        selectScreen,
        setHomeScreen,
        switchFramework
    };
}
