// services/WidgetParserService.ts
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { FlutterWidget } from '@/Data/Pizarra';
import { JsonUtils } from '@/utils/JsonUtils';

export interface AIResponse {
    framework: string;
    widgets: any[];
    explanation: string;
    code?: string;
}

export class WidgetParserService {
    /**
     * Parses the AI response as JSON
     */
    parseAIResponseAsJSON(aiResponse: string): AIResponse | null {
        console.log('Parsing AI response as JSON...');

        try {
            const cleanResponse = aiResponse.replace(/\r\n/g, '\n').trim();

            // Try to find JSON in markdown code blocks
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
                            jsonString = JsonUtils.cleanJsonString(jsonString);
                            const jsonObject = JsonUtils.parseJsonSafe(jsonString);

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
                const cleanedResponse = JsonUtils.cleanJsonString(cleanResponse);
                const jsonObject = JsonUtils.parseJsonSafe(cleanedResponse);
                if (this.isValidAIResponse(jsonObject)) {
                    console.log('Successfully parsed entire response as JSON:', jsonObject);
                    return jsonObject;
                }
            } catch (error: any) {
                console.log('Failed to parse entire response as JSON, trying to extract...', error.message);
            }

            // Look for JSON objects in the text
            const jsonPatterns = [
                /{[\s\S]*?"widgets"\s*:\s*\[[\s\S]*?\][\s\S]*?}/g,
                /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g,
                /{[\s\S]*?}/g
            ];

            for (const pattern of jsonPatterns) {
                const matches = [...cleanResponse.matchAll(pattern)];
                for (const match of matches) {
                    let jsonString = match[0];
                    try {
                        jsonString = JsonUtils.cleanJsonString(jsonString);
                        const jsonObject = JsonUtils.parseJsonSafe(jsonString);
                        if (this.isValidAIResponse(jsonObject)) {
                            console.log('Successfully extracted and parsed JSON:', jsonObject);
                            return jsonObject;
                        }
                    } catch (error: any) {
                        console.log('Failed to parse extracted JSON, continuing...', error.message);
                    }
                }
            }

            // Construct from text if no valid JSON found
            console.log('No valid JSON found, attempting to construct from text...');
            return this.constructJSONFromText(cleanResponse);

        } catch (error) {
            console.error('Error in parseAIResponseAsJSON:', error);
            return null;
        }
    }

    /**
     * Extracts Flutter code from an AI response
     */
    extractFromFirstImport(inputString: string): string {
        console.log('Extracting code from AI response...');

        try {
            // First, try to find code blocks in markdown format
            const codeBlockRegex = /```(?:dart|flutter)?\s*([\s\S]*?)\s*```/g;
            const codeBlocks = [];
            let match;

            while ((match = codeBlockRegex.exec(inputString)) !== null) {
                if (match[1] && match[1].trim()) {
                    codeBlocks.push(match[1].trim());
                }
            }

            if (codeBlocks.length > 0) {
                console.log(`Found ${codeBlocks.length} code blocks in markdown format`);
                return codeBlocks.join('\n\n');
            }

            // Look for import statements
            const importIndex = inputString.indexOf('import');
            if (importIndex !== -1) {
                console.log('Found import statement');
                return inputString.slice(importIndex);
            }

            // Look for class or widget definitions
            const classMatch = /class\s+\w+/.exec(inputString);
            if (classMatch) {
                console.log('Found class definition');
                const classIndex = classMatch.index;
                return inputString.slice(classIndex);
            }

            // Look for common Flutter widget patterns
            const widgetMatch = /((?:Container|Scaffold|Column|Row|Text|Center|AppBar|SizedBox|Padding|Card|ListView|Stack)\s*\()/.exec(inputString);
            if (widgetMatch) {
                console.log(`Found widget definition: ${widgetMatch[1]}`);
                const widgetIndex = widgetMatch.index;
                return inputString.slice(widgetIndex);
            }

            console.log('No code patterns found, using original text');
            return inputString;
        } catch (error) {
            console.error('Error in extractFromFirstImport:', error);
            return inputString;
        }
    }

    /**
     * Parses Flutter widgets from code
     */
    parseFlutterWidgets(
        inputCode: string,
        availableWidgets: any[],
        widgetIdCounter: number,
        currentScreen: any,
        roomId: string | null,
        currentUser: string,
        socket: any
    ): number {
        console.log('Parsing Flutter widgets from code...');

        const widgetRegex = /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableFlutter|CardText|Scaffold|AppBarFlutter|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|ElevatedButtonFlutter|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\b/g;

        let localWidgetIdCounter = widgetIdCounter;

        try {
            const widgetWithContentRegex = /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableFlutter|CardText|Scaffold|AppBarFlutter|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|ElevatedButtonFlutter|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(([\s\S]*?)(?:\)\s*,|\)$|\);)/g;

            const childRegex = /child\s*:\s*(?:(?:const\s+)?([A-Za-z][A-Za-z0-9_]*)\s*\(|([A-Za-z][A-Za-z0-9_]*)\s*\.\s*[a-zA-Z]+\()/;
            const childrenRegex = /children\s*:\s*\[\s*([\s\S]*?)\s*\]\s*(?:,|$)/;
            const childrenWidgetsRegex = /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableFlutter|CardText|Scaffold|AppBarFlutter|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|ElevatedButtonFlutter|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(/g;

            const widgetDefinitions: FlutterWidget[] = [];
            let widgetMatch;

            while ((widgetMatch = widgetWithContentRegex.exec(inputCode)) !== null) {
                const widgetType = widgetMatch[1];
                const widgetContent = widgetMatch[2];

                const widgetDefinition = availableWidgets.find((w) => w.type === widgetType);
                if (widgetDefinition) {
                    const newWidget: FlutterWidget = {
                        id: `widget-${localWidgetIdCounter++}`,
                        type: widgetDefinition.type,
                        props: this.extractProperties(widgetContent, widgetDefinition),
                        children: []
                    };

                    const childMatch = childRegex.exec(widgetContent);
                    if (childMatch) {
                        (newWidget as any).pendingChild = childMatch[1];
                    }

                    const childrenMatch = childrenRegex.exec(widgetContent);
                    if (childrenMatch) {
                        (newWidget as any).pendingChildren = childrenMatch[1].split(',')
                            .map(child => child.trim())
                            .filter(child => child.length > 0);
                    }

                    widgetDefinitions.push(newWidget);
                }
            }

            // Process widget hierarchy
            const rootWidgets: FlutterWidget[] = [];
            const processedWidgets = new Set<string | number>();

            // Process widgets with children
            widgetDefinitions.forEach((widget: FlutterWidget) => {
                if ((widget as any).pendingChildren) {
                    childrenWidgetsRegex.lastIndex = 0;
                    const childrenContent = Array.isArray((widget as any).pendingChildren) ? (widget as any).pendingChildren.join(',') : '';
                    const childTypes: string[] = [];
                    let widgetMatch: RegExpExecArray | null;

                    while ((widgetMatch = childrenWidgetsRegex.exec(childrenContent)) !== null) {
                        childTypes.push(widgetMatch[1]);
                    }

                    childTypes.forEach((childType: string) => {
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

            // Process widgets with single child
            widgetDefinitions.forEach((widget: FlutterWidget) => {
                if ((widget as any).pendingChild) {
                    const childType = (widget as any).pendingChild;
                    const childWidget = widgetDefinitions.find((w: FlutterWidget) => w.type === childType && !processedWidgets.has(w.id));
                    if (childWidget) {
                        if (!widget.children) widget.children = [];
                        widget.children.push(childWidget);
                        processedWidgets.add(childWidget.id);
                    }
                    delete (widget as any).pendingChild;
                }
            });

            // Add unprocessed widgets to root
            widgetDefinitions.forEach((widget: FlutterWidget) => {
                if (!processedWidgets.has(widget.id)) {
                    rootWidgets.push(widget);
                }
            });

            // Add widgets to canvas and emit events
            rootWidgets.forEach((widget) => {
                if (currentScreen) {
                    if (!widget.id) {
                        widget.id = `widget-${localWidgetIdCounter++}`;
                    }
                    if (!widget.children || !Array.isArray(widget.children)) {
                        widget.children = [];
                    }
                }

                socket.emit('flutter-widget-added', {
                    roomId: roomId,
                    widget: widget,
                    userId: currentUser
                });
            });

            // Fallback to simple approach if no widgets found
            if (rootWidgets.length === 0) {
                const foundWidgets = new Set<string>();
                let match: RegExpExecArray | null;

                while ((match = widgetRegex.exec(inputCode)) !== null) {
                    foundWidgets.add(match[1]);
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

                        widgetDefinition.properties.forEach((prop: { name: string, defaultValue: any }) => {
                            newWidget.props[prop.name] = prop.defaultValue;
                        });

                        if (currentScreen && Array.isArray(currentScreen.elements)) {
                            currentScreen.elements.push(newWidget);
                        }

                        socket.emit('flutter-widget-added', {
                            roomId: roomId,
                            widget: newWidget,
                            userId: currentUser
                        });
                    }
                });
            }
        } catch (error: any) {
            console.error('Error in parseFlutterWidgets:', error);
            // Fallback implementation
            const foundWidgets = new Set<string>();
            let match;

            while ((match = widgetRegex.exec(inputCode)) !== null) {
                foundWidgets.add(match[1]);
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

                    widgetDefinition.properties.forEach((prop: { name: string, defaultValue: any }) => {
                        newWidget.props[prop.name] = prop.defaultValue;
                    });

                    if (currentScreen && Array.isArray(currentScreen.elements)) {
                        currentScreen.elements.push(newWidget);
                    }
                }
            });
        }

        return localWidgetIdCounter;
    }

    /**
     * Corrects Flutter code
     */
    async correctFlutterCode(flutterCode: string): Promise<string> {
        console.log('Sending Flutter code for correction:', flutterCode);

        const azureApiUrl = import.meta.env.VITE_AZURE_API_URL;
        const azureApiKey = import.meta.env.VITE_AZURE_API_KEY;
        const azureModelName = import.meta.env.VITE_AZURE_MODEL_NAME;
        const azureDeploymentName = import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || azureModelName;

        try {
            if (!azureApiUrl || !azureApiKey || !azureModelName) {
                throw new Error('La configuración de Azure no está completa en el archivo .env.');
            }

            const response = await axios.post(
                `${azureApiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`,
                {
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un experto en Flutter y Dart. Tu tarea es corregir el código Flutter proporcionado para que sea compatible con Flutter 3.0.0 y Dart 2.17.0. Debes mantener la misma funcionalidad pero asegurarte de que el código siga las mejores prácticas y sea compatible con estas versiones específicas. IMPORTANTE: Debes preservar TODOS los imports existentes y asegurarte de que cada archivo tenga los imports necesarios. Responde ÚNICAMENTE con el código corregido, sin explicaciones adicionales.'
                        },
                        {
                            role: 'user',
                            content: `Por favor, corrige este código Flutter para que sea compatible con Flutter 3.0.0 y Dart 2.17.0. IMPORTANTE: Asegúrate de preservar TODOS los imports existentes y que cada archivo tenga los imports necesarios.\n\n${flutterCode}`
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
     * Corrects Angular code
     */
    async correctAngularCode(angularCode: string): Promise<string> {
        console.log('Sending Angular code for correction:', angularCode);

        const azureApiUrl = import.meta.env.VITE_AZURE_API_URL;
        const azureApiKey = import.meta.env.VITE_AZURE_API_KEY;
        const azureModelName = import.meta.env.VITE_AZURE_MODEL_NAME;
        const azureDeploymentName = import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || azureModelName;

        try {
            if (!azureApiUrl || !azureApiKey || !azureModelName) {
                throw new Error('La configuración de Azure no está completa en el archivo .env.');
            }

            const response = await axios.post(
                `${azureApiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`,
                {
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un experto en Angular y TypeScript. Tu tarea es corregir el código Angular proporcionado para que sea compatible con Angular 15.0.0 y TypeScript 4.8.0. Debes mantener la misma funcionalidad pero asegurarte de que el código siga las mejores prácticas y sea compatible con estas versiones específicas. IMPORTANTE: Debes preservar TODOS los imports existentes y asegurarte de que cada archivo tenga los imports necesarios. Responde ÚNICAMENTE con el código corregido, sin explicaciones adicionales.'
                        },
                        {
                            role: 'user',
                            content: `Por favor, corrige este código Angular para que sea compatible con Angular 15.0.0 y TypeScript 4.8.0. IMPORTANTE: Asegúrate de preservar TODOS los imports existentes y que cada archivo tenga los imports necesarios.\n\n${angularCode}`
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
                console.log('Corrected Angular code (raw):', correctedCode);

                const codeBlockRegex = /```(?:typescript|ts|angular)?\s*([\s\S]*?)\s*```/g;
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

                console.log('Corrected Angular code (processed):', correctedCode);
                await AlertService.prototype.success('Éxito', 'Código Angular mejorado generado correctamente');

                return correctedCode;
            } else {
                throw new Error('No se recibió una respuesta válida de Azure.');
            }
        } catch (error) {
            console.error('Error correcting Angular code:', error);
            await AlertService.prototype.error('Error', 'No se pudo corregir el código Angular');
            return 'Error: No se pudo corregir el código Angular. Por favor, inténtalo de nuevo.';
        }
    }

    /**
     * Extracts individual files from project code based on framework
     * @param code The complete project code
     * @param framework The framework (angular or flutter)
     * @returns An object with file paths as keys and file content as values
     */
    extractFilesFromProject(code: string, framework: string): Record<string, string> {
        console.log(`Extracting ${framework} files from project code...`);
        const files: Record<string, string> = {};

        try {
            if (framework === 'angular') {
                // Extract Angular component files
                const componentMatches = code.matchAll(/\/\/ (\w+)\.component\.ts[\s\S]*?export class (\w+)Component[\s\S]*?}/g);
                for (const match of componentMatches) {
                    const componentName = match[1];
                    const content = match[0];
                    files[`src/app/${componentName}/${componentName}.component.ts`] = content;
                }

                // Extract Angular module files
                const moduleMatches = code.match(/\/\/ app\.module\.ts[\s\S]*?export class AppModule[\s\S]*?}/);
                if (moduleMatches) {
                    files['src/app/app.module.ts'] = moduleMatches[0];
                }

                // Extract Angular routing files
                const routingMatches = code.match(/\/\/ app-routing\.module\.ts[\s\S]*?export class AppRoutingModule[\s\S]*?}/);
                if (routingMatches) {
                    files['src/app/app-routing.module.ts'] = routingMatches[0];
                }

                // If no files were extracted, add the entire code as a single file
                if (Object.keys(files).length === 0) {
                    files['src/app/app.component.ts'] = code;
                }
            } else if (framework === 'flutter') {
                // Extract Flutter main.dart completo con imports
                const mainMatch = code.match(/(?:import\s+[^;]+;[\s]*)*void main\(\)[\s\S]*?class MyApp[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/);
                if (mainMatch) {
                    files['lib/main.dart'] = mainMatch[0];
                }

                // Extract Flutter screen classes with imports
                const screenPattern = /(?:(?:import\s+[^;]+;[\s]*)*)?class (\w+) extends (StatelessWidget|StatefulWidget|ChangeNotifier|InheritedWidget|Widget|State<\w+>)[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
                const screenMatches = code.matchAll(screenPattern);

                for (const match of screenMatches) {
                    const className = match[1];

                    if (className !== 'MyApp' && className !== 'NavigationDrawer') {
                        // Determine folder based on class name
                        let folder = 'lib/widgets';
                        if (className.endsWith('Screen') || className.endsWith('Page')) {
                            folder = 'lib/screens';
                        }

                        const fileName = className.charAt(0).toLowerCase() + className.slice(1);

                        // Look for imports specific to this class
                        const classStartIndex = code.indexOf(match[0]);
                        const beforeClass = code.substring(0, classStartIndex);
                        const importsMatch = beforeClass.match(/(?:import\s+[^;]+;[\s]*)+$/);

                        let fileContent = match[0];
                        if (importsMatch) {
                            fileContent = importsMatch[0] + '\n' + match[0];
                        } else {
                            // Add basic Flutter import if no imports found
                            fileContent = "import 'package:flutter/material.dart';\n\n" + match[0];
                        }

                        files[`${folder}/${fileName}.dart`] = fileContent;
                    }
                }

                // Extract NavigationDrawer with imports
                const drawerPattern = /(?:(?:import\s+[^;]+;[\s]*)*)?class NavigationDrawer[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/;
                const drawerMatch = code.match(drawerPattern);

                if (drawerMatch) {
                    // Look for imports specific to NavigationDrawer
                    const classStartIndex = code.indexOf(drawerMatch[0]);
                    const beforeClass = code.substring(0, classStartIndex);
                    const importsMatch = beforeClass.match(/(?:import\s+[^;]+;[\s]*)+$/);

                    let fileContent = drawerMatch[0];
                    if (importsMatch) {
                        fileContent = importsMatch[0] + '\n' + drawerMatch[0];
                    } else {
                        // Add basic Flutter import if no imports found
                        fileContent = "import 'package:flutter/material.dart';\n\n" + drawerMatch[0];
                    }

                    files['lib/widgets/navigation_drawer.dart'] = fileContent;
                }

                // Extract model classes with imports
                const modelPattern = /(?:(?:import\s+[^;]+;[\s]*)*)?class (\w+)(?:\s+extends\s+\w+)?(?:\s+with\s+\w+)?[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
                const modelMatches = code.matchAll(modelPattern);

                for (const match of modelMatches) {
                    const className = match[1];

                    // Only include if not widget, service, or MyApp
                    if (!className.includes('Widget') && !className.includes('Service') &&
                        !className.includes('State') && className !== 'MyApp' &&
                        !className.includes('Screen') && !className.includes('Page') &&
                        className !== 'NavigationDrawer') {

                        const fileName = className.charAt(0).toLowerCase() + className.slice(1);

                        // Look for imports specific to this class
                        const classStartIndex = code.indexOf(match[0]);
                        const beforeClass = code.substring(0, classStartIndex);
                        const importsMatch = beforeClass.match(/(?:import\s+[^;]+;[\s]*)+$/);

                        let fileContent = match[0];
                        if (importsMatch) {
                            fileContent = importsMatch[0] + '\n' + match[0];
                        } else {
                            // Add basic Flutter import if no imports found
                            fileContent = "import 'package:flutter/material.dart';\n\n" + match[0];
                        }

                        files[`lib/models/${fileName}.dart`] = fileContent;
                    }
                }

                // If no files were extracted, add the entire code as a single file
                if (Object.keys(files).length === 0) {
                    files['lib/main.dart'] = code;
                }
            }

            console.log(`Extracted ${Object.keys(files).length} files from ${framework} project code`);
            return files;
        } catch (error) {
            console.error(`Error extracting ${framework} files:`, error);
            // Return the entire code as a single file if extraction fails
            if (framework === 'angular') {
                return { 'src/app/app.component.ts': code };
            } else {
                return { 'lib/main.dart': code };
            }
        }
    }

    /**
     * Verifies all files in a project
     * @param files Object with file paths as keys and file content as values
     * @param framework The framework (angular or flutter)
     * @param progressCallback Optional callback to report verification progress
     * @returns Object with verification results for each file
     */
    async verifyProjectFiles(
        files: Record<string, string>,
        framework: string,
        progressCallback?: (progress: number, total: number, currentFile: string) => void
    ): Promise<{
        isValid: boolean;
        fileResults: Record<string, { isValid: boolean; correctedCode?: string; message: string }>
    }> {
        console.log(`Verifying ${Object.keys(files).length} ${framework} files...`);

        const fileResults: Record<string, { isValid: boolean; correctedCode?: string; message: string }> = {};
        const fileEntries = Object.entries(files);
        let overallIsValid = true;

        for (let i = 0; i < fileEntries.length; i++) {
            const [filePath, fileContent] = fileEntries[i];

            // Report progress if callback is provided
            if (progressCallback) {
                progressCallback(i, fileEntries.length, filePath);
            }

            try {
                console.log(`Verifying file: ${filePath}`);

                let correctedCode: string;
                if (framework === 'angular') {
                    correctedCode = await this.correctAngularCode(fileContent);
                } else {
                    correctedCode = await this.correctFlutterCode(fileContent);
                }

                const isFileValid = correctedCode === fileContent;

                if (!isFileValid) {
                    overallIsValid = false;
                }

                fileResults[filePath] = {
                    isValid: isFileValid,
                    correctedCode: isFileValid ? undefined : correctedCode,
                    message: isFileValid
                        ? `El archivo ${filePath} es válido y sigue las mejores prácticas.`
                        : `Se encontraron problemas en el archivo ${filePath}. Se han aplicado correcciones automáticamente.`
                };
            } catch (error) {
                console.error(`Error verifying file ${filePath}:`, error);
                overallIsValid = false;
                fileResults[filePath] = {
                    isValid: false,
                    message: `Error al verificar el archivo ${filePath}: ${error instanceof Error ? error.message : 'Error desconocido'}`
                };
            }
        }

        console.log(`Verification complete. Overall valid: ${overallIsValid}`);
        return {
            isValid: overallIsValid,
            fileResults
        };
    }

    /**
     * Filters code for allowed widget types
     */
    filterCodeForAllowedWidgets(code: string, allowedWidgetTypes: string[]): string {
        console.log('Filtering code for allowed widget types:', allowedWidgetTypes);

        if (!code || !allowedWidgetTypes || allowedWidgetTypes.length === 0) {
            return code;
        }

        try {
            const widgetPattern = new RegExp(`\\b(${allowedWidgetTypes.join('|')})\\s*\\(`, 'g');
            const matches: string[] = [];
            let match;

            while ((match = widgetPattern.exec(code)) !== null) {
                const startPos = match.index;
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

                if (openParens === 0) {
                    const widgetDef = code.substring(startPos, endPos);
                    matches.push(widgetDef);
                }
            }

            if (matches.length === 0) {
                console.log('No allowed widget types found in code');
                return '';
            }

            const filteredCode = matches.join('\n\n');
            console.log(`Found ${matches.length} allowed widget definitions`);

            return filteredCode;
        } catch (error) {
            console.error('Error filtering code for allowed widgets:', error);
            return code;
        }
    }

    // Private helper methods
    private extractProperties(widgetContent: string, widgetDefinition: any): Record<string, any> {
        const props: Record<string, any> = {};

        widgetDefinition.properties.forEach((prop: { name: string, defaultValue: any }) => {
            props[prop.name] = prop.defaultValue;
        });

        widgetDefinition.properties.forEach((prop: { name: string, type: string, defaultValue: any }) => {
            let propRegex: RegExp;
            let valueExtractor = (match: RegExpExecArray) => match[1];

            switch (prop.type) {
                case 'string':
                    propRegex = new RegExp(`${prop.name}\\s*:\\s*['"]([^'"]*?)['"]`, 'i');
                    break;
                case 'number':
                    propRegex = new RegExp(`${prop.name}\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i');
                    valueExtractor = (match: RegExpExecArray) => String(parseFloat(match[1]));
                    break;
                case 'boolean':
                    propRegex = new RegExp(`${prop.name}\\s*:\\s*(true|false)`, 'i');
                    valueExtractor = (match: RegExpExecArray) => match[1].toLowerCase() === 'true' ? 'true' : 'false';
                    break;
                case 'color':
                    propRegex = new RegExp(`${prop.name}\\s*:\\s*(?:Colors\\.([a-zA-Z]+)|Color\\(0x([0-9A-Fa-f]+)\\)|'#([0-9A-Fa-f]+)')`, 'i');
                    valueExtractor = (match: RegExpExecArray) => {
                        if (match[1]) return `#${this.colorNameToHex(match[1])}`;
                        if (match[2]) return `#${match[2]}`;
                        if (match[3]) return `#${match[3]}`;
                        return prop.defaultValue;
                    };
                    break;
                case 'select':
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
                    propRegex = new RegExp(`${prop.name}\\s*:\\s*([^,}]+)`, 'i');
                    valueExtractor = (match: RegExpExecArray) => match[1].trim();
            }

            const match = propRegex.exec(widgetContent);
            if (match) {
                props[prop.name] = valueExtractor(match);
            }
        });

        if (widgetDefinition.type === 'Text') {
            const textMatch = /Text\s*\(\s*['"]([^'"]*)['"]/i.exec(widgetContent);
            if (textMatch) {
                props['data'] = textMatch[1];
            }
        }

        return props;
    }

    private isValidAIResponse(obj: any): boolean {
        return obj &&
            typeof obj === 'object' &&
            (obj.widgets || obj.explanation || obj.framework || obj.code);
    }

    private constructJSONFromText(text: string): any {
        console.log('Attempting to construct JSON from text...');

        const framework = /\b(flutter|angular)\b/i.exec(text)?.[1]?.toLowerCase() || 'flutter';

        const constructedResponse = {
            framework: framework,
            explanation: text.length > 500 ? text.substring(0, 500) + '...' : text,
            widgets: [],
            code: null
        };

        console.log('Constructed basic response from text:', constructedResponse);
        return constructedResponse;
    }

    private colorNameToHex(colorName: string): string {
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
