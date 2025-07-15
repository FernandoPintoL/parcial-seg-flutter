// services/ImageProcessingService.ts
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { FlutterWidget } from '@/types/Pizarra';

/**
 * Service for handling image processing operations
 */
export class ImageProcessingService {
    /**
     * Processes an image using the backend API
     * @param selectedImage The image file to process
     * @param widgetIdCounter Counter for generating unique widget IDs
     * @param addAIWidgetsToCanvas Function to add widgets to the canvas
     * @returns The processing result
     */
    static async processImage(
        selectedImage: File | null,
        widgetIdCounter: number,
        addAIWidgetsToCanvas: (widgets: FlutterWidget[]) => void
    ): Promise<{
        success: boolean;
        message: string;
        originalImage?: string;
        processedImage?: string;
        roboflowData?: any;
        showResultsPanel?: boolean;
    }> {
        if (!selectedImage) {
            await AlertService.prototype.error('Error', 'No se ha seleccionado ninguna imagen');
            return { success: false, message: 'No se ha seleccionado ninguna imagen' };
        }

        const url = import.meta.env.VITE_URL_SCANNER + "/api/scan";

        try {
            await AlertService.prototype.info('Procesando', 'Analizando imagen con ROBOFLOW...');

            // Create form data
            const formData = new FormData();
            formData.append('file', selectedImage);

            // Send to backend for processing
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Image processing response:', response.data);

            // Check for the new response format with files and report
            if (response.data.files && response.data.report && response.data.success) {
                console.log('Processing new format response with files and report');

                // Extract image URLs from the files object
                const originalImage = response.data.files.original_image;
                const processedImage = response.data.files.annotated_image;
                const roboflowData = response.data.report;

                // Process the components from the report
                const widgets = this.processImageScanResults({
                    components: response.data.report.components
                }, widgetIdCounter);

                if (widgets && widgets.length > 0) {
                    // Add the widgets to the canvas in reverse order (from back to front)
                    addAIWidgetsToCanvas(widgets.reverse());

                    // Show success message
                    await AlertService.prototype.success('Éxito', 'Imagen procesada correctamente');

                    return {
                        success: true,
                        message: 'Imagen procesada correctamente',
                        originalImage,
                        processedImage,
                        roboflowData,
                        showResultsPanel: true
                    };
                } else {
                    await AlertService.prototype.warning('Advertencia', 'No se pudieron detectar elementos en la imagen');
                    return {
                        success: false,
                        message: 'No se pudieron detectar elementos en la imagen',
                        originalImage,
                        processedImage,
                        roboflowData
                    };
                }
            } else if (response.data.components) {
                // This is the previous API response format
                const roboflowData = response.data;

                // Process the components from the API response
                const widgets = this.processImageScanResults(response.data, widgetIdCounter);

                if (widgets && widgets.length > 0) {
                    // Add the widgets to the canvas in reverse order (from back to front)
                    addAIWidgetsToCanvas(widgets.reverse());

                    // Show success message
                    await AlertService.prototype.success('Éxito', 'Imagen procesada correctamente');

                    return {
                        success: true,
                        message: 'Imagen procesada correctamente',
                        roboflowData,
                        showResultsPanel: true
                    };
                } else {
                    await AlertService.prototype.warning('Advertencia', 'No se pudieron detectar elementos en la imagen');
                    return {
                        success: false,
                        message: 'No se pudieron detectar elementos en la imagen',
                        roboflowData
                    };
                }
            } else if (response.data.success) {
                // Legacy response format
                // Store the original and processed images
                const originalImage = response.data.originalImage;
                const processedImage = response.data.processedImage;
                const roboflowData = response.data.rawData;

                // Add the generated widgets to the canvas
                if (response.data.widgets && response.data.widgets.length > 0) {
                    // Add the widgets to the canvas in reverse order (from back to front)
                    addAIWidgetsToCanvas([...response.data.widgets].reverse());

                    // Show success message
                    await AlertService.prototype.success('Éxito', 'Imagen procesada correctamente');

                    return {
                        success: true,
                        message: 'Imagen procesada correctamente',
                        originalImage,
                        processedImage,
                        roboflowData,
                        showResultsPanel: true
                    };
                } else {
                    await AlertService.prototype.warning('Advertencia', 'No se pudieron detectar elementos en la imagen');
                    return {
                        success: false,
                        message: 'No se pudieron detectar elementos en la imagen',
                        originalImage,
                        processedImage,
                        roboflowData
                    };
                }
            } else {
                await AlertService.prototype.error('Error', response.data.message || 'Error al procesar la imagen');
                return {
                    success: false,
                    message: response.data.message || 'Error al procesar la imagen'
                };
            }
        } catch (error: any) {
            console.error('Error processing image:', error);
            await AlertService.prototype.error('Error', error.response?.data?.message || 'Error al procesar la imagen');
            return {
                success: false,
                message: error.response?.data?.message || 'Error al procesar la imagen'
            };
        }
    }

