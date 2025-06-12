// services/AIService.ts
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { FlutterWidget } from '@/types/Pizarra';

export class AIService {
    /**
     * Extracts Flutter code from an AI response
     * @param inputString The AI response text
     * @returns The extracted Flutter code
     */
    static extractFromFirstImport(inputString: string): string {
        console.log('Extracting code from AI response...');

        // First, try to find code blocks in markdown format (```dart ... ```)
        const codeBlockRegex = /```(?:dart|flutter)?\s*([\s\S]*?)\s*```/g;
        const codeBlocks = [];
        let match;

        try {
            while ((match = codeBlockRegex.exec(inputString)) !== null) {
                if (match[1] && match[1].trim()) {
                    codeBlocks.push(match[1].trim());
                }
            }

            // If we found code blocks, join them and return
            if (codeBlocks.length > 0) {
                console.log(`Found ${codeBlocks.length} code blocks in markdown format`);
                return codeBlocks.join('\n\n');
            }

            // If no code blocks found, look for import statements
            const importIndex = inputString.indexOf('import');
            if (importIndex !== -1) {
                console.log('Found import statement');
                return inputString.slice(importIndex);
            }

            // If no imports found, look for class or widget definitions
            const classMatch = /class\s+\w+/.exec(inputString);
            if (classMatch) {
                console.log('Found class definition');
                const classIndex = classMatch.index;
                return inputString.slice(classIndex);
            }

            // Look for common Flutter widget patterns if no class definition found
            const widgetMatch = /((?:Container|Scaffold|Column|Row|Text|Center|AppBar|SizedBox|Padding|Card|ListView|Stack)\s*\()/.exec(inputString);
            if (widgetMatch) {
                console.log(`Found widget definition: ${widgetMatch[1]}`);
                const widgetIndex = widgetMatch.index;
                return inputString.slice(widgetIndex);
            }

            // If nothing else works, return the original string
            // This is better than returning empty string as it might still contain useful code
            console.log('No code patterns found, using original text');
            return inputString;
        } catch (error) {
            console.error('Error in extractFromFirstImport:', error);
            // Return the original string in case of error
            return inputString;
        }
    }

    /**
     * Parses Flutter widgets from code and creates a widget hierarchy
     * @param inputCode The Flutter code to parse
     * @param availableWidgets Array of available widget definitions
     * @param widgetIdCounter Counter for generating unique widget IDs
     * @param currentScreen Current screen to add widgets to
     * @param roomId Room ID for socket events
     * @param currentUser Current user for socket events
     * @param socket Socket instance for emitting events
     */
    static parseFlutterWidgets(
        inputCode: string,
        availableWidgets: any[],
        widgetIdCounter: number,
        currentScreen: any,
        roomId: string | null,
        currentUser: string,
        socket: any
    ): number {
        console.log('Parsing Flutter widgets from code...');
        // Define regex patterns for different widget structures
        const widgetRegex =
            /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableFlutter|CardText|Scaffold|AppBarFlutter|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|ElevatedButtonFlutter|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\b/g;

        let localWidgetIdCounter = widgetIdCounter;

        try {
            // This regex captures widget definitions with their content between parentheses
            // It handles nested parentheses by using a non-greedy approach
            const widgetWithContentRegex =
                /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableFlutter|CardText|Scaffold|AppBarFlutter|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|ElevatedButtonFlutter|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(([\s\S]*?)(?:\)\s*,|\)$|\);)/g;

            // These regex patterns capture child and children properties
            // Improved to handle more complex child widget references
            const childRegex = /child\s*:\s*(?:(?:const\s+)?([A-Za-z][A-Za-z0-9_]*)\s*\(|([A-Za-z][A-Za-z0-9_]*)\s*\.\s*[a-zA-Z]+\()/;

            // Improved to better extract the content of the children array
            const childrenRegex = /children\s*:\s*\[\s*([\s\S]*?)\s*\]\s*(?:,|$)/;

            // This regex helps identify widget types within a children array
            const childrenWidgetsRegex =
                /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableFlutter|CardText|Scaffold|AppBarFlutter|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|ElevatedButtonFlutter|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(/g;

            // Helper function to extract property values from widget content
            const extractProperties = (widgetContent: string, widgetDefinition: any) => {
                const props: Record<string, any> = {};

                // Initialize with default values first
                widgetDefinition.properties.forEach((prop: { name: string, defaultValue: any }) => {
                    props[prop.name] = prop.defaultValue;
                });

                // Try to extract actual values for common properties
                widgetDefinition.properties.forEach((prop: { name: string, type: string, defaultValue: any }) => {
                    // Different regex patterns based on property type
                    let propRegex: RegExp;
                    let valueExtractor = (match: RegExpExecArray) => match[1];

                    switch (prop.type) {
                        case 'string':
                            // Match string values with quotes
                            propRegex = new RegExp(`${prop.name}\\s*:\\s*['"]([^'"]*?)['"]`, 'i');
                            break;
                        case 'number':
                            // Match numeric values
                            propRegex = new RegExp(`${prop.name}\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i');
                            valueExtractor = (match: RegExpExecArray) => String(parseFloat(match[1]));
                            break;
                        case 'boolean':
                            // Match boolean values
                            propRegex = new RegExp(`${prop.name}\\s*:\\s*(true|false)`, 'i');
                            valueExtractor = (match: RegExpExecArray) => match[1].toLowerCase() === 'true' ? 'true' : 'false';
                            break;
                        case 'color':
                            // Try to match color values in various formats
                            propRegex = new RegExp(`${prop.name}\\s*:\\s*(?:Colors\\.([a-zA-Z]+)|Color\\(0x([0-9A-Fa-f]+)\\)|'#([0-9A-Fa-f]+)')`, 'i');
                            valueExtractor = (match: RegExpExecArray) => {
                                if (match[1]) return `#${this.colorNameToHex(match[1])}`;
                                if (match[2]) return `#${match[2]}`;
                                if (match[3]) return `#${match[3]}`;
                                return prop.defaultValue;
                            };
                            break;
                        case 'select':
                            // Match enum values
                            if (Array.isArray((prop as any).options)) {
                                const options = (prop as any).options.map((opt: string) => opt.replace(/\./g, '\\.'));
                                propRegex = new RegExp(`${prop.name}\\s*:\\s*(${options.join('|')})`, 'i');
                                valueExtractor = (match: RegExpExecArray) => match[1];
                            } else {
                                propRegex = new RegExp(`${prop.name}\\s*:\\s*([^,}]+)`, 'i');
                                valueExtractor = (match: RegExpExecArray) => match[1].trim();
                            }
                            break;
                        default:
                            // For other types, try a generic approach
                            propRegex = new RegExp(`${prop.name}\\s*:\\s*([^,}]+)`, 'i');
                            valueExtractor = (match: RegExpExecArray) => match[1].trim();
                    }

                    // Try to extract the property value
                    const match = propRegex.exec(widgetContent);
                    if (match) {
                        props[prop.name] = valueExtractor(match);
                    }
                });

                // Special case for Text widget - extract the text content
                if (widgetDefinition.type === 'Text') {
                    const textMatch = /Text\s*\(\s*['"]([^'"]*)['"]/i.exec(widgetContent);
                    if (textMatch) {
                        props['data'] = textMatch[1];
                    }
                }

                return props;
            };

            // First pass: identify all widgets and their content
            const widgetDefinitions: FlutterWidget[] = [];
            let widgetMatch;

            while ((widgetMatch = widgetWithContentRegex.exec(inputCode)) !== null) {
                const widgetType = widgetMatch[1];
                const widgetContent = widgetMatch[2];

                // Check if this widget definition exists in availableWidgets
                const widgetDefinition = availableWidgets.find((w) => w.type === widgetType);
                if (widgetDefinition) {
                    // Create a new widget object
                    const newWidget: FlutterWidget = {
                        id: `widget-${localWidgetIdCounter++}`,
                        type: widgetDefinition.type,
                        props: extractProperties(widgetContent, widgetDefinition),
                        children: []
                    };

                    // Extract child widget if present
                    const childMatch = childRegex.exec(widgetContent);
                    if (childMatch) {
                        // Mark this widget as having a child that needs to be resolved
                        (newWidget as any).pendingChild = childMatch[1];
                    }

                    // Extract children array if present
                    const childrenMatch = childrenRegex.exec(widgetContent);
                    if (childrenMatch) {
                        // Mark this widget as having children that need to be resolved
                        (newWidget as any).pendingChildren = childrenMatch[1].split(',')
                            .map(child => child.trim())
                            .filter(child => child.length > 0);
                    }

                    // Store the widget definition for further processing
                    widgetDefinitions.push(newWidget);
                }
            }

            // Segundo paso: crear una jerarquía de widgets
            const rootWidgets: FlutterWidget[] = [];
            const processedWidgets = new Set<string | number>();

            // Process widgets with children first
            widgetDefinitions.forEach((widget: FlutterWidget) => {
                if ((widget as any).pendingChildren) {
                    // Reiniciar el lastIndex del regex para asegurar que empezamos desde el principio
                    childrenWidgetsRegex.lastIndex = 0;

                    // El contenido de los hijos es un string[]
                    const childrenContent = Array.isArray((widget as any).pendingChildren) ? (widget as any).pendingChildren.join(',') : '';
                    const childTypes: string[] = [];
                    let widgetMatch: RegExpExecArray | null;

                    while ((widgetMatch = childrenWidgetsRegex.exec(childrenContent)) !== null) {
                        childTypes.push(widgetMatch[1]);
                    }

                    console.log(`Found ${childTypes.length} child widgets in children array for ${widget.type}:`, childTypes);

                    childTypes.forEach((childType: string) => {
                        // Find a widget of this type that hasn't been processed yet
                        const childWidget = widgetDefinitions.find((w: FlutterWidget) => w.type === childType && !processedWidgets.has(w.id));

                        if (childWidget) {
                            if (!widget.children) widget.children = [];
                            widget.children.push(childWidget);
                            processedWidgets.add(childWidget.id);
                        }
                    });

                    delete (widget as any).pendingChildren;
                }
            });

            // Process widgets with a single child
            widgetDefinitions.forEach((widget: FlutterWidget) => {
                if ((widget as any).pendingChild) {
                    const childType = (widget as any).pendingChild;
                    console.log(`Processing widget ${widget.type} with child type: ${childType}`);

                    // Find a widget of this type that hasn't been processed yet
                    const childWidget = widgetDefinitions.find((w: FlutterWidget) => w.type === childType && !processedWidgets.has(w.id));

                    if (childWidget) {
                        if (!widget.children) widget.children = [];
                        widget.children.push(childWidget);
                        processedWidgets.add(childWidget.id);
                    }

                    delete (widget as any).pendingChild;
                }
            });

            // Add widgets that haven't been assigned as children to the root level
            widgetDefinitions.forEach((widget: FlutterWidget) => {
                if (!processedWidgets.has(widget.id)) {
                    rootWidgets.push(widget);
                    console.log(`Adding ${widget.type} as a root widget`);
                }
            });

            // Log the widget hierarchy for debugging
            console.log(`Found ${rootWidgets.length} root widgets`);

            // Helper function to print the widget tree
            const printWidgetTree = (widget: FlutterWidget, depth = 0) => {
                const indent = '  '.repeat(depth);
                console.log(`${indent}${widget.type} (${widget.id})`);
                if (widget.children && widget.children.length > 0) {
                    widget.children.forEach((child: FlutterWidget) => printWidgetTree(child, depth + 1));
                }
            };

            // Print the widget tree for each root widget
            rootWidgets.forEach((widget: FlutterWidget) => {
                printWidgetTree(widget);
            });

            // Add root widgets to the canvas
            rootWidgets.forEach((widget) => {
                if (currentScreen) {
                    // Ensure the widget has a unique ID
                    if (!widget.id) {
                        widget.id = `widget-${localWidgetIdCounter++}`;
                    }

                    // Ensure the widget has a children property initialized as an array
                    if (!widget.children || !Array.isArray(widget.children)) {
                        widget.children = [];
                    }
                } else {
                    console.warn('No current screen to add widgets to');
                }
                // Emit event to socket
                socket.emit('flutter-widget-added', {
                    roomId: roomId,
                    widget: widget,
                    userId: currentUser
                });
            });

            // If no widgets were found or processed, fall back to the simple approach
            if (rootWidgets.length === 0) {
                const foundWidgets = new Set<string>();
                let match: RegExpExecArray | null;

                while ((match = widgetRegex.exec(inputCode)) !== null) {
                    foundWidgets.add(match[1]); // Add the widget name
                }

                foundWidgets.forEach((widgetType: string) => {
                    const widgetDefinition = availableWidgets.find((w) => w.type === widgetType);
                    if (widgetDefinition) {
                        const newWidget: FlutterWidget = {
                            id: `widget-${localWidgetIdCounter++}`,
                            type: widgetDefinition.type,
                            props: {},
                            children: []
                        };

                        // Initialize properties with default values
                        widgetDefinition.properties.forEach((prop) => {
                            newWidget.props[prop.name] = prop.defaultValue;
                        });

                        if (currentScreen && Array.isArray(currentScreen.elements)) {
                            currentScreen.elements.push(newWidget);
                        }

                        // Emit event to socket
                        socket.emit('flutter-widget-added', {
                            roomId: roomId,
                            widget: newWidget,
                            userId: currentUser
                        });
                    } else {
                        console.warn(`Widget no reconocido: ${widgetType}`);
                    }
                });
            }
        } catch (error: any) {
            console.error('Error in parseFlutterWidgets:', error);

            // Fallback to simple widget detection in case of error
            const foundWidgets = new Set<string>();
            let match;

            while ((match = widgetRegex.exec(inputCode)) !== null) {
                foundWidgets.add(match[1]); // Add the widget name
            }

            foundWidgets.forEach((widgetType) => {
                const widgetDefinition = availableWidgets.find((w) => w.type === widgetType);
                if (widgetDefinition) {
                    const newWidget: FlutterWidget = {
                        id: `widget-${localWidgetIdCounter++}`,
                        type: widgetDefinition.type,
                        props: {},
                        children: []
                    };

                    // Initialize properties with default values
                    widgetDefinition.properties.forEach((prop) => {
                        newWidget.props[prop.name] = prop.defaultValue;
                    });

                    if (currentScreen && Array.isArray(currentScreen.elements)) {
                        currentScreen.elements.push(newWidget);
                    }

                    console.log(`Added fallback widget: ${widgetType}`);
                }
            });
        }

        return localWidgetIdCounter;
    }

    /**
     * Parses the AI response as JSON
     * @param aiResponse The AI response text
     * @returns The parsed JSON object or null if parsing fails
     */
    static parseAIResponseAsJSON(aiResponse: string): any {
        console.log('Parsing AI response as JSON...');

        try {
            // Check if the response starts with a markdown code block
            if (aiResponse.trim().startsWith('```json')) {
                console.log('Response starts with markdown code block, extracting JSON...');

                // Extract content from the markdown code block
                const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch && codeBlockMatch[1]) {
                    const jsonString = codeBlockMatch[1].trim();
                    try {
                        const jsonObject = JSON.parse(jsonString);
                        console.log('Successfully parsed JSON from markdown code block:', jsonObject);
                        return jsonObject;
                    } catch (error: any) {
                        console.error('Failed to parse JSON from markdown code block:', error.message);
                        // Continue to other parsing methods
                    }
                }
            }

            // Try to parse the entire response as JSON
            try {
                const jsonObject = JSON.parse(aiResponse);
                console.log('Successfully parsed entire response as JSON:', jsonObject);
                return jsonObject;
            } catch (error: any) {
                console.error('Failed to parse entire response as JSON:', error.message);
                console.log('Could not parse entire response as JSON, trying to extract JSON...');
            }

            // If that fails, try to extract JSON from the response using various patterns

            // Look for JSON code blocks with more flexible pattern
            const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
            let matches = [...aiResponse.matchAll(jsonCodeBlockRegex)];

            // If no code blocks found, try to find JSON objects directly
            if (matches.length === 0) {
                // Try to find any JSON-like object in the response
                const jsonObjectRegex = /({[\s\S]*?"widgets"\s*:\s*\[[\s\S]*?\]})/g;
                matches = [...aiResponse.matchAll(jsonObjectRegex)];

                // If still no matches, try a more general pattern
                if (matches.length === 0) {
                    const generalJsonRegex = /({[\s\S]*?})/g;
                    matches = [...aiResponse.matchAll(generalJsonRegex)];
                }
            }

            if (matches.length > 0) {
                console.log(`Found ${matches.length} potential JSON matches in the response`);

                // Use the first match that can be parsed as JSON
                for (const match of matches) {
                    let jsonString = match[1] || match[0];

                    // Clean up the string - remove any trailing commas which are invalid in JSON
                    jsonString = jsonString.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

                    try {
                        const jsonObject = JSON.parse(jsonString);
                        console.log('Successfully extracted and parsed JSON:', jsonObject);
                        return jsonObject;
                    } catch (error: any) {
                        console.error('Failed to parse extracted JSON:', error.message);
                        console.log('Failed to parse extracted JSON, trying next match...');
                    }
                }
            }

            // If we still haven't found valid JSON, log the response for debugging
            console.log('No valid JSON found in AI response. Response content:', aiResponse);
            return null;
        } catch (error) {
            console.error('Error in parseAIResponseAsJSON:', error);
            return null;
        }
    }

    /**
     * Sends a prompt to the AI
     * @param prompt The prompt to send
     * @param aiMessages Array of AI messages
     * @param isProcessingAI Flag indicating if the AI is processing
     * @param parseFlutterWidgets Function to parse Flutter widgets
     * @returns The updated AI messages and processing flag
     */
    static async sendAIPrompt(
        prompt: string,
        aiMessages: any[],
        isProcessingAI: boolean,
        parseFlutterWidgets: (code: string) => void
    ): Promise<{ aiMessages: any[], isProcessingAI: boolean }> {
        console.log('Sending AI prompt:', prompt);
        console.log('Current AI messages:', aiMessages);
        console.log('Is AI processing:', isProcessingAI);
        if (!prompt.trim()) {
            return { aiMessages, isProcessingAI };
        }

        // Create a copy of the aiMessages array to avoid modifying the original
        const updatedMessages = [...aiMessages];

        // Add user message to chat
        updatedMessages.push({
            text: prompt,
            isUser: true,
            timestamp: Date.now()
        });

        // Set processing state to true for the function scope
        let processingState = true;

        // Extraer configuración de Azure desde el .env
        const azureApiUrl = import.meta.env.VITE_AZURE_API_URL;
        const azureApiKey = import.meta.env.VITE_AZURE_API_KEY;
        const azureModelName = import.meta.env.VITE_AZURE_MODEL_NAME;
        const azureDeploymentName = import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || azureModelName;
        console.log('Azure API URL:', azureApiUrl);
        console.log('Azure Model Name:', azureModelName);
        console.log('Azure Deployment Name:', azureDeploymentName);
        console.log('Azure API Key:', azureApiKey ? '***' : 'Not provided');

        try {
            // Validar que las variables de entorno estén definidas
            if (!azureApiUrl || !azureApiKey || !azureModelName) {
                throw new Error('La configuración de Azure no está completa en el archivo .env.');
            }

            // Enviar el prompt al servicio de Azure
            const response = await axios.post(
                `${azureApiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`,
                {
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un asistente útil para Flutter. Cuando te pidan crear componentes, formularios o widgets de Flutter, responde SIEMPRE con un JSON que describa ÚNICAMENTE widgets de tipo input. El JSON debe tener la siguiente estructura: {"widgets": [{"type": "Widget_Type", "props": {"prop1": "value1"}, "children": []}], "explanation": "Explicación de los widgets"}.  \n\nLos tipos de widgets de input disponibles incluyen ÚNICAMENTE: TextFormField, ElevatedButton, Select, DropdownButton, Radio, RadioListTile, Checkbox, Switch, Text. Ten en cuenta que Select y DropdownButton son equivalentes, puedes usar cualquiera de los dos. Para Radio y RadioListTile, puedes usar la propiedad "options" o "items" con un array de objetos que tengan "label" y "value". No incluyas widgets de tipo layout como Container, Row, Column, SizedBox, Form, etc. ni otros tipos de widgets que no estén en la lista. \n\nEjemplo de respuesta para un formulario de login: \n```json\n{"widgets": [{"type": "TextFormField", "props": {"decoration": "InputDecoration(labelText: \\"Email\\")", "keyboardType": "TextInputType.email"}, "children": []}, {"type": "TextFormField", "props": {"decoration": "InputDecoration(labelText: \\"Password\\")", "obscureText": true}, "children": []}, {"type": "ElevatedButton", "props": {"child": "Text(\\"Login\\")", "onPressed": "() {}"}, "children": []}], "explanation": "Este es un formulario de login con campos para email y contraseña, y un botón para enviar."}\n```'
                        },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1500,
                    temperature: 0.7
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': azureApiKey
                    }
                }
            );

            if (response.data && response.data.choices) {
                const aiResponse = response.data.choices[0].message.content;
                console.log('AI Response:', aiResponse);

                // Try to parse the response as JSON
                try {
                    const jsonResponse = this.parseAIResponseAsJSON(aiResponse);
                    if (jsonResponse && jsonResponse.widgets && Array.isArray(jsonResponse.widgets)) {
                        // Filter widgets to only include allowed types
                        const allowedWidgetTypes = ['TextFormField', 'ElevatedButton', 'Select', 'DropdownButton', 'Radio', 'RadioListTile', 'Checkbox', 'Switch', 'Text'];
                        const filteredWidgets = jsonResponse.widgets.filter((widget: any) =>
                            allowedWidgetTypes.includes(widget.type)
                        );

                        // Log filtered widgets for debugging
                        console.log('Original widgets:', jsonResponse.widgets);
                        console.log('Filtered widgets:', filteredWidgets);

                        // Add the response to the chat with filtered widgets
                        updatedMessages.push({
                            text: jsonResponse.explanation || aiResponse,
                            isUser: false,
                            timestamp: Date.now(),
                            widgets: filteredWidgets
                        });

                        // Show success message
                        await AlertService.prototype.success('Éxito', 'Widgets generados por la IA listos para añadir a la pizarra');
                    } else {
                        // Add the response to the chat without widgets
                        updatedMessages.push({
                            text: aiResponse,
                            isUser: false,
                            timestamp: Date.now()
                        });
                        // If JSON parsing fails, try to extract Flutter code
                        const dart = this.extractFromFirstImport(aiResponse);
                        console.log('Extracted Dart code:', dart);

                        // Only extract allowed widget types from the code
                        const allowedWidgetTypes = ['TextFormField', 'ElevatedButton', 'Select', 'DropdownButton', 'Radio', 'RadioListTile', 'Checkbox', 'Switch', 'Text'];
                        const filteredDart = this.filterCodeForAllowedWidgets(dart, allowedWidgetTypes);
                        console.log('Filtered Dart code for allowed widgets:', filteredDart);

                        parseFlutterWidgets(filteredDart);
                    }
                } catch (error) {
                    console.error('Error parsing AI response:', error);

                    // Add the response to the chat without widgets
                    updatedMessages.push({
                        text: aiResponse,
                        isUser: false,
                        timestamp: Date.now()
                    });

                    // If JSON parsing fails, try to extract Flutter code
                    const dart = this.extractFromFirstImport(aiResponse);
                    console.log('Extracted Dart code:', dart);

                    // Only extract allowed widget types from the code
                    const allowedWidgetTypes = ['TextFormField', 'ElevatedButton', 'Select', 'DropdownButton', 'Radio', 'RadioListTile', 'Checkbox', 'Switch', 'Text'];
                    const filteredDart = this.filterCodeForAllowedWidgets(dart, allowedWidgetTypes);
                    console.log('Filtered Dart code for allowed widgets:', filteredDart);

                    parseFlutterWidgets(filteredDart);
                }
            } else {
                updatedMessages.push({
                    text: 'No se pudo generar una respuesta.',
                    isUser: false,
                    timestamp: Date.now()
                });
            }
        } catch (error: any) {
            console.error('Error al consultar Azure:', error);
            updatedMessages.push({
                text: `Error: ${error.response?.data?.message || 'Error interno del servidor'}`,
                isUser: false,
                timestamp: Date.now()
            });
        } finally {
            processingState = false;
        }

        return { aiMessages: updatedMessages, isProcessingAI: processingState };
    }

