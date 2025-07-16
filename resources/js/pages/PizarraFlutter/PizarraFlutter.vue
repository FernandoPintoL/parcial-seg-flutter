<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import './PizarraFlutter.css';
import { ref, onMounted, onUnmounted, computed, defineProps, PropType, watch } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AlertService } from '@/services/AlertService';
import { getSocketConfig, toggleSocketEnvironment } from '@/lib/socketConfig';
import type { BreadcrumbItem } from '@/types';
import type { Pizarra, PizarraCollaborators, FlutterWidget, CategoriaWidget } from '@/Data/Pizarra';
import { availableFlutterWidgets, categoriesWidget } from '@/Data/availableFlutterWidgets';
import { User } from '@/types/index';
import { SocketService } from '@/services/SocketService';
import { WidgetService } from '@/services/WidgetService';
import { ColorUtils } from '@/services/ColorUtils';
import { CodeGenerationService } from '@/services/CodeGenerationService';
import { AIService } from '@/services/AIService';
import { ImageProcessingService } from '@/services/ImageProcessingService';
import { ScreenManagementService } from '@/services/ScreenManagementService';
import { DragDropService } from '@/services/DragDropService';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import ChatAI from '@/pages/Chat/ChatAI.vue';
import WidgetPalette from '@/pages/PizarraFlutter/WidgetPalette.vue';
import PhoneStatusBar from '@/pages/PizarraFlutter/PhoneStatusBar.vue';
import Colaboradores from '@/pages/ColaboradoresFlutter/Colaboradores.vue';
import FlutterCodeViewer from '@/pages/PizarraFlutter/FlutterCodeViewer.vue';
import WidgetsPropertiesPanel from '@/pages/PizarraFlutter/WidgetsPropertiesPanel.vue';
import ReiniciarPantalla from '@/pages/PizarraFlutter/ReiniciarPantalla.vue';
import WidgetDraggable from '@/pages/PizarraFlutter/WidgetDraggable.vue';
import ScreenManager from '@/pages/PizarraFlutter/ScreenManager.vue';
import AppBarFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/AppBarFlutter.vue';

// Props
const props = defineProps({
    user: {
        type: Object as PropType<User>,
        required: true,
    },
    pizarra: {
        type: Object as PropType<Pizarra>,
        default: null,
    },
    creador: {
        type: Object as PropType<User>,
        default: null,
    },
    isCreador: {
        type: Boolean,
        default: false,
    },
    //definir como pizarra colaboradores
    colaboradores: {
        type: Array as PropType<PizarraCollaborators[]>,
        default: () => [],
    },
    screens: {
        type: Array as PropType<Pizarra[]>,
        default: () => [],
    },
    categoriasWidget: {
        type: Array as PropType<CategoriaWidget[]>,
        default: () => [],
    },
    widgets: {
        type: Array as PropType<FlutterWidget[]>,
        default: () => [],
    },
});
// Breadcrumbs for navigation
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pizarra Flutter',
        href: '/pizarra/' + props.pizarra?.id + '/edit',
    },
];
// Socket.io connection
const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
const socketConfig = ref(getSocketConfig(useLocalSocket.value));
const roomId = ref<string | null>(props.pizarra ? (props.pizarra.room_id ?? null) : null);
const currentUser = ref(props.user?.name || 'Usuario');
const socketConnected = ref<boolean>(false);
const socketError = ref<string>('');

// Initialize socketService
let socketService = new SocketService(socketConfig.value, roomId.value, currentUser.value);
// Get socket instance from socketService
const socket = socketService.socket;
// Función para alternar entre servidores de sockets locales y de producción
const toggleSocketServer = () => {
    // Disconnect current socket
    socketService.disconnect();

    // Toggle socket environment
    useLocalSocket.value = !useLocalSocket.value;
    socketConfig.value = toggleSocketEnvironment(useLocalSocket.value);

    // Reconnect with new configuration
    socketService = new SocketService(socketConfig.value, roomId.value, currentUser.value);
    socketService.connect();

    // Show notification
    AlertService.prototype.info(`Ahora usando servidor socket ${useLocalSocket.value ? 'local' : 'de producción'}: ${socketConfig.value.url}`);
};

// Collaborator management
const collaborators = ref<any>(props.colaboradores || []);
const onlineCollaborators = ref<any>([]);
const isCreator = ref<boolean>(props.isCreador);

// Track which user is currently editing which widget
const activeUserEditing = ref<{ userId: string, widgetType: string } | null>(null);
// Timer to auto-clear the active user editing status after a period of inactivity
const activeUserEditingTimer = ref<number | null>(null);

// Function to clear the active user editing status
const clearActiveUserEditing = () => {
    if (activeUserEditingTimer.value) {
        clearTimeout(activeUserEditingTimer.value);
        activeUserEditingTimer.value = null;
    }
    activeUserEditing.value = null;
};

// Métodos para manejar eventos del chat
const showFloatingChat = ref<boolean>(false);
const unreadMessages = ref<number>(0);
const autoOpenChat = ref<boolean>(true); // Set to true to automatically open chat on new messages

// Track if user has interacted with the page
const userHasInteracted = ref(false);

