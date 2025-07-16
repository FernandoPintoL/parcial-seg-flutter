// services/DiagramProcessingService.ts
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import type { DiagramData, ParsedDiagramElement, UnifiedElement } from '@/types/PizarraUnificada';

export class DiagramProcessingService {
    private static readonly SCANNER_API_URL = import.meta.env.VITE_URL_SCANNER || 'http://localhost:5000';

    /**
     * Procesa una imagen de diagrama de clases
     * @param imageFile Archivo de imagen
     * @param widgetIdCounter Contador para IDs únicos
     * @returns Datos del diagrama procesado
     */
    static async processImageDiagram(
        imageFile: File,
        widgetIdCounter: number
    ): Promise<{ success: boolean; data?: DiagramData; error?: string }> {
        try {
            await AlertService.prototype.info('Procesando', 'Analizando diagrama de clases...');

            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('type', 'class_diagram');

            const response = await axios.post(`${this.SCANNER_API_URL}/api/diagram/process`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                const diagramData: DiagramData = {
                    type: 'class',
                    source: 'image',
                    content: response.data.analysis,
                    elements: response.data.elements || []
                };

                return {
                    success: true,
                    data: diagramData
                };
            } else {
                return {
                    success: false,
                    error: response.data.error || 'Error al procesar el diagrama'
                };
            }
        } catch (error: any) {
            console.error('Error processing image diagram:', error);
            return {
                success: false,
                error: error.message || 'Error al procesar el diagrama de imagen'
            };
        }
    }

    /**
     * Procesa un archivo XML de diagrama de clases
     * @param xmlContent Contenido XML
     * @returns Datos del diagrama procesado
     */
    static async processXMLDiagram(xmlContent: string): Promise<{ success: boolean; data?: DiagramData; error?: string }> {
        try {
            await AlertService.prototype.info('Procesando', 'Analizando diagrama XML...');

            const response = await axios.post(`${this.SCANNER_API_URL}/api/diagram/xml`, {
                xml_content: xmlContent,
                type: 'class_diagram'
            });

            if (response.data.success) {
                const diagramData: DiagramData = {
                    type: 'class',
                    source: 'xml',
                    content: xmlContent,
                    elements: response.data.elements || []
                };

                return {
                    success: true,
                    data: diagramData
                };
            } else {
                return {
                    success: false,
                    error: response.data.error || 'Error al procesar el diagrama XML'
                };
            }
        } catch (error: any) {
            console.error('Error processing XML diagram:', error);
            return {
                success: false,
                error: error.message || 'Error al procesar el diagrama XML'
            };
        }
    }

    /**
     * Procesa un archivo PlantUML de diagrama de clases
     * @param plantUMLContent Contenido PlantUML
     * @returns Datos del diagrama procesado
     */
    static async processPlantUMLDiagram(plantUMLContent: string): Promise<{ success: boolean; data?: DiagramData; error?: string }> {
        try {
            await AlertService.prototype.info('Procesando', 'Analizando diagrama PlantUML...');

            const response = await axios.post(`${this.SCANNER_API_URL}/api/diagram/plantuml`, {
                plantuml_content: plantUMLContent,
                type: 'class_diagram'
            });

            if (response.data.success) {
                const diagramData: DiagramData = {
                    type: 'class',
                    source: 'plantuml',
                    content: plantUMLContent,
                    elements: response.data.elements || []
                };

                return {
                    success: true,
                    data: diagramData
                };
            } else {
                return {
                    success: false,
                    error: response.data.error || 'Error al procesar el diagrama PlantUML'
                };
            }
        } catch (error: any) {
            console.error('Error processing PlantUML diagram:', error);
            return {
                success: false,
                error: error.message || 'Error al procesar el diagrama PlantUML'
            };
        }
    }