    /**
     * Filters Dart code to only include allowed widget types
     * @param code The Dart code to filter
     * @param allowedWidgetTypes Array of allowed widget types
     * @returns The filtered Dart code
     */
    static filterCodeForAllowedWidgets(code: string, allowedWidgetTypes: string[]): string {
        console.log('Filtering code for allowed widget types:', allowedWidgetTypes);

        if (!code || !allowedWidgetTypes || allowedWidgetTypes.length === 0) {
            return code;
        }

        try {
            // Create a regex pattern to match widget definitions
            // This pattern matches widget constructor calls like "TextFormField(" or "ElevatedButton("
            const widgetPattern = new RegExp(`\\b(${allowedWidgetTypes.join('|')})\\s*\\(`, 'g');

            // Find all matches of allowed widget types in the code
            const matches: string[] = [];
            let match;
            while ((match = widgetPattern.exec(code)) !== null) {
                // Get the start position of the match
                const startPos = match.index;

                // Find the matching closing parenthesis
                let openParens = 1;
                let endPos = startPos + match[0].length;

                while (openParens > 0 && endPos < code.length) {
                    if (code[endPos] === '(') {
                        openParens++;
                    } else if (code[endPos] === ')') {
                        openParens--;
                    }
                    endPos++;
                }

                // Extract the complete widget definition
                if (openParens === 0) {
                    const widgetDef = code.substring(startPos, endPos);
                    matches.push(widgetDef);
                }
            }

            // If no matches found, return empty string
            if (matches.length === 0) {
                console.log('No allowed widget types found in code');
                return '';
            }

            // Join the matches to create the filtered code
            const filteredCode = matches.join('\n\n');
            console.log(`Found ${matches.length} allowed widget definitions`);

            return filteredCode;
        } catch (error) {
            console.error('Error filtering code for allowed widgets:', error);
            return code; // Return original code in case of error
        }
    }

    /**
     * Converts a color name to a hex color
     * @param colorName The name of the color
     * @returns The color in HEX format
     */
    private static colorNameToHex(colorName: string): string {
        const colorMap: Record<string, string> = {
            red: 'FF0000',
            blue: '0000FF',
            green: '00FF00',
            yellow: 'FFFF00',
            black: '000000',
            white: 'FFFFFF',
            grey: '808080',
            purple: '800080',
            orange: 'FFA500',
            pink: 'FFC0CB',
            brown: 'A52A2A',
            cyan: '00FFFF',
            teal: '008080',
            indigo: '4B0082',
            amber: 'FFBF00',
            lime: '00FF00'
        };

        return colorMap[colorName.toLowerCase()] || '000000';
    }
}