// Function to play notification sound
const playNotificationSound = () => {
    try {
        // Only play sound if user has interacted with the page
        if (!userHasInteracted.value) {
            console.log('Skipping notification sound - user has not interacted with the page yet');
            return;
        }

        // Generate a beep sound using the Web Audio API instead of loading an external file
        // This avoids the need for an external sound file
        const audioContext = new ((window.AudioContext || (window as any).webkitAudioContext))();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Configure the sound
        oscillator.type = 'sine'; // Sine wave - smooth sound
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Set volume

        // Connect the nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Play the sound
        oscillator.start();

        // Stop after a short duration
        setTimeout(() => {
            oscillator.stop();
            // Close the audio context to free up resources
            setTimeout(() => {
                audioContext.close();
            }, 100);
        }, 200); // 200ms duration

        console.log('Notification sound played successfully');
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};
const handleChatMessage = async (message: string) => {
    console.log('Enviando mensaje al chat:', message);
    try {
        const messageData = {
            roomId: roomId.value,
            pizarraId: props.pizarra?.id,
            userId: props.user?.id,
            text: message,
            user: currentUser.value,
            timestamp: new Date().toISOString(),
        };
        console.log('Mensaje a enviar:', messageData);

        // Emitir el mensaje al socket
        socket.emit('chatMessage', messageData);

        // También guardarlo en la base de datos
        // const baseUrl = socketConfig?.value?.url || 'http://localhost:4000';
        await axios.post(`/chat/message`, {
            pizarra_id: props.pizarra?.id,
            message: message,
            is_system_message: false,
            user_id: props.user?.id,
            user_name: currentUser.value,
            room_id: roomId.value
        });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        await AlertService.prototype.error('Error', 'No se pudo enviar el mensaje');
    }
};
const handleTyping = () => {
    socket.emit('escribiendo', {
        roomId: roomId.value,
        user: currentUser.value,
    });
};
const toggleFloatingChat = () => {
    showFloatingChat.value = !showFloatingChat.value;
    // Close AI chat if opening regular chat
    if (showFloatingChat.value) {
        showAIChat.value = false;
        // Reset unread messages count when opening chat
        unreadMessages.value = 0;
    }
};
// AI chat
const showAIChat = ref<boolean>(false);
const aiMessages = ref<any>([]);
const aiPrompt = ref<string>('');
const isProcessingAI = ref<boolean>(false);
// Toggle AI chat visibility
const toggleAIChat = () => {
    console.log('Toggling AI chat visibility desde Pizarra Flutter ');
    showAIChat.value = !showAIChat.value;

    // Close regular chat if opening AI chat
    if (showAIChat.value) {
        showFloatingChat.value = false;
    }
};
function parseFlutterWidgets(inputCode: string) {
    console.log('Parsing Flutter widgets from code...');
    // Define regex patterns for different widget structures
    const widgetRegex =
        /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableFlutter|CardText|Scaffold|AppBarFlutter|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|ElevatedButtonFlutter|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\b/g;
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
            widgetDefinition.properties.forEach((prop: { name: string; defaultValue: any }) => {
                props[prop.name] = prop.defaultValue;
            });

            // Try to extract actual values for common properties
            widgetDefinition.properties.forEach((prop: { name: string; type: string; defaultValue: any }) => {
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
                        valueExtractor = (match: RegExpExecArray) => (match[1].toLowerCase() === 'true' ? 'true' : 'false');
                        break;
                    case 'color':
                        // Try to match color values in various formats
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*(?:Colors\\.([a-zA-Z]+)|Color\\(0x([0-9A-Fa-f]+)\\)|'#([0-9A-Fa-f]+)')`, 'i');
                        valueExtractor = (match: RegExpExecArray) => {
                            if (match[1]) return `#${colorNameToHex(match[1])}`;
                            if (match[2]) return `#${match[2]}`;
                            if (match[3]) return `#${match[3]}`;
                            return prop.defaultValue;
                        };
                        break;
                    case 'select':
                        // Match enum values
                        /*const options = prop.options?.map((opt : string) => opt.replace(/\./g, '\\.'));
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*(${options.join('|')})`, 'i');
                        valueExtractor = (match: RegExpExecArray) => match[1];*/
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

        // Helper function to convert color name to hex
        const colorNameToHex = (colorName: string) => {
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
                lime: '00FF00',
            };

            return colorMap[colorName.toLowerCase()] || '000000';
        };

        // First pass: identify all widgets and their content
        const widgetDefinitions: FlutterWidget[] = [];
        let widgetMatch;

        while ((widgetMatch = widgetWithContentRegex.exec(inputCode)) !== null) {
            const widgetType = widgetMatch[1];
            const widgetContent = widgetMatch[2];

            // Check if this widget definition exists in availableWidgets
            const widgetDefinition = availableWidgets.value.find((w) => w.type === widgetType);
            if (widgetDefinition) {
                // Create a new widget object
                const newWidget: FlutterWidget = {
                    id: `widget-${widgetIdCounter++}`,
                    type: widgetDefinition.type,
                    props: extractProperties(widgetContent, widgetDefinition),
                    children: [],
                };

                // Extract child widget if present
                const childMatch = childRegex.exec(widgetContent);
                if (childMatch) {
                    // Mark this widget as having a child that needs to be resolved
                    newWidget.pendingChild = childMatch[1];
                }

                // Extract children array if present
                const childrenMatch = childrenRegex.exec(widgetContent);
                if (childrenMatch) {
                    // Mark this widget as having children that need to be resolved
                    newWidget.pendingChildren = childrenMatch[1]
                        .split(',')
                        .map((child) => child.trim())
                        .filter((child) => child.length > 0);
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
            if (widget.pendingChildren) {
                // Reiniciar el lastIndex del regex para asegurar que empezamos desde el principio
                childrenWidgetsRegex.lastIndex = 0;

                // El contenido de los hijos es un string[]
                const childrenContent = Array.isArray(widget.pendingChildren) ? widget.pendingChildren.join(',') : '';
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

                delete widget.pendingChildren;
            }
        });

        // Process widgets with a single child
        widgetDefinitions.forEach((widget: FlutterWidget) => {
            if (widget.pendingChild) {
                const childType = widget.pendingChild;
                console.log(`Processing widget ${widget.type} with child type: ${childType}`);

                // Find a widget of this type that hasn't been processed yet
                const childWidget = widgetDefinitions.find((w: FlutterWidget) => w.type === childType && !processedWidgets.has(w.id));

                if (childWidget) {
                    if (!widget.children) widget.children = [];
                    widget.children.push(childWidget);
                    processedWidgets.add(childWidget.id);
                }

                delete widget.pendingChild;
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
            if (currentScreen.value) {
                // Ensure the widget has a unique ID
                if (!widget.id) {
                    widget.id = `widget-${widgetIdCounter++}`;
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
                roomId: roomId.value,
                widget: widget,
                userId: currentUser.value,
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
                const widgetDefinition = availableWidgets.value.find((w) => w.type === widgetType);
                if (widgetDefinition) {
                    const newWidget: FlutterWidget = {
                        id: `widget-${widgetIdCounter++}`,
                        type: widgetDefinition.type,
                        props: {},
                        children: [],
                    };

                    // Initialize properties with default values
                    widgetDefinition.properties.forEach((prop) => {
                        newWidget.props[prop.name] = prop.defaultValue;
                    });

                    if (currentScreen.value && Array.isArray(currentScreen.value.elements)) {
                        currentScreen.value.elements.push(newWidget);
                    }

                    // Emit event to socket
                    socket.emit('flutter-widget-added', {
                        roomId: roomId.value,
                        widget: newWidget,
                        userId: currentUser.value,
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
            const widgetDefinition = availableWidgets.value.find((w) => w.type === widgetType);
            if (widgetDefinition) {
                const newWidget: FlutterWidget = {
                    id: `widget-${widgetIdCounter++}`,
                    type: widgetDefinition.type,
                    props: {},
                    children: [],
                };

                // Initialize properties with default values
                widgetDefinition.properties.forEach((prop) => {
                    newWidget.props[prop.name] = prop.defaultValue;
                });

                if (currentScreen.value && Array.isArray(currentScreen.value.elements)) {
                    currentScreen.value.elements.push(newWidget);
                }

                console.log(`Added fallback widget: ${widgetType}`);
            }
        });
    }
}

// Send a prompt to the AI
const sendAIPrompt = async () => {
    console.log('Sending AI prompt Pizarra Flutter:', aiPrompt.value);
    if (!aiPrompt.value.trim() || isProcessingAI.value) return;

    // Add user message to chat
    aiMessages.value.push({
        text: aiPrompt.value,
        isUser: true,
        timestamp: Date.now(),
    });
    console.log('AI messages after user input:', aiMessages.value);

    // Store the prompt
    const prompt = aiPrompt.value;

    // Clear input and set processing state
    aiPrompt.value = '';
    isProcessingAI.value = true;

    try {
        // Use AIService to send the prompt
        const parseFlutterWidgetsWrapper = (code: string) => {
            parseFlutterWidgets(code);
        };

        const result = await AIService.sendAIPrompt(
            prompt,
            aiMessages.value,
            isProcessingAI.value,
            parseFlutterWidgetsWrapper);
        console.log('AI service result:', result);

        // Update state with the result
        aiMessages.value = result.aiMessages;
        isProcessingAI.value = result.isProcessingAI;
    } catch (error: any) {
        console.error('Error al consultar AI service:', error);
        aiMessages.value.push({
            text: `Error: ${error.message || 'Error interno del servidor'}`,
            isUser: false,
            timestamp: Date.now(),
        });
        isProcessingAI.value = false;
    }
};

// Process an audio prompt
const sendAudioPrompt = async (audioBlob: Blob) => {
    console.log('Processing audio prompt...');
    if (isProcessingAI.value) return;

    // Set processing state
    isProcessingAI.value = true;

    try {
        // Use AIService to process the audio prompt
        const parseFlutterWidgetsWrapper = (code: string) => {
            parseFlutterWidgets(code);
        };

        const result = await AIService.processAudioPrompt(
            audioBlob,
            aiMessages.value,
            isProcessingAI.value,
            parseFlutterWidgetsWrapper);
        console.log('AI service result from audio prompt:', result);

        // Update state with the result
        aiMessages.value = result.aiMessages;
        isProcessingAI.value = result.isProcessingAI;
    } catch (error: any) {
        console.error('Error al procesar audio prompt:', error);
        aiMessages.value.push({
            text: `Error: ${error.message || 'Error al procesar el audio'}`,
            isUser: false,
            timestamp: Date.now(),
        });
        isProcessingAI.value = false;
    }
};
// Agregue widgets generados por IA al lienzo
const addAIWidgetsToCanvas = async (widgets: FlutterWidget[]) => {
    if (!widgets || !Array.isArray(widgets) || widgets.length === 0) {
        AlertService.prototype.error('Error', 'No se encontraron widgets generados por la IA');
        return;
    }

    try {
        // Only insert specific widget types without any comparison
        const allowedWidgetTypes = ['TextFormField', 'ElevatedButton', 'Select', 'DropdownButton', 'Radio', 'RadioListTile', 'Checkbox', 'Switch', 'Text', 'Table'];
        const inputWidgets = widgets.filter(widget => allowedWidgetTypes.includes(widget.type));

        if (inputWidgets.length === 0) {
            AlertService.prototype.error('Error', 'No se encontraron widgets de tipo input generados por la IA');
            return;
        }

        // Process each widget before adding to the canvas
        const processedWidgets = inputWidgets.map((widget) => {
            // Ensure the widget has a unique ID
            if (!widget.id) {
                widget.id = `widget-${widgetIdCounter++}`;
            }

            // Ensure the widget has a children property initialized as an array
            if (!widget.children || !Array.isArray(widget.children)) {
                widget.children = [];
            }

            // Use widget definitions from availableFlutterWidgets.ts
            const widgetDefinition = availableWidgets.value.find((w: any) => w.type === widget.type);
            if (widgetDefinition) {
                console.log('Found widget definition for AI-generated widget:', widgetDefinition.type);

                // Extract label information from widget properties based on widget type
                if (widget.type === 'TextFormField' && widget.props.decoration) {
                    // Extract label from decoration for TextFormField
                    const labelMatch = widget.props.decoration.match(/labelText:\s*"([^"]+)"/);
                    if (labelMatch && labelMatch[1]) {
                        widget.props.label = labelMatch[1];
                    }
                } else if (widget.type === 'Select' || widget.type === 'DropdownButton') {
                    // If it's a Select, convert it to DropdownButton type for Flutter 3.0.0 compatibility
                    if (widget.type === 'Select') {
                        widget.type = 'DropdownButton';
                    }

                    // Extract label from hint for Select
                    if (widget.props.hint) {
                        widget.props.label = widget.props.hint;
                    }
                } else if (widget.type === 'Radio') {
                    // Extract label from groupValue for Radio
                    if (widget.props.groupValue) {
                        widget.props.title = widget.props.groupValue;
                    }

                    // Check for options property (used for groupRadioButton)
                    if (widget.props.options && typeof widget.props.options === 'string') {
                        try {
                            const options = JSON.parse(widget.props.options);
                            if (Array.isArray(options) && options.length > 0 && options[0].label) {
                                // If options have label property, use the first one as title if not already set
                                if (!widget.props.title) {
                                    widget.props.title = options[0].label;
                                }

                                // Set the widget type to RadioListTile to use GroupRadioButtonFlutter component
                                widget.type = 'RadioListTile';

                                // Copy options to items property for compatibility
                                widget.props.items = widget.props.options;
                            }
                        } catch (e) {
                            console.error('Error parsing Radio options:', e);
                        }
                    }
                    // Extract items for Radio if available (fallback)
                    else if (widget.props.items && typeof widget.props.items === 'string') {
                        try {
                            const items = JSON.parse(widget.props.items);
                            if (Array.isArray(items) && items.length > 0 && items[0].label) {
                                // If items have label property, use the first one as title if not already set
                                if (!widget.props.title) {
                                    widget.props.title = items[0].label;
                                }

                                // Set the widget type to RadioListTile to use GroupRadioButtonFlutter component
                                widget.type = 'RadioListTile';
                            }
                        } catch (e) {
                            console.error('Error parsing Radio items:', e);
                        }
                    }
                } else if (widget.type === 'Checkbox') {
                    // Extract label from items for Checkbox if available
                    if (widget.props.items && typeof widget.props.items === 'string') {
                        try {
                            const items = JSON.parse(widget.props.items);
                            if (Array.isArray(items) && items.length > 0 && items[0].label) {
                                widget.props.label = items[0].label;
                            }
                        } catch (e) {
                            console.error('Error parsing Checkbox items:', e);
                        }
                    }
                } else if (widget.type === 'Text') {
                    // Ensure data property is set for Text widget
                    if (!widget.props.data && widget.props.text) {
                        widget.props.data = widget.props.text;
                    }
                }

                // Generate code_string based on widget type and properties
                widget.code_string = generateDefaultCodeString(widget);

                // Set default properties if they don't exist
                widgetDefinition.properties.forEach((prop: any) => {
                    if (!widget.props[prop.name]) {
                        widget.props[prop.name] = prop.defaultValue;
                    }
                });
            }

            return widget;
        });

        // Use current screen directly without asking
        console.log('Using current screen directly:', currentScreen.value.id);

        // Check if current screen is available
        if (!currentScreen.value) {
            AlertService.prototype.error('Error', 'No hay pantalla actual disponible para insertar widgets');
            return;
        }

        // Use the current screen
        const selectedScreen = currentScreen.value;

        // Make sure selectedScreen.elements exists and is an array
        if (!Array.isArray(selectedScreen.elements)) {
            selectedScreen.elements = [];
        }
        processedWidgets.forEach((widget) => {
            // Ensure elements is still defined and is an array before pushing
            if (!Array.isArray(selectedScreen.elements)) {
                selectedScreen.elements = [];
            }
            selectedScreen.elements.push(widget);
        });

        // Emit widget added event to socket for each widget
        processedWidgets.forEach((widget) => {
            socket.emit('flutter-widget-added', {
                roomId: roomId.value,
                widget: widget,
                userId: currentUser.value,
                screenId: selectedScreen.id,
            });
        });

        // We're always using the current screen, so no need to switch screens

        // Show success message
        AlertService.prototype.success('Éxito', `Widgets generados por la IA añadidos a la pantalla actual "${selectedScreen.name}"`);
    } catch (error) {
        console.error('Error adding widgets to canvas:', error);
        AlertService.prototype.error('Error', 'No se pudieron añadir los widgets generados por la IA');
    }
};
const onChatInputAI = () => {
    // Emit typing event for AI chat
    socket.emit('typingAI', {
        roomId: roomId.value,
        user: currentUser.value,
    });
};
// Image upload state
const showImageUpload = ref<boolean>(false);
const selectedImage = ref<File | null>(null);
const previewImage = ref<string | null>(null);
const isProcessingImage = ref<boolean>(false);
const originalImage = ref<string | null>(null);
const processedImage = ref<string | null>(null);
const roboflowData = ref<any>(null);
const showResultsPanel = ref<boolean>(false);

// Image upload functions
const closeImageUpload = () => {
    showImageUpload.value = false;
    showResultsPanel.value = false;
    originalImage.value = null;
    processedImage.value = null;
    roboflowData.value = null;
    clearSelectedImage();
};
const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        selectedImage.value = input.files[0];

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.value = e.target?.result as string;
        };
        reader.readAsDataURL(selectedImage.value);
    }
};
const clearSelectedImage = () => {
    selectedImage.value = null;
    previewImage.value = null;
};
const processImage = async () => {
    if (!selectedImage.value) {
        await AlertService.prototype.error('Error', 'No se ha seleccionado ninguna imagen');
        return;
    }

    try {
        isProcessingImage.value = true;

        const result = await ImageProcessingService.processImage(selectedImage.value, widgetIdCounter, addAIWidgetsToCanvas);

        if (result.success) {
            // Update state with the processing results
            if (result.originalImage) originalImage.value = result.originalImage;
            if (result.processedImage) processedImage.value = result.processedImage;
            if (result.roboflowData) roboflowData.value = result.roboflowData;
            if (result.showResultsPanel) showResultsPanel.value = true;
        }
    } catch (error: any) {
        console.error('Error processing image:', error);
        await AlertService.prototype.error('Error', error.message || 'Error al procesar la imagen');
    } finally {
        isProcessingImage.value = false;
    }
};
// Counter for generating unique widget IDs
let widgetIdCounter = 1;
// Project name ref
const projectName = ref<string>(props.pizarra?.name || 'Nueva Pizarra Flutter');
// Dark mode state
const isDarkMode = ref<boolean>(localStorage.getItem('darkMode') === 'true');
// Apply dark mode class to html element
const applyDarkMode = () => {
    if (isDarkMode.value) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};
// Toggle dark mode
const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value.toString());
    applyDarkMode();
};
// Screens management
// Initialize screens from props and ensure each screen has elements as an array
const screens = ref<Pizarra[]>((props.screens || []).map(screen => {
    // Ensure elements is always an array
    if (!screen.elements) {
        screen.elements = [];
    } else if (!Array.isArray(screen.elements)) {
        console.warn('Screen elements is not an array, initializing as empty array');
        screen.elements = [];
    }
    return screen;
}));
const currentScreenIndex = ref<number>(0);
const showScreenManager = ref<boolean>(false);
// Obtener pantalla actual
const currentScreen = computed(() => {
    // Manejar el caso cuando la matriz de pantallas está vacía
    if (screens.value.length === 0) {
        initializeScreens();
    }

    // Get the current screen
    const screen = screens.value[currentScreenIndex.value] || screens.value[0] || { elements: [] };

    // Ensure elements is always an array to avoid 422 error
    if (!screen.elements) {
        screen.elements = [];
    } else if (!Array.isArray(screen.elements)) {
        console.warn('Screen elements is not an array, initializing as empty array');
        screen.elements = [];
    }

    return screen;
});
const screenManagerScreens = computed(() =>
    screens.value.map(s => ({
        id: s.id,
        name: s.name,
        isHome: !!s.isHome,
        isDrawer: !!s.isDrawer
    }))
);
const toggleFlutterCode = () => {
    showFlutterCode.value = !showFlutterCode.value;
};
// Agregar una nueva pantalla
const addScreen = (screenName: string) => {
    console.log('Result of addScreen:', screenName);
    const result = ScreenManagementService.addScreen(screens.value, screenName, availableWidgets.value, widgetIdCounter, props.user.id);
    console.log('Result of addScreen:', result);
    if (result) {
        // Update screens and currentScreenIndex
        screens.value = result.screens;
        currentScreenIndex.value = result.currentScreenIndex;
        widgetIdCounter = result.widgetIdCounter;

        // Cerrar el administrador de pantalla
        showScreenManager.value = false;
    }

    // Save changes to the database
    savePizarraFlutter();
};
// Delete a screen
const deleteScreen = async (index: number) => {
    const result = await ScreenManagementService.deleteScreen(screens.value, index, currentScreenIndex.value);

    if (result) {
        // Update screens and currentScreenIndex
        screens.value = result.screens;
        currentScreenIndex.value = result.currentScreenIndex;

        // Save changes to the database
        savePizarraFlutter();
    }
};
// Used by external components or events, do not remove
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateScreenName = (data: { screenId: string, newName: string }) => {
    const screenIndex = screens.value.findIndex(screen => screen.id === data.screenId);
    if (screenIndex !== -1) {
        screens.value[screenIndex].name = data.newName;
        savePizarraFlutter();
    }
};
// Set a screen as home
const setHomeScreen = (index: number) => {
    screens.value = ScreenManagementService.setHomeScreen(screens.value, index);
    // Save changes to the database
    savePizarraFlutter();
};
// Select a screen
const selectScreen = (index: number) => {
    currentScreenIndex.value = index;
    // Clear any active widget editing status when switching screens
    clearActiveUserEditing();
    // Also clear selected widget
    selectedWidget.value = null;
};
// Toggle screen manager visibility
const toggleScreenManager = () => {
    showScreenManager.value = !showScreenManager.value;
};

// Set the initial screen index to the home screen index
const setInitialScreenIndex = () => {
    // Find the home screen if it exists
    const homeScreenIndex = screens.value.findIndex(screen => screen.isHome);
    if (homeScreenIndex !== -1) {
        // Set the current screen index to the home screen index
        currentScreenIndex.value = homeScreenIndex;
    }
};
// Initialize screens if empty
const initializeScreens = () => {
    // inicializar las pantallas desde la BD
    // adicionar Drawer y Scaffold por defecto
    widgetIdCounter = ScreenManagementService.initializeScreens(screens.value, props.pizarra, availableWidgets.value, widgetIdCounter);
};
// Selected widget for editing
const selectedWidget = ref<FlutterWidget | null>(null);
// Available Flutter widgets
const availableWidgets = ref([...availableFlutterWidgets]);

// AppBar widget for the UI
const appBarWidget = ref<FlutterWidget>({
    id: 'appbar-widget',
    type: 'AppBarFlutter',
    props: {
        title: 'App Bar',
        backgroundColor: '#2196F3',
        textColor: '#FFFFFF',
        elevation: 4,
        centerTitle: false,
        automaticallyImplyLeading: true
    },
    children: []
});

// Update AppBar title when current screen changes
watch(
    () => currentScreen.value?.name,
    (newName) => {
        if (newName) {
            appBarWidget.value.props.title = newName;
        }
    },
    { immediate: true }
);
// Suponiendo que availableWidgets es un ref con todos los widgets disponibles
const inputWidgets = computed(() => availableWidgets.value.filter((w) => w.category === 'input'));
const layoutWidgets = computed(() => availableWidgets.value.filter((w) => w.category === 'layout'));
const displayWidgets = computed(() => availableWidgets.value.filter((w) => w.category === 'containers'));
const handleDragEnter = (event: DragEvent) => {
    (event.currentTarget as HTMLElement).classList.add('dragover');
};
const handleDragLeave = (event: DragEvent) => {
    (event.currentTarget as HTMLElement).classList.remove('dragover');
};
const handleDrop = (event: DragEvent) => {
    (event.currentTarget as HTMLElement).classList.remove('dragover');
};
// Widgets de Flutter en el lienzo
// No longer using database widgets, so no need to add IDs
// Return empty array instead of using database widgets
const getInitialFlutterWidgets = (): FlutterWidget[] => {
    // Return empty array to ensure we're not using database widgets
    return [];
};
const flutterWidgets = computed(() => {
    // If we have screens, use the current screen's elements
    if (screens.value.length > 0 && currentScreen.value) {
        return currentScreen.value.elements;
    }
    // Otherwise, use the legacy elements array
    return getInitialFlutterWidgets();
});
// Helper function to create a new widget
const createWidget = (widgetType: string): FlutterWidget | null => {
    const newWidget = WidgetService.createWidget(widgetType, availableWidgets.value);

    if (newWidget) {
        // Update the widget ID counter
        const idMatch = String(newWidget.id).match(/widget-(\d+)/);
        if (idMatch && idMatch[1]) {
            const newId = parseInt(idMatch[1]);
            if (newId > widgetIdCounter) {
                widgetIdCounter = newId;
            }
        }
    }

    return newWidget;
};
// Helper function to generate default code string for a widget
const generateDefaultCodeString = (widget: FlutterWidget): string => {
    let code = `${widget.type}(\n`;

    // Add properties
    Object.entries(widget.props).forEach(([key, value]) => {
        // Skip label and validator properties for TextFormField
        if (widget.type === 'TextFormField' && (key === 'label' || key === 'validator')) {
            return;
        }

        // Check if this is a color property
        const isColorProperty =
            availableWidgets.value.find((w) => w.type === widget.type)?.properties.find((p: any) => p.name === key)?.type === 'color';

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
                // Convert RGB to HEX and then to Flutter Color
                const hexColor = getHexColor(value).substring(1).toUpperCase();
                code += `  ${key}: Color(0xFF${hexColor}),\n`;
            } else if (value.startsWith('hsl')) {
                // Convert HSL to HEX and then to Flutter Color
                const hexColor = getHexColor(value).substring(1).toUpperCase();
                code += `  ${key}: Color(0xFF${hexColor}),\n`;
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
        } else if (typeof value === 'string' && !value.includes('(')) {
            code += `  ${key}: "${value}",\n`;
        } else {
            code += `  ${key}: ${value},\n`;
        }
    });

    // Handle special cases for certain widget types
    switch (widget.type) {
        case 'Text':
            // For Text widgets, ensure the data property is included
            if (!widget.props.data) {
                code += `  data: 'Text',\n`;
            }
            break;
        case 'Card':
            // For Card widgets, ensure all required properties are included
            if (!widget.props.color) {
                code += `  color: Colors.white,\n`;
            }
            if (!widget.props.elevation) {
                code += `  elevation: 2,\n`;
            }
            if (!widget.props.margin) {
                code += `  margin: EdgeInsets.all(8.0),\n`;
            }
            if (!widget.props.borderRadius) {
                code += `  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),\n`;
            }
            if (!widget.props.child && !widget.children?.length) {
                // If no child or children are set, create a default card content
                code += `  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      ${widget.props.showImage ? `Image.network('${widget.props.imageUrl || 'https://via.placeholder.com/300x150'}', height: ${widget.props.imageHeight || 150}, width: double.infinity, fit: BoxFit.cover),` : ''}
      ${widget.props.showDivider ? 'Divider(),' : ''}
      Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${widget.props.title || 'Card Title'}', style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold)),
            ${widget.props.subtitle ? `SizedBox(height: 4.0),
            Text('${widget.props.subtitle}', style: TextStyle(fontSize: 14.0, color: Colors.grey)),` : ''}
            SizedBox(height: 8.0),
            Text('${widget.props.content || 'Card content goes here. You can display information in this area.'}'),
          ],
        ),
      ),
      ${widget.props.showActions ? `ButtonBar(
        alignment: MainAxisAlignment.start,
        children: [
          TextButton(onPressed: () {}, child: Text('ACTION 1')),
          TextButton(onPressed: () {}, child: Text('ACTION 2')),
        ],
      ),` : ''}
    ],
  ),\n`;
            }
            break;
        case 'CardText':
            // For CardText widgets, ensure all required properties are included
            if (!widget.props.color) {
                code += `  color: Colors.white,\n`;
            }
            if (!widget.props.elevation) {
                code += `  elevation: 2,\n`;
            }
            if (!widget.props.borderRadius) {
                code += `  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),\n`;
            }
            if (!widget.props.child && !widget.children?.length) {
                // If no child or children are set, create a default card content
                code += `  child: Padding(
    padding: EdgeInsets.all(16.0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('${widget.props.title || 'Card Title'}', style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold)),
        ${widget.props.subtitle ? `SizedBox(height: 4.0),
        Text('${widget.props.subtitle}', style: TextStyle(fontSize: 14.0, color: Colors.grey)),` : ''}
        SizedBox(height: 8.0),
        Text('${widget.props.content || 'Card content goes here with more details about the item.'}'),
      ],
    ),
  ),\n`;
            }
            break;
        case 'ListCard':
            // For ListCard widgets, ensure all required properties are included
            if (!widget.props.color) {
                code += `  color: Colors.white,\n`;
            }
            if (!widget.props.elevation) {
                code += `  elevation: 2,\n`;
            }
            if (!widget.props.borderRadius) {
                code += `  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),\n`;
            }
            if (!widget.props.child && !widget.children?.length) {
                // If no child or children are set, create a default list card content
                code += `  child: Column(
    children: [
      ${widget.props.showImage ? `Image.network('${widget.props.imageUrl || 'https://via.placeholder.com/300x150'}', height: ${widget.props.imageHeight || 150}, width: double.infinity, fit: BoxFit.cover),` : ''}
      ListTile(
        leading: ${widget.props.leading || 'Icon(Icons.star)'},
        title: Text('${widget.props.title || 'List Card Title'}'),
        subtitle: Text('${widget.props.subtitle || 'List Card Subtitle'}'),
        trailing: ${widget.props.trailing || 'Icon(Icons.arrow_forward)'},
      ),
    ],
  ),\n`;
            }
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
            const childCode = generateDefaultCodeString(child);
            // Indent the child code and add a comma at the end
            code +=
                childCode
                    .split('\n')
                    .map((line) => `    ${line}`)
                    .join('\n') + ',\n';
        });
        code += `  ],\n`;
    }

    code += `)`;
    return code;
};
// Helper function to emit widget added event
const emitWidgetAdded = (widget: FlutterWidget, screenId?: string) => {
    socket.emit('flutter-widget-added', {
        roomId: roomId.value,
        widget: widget,
        userId: currentUser.value,
        screenId: screenId,
    });
};
// Function to add a widget to the canvas
const addWidget = (widgetType: string) => {
    const newWidget = createWidget(widgetType);
    if (!newWidget) return;

    // Add widget to the current screen
    if (screens.value.length > 0 && currentScreen.value) {
        if (!currentScreen.value.elements) {
            currentScreen.value.elements = [];
        }
        currentScreen.value.elements.push(newWidget);
    } else {
        // Legacy support - create a default screen with the widgets
        initializeScreens();
        if (screens.value.length > 0 && screens.value[0].elements) {
            screens.value[0].elements.push(newWidget);
        }
    }

    // Emit widget added event to socket
    emitWidgetAdded(newWidget, currentScreen.value?.id);
};
// Función antirrebote para limitar la frecuencia con la que se puede llamar a una función
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            fn(...args);
            timeout = null;
        }, delay);
    };
};
// Function to select a widget for editing
const selectWidget = (widget: FlutterWidget) => {
    selectedWidget.value = widget;

    // Emit widget selected event to socket
    socket.emit('flutter-widget-selected', {
        roomId: roomId.value,
        widget: {
            id: widget.id,
            type: widget.type
        },
        userId: currentUser.value,
        screenId: currentScreen.value?.id,
    });
};
// Función para emitir el evento de actualización del widget al socket
const emitWidgetUpdated = () => {
    if (!selectedWidget.value) return;

    socket.emit('flutter-widget-updated', {
        roomId: roomId.value,
        widget: selectedWidget.value,
        userId: currentUser.value,
        screenId: currentScreen.value?.id,
    });
};
// Versión sin rebotes de emitWidgetUpdated para evitar eventos de socket excesivos
const debouncedEmitWidgetUpdated = debounce(emitWidgetUpdated, 300); //300ms debounce
// Function to update a widget property
const updateWidgetProperty = (propertyName: string, value: any) => {
    if (!selectedWidget.value) return;

    // Special handling for TableFlutter rows property to prevent column duplication
    if ((selectedWidget.value.type === 'DataTable' ||
        selectedWidget.value.type === 'TableFlutter' ||
        selectedWidget.value.type === 'TableList' ||
        selectedWidget.value.type === 'Table') &&
        propertyName === 'rows') {
        // Create a deep copy of the rows array to ensure we're not modifying the original reference
        selectedWidget.value.props[propertyName] = JSON.parse(JSON.stringify(value));
    } else {
        // For other properties, assign the value directly
        selectedWidget.value.props[propertyName] = value;
    }

    // If updating the label property for TextField or TextFormField, also update the decoration property
    if (propertyName === 'label' && (selectedWidget.value.type === 'TextField' || selectedWidget.value.type === 'TextFormField')) {
        // Get the current decoration value
        const decoration = selectedWidget.value.props.decoration || '';

        // Replace the labelText in the decoration with the new label value
        if (decoration.includes('labelText:')) {
            // Use regex to replace the labelText value
            const newDecoration = decoration.replace(/labelText:\s*["']([^"']*)["']/, `labelText: "${value}"`);
            selectedWidget.value.props.decoration = newDecoration;
        } else {
            // If decoration doesn't have labelText, add it
            selectedWidget.value.props.decoration = `InputDecoration(labelText: "${value}")`;
        }
    }

    // Update the code_string property
    if (selectedWidget.value) {
        selectedWidget.value.code_string = generateDefaultCodeString(selectedWidget.value);
    }

    // Use debounced emit for better performance
    debouncedEmitWidgetUpdated();
};
// Function to update a color property
const updateColorProperty = (propertyName: string, value: string) => {
    if (!selectedWidget.value) return;

    // Ensure the value is a valid hex color
    selectedWidget.value.props[propertyName] = getHexColor(value);

    // Update the code_string property
    if (selectedWidget.value) {
        selectedWidget.value.code_string = generateDefaultCodeString(selectedWidget.value);
    }

    // Use debounced emit for better performance
    debouncedEmitWidgetUpdated();
};
// Función para eliminar un widget del lienzo
const removeWidget = (widget: FlutterWidget) => {
    if (screens.value.length > 0 && currentScreen.value && currentScreen.value.elements) {
        const index = currentScreen.value.elements.indexOf(widget);
        if (index !== -1) {
            currentScreen.value.elements.splice(index, 1);

            // Emit widget removed event to socket
            socket.emit('flutter-widget-removed', {
                roomId: roomId.value,
                widgetIndex: index,
                userId: currentUser.value,
                screenId: currentScreen.value.id,
            });

            // Clear selection if the removed widget was selected
            if (selectedWidget.value === widget) {
                selectedWidget.value = null;
                // Clear active user editing status
                clearActiveUserEditing();
            }
        }
    }
};
const generateWidgetCode = (widget: FlutterWidget, indent: string = ''): string => {
    // If the widget has a code_string property, use it directly
    if (widget.code_string && widget.code_string.trim() !== '') {
        console.log('Using code_string for widget:', widget.type);

        // Check if the code_string already includes the widget type
        if (widget.code_string.trim().startsWith(widget.type)) {
            return `${indent}${widget.code_string}`;
        } else {
            // If not, wrap it with the widget type
            return `${indent}${widget.type}(\n${indent}  ${widget.code_string}\n${indent})`;
        }
    }

    // Otherwise, generate code based on widget properties
    let code = `${indent}${widget.type}(`;

    // Check if we need to add properties or children
    const hasProperties = Object.keys(widget.props).length > 0;
    const hasChildren = widget.children && Array.isArray(widget.children) && widget.children.length > 0;

    if (hasProperties || hasChildren) {
        code += '\n';

        // Add properties
        Object.entries(widget.props).forEach(([key, value]) => {
            // Check if this is a color property
            const isColorProperty =
                availableWidgets.value.find((w) => w.type === widget.type)?.properties.find((p: any) => p.name === key)?.type === 'color';

            if (isColorProperty && typeof value === 'string') {
                // Convert HEX color to Flutter Color
                if (value.startsWith('#')) {
                    // Remove # and convert to uppercase
                    const hexColor = value.substring(1).toUpperCase();
                    // If it's a 6-digit hex color
                    if (hexColor.length === 6) {
                        code += `${indent}  ${key}: Color(0xFF${hexColor}),\n`;
                    } else {
                        // Fallback for invalid hex colors
                        code += `${indent}  ${key}: Colors.black,\n`;
                    }
                } else if (value.startsWith('rgb')) {
                    // Convert RGB to HEX and then to Flutter Color
                    const hexColor = getHexColor(value).substring(1).toUpperCase();
                    code += `${indent}  ${key}: Color(0xFF${hexColor}),\n`;
                } else if (value.startsWith('hsl')) {
                    // Convert HSL to HEX and then to Flutter Color
                    const hexColor = getHexColor(value).substring(1).toUpperCase();
                    code += `${indent}  ${key}: Color(0xFF${hexColor}),\n`;
                } else {
                    // Try to use predefined Flutter colors
                    const lowerCaseValue = value.toLowerCase();
                    if (['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'grey', 'black', 'white'].includes(lowerCaseValue)) {
                        code += `${indent}  ${key}: Colors.${lowerCaseValue},\n`;
                    } else {
                        // Fallback to black
                        code += `${indent}  ${key}: Colors.black,\n`;
                    }
                }
            } else if (typeof value === 'string') {
                // Check if the value is a Flutter widget or expression
                if (value.includes('(') && !value.includes("'") && !value.includes('"')) {
                    code += `${indent}  ${key}: ${value},\n`;
                } else {
                    code += `${indent}  ${key}: '${value}',\n`;
                }
            } else {
                code += `${indent}  ${key}: ${value},\n`;
            }
        });

        // Add children if any
        if (hasChildren) {
            code += `${indent}  children: [\n`;
            (widget.children ?? []).forEach((child) => {
                code += generateWidgetCode(child, `${indent}    `) + ',\n';
            });
            code += `${indent}  ],\n`;
        }

        code += `${indent})`;
    } else {
        code += ')';
    }

    return code;
};
// Function to generate Flutter code
const generateFlutterCode = () => {
    return CodeGenerationService.generateFlutterCode(screens.value, projectName.value, availableWidgets.value);
};
// --- DRAG & DROP PARA AGREGAR WIDGETS DENTRO DE OTROS WIDGETS ---
// Widget que se está arrastrando desde la paleta
const draggingWidgetType = ref<string | null>(null);
// Variables para el menú de agregar widget hijo
const showAddChildMenu = ref<string | null>(null);
const activeAddChildCategory = ref<number>(0);
// Drag and drop utility functions
const dragUtils = DragDropService.createDragUtils(draggingWidgetType);
// Backward compatibility functions
const onPaletteDragStart = dragUtils.onDragStart;
const onPaletteDragEnd = dragUtils.onDragEnd;
// Función para agregar un widget hijo a un widget padre (por id)
const addChildWidget = (parentId: string, widgetType: string) => {
    const newWidget = createWidget(widgetType);
    if (!newWidget) return;

    // Buscar el widget padre recursivamente y agregar el hijo
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
    const parentWidget = addToParent(flutterWidgets.value ?? []);

    // Update the parent widget's code_string property
    if (parentWidget) {
        parentWidget.code_string = generateDefaultCodeString(parentWidget);
    }

    // Emit widget added event to socket
    emitWidgetAdded(newWidget, currentScreen.value?.id);
};
// Computed properties for filtering widgets by category
const widgetsByActiveCategory = computed(() => {
    const category = categoriesWidget[activeWidgetCategory.value]?.category;
    if (!category) return [];
    return availableWidgets.value.filter((widget) => widget.category === category);
});
// Flutter code display
const showFlutterCode = ref<boolean>(false);
const flutterCode = computed(() => generateFlutterCode());
const selectedCodeTab = ref<number>(0); // 0 = Full App, 1 = NavigationDrawer, 2+ = Individual Screens, -1 = Improved Code
const setSelectedCodeTab = (tab: number) => {
    selectedCodeTab.value = tab;
};

// Improved code for Flutter 3.0.0 and Dart 2.17.0
const improvedCode = ref<string>('');
const generateImprovedCode = async () => {
    // Reset the improved code
    improvedCode.value = '';

    // Get the code to improve based on the previously selected tab
    let codeToImprove = '';
    if (selectedCodeTab.value === -1) {
        // If we're already on the improved code tab, use the full app code
        codeToImprove = flutterCode.value;
    } else if (selectedCodeTab.value === 0) {
        codeToImprove = flutterCode.value;
    } else if (selectedCodeTab.value === 1) {
        codeToImprove = generateNavigationDrawerCode();
    } else {
        codeToImprove = generateScreenCode(selectedCodeTab.value - 2);
    }

    try {
        // Send the code to Azure for correction
        const corrected = await AIService.correctFlutterCode(codeToImprove);
        improvedCode.value = corrected;
    } catch (error) {
        console.error('Error generating improved code:', error);
        AlertService.prototype.error('Error', 'No se pudo generar el código mejorado');
        improvedCode.value = 'Error: No se pudo generar el código mejorado. Por favor, inténtalo de nuevo.';
    }
};

// State for the NavigationDrawer widget
const navigationDrawerWidget = ref<FlutterWidget | null>(null);
// Find or create the NavigationDrawer widget
const findOrCreateNavigationDrawer = () => {
    const result = ScreenManagementService.findOrCreateNavigationDrawer(screens.value, availableWidgets.value, widgetIdCounter);

    // Update widgetIdCounter if a new drawer was created
    if (result.drawerWidget && result.widgetIdCounter > widgetIdCounter) {
        widgetIdCounter = result.widgetIdCounter;
    }

    return result.drawerWidget;
};
// Initialize the NavigationDrawer widget
const initNavigationDrawer = () => {
    navigationDrawerWidget.value = findOrCreateNavigationDrawer();
};
// Generate code for the NavigationDrawer
const generateNavigationDrawerCode = () => {
    // Make sure we have a NavigationDrawer widget
    if (!navigationDrawerWidget.value) {
        initNavigationDrawer();
    }

    if (!navigationDrawerWidget.value) {
        return '// No NavigationDrawer widget found';
    }

    // Generate code for the NavigationDrawer
    return `
