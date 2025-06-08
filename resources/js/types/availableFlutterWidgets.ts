import type { CategoriaWidget, FlutterWidgetDefinition } from '@/types/Pizarra';

export const categoriesWidget : CategoriaWidget[] = [
    { category: 'widgets', label: 'Widgets Básicos' },
    { category: 'layout', label: 'Layouts y Organización' },
    { category: 'input', label: 'Entrada de Datos (Formularios)' },
    { category: 'plataforma', label: 'Especificos de Plataforma' },
    { category: 'containers', label: 'Contenedores y Decoración' },
    { category: 'navegation', label: 'Navegación y Rutas' },
    { category: 'material-cupertino', label: 'Material Design y Cupertino (iOS)' }
    // { category: 'animation', label: 'Animaciones' },
    // { category: 'list', label: 'Listas Avanzadas' },
];

export const availableFlutterWidgets: FlutterWidgetDefinition[] = [
    // Especificos de Plataforma
    {
        type: 'SafeArea',
        category: 'plataforma',
        label: 'SafeArea',
        properties: [
            { name: 'top', type: 'boolean', defaultValue: true },
            { name: 'bottom', type: 'boolean', defaultValue: true },
            { name: 'left', type: 'boolean', defaultValue: true },
            { name: 'right', type: 'boolean', defaultValue: true }
        ],
        hasChildren: true
    },
    {
        type: 'Scaffold',
        category: 'plataforma',
        label: 'Scaffold',
        properties: [
            { name: 'backgroundColor', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'resizeToAvoidBottomInset', type: 'boolean', defaultValue: true },
            { name: 'extendBody', type: 'boolean', defaultValue: false },
            { name: 'extendBodyBehindAppBar', type: 'boolean', defaultValue: false },
            { name: 'drawer', type: 'string', defaultValue: 'Drawer()' },
            { name: 'appBar', type: 'string', defaultValue: 'AppBar(title: Text("Scaffold App Bar"))' },
            { name: 'body', type: 'string', defaultValue: 'Center(child: Text("Scaffold Body"))' },
            { name: 'bottomNavigationBar', type: 'string', defaultValue: 'BottomNavigationBar(items: [BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home")])' }

        ],
        hasChildren: true
    },
    //Material Design y Cupertino (iOS)
    {
        type: 'AppBar',
        category: 'layout',
        label: 'App Bar',
        properties: [
            { name: 'title', type: 'string', defaultValue: 'AppBar Title' },
            { name: 'backgroundColor', type: 'color', defaultValue: '#2196F3' },
            { name: 'elevation', type: 'number', defaultValue: 4 },
            { name: 'centerTitle', type: 'boolean', defaultValue: false },
            { name: 'automaticallyImplyLeading', type: 'boolean', defaultValue: true }
        ],
        hasChildren: true
    },
    {
        type: 'ElevatedButton',
        category: 'material-cupertino',
        label: 'Elevated Button',
        properties: [
            { name: 'onPressed', type: 'string', defaultValue: '() {}' },
            { name: 'child', type: 'string', defaultValue: 'Text("Elevated Button")' },
            { name: 'style', type: 'string', defaultValue: 'ButtonStyle(backgroundColor: MaterialStateProperty.all<Color>(Colors.blue))' }
        ],
        hasChildren: false
    },
    {
        type: 'TextButton',
        category: 'material-cupertino',
        label: 'Text Button',
        properties: [
            { name: 'onPressed', type: 'string', defaultValue: '() {}' },
            { name: 'child', type: 'string', defaultValue: 'Text("Text Button")' },
            { name: 'style', type: 'string', defaultValue: 'ButtonStyle(foregroundColor: MaterialStateProperty.all<Color>(Colors.blue))' }
        ],
        hasChildren: false
    },
    {
        type: 'OutlinedButton',
        category: 'material-cupertino',
        label: 'Outlined Button',
        properties: [
            { name: 'onPressed', type: 'string', defaultValue: '() {}' },
            { name: 'child', type: 'string', defaultValue: 'Text("Outlined Button")' },
            { name: 'style', type: 'string', defaultValue: 'ButtonStyle(side: MaterialStateProperty.all<BorderSide>(BorderSide(color: Colors.blue)))' }
        ],
        hasChildren: false
    },
    {
        type: 'FloatingActionButton',
        category: 'material-cupertino',
        label: 'Floating Action Button',
        properties: [
            { name: 'child', type: 'string', defaultValue: 'Icon(Icons.add)' },
            { name: 'backgroundColor', type: 'color', defaultValue: '#2196F3' },
            { name: 'foregroundColor', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'tooltip', type: 'string', defaultValue: 'Floating Action Button' },
            { name: 'mini', type: 'boolean', defaultValue: false },
            { name: 'elevation', type: 'number', defaultValue: 6 }
        ],
        hasChildren: false
    },
    // Input widgets
    {
        type: 'TextField',
        category: 'input',
        label: 'Text Field',
        properties: [
            { name: 'decoration', type: 'string', defaultValue: 'InputDecoration(labelText: "Label")' },
            { name: 'controller', type: 'string', defaultValue: 'TextEditingController()' },
            {
                name: 'keyboardType',
                type: 'select',
                defaultValue: 'TextInputType.text',
                options: ['TextInputType.text', 'TextInputType.number', 'TextInputType.email', 'TextInputType.phone']
            },
            { name: 'obscureText', type: 'boolean', defaultValue: false }
        ],
        hasChildren: false
    },
    {
        type: 'TextFormField',
        category: 'input',
        label: 'Text Form Field',
        properties: [
            { name: 'decoration', type: 'string', defaultValue: 'InputDecoration(labelText: "Label", hintText: "Enter text")' },
            { name: 'controller', type: 'string', defaultValue: 'TextEditingController()' },
            { name: 'validator', type: 'string', defaultValue: '(value) => value == null || value.isEmpty ? "Please enter some text" : null' },
            {
                name: 'keyboardType',
                type: 'select',
                defaultValue: 'TextInputType.text',
                options: ['TextInputType.text', 'TextInputType.number', 'TextInputType.email', 'TextInputType.phone']
            },
            { name: 'obscureText', type: 'boolean', defaultValue: false },
            { name: 'enabled', type: 'boolean', defaultValue: true }
        ],
        hasChildren: false
    },
    {
        type: 'Form',
        category: 'input',
        label: 'Form',
        properties: [
            { name: 'key', type: 'string', defaultValue: 'GlobalKey<FormState>()' },
            { name: 'autovalidateMode', type: 'select', defaultValue: 'AutovalidateMode.disabled',
                options: ['AutovalidateMode.disabled', 'AutovalidateMode.always', 'AutovalidateMode.onUserInteraction'] }
        ],
        hasChildren: true
    },
    {
        type: 'Checkbox',
        category: 'input',
        label: 'Checkbox',
        properties: [
            { name: 'value', type: 'boolean', defaultValue: false },
            { name: 'onChanged', type: 'string', defaultValue: '(value) {}' },
            { name: 'activeColor', type: 'color', defaultValue: '#2196F3' }
        ],
        hasChildren: false
    },
    {
        type: 'DropdownButton',
        category: 'input',
        label: 'Dropdown',
        properties: [
            { name: 'value', type: 'string', defaultValue: 'Option 1' },
            { name: 'items', type: 'array', defaultValue: ['Option 1', 'Option 2', 'Option 3'] },
            { name: 'onChanged', type: 'string', defaultValue: '(value) {}' }
        ],
        hasChildren: false
    },
    // Widgets Basicos
    {
        type: 'Container',
        category: 'widgets',
        label: 'Container',
        properties: [
            { name: 'width', type: 'number', defaultValue: 200 },
            { name: 'height', type: 'number', defaultValue: 200 },
            { name: 'color', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(16.0)' },
            { name: 'margin', type: 'string', defaultValue: 'EdgeInsets.all(8.0)' },
            {
                name: 'alignment',
                type: 'select',
                defaultValue: 'Alignment.center',
                options: ['Alignment.center', 'Alignment.topLeft', 'Alignment.topRight', 'Alignment.bottomLeft', 'Alignment.bottomRight']
            }
        ],
        hasChildren: true
    },
    {
        type: 'Padding',
        category: 'widgets',
        label: 'Padding',
        properties: [
            { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(16.0)' }
        ],
        hasChildren: true
    },
    {
        type: 'Text',
        category: 'widgets',
        label: 'Text',
        properties: [
            { name: 'data', type: 'string', defaultValue: 'Hello World' },
            { name: 'style', type: 'string', defaultValue: 'TextStyle(fontSize: 16.0)' },
            {
                name: 'textAlign',
                type: 'select',
                defaultValue: 'TextAlign.left',
                options: ['TextAlign.left', 'TextAlign.center', 'TextAlign.right', 'TextAlign.justify']
            }
        ],
        hasChildren: false
    },
    {
        type: 'Image',
        category: 'widgets',
        label: 'Image',
        properties: [
            { name: 'src', type: 'string', defaultValue: 'https://via.placeholder.com/150' },
            { name: 'width', type: 'number', defaultValue: 150 },
            { name: 'height', type: 'number', defaultValue: 150 },
            {
                name: 'fit',
                type: 'select',
                defaultValue: 'BoxFit.cover',
                options: ['BoxFit.cover', 'BoxFit.contain', 'BoxFit.fill', 'BoxFit.fitWidth', 'BoxFit.fitHeight', 'BoxFit.none', 'BoxFit.scaleDown']
            }
        ],
        hasChildren: false
    },
    {
        type: 'Icon',
        category: 'widgets',
        label: 'Icon',
        properties: [
            { name: 'icon', type: 'string', defaultValue: 'Icons.star' },
            { name: 'size', type: 'number', defaultValue: 24 },
            { name: 'color', type: 'color', defaultValue: '#000000' }
        ],
        hasChildren: false
    },
    // Layout widgets
    {
        type: 'Row',
        category: 'layout',
        label: 'Row',
        properties: [
            {
                name: 'mainAxisAlignment',
                type: 'select',
                defaultValue: 'MainAxisAlignment.start',
                options: ['MainAxisAlignment.start', 'MainAxisAlignment.center', 'MainAxisAlignment.end', 'MainAxisAlignment.spaceBetween', 'MainAxisAlignment.spaceAround', 'MainAxisAlignment.spaceEvenly']
            },
            {
                name: 'crossAxisAlignment',
                type: 'select',
                defaultValue: 'CrossAxisAlignment.center',
                options: ['CrossAxisAlignment.start', 'CrossAxisAlignment.center', 'CrossAxisAlignment.end', 'CrossAxisAlignment.stretch', 'CrossAxisAlignment.baseline']
            }
        ],
        hasChildren: true
    },
    {
        type: 'Column',
        category: 'layout',
        label: 'Column',
        properties: [
            {
                name: 'mainAxisAlignment',
                type: 'select',
                defaultValue: 'MainAxisAlignment.start',
                options: ['MainAxisAlignment.start', 'MainAxisAlignment.center', 'MainAxisAlignment.end', 'MainAxisAlignment.spaceBetween', 'MainAxisAlignment.spaceAround', 'MainAxisAlignment.spaceEvenly']
            },
            {
                name: 'crossAxisAlignment',
                type: 'select',
                defaultValue: 'CrossAxisAlignment.center',
                options: ['CrossAxisAlignment.start', 'CrossAxisAlignment.center', 'CrossAxisAlignment.end', 'CrossAxisAlignment.stretch', 'CrossAxisAlignment.baseline']
            }
        ],
        hasChildren: true
    },
    {
        type: 'Center',
        category: 'widgets',
        label: 'Center',
        properties: [
            { name: 'widthFactor', type: 'number', defaultValue: null },
            { name: 'heightFactor', type: 'number', defaultValue: null }
        ],
        hasChildren: true
    },
    {
        type: 'SizedBox',
        category: 'widgets',
        label: 'Sized Box',
        properties: [
            { name: 'width', type: 'number', defaultValue: 100 },
            { name: 'height', type: 'number', defaultValue: 100 }
        ],
        hasChildren: true
    },
    {
        type: 'ScrollChildren',
        category: 'layout',
        label: 'Scroll Children',
        properties: [
            {
                name: 'scrollDirection',
                type: 'select',
                defaultValue: 'Axis.vertical',
                options: ['Axis.vertical', 'Axis.horizontal']
            },
            { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(8.0)' },
            {
                name: 'physics',
                type: 'select',
                defaultValue: 'ClampingScrollPhysics()',
                options: ['ClampingScrollPhysics()', 'BouncingScrollPhysics()', 'AlwaysScrollableScrollPhysics()']
            }
        ],
        hasChildren: true
    },
    {
        type: 'TableList',
        category: 'layout',
        label: 'Table List',
        properties: [
            { name: 'columns', type: 'array', defaultValue: ['Column 1', 'Column 2', 'Column 3'] },
            { name: 'rows', type: 'number', defaultValue: 3 },
            { name: 'border', type: 'boolean', defaultValue: true },
            { name: 'headerColor', type: 'color', defaultValue: '#E0E0E0' }
        ],
        hasChildren: false
    },
    //Navegación y Rutas
    {
        type: 'Drawer',
        category: 'navegation',
        label: 'Drawer',
        properties: [
            { name: 'backgroundColor', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'width', type: 'number', defaultValue: 300 },
            { name: 'elevation', type: 'number', defaultValue: 16 }
        ],
        hasChildren: true
    },
    // Containers and Decoration
    {
        type: 'Card',
        category: 'layout',
        label: 'Card',
        properties: [
            { name: 'color', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'elevation', type: 'number', defaultValue: 1 },
            { name: 'margin', type: 'string', defaultValue: 'EdgeInsets.all(8.0)' },
            { name: 'shape', type: 'string', defaultValue: 'RoundedRectangleBorder(borderRadius: BorderRadius.circular(4.0))' }
        ],
        hasChildren: true
    },
    {
        type: 'ListTitle',
        category: 'containers',
        label: 'List Title',
        properties: [
            { name: 'title', type: 'string', defaultValue: 'List Tile Title' },
            { name: 'subtitle', type: 'string', defaultValue: 'List Tile Subtitle' },
            { name: 'leading', type: 'string', defaultValue: 'Icon(Icons.star)' },
            { name: 'trailing', type: 'string', defaultValue: 'Icon(Icons.arrow_forward)' },
            { name: 'dense', type: 'boolean', defaultValue: false },
            { name: 'enabled', type: 'boolean', defaultValue: true }
        ],
        hasChildren: false
    },
    {
        type: 'CardText',
        category: 'containers',
        label: 'Card Text',
        properties: [
            { name: 'title', type: 'string', defaultValue: 'Card Title' },
            { name: 'subtitle', type: 'string', defaultValue: 'Card Subtitle' },
            {
                name: 'content',
                type: 'string',
                defaultValue: 'Card content goes here with more details about the item.'
            },
            { name: 'elevation', type: 'number', defaultValue: 2 },
            { name: 'color', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'borderRadius', type: 'number', defaultValue: 8 }
        ],
        hasChildren: false
    }
];

export const FlutterCode = "// Flutter code snippet template";
