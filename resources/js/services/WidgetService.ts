// services/WidgetService.ts
import { FlutterWidget } from '@/Data/Pizarra';
import { WidgetUtils } from '@/utils/WidgetUtils';

export class WidgetService {
    private static widgetIdCounter = 1;

    /**
     * Creates a new widget based on the widget type
     * @param widgetType The type of widget to create
     * @param availableWidgets Array of available widget definitions
     * @returns The created widget or null if the widget type is not found
     */
    static createWidget(widgetType: string, availableWidgets: any[]): FlutterWidget | null {
        // Encuentra la definición del widget
        const widgetDefinition = availableWidgets.find((w) => w.type === widgetType);
        if (!widgetDefinition) return null;
        // Usa WidgetUtils para obtener las props por defecto
        const defaultProps = WidgetUtils.getDefaultProps(widgetType, 'flutter', availableWidgets);
        // Crea el widget Flutter específico
        const newWidget: FlutterWidget = {
            id: `widget-${this.widgetIdCounter++}`,
            type: widgetDefinition.type,
            props: defaultProps,
            children: [],
            code_string: ''
        };
        newWidget.code_string = this.generateDefaultCodeString(newWidget, availableWidgets);
        return newWidget;
    }

    /**
     * Adds a child widget to a parent widget
     * @param parentId The ID of the parent widget
     * @param widgetType The type of child widget to add
     * @param widgets Array of widgets to search for the parent
     * @param availableWidgets Array of available widget definitions
     * @returns The parent widget with the child added, or null if the parent is not found
     */
    static addChildWidget(parentId: string, widgetType: string, widgets: FlutterWidget[], availableWidgets: any[]): FlutterWidget | null {
        // Usa WidgetUtils para obtener las props por defecto
        const defaultProps = WidgetUtils.getDefaultProps(widgetType, 'flutter', availableWidgets);
        const widgetDefinition = availableWidgets.find((w) => w.type === widgetType);
        if (!widgetDefinition) return null;
        const newWidget: FlutterWidget = {
            id: `widget-${this.widgetIdCounter++}`,
            type: widgetDefinition.type,
            props: defaultProps,
            children: [],
            code_string: ''
        };
        newWidget.code_string = this.generateDefaultCodeString(newWidget, availableWidgets);

        // Find the parent widget recursively and add the child
        const addToParent = (widgets: FlutterWidget[]): FlutterWidget | null => {
            for (const widget of widgets) {
                if (widget.id === parentId) {
                    if (!widget.children) widget.children = [];
                    widget.children.push(newWidget);
                    return widget; // Return the parent widget
                }
                if (widget.children && widget.children.length > 0) {
                    const parent = addToParent(widget.children);
                    if (parent) return parent;
                }
            }
            return null;
        };

        // Add the child widget to the parent and get the parent widget
        const parentWidget = addToParent(widgets);

        // Update the parent widget's code_string property
        if (parentWidget) {
            parentWidget.code_string = this.generateDefaultCodeString(parentWidget, availableWidgets);
        }

        return parentWidget;
    }

    /**
     * Updates a widget property
     * @param widget The widget to update
     * @param propertyName The name of the property to update
     * @param value The new value of the property
     * @param availableWidgets Array of available widget definitions
     * @returns The updated widget
     */
    static updateWidgetProperty(widget: FlutterWidget, propertyName: string, value: any, availableWidgets: any[]): FlutterWidget {
        if (!widget) return widget;

        widget.props[propertyName] = value;

        // If updating the label property for TextField or TextFormField, also update the decoration property
        if (propertyName === 'label' && (widget.type === 'TextField' || widget.type === 'TextFormField')) {
            // Get the current decoration value
            const decoration = widget.props.decoration || '';

            // Replace the labelText in the decoration with the new label value
            if (decoration.includes('labelText:')) {
                // Use regex to replace the labelText value
                const newDecoration = decoration.replace(/labelText:\s*["']([^"']*)["']/, `labelText: "${value}"`);
                widget.props.decoration = newDecoration;
            } else {
                // If decoration doesn't have labelText, add it
                widget.props.decoration = `InputDecoration(labelText: "${value}")`;
            }
        }

        // Update the code_string property
        widget.code_string = this.generateDefaultCodeString(widget, availableWidgets);

        return widget;
    }