// @ts-ignore
import 'package:flutter/material.dart';

class NavigationDrawer extends StatelessWidget {
  const NavigationDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: ${navigationDrawerWidget.value.props.backgroundColor ? `Color(0xFF${navigationDrawerWidget.value.props.backgroundColor.substring(1).toUpperCase()})` : 'Colors.white'},
      width: ${navigationDrawerWidget.value.props.width || 300},
      elevation: ${navigationDrawerWidget.value.props.elevation || 16},
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            accountName: Text("${navigationDrawerWidget.value.props.userName || 'User Name'}"),
            accountEmail: Text("${navigationDrawerWidget.value.props.userEmail || 'user@example.com'}"),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                "${navigationDrawerWidget.value.props.avatarText || 'U'}",
                style: TextStyle(
                  fontSize: 40.0,
                  color: ${navigationDrawerWidget.value.props.avatarColor
            ? `Color(0xFF${navigationDrawerWidget.value.props.avatarColor.substring(1).toUpperCase()})`
            : 'Colors.blue'
        }
                ),
              ),
            ),
            decoration: BoxDecoration(
              color: ${navigationDrawerWidget.value.props.headerColor
            ? `Color(0xFF${navigationDrawerWidget.value.props.headerColor.substring(1).toUpperCase()})`
            : 'Colors.blue'
        },
            ),
          ),
          ${screens.value
            .filter((screen) => !screen.isDrawer)
            .map(
                (screen, index) => `
          ListTile(
            leading: Icon(${index === 0 ? 'Icons.home' : `Icons.screen_${index + 1}`}),
            title: Text("${screen.name}"),
            trailing: Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              Navigator.pushNamed(context, '/${screen.name.toLowerCase().replace(/\s+/g, '_')}');
            },
          ),`,
            )
            .join('\n')}
          Divider(),
          ListTile(
            leading: Icon(Icons.settings),
            title: Text("Settings"),
            onTap: () {
              // Navigate to settings
            },
          ),
          ListTile(
            leading: Icon(Icons.help),
            title: Text("Help & Feedback"),
            onTap: () {
              // Navigate to help
            },
          ),
        ],
      ),
    );
  }
}
`;
};
// Generate code for a specific screen
const generateScreenCode = (screenIndex: number) => {
    if (screenIndex < 0 || screenIndex >= screens.value.length) {
        return '';
    }

    const screen = screens.value[screenIndex];

    // Skip generating code for the drawer screen, as it's handled separately
    if (screen.isDrawer) {
        return generateNavigationDrawerCode();
    }

    // Format screen name for class name
    const screenClassName = screen.name
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .replace(/^./, (match: any) => match.toUpperCase()); // Capitalize first letter

    // Check if this is the Home screen
    const isHomeScreen = screen.isHome || screen.name === 'Home';

    // If this is the Home screen, use the specific structure required
    if (isHomeScreen) {
        // Generate code for each widget in this screen
        let screenWidgetsCode = '';
        if (screen.elements && Array.isArray(screen.elements)) {
            screen.elements.forEach((widget: FlutterWidget) => {
                screenWidgetsCode += generateWidgetCode(widget, '      ') + ',\n';
            });
        }

        return `