    /**
     * Processes image scan results from the API
     * @param data The API response data
     * @param widgetIdCounter Counter for generating unique widget IDs
     * @returns Array of Flutter widgets
     */
    static processImageScanResults(data: any, widgetIdCounter: number): FlutterWidget[] | null {
        if (!data || !data.components || !Array.isArray(data.components)) {
            AlertService.prototype.warning('Advertencia', 'No se encontraron componentes en la respuesta de la API');
            return null;
        }

        // Map the components from the API response to the format expected by addAIWidgetsToCanvas
        const mappedWidgets = data.components.map((component: any) => {
            // Determine the widget type based on the component type
            const props: any = {};
            let type = 'Container'; // Default type

            // Extract common properties that might be used as labels
            const labelText = component.label || component.hintText || component.title || component.text || '';
            const hintText = component.hint || component.hintText || labelText;

            // Convert component type to appropriate widget type
            switch (component.type.toLowerCase()) {
                // Handle the new component types from the issue description
                case 'textl':
                    type = 'Text';
                    props.data = labelText || 'Text';
                    props.style = 'TextStyle(fontSize: 16.0)';
                    props.textAlign = 'TextAlign.left';
                    break;

                case 'texfield_hinttext':
                    type = 'TextFormField';
                    props.decoration = `InputDecoration(labelText: "${labelText}", hintText: "${hintText}")`;
                    props.label = labelText;
                    props.controller = 'TextEditingController()';
                    props.keyboardType = 'TextInputType.text';
                    props.obscureText = false;
                    props.enabled = true;
                    break;

                case 'button_text':
                    type = 'ElevatedButton';
                    const buttonText = labelText || 'Button';
                    props.child = `Text("${buttonText}")`;
                    props.label = buttonText;
                    props.onPressed = '() {}';
                    props.style = 'ButtonStyle(backgroundColor: MaterialStateProperty.all<Color>(Colors.blue))';
                    break;

                case 'appbar_title':
                    type = 'AppBar';
                    props.title = labelText || 'AppBar Title';
                    props.backgroundColor = '#2196F3';
                    props.textColor = '#FFFFFF';
                    props.elevation = 4;
                    props.centerTitle = false;
                    props.automaticallyImplyLeading = true;
                    break;

                case 'AppBar':
                    type = 'AppBar';
                    // Check for subcomponents with text for title
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        const titleComponent = component.subcomponents.find((sub: any) => sub.type === 'title' && sub.text);
                        if (titleComponent) {
                            props.title = titleComponent.text;
                        } else {
                            props.title = labelText || 'AppBar Title';
                        }
                    } else {
                        props.title = labelText || 'AppBar Title';
                    }
                    props.backgroundColor = '#2196F3';
                    props.textColor = '#FFFFFF';
                    props.elevation = 4;
                    props.centerTitle = false;
                    props.automaticallyImplyLeading = true;
                    break;

                case 'appbar_icon':
                    type = 'AppBarIcon';
                    props.icon = component.icon || 'Icons.menu';
                    props.onPressed = '() {}';
                    break;

                case 'checkbox_text':
                    type = 'Checkbox';
                    props.label = labelText || 'Checkbox';
                    props.value = false;
                    props.onChanged = '(value) {}';
                    break;

                case 'radio_text':
                    type = 'Radio';
                    props.groupValue = labelText || 'Options';
                    props.title = labelText || 'Options';
                    props.options = '[{"label": "Option 1", "value": "1"}, {"label": "Option 2", "value": "2"}]';
                    break;

                // Case for button components
                case 'button':
                    type = 'ElevatedButton';

                    // Special case for button with specific subcomponents structure from the issue
                    if (component.confidence && component.coordinates && component.subcomponents &&
                        component.subcomponents.length > 0 && component.subcomponents[0].type === 'text') {
                        // Extract text from the first subcomponent
                        const textComponent = component.subcomponents[0];
                        const buttonText = textComponent.text || 'Ingresar';
                        props.child = `Text("${buttonText}")`;
                        // Also set the label property for ElevatedButtonFlutter
                        props.label = buttonText;
                    } else {
                        // Regular button case
                        // Extract text from subcomponents if available
                        if (component.subcomponents && component.subcomponents.length > 0) {
                            const textComponent = component.subcomponents.find((sub: any) => sub.type === 'text');
                            if (textComponent) {
                                const buttonText = textComponent.text || labelText || 'Button';
                                props.child = `Text("${buttonText}")`;
                                props.label = buttonText;
                            } else {
                                const buttonText = labelText || 'Button';
                                props.child = `Text("${buttonText}")`;
                                props.label = buttonText;
                            }
                        } else {
                            const buttonText = labelText || 'Button';
                            props.child = `Text("${buttonText}")`;
                            props.label = buttonText;
                        }
                    }

                    props.onPressed = '() {}';
                    props.style = 'ButtonStyle(backgroundColor: MaterialStateProperty.all<Color>(Colors.blue))';
                    break;

                case 'text':
                case 'Text':
                    type = 'Text';
                    props.data = component.text || labelText || 'Text';
                    props.style = 'TextStyle(fontSize: 16.0)';
                    props.textAlign = 'TextAlign.left';
                    break;

                case 'textfield':
                    type = 'TextFormField';
                    // Extract hint from subcomponents if available
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        const hintComponent = component.subcomponents.find((sub: any) => sub.type === 'hint');
                        if (hintComponent) {
                            const subLabel = hintComponent.text || labelText || 'Label';
                            props.decoration = `InputDecoration(labelText: "${subLabel}", hintText: "${hintText}")`;
                            props.label = subLabel;
                        } else {
                            props.decoration = `InputDecoration(labelText: "${labelText || 'Label'}", hintText: "${hintText}")`;
                            props.label = labelText || 'Label';
                        }
                    } else {
                        props.decoration = `InputDecoration(labelText: "${labelText || 'Label'}", hintText: "${hintText}")`;
                        props.label = labelText || 'Label';
                    }
                    props.controller = 'TextEditingController()';
                    props.keyboardType = 'TextInputType.text';
                    props.obscureText = false;
                    props.enabled = true;
                    break;

                case 'TextField':
                    type = 'TextFormField';
                    // Extract label from subcomponents if available
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        const labelComponent = component.subcomponents.find((sub: any) => sub.type === 'label' && sub.text);
                        if (labelComponent) {
                            const subLabel = labelComponent.text;
                            props.decoration = `InputDecoration(labelText: "${subLabel}", hintText: "${subLabel}")`;
                            props.label = subLabel;
                        } else {
                            props.decoration = `InputDecoration(labelText: "${labelText || 'Label'}", hintText: "${hintText}")`;
                            props.label = labelText || 'Label';
                        }
                    } else {
                        props.decoration = `InputDecoration(labelText: "${labelText || 'Label'}", hintText: "${hintText}")`;
                        props.label = labelText || 'Label';
                    }
                    props.controller = 'TextEditingController()';
                    props.keyboardType = 'TextInputType.text';
                    props.obscureText = false;
                    props.enabled = true;
                    break;

                case 'dropdown':
                case 'select':
                    type = 'Select';
                    // Extract hint/label if available
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        const hintComponent = component.subcomponents.find((sub: any) => sub.type === 'hint');
                        if (hintComponent) {
                            const subLabel = hintComponent.text || labelText || 'Select an option';
                            props.label = subLabel;
                            props.hint = subLabel;
                        } else {
                            props.label = labelText || 'Select an option';
                            props.hint = hintText || 'Select an option';
                        }
                    } else {
                        props.label = labelText || 'Select an option';
                        props.hint = hintText || 'Select an option';
                    }
                    props.items = '["Option 1", "Option 2", "Option 3"]';
                    props.onChanged = '(value) {}';
                    break;