    /**
     * Updates a color property of a widget
     * @param widget The widget to update
     * @param propertyName The name of the color property to update
     * @param value The new color value
     * @param availableWidgets Array of available widget definitions
     * @param getHexColor Function to convert a color to hex format
     * @returns The updated widget
     */
    static updateColorProperty(widget: FlutterWidget, propertyName: string, value: string, availableWidgets: any[], getHexColor: (color: string) => string): FlutterWidget {
        if (!widget) return widget;

        // Ensure the value is a valid hex color
        widget.props[propertyName] = getHexColor(value);

        // Update the code_string property
        widget.code_string = this.generateDefaultCodeString(widget, availableWidgets);

        return widget;
    }

    /**
     * Generates default code string for a widget
     * @param widget The widget to generate code for
     * @param availableWidgets Array of available widget definitions
     * @returns The generated code string
     */
    static generateDefaultCodeString(widget: FlutterWidget, availableWidgets: any[]): string {
        // Special case for Text widget to use the correct format
        if (widget.type === 'Text') {
            let textContent = widget.props.data || 'Text';
            let textStyle = '';
            let textAlign = '';

            // Process other properties for Text widget
            Object.entries(widget.props).forEach(([key, value]) => {
                if (key === 'data') {
                    textContent = value as string;
                } else if (key === 'style') {
                    textStyle = `style: ${value},`;
                } else if (key === 'textAlign') {
                    // Remove quotes from TextAlign values
                    if (typeof value === 'string' && value.includes('TextAlign.')) {
                        textAlign = `textAlign: ${value.replace(/['"]/g, '')},`;
                    } else {
                        textAlign = `textAlign: ${value},`;
                    }
                }
            });

            // Generate Text widget with correct format
            return `Text(
  "${textContent}",
  ${textStyle}
  ${textAlign}
)`;
        }

        let code = `${widget.type}(\n`;

        // Add properties
        Object.entries(widget.props).forEach(([key, value]) => {
            // Skip properties for Text widget as they're handled separately
            if (widget.type === 'Text' && (key === 'data' || key === 'style' || key === 'textAlign')) {
                return;
            }

            // Skip label and validator properties for TextFormField
            if (widget.type === 'TextFormField' && (key === 'label' || key === 'validator')) {
                return;
            }

            // Check if this is a TextAlign property
            const isTextAlignProperty = key === 'textAlign' && typeof value === 'string' && value.includes('TextAlign.');

            // Check if this is a color property
            const isColorProperty = availableWidgets
                .find((w) => w.type === widget.type)?.properties
                .find((p: any) => p.name === key)?.type === 'color';

            if (isColorProperty && typeof value === 'string') {
                // Convert HEX color to Flutter Color
                if (value.startsWith('#')) {
                    // Remove # and convert to uppercase
                    const hexColor = value.substring(1).toUpperCase();
                    // If it's a 6-digit hex color
                    if (hexColor.length === 6) {
                        code += `  ${key}: Color(0xFF${hexColor}),\n`;
                    } else {
                        // Fallback for invalid hex colors
                        code += `  ${key}: Colors.black,\n`;
                    }
                } else if (value.startsWith('rgb')) {
                    // For RGB colors, we'll need to convert them to hex first
                    // This would require the ColorUtils service
                    code += `  ${key}: Colors.black,\n`;
                } else if (value.startsWith('hsl')) {
                    // For HSL colors, we'll need to convert them to hex first
                    // This would require the ColorUtils service
                    code += `  ${key}: Colors.black,\n`;
                } else {
                    // Try to use predefined Flutter colors
                    const lowerCaseValue = value.toLowerCase();
                    if (['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'grey', 'black', 'white'].includes(lowerCaseValue)) {
                        code += `  ${key}: Colors.${lowerCaseValue},\n`;
                    } else {
                        // Fallback to black
                        code += `  ${key}: Colors.black,\n`;
                    }
                }
            } else if (isTextAlignProperty) {
                // Remove quotes from TextAlign values
                code += `  ${key}: ${(value as string).replace(/['"]/g, '')},\n`;
            } else if (typeof value === 'string' && !value.includes('(')) {
                code += `  ${key}: "${value}",\n`;
            } else {
                code += `  ${key}: ${value},\n`;
            }
        });

        // Handle special cases for certain widget types
        switch (widget.type) {
            case 'Text':
                // Text widgets are handled separately above
                break;
            case 'TextField':
            case 'TextFormField':
                // For TextField widgets, ensure the decoration property is included
                if (widget.type === 'TextField' && !widget.props.decoration) {
                    code += `  decoration: InputDecoration(labelText: "${widget.props.label || "TextField:"}", hintText: ""),\n`;
                }
                // Add other required properties for TextFormField
                if (widget.type === 'TextFormField') {
                    // Always add these properties in the correct order
                    code += `  decoration: InputDecoration(labelText: "${widget.props.label || "TextField:"}", hintText: ""),\n`;
                    code += `  controller: TextEditingController(),\n`;
                    code += `  keyboardType: TextInputType.text,\n`;
                    code += `  obscureText: false,\n`;
                    code += `  enabled: true,\n`;
                }
                break;
            case 'ElevatedButton':
            case 'ElevatedButtonFlutter':
                // For ElevatedButton widgets, ensure the onPressed and child properties are included
                if (!widget.props.onPressed) {
                    code += `  onPressed: () {},\n`;
                }
                if (!widget.props.child) {
                    code += `  child: Text("Button"),\n`;
                }
                if (!widget.props.style) {
                    code += `  style: ButtonStyle(backgroundColor: MaterialStateProperty.all(Colors.blue)),\n`;
                }
                break;
            case 'Container':
                // For Container widgets, ensure width, height, and color properties are included
                if (!widget.props.width) {
                    code += `  width: 200,\n`;
                }
                if (!widget.props.height) {
                    code += `  height: 200,\n`;
                }
                if (!widget.props.color) {
                    code += `  color: Colors.white,\n`;
                }
                break;
            case 'Row':
            case 'Column':
                // For Row and Column widgets, ensure mainAxisAlignment and crossAxisAlignment properties are included
                if (!widget.props.mainAxisAlignment) {
                    code += `  mainAxisAlignment: MainAxisAlignment.start,\n`;
                }
                if (!widget.props.crossAxisAlignment) {
                    code += `  crossAxisAlignment: CrossAxisAlignment.center,\n`;
                }
                break;
            case 'AppBar':
            case 'AppBarFlutter':
                // For AppBar widgets, ensure title property is included
                if (!widget.props.title) {
                    code += `  title: Text("App Bar"),\n`;
                }
                break;
            case 'Scaffold':
                // For Scaffold widgets, ensure appBar and body properties are included
                if (!widget.props.appBar) {
                    code += `  appBar: AppBar(title: Text("Scaffold App Bar")),\n`;
                }
                if (!widget.props.body) {
                    code += `  body: Center(child: Text("Scaffold Body")),\n`;
                }
                break;
            case 'Drawer':
                // For Drawer widgets, ensure child property is included
                if (!widget.props.child) {
                    code += `  child: ListView(children: [ListTile(title: Text("Drawer Item"))]),\n`;
                }
                break;
            case 'TableFlutter':
                // For TableFlutter widgets, ensure columns and rows properties are included
                if (!widget.props.columns) {
                    code += `  columns: ["Column 1", "Column 2", "Column 3"],\n`;
                }
                if (!widget.props.rows) {
                    code += `  rows: 3,\n`;
                }
                break;
            case 'DropdownButton':
                // For DropdownButton widgets, ensure value, items, and onChanged properties are included
                if (!widget.props.value) {
                    code += `  value: "Option 1",\n`;
                }
                if (!widget.props.items) {
                    code += `  items: ["Option 1", "Option 2", "Option 3"].map<DropdownMenuItem<String>>((String value) {\n`;
                    code += `    return DropdownMenuItem<String>(\n`;
                    code += `      value: value,\n`;
                    code += `      child: Text(value),\n`;
                    code += `    );\n`;
                    code += `  }).toList(),\n`;
                } else if (Array.isArray(widget.props.items)) {
                    code += `  items: ${JSON.stringify(widget.props.items)}.map<DropdownMenuItem<String>>((String value) {\n`;
                    code += `    return DropdownMenuItem<String>(\n`;
                    code += `      value: value,\n`;
                    code += `      child: Text(value),\n`;
                    code += `    );\n`;
                    code += `  }).toList(),\n`;
                }
                if (!widget.props.onChanged) {
                    code += `  onChanged: (String? newValue) {},\n`;
                }
                break;
        }

        // Add children if any
        if (widget.children && Array.isArray(widget.children) && widget.children.length > 0) {
            code += `  children: [\n`;
            widget.children.forEach((child) => {
                // Recursively generate code for child widgets
                const childCode = this.generateDefaultCodeString(child, availableWidgets);
                // Indent the child code and add a comma at the end
                code += childCode.split('\n').map(line => `    ${line}`).join('\n') + ',\n';
            });
            code += `  ],\n`;
        }

        code += `)`;
        return code;
    }
}
