// composables/useWidgetManagement.ts
import { ref, computed } from 'vue';
import { WidgetService } from '@/services/WidgetService';

export function useWidgetManagement(socket, currentScreen, currentUser) {
    const selectedWidget = ref(null);

    // Función para agregar un widget al lienzo
    const addWidget = (widgetType: string, availableWidgets: any[]) => {
        const newWidget = WidgetService.createWidget(widgetType, availableWidgets);
        if (!newWidget) return;

        if (currentScreen.value) {
            if (!currentScreen.value.elements) {
                currentScreen.value.elements = [];
            }
            currentScreen.value.elements.push(newWidget);
        }

        emitWidgetAdded(newWidget, currentScreen.value?.id);
    };

    const emitWidgetAdded = (widget: any, screenId?: string) => {
        socket.emit('flutter-widget-added', {
            widget,
            screenId,
            userId: currentUser.value,
        });
    };

    const selectWidget = (widget: any) => {
        selectedWidget.value = widget;
    };

    // Más funciones relacionadas con la gestión de widgets...

    return {
        selectedWidget,
        addWidget,
        emitWidgetAdded,
        selectWidget,
        // Otras funciones exportadas...
    };
}
