// services/UnifiedInteractionService.ts
import type { UnifiedElement } from '@/Data/PizarraUnificada';

export interface InteractionState {
    isDragging: boolean;
    isResizing: boolean;
    dragOffset: { x: number; y: number };
    resizeStartSize: { width: number; height: number };
    resizeDirection: string | null;
}

export interface InteractionOptions {
    isEditable: boolean;
    canvasProvider: CanvasProvider;
    onElementUpdate?: (element: UnifiedElement) => void;
    onElementSelect?: (element: UnifiedElement) => void;
}

export interface CanvasProvider {
    getCanvasContainer(): HTMLElement | null;
    getCanvasBounds(): DOMRect | null;
}

export interface PropertyUpdateResult {
    success: boolean;
    element?: UnifiedElement;
    error?: string;
}

export class UnifiedInteractionService {
    private state: InteractionState = {
        isDragging: false,
        isResizing: false,
        dragOffset: { x: 0, y: 0 },
        resizeStartSize: { width: 0, height: 0 },
        resizeDirection: null
    };

    private options: InteractionOptions;
    private currentElement: UnifiedElement | null = null;
    private elementRef: HTMLElement | null = null;

    constructor(options: InteractionOptions) {
        this.options = options;
    }

    /**
     * Inicializa las interacciones para un elemento
     */
    initializeElement(element: UnifiedElement, elementRef: HTMLElement): void {
        this.currentElement = element;
        this.elementRef = elementRef;

        if (!this.options.isEditable) return;

        // Agregar event listeners solo para drag & drop
        elementRef.addEventListener('mousedown', this.handleMouseDown.bind(this));
        // Removido: elementRef.addEventListener('click', this.handleClick.bind(this));
        elementRef.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    }

