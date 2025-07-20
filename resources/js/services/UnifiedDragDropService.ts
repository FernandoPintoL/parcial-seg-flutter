// services/UnifiedDragDropService.ts
import type { UnifiedElement } from '@/Data/PizarraUnificada';

export interface DragState {
    isDragging: boolean;
    isResizing: boolean;
    dragOffset: { x: number; y: number };
    resizeStartSize: { width: number; height: number };
    dragOverElementId: string | null;
}

export interface DropEvent {
    widgetType: string;
    position: { x: number; y: number };
    targetElementId?: string | null;
    canvasWidth?: number;
}

export interface DragDropHandler {
    onDragStart?: (event: DragEvent, element: UnifiedElement) => void;
    onDragEnd?: (event: DragEvent, element: UnifiedElement) => void;
    onDragMove?: (event: MouseEvent, element: UnifiedElement) => UnifiedElement | null;
    onResize?: (event: MouseEvent, direction: string, element: UnifiedElement) => UnifiedElement | null;
}

export interface CanvasProvider {
    getCanvasContainer(): HTMLElement | null;
    getCanvasBounds(): DOMRect | null;
}

export class UnifiedDragDropService {
    private dragState: DragState = {
        isDragging: false,
        isResizing: false,
        dragOffset: { x: 0, y: 0 },
        resizeStartSize: { width: 0, height: 0 },
        dragOverElementId: null
    };

    private canvasProvider: CanvasProvider;
    private dragDropHandler?: DragDropHandler;

    constructor(canvasProvider: CanvasProvider, dragDropHandler?: DragDropHandler) {
        this.canvasProvider = canvasProvider;
        this.dragDropHandler = dragDropHandler;
    }

    /**
     * Inicializa el drag & drop para un elemento
     */
    initializeDragDrop(elementRef: HTMLElement, element: UnifiedElement, isEditable: boolean = true) {
        if (!isEditable) return;

        elementRef.addEventListener('mousedown', (event) => this.handleMouseDown(event, element));
        elementRef.addEventListener('dragstart', (event: DragEvent) => this.handleDragStart(event, element.type));
        elementRef.addEventListener('dragend', (event: DragEvent) => this.handleDragEnd());
        elementRef.addEventListener('dragover', (event) => this.handleDragOver(event));
        elementRef.addEventListener('dragleave', (event) => this.handleDragLeave(event));
        elementRef.addEventListener('drop', (event) => this.handleDrop(event));
    }

    /**
     * Maneja el inicio del arrastre
     */
    handleMouseDown(event: MouseEvent, element: UnifiedElement) {
        event.preventDefault();
        event.stopPropagation();

        const canvas = this.canvasProvider.getCanvasContainer();
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const elementRect = (event.target as HTMLElement).getBoundingClientRect();

        this.dragState.dragOffset = {
            x: event.clientX - elementRect.left,
            y: event.clientY - elementRect.top,
        };

        this.dragState.isDragging = true;

        // Notificar al handler personalizado si existe
        this.dragDropHandler?.onDragStart?.(event as any, element);

        document.addEventListener('mousemove', (e) => this.handleMouseMove(e, element));
        document.addEventListener('mouseup', () => this.handleMouseUp(element));

        return this.dragState;
    }

    /**
     * Maneja el movimiento del mouse durante el arrastre
     */
    handleMouseMove(event: MouseEvent, element: UnifiedElement) {
        if (!this.dragState.isDragging) return;

        const canvas = this.canvasProvider.getCanvasContainer();
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const newPosition = {
            x: event.clientX - canvasRect.left - this.dragState.dragOffset.x,
            y: event.clientY - canvasRect.top - this.dragState.dragOffset.y,
        };

        // Mantener dentro de los límites
        const margin = 5;
        const maxX = canvasRect.width - (element.size?.width || 100) - margin;
        const maxY = canvasRect.height - (element.size?.height || 100) - margin;

        newPosition.x = Math.min(Math.max(margin, newPosition.x), maxX);
        newPosition.y = Math.min(Math.max(margin, newPosition.y), maxY);

        const updatedElement = {
            ...element,
            position: newPosition,
            zIndex: 1001,
        };

        // Notificar al handler personalizado si existe
        this.dragDropHandler?.onDragMove?.(event, updatedElement);

        return updatedElement;
    }

    /**
     * Maneja el final del arrastre
     */
    handleMouseUp(element: UnifiedElement) {
        document.removeEventListener('mousemove', (e) => this.handleMouseMove(e, element));
        document.removeEventListener('mouseup', () => this.handleMouseUp(element));

        if (this.dragState.isDragging) {
            this.dragState.isDragging = false;
            
            const updatedElement = {
                ...element,
                zIndex: Math.max(element.zIndex || 1, 100)
            };

            // Notificar al handler personalizado si existe
            this.dragDropHandler?.onDragEnd?.({} as DragEvent, updatedElement);

            return updatedElement;
        }

        return element;
    }