    /**
     * Convierte elementos del diagrama a elementos unificados
     * @param diagramElements Elementos del diagrama parseados
     * @param framework Framework objetivo
     * @param widgetIdCounter Contador para IDs únicos
     * @returns Elementos unificados
     */
    static convertDiagramToUnifiedElements(
        diagramElements: ParsedDiagramElement[],
        framework: 'flutter' | 'angular' | 'both',
        widgetIdCounter: number
    ): UnifiedElement[] {
        const unifiedElements: UnifiedElement[] = [];

        diagramElements.forEach((element) => {
            // Crear elemento principal (clase, interfaz, etc.)
            const mainElement: UnifiedElement = {
                id: `diagram-${widgetIdCounter++}`,
                type: this.getElementType(element.type, framework),
                framework: framework,
                props: {
                    name: element.name,
                    type: element.type,
                    properties: element.properties,
                    methods: element.methods,
                    relationships: element.relationships
                },
                children: []
            };

            // Generar propiedades como elementos hijo
            element.properties.forEach((prop) => {
                const propElement: UnifiedElement = {
                    id: `property-${widgetIdCounter++}`,
                    type: this.getPropertyType(prop.type, framework),
                    framework: framework,
                    props: {
                        name: prop.name,
                        type: prop.type,
                        visibility: prop.visibility,
                        isStatic: prop.isStatic,
                        defaultValue: prop.defaultValue
                    },
                    children: []
                };
                mainElement.children.push(propElement);
            });

            // Generar métodos como elementos hijo
            element.methods.forEach((method) => {
                const methodElement: UnifiedElement = {
                    id: `method-${widgetIdCounter++}`,
                    type: this.getMethodType(method.returnType, framework),
                    framework: framework,
                    props: {
                        name: method.name,
                        returnType: method.returnType,
                        parameters: method.parameters,
                        visibility: method.visibility,
                        isStatic: method.isStatic,
                        isAbstract: method.isAbstract
                    },
                    children: []
                };
                mainElement.children.push(methodElement);
            });

            unifiedElements.push(mainElement);
        });

        return unifiedElements;
    }

    /**
     * Obtiene el tipo de elemento para el framework específico
     */
    private static getElementType(diagramType: string, framework: 'flutter' | 'angular' | 'both'): string {
        if (framework === 'flutter') {
            switch (diagramType) {
                case 'class':
                    return 'StatelessWidget';
                case 'interface':
                    return 'abstract class';
                case 'enum':
                    return 'enum';
                default:
                    return 'Container';
            }
        } else if (framework === 'angular') {
            switch (diagramType) {
                case 'class':
                    return 'component';
                case 'interface':
                    return 'interface';
                case 'enum':
                    return 'enum';
                default:
                    return 'div';
            }
        } else {
            return 'container';
        }
    }

    /**
     * Obtiene el tipo de propiedad para el framework específico
     */
    private static getPropertyType(propType: string, framework: 'flutter' | 'angular' | 'both'): string {
        if (framework === 'flutter') {
            switch (propType.toLowerCase()) {
                case 'string':
                    return 'Text';
                case 'int':
                case 'double':
                case 'number':
                    return 'TextField';
                case 'bool':
                case 'boolean':
                    return 'Checkbox';
                case 'list':
                case 'array':
                    return 'ListView';
                default:
                    return 'Container';
            }
        } else if (framework === 'angular') {
            switch (propType.toLowerCase()) {
                case 'string':
                    return 'input';
                case 'int':
                case 'double':
                case 'number':
                    return 'number';
                case 'bool':
                case 'boolean':
                    return 'checkbox';
                case 'list':
                case 'array':
                    return 'select';
                default:
                    return 'div';
            }
        } else {
            return 'container';
        }
    }

    /**
     * Obtiene el tipo de método para el framework específico
     */
    private static getMethodType(returnType: string, framework: 'flutter' | 'angular' | 'both'): string {
        if (framework === 'flutter') {
            return 'ElevatedButton';
        } else if (framework === 'angular') {
            return 'button';
        } else {
            return 'button';
        }
    }
}