// @ts-ignore
import 'package:flutter/material.dart';
// @ts-ignore
import 'navigation_drawer.dart';

class Home extends StatelessWidget {
  const Home({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Home"),
        actions: [
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              // Show navigation drawer
              Scaffold.of(context).openDrawer();
            },
          ),
        ],
      ),
      drawer: NavigationDrawer(),
      body: Center(
        child: Form(
          key: GlobalKey<FormState>(),
          autovalidateMode: AutovalidateMode.disabled,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
${screenWidgetsCode}
            ],
          ),
        ),
      ),
    );
  }
}
`;
    } else if (screen.elements?.find(widget => widget.type === 'Scaffold')) {
        // If the screen already has a Scaffold widget, use it directly
        const scaffoldWidget = screen.elements.find(widget => widget.type === 'Scaffold');
        return `
// @ts-ignore
import 'package:flutter/material.dart';
// @ts-ignore
import 'navigation_drawer.dart';

class ${screenClassName} extends StatelessWidget {
  const ${screenClassName}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ${generateWidgetCode(scaffoldWidget!, '    ')};
  }
}
`;
    } else {
        // If the screen doesn't have a Scaffold widget, generate code for each widget
        let screenWidgetsCode = '';
        if (screen.elements && Array.isArray(screen.elements)) {
            screen.elements.forEach((widget: FlutterWidget) => {
                screenWidgetsCode += generateWidgetCode(widget, '      ') + ',\n';
            });
        }

        // Create a screen class with a new Scaffold
        return `
// @ts-ignore
import 'package:flutter/material.dart';
// @ts-ignore
import 'navigation_drawer.dart';

class ${screenClassName} extends StatelessWidget {
  const ${screenClassName}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("${screen.name}"),
        actions: [
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              // Show navigation drawer
              Scaffold.of(context).openDrawer();
            },
          ),
        ],
      ),
      drawer: const NavigationDrawer(),
      body: Center(
        child: Form(
          key: GlobalKey<FormState>(),
          autovalidateMode: AutovalidateMode.disabled,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
${screenWidgetsCode}
            ],
          ),
        ),
      ),
    );
  }
}
`;
    }
};
// Active widget category for mobile selector
const activeWidgetCategory = ref<number>(0);
// Toggle between widget palette and widget verification
const showWidgetVerification = ref<boolean>(false);
// Flutter widget rendering helper comment
// These functions were removed as they are no longer needed
// The widget rendering has been simplified to use static values
// Function to strip HTML tags from code
const stripHtmlTags = (html: string): string => {
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    // Set the HTML content
    tempDiv.innerHTML = html;
    // Get the text content (without HTML tags)
    return tempDiv.textContent || tempDiv.innerText || '';
};
// Copy Flutter code to clipboard
const copyFlutterCode = () => {
    // Copy either the full app code, NavigationDrawer code, improved code, or the selected screen's code
    let codeToCopy;
    if (selectedCodeTab.value === 0) {
        codeToCopy = flutterCode.value;
    } else if (selectedCodeTab.value === 1) {
        codeToCopy = generateNavigationDrawerCode();
    } else if (selectedCodeTab.value === -1) {
        codeToCopy = improvedCode.value;
    } else {
        codeToCopy = generateScreenCode(selectedCodeTab.value - 2);
    }

    // Strip any HTML tags that might be in the code
    const cleanCode = stripHtmlTags(codeToCopy);

    navigator.clipboard.writeText(cleanCode);
    AlertService.prototype.success('Código copiado al portapapeles');
};
// Function to download the Flutter project (complete or individual files)
const downloadFlutterProject = async (downloadType = 'complete') => {
    try {
        // Show loading message
        const message = downloadType === 'complete'
            ? 'Generando proyecto Flutter completo...'
            : 'Generando archivo individual...';
        await AlertService.prototype.info('Procesando', message);

        // Get the code to download based on selected tab
        let codeToDownload;
        if (selectedCodeTab.value === 0) {
            codeToDownload = flutterCode.value;
        } else if (selectedCodeTab.value === 1) {
            codeToDownload = generateNavigationDrawerCode();
        } else if (selectedCodeTab.value === -1) {
            codeToDownload = improvedCode.value;
        } else {
            codeToDownload = generateScreenCode(selectedCodeTab.value - 2);
        }

        // If downloading the complete project, send the code to Azure for correction
        if (downloadType === 'complete' && selectedCodeTab.value !== -1) {
            await AlertService.prototype.info('Procesando', 'Enviando código a Azure para corrección...');
            try {
                codeToDownload = await AIService.correctFlutterCode(codeToDownload);
            } catch (error) {
                console.error('Error correcting Flutter code:', error);
                await AlertService.prototype.warning('Advertencia', 'No se pudo corregir el código Flutter. Se descargará el código original.');
            }
        }

        // Strip any HTML tags that might be in the code
        codeToDownload = stripHtmlTags(codeToDownload);

        // Get project name based on selected tab
        let downloadProjectName;
        if (selectedCodeTab.value === 0) {
            downloadProjectName = projectName.value || 'FlutterProject';
        } else if (selectedCodeTab.value === 1) {
            downloadProjectName = 'NavigationDrawer';
        } else if (selectedCodeTab.value === -1) {
            downloadProjectName = 'ImprovedFlutterCode';
        } else {
            downloadProjectName = screens.value[selectedCodeTab.value - 2]?.name || 'ScreenProject';
        }

        // Get elements based on selected tab
        let elements;
        if (selectedCodeTab.value === 0) {
            elements = flutterWidgets.value;
        } else if (selectedCodeTab.value === 1) {
            elements = navigationDrawerWidget.value ? [navigationDrawerWidget.value] : [];
        } else if (selectedCodeTab.value === -1) {
            // For improved code, use the same elements as the previously selected tab
            // If we were already on the improved code tab, use the full app elements
            elements = flutterWidgets.value;
        } else {
            elements = screens.value[selectedCodeTab.value - 2]?.elements || [];
        }

        // Send request to backend to generate and download the project
        const response = await axios.post(
            '/pizarra/download-flutter-project',
            {
                name: downloadProjectName,
                elements: elements,
                code: codeToDownload,
                project_name: downloadProjectName,
                id: props.pizarra?.id || null,
                download_type: downloadType, // Add download type parameter
            },
            {
                responseType: 'blob', // Important to set response type for file download
            },
        );

        // Determine content type and file extension based on download type
        const contentType = downloadType === 'complete' ? 'application/zip' : 'text/plain';
        const fileExtension = downloadType === 'complete' ? '.zip' : '.dart';

        // Create a blob URL from the response
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link element to trigger the download
        const link = document.createElement('a');
        link.href = url;

        // Set appropriate filename based on download type
        if (downloadType === 'complete') {
            link.setAttribute('download', `${projectName.value || 'FlutterProject'}.zip`);
        } else {
            // For individual files, the backend will determine the appropriate filename
            // based on the class name, but we'll provide a fallback here
            link.setAttribute('download', `${downloadProjectName}${fileExtension}`);
        }

        document.body.appendChild(link);

        // Trigger the download
        link.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        // Show success message
        const successMessage = downloadType === 'complete'
            ? 'Proyecto Flutter descargado correctamente'
            : 'Archivo Flutter descargado correctamente';
        await AlertService.prototype.success('Éxito', successMessage);
    } catch (error) {
        console.error('Error downloading Flutter project:', error);
        await AlertService.prototype.error('Error', 'No se pudo descargar el proyecto Flutter');
    }
};

// Function to download individual Flutter file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const downloadIndividualFile = async () => {
    await downloadFlutterProject('individual');
};
// Save changes to the pizarraFlutter
const savePizarraFlutter = async () => {
    if (!props.pizarra || !props.pizarra.id) return;

    try {
        // Ensure ID is a valid number
        if (isNaN(props.pizarra.id)) {
            console.error('Invalid pizarra ID:', props.pizarra.id);
            await AlertService.prototype.error('Error', 'ID de pizarra inválido');
            return;
        }

        // Validate project name
        if (!projectName.value || projectName.value.trim() === '') {
            const { value: newName } = await Swal.fire({
                title: 'Nombre del Proyecto',
                input: 'text',
                inputLabel: 'Por favor ingrese un nombre para el proyecto',
                inputValue: projectName.value || '',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return 'El nombre del proyecto es requerido';
                    }
                },
            });

            if (!newName) return; // User cancelled
            projectName.value = newName;
        }

        // Ensure we have at least one screen
        if (screens.value.length === 0) {
            initializeScreens();
        }

        // Make sure at least one screen is marked as home
        if (!screens.value.some((screen) => screen.isHome)) {
            screens.value[0].isHome = true;
        }

        // Ensure all screens have valid elements arrays
        screens.value.forEach((screen) => {
            if (!Array.isArray(screen.elements)) {
                screen.elements = [];
            }
        });

        // Get the current screen's elements for backward compatibility
        const currentElements = Array.isArray(currentScreen.value?.elements) ? currentScreen.value.elements : [];

        console.log('Saving pizarra flutter with screens:', screens.value);
        console.log('Current screen elements:', currentElements);

        // Save both the legacy elements array (for backward compatibility)
        // and the new screens array
        const response = await axios.put(`/pizarra/${props.pizarra.id}`, {
            name: projectName.value,
            elements: currentElements,
            screens: screens.value,
        });

        console.log('Pizarra saved:', response.data);
        AlertService.prototype.success('Éxito', 'Cambios guardados correctamente');
    } catch (error) {
        console.error('Error saving pizarra flutter:', error);
        AlertService.prototype.error('Error', 'No se pudieron guardar los cambios');
    }
};
// Helper functions for backward compatibility
const getHexColor = (color: string): string => ColorUtils.toHex(color);
const getRgbColor = (color: string): string => ColorUtils.toRgb(color);
const getHslColor = (color: string): string => ColorUtils.toHsl(color);

// Socket event handlers
onMounted(() => {
    console.log('Mounted PizarraFlutter');
    console.log(props.pizarra);
    applyDarkMode();

    // Setup user interaction tracking for notification sounds
    const markUserInteraction = () => {
        userHasInteracted.value = true;
        // Remove event listeners once interaction is detected
        document.removeEventListener('click', markUserInteraction);
        document.removeEventListener('keydown', markUserInteraction);
        document.removeEventListener('touchstart', markUserInteraction);
        console.log('User interaction detected - notification sounds enabled');
    };

    // Add event listeners for common user interactions
    document.addEventListener('click', markUserInteraction);
    document.addEventListener('keydown', markUserInteraction);
    document.addEventListener('touchstart', markUserInteraction);

    // Set the initial screen index to the home screen index
    setInitialScreenIndex();

    // Connect to socket using the existing socketService instance
    socketService.connect();
    // Connect to socket
    socketService.on('connect', () => {
        socketConnected.value = true;
        console.log(`Desde el mounted Connected to socket server: ${socketConfig.value.url}`);
    });

    // Join room
    socketService.joinRoomData({
        pizarraId: props.pizarra?.id || null,
        roomId: roomId.value,
        userId: currentUser.value,
        userName: currentUser.value,
    });

    // Helper function to ensure widget has valid children array
    const ensureWidgetChildren = (widget: FlutterWidget): FlutterWidget => {
        if (!widget.children || !Array.isArray(widget.children)) {
            widget.children = [];
        }
        return widget;
    };

    socket.on('flutter-widget-added', (data) => {
        if (data.userId !== currentUser.value) {
            // Find the screen by ID
            const screenId = data.screenId;
            const screen = screens.value.find((s) => s.id === screenId);

            if (screen) {
                // Ensure screen.elements is an array
                if (!Array.isArray(screen.elements)) {
                    screen.elements = [];
                }

                // Add the widget to the screen
                screen.elements.push(ensureWidgetChildren(data.widget));

                // If this is the current screen, it will automatically update flutterWidgets
                // through the computed property
            } else if (flutterWidgets.value) {
                // Fallback to the old behavior if screen not found
                flutterWidgets.value.push(ensureWidgetChildren(data.widget));
            }
        }
    });

    socket.on('flutter-widget-updated', (data) => {
        if (data.userId !== currentUser.value) {
            const widget = ensureWidgetChildren(data.widget);

            // Find the screen by ID
            const screenId = data.screenId;
            const screen = screens.value.find((s) => s.id === screenId);

            if (screen && Array.isArray(screen.elements)) {
                // Update the widget in the screen
                const index = screen.elements.findIndex((w: any) => w.id === widget.id);
                if (index !== -1) {
                    screen.elements[index] = widget;
                }
            } else if (flutterWidgets.value && Array.isArray(flutterWidgets.value)) {
                // Fallback to the old behavior if screen not found
                const index = flutterWidgets.value.findIndex((w: any) => w.id === widget.id);
                if (index !== -1) {
                    flutterWidgets.value[index] = widget;
                }
            }

            // Update the active user editing status to show that this user is editing properties
            // Clear any existing timer
            if (activeUserEditingTimer.value) {
                clearTimeout(activeUserEditingTimer.value);
            }

            // Update the reactive variable with the user and widget information
            activeUserEditing.value = {
                userId: data.userId,
                widgetType: `propiedades de ${widget.type}`
            };

            // Set a timer to clear the status after 5 seconds of inactivity
            activeUserEditingTimer.value = window.setTimeout(() => {
                activeUserEditing.value = null;
            }, 5000);
        }
    });

    socket.on('flutter-widget-removed', (data) => {
        if (data.userId !== currentUser.value) {
            // Find the screen by ID
            const screenId = data.screenId;
            const screen = screens.value.find((s) => s.id === screenId);

            if (screen && Array.isArray(screen.elements)) {
                // Remove the widget from the screen
                screen.elements.splice(data.widgetIndex, 1);
            } else if (flutterWidgets.value) {
                // Fallback to the old behavior if screen not found
                flutterWidgets.value.splice(data.widgetIndex, 1);
            }
        }
    });

    // Handle widget selection by other users
    socket.on('flutter-widget-selected', (data) => {
        if (data.userId !== currentUser.value) {
            // Clear any existing timer
            if (activeUserEditingTimer.value) {
                clearTimeout(activeUserEditingTimer.value);
            }

            // Update the reactive variable with the user and widget information
            activeUserEditing.value = {
                userId: data.userId,
                widgetType: data.widget?.type || 'widget'
            };

            // Set a timer to clear the status after 5 seconds of inactivity
            activeUserEditingTimer.value = window.setTimeout(() => {
                activeUserEditing.value = null;
            }, 5000);
        }
    });

    // Chat message event
    socket.on('chatMessage', (data) => {
        if (data.user !== currentUser.value) {
            // Play notification sound for all incoming messages
            playNotificationSound();

            // If chat is not open
            if (!showFloatingChat.value) {
                // If auto-open is enabled, open the chat
                if (autoOpenChat.value) {
                    showFloatingChat.value = true;
                    // Show notification
                    // AlertService.prototype.info(`Nuevo mensaje de ${data.user}. Chat abierto automáticamente.`);
                } else {
                    // Otherwise just increment unread count
                    unreadMessages.value++;
                    // Show notification
                    AlertService.prototype.info(`Nuevo mensaje de ${data.user}`);
                }
            }
        }
    });

    // Collaborator events
    socket.on('userJoined', (data) => {
        if (data.user !== currentUser.value) {
            // Add user to collaborators if not already there
            if (!collaborators.value.some((c: any) => c.name === data.user || c.email === data.user)) {
                collaborators.value.push({ name: data.user, email: data.user });
            }
        }
    });

    socket.on('userLeft', (data) => {
        if (data.user !== currentUser.value) {
            // Remove user from collaborators
            const index = collaborators.value.findIndex((c: any) => c.name === data.user || c.email === data.user);
            if (index !== -1) {
                collaborators.value.splice(index, 1);
            }

            // If this user was editing a widget, clear the editing status
            if (activeUserEditing.value && activeUserEditing.value.userId === data.user) {
                clearActiveUserEditing();
            }
        }
    });

    socket.on('roomUsers', (data) => {
        console.log('Received room users:', data);
        // Update online collaborators list
        if (data && data.users && Array.isArray(data.users)) {
            // Extract user names or IDs from the users array
            onlineCollaborators.value = data.users
                .filter((user: any) => {
                    // Filter out the current user
                    const userName = typeof user === 'string' ? user : user.name || user.id;
                    return userName !== props.user?.name && userName !== props.user?.id;
                })
                .map((user: any) => {
                    // Extract the name or ID from each user
                    return typeof user === 'string' ? user : user.name || user.id;
                });
            console.log('Updated online collaborators:', onlineCollaborators.value);
        }
    });

    // Listen for collaborator acceptance events
    socket.on('collaboratorAccepted', (data) => {
        AlertService.prototype.success('Colaborador Aceptado', `El colaborador ${data.user} ha sido aceptado.`);

        // Reload the collaborators list to get the updated list
        // loadCollaborators();
    });

    // Listen for collaborator list event
    socket.on('collaboratorList', (data) => {
        console.log('Received collaborator list:', data);
        if (data && data.collaborators && Array.isArray(data.collaborators)) {
            // Update the collaborators list
            collaborators.value = data.users.map((user: any) => {
                console.log('Processing user:', user);
                return {
                    id: user.id,
                    name: user.name || `User ${user.id}`,
                    email: user.email || `user_${user.id}@example.com`,
                    status: user.status || 'unknown'
                };
            });
            console.log('Updated collaborators:', collaborators.value);
        }
    });

    // Debug logging for collaborators display
    console.log('Initial collaborators:', collaborators.value);
    console.log('Is creator?', isCreator.value);
    console.log('Is user the pizarra creator?', props.pizarra?.user_id === props.user?.id);

    // Load collaborators and chat messages if we have a form ID
    if (props.pizarra?.id) {
        // If we have a pizarra but no collaborators yet, initialize with the creator
        if (collaborators.value.length === 0 && props.pizarra.user_id) {
            // Add the creator as a collaborator
            // Check if users is an array before using find method
            const creatorUser = Array.isArray(props.pizarra.users)
                ? props.pizarra.users.find((u: any) => u.id === props.pizarra?.user_id)
                : null;
            if (creatorUser) {
                collaborators.value.push({
                    id: creatorUser.id,
                    name: creatorUser.name || `User ${creatorUser.id}`,
                    email: creatorUser.email || `user_${creatorUser.id}@example.com`,
                    status: 'active'
                });
                console.log('Added creator as collaborator:', collaborators.value);
            }
        }
    }
});

onUnmounted(() => {
    // Disconnect from socket
    socketService.disconnect();
});
</script>

<template>

    <Head title="Pizarra Flutter" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 transition-colors duration-200 dark:bg-gray-800">
            <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
                <input v-model="projectName" type="text" placeholder="Nombre del proyecto"
                    class="w-full rounded-md border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:w-1/2" />
                <div class="flex w-full flex-wrap justify-center gap-2 md:w-auto md:justify-end">
                    <button @click="showImageUpload = !showImageUpload"
                        class="rounded-md bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600">
                        Subir Imagen
                    </button>
                    <button @click="savePizarraFlutter"
                        class="rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
                        Guardar Cambios
                    </button>
                    <button @click="toggleScreenManager"
                        class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
                        {{ showScreenManager ? 'Cerrar Pantallas' : 'Gestionar Pantallas' }}
                    </button>
                </div>
            </div>
            <!-- Image Upload Modal -->
            <div v-if="showImageUpload"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div class="w-full max-w-4xl rounded-lg bg-white p-4 transition-colors dark:bg-gray-800 sm:p-6">
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="text-xl font-bold dark:text-white">Subir Imagen</h2>
                        <button @click="closeImageUpload"
                            class="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Results Panel (after processing) -->
                    <div v-if="showResultsPanel" class="mb-6">
                        <h3 class="mb-2 text-lg font-semibold dark:text-white">Resultados del Análisis de Imagen</h3>

                        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <!-- Original Image -->
                            <div class="rounded-lg border p-3 dark:border-gray-600">
                                <h4 class="mb-2 text-sm font-medium dark:text-white">Imagen Original</h4>
                                <img v-if="originalImage" :src="originalImage" alt="Original Image"
                                    class="mx-auto max-h-60 rounded border dark:border-gray-600" />
                            </div>

                            <!-- Processed Image -->
                            <div class="rounded-lg border p-3 dark:border-gray-600">
                                <h4 class="mb-2 text-sm font-medium dark:text-white">Imagen Procesada</h4>
                                <img v-if="processedImage" :src="processedImage" alt="Processed Image"
                                    class="mx-auto max-h-60 rounded border dark:border-gray-600" />
                            </div>
                        </div>

                        <!-- Detected Components -->
                        <div v-if="roboflowData && roboflowData.components"
                            class="mt-4 rounded-lg border p-3 dark:border-gray-600">
                            <h4 class="mb-2 text-sm font-medium dark:text-white">Componentes Detectados</h4>
                            <div class="max-h-40 overflow-y-auto">
                                <table class="w-full text-left text-sm">
                                    <thead>
                                        <tr class="border-b dark:border-gray-600">
                                            <th class="p-2">Tipo</th>
                                            <th class="p-2">Confianza</th>
                                            <th class="p-2">Texto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(component, index) in roboflowData.components" :key="index"
                                            class="border-b dark:border-gray-600">
                                            <td class="p-2">{{ component.type }}</td>
                                            <td class="p-2">{{ Math.round(component.confidence * 100) }}%</td>
                                            <td class="p-2">
                                                {{component.text || (component.subcomponents &&
                                                    component.subcomponents.length > 0 ?
                                                    component.subcomponents.find((sub: any) => sub.type === 'text' ||
                                                        sub.type === 'hint')?.text : '') || '-'}}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Legacy Format Support -->
                        <div v-else-if="roboflowData && roboflowData.predictions"
                            class="mt-4 rounded-lg border p-3 dark:border-gray-600">
                            <h4 class="mb-2 text-sm font-medium dark:text-white">Componentes Detectados</h4>
                            <div class="max-h-40 overflow-y-auto">
                                <table class="w-full text-left text-sm">
                                    <thead>
                                        <tr class="border-b dark:border-gray-600">
                                            <th class="p-2">Tipo</th>
                                            <th class="p-2">Confianza</th>
                                            <th class="p-2">Posición</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(prediction, index) in roboflowData.predictions" :key="index"
                                            class="border-b dark:border-gray-600">
                                            <td class="p-2">{{ prediction.class }}</td>
                                            <td class="p-2">{{ Math.round(prediction.confidence * 100) }}%</td>
                                            <td class="p-2">
                                                x: {{ Math.round(prediction.x) }}, y:
                                                {{ Math.round(prediction.y) }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Action buttons for results panel -->
                        <div class="mt-4 flex justify-end gap-2">
                            <button @click="
                                showResultsPanel = false;
                            showImageUpload = false;
                            " class="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600">
                                Cerrar y Continuar
                            </button>
                            <button @click="
                                showResultsPanel = false;
                            clearSelectedImage();
                            " class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                                Procesar Otra Imagen
                            </button>
                        </div>
                    </div>

                    <!-- Upload Panel (before processing) -->
                    <div v-if="!showResultsPanel">
                        <div class="mb-4">
                            <p class="mb-2 text-sm text-gray-600 dark:text-gray-300">
                                Sube una imagen de un boceto o diseño para que ROBOFLOW lo convierta en componentes
                                Flutter.
                            </p>

                            <!-- Image preview -->
                            <div v-if="previewImage" class="mb-4">
                                <img :src="previewImage" alt="Preview"
                                    class="mx-auto max-h-60 rounded border dark:border-gray-600" />
                                <div class="mt-2 flex justify-center">
                                    <button @click="clearSelectedImage"
                                        class="rounded bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600">
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            <!-- Upload options -->
                            <div v-if="!previewImage" class="flex flex-col gap-3">
                                <!-- Camera option -->
                                <label
                                    class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span class="dark:text-white">Tomar Foto</span>
                                    <input type="file" accept="image/*" capture="environment" class="hidden"
                                        @change="handleImageUpload" />
                                </label>

                                <!-- Gallery option -->
                                <label
                                    class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span class="dark:text-white">Seleccionar de Galería</span>
                                    <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
                                </label>
                            </div>
                        </div>

                        <!-- Action buttons -->
                        <div class="flex justify-end gap-2">
                            <button @click="closeImageUpload"
                                class="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">Cancelar</button>
                            <button @click="processImage"
                                class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                :disabled="!selectedImage || isProcessingImage"
                                :class="{ 'cursor-not-allowed opacity-50': !selectedImage || isProcessingImage }">
                                {{ isProcessingImage ? 'Procesando...' : 'Procesar Imagen' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Screen Manager -->
            <!-- Screen tabs -->
            <div class="screen-tabs mb-2 flex overflow-x-auto pb-2">
                <div class="mr-2 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Pantallas</h3>
                </div>
                <!-- Drawer tab -->
                <button v-if="screens.some(s => s.isDrawer)" @click="selectScreen(screens.findIndex(s => s.isDrawer))"
                    class="mr-1 flex items-center whitespace-nowrap rounded-t-lg border px-4 py-2 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    :class="currentScreenIndex === screens.findIndex(s => s.isDrawer)
                        ? 'border-b-0 border-purple-500 bg-purple-100 dark:border-purple-400 dark:bg-purple-900 dark:bg-opacity-30'
                        : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-800 dark:hover:bg-purple-700'
                        ">
                    <span>Drawer</span>
                    <span class="ml-1 rounded bg-purple-500 px-1 text-xs text-white">Navigation</span>
                </button>
                <!-- Regular screen tabs -->
                <button v-for="screen in screens.filter(s => !s.isDrawer)" :key="screen.id"
                    @click="selectScreen(screens.findIndex(s => s.id === screen.id))"
                    class="mr-1 flex items-center whitespace-nowrap rounded-t-lg border px-4 py-2 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    :class="currentScreenIndex === screens.findIndex(s => s.id === screen.id)
                        ? 'border-b-0 border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900 dark:bg-opacity-30'
                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                        ">
                    <span>{{ screen.name }}</span>
                    <span v-if="screen.isHome" class="ml-1 rounded bg-green-500 px-1 text-xs text-white">Home</span>
                </button>
                <button @click="showFlutterCode = !showFlutterCode"
                    class="rounded-t-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
                    {{ showFlutterCode ? 'Ocultar Código' : 'Mostrar Código' }}
                </button>
                <!-- User activity indicator -->
                <div v-if="activeUserEditing"
                    class="ml-2 flex items-center whitespace-nowrap rounded-t-lg border border-amber-500 bg-amber-100 px-4 py-2 text-amber-800 dark:border-amber-400 dark:bg-amber-900 dark:bg-opacity-30 dark:text-amber-200">
                    <span>{{ activeUserEditing.userId }}</span>
                    <span class="ml-1 rounded bg-amber-500 px-1 text-xs text-white">
                        editando {{ activeUserEditing.widgetType }}
                    </span>
                </div>
            </div>
            <ScreenManager v-if="showScreenManager" :screens="screenManagerScreens"
                :currentScreenIndex="currentScreenIndex" @select-screen="selectScreen" @add-screen="addScreen"
                @delete-screen="deleteScreen" @set-home-screen="setHomeScreen"
                @toggle-flutter-code="toggleFlutterCode" />
            <!-- Flutter code display -->
            <FlutterCodeViewer :show="showFlutterCode" :flutterCode="flutterCode" :selectedCodeTab="selectedCodeTab"
                :screens="screens" :generateNavigationDrawerCode="generateNavigationDrawerCode"
                :generateScreenCode="generateScreenCode" :downloadFlutterProject="downloadFlutterProject"
                :copyFlutterCode="copyFlutterCode" :setSelectedCodeTab="setSelectedCodeTab"
                :initNavigationDrawer="initNavigationDrawer" :improvedCode="improvedCode"
                :generateImprovedCode="generateImprovedCode" />

            <div v-if="!showFlutterCode" class="flex h-full flex-1 flex-col gap-4">
                <!-- Mobile widget selector (visible on small screens) -->
                <div class="mb-4 md:hidden">
                    <!-- Widget paleta for mobile -->
                    <WidgetPalette v-if="!showWidgetVerification" :categoriesWidget="categoriesWidget"
                        :activeWidgetCategory="activeWidgetCategory" :widgetsByActiveCategory="widgetsByActiveCategory"
                        @update:activeWidgetCategory="(val) => (activeWidgetCategory = val)" @addWidget="addWidget"
                        @onPaletteDragStart="onPaletteDragStart" @onPaletteDragEnd="onPaletteDragEnd" />
                </div>

                <div class="flex flex-col gap-4 md:flex-row">
                    <!-- Widget section with toggle button -->
                    <!-- Widget palette (desktop version with mobile-like style) -->
                    <WidgetPalette v-if="!showWidgetVerification" class="hidden md:block"
                        :categoriesWidget="categoriesWidget" :activeWidgetCategory="activeWidgetCategory"
                        :widgetsByActiveCategory="widgetsByActiveCategory"
                        @update:activeWidgetCategory="(val) => (activeWidgetCategory = val)" @addWidget="addWidget"
                        @onPaletteDragStart="onPaletteDragStart" @onPaletteDragEnd="onPaletteDragEnd" />

                    <!-- Canvas with Mobile Phone Frame -->
                    <div class="flex flex-1 flex-col gap-4">
                        <!-- Mobile phone frame container -->
                        <div class="flex items-start justify-center">
                            <div
                                class="mobile-phone-frame transition-colors dark:bg-gray-900 dark:shadow-[0_0_0_10px_#000,0_0_0_11px_#333,0_20px_30px_rgba(0,0,0,0.5)]">
                                <!-- Phone status bar -->
                                <PhoneStatusBar />
                                <!-- AppBar -->
                                <AppBarFlutter v-if="currentScreen && !currentScreen.isDrawer"
                                    :title="currentScreen.name || 'App Bar'"
                                    :backgroundColor="appBarWidget.props.backgroundColor"
                                    :textColor="appBarWidget.props.textColor" :elevation="appBarWidget.props.elevation"
                                    :centerTitle="appBarWidget.props.centerTitle"
                                    :automaticallyImplyLeading="appBarWidget.props.automaticallyImplyLeading"
                                    @click="selectWidget(appBarWidget)" />
                                <!-- Phone content area (draggable canvas) -->
                                <div class="phone-content-area bg-sky-50 transition-colors dark:bg-gray-800">
                                    <ReiniciarPantalla v-if="!currentScreen || !Array.isArray(currentScreen.elements)"
                                        :isLoading="true" @reiniciar="initializeScreens" />

                                    <!-- Draggable elements -->
                                    <WidgetDraggable v-model="currentScreen.elements"
                                        :selected-widget="selectedWidget || undefined"
                                        :show-add-child-menu="showAddChildMenu || undefined"
                                        :active-add-child-category="activeAddChildCategory"
                                        :input-widgets="inputWidgets" :layout-widgets="layoutWidgets"
                                        :display-widgets="displayWidgets" @select-widget="selectWidget"
                                        @remove-widget="removeWidget" @add-child-widget="addChildWidget"
                                        @update:showAddChildMenu="showAddChildMenu = $event"
                                        @update:activeAddChildCategory="activeAddChildCategory = $event"
                                        @drag-enter="handleDragEnter" @drag-leave="handleDragLeave"
                                        @drop="handleDrop" />
                                </div>

                                <!-- Phone home button/navigation bar -->
                                <div class="phone-nav-bar">
                                    <div class="home-indicator"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Properties panel -->
                    <WidgetsPropertiesPanel :selectedWidget="selectedWidget" :availableWidgets="availableWidgets"
                        :updateWidgetProperty="updateWidgetProperty" :updateColorProperty="updateColorProperty"
                        :getHexColor="getHexColor" :getRgbColor="getRgbColor" :getHslColor="getHslColor" />
                </div>
            </div>

            <!-- Socket connection status -->
            <div class="flex items-center gap-2 text-sm">
                <div class="h-3 w-3 rounded-full" :class="socketConnected ? 'bg-green-500' : 'bg-red-500'"></div>
                <span>{{ socketConnected ? 'Conectado' : 'Desconectado' }}</span>
                <span v-if="socketError" class="text-red-500">Error: {{ socketError }}</span>
            </div>

            <!-- Collaborator Management Section -->
            <Colaboradores v-if="isCreator || (props.pizarra && props.user && props.pizarra.user_id === props.user.id)"
                :collaborators="collaborators" :online-collaborators="onlineCollaborators" :pizarra="props.pizarra" />

            <!-- Chat Buttons -->
            <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <!-- THEMES -->
                <button @click="toggleDarkMode"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
                    aria-label="Toggle Socket Server">
                    <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                        fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            clip-rule="evenodd" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                        fill="currentColor">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                </button>
                <!-- CHANGE SOCKETS -->
                <button @click="toggleSocketServer"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
                    aria-label="Toggle Socket Server">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                        <path fill="#ffffff"
                            d="M54.2 202.9C123.2 136.7 216.8 96 320 96s196.8 40.7 265.8 106.9c12.8 12.2 33 11.8 45.2-.9s11.8-33-.9-45.2C549.7 79.5 440.4 32 320 32S90.3 79.5 9.8 156.7C-2.9 169-3.3 189.2 8.9 202s32.5 13.2 45.2 .9zM320 256c56.8 0 108.6 21.1 148.2 56c13.3 11.7 33.5 10.4 45.2-2.8s10.4-33.5-2.8-45.2C459.8 219.2 393 192 320 192s-139.8 27.2-190.5 72c-13.3 11.7-14.5 31.9-2.8 45.2s31.9 14.5 45.2 2.8c39.5-34.9 91.3-56 148.2-56zm64 160a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z" />
                    </svg>
                </button>
                <!-- AI Chat Button -->
                <button @click="toggleAIChat"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-colors hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                    :class="{ 'bg-purple-700 dark:bg-purple-800': showAIChat }" aria-label="Toggle AI Chat">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.051l.311.093c1.135.34 2.345.34 3.48 0l.312-.093a2.25 2.25 0 001.357-2.051V3.104M18 14.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-1.5a2.25 2.25 0 012.25-2.25h7.5z" />
                    </svg>
                </button>

                <!-- Chat Auto-Open Toggle Button -->
                <button @click="autoOpenChat = !autoOpenChat"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg transition-colors hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700"
                    :class="{ 'bg-teal-700 dark:bg-teal-800': autoOpenChat }" aria-label="Toggle Chat Auto-Open"
                    title="Toggle chat auto-open on new messages">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span
                        class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold"
                        :class="autoOpenChat ? 'text-teal-500' : 'text-gray-400'">
                        {{ autoOpenChat ? 'ON' : 'OFF' }}
                    </span>
                </button>

                <!-- Regular Chat Button -->
                <button @click="toggleFloatingChat"
                    class="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    :class="{ 'animate-pulse': !showFloatingChat && unreadMessages > 0, 'bg-blue-600 dark:bg-blue-700': showFloatingChat }"
                    aria-label="Toggle Chat">
                    <!-- Notification Badge -->
                    <span v-if="unreadMessages > 0 && !showFloatingChat"
                        class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {{ unreadMessages > 9 ? '9+' : unreadMessages }}
                    </span>

                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            </div>

            <!-- Floating Chat Window -->
            <ChatColaborativo v-if="showFloatingChat" :socket="socket" :currentUser="currentUser" :roomId="roomId"
                :showChat="showFloatingChat" :socketUrl="socketConfig.url || 'http://localhost:4000'"
                @close="showFloatingChat = false" @send-message="handleChatMessage" @typing="handleTyping" />
            <!-- AI Chat Window -->
            <ChatAI :showAIChat="showAIChat" :aiMessages="aiMessages" :aiPrompt="aiPrompt"
                :isProcessingAI="isProcessingAI" @toggleAIChat="toggleAIChat" @sendAIPrompt="sendAIPrompt"
                @sendAudioPrompt="sendAudioPrompt" @onAIPromptInput="onChatInputAI"
                @addAIWidgetsToCanvas="addAIWidgetsToCanvas" @update:aiPrompt="(value) => (aiPrompt = value)"
                @update:isProcessingAI="(value) => (isProcessingAI = value)" />
        </div>
    </AppLayout>
</template>