    /**
     * Maneja el inicio del drag desde la paleta
     */
    handleDragStart(event: DragEvent, widgetType: string) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('widget-type', widgetType);
            event.dataTransfer.effectAllowed = 'copy';
        }
    }

    /**
     * Maneja el final del drag desde la paleta
     */
    handleDragEnd() {
        this.dragState.isDragging = false;
    }

    /**
     * Maneja el drag over
     */
    handleDragOver(event: DragEvent) {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) {
            target.classList.add('dragover');
            this.dragState.dragOverElementId = target.dataset.elementId || null;
        }
    }

    /**
     * Maneja el drag leave
     */
    handleDragLeave(event: DragEvent) {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) {
            target.classList.remove('dragover');
            this.dragState.dragOverElementId = null;
        }
    }

    /**
     * Maneja el drop
     */
    handleDrop(event: DragEvent): DropEvent | null {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) {
            target.classList.remove('dragover');
        }

        const widgetType = event.dataTransfer?.getData('widget-type');
        if (!widgetType) return null;

        const canvasContainer = this.canvasProvider.getCanvasContainer();
        const canvasWidth = canvasContainer ? canvasContainer.clientWidth : 400;

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const position = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        return {
            widgetType,
            position,
            targetElementId: this.dragState.dragOverElementId,
            canvasWidth
        };
    }

    /**
     * Maneja el redimensionamiento
     */
    handleResizeStart(event: MouseEvent, direction: string, element: UnifiedElement) {
        event.preventDefault();
        event.stopPropagation();

        this.dragState.isResizing = true;
        this.dragState.resizeStartSize = {
            width: element.size?.width || 100,
            height: element.size?.height || 100,
        };

        const startPosition = { x: element.position?.x || 0, y: element.position?.y || 0 };

        const handleResizeMove = (e: MouseEvent) => {
            if (!this.dragState.isResizing) return;

            const deltaX = e.clientX - event.clientX;
            const deltaY = e.clientY - event.clientY;

            let newWidth = this.dragState.resizeStartSize.width;
            let newHeight = this.dragState.resizeStartSize.height;
            let newX = startPosition.x;
            let newY = startPosition.y;

            // Manejar cambios de tamaño según la dirección
            switch (direction) {
                case 'top-left':
                    newWidth -= deltaX;
                    newHeight -= deltaY;
                    newX += deltaX;
                    newY += deltaY;
                    break;
                case 'top-right':
                    newWidth += deltaX;
                    newHeight -= deltaY;
                    newY += deltaY;
                    break;
                case 'bottom-left':
                    newWidth -= deltaX;
                    newHeight += deltaY;
                    newX += deltaX;
                    break;
                case 'bottom-right':
                    newWidth += deltaX;
                    newHeight += deltaY;
                    break;
                case 'top':
                    newHeight -= deltaY;
                    newY += deltaY;
                    break;
                case 'bottom':
                    newHeight += deltaY;
                    break;
                case 'left':
                    newWidth -= deltaX;
                    newX += deltaX;
                    break;
                case 'right':
                    newWidth += deltaX;
                    break;
            }

            // Aplicar límites mínimos
            const minWidth = 50;
            const minHeight = 30;

            if (newWidth < minWidth) {
                if (direction.includes('left')) {
                    newX = startPosition.x + (this.dragState.resizeStartSize.width - minWidth);
                }
                newWidth = minWidth;
            }

            if (newHeight < minHeight) {
                if (direction.includes('top')) {
                    newY = startPosition.y + (this.dragState.resizeStartSize.height - minHeight);
                }
                newHeight = minHeight;
            }

            const updatedElement = {
                ...element,
                size: { width: newWidth, height: newHeight },
                position: { x: newX, y: newY },
            };

            // Notificar al handler personalizado si existe
            this.dragDropHandler?.onResize?.(e, direction, updatedElement);

            return updatedElement;
        };

        const handleResizeEnd = () => {
            this.dragState.isResizing = false;
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }

    /**
     * Obtiene el estado actual del drag
     */
    getDragState(): DragState {
        return { ...this.dragState };
    }

    /**
     * Limpia el estado del drag
     */
    cleanup() {
        this.dragState = {
            isDragging: false,
            isResizing: false,
            dragOffset: { x: 0, y: 0 },
            resizeStartSize: { width: 0, height: 0 },
            dragOverElementId: null
        };
    }
}

// Implementación por defecto del CanvasProvider
class DefaultCanvasProvider implements CanvasProvider {
    getCanvasContainer(): HTMLElement | null {
        return document.querySelector('.unified-canvas') ||
               document.querySelector('.canvas-container') ||
               document.querySelector('.phone-content-area') ||
               document.querySelector('.canvas-content');
    }

    getCanvasBounds(): DOMRect | null {
        const container = this.getCanvasContainer();
        return container ? container.getBoundingClientRect() : null;
    }
}

// Instancia global del servicio con implementación por defecto
export const unifiedDragDropService = new UnifiedDragDropService(new DefaultCanvasProvider()); 