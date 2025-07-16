// services/UnifiedWidgetService.ts
import type { UnifiedElement, UnifiedScreen } from '@/Data/PizarraUnificada';
import { availableFlutterWidgets } from '@/Data/availableFlutterWidgets';

export class UnifiedWidgetService {

    /**
     * Obtiene los widgets disponibles para el framework seleccionado
     * @param framework Framework seleccionado
     * @returns Lista de widgets disponibles
     */
    static getAvailableWidgets(framework: 'flutter' | 'angular' | 'both'): any[] {
        if (framework === 'flutter') {
            return availableFlutterWidgets;
        } else if (framework === 'angular') {
            return this.getAngularWidgets();
        } else {
            return [...availableFlutterWidgets, ...this.getAngularWidgets()];
        }
    }

    /**
     * Obtiene widgets disponibles para Angular
     */
    private static getAngularWidgets(): any[] {
        return [
            {
                type: 'input',
                name: 'Input',
                icon: 'text_fields',
                category: 'input',
                framework: 'angular',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Input Label' },
                    { name: 'placeholder', type: 'string', defaultValue: 'Enter text...' },
                    { name: 'type', type: 'select', options: ['text', 'email', 'password', 'number', 'tel', 'url'], defaultValue: 'text' },
                    { name: 'required', type: 'boolean', defaultValue: false },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                    { name: 'readonly', type: 'boolean', defaultValue: false }
                ]
            },
            {
                type: 'textarea',
                name: 'Textarea',
                icon: 'text_fields',
                category: 'input',
                framework: 'angular',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Textarea Label' },
                    { name: 'placeholder', type: 'string', defaultValue: 'Enter text...' },
                    { name: 'rows', type: 'number', defaultValue: 3 },
                    { name: 'required', type: 'boolean', defaultValue: false },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                    { name: 'readonly', type: 'boolean', defaultValue: false }
                ]
            },
            {
                type: 'select',
                name: 'Select',
                icon: 'arrow_drop_down',
                category: 'input',
                framework: 'angular',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Select Label' },
                    { name: 'options', type: 'array', defaultValue: ['Option 1', 'Option 2', 'Option 3'] },
                    { name: 'required', type: 'boolean', defaultValue: false },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                    { name: 'multiple', type: 'boolean', defaultValue: false }
                ]
            },
            {
                type: 'checkbox',
                name: 'Checkbox',
                icon: 'check_box',
                category: 'input',
                framework: 'angular',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Checkbox Label' },
                    { name: 'checked', type: 'boolean', defaultValue: false },
                    { name: 'disabled', type: 'boolean', defaultValue: false }
                ]
            },
            {
                type: 'radio',
                name: 'Radio Group',
                icon: 'radio_button_checked',
                category: 'input',
                framework: 'angular',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Radio Label' },
                    { name: 'options', type: 'array', defaultValue: ['Option 1', 'Option 2', 'Option 3'] },
                    { name: 'required', type: 'boolean', defaultValue: false },
                    { name: 'disabled', type: 'boolean', defaultValue: false }
                ]
            },
            {
                type: 'button',
                name: 'Button',
                icon: 'smart_button',
                category: 'input',
                framework: 'angular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Button' },
                    { name: 'type', type: 'select', options: ['button', 'submit', 'reset'], defaultValue: 'button' },
                    { name: 'variant', type: 'select', options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'], defaultValue: 'primary' },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                    { name: 'action', type: 'string', defaultValue: 'onClick' }
                ]
            },
            {
                type: 'div',
                name: 'Div Container',
                icon: 'crop_square',
                category: 'layout',
                framework: 'angular',
                properties: [
                    { name: 'content', type: 'string', defaultValue: 'Div Content' },
                    { name: 'class', type: 'string', defaultValue: 'container' }
                ]
            },
            {
                type: 'h1',
                name: 'Heading 1',
                icon: 'title',
                category: 'display',
                framework: 'angular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Heading 1' }
                ]
            },
            {
                type: 'h2',
                name: 'Heading 2',
                icon: 'title',
                category: 'display',
                framework: 'angular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Heading 2' }
                ]
            },
            {
                type: 'h3',
                name: 'Heading 3',
                icon: 'title',
                category: 'display',
                framework: 'angular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Heading 3' }
                ]
            },
            {
                type: 'p',
                name: 'Paragraph',
                icon: 'text_fields',
                category: 'display',
                framework: 'angular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Paragraph text' }
                ]
            },
            {
                type: 'span',
                name: 'Span',
                icon: 'text_fields',
                category: 'display',
                framework: 'angular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Span text' }
                ]
            },
            {
                type: 'table',
                name: 'Table',
                icon: 'table_chart',
                category: 'display',
                framework: 'angular',
                properties: [
                    { name: 'headers', type: 'array', defaultValue: ['Header 1', 'Header 2', 'Header 3'] },
                    { name: 'rows', type: 'array', defaultValue: [['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3']] },
                    { name: 'striped', type: 'boolean', defaultValue: false },
                    { name: 'bordered', type: 'boolean', defaultValue: true },
                    { name: 'hover', type: 'boolean', defaultValue: false }
                ]
            }
        ];
    }

    /**
     * Crea un nuevo elemento unificado
     * @param widgetType Tipo de widget
     * @param framework Framework objetivo
     * @param availableWidgets Lista de widgets disponibles
     * @returns Elemento unificado creado
     */
    static createUnifiedElement(
        widgetType: string,
        framework: 'flutter' | 'angular' | 'both',
        availableWidgets: any[]
    ): UnifiedElement | null {
        const widgetDefinition = availableWidgets.find(w => w.type === widgetType);
        if (!widgetDefinition) {
            console.error(`Widget type ${widgetType} not found`);
            return null;
        }

        const element: UnifiedElement = {
            id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: widgetType,
            framework: framework,
            props: {},
            children: []
        };

        // Inicializar propiedades con valores por defecto
        if (widgetDefinition.properties) {
            widgetDefinition.properties.forEach((prop: any) => {
                element.props[prop.name] = prop.defaultValue;
            });
        }

        // Generar código inicial
        element.code_string = this.generateElementCode(element, framework);

        return element;
    }

    /**
     * Convierte un elemento Flutter a elemento unificado
     * @param flutterElement Elemento Flutter
     * @returns Elemento unificado
     */
    static convertFlutterToUnified(flutterElement: any): UnifiedElement {
        return {
            id: flutterElement.id || `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: flutterElement.type,
            framework: 'flutter',
            props: flutterElement.props || {},
            children: flutterElement.children?.map((child: any) => this.convertFlutterToUnified(child)) || [],
            code_string: flutterElement.code_string,
            position: flutterElement.position
        };
    }

    /**
     * Convierte un elemento Angular a elemento unificado
     * @param angularElement Elemento Angular
     * @returns Elemento unificado
     */
    static convertAngularToUnified(angularElement: any): UnifiedElement {
        return {
            id: angularElement.id || `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: angularElement.type,
            framework: 'angular',
            props: angularElement.props || {},
            children: angularElement.children?.map((child: any) => this.convertAngularToUnified(child)) || [],
            code_string: angularElement.code_string,
            position: angularElement.position
        };
    }

    /**
     * Convierte un elemento unificado a elemento Flutter
     * @param unifiedElement Elemento unificado
     * @returns Elemento Flutter
     */
    static convertUnifiedToFlutter(unifiedElement: UnifiedElement): any {
        return {
            id: unifiedElement.id,
            type: unifiedElement.type,
            props: unifiedElement.props,
            children: unifiedElement.children.map(child => this.convertUnifiedToFlutter(child)),
            code_string: unifiedElement.code_string,
            position: unifiedElement.position
        };
    }

    /**
     * Convierte un elemento unificado a elemento Angular
     * @param unifiedElement Elemento unificado
     * @returns Elemento Angular
     */
    static convertUnifiedToAngular(unifiedElement: UnifiedElement): any {
        return {
            id: unifiedElement.id,
            type: unifiedElement.type,
            props: unifiedElement.props,
            children: unifiedElement.children.map(child => this.convertUnifiedToAngular(child)),
            code_string: unifiedElement.code_string,
            position: unifiedElement.position
        };
    }

    /**
     * Genera código para un elemento según el framework
     * @param element Elemento unificado
     * @param framework Framework objetivo
     * @returns Código generado
     */
    static generateElementCode(element: UnifiedElement, framework: 'flutter' | 'angular' | 'both'): string {
        if (framework === 'flutter') {
            return this.generateFlutterElementCode(element);
        } else if (framework === 'angular') {
            return this.generateAngularElementCode(element);
        } else {
            return `${this.generateFlutterElementCode(element)}\n\n${this.generateAngularElementCode(element)}`;
        }
    }

    /**
     * Genera código Flutter para un elemento
     * @param element Elemento unificado
     * @returns Código Flutter
     */
    private static generateFlutterElementCode(element: UnifiedElement): string {
        let code = `${element.type}(\n`;

        // Agregar propiedades
        Object.entries(element.props).forEach(([key, value]) => {
            if (typeof value === 'string' && !value.includes('(')) {
                code += `  ${key}: "${value}",\n`;
            } else {
                code += `  ${key}: ${value},\n`;
            }
        });

        // Agregar children si existen
        if (element.children && element.children.length > 0) {
            code += `  children: [\n`;
            element.children.forEach(child => {
                const childCode = this.generateFlutterElementCode(child);
                code += `    ${childCode},\n`;
            });
            code += `  ],\n`;
        }

        code += `)`;
        return code;
    }

    /**
     * Genera código Angular para un elemento
     * @param element Elemento unificado
     * @returns Código Angular
     */
    private static generateAngularElementCode(element: UnifiedElement): string {
        switch (element.type) {
            case 'input':
                return `<input type="${element.props.type || 'text'}" class="form-control" placeholder="${element.props.placeholder || ''}" ${element.props.required ? 'required' : ''} />`;

            case 'textarea':
                return `<textarea class="form-control" placeholder="${element.props.placeholder || ''}" rows="${element.props.rows || 3}" ${element.props.required ? 'required' : ''}></textarea>`;

            case 'select':
                const options = element.props.options || [];
                const optionsHtml = options.map((option: string) => `<option value="${option}">${option}</option>`).join('');
                return `<select class="form-select" ${element.props.required ? 'required' : ''}>${optionsHtml}</select>`;

            case 'button':
                return `<button type="${element.props.type || 'button'}" class="btn btn-${element.props.variant || 'primary'}">${element.props.text || 'Button'}</button>`;

            case 'div':
                return `<div class="${element.props.class || ''}">${element.props.content || ''}</div>`;

            case 'h1':
            case 'h2':
            case 'h3':
                return `<${element.type}>${element.props.text || ''}</${element.type}>`;

            case 'p':
                return `<p>${element.props.text || ''}</p>`;

            case 'span':
                return `<span>${element.props.text || ''}</span>`;

            default:
                return `<div>${element.props.text || element.props.content || ''}</div>`;
        }
    }

    /**
     * Actualiza las propiedades de un elemento
     * @param element Elemento a actualizar
     * @param propertyName Nombre de la propiedad
     * @param value Nuevo valor
     * @param framework Framework objetivo
     */
    static updateElementProperty(
        element: UnifiedElement,
        propertyName: string,
        value: any,
        framework: 'flutter' | 'angular' | 'both'
    ): void {
        element.props[propertyName] = value;
        element.code_string = this.generateElementCode(element, framework);
    }

    /**
     * Agrega un elemento hijo a un elemento padre
     * @param parentElement Elemento padre
     * @param childElement Elemento hijo
     * @param framework Framework objetivo
     */
    static addChildElement(
        parentElement: UnifiedElement,
        childElement: UnifiedElement,
        framework: 'flutter' | 'angular' | 'both'
    ): void {
        parentElement.children.push(childElement);
        parentElement.code_string = this.generateElementCode(parentElement, framework);
    }

    /**
     * Elimina un elemento hijo de un elemento padre
     * @param parentElement Elemento padre
     * @param childId ID del elemento hijo a eliminar
     * @param framework Framework objetivo
     */
    static removeChildElement(
        parentElement: UnifiedElement,
        childId: string,
        framework: 'flutter' | 'angular' | 'both'
    ): void {
        parentElement.children = parentElement.children.filter(child => child.id !== childId);
        parentElement.code_string = this.generateElementCode(parentElement, framework);
    }

    /**
     * Busca un elemento por ID en una pantalla
     * @param screen Pantalla donde buscar
     * @param elementId ID del elemento
     * @returns Elemento encontrado o null
     */
    static findElementById(screen: UnifiedScreen, elementId: string): UnifiedElement | null {
        for (const element of screen.elements) {
            if (element.id === elementId) {
                return element;
            }

            const found = this.findElementInChildren(element, elementId);
            if (found) {
                return found;
            }
        }
        return null;
    }

    /**
     * Busca un elemento por ID en los hijos de un elemento
     * @param element Elemento padre
     * @param elementId ID del elemento
     * @returns Elemento encontrado o null
     */
    private static findElementInChildren(element: UnifiedElement, elementId: string): UnifiedElement | null {
        for (const child of element.children) {
            if (child.id === elementId) {
                return child;
            }

            const found = this.findElementInChildren(child, elementId);
            if (found) {
                return found;
            }
        }
        return null;
    }
}
