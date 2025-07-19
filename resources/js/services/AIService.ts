// services/AIService.ts
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { FlutterWidget } from '@/Data/Pizarra';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export class AIService {
    /**
     * Test Azure Speech Service configuration
     * @returns Configuration status and test results
     */
    static async testSpeechConfiguration(): Promise<{
        success: boolean;
        configuration: any;
        message: string;
    }> {
        console.log('Testing Azure Speech Service configuration...');

        // Extract configuration from environment
        const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
        const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION;
        const speechLanguage = import.meta.env.VITE_AZURE_SPEECH_LANGUAGE || 'es-ES';

        const configuration = {
            speechKey: speechKey ? 'Set (length: ' + speechKey.length + ')' : 'Not set',
            speechRegion: speechRegion || 'Not set',
            speechLanguage: speechLanguage || 'Not set',
            isConfigured: !!(speechKey && speechRegion)
        };

        try {
            // Validate environment variables
            if (!speechKey || !speechRegion) {
                return {
                    success: false,
                    configuration,
                    message: 'La configuración de Azure Speech no está completa en el archivo .env.'
                };
            }

            // Test speech config creation
            const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
            speechConfig.speechRecognitionLanguage = speechLanguage;

            return {
                success: true,
                configuration,
                message: 'Configuración de Azure Speech validada correctamente'
            };
        } catch (error: any) {
            console.error('Error testing Azure Speech configuration:', error);
            return {
                success: false,
                configuration,
                message: 'Error al validar la configuración: ' + error.message
            };
        }
    }

    /**
     * Converts audio to text using Azure Speech Services
     * @param audioBlob The audio blob to convert to text
     * @returns The transcribed text
     */
    static async convertAudioToText(audioBlob: Blob): Promise<string> {
        console.log('Converting audio to text using Azure Speech Services...');

        // Extract configuration from environment
        const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
        const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION;
        const speechLanguage = import.meta.env.VITE_AZURE_SPEECH_LANGUAGE || 'es-ES';

        try {
            // Validate environment variables
            if (!speechKey || !speechRegion) {
                throw new Error('La configuración de Azure Speech no está completa en el archivo .env.');
            }

            // Create the speech config
            const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
            speechConfig.speechRecognitionLanguage = speechLanguage;

            // Convert the blob to an array buffer
            const arrayBuffer = await audioBlob.arrayBuffer();

            // Create the audio config from the array buffer
            const pushStream = sdk.AudioInputStream.createPushStream();
            pushStream.write(arrayBuffer);
            pushStream.close();
            const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

            // Create the speech recognizer
            const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

            // Start the recognition
            return new Promise((resolve, reject) => {
                recognizer.recognizeOnceAsync(
                    (result) => {
                        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                            console.log(`RECOGNIZED: Text=${result.text}`);
                            resolve(result.text);
                        } else {
                            console.log(`ERROR: Speech was cancelled or could not be recognized. Reason=${result.reason}`);
                            reject(new Error(`Speech recognition failed: ${result.reason}`));
                        }
                        recognizer.close();
                    },
                    (err) => {
                        console.error(`ERROR: ${err}`);
                        recognizer.close();
                        reject(err);
                    }
                );
            });
        } catch (error) {
            console.error('Error converting audio to text:', error);
            await AlertService.prototype.error('Error', 'No se pudo convertir el audio a texto');
            throw error;
        }
    }

    /**
     * Processes an audio prompt and sends it to the AI
     * @param audioBlob The audio blob to process
     * @param aiMessages Array of AI messages
     * @param isProcessingAI Flag indicating if the AI is processing
     * @param parseFlutterWidgets Function to parse Flutter widgets
     * @returns The updated AI messages and processing flag
     */
    static async processAudioPrompt(
        audioBlob: Blob,
        aiMessages: any[],
        isProcessingAI: boolean,
        parseFlutterWidgets: (code: string) => void
    ): Promise<{ aiMessages: any[], isProcessingAI: boolean }> {
        console.log('Processing audio prompt...');

        try {
            // Set processing state to true
            const processingState = true;

            // Convert audio to text
            const transcribedText = await this.convertAudioToText(audioBlob);
            console.log('Transcribed text:', transcribedText);

            if (!transcribedText.trim()) {
                throw new Error('No se pudo transcribir el audio. Por favor, inténtalo de nuevo.');
            }

            // Add transcribed text as user message
            const updatedMessages = [...aiMessages];
            updatedMessages.push({
                text: `🎤 ${transcribedText}`,
                isUser: true,
                timestamp: Date.now()
            });

            // Send the transcribed text to the AI
            const result = await this.sendAIPrompt(
                transcribedText,
                updatedMessages,
                processingState,
                parseFlutterWidgets
            );

            return result;
        } catch (error: any) {
            console.error('Error processing audio prompt:', error);

            // Create a copy of the aiMessages array
            const updatedMessages = [...aiMessages];

            // Add error message
            updatedMessages.push({
                text: `Error al procesar el audio: ${error.message || 'Error desconocido'}`,
                isUser: false,
                timestamp: Date.now()
            });

            return { aiMessages: updatedMessages, isProcessingAI: false };
        }
    }
    /**
     * Sends Flutter code to Azure for correction to make it compatible with Flutter 3.0.0 and Dart 2.17.0
     * @param flutterCode The Flutter code to correct
     * @returns The corrected Flutter code
     */
    static async correctFlutterCode(flutterCode: string): Promise<string> {
        console.log('Sending Flutter code for correction:', flutterCode);

        // Extract configuration from environment
        const azureApiUrl = import.meta.env.VITE_AZURE_API_URL;
        const azureApiKey = import.meta.env.VITE_AZURE_API_KEY;
        const azureModelName = import.meta.env.VITE_AZURE_MODEL_NAME;
        const azureDeploymentName = import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || azureModelName;

        try {
            // Validate environment variables
            if (!azureApiUrl || !azureApiKey || !azureModelName) {
                throw new Error('La configuración de Azure no está completa en el archivo .env.');
            }

            // Send the Flutter code to Azure for correction
            const response = await axios.post(
                `${azureApiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`,
                {
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un experto en Flutter y Dart. Tu tarea es corregir el código Flutter proporcionado para que sea compatible con Flutter 3.0.0 y Dart 2.17.0. Debes mantener la misma funcionalidad pero asegurarte de que el código siga las mejores prácticas y sea compatible con estas versiones específicas. Responde ÚNICAMENTE con el código corregido, sin explicaciones adicionales.'
                        },
                        {
                            role: 'user',
                            content: `Por favor, corrige este código Flutter para que sea compatible con Flutter 3.0.0 y Dart 2.17.0:\n\n${flutterCode}`
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.3
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': azureApiKey
                    }
                }
            );

            if (response.data && response.data.choices) {
                let correctedCode = response.data.choices[0].message.content;
                console.log('Corrected Flutter code (raw):', correctedCode);

                // Remove markdown code block markers
                const codeBlockRegex = /```(?:dart|flutter)?\s*([\s\S]*?)\s*```/g;
                const codeBlocks = [];
                let match;

                while ((match = codeBlockRegex.exec(correctedCode)) !== null) {
                    if (match[1] && match[1].trim()) {
                        codeBlocks.push(match[1].trim());
                    }
                }

                if (codeBlocks.length > 0) {
                    correctedCode = codeBlocks.join('\n\n');
                    console.log(`Extracted ${codeBlocks.length} code blocks from markdown`);
                }

                console.log('Corrected Flutter code (processed):', correctedCode);

                // Show success message
                await AlertService.prototype.success('Éxito', 'Código Flutter mejorado generado correctamente');

                return correctedCode;
            } else {
                throw new Error('No se recibió una respuesta válida de Azure.');
            }
        } catch (error) {
            console.error('Error correcting Flutter code:', error);
            await AlertService.prototype.error('Error', 'No se pudo corregir el código Flutter');
            return 'Error: No se pudo corregir el código Flutter. Por favor, inténtalo de nuevo.';
        }
    }
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
                        widgetDefinition.properties.forEach((prop: { name: string, defaultValue: any }) => {
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
                    widgetDefinition.properties.forEach((prop: { name: string, defaultValue: any }) => {
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
            // Normalize line endings and trim
            const cleanResponse = aiResponse.replace(/\r\n/g, '\n').trim();

            // First, try to find JSON in markdown code blocks
            const jsonCodeBlockPatterns = [
                /```json\s*([\s\S]*?)\s*```/gi,
                /```\s*([\s\S]*?)\s*```/gi
            ];

            for (const pattern of jsonCodeBlockPatterns) {
                const matches = [...cleanResponse.matchAll(pattern)];
                for (const match of matches) {
                    let jsonString = match[1]?.trim();
                    if (jsonString) {
                        try {
                            // Clean up common JSON issues
                            jsonString = this.cleanJsonString(jsonString);
                            const jsonObject = JSON.parse(jsonString);

                            // Validate that it has the expected structure
                            if (this.isValidAIResponse(jsonObject)) {
                                console.log('Successfully parsed JSON from markdown code block:', jsonObject);
                                return jsonObject;
                            }
                        } catch (error: any) {
                            console.log('Failed to parse JSON from code block, trying next...', error.message);
                        }
                    }
                }
            }

            // Try to parse the entire response as JSON
            try {
                const cleanedResponse = this.cleanJsonString(cleanResponse);
                const jsonObject = JSON.parse(cleanedResponse);
                if (this.isValidAIResponse(jsonObject)) {
                    console.log('Successfully parsed entire response as JSON:', jsonObject);
                    return jsonObject;
                }
            } catch (error: any) {
                console.log('Failed to parse entire response as JSON, trying to extract...', error.message);
            }

            // Look for JSON objects in the text using various patterns
            const jsonPatterns = [
                // Look for complete JSON objects with widgets property
                /{[\s\S]*?"widgets"\s*:\s*\[[\s\S]*?\][\s\S]*?}/g,
                // Look for any object that starts with { and ends with }
                /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g,
                // Look for objects with nested structures
                /{[\s\S]*?}/g
            ];

            for (const pattern of jsonPatterns) {
                const matches = [...cleanResponse.matchAll(pattern)];
                for (const match of matches) {
                    let jsonString = match[0];
                    try {
                        jsonString = this.cleanJsonString(jsonString);
                        const jsonObject = JSON.parse(jsonString);
                        if (this.isValidAIResponse(jsonObject)) {
                            console.log('Successfully extracted and parsed JSON:', jsonObject);
                            return jsonObject;
                        }
                    } catch (error: any) {
                        console.log('Failed to parse extracted JSON, continuing...', error.message);
                    }
                }
            }

            // If we still haven't found valid JSON, try to construct one from text
            console.log('No valid JSON found, attempting to construct from text...');
            return this.constructJSONFromText(cleanResponse);

        } catch (error) {
            console.error('Error in parseAIResponseAsJSON:', error);
            return null;
        }
    }

    /**
     * Cleans a JSON string to fix common formatting issues
     * @param jsonString The JSON string to clean
     * @returns The cleaned JSON string
     */
    private static cleanJsonString(jsonString: string): string {
        return jsonString
            // Remove trailing commas before } or ]
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix unescaped quotes in strings
            .replace(/(?<!\\)"/g, '"')
            // Fix single quotes to double quotes (but be careful with apostrophes)
            .replace(/'/g, '"')
            // Remove any leading/trailing non-JSON characters
            .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')
            .trim();
    }

    /**
     * Validates if a parsed object has the expected AI response structure
     * @param obj The object to validate
     * @returns True if valid, false otherwise
     */
    private static isValidAIResponse(obj: any): boolean {
        return obj &&
            typeof obj === 'object' &&
            (obj.widgets || obj.explanation || obj.framework || obj.code);
    }

    /**
     * Attempts to construct a JSON object from plain text response
     * @param text The text to analyze
     * @returns A constructed JSON object or null
     */
    private static constructJSONFromText(text: string): any {
        console.log('Attempting to construct JSON from text...');

        // Look for framework mentions
        const framework = /\b(flutter|angular)\b/i.exec(text)?.[1]?.toLowerCase() || 'flutter';

        // This is a basic implementation - in a real scenario you might want more sophisticated text analysis
        const constructedResponse = {
            framework: framework,
            explanation: text.length > 500 ? text.substring(0, 500) + '...' : text,
            widgets: [],
            code: null
        };

        console.log('Constructed basic response from text:', constructedResponse);
        return constructedResponse;
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
        console.log('=== AIService.sendAIPrompt STARTED ===');
        console.log('Sending AI prompt:', prompt);
        console.log('Current AI messages count:', aiMessages.length);
        console.log('Is AI processing:', isProcessingAI);

        if (!prompt.trim()) {
            console.log('Empty prompt, returning early');
            return { aiMessages, isProcessingAI };
        }

        // Create a copy of the aiMessages array to avoid modifying the original
        const updatedMessages = [...aiMessages];
        console.log('Created copy of aiMessages');

        // Add user message to chat
        updatedMessages.push({
            text: prompt,
            isUser: true,
            timestamp: Date.now()
        });
        console.log('Added user message to updatedMessages');

        // Set processing state to true for the function scope
        let processingState = true;

        // Extraer configuración de Azure desde el .env
        const azureApiUrl = import.meta.env.VITE_AZURE_API_URL;
        const azureApiKey = import.meta.env.VITE_AZURE_API_KEY;
        const azureModelName = import.meta.env.VITE_AZURE_MODEL_NAME;
        const azureDeploymentName = import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || azureModelName;

        console.log('Azure Configuration:');
        console.log('- API URL:', azureApiUrl || 'NOT SET');
        console.log('- Model Name:', azureModelName || 'NOT SET');
        console.log('- Deployment Name:', azureDeploymentName || 'NOT SET');
        console.log('- API Key:', azureApiKey ? 'SET (length: ' + azureApiKey.length + ')' : 'NOT SET');

        try {
            // Validar que las variables de entorno estén definidas
            if (!azureApiUrl || !azureApiKey || !azureModelName) {
                console.error('Azure configuration is incomplete');

                // Try to use the backend API as fallback
                console.log('Trying backend API as fallback...');
                const backendResponse = await this.sendPromptToBackend(prompt);
                if (backendResponse.success) {
                    // Process backend response
                    const responseMessage = {
                        text: backendResponse.explanation || 'Widgets generados correctamente',
                        isUser: false,
                        timestamp: Date.now(),
                        widgets: backendResponse.widgets || [],
                        framework: backendResponse.framework || 'flutter',
                        code: backendResponse.code || null
                    };

                    updatedMessages.push(responseMessage);

                    // Show success message
                    await AlertService.prototype.success(
                        'Éxito',
                        `${(backendResponse.widgets || []).length} widgets de ${(backendResponse.framework || 'flutter').toUpperCase()} generados correctamente`
                    );

                    return { aiMessages: updatedMessages, isProcessingAI: false };
                } else {
                    throw new Error('La configuración de Azure no está completa y el backend falló.');
                }
            }

            console.log('Azure configuration is complete, proceeding with API call');

            // Prepare the API endpoint URL
            const apiEndpoint = `${azureApiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`;
            console.log('API Endpoint:', apiEndpoint);

            // Prepare the request payload
            const requestPayload = {
                messages: [
                    {
                        role: 'system',
                        content: `Eres un asistente especializado en Flutter y Angular. Cuando te pidan crear componentes, formularios o widgets, responde SIEMPRE con un JSON estructurado.

ESTRUCTURA JSON REQUERIDA:
{
    "framework": "flutter" | "angular",
    "widgets": [
        {
            "type": "Widget_Type",
            "props": {
                "prop1": "value1",
                "prop2": "value2"
            },
            "children": [],
            "position": {
                "x": number,
                "y": number
            }
        }
    ],
    "explanation": "Explicación detallada de los widgets creados",
    "code": "Código completo del componente (opcional)"
}

WIDGETS FLUTTER DISPONIBLES:
- TextFormField: Para campos de entrada de texto
- ElevatedButton, TextButton, OutlinedButton: Botones
- DropdownButton, DropdownButtonFormField: Selectores
- RadioListTile, Radio: Botones de radio
- CheckboxListTile, Checkbox: Casillas de verificación
- Switch, SwitchListTile: Interruptores
- Text: Texto estático
- Slider: Control deslizante
- DatePicker, TimePicker: Selectores de fecha/hora

COMPONENTES ANGULAR DISPONIBLES:
- input: Campos de entrada (text, email, password, number, etc.)
- button: Botones (submit, button, reset)
- select: Selectores desplegables
- radio: Botones de radio
- checkbox: Casillas de verificación
- textarea: Áreas de texto
- switch, toggle: Interruptores
- slider, range: Controles deslizantes
- datepicker: Selector de fecha

EJEMPLO FLUTTER:
{
    "framework": "flutter",
    "widgets": [
        {
            "type": "TextFormField",
            "props": {
                "decoration": "InputDecoration(labelText: 'Email')",
                "keyboardType": "TextInputType.emailAddress",
                "validator": "(value) => value?.isEmpty ?? true ? 'Campo requerido' : null"
            },
            "children": [],
            "position": {"x": 50, "y": 100}
        },
        {
            "type": "ElevatedButton",
            "props": {
                "onPressed": "() => _submitForm()",
                "child": "Text('Enviar')",
                "style": "ElevatedButton.styleFrom(primary: Colors.blue)"
            },
            "children": [],
            "position": {"x": 50, "y": 200}
        }
    ],
    "explanation": "Formulario de email con validación y botón de envío"
}

EJEMPLO ANGULAR:
{
    "framework": "angular",
    "widgets": [
        {
            "type": "input",
            "props": {
                "type": "email",
                "placeholder": "Ingresa tu email",
                "formControlName": "email",
                "required": true,
                "class": "form-control"
            },
            "children": [],
            "position": {"x": 50, "y": 100}
        },
        {
            "type": "button",
            "props": {
                "type": "submit",
                "class": "btn btn-primary",
                "text": "Enviar",
                "disabled": "!myForm.valid"
            },
            "children": [],
            "position": {"x": 50, "y": 200}
        }
    ],
    "explanation": "Formulario Angular con validación reactive forms"
}

INSTRUCCIONES:
1. Detecta automáticamente si el usuario solicita Flutter o Angular
2. Si no especifica, pregunta o asume Flutter por defecto
3. Genera posiciones automáticas para los widgets (separación de ~80-100px)
4. Incluye propiedades relevantes para cada tipo de widget
5. Proporciona explicaciones claras y útiles`
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.7
            };
            console.log('Request payload prepared');

            // Prepare the request headers
            const headers = {
                'Content-Type': 'application/json',
                'api-key': azureApiKey
            };
            console.log('Request headers prepared');

            console.log('Sending API request to Azure...');
            // Enviar el prompt al servicio de Azure
            const response = await axios.post(
                apiEndpoint,
                requestPayload,
                { headers }
            );

            console.log('API response received:', response.status);
            console.log('Response data available:', !!response.data);
            console.log('Response choices available:', !!(response.data && response.data.choices));

            if (response.data && response.data.choices) {
                const aiResponse = response.data.choices[0].message.content;
                console.log('AI Response content length:', aiResponse.length);
                console.log('AI Response preview:', aiResponse.substring(0, 100) + '...');

                // Try to parse the response as JSON
                try {
                    const jsonResponse = this.parseAIResponseAsJSON(aiResponse);
                    if (jsonResponse && jsonResponse.widgets && Array.isArray(jsonResponse.widgets)) {
                        // Determine framework
                        const framework = jsonResponse.framework || 'flutter';

                        // Define allowed widget types based on framework
                        let allowedWidgetTypes: string[] = [];
                        if (framework === 'flutter') {
                            allowedWidgetTypes = [
                                'TextFormField', 'ElevatedButton', 'TextButton', 'OutlinedButton',
                                'DropdownButton', 'DropdownButtonFormField', 'RadioListTile', 'Radio',
                                'CheckboxListTile', 'Checkbox', 'Switch', 'SwitchListTile',
                                'Text', 'Slider', 'DatePicker', 'TimePicker'
                            ];
                        } else if (framework === 'angular') {
                            allowedWidgetTypes = [
                                'input', 'button', 'select', 'radio', 'checkbox',
                                'textarea', 'switch', 'toggle', 'slider', 'range', 'datepicker'
                            ];
                        }

                        // Filter widgets to only include allowed types
                        const filteredWidgets = jsonResponse.widgets.filter((widget: any) =>
                            allowedWidgetTypes.includes(widget.type)
                        );

                        // Add automatic positioning if not provided
                        filteredWidgets.forEach((widget: any, index: number) => {
                            if (!widget.position) {
                                // Usar posicionamiento vertical en lugar de grid aleatorio
                                const startX = 50;
                                const startY = 50;
                                const margin = 30;
                                
                                // Calcular posición vertical para Flutter
                                if (framework === 'flutter') {
                                    widget.position = {
                                        x: startX + (index * 10), // Pequeña variación horizontal
                                        y: startY + (index * (80 + margin)) // Posicionamiento vertical
                                    };
                                } else {
                                    // Para Angular, usar grid más ordenado
                                    const maxElementsPerRow = 3;
                                    const row = Math.floor(index / maxElementsPerRow);
                                    const col = index % maxElementsPerRow;
                                    widget.position = {
                                        x: startX + (col * 200),
                                        y: startY + (row * 100)
                                    };
                                }
                            }
                            // Ensure widget has an ID
                            if (!widget.id) {
                                widget.id = `ai-widget-${Date.now()}-${index}`;
                            }
                            // Add framework info to widget
                            widget.framework = framework;
                        });

                        // Log filtered widgets for debugging
                        console.log(`Parsed ${framework} widgets:`, jsonResponse.widgets);
                        console.log('Filtered widgets:', filteredWidgets);

                        // Add the response to the chat with filtered widgets
                        updatedMessages.push({
                            text: jsonResponse.explanation || aiResponse,
                            isUser: false,
                            timestamp: Date.now(),
                            widgets: filteredWidgets,
                            framework: framework,
                            code: jsonResponse.code || null
                        });

                        // Show success message
                        await AlertService.prototype.success(
                            'Éxito',
                            `${filteredWidgets.length} widgets de ${framework.toUpperCase()} generados y listos para añadir a la pizarra`
                        );
                    } else {
                        // Add the response to the chat without widgets
                        updatedMessages.push({
                            text: aiResponse,
                            isUser: false,
                            timestamp: Date.now()
                        });

                        // If JSON parsing fails, try to extract Flutter code (fallback)
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
            console.error('=== ERROR in AIService.sendAIPrompt ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);

            // Log more detailed information about the error
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
                console.error('Response data:', error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received. Request details:', error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error during request setup:', error.message);
            }

            // Log the stack trace
            console.error('Stack trace:', error.stack);

            // Add error message to chat
            updatedMessages.push({
                text: `Error: ${error.response?.data?.message || error.message || 'Error interno del servidor'}`,
                isUser: false,
                timestamp: Date.now()
            });
            console.log('Added error message to updatedMessages');
        } finally {
            processingState = false;
            console.log('Set processingState to false');
            console.log('=== AIService.sendAIPrompt COMPLETED ===');
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
     * Send prompt to backend API as fallback
     * @param prompt The prompt to send
     * @returns The backend response
     */
    private static async sendPromptToBackend(prompt: string): Promise<any> {
        try {
            const response = await axios.post('/ai/generate-ui-components', {
                prompt: prompt,
                framework: 'auto'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (response.data && response.data.success) {
                return {
                    success: true,
                    widgets: response.data.widgets || [],
                    framework: response.data.framework || 'flutter',
                    explanation: response.data.explanation || '',
                    code: response.data.code || null
                };
            } else {
                return {
                    success: false,
                    error: response.data?.error || 'Backend API error',
                    message: response.data?.message || 'Unknown error'
                };
            }
        } catch (error: any) {
            console.error('Backend API error:', error);
            return {
                success: false,
                error: 'Network error',
                message: error.message || 'Failed to connect to backend'
            };
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
