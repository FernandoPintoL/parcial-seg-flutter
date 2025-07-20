// services/UnifiedWidgetService.ts
import type { UnifiedElement } from '@/Data/PizarraUnificada';
import { WidgetUtils } from '@/utils/WidgetUtils';

export class UnifiedWidgetService {

    /**
     * Obtiene los widgets disponibles para el framework seleccionado
     * @param framework Framework seleccionado
     * @returns Lista de widgets disponibles
     */
    static getAvailableWidgets(framework: 'flutter' | 'angular' | 'both'): any[] {
        if (framework === 'flutter') {
            return this.getFlutterWidgets();
        } else if (framework === 'angular') {
            return this.getAngularWidgets();
        } else {
            return [...this.getFlutterWidgets(), ...this.getAngularWidgets()];
        }
    }

    /**
     * Obtiene widgets Flutter disponibles
     */
    private static getFlutterWidgets(): any[] {
        return [
            // Widgets de navegación
            {
                type: 'Drawer',
                name: 'Cajón de Navegación',
                icon: 'menu',
                category: 'navegation',
                framework: 'flutter',
                component: 'DrawerFlutter',
                properties: [
                    { name: 'backgroundColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'width', type: 'number', defaultValue: 300 },
                    { name: 'elevation', type: 'number', defaultValue: 16 },
                    { name: 'headerColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'headerHeight', type: 'number', defaultValue: 150 },
                    { name: 'userName', type: 'string', defaultValue: 'User Name' },
                    { name: 'userEmail', type: 'string', defaultValue: 'user@example.com' },
                ]
            },
            {
                type: 'AppBar',
                name: 'Barra de Aplicación',
                icon: 'app_bar',
                category: 'navegation',
                framework: 'flutter',
                component: 'AppBarFlutter',
                properties: [
                    { name: 'title', type: 'string', defaultValue: 'AppBar Title' },
                    { name: 'backgroundColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'textColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'elevation', type: 'number', defaultValue: 4 },
                    { name: 'centerTitle', type: 'boolean', defaultValue: false },
                ]
            },
            {
                type: 'Scaffold',
                name: 'Andamio',
                icon: 'dashboard',
                category: 'layout',
                framework: 'flutter',
                component: 'ScaffoldFlutter',
                properties: [
                    { name: 'appBar', type: 'boolean', defaultValue: true },
                    { name: 'appBarTitle', type: 'string', defaultValue: 'Scaffold' },
                    { name: 'appBarColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'backgroundColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'bottomNavigationBar', type: 'boolean', defaultValue: false },
                    { name: 'floatingActionButton', type: 'boolean', defaultValue: false },
                    { name: 'drawer', type: 'boolean', defaultValue: false },
                ]
            },
            // Widgets de entrada
            {
                type: 'TextField',
                name: 'Campo de Texto',
                icon: 'text_fields',
                category: 'input',
                framework: 'flutter',
                component: 'TextFieldFlutter',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Label' },
                    { name: 'hintText', type: 'string', defaultValue: 'Enter text' },
                    { name: 'keyboardType', type: 'select', options: ['TextInputType.text', 'TextInputType.number', 'TextInputType.email', 'TextInputType.phone'], defaultValue: 'TextInputType.text' },
                    { name: 'obscureText', type: 'boolean', defaultValue: false },
                    { name: 'enabled', type: 'boolean', defaultValue: true },
                    { name: 'width', type: 'number', defaultValue: 300 },
                    { name: 'backgroundColor', type: 'color', defaultValue: 'transparent' },
                    { name: 'textColor', type: 'color', defaultValue: '#000000' },
                    { name: 'borderColor', type: 'color', defaultValue: '#E0E0E0' },
                    { name: 'focusColor', type: 'color', defaultValue: '#2196F3' },
                ]
            },
            {
                type: 'TextFormField',
                name: 'Campo Formulario',
                icon: 'text_fields',
                category: 'input',
                framework: 'flutter',
                component: 'TextFormFieldFlutter',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Label' },
                    { name: 'hintText', type: 'string', defaultValue: 'Enter text' },
                    { name: 'validator', type: 'string', defaultValue: '(value) => value == null || value.isEmpty ? "Required" : null' },
                    { name: 'keyboardType', type: 'select', options: ['TextInputType.text', 'TextInputType.number', 'TextInputType.email', 'TextInputType.phone'], defaultValue: 'TextInputType.text' },
                    { name: 'obscureText', type: 'boolean', defaultValue: false },
                    { name: 'enabled', type: 'boolean', defaultValue: true },
                    { name: 'width', type: 'number', defaultValue: 300 },
                    { name: 'errorColor', type: 'color', defaultValue: '#F44336' },
                ]
            },
            {
                type: 'ElevatedButton',
                name: 'Botón Elevado',
                icon: 'smart_button',
                category: 'input',
                framework: 'flutter',
                component: 'ElevatedButtonFlutter',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Elevated Button' },
                    { name: 'backgroundColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'textColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'elevation', type: 'number', defaultValue: 2 },
                    { name: 'borderRadius', type: 'number', defaultValue: 4 },
                    { name: 'width', type: 'number', defaultValue: 200 },
                    { name: 'height', type: 'number', defaultValue: 48 },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                ]
            },
            {
                type: 'FloatingActionButton',
                name: 'Botón Flotante',
                icon: 'add_circle',
                category: 'input',
                framework: 'flutter',
                component: 'FloatingActionButtonFlutter',
                properties: [
                    { name: 'icon', type: 'string', defaultValue: 'Icons.add' },
                    { name: 'label', type: 'string', defaultValue: '' },
                    { name: 'backgroundColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'foregroundColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'elevation', type: 'number', defaultValue: 6 },
                    { name: 'mini', type: 'boolean', defaultValue: false },
                    { name: 'extended', type: 'boolean', defaultValue: false },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                ]
            },
            {
                type: 'Checkbox',
                name: 'Casilla de Verificación',
                icon: 'check_box',
                category: 'input',
                framework: 'flutter',
                component: 'CheckboxFlutter',
                properties: [
                    { name: 'value', type: 'boolean', defaultValue: false },
                    { name: 'activeColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'checkColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'size', type: 'number', defaultValue: 24 },
                    { name: 'label', type: 'string', defaultValue: '' },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                ]
            },
            {
                type: 'Radio',
                name: 'Botón Radio',
                icon: 'radio_button_checked',
                category: 'input',
                framework: 'flutter',
                component: 'RadioFlutter',
                properties: [
                    { name: 'value', type: 'string', defaultValue: 'Option 1' },
                    { name: 'groupValue', type: 'string', defaultValue: '' },
                    { name: 'activeColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'title', type: 'string', defaultValue: 'Radio Button' },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                    { name: 'size', type: 'number', defaultValue: 20 },
                ]
            },
            {
                type: 'Switch',
                name: 'Interruptor',
                icon: 'toggle_on',
                category: 'input',
                framework: 'flutter',
                component: 'SwitchFlutter',
                properties: [
                    { name: 'value', type: 'boolean', defaultValue: false },
                    { name: 'activeColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'inactiveColor', type: 'color', defaultValue: '#bdbdbd' },
                    { name: 'thumbColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                ]
            },
            {
                type: 'Slider',
                name: 'Deslizador',
                icon: 'tune',
                category: 'input',
                framework: 'flutter',
                component: 'SliderFlutter',
                properties: [
                    { name: 'value', type: 'number', defaultValue: 0.5 },
                    { name: 'min', type: 'number', defaultValue: 0.0 },
                    { name: 'max', type: 'number', defaultValue: 1.0 },
                    { name: 'divisions', type: 'number', defaultValue: 10 },
                    { name: 'activeColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'inactiveColor', type: 'color', defaultValue: '#E0E0E0' },
                ]
            },
            // Widgets de layout
            {
                type: 'Container',
                name: 'Contenedor',
                icon: 'crop_square',
                category: 'layout',
                framework: 'flutter',
                component: 'ContainerFlutter',
                properties: [
                    { name: 'width', type: 'number', defaultValue: 200 },
                    { name: 'height', type: 'number', defaultValue: 200 },
                    { name: 'color', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'borderRadius', type: 'number', defaultValue: 0 },
                    { name: 'borderWidth', type: 'number', defaultValue: 0 },
                    { name: 'borderColor', type: 'color', defaultValue: '#000000' },
                    { name: 'elevation', type: 'number', defaultValue: 0 },
                    { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(16.0)' },
                    { name: 'margin', type: 'string', defaultValue: 'EdgeInsets.all(8.0)' },
                ]
            },
            {
                type: 'Row',
                name: 'Fila',
                icon: 'view_week',
                category: 'layout',
                framework: 'flutter',
                component: 'RowFlutter',
                properties: [
                    { name: 'mainAxisAlignment', type: 'select', options: ['MainAxisAlignment.start', 'MainAxisAlignment.center', 'MainAxisAlignment.end', 'MainAxisAlignment.spaceBetween', 'MainAxisAlignment.spaceAround', 'MainAxisAlignment.spaceEvenly'], defaultValue: 'MainAxisAlignment.start' },
                    { name: 'crossAxisAlignment', type: 'select', options: ['CrossAxisAlignment.start', 'CrossAxisAlignment.center', 'CrossAxisAlignment.end', 'CrossAxisAlignment.stretch', 'CrossAxisAlignment.baseline'], defaultValue: 'CrossAxisAlignment.center' },
                    { name: 'width', type: 'number', defaultValue: 0 },
                    { name: 'height', type: 'number', defaultValue: 60 },
                    { name: 'backgroundColor', type: 'color', defaultValue: 'transparent' },
                ]
            },
            {
                type: 'Column',
                name: 'Columna',
                icon: 'view_column',
                category: 'layout',
                framework: 'flutter',
                component: 'ColumnFlutter',
                properties: [
                    { name: 'mainAxisAlignment', type: 'select', options: ['MainAxisAlignment.start', 'MainAxisAlignment.center', 'MainAxisAlignment.end', 'MainAxisAlignment.spaceBetween', 'MainAxisAlignment.spaceAround', 'MainAxisAlignment.spaceEvenly'], defaultValue: 'MainAxisAlignment.start' },
                    { name: 'crossAxisAlignment', type: 'select', options: ['CrossAxisAlignment.start', 'CrossAxisAlignment.center', 'CrossAxisAlignment.end', 'CrossAxisAlignment.stretch', 'CrossAxisAlignment.baseline'], defaultValue: 'CrossAxisAlignment.center' },
                    { name: 'width', type: 'number', defaultValue: 0 },
                    { name: 'height', type: 'number', defaultValue: 120 },
                    { name: 'backgroundColor', type: 'color', defaultValue: 'transparent' },
                ]
            },
            {
                type: 'Padding',
                name: 'Relleno',
                icon: 'padding',
                category: 'layout',
                framework: 'flutter',
                component: 'PaddingFlutter',
                properties: [
                    { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(16.0)' },
                    { name: 'width', type: 'number', defaultValue: 0 },
                    { name: 'height', type: 'number', defaultValue: 0 },
                    { name: 'backgroundColor', type: 'color', defaultValue: 'transparent' },
                    { name: 'borderRadius', type: 'number', defaultValue: 0 },
                ]
            },
            // Widgets de visualización
            {
                type: 'Text',
                name: 'Texto',
                icon: 'text_format',
                category: 'display',
                framework: 'flutter',
                component: 'TextFlutter',
                properties: [
                    { name: 'data', type: 'string', defaultValue: 'Hello World' },
                    { name: 'fontSize', type: 'number', defaultValue: 16 },
                    { name: 'fontWeight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'], defaultValue: 'normal' },
                    { name: 'color', type: 'color', defaultValue: '#000000' },
                    { name: 'textAlign', type: 'select', options: ['TextAlign.left', 'TextAlign.center', 'TextAlign.right', 'TextAlign.justify'], defaultValue: 'TextAlign.left' },
                    { name: 'maxLines', type: 'number', defaultValue: 0 },
                ]
            },
            {
                type: 'Image',
                name: 'Imagen',
                icon: 'image',
                category: 'display',
                framework: 'flutter',
                component: 'ImageFlutter',
                properties: [
                    { name: 'src', type: 'string', defaultValue: 'https://placehold.co/150' },
                    { name: 'width', type: 'number', defaultValue: 150 },
                    { name: 'height', type: 'number', defaultValue: 150 },
                    { name: 'fit', type: 'select', options: ['BoxFit.cover', 'BoxFit.contain', 'BoxFit.fill', 'BoxFit.fitWidth', 'BoxFit.fitHeight'], defaultValue: 'BoxFit.cover' },
                    { name: 'borderRadius', type: 'number', defaultValue: 0 },
                    { name: 'opacity', type: 'number', defaultValue: 1.0 },
                ]
            },
            {
                type: 'Icon',
                name: 'Icono',
                icon: 'star',
                category: 'display',
                framework: 'flutter',
                component: 'IconFlutter',
                properties: [
                    { name: 'name', type: 'string', defaultValue: 'star' },
                    { name: 'size', type: 'number', defaultValue: 24 },
                    { name: 'color', type: 'color', defaultValue: '#000000' },
                    { name: 'opacity', type: 'number', defaultValue: 1.0 },
                ]
            },
            {
                type: 'Card',
                name: 'Tarjeta',
                icon: 'card_membership',
                category: 'display',
                framework: 'flutter',
                component: 'CardFlutter',
                properties: [
                    { name: 'title', type: 'string', defaultValue: 'Card Title' },
                    { name: 'subtitle', type: 'string', defaultValue: '' },
                    { name: 'content', type: 'string', defaultValue: 'Card content goes here.' },
                    { name: 'elevation', type: 'number', defaultValue: 2 },
                    { name: 'borderRadius', type: 'number', defaultValue: 8 },
                    { name: 'width', type: 'number', defaultValue: 300 },
                    { name: 'showImage', type: 'boolean', defaultValue: false },
                    { name: 'showActions', type: 'boolean', defaultValue: true },
                ]
            },
            {
                type: 'ListTile',
                name: 'Elemento de Lista',
                icon: 'list_alt',
                category: 'display',
                framework: 'flutter',
                component: 'ListTileFlutter',
                properties: [
                    { name: 'title', type: 'string', defaultValue: 'List Tile Title' },
                    { name: 'subtitle', type: 'string', defaultValue: 'List Tile Subtitle' },
                    { name: 'leading', type: 'string', defaultValue: 'Icons.star' },
                    { name: 'trailing', type: 'string', defaultValue: 'Icons.arrow_forward' },
                    { name: 'dense', type: 'boolean', defaultValue: false },
                    { name: 'enabled', type: 'boolean', defaultValue: true },
                    { name: 'selected', type: 'boolean', defaultValue: false },
                ]
            },
            // Widgets de listas
            {
                type: 'CheckboxListTile',
                name: 'Lista Checkbox',
                icon: 'check_box',
                category: 'input',
                framework: 'flutter',
                component: 'CheckboxListTileFlutter',
                properties: [
                    { name: 'title', type: 'string', defaultValue: 'Checkbox List Tile' },
                    { name: 'subtitle', type: 'string', defaultValue: '' },
                    { name: 'activeColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'orientation', type: 'select', options: ['vertical', 'horizontal'], defaultValue: 'vertical' },
                    {
                        name: 'items', type: 'array', defaultValue: [
                            { id: '1', label: 'Option 1', value: false },
                            { id: '2', label: 'Option 2', value: false },
                            { id: '3', label: 'Option 3', value: false },
                        ]
                    },
                ]
            },
            {
                type: 'RadioListTile',
                name: 'Lista Radio',
                icon: 'radio_button_checked',
                category: 'input',
                framework: 'flutter',
                component: 'RadioListTileFlutter',
                properties: [
                    { name: 'title', type: 'string', defaultValue: 'Radio List Tile' },
                    { name: 'value', type: 'string', defaultValue: 'Option 1' },
                    { name: 'groupValue', type: 'string', defaultValue: '' },
                    { name: 'activeColor', type: 'color', defaultValue: '#2196F3' },
                    { name: 'orientation', type: 'select', options: ['vertical', 'horizontal'], defaultValue: 'vertical' },
                    {
                        name: 'items', type: 'array', defaultValue: [
                            { id: '1', label: 'Option 1', value: '1' },
                            { id: '2', label: 'Option 2', value: '2' },
                            { id: '3', label: 'Option 3', value: '3' },
                        ]
                    },
                ]
            },
        ];
    }

    /**
     * Obtiene widgets disponibles para Angular
     */
    private static getAngularWidgets(): any[] {
        return [
            // Componentes de entrada
            {
                type: 'input',
                name: 'Campo de Entrada',
                icon: 'text_fields',
                category: 'input',
                framework: 'angular',
                component: 'InputAngular',
                properties: [
                    { name: 'label', type: 'string', defaultValue: 'Input Label' },
                    { name: 'placeholder', type: 'string', defaultValue: 'Enter text...' },
                    { name: 'type', type: 'select', options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'], defaultValue: 'text' },
                    { name: 'required', type: 'boolean', defaultValue: false },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                    { name: 'readonly', type: 'boolean', defaultValue: false },
                    { name: 'appearance', type: 'select', options: ['legacy', 'standard', 'fill', 'outline'], defaultValue: 'standard' },
                    { name: 'color', type: 'select', options: ['primary', 'accent', 'warn'], defaultValue: 'primary' },
                    { name: 'hint', type: 'string', defaultValue: '' },
                    { name: 'maxLength', type: 'number', defaultValue: 0 },
                    { name: 'prefixIcon', type: 'string', defaultValue: '' },
                    { name: 'suffixIcon', type: 'string', defaultValue: '' },
                ]
            },
            {
                type: 'button',
                name: 'Botón',
                icon: 'smart_button',
                category: 'input',
                framework: 'angular',
                component: 'ButtonAngular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Button' },
                    { name: 'variant', type: 'select', options: ['raised', 'stroked', 'flat', 'fab', 'mini-fab', 'icon'], defaultValue: 'raised' },
                    { name: 'color', type: 'select', options: ['primary', 'accent', 'warn'], defaultValue: 'primary' },
                    { name: 'disabled', type: 'boolean', defaultValue: false },
                    { name: 'icon', type: 'string', defaultValue: '' },
                    { name: 'iconPosition', type: 'select', options: ['start', 'end'], defaultValue: 'start' },
                    { name: 'size', type: 'select', options: ['small', 'medium', 'large'], defaultValue: 'medium' },
                    { name: 'fullWidth', type: 'boolean', defaultValue: false },
                    { name: 'backgroundColor', type: 'color', defaultValue: '' },
                    { name: 'textColor', type: 'color', defaultValue: '' },
                    { name: 'borderRadius', type: 'number', defaultValue: 4 },
                ]
            },
            {
                type: 'card',
                name: 'Tarjeta',
                icon: 'card_membership',
                category: 'layout',
                framework: 'angular',
                component: 'CardAngular',
                properties: [
                    { name: 'title', type: 'string', defaultValue: 'Card Title' },
                    { name: 'subtitle', type: 'string', defaultValue: 'Card Subtitle' },
                    { name: 'content', type: 'string', defaultValue: 'Card content goes here with more details about the item.' },
                    { name: 'showHeader', type: 'boolean', defaultValue: true },
                    { name: 'showImage', type: 'boolean', defaultValue: false },
                    { name: 'showActions', type: 'boolean', defaultValue: true },
                    { name: 'showFooter', type: 'boolean', defaultValue: false },
                    { name: 'avatar', type: 'boolean', defaultValue: false },
                    { name: 'avatarColor', type: 'color', defaultValue: '#1976d2' },
                    { name: 'elevation', type: 'number', defaultValue: 2 },
                    { name: 'appearance', type: 'select', options: ['raised', 'outlined', 'flat'], defaultValue: 'raised' },
                    { name: 'layout', type: 'select', options: ['vertical', 'horizontal'], defaultValue: 'vertical' },
                    { name: 'width', type: 'number', defaultValue: 300 },
                    { name: 'backgroundColor', type: 'color', defaultValue: '#FFFFFF' },
                    { name: 'borderRadius', type: 'number', defaultValue: 4 },
                ]
            },
            // Elementos HTML básicos
            {
                type: 'div',
                name: 'División',
                icon: 'crop_square',
                category: 'layout',
                framework: 'angular',
                component: 'DivAngular',
                properties: [
                    { name: 'width', type: 'number', defaultValue: 200 },
                    { name: 'height', type: 'number', defaultValue: 100 },
                    { name: 'backgroundColor', type: 'color', defaultValue: '#F5F5F5' },
                    { name: 'borderColor', type: 'color', defaultValue: '#E0E0E0' },
                    { name: 'borderWidth', type: 'number', defaultValue: 1 },
                    { name: 'borderRadius', type: 'number', defaultValue: 4 },
                    { name: 'padding', type: 'number', defaultValue: 16 },
                    { name: 'margin', type: 'number', defaultValue: 8 },
                ]
            },
            {
                type: 'p',
                name: 'Párrafo',
                icon: 'text_snippet',
                category: 'display',
                framework: 'angular',
                component: 'ParagraphAngular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'This is a paragraph text.' },
                    { name: 'fontSize', type: 'number', defaultValue: 16 },
                    { name: 'fontWeight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'], defaultValue: 'normal' },
                    { name: 'color', type: 'color', defaultValue: '#000000' },
                    { name: 'textAlign', type: 'select', options: ['left', 'center', 'right', 'justify'], defaultValue: 'left' },
                    { name: 'lineHeight', type: 'number', defaultValue: 1.5 },
                ]
            },
            {
                type: 'h1',
                name: 'Título 1',
                icon: 'title',
                category: 'display',
                framework: 'angular',
                component: 'HeadingAngular',
                properties: [
                    { name: 'text', type: 'string', defaultValue: 'Heading 1' },
                    { name: 'level', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], defaultValue: 'h1' },
                    { name: 'color', type: 'color', defaultValue: '#000000' },
                    { name: 'textAlign', type: 'select', options: ['left', 'center', 'right'], defaultValue: 'left' },
                    { name: 'marginBottom', type: 'number', defaultValue: 16 },
                ]
            },
        ];
    }

    /**
     * Crea un nuevo elemento unificado
     */
    static createElement(type: string, framework: 'flutter' | 'angular', position: { x: number, y: number }, canvasWidth?: number): UnifiedElement {
        const availableWidgets = this.getAvailableWidgets(framework);
        // Usa WidgetUtils para crear el widget
        return WidgetUtils.createWidget(type, framework, availableWidgets, position);
    }

    /**
     * Actualiza las propiedades de un elemento
     */
    static updateElementProperties(element: UnifiedElement, properties: Record<string, any>): UnifiedElement {
        return {
            ...element,
            props: {
                ...element.props,
                ...properties
            }
        };
    }

    /**
     * Valida las propiedades de un elemento
     */
    static validateElementProperties(element: UnifiedElement): boolean {
        const availableWidgets = this.getAvailableWidgets(element.framework);
        return WidgetUtils.validateWidget(element, availableWidgets);
    }

    /**
     * Duplica un elemento unificado
     * @deprecated Use WidgetUtils.duplicateWidget directly
     */
    static duplicateElement(element: UnifiedElement): UnifiedElement {
        console.warn('⚠️ UnifiedWidgetService.duplicateElement is deprecated. Use WidgetUtils.duplicateWidget directly.');
        return WidgetUtils.duplicateWidget(element);
    }
}