                case 'Dropdown_menu':
                    type = 'DropdownButton';
                    // Extract values from subcomponents
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        // Get the first value as the label/title
                        const value1Component = component.subcomponents.find((sub: any) => sub.type === 'value_1' && sub.text);
                        if (value1Component) {
                            props.label = value1Component.text;
                        } else {
                            props.label = labelText || 'Select an option';
                        }

                        // Collect all values to create items array
                        const valueComponents = component.subcomponents.filter((sub: any) =>
                            sub.type && sub.type.startsWith('value_') && sub.text);

                        if (valueComponents.length > 1) {
                            // Skip the first one (value_1) as it's the label, use the rest as options
                            const items = valueComponents.slice(1).map((sub: any) => sub.text);
                            props.items = JSON.stringify(items);
                            // Set the first item as the default value
                            props.value = items[0] || 'Option 1';
                        } else {
                            props.items = '["Option 1", "Option 2", "Option 3"]';
                            props.value = 'Option 1';
                        }
                    } else {
                        props.label = labelText || 'Select an option';
                        props.items = '["Option 1", "Option 2", "Option 3"]';
                        props.value = 'Option 1';
                    }
                    props.onChanged = '(value) {}';
                    break;

                case 'radio':
                    type = 'Radio';
                    // Extract label if available
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        const labelComponent = component.subcomponents.find((sub: any) => sub.type === 'text');
                        if (labelComponent) {
                            const subLabel = labelComponent.text || labelText || 'Options';
                            props.groupValue = subLabel;
                            props.title = subLabel;
                        } else {
                            props.groupValue = labelText || 'Options';
                            props.title = labelText || 'Options';
                        }
                    } else {
                        props.groupValue = labelText || 'Options';
                        props.title = labelText || 'Options';
                    }
                    props.options = '[{"label": "Option 1", "value": "1"}, {"label": "Option 2", "value": "2"}]';
                    break;

                case 'checkbox':
                    type = 'Checkbox';
                    // Extract label if available
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        const labelComponent = component.subcomponents.find((sub: any) => sub.type === 'text');
                        if (labelComponent) {
                            props.label = labelComponent.text || labelText || 'Checkbox';
                        } else {
                            props.label = labelText || 'Checkbox';
                        }
                    } else {
                        props.label = labelText || 'Checkbox';
                    }
                    props.value = false;
                    props.onChanged = '(value) {}';
                    break;

                case 'switch':
                    type = 'Switch';
                    // Extract label if available
                    if (component.subcomponents && component.subcomponents.length > 0) {
                        const labelComponent = component.subcomponents.find((sub: any) => sub.type === 'text');
                        if (labelComponent) {
                            props.label = labelComponent.text || labelText || 'Switch';
                        } else {
                            props.label = labelText || 'Switch';
                        }
                    } else {
                        props.label = labelText || 'Switch';
                    }
                    props.value = false;
                    props.onChanged = '(value) {}';
                    break;

                case 'table':
                case 'Table':
                    type = 'Table';
                    console.log('Processing Table component:', component);

                    // Process table structure if available
                    if (component.estructure && component.estructure.type === 'Table' && component.estructure.children) {
                        console.log('Found table structure in component.estructure');
                        // Extract columns from the first row
                        const columns: string[] = [];
                        const rows: any[] = [];

                        // Process each row in the table
                        component.estructure.children.forEach((row: any) => {
                            if (row.type === 'TableRow' && row.children && row.children.length > 0) {
                                const rowData: string[] = [];

                                // Process each cell in the row
                                row.children.forEach((cell: any) => {
                                    if (cell.type === 'TableCell' && cell.child) {
                                        // Extract text from the cell
                                        const cellText = cell.child.text || '';
                                        rowData.push(cellText);

                                        // If this is the first row, use it for column headers
                                        if (rows.length === 0) {
                                            columns.push(cellText);
                                        }
                                    }
                                });

                                // Add the row data if it's not empty
                                if (rowData.length > 0) {
                                    rows.push(rowData);
                                }
                            }
                        });

                        // Log the extracted table data for debugging
                        console.log('Extracted table columns:', columns);
                        console.log('Extracted table rows:', rows);

                        // Set the table properties
                        props.columns = columns.length > 0 ? columns : ['Column 1', 'Column 2', 'Column 3'];
                        props.rows = rows.length > 0 ? rows : [
                            ['Row 1, Col 1', 'Row 1, Col 2', 'Row 1, Col 3'],
                            ['Row 2, Col 1', 'Row 2, Col 2', 'Row 2, Col 3']
                        ];
                        props.border = true;
                        props.headerColor = '#E0E0E0';
                        props.cellPadding = 8;
                        props.borderColor = '#BDBDBD';
                        props.textAlign = 'center';
                    } else {
                        // Default table properties if structure is not available
                        props.columns = ['Column 1', 'Column 2', 'Column 3'];
                        props.rows = [
                            ['Row 1, Col 1', 'Row 1, Col 2', 'Row 1, Col 3'],
                            ['Row 2, Col 1', 'Row 2, Col 2', 'Row 2, Col 3'],
                            ['Row 3, Col 1', 'Row 3, Col 2', 'Row 3, Col 3']
                        ];
                        props.border = true;
                        props.headerColor = '#E0E0E0';
                        props.cellPadding = 8;
                        props.borderColor = '#BDBDBD';
                        props.textAlign = 'center';
                    }
                    break;

                default:
                    // If type is not recognized, try to map it to a supported widget type based on patterns
                    const lowerType = component.type.toLowerCase();

                    // Check for text field patterns
                    if (lowerType.includes('text') && lowerType.includes('field') || lowerType.includes('hinttext')) {
                        type = 'TextFormField';
                        props.decoration = `InputDecoration(labelText: "${labelText || 'Label'}", hintText: "${hintText || 'Enter text'}")`;
                        props.label = labelText || 'Label';
                        props.controller = 'TextEditingController()';
                        props.keyboardType = 'TextInputType.text';
                    }
                    // Check for text patterns
                    else if (lowerType.includes('text') || lowerType.includes('label')) {
                        type = 'Text';
                        props.data = component.text || labelText || 'Text';
                        props.style = 'TextStyle(fontSize: 16.0)';
                        props.textAlign = 'TextAlign.left';
                    }
                    // Check for button patterns
                    else if (lowerType.includes('button')) {
                        type = 'ElevatedButton';
                        const buttonText = labelText || 'Button';
                        props.child = `Text("${buttonText}")`;
                        props.label = buttonText;
                        props.onPressed = '() {}';
                    }
                    // Check for AppBar patterns
                    else if (lowerType.includes('appbar') || lowerType.includes('app_bar')) {
                        if (lowerType.includes('icon')) {
                            type = 'AppBarIcon';
                            props.icon = component.icon || 'Icons.menu';
                            props.onPressed = '() {}';
                        } else {
                            type = 'AppBar';
                            props.title = labelText || 'AppBar Title';
                            props.backgroundColor = '#2196F3';
                            props.textColor = '#FFFFFF';
                            props.elevation = 4;
                        }
                    }
                    // Check for checkbox patterns
                    else if (lowerType.includes('check') || lowerType.includes('checkbox')) {
                        type = 'Checkbox';
                        props.label = labelText || 'Checkbox';
                        props.value = false;
                        props.onChanged = '(value) {}';
                    }
                    // Check for radio patterns
                    else if (lowerType.includes('radio')) {
                        type = 'Radio';
                        props.groupValue = labelText || 'Options';
                        props.title = labelText || 'Options';
                        props.options = '[{"label": "Option 1", "value": "1"}, {"label": "Option 2", "value": "2"}]';
                    }
                    // Check for table patterns or if the component has a table structure
                    else if (lowerType.includes('table') || component.estructure?.type === 'Table') {
                        type = 'Table';
                        // Process table structure if available
                        if (component.estructure && component.estructure.type === 'Table' && component.estructure.children) {
                            // Extract columns from the first row
                            const columns: string[] = [];
                            const rows: any[] = [];

                            // Process each row in the table
                            component.estructure.children.forEach((row: any) => {
                                if (row.type === 'TableRow' && row.children && row.children.length > 0) {
                                    const rowData: string[] = [];

                                    // Process each cell in the row
                                    row.children.forEach((cell: any) => {
                                        if (cell.type === 'TableCell' && cell.child) {
                                            // Extract text from the cell
                                            const cellText = cell.child.text || '';
                                            rowData.push(cellText);

                                            // If this is the first row, use it for column headers
                                            if (rows.length === 0) {
                                                columns.push(cellText);
                                            }
                                        }
                                    });

                                    // Add the row data if it's not empty
                                    if (rowData.length > 0) {
                                        rows.push(rowData);
                                    }
                                }
                            });

                            // Set the table properties
                            props.columns = columns.length > 0 ? columns : ['Column 1', 'Column 2', 'Column 3'];
                            props.rows = rows.length > 0 ? rows : [
                                ['Row 1, Col 1', 'Row 1, Col 2', 'Row 1, Col 3'],
                                ['Row 2, Col 1', 'Row 2, Col 2', 'Row 2, Col 3']
                            ];
                        } else {
                            // Default table properties if structure is not available
                            props.columns = ['Column 1', 'Column 2', 'Column 3'];
                            props.rows = [
                                ['Row 1, Col 1', 'Row 1, Col 2', 'Row 1, Col 3'],
                                ['Row 2, Col 1', 'Row 2, Col 2', 'Row 2, Col 3'],
                                ['Row 3, Col 1', 'Row 3, Col 2', 'Row 3, Col 3']
                            ];
                        }
                        props.border = true;
                        props.headerColor = '#E0E0E0';
                        props.cellPadding = 8;
                        props.borderColor = '#BDBDBD';
                        props.textAlign = 'center';
                    }
                    // Default to Container if no pattern matches
                    else {
                        type = 'Container';
                        props.width = 200;
                        props.height = 200;
                        props.color = '#FFFFFF';
                        props.padding = 'EdgeInsets.all(16.0)';
                        props.margin = 'EdgeInsets.all(8.0)';
                        props.alignment = 'Alignment.center';
                    }
            }

            // Create the widget object
            return {
                id: `widget-${widgetIdCounter++}`,
                type: type,
                props: props,
                children: [],
                // Add coordinates for positioning
                coordinates: component.coordinates ? {
                    x: component.coordinates.x1,
                    y: component.coordinates.y1,
                    width: component.coordinates.x2 - component.coordinates.x1,
                    height: component.coordinates.y2 - component.coordinates.y1
                } : null,
                confidence: component.confidence || 1.0
            };
        });

        // Sort widgets to ensure Text widgets are at the end (they will be first after reverse)
        const sortedWidgets = [...mappedWidgets].sort((a, b) => {
            if (a.type === 'Text' && b.type !== 'Text') {
                return 1; // Text widgets go to the end
            } else if (a.type !== 'Text' && b.type === 'Text') {
                return -1; // Non-Text widgets go to the beginning
            }
            return 0; // Keep original order for widgets of the same type
        });

        return sortedWidgets;
    }
}
