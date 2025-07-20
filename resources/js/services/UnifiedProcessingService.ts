// services/UnifiedProcessingService.ts
import type { UnifiedElement } from '@/Data/PizarraUnificada';
import { UnifiedWidgetService } from './UnifiedWidgetService';
import { JsonUtils } from '@/utils/JsonUtils';

export interface ProcessingResult {
    success: boolean;
    message: string;
    elements?: UnifiedElement[];
    error?: string;
}

export interface ImageProcessingOptions {
    selectedImage: File | null;
    framework: 'flutter' | 'angular' | 'both';
    canvasWidth?: number;
}

export interface DiagramProcessingOptions {
    selectedFile: File | null;
    diagramContent: string;
    diagramType: string;
    framework: 'flutter' | 'angular' | 'both';
    canvasWidth?: number;
}

export class UnifiedProcessingService {
    private apiEndpoint = '/api/process-image';
    private diagramEndpoint = '/api/process-diagram';

    /**
     * Procesa una imagen y genera widgets
     */
    async processImage(options: ImageProcessingOptions): Promise<ProcessingResult> {
        try {
            console.log('🖼️ Processing image:', options.selectedImage?.name);

            if (!options.selectedImage) {
                return { success: false, message: 'No image selected' };
            }

            const formData = new FormData();
            formData.append('image', options.selectedImage);
            formData.append('framework', options.framework);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': this.getCSRFToken(),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Image processing response:', data);

            if (data.success && data.widgets) {
                const elements = this.convertWidgetsToElements(data.widgets, options.framework, options.canvasWidth);
                return {
                    success: true,
                    message: 'Image processed successfully',
                    elements
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to process image',
                    error: data.error
                };
            }
        } catch (error) {
            console.error('❌ Error processing image:', error);
            return {
                success: false,
                message: 'Error processing image',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Procesa un diagrama y genera widgets
     */
    async processDiagram(options: DiagramProcessingOptions): Promise<ProcessingResult> {
        try {
            console.log('📊 Processing diagram:', options.selectedFile?.name, 'Type:', options.diagramType);

            if (!options.selectedFile && !options.diagramContent) {
                return { success: false, message: 'No diagram content provided' };
            }

            const formData = new FormData();
            if (options.selectedFile) {
                formData.append('file', options.selectedFile);
            }
            formData.append('content', options.diagramContent);
            formData.append('type', options.diagramType);
            formData.append('framework', options.framework);

            const response = await fetch(this.diagramEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': this.getCSRFToken(),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Diagram processing response:', data);

            if (data.success && data.widgets) {
                const elements = this.convertWidgetsToElements(data.widgets, options.framework, options.canvasWidth);
                return {
                    success: true,
                    message: 'Diagram processed successfully',
                    elements
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to process diagram',
                    error: data.error
                };
            }
        } catch (error) {
            console.error('❌ Error processing diagram:', error);
            return {
                success: false,
                message: 'Error processing diagram',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Procesa código y genera widgets
     */
    async processCode(code: string, framework: 'flutter' | 'angular' | 'both', canvasWidth?: number): Promise<ProcessingResult> {
        try {
            console.log('💻 Processing code for framework:', framework);

            const response = await fetch('/api/process-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.getCSRFToken(),
                },
                body: JSON.stringify({
                    code,
                    framework
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Code processing response:', data);

            if (data.success && data.widgets) {
                const elements = this.convertWidgetsToElements(data.widgets, framework, canvasWidth);
                return {
                    success: true,
                    message: 'Code processed successfully',
                    elements
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to process code',
                    error: data.error
                };
            }
        } catch (error) {
            console.error('❌ Error processing code:', error);
            return {
                success: false,
                message: 'Error processing code',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Convierte widgets de respuesta a elementos unificados
     */
    private convertWidgetsToElements(widgets: any[], framework: 'flutter' | 'angular' | 'both', canvasWidth?: number): UnifiedElement[] {
        const elements: UnifiedElement[] = [];
        let currentY = 120;

        widgets.forEach((widget, index) => {
            try {
                const position = {
                    x: 120,
                    y: currentY + (index * 80) // Espaciado vertical entre elementos
                };

                const element = UnifiedWidgetService.createElement(
                    widget.type || 'Container',
                    framework === 'both' ? 'flutter' : framework,
                    position,
                    canvasWidth
                );

                if (element && widget.properties) {
                    // Aplicar propiedades específicas del widget
                    element.props = {
                        ...element.props,
                        ...widget.properties
                    };
                }

                if (element) {
                    elements.push(element);
                }
            } catch (error) {
                console.error('❌ Error converting widget to element:', widget, error);
            }
        });

        console.log('✅ Converted widgets to elements:', elements.length);
        return elements;
    }

    /**
     * Procesa widgets desde el chat de IA
     */
    processAIWidgets(widgets: any[], framework: 'flutter' | 'angular' | 'both', canvasWidth?: number): UnifiedElement[] {
        console.log('🤖 Processing AI widgets:', widgets.length, 'for framework:', framework);
        return this.convertWidgetsToElements(widgets, framework, canvasWidth);
    }

    /**
     * Procesa widgets desde el escaneo de imágenes
     */
    processImageScanResults(data: any, framework: 'flutter' | 'angular' | 'both', canvasWidth?: number): UnifiedElement[] {
        try {
            console.log('🔍 Processing image scan results:', data);

            if (!data || !data.predictions) {
                console.warn('⚠️ No predictions found in scan results');
                return [];
            }

            const widgets = data.predictions.map((prediction: any) => {
                // Mapear predicciones a tipos de widgets
                const widgetType = this.mapPredictionToWidgetType(prediction);
                const properties = this.extractPropertiesFromPrediction(prediction);

                return {
                    type: widgetType,
                    properties
                };
            });

            return this.convertWidgetsToElements(widgets, framework, canvasWidth);
        } catch (error) {
            console.error('❌ Error processing image scan results:', error);
            return [];
        }
    }

    /**
     * Mapea predicciones de IA a tipos de widgets
     */
    private mapPredictionToWidgetType(prediction: any): string {
        const classMap: Record<string, string> = {
            'button': 'ElevatedButton',
            'text_field': 'TextField',
            'text': 'Text',
            'image': 'Image',
            'card': 'Card',
            'container': 'Container',
            'row': 'Row',
            'column': 'Column',
            'app_bar': 'AppBar',
            'scaffold': 'Scaffold',
            'list_view': 'ListView',
            'checkbox': 'Checkbox',
            'radio': 'Radio',
            'switch': 'Switch',
            'slider': 'Slider',
            'dropdown': 'DropdownButton',
            'icon': 'Icon',
            'floating_action_button': 'FloatingActionButton',
            'drawer': 'Drawer',
            'bottom_navigation_bar': 'BottomNavigationBar',
        };

        const className = prediction.class?.toLowerCase() || '';
        return classMap[className] || 'Container';
    }

    /**
     * Extrae propiedades de una predicción
     */
    private extractPropertiesFromPrediction(prediction: any): Record<string, any> {
        const properties: Record<string, any> = {};

        // Extraer texto si está disponible
        if (prediction.text) {
            properties.label = prediction.text;
            properties.hint = prediction.text;
        }

        // Extraer confianza
        if (prediction.confidence) {
            properties.confidence = prediction.confidence;
        }

        // Extraer coordenadas si están disponibles
        if (prediction.x && prediction.y) {
            properties.x = prediction.x;
            properties.y = prediction.y;
        }

        // Extraer dimensiones si están disponibles
        if (prediction.width && prediction.height) {
            properties.width = prediction.width;
            properties.height = prediction.height;
        }

        return properties;
    }

    /**
     * Obtiene el token CSRF
     */
    private getCSRFToken(): string {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        return token || '';
    }

    /**
     * Valida un archivo de imagen
     */
    validateImageFile(file: File): boolean {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            console.error('❌ Invalid image type:', file.type);
            return false;
        }

        if (file.size > maxSize) {
            console.error('❌ Image file too large:', file.size);
            return false;
        }

        return true;
    }

    /**
     * Valida un archivo de diagrama
     */
    validateDiagramFile(file: File): boolean {
        const validTypes = [
            'application/json',
            'text/plain',
            'application/xml',
            'text/xml',
            'image/svg+xml'
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            console.error('❌ Invalid diagram file type:', file.type);
            return false;
        }

        if (file.size > maxSize) {
            console.error('❌ Diagram file too large:', file.size);
            return false;
        }

        return true;
    }
}

// Instancia global del servicio
export const unifiedProcessingService = new UnifiedProcessingService(); 