// services/DragDropService.ts

/**
 * Service for handling drag and drop operations in the Flutter canvas
 */
export class DragDropService {
    /**
     * Handles drag start event
     * @param event The drag event
     * @param widgetType The type of widget being dragged
     * @param draggingWidgetType Ref to store the dragging widget type
     */
    static onDragStart(event: DragEvent, widgetType: string, draggingWidgetType: any): void {
        draggingWidgetType.value = widgetType;
    }

    /**
     * Handles drag end event
     * @param event The drag event
     * @param draggingWidgetType Ref to store the dragging widget type
     */
    static onDragEnd(event: DragEvent, draggingWidgetType: any): void {
        draggingWidgetType.value = null;
    }

    /**
     * Handles drag over event
     * @param event The drag event
     */
    static onDragOver(event: DragEvent): void {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) target.classList.add('dragover');
    }

    /**
     * Handles drag enter event
     * @param event The drag event
     */
    static onDragEnter(event: DragEvent): void {
        (event.currentTarget as HTMLElement).classList.add('dragover');
    }

    /**
     * Handles drag leave event
     * @param event The drag event
     */
    static onDragLeave(event: DragEvent): void {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) target.classList.remove('dragover');
    }

    /**
     * Handles drop event
     * @param event The drag event
     */
    static onDrop(event: DragEvent): void {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) target.classList.remove('dragover');
    }

    /**
     * Creates a utility object with all drag and drop handlers
     * @param draggingWidgetType Ref to store the dragging widget type
     * @returns Object with drag and drop handler methods
     */
    static createDragUtils(draggingWidgetType: any) {
        return {
            // Handle drag start from palette
            onDragStart: (widgetType: string) => {
                draggingWidgetType.value = widgetType;
            },

            // Handle drag end
            onDragEnd: () => {
                draggingWidgetType.value = null;
            },

            // Handle drag enter/over
            onDragOver: (event: DragEvent) => {
                event.preventDefault();
                const target = event.currentTarget as HTMLElement;
                if (target) target.classList.add('dragover');
            },

            // Handle drag leave
            onDragLeave: (event: DragEvent) => {
                event.preventDefault();
                const target = event.currentTarget as HTMLElement;
                if (target) target.classList.remove('dragover');
            },

            // Handle drop
            onDrop: (event: DragEvent) => {
                event.preventDefault();
                const target = event.currentTarget as HTMLElement;
                if (target) target.classList.remove('dragover');
            }
        };
    }
}