    /**
     * Limpia las interacciones
     */
    cleanup(): void {
        if (this.elementRef) {
            this.elementRef.removeEventListener('mousedown', this.handleMouseDown.bind(this));
            // Removido: this.elementRef.removeEventListener('click', this.handleClick.bind(this));
            this.elementRef.removeEventListener('dblclick', this.handleDoubleClick.bind(this));
        }
        
        // Limpiar event listeners globales
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    /**
     * Maneja el inicio de interacciones (drag/resize)
     */
    private handleMouseDown(event: MouseEvent): void {
        if (!this.options.isEditable || !this.currentElement) return;

        event.preventDefault();
        event.stopPropagation();

        // Determinar tipo de interacción
        const target = event.target as HTMLElement;
        if (target.classList.contains('resize-handle')) {
            this.startResize(event);
        } else {
            this.startDrag(event);
        }
    }

    /**
     * Inicia el arrastre
     */
    private startDrag(event: MouseEvent): void {
        if (!this.currentElement || !this.elementRef) return;

        const canvas = this.options.canvasProvider.getCanvasContainer();
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const elementRect = this.elementRef.getBoundingClientRect();

        this.state.dragOffset = {
            x: event.clientX - elementRect.left,
            y: event.clientY - elementRect.top,
        };

        this.state.isDragging = true;

        // Emitir selección
        this.options.onElementSelect?.(this.currentElement);

        // Agregar clase visual
        this.elementRef.classList.add('is-dragging');

        // Event listeners globales
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    /**
     * Inicia el redimensionamiento
     */
    private startResize(event: MouseEvent): void {
        if (!this.currentElement || !this.elementRef) return;

        const direction = (event.target as HTMLElement).dataset.direction || 'bottom-right';
        
        this.state.isResizing = true;
        this.state.resizeDirection = direction;
        this.state.resizeStartSize = {
            width: this.currentElement.size?.width || 100,
            height: this.currentElement.size?.height || 100,
        };

        // Event listeners globales
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    /**
     * Maneja el movimiento del mouse
     */
    private handleMouseMove(event: MouseEvent): void {
        if (this.state.isDragging) {
            this.handleDragMove(event);
        } else if (this.state.isResizing) {
            this.handleResizeMove(event);
        }
    }

    /**
     * Maneja el movimiento durante el arrastre
     */
    private handleDragMove(event: MouseEvent): void {
        if (!this.currentElement) return;

        const canvas = this.options.canvasProvider.getCanvasContainer();
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const newPosition = {
            x: event.clientX - canvasRect.left - this.state.dragOffset.x,
            y: event.clientY - canvasRect.top - this.state.dragOffset.y,
        };

        // Mantener dentro de los límites
        const margin = 5;
        const maxX = canvasRect.width - (this.currentElement.size?.width || 100) - margin;
        const maxY = canvasRect.height - (this.currentElement.size?.height || 100) - margin;

        newPosition.x = Math.min(Math.max(margin, newPosition.x), maxX);
        newPosition.y = Math.min(Math.max(margin, newPosition.y), maxY);

        const updatedElement = {
            ...this.currentElement,
            position: newPosition,
            zIndex: 1001,
        };

        this.updateElement(updatedElement);
    }

    /**
     * Maneja el movimiento durante el redimensionamiento
     */
    private handleResizeMove(event: MouseEvent): void {
        if (!this.currentElement) return;

        const deltaX = event.clientX - (event.target as HTMLElement).getBoundingClientRect().left;
        const deltaY = event.clientY - (event.target as HTMLElement).getBoundingClientRect().top;

        let newWidth = this.state.resizeStartSize.width;
        let newHeight = this.state.resizeStartSize.height;
        let newX = this.currentElement.position?.x || 0;
        let newY = this.currentElement.position?.y || 0;

        // Calcular nuevo tamaño según la dirección
        switch (this.state.resizeDirection) {
            case 'bottom-right':
                newWidth += deltaX;
                newHeight += deltaY;
                break;
            case 'bottom-left':
                newWidth -= deltaX;
                newHeight += deltaY;
                newX += deltaX;
                break;
            case 'top-right':
                newWidth += deltaX;
                newHeight -= deltaY;
                newY += deltaY;
                break;
            case 'top-left':
                newWidth -= deltaX;
                newHeight -= deltaY;
                newX += deltaX;
                newY += deltaY;
                break;
        }

        // Aplicar límites mínimos
        const minWidth = 50;
        const minHeight = 30;

        if (newWidth < minWidth) {
            if (this.state.resizeDirection?.includes('left')) {
                newX = (this.currentElement.position?.x || 0) + (this.state.resizeStartSize.width - minWidth);
            }
            newWidth = minWidth;
        }

        if (newHeight < minHeight) {
            if (this.state.resizeDirection?.includes('top')) {
                newY = (this.currentElement.position?.y || 0) + (this.state.resizeStartSize.height - minHeight);
            }
            newHeight = minHeight;
        }

        const updatedElement = {
            ...this.currentElement,
            size: { width: newWidth, height: newHeight },
            position: { x: newX, y: newY },
        };

        this.updateElement(updatedElement);
    }

    /**
     * Maneja el final de las interacciones
     */
    private handleMouseUp(): void {
        if (this.state.isDragging) {
            this.endDrag();
        } else if (this.state.isResizing) {
            this.endResize();
        }

        // Limpiar event listeners globales
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    /**
     * Finaliza el arrastre
     */
    private endDrag(): void {
        if (!this.currentElement || !this.elementRef) return;

        this.state.isDragging = false;

        // Remover clase visual
        this.elementRef.classList.remove('is-dragging');

        // Actualizar z-index final
        const updatedElement = {
            ...this.currentElement,
            zIndex: Math.max(this.currentElement.zIndex || 1, 100)
        };

        this.updateElement(updatedElement);
    }

    /**
     * Finaliza el redimensionamiento
     */
    private endResize(): void {
        if (!this.currentElement) return;

        this.state.isResizing = false;
        this.state.resizeDirection = null;
    }

    /**
     * Maneja clicks en el elemento
     */
    private handleClick(event: MouseEvent): void {
        if (this.state.isDragging || !this.currentElement) return;

        event.preventDefault();
        event.stopPropagation();

        this.options.onElementSelect?.(this.currentElement);
    }

    /**
     * Maneja doble clicks en el elemento
     */
    private handleDoubleClick(event: MouseEvent): void {
        if (this.state.isDragging || !this.currentElement) return;

        event.preventDefault();
        event.stopPropagation();

        // Emitir evento para editar propiedades
        this.options.onElementUpdate?.({
            ...this.currentElement,
            _eventType: 'edit-properties'
        });
    }

    /**
     * Actualiza un elemento
     */
    private updateElement(element: UnifiedElement): void {
        this.currentElement = element;
        this.options.onElementUpdate?.(element);
    }

    /**
     * Actualiza propiedades de un elemento
     */
    updateElementProperties(elementId: string, properties: Record<string, any>): PropertyUpdateResult {
        if (!this.currentElement || this.currentElement.id !== elementId) {
            return { success: false, error: 'Element not found' };
        }

        try {
            const updatedElement = {
                ...this.currentElement,
                props: {
                    ...this.currentElement.props,
                    ...properties
                }
            };

            this.currentElement = updatedElement;
            this.options.onElementUpdate?.(updatedElement);

            return { success: true, element: updatedElement };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Obtiene el estado actual de las interacciones
     */
    getState(): InteractionState {
        return { ...this.state };
    }

    /**
     * Verifica si está en modo de edición
     */
    isEditable(): boolean {
        return this.options.isEditable;
    }
} 