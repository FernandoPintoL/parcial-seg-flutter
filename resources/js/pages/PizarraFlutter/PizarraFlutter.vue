<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import './PizarraFlutter.css';
import { ref, onMounted, onUnmounted, computed, watch, defineProps, defineEmits } from 'vue';
import draggable from 'vuedraggable';
import { io } from 'socket.io-client';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AlertService } from '@/services/AlertService';
import { getSocketConfig, toggleSocketEnvironment } from '@/lib/socketConfig';
import type { BreadcrumbItem } from '@/types';
import type { Pizarra, PizarraCollaborators, FlutterWidget, PizarraScreen } from '@/types/Pizarra';
import { availableFlutterWidgets, categoriesWidget } from '@/types/availableFlutterWidgets';
import type { User } from '@/types/User';
import { SocketService } from '@/services/SocketService';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';
import ChatAI from '@/pages/Chat/ChatAI.vue';
import WidgetPalette from '@/pages/PizarraFlutter/WidgetPalette.vue';
import PhoneStatusBar from '@/pages/PizarraFlutter/PhoneStatusBar.vue';
import Colaboradores from '@/pages/ColaboradoresFlutter/Colaboradores.vue';
import FlutterCodeViewer from '@/pages/PizarraFlutter/FlutterCodeViewer.vue';
import WidgetVerification from '@/pages/PizarraFlutter/WidgetVerification.vue';
import ColorPicker from '@/components/ColorPicker.vue';

/**
 * PizarraFlutter Component
 *
 * This component has been optimized for better performance and maintainability:
 *
 * 1. Event Handling Optimizations:
 *    - Extracted common code for emitting socket events
 *    - Implemented debouncing for property updates to reduce network traffic
 *    - Consolidated drag and drop event handlers
 *
 * 2. Color Handling Improvements:
 *    - Refactored color utility functions into a more organized structure
 *    - Added proper type safety and error handling
 *
 * 3. Widget Management Enhancements:
 *    - Created helper functions for widget creation and manipulation
 *    - Improved socket event handlers with better error checking
 *    - Consolidated duplicate code between addWidget and addChildWidget
 *
 * These optimizations improve performance, reduce code duplication,
 * and make the codebase more maintainable.
 */

// Props
const props = defineProps({
    user: {
        type: Object as () => User,
        required: true
    },
    pizarra: {
        type: Object as () => Pizarra,
        default: null
    },
    creador: {
        type: Object as () => User,
        default: null
    },
    isCreador: {
        type: Boolean,
        default: false
    },
    //definir como pizarra colaboradores
    colaboradores: {
        type: Array as () => PizarraCollaborators[],
        default: () => []
    }
});
// Breadcrumbs for navigation
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pizarra Flutter',
        href: '/pizarra/' + props.pizarra?.id + '/edit'
    }
];
// Socket.io connection
let socketService: SocketService;
const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
const socketConfig = ref(getSocketConfig(useLocalSocket.value));
const roomId = ref<string>(props.pizarra ? props.pizarra.room_id : '');
const currentUser = ref(props.user?.name || 'Usuario');
const socket = io(socketConfig.value.url, socketConfig.value.options);
const socketConnected = ref<boolean>(false);
const socketError = ref<string>('');

// Collaborator management
const collaborators = ref<any>(props.colaboradores || []);
const onlineCollaborators = ref<any>([]);
const isCreator = ref<boolean>(props.isCreador);

// Métodos para manejar eventos del chat
const showFloatingChat = ref<boolean>(false);
const handleChatMessage = async (message: string) => {
    try {
        const messageData = {
            roomId: roomId.value,
            message: message,
            user_name: currentUser.value,
            created_at: new Date().toISOString()
        };

        // Emitir el mensaje al socket
        socketService.emit('chatMessage', messageData);

        // También guardarlo en la base de datos
        await axios.post('/chat/messages', messageData);
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        AlertService.prototype.error('Error', 'No se pudo enviar el mensaje');
    }
};
const handleTyping = () => {
    socketService.emit('typing', {
        roomId: roomId.value,
        user: currentUser.value
    });
};
const toggleFloatingChat = () => {
    showFloatingChat.value = !showFloatingChat.value;
    // Close AI chat if opening regular chat
    if (showFloatingChat.value) {
        showAIChat.value = false;
    }
};
// AI chat
const showAIChat = ref<boolean>(false);
const aiMessages = ref<any>([]);
const aiPrompt = ref<string>('');
const isProcessingAI = ref<boolean>(false);

// Image upload state
const showImageUpload = ref<boolean>(false);
const selectedImage = ref<File | null>(null);
const previewImage = ref<string | null>(null);
const isProcessingImage = ref<boolean>(false);
const originalImage = ref<string | null>(null);
const processedImage = ref<string | null>(null);
const roboflowData = ref<any>(null);
const showResultsPanel = ref<boolean>(false);

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
const screens = ref<PizarraScreen[]>(props.pizarra?.screens || []);
const currentScreenIndex = ref<number>(0);
const showScreenManager = ref<boolean>(false);
const newScreenName = ref<string>('');

// Initialize screens if empty
const initializeScreens = () => {
    if (screens.value.length === 0) {
        // Create a default home screen
        const elements = Array.isArray(props.pizarra?.elements) && props.pizarra.elements.length > 0
            ? props.pizarra.elements
            : addDefaultWidgets([]);

        // Create a default drawer screen
        const drawerElements = [];
        const drawerDef = availableWidgets.value.find(w => w.type === 'Drawer');
        console.log('drawerDef', drawerDef);
        if (drawerDef) {
            console.log('Creating default Drawer widget: ', drawerDef.type);
            const drawerWidget = {
                id: `widget-${drawerDef.id || Date.now()}`,
                type: 'Drawer',
                props: {},
                children: []
            };
            // Initialize properties with default values
            drawerDef.properties.forEach((prop) => {
                drawerWidget.props[prop.name] = prop.defaultValue;
            });
            drawerElements.push(drawerWidget);
        }

        // Add drawer screen first
        screens.value.push({
            id: `screen-drawer-${Date.now()}`,
            name: 'Drawer',
            elements: drawerElements,
            isHome: false,
            isDrawer: true
        });

        // Add home screen
        screens.value.push({
            id: `screen-${Date.now()}`,
            name: 'Home',
            elements: elements,
            isHome: true
        });
    } else {
        // Asegúrese de que todas las pantallas tengan identificaciones únicas
        screens.value.forEach((screen, index) => {
            if (!screen.id) {
                screen.id = `screen-${Date.now()}-${index}`;
            }
        });

        // Check if drawer screen exists, if not create it
        if (!screens.value.some(screen => screen.isDrawer)) {
            const drawerElements = [];
            const drawerDef = availableWidgets.value.find(w => w.type === 'Drawer');
            if (drawerDef) {
                const drawerWidget = {
                    id: `widget-${widgetIdCounter++}`,
                    type: 'Drawer',
                    props: {},
                    children: []
                };

                // Initialize properties with default values
                drawerDef.properties.forEach((prop) => {
                    drawerWidget.props[prop.name] = prop.defaultValue;
                });

                drawerElements.push(drawerWidget);
            }

            // Add drawer screen
            screens.value.unshift({
                id: `screen-drawer-${Date.now()}`,
                name: 'Drawer',
                elements: drawerElements,
                isHome: false,
                isDrawer: true
            });
        }
    }
}

// Add default widgets (Scaffold and Drawer) to a screen
const addDefaultWidgets = (existingElements = []) => {
    if (existingElements.length > 0) {
        return existingElements;
    }

    // Find widget definitions
    const scaffoldDef = availableWidgets.value.find(w => w.type === 'Scaffold');
    const drawerDef = availableWidgets.value.find(w => w.type === 'Drawer');

    // Create default widgets
    const defaultWidgets = [];

    if (scaffoldDef) {
        const scaffoldWidget = {
            id: `widget-${widgetIdCounter++}`,
            type: 'Scaffold',
            props: {},
            children: []
        };

        // Initialize properties with default values
        scaffoldDef.properties.forEach((prop) => {
            scaffoldWidget.props[prop.name] = prop.defaultValue;
        });

        defaultWidgets.push(scaffoldWidget);
    }

    if (drawerDef) {
        const drawerWidget = {
            id: `widget-${widgetIdCounter++}`,
            type: 'Drawer',
            props: {},
            children: []
        };

        // Initialize properties with default values
        drawerDef.properties.forEach((prop : any) => {
            drawerWidget.props[prop.name] = prop.defaultValue;
        });

        defaultWidgets.push(drawerWidget);
    }

    return defaultWidgets;
};

// Get current screen
const currentScreen = computed(() => {
    // Handle case when screens array is empty
    if (screens.value.length === 0) {
        initializeScreens();
    }
    return screens.value[currentScreenIndex.value] || screens.value[0] || { elements: [] };
});

// Add a new screen
const addScreen = () => {
    if (!newScreenName.value.trim()) {
        AlertService.prototype.error('Error', 'El nombre de la pantalla no puede estar vacío');
        return;
    }

    screens.value.push({
        id: `screen-${Date.now()}`,
        name: newScreenName.value,
        elements: addDefaultWidgets([]),
        isHome: screens.value.length === 0
    });

    // Select the new screen
    currentScreenIndex.value = screens.value.length - 1;

    // Clear the input
    newScreenName.value = '';

    // Close the screen manager
    showScreenManager.value = false;

    // Save changes
    debouncedSave();
};

// Delete a screen
const deleteScreen = (index: number) => {
    if (screens.value.length <= 1) {
        AlertService.prototype.error('Error', 'No puedes eliminar la única pantalla');
        return;
    }

    // Confirm deletion
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Remove the screen
            screens.value.splice(index, 1);

            // Adjust current screen index if needed
            if (currentScreenIndex.value >= screens.value.length) {
                currentScreenIndex.value = screens.value.length - 1;
            }

            // Save changes
            debouncedSave();
        }
    });
};

// Set a screen as home
const setHomeScreen = (index: number) => {
    screens.value.forEach((screen, i) => {
        screen.isHome = i === index;
    });

    // Save changes
    debouncedSave();
};

// Select a screen
const selectScreen = (index: number) => {
    currentScreenIndex.value = index;
};

// Selected widget for editing
const selectedWidget = ref<FlutterWidget | null>(null);

// Available Flutter widgets
const availableWidgets = ref(availableFlutterWidgets);
const dbWidgets = ref<FlutterWidget[]>([]);

// Fetch widgets from the database
const fetchWidgetsFromDB = async () => {
    try {
        const response = await axios.post('/widget/query');
        dbWidgets.value = response.data;
        console.log('Widgets fetched from DB:', dbWidgets.value);
    } catch (error) {
        console.error('Error fetching widgets from DB:', error);
    }
};

// Flutter widgets on the canvas
// Initialize with a properly computed value
// Ensure all widgets have unique IDs
const addIdsToWidgets = (widgetList: any) => {
    return widgetList.map((widget: any) => {
        // Add ID if not present
        if (!widget.id) {
            widget.id = `widget-${widgetIdCounter++}`;
        }

        // Process children recursively if they exist
        if (widget.children && Array.isArray(widget.children)) {
            widget.children = addIdsToWidgets(widget.children);
        } else {
            // Initialize children as an empty array if it doesn't exist or isn't an array
            widget.children = [];
        }

        return widget;
    });
};
const getInitialFlutterWidgets = (): FlutterWidget[] => {
    let widgets = [];

    if (!props.pizarra?.elements) {
        return [];
    }

    if (Array.isArray(props.pizarra.elements)) {
        widgets = props.pizarra.elements;
    } else {
        try {
            widgets = JSON.parse(props.pizarra.elements || '[]');
        } catch (error) {
            console.error('Error parsing pizarra elements:', error);
            return [];
        }
    }
    return addIdsToWidgets(widgets);
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
    // First, check if the widget exists in the database
    const dbWidget = dbWidgets.value.find((w) => w.type === widgetType);

    if (dbWidget) {
        console.log('Using widget from database:', dbWidget);

        // Create a new widget based on the database widget
        const newWidget: FlutterWidget = {
            id: `widget-${widgetIdCounter++}`,
            type: dbWidget.type,
            props: {},
            children: [], // Always initialize as an array to avoid "elements must be an array" error
            code_string: dbWidget.code_string || ''
        };

        // If the widget has properties in the database, use them
        if (dbWidget.propiedades && Array.isArray(dbWidget.propiedades)) {
            dbWidget.propiedades.forEach((prop) => {
                newWidget.props[prop.name] = prop.value || prop.defaultValue;
            });
        }

        return newWidget;
    }

    // Fallback to the hardcoded widget definition
    const widgetDefinition = availableWidgets.value.find((w) => w.type === widgetType);
    if (!widgetDefinition) return null;

    const newWidget: FlutterWidget = {
        id: `widget-${widgetIdCounter++}`,
        type: widgetDefinition.type,
        props: {},
        children: [] // Always initialize as an array to avoid "elements must be an array" error
    };

    // Initialize properties with default values
    widgetDefinition.properties.forEach((prop) => {
        newWidget.props[prop.name] = prop.defaultValue;
    });

    return newWidget;
};

// Helper function to emit widget added event
const emitWidgetAdded = (widget: FlutterWidget, screenId?: string) => {
    socket.emit('flutter-widget-added', {
        roomId: roomId.value,
        widget: widget,
        userId: currentUser.value,
        screenId: screenId
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

// Debounce function to limit how often a function can be called
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
    let timeout: number | null = null;
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
};

// Function to emit widget updated event to socket
const emitWidgetUpdated = () => {
    if (!selectedWidget.value) return;

    socket.emit('flutter-widget-updated', {
        roomId: roomId.value,
        widget: selectedWidget.value,
        userId: currentUser.value,
        screenId: currentScreen.value?.id
    });
};

// Versión sin rebotes de emitWidgetUpdated para evitar eventos de socket excesivos
const debouncedEmitWidgetUpdated = debounce(emitWidgetUpdated, 300); // 300ms debounce

// Function to update a widget property
const updateWidgetProperty = (propertyName: string, value: any) => {
    if (!selectedWidget.value) return;

    selectedWidget.value.props[propertyName] = value;

    // Use debounced emit for better performance
    debouncedEmitWidgetUpdated();
};

// Function to update a color property
const updateColorProperty = (propertyName: string, value: string) => {
    if (!selectedWidget.value) return;

    // Ensure the value is a valid hex color
    const hexColor = getHexColor(value);
    selectedWidget.value.props[propertyName] = hexColor;

    // Use debounced emit for better performance
    debouncedEmitWidgetUpdated();
};

// Color utility functions
const colorUtils = {
    // Convert any color format to HEX
    toHex: (color: string): string => {
        // If already a valid hex color, return it
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
            return color.toUpperCase();
        }

        // Try to parse as RGB
        const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        }

        // Try to parse as HSL
        const hslMatch = color.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
        if (hslMatch) {
            const h = parseInt(hslMatch[1]) / 360;
            const s = parseInt(hslMatch[2]) / 100;
            const l = parseInt(hslMatch[3]) / 100;

            // Convert HSL to RGB
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p: number, q: number, t: number) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };

                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }

            // Convert RGB to HEX
            const toHex = (x: number) => {
                const hex = Math.round(x * 255).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };

            return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
        }

        // Default to black if invalid color
        return '#000000';
    },

    // Convert HEX to RGB
    toRgb: (color: string): string => {
        // Ensure we have a valid hex color
        const hex = colorUtils.toHex(color);

        // Parse the hex color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return `rgb(${r}, ${g}, ${b})`;
    },

    // Convert HEX to HSL
    toHsl: (color: string): string => {
        // Ensure we have a valid hex color
        const hex = colorUtils.toHex(color);

        // Parse the hex color
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        // Convert to degrees, percentage, percentage
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return `hsl(${h}, ${s}%, ${l}%)`;
    }
};

// Helper functions for backward compatibility
const getHexColor = (color: string): string => colorUtils.toHex(color);
const getRgbColor = (color: string): string => colorUtils.toRgb(color);
const getHslColor = (color: string): string => colorUtils.toHsl(color);

// Function to remove a widget from the canvas
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
                screenId: currentScreen.value.id
            });

            // Clear selection if the removed widget was selected
            if (selectedWidget.value === widget) {
                selectedWidget.value = null;
            }
        }
    }
};

// Function to generate Flutter code
const generateFlutterCode = () => {
    let flutterCode = '';

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
        let code = `${indent}${widget.type}(\n`;

        // Add properties
        Object.entries(widget.props).forEach(([key, value]) => {
            // Check if this is a color property
            const isColorProperty = availableWidgets.value
                .find((w) => w.type === widget.type)?.properties
                .find((p: any) => p.name === key)?.type === 'color';

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
            } else if (typeof value === 'string' && !value.includes('(')) {
                code += `${indent}  ${key}: '${value}',\n`;
            } else {
                code += `${indent}  ${key}: ${value},\n`;
            }
        });

        // Add children if any
        if (widget.children && Array.isArray(widget.children) && widget.children.length > 0) {
            code += `${indent}  children: [\n`;
            widget.children.forEach((child) => {
                code += generateWidgetCode(child, `${indent}    `) + ',\n';
            });
            code += `${indent}  ],\n`;
        }

        code += `${indent})`;
        return code;
    };

    // Generate screen classes
    let screenClasses = '';
    let routeDefinitions = '';
    let homeScreenName = '';

    screens.value.forEach((screen) => {
        // Skip drawer screen as it's handled separately
        if (screen.isDrawer) {
            return;
        }

        // Format screen name for class name (remove spaces, special chars, capitalize)
        const screenClassName = screen.name
            .replace(/[^\w\s]/g, '')  // Remove special characters
            .replace(/\s+/g, '')      // Remove spaces
            .replace(/^./, match => match.toUpperCase()); // Capitalize first letter

        // Find the home screen
        if (screen.isHome) {
            homeScreenName = screenClassName;
        }

        // Generate code for each widget in this screen
        let screenWidgetsCode = '';
        if (screen.elements && Array.isArray(screen.elements)) {
            screen.elements.forEach((widget) => {
                screenWidgetsCode += generateWidgetCode(widget, '      ') + ',\n';
            });
        }

        // Create a screen class
        screenClasses += `
            class ${screenClassName} extends StatelessWidget {
              const ${screenClassName}({Key? key}) : super(key: key);

              @override
              Widget build(BuildContext context) {
                return Scaffold(
                  appBar: AppBar(
                    title: const Text('${screen.name}'),
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
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ${screenWidgetsCode}
                      ],
                    ),
                  ),
                );
              }
            }
            `;

        // Add route definition (skip drawer screen)
        if (!screen.isDrawer) {
            routeDefinitions += `    '/${screen.name.toLowerCase().replace(/\s+/g, '_')}': (context) => const ${screenClassName}(),\n`;
        }
    });

    // Si no se define ninguna pantalla de inicio, utilice la primera pantalla
    if (!homeScreenName && screens.value.length > 0) {
        homeScreenName = 'Screen0';
    }

    // Create navigation drawer
    const navigationDrawer = `
        class NavigationDrawer extends StatelessWidget {
          @override
          Widget build(BuildContext context) {
            return Drawer(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  const DrawerHeader(
                    decoration: BoxDecoration(
                      color: Colors.blue,
                    ),
                    child: Text(
                      '${projectName.value}',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                      ),
                    ),
                  ),
                  ${screens.value
                .map(
                    (screen) => `
                  ListTile(
                    title: Text('${screen.name}'),
                    onTap: () {
                      Navigator.pushNamed(context, '/${screen.name.toLowerCase().replace(/\s+/g, '_')}');
                    },
                  ),`
                )
                .join('\n')}
                ],
              ),
            );
          }
        }
        `;

    // Wrap everything in a Flutter app with navigation
    flutterCode = `
        // @ts-ignore
        import 'package:flutter/material.dart';

        void main() {
          runApp(const MyFlutterApp());
        }

        class MyFlutterApp extends StatelessWidget {
          const MyFlutterApp({Key? key}) : super(key: key);

          @override
          Widget build(BuildContext context) {
            return MaterialApp(
              title: '${projectName.value}',
              theme: ThemeData(
                primarySwatch: Colors.blue,
              ),
              initialRoute: '/${
                screens.value
                    .find((s) => s.isHome)
                    ?.name.toLowerCase()
                    .replace(/\s+/g, '_') || 'home'
            }',
              routes: {
        ${routeDefinitions}
              },
            );
          }
        }

        ${navigationDrawer}

        ${screenClasses}
        `;

    return flutterCode;
};

// --- DRAG & DROP PARA AGREGAR WIDGETS DENTRO DE OTROS WIDGETS ---
// Widget que se está arrastrando desde la paleta
const draggingWidgetType = ref<string | null>(null);

// Variables para el menú de agregar widget hijo
const showAddChildMenu = ref<string | null>(null);
const activeAddChildCategory = ref<number>(0);

// Drag and drop utility functions
const dragUtils = {
    // Handle drag start from palette
    onDragStart: (widgetType: string) => {
        draggingWidgetType.value = widgetType;
    },

    // Handle drag end
    onDragEnd: () => {
        draggingWidgetType.value = null;
    },

    // Handle drag enter/over
    onDragOver: (event: DragEvent) => {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) target.classList.add('dragover');
    },

    // Handle drag leave
    onDragLeave: (event: DragEvent) => {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) target.classList.remove('dragover');
    },

    // Handle drop
    onDrop: (event: DragEvent) => {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        if (target) target.classList.remove('dragover');
    }
};

// Backward compatibility functions
const onPaletteDragStart = dragUtils.onDragStart;
const onPaletteDragEnd = dragUtils.onDragEnd;

// Función para agregar un widget hijo a un widget padre (por id)
const addChildWidget = (parentId: string, widgetType: string) => {
    const newWidget = createWidget(widgetType);
    if (!newWidget) return;

    // Buscar el widget padre recursivamente y agregar el hijo
    const addToParent = (widgets: FlutterWidget[]): boolean => {
        for (const widget of widgets) {
            if (widget.id === parentId) {
                if (!widget.children) widget.children = [];
                widget.children.push(newWidget);
                return true;
            }
            if (widget.children && widget.children.length > 0) {
                if (addToParent(widget.children)) return true;
            }
        }
        return false;
    };

    // Add the child widget to the parent
    addToParent(flutterWidgets.value);

    // Emit widget added event to socket
    emitWidgetAdded(newWidget, currentScreen.value?.id);
};

// Function to toggle between local and production socket servers
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

// Computed properties for filtering widgets by category
const widgetsByActiveCategory = computed(() => {
    const category = categoriesWidget[activeWidgetCategory.value]?.category;
    if (!category) return [];
    return availableWidgets.value.filter((widget) => widget.category === category);
});

// Flutter code display
const showFlutterCode = ref<boolean>(false);
const flutterCode = computed(() => generateFlutterCode());
const selectedCodeTab = ref<number>(0); // 0 = Full App, 1 = NavigationDrawer, 2+ = Individual Screens
const setSelectedCodeTab = (tab: number) => { selectedCodeTab.value = tab; };

// State for the NavigationDrawer widget
const navigationDrawerWidget = ref<FlutterWidget | null>(null);

// Find or create the NavigationDrawer widget
const findOrCreateNavigationDrawer = () => {
    // First, try to find the drawer screen
    const drawerScreen = screens.value.find(screen => screen.isDrawer);

    if (drawerScreen && drawerScreen.elements) {
        // Look for a Drawer widget in the drawer screen
        const existingDrawer = drawerScreen.elements.find(widget => widget.type === 'Drawer');
        if (existingDrawer) {
            return existingDrawer;
        }
    }

    // If not found, create a new one
    const drawerDef = availableWidgets.value.find(w => w.type === 'Drawer');
    if (!drawerDef) return null;

    const newDrawer: FlutterWidget = {
        id: `widget-${widgetIdCounter++}`,
        type: 'Drawer',
        props: {},
        children: []
    };

    // Initialize properties with default values
    drawerDef.properties.forEach((prop) => {
        newDrawer.props[prop.name] = prop.defaultValue;
    });

    // Add to drawer screen if it exists
    if (drawerScreen && drawerScreen.elements) {
        drawerScreen.elements.push(newDrawer);
    } else {
        // If drawer screen doesn't exist, create it
        const drawerElements = [newDrawer];
        screens.value.unshift({
            id: `screen-drawer-${Date.now()}`,
            name: 'Drawer',
            elements: drawerElements,
            isHome: false,
            isDrawer: true
        });
    }

    return newDrawer;
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
            accountName: Text('User Name'),
            accountEmail: Text('user@example.com'),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                'U',
                style: TextStyle(fontSize: 40.0, color: Colors.blue),
              ),
            ),
            decoration: BoxDecoration(
              color: Colors.blue,
            ),
          ),
          ${screens.value
            .filter(screen => !screen.isDrawer)
            .map(
                (screen, index) => `
          ListTile(
            leading: Icon(${index === 0 ? 'Icons.home' : `Icons.screen_${index + 1}`}),
            title: Text('${screen.name}'),
            trailing: Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              Navigator.pushNamed(context, '/${screen.name.toLowerCase().replace(/\s+/g, '_')}');
            },
          ),`
            )
            .join('\n')}
          Divider(),
          ListTile(
            leading: Icon(Icons.settings),
            title: Text('Settings'),
            onTap: () {
              // Navigate to settings
            },
          ),
          ListTile(
            leading: Icon(Icons.help),
            title: Text('Help & Feedback'),
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
        .replace(/[^\w\s]/g, '')  // Remove special characters
        .replace(/\s+/g, '')      // Remove spaces
        .replace(/^./, match => match.toUpperCase()); // Capitalize first letter

    // Generate code for each widget in this screen
    let screenWidgetsCode = '';
    if (screen.elements && Array.isArray(screen.elements)) {
        screen.elements.forEach((widget) => {
            const generateWidgetCode = (widget: FlutterWidget, indent: string = ''): string => {
                let code = `${indent}${widget.type}(\n`;

                // Add properties
                Object.entries(widget.props).forEach(([key, value]) => {
                    // Check if this is a color property
                    const isColorProperty = availableWidgets.value
                        .find((w) => w.type === widget.type)?.properties
                        .find((p: any) => p.name === key)?.type === 'color';

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
                    } else if (typeof value === 'string' && !value.includes('(')) {
                        code += `${indent}  ${key}: '${value}',\n`;
                    } else {
                        code += `${indent}  ${key}: ${value},\n`;
                    }
                });

                // Add children if any
                if (widget.children && Array.isArray(widget.children) && widget.children.length > 0) {
                    code += `${indent}  children: [\n`;
                    widget.children.forEach((child) => {
                        code += generateWidgetCode(child, `${indent}    `) + ',\n';
                    });
                    code += `${indent}  ],\n`;
                }

                code += `${indent})`;
                return code;
            };

            screenWidgetsCode += generateWidgetCode(widget, '      ') + ',\n';
        });
    }

    // Create a screen class
    return `
// @ts-ignore
import 'package:flutter/material.dart';

class ${screenClassName} extends StatelessWidget {
  const ${screenClassName}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('${screen.name}'),
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ${screenWidgetsCode}
          ],
        ),
      ),
    );
  }
}

// Import the shared NavigationDrawer
// @ts-ignore
import 'navigation_drawer.dart';
`;
};

// Active widget category for mobile selector
const activeWidgetCategory = ref<number>(0);

// Toggle between widget palette and widget verification
const showWidgetVerification = ref<boolean>(false);
const toggleWidgetVerification = () => {
    showWidgetVerification.value = !showWidgetVerification.value;
};

// Flutter widget rendering helper comment
// These functions were removed as they are no longer needed
// The widget rendering has been simplified to use static values

// Copy Flutter code to clipboard
const copyFlutterCode = () => {
    // Copy either the full app code, NavigationDrawer code, or the selected screen's code
    let codeToCopy;
    if (selectedCodeTab.value === 0) {
        codeToCopy = flutterCode.value;
    } else if (selectedCodeTab.value === 1) {
        codeToCopy = generateNavigationDrawerCode();
    } else {
        codeToCopy = generateScreenCode(selectedCodeTab.value - 2);
    }

    navigator.clipboard.writeText(codeToCopy);
    AlertService.prototype.success('Código copiado al portapapeles');
};

// Function to download the complete Flutter project
const downloadFlutterProject = async () => {
    try {
        // Show loading message
        AlertService.prototype.info('Procesando', 'Generando proyecto Flutter...');

        // Get the code to download based on selected tab
        let codeToDownload;
        if (selectedCodeTab.value === 0) {
            codeToDownload = flutterCode.value;
        } else if (selectedCodeTab.value === 1) {
            codeToDownload = generateNavigationDrawerCode();
        } else {
            codeToDownload = generateScreenCode(selectedCodeTab.value - 2);
        }

        // Get project name based on selected tab
        let downloadProjectName;
        if (selectedCodeTab.value === 0) {
            downloadProjectName = projectName.value || 'FlutterProject';
        } else if (selectedCodeTab.value === 1) {
            downloadProjectName = 'NavigationDrawer';
        } else {
            downloadProjectName = screens.value[selectedCodeTab.value - 2]?.name || 'ScreenProject';
        }

        // Get elements based on selected tab
        let elements;
        if (selectedCodeTab.value === 0) {
            elements = flutterWidgets.value;
        } else if (selectedCodeTab.value === 1) {
            elements = navigationDrawerWidget.value ? [navigationDrawerWidget.value] : [];
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
                id: props.pizarra?.id || null
            },
            {
                responseType: 'blob' // Important to set response type for file download
            }
        );

        // Create a blob URL from the response
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${projectName.value || 'FlutterProject'}.zip`);
        document.body.appendChild(link);

        // Trigger the download
        link.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        // Show success message
        AlertService.prototype.success('Éxito', 'Proyecto Flutter descargado correctamente');
    } catch (error) {
        console.error('Error downloading Flutter project:', error);
        AlertService.prototype.error('Error', 'No se pudo descargar el proyecto Flutter');
    }
};

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
        AlertService.prototype.error('Error', 'No se ha seleccionado ninguna imagen');
        return;
    }
    const url = "http://localhost:10000/api/scan";
    try {
        isProcessingImage.value = true;
        AlertService.prototype.info('Procesando', 'Analizando imagen con ROBOFLOW...');

        // Create form data
        const formData = new FormData();
        formData.append('file', selectedImage.value);

        // Send to backend for processing
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('Image processing response:', response.data);

        if (response.data.success) {
            // Store the original and processed images
            originalImage.value = response.data.originalImage;
            processedImage.value = response.data.processedImage;
            roboflowData.value = response.data.rawData;

            // Add the generated widgets to the canvas
            if (response.data.widgets && response.data.widgets.length > 0) {
                addAIWidgetsToCanvas(response.data.widgets);

                // Show success message
                AlertService.prototype.success('Éxito', 'Imagen procesada correctamente');

                // Show the results panel instead of closing the modal
                showResultsPanel.value = true;
            } else {
                AlertService.prototype.warning('Advertencia', 'No se pudieron detectar elementos en la imagen');
            }

            // If there's raw code, show it
            if (response.data.rawCode) {
                aiMessages.value.push({
                    text: response.data.rawCode,
                    isUser: false,
                    timestamp: Date.now()
                });
                showAIChat.value = true;
            }
        } else {
            AlertService.prototype.error('Error', response.data.message || 'Error al procesar la imagen');
        }
    } catch (error: any) {
        console.error('Error processing image:', error);
        AlertService.prototype.error('Error', error.response?.data?.message || 'Error al procesar la imagen');
    } finally {
        isProcessingImage.value = false;
    }
};
// Save changes to the pizarraFlutter
const savePizarraFlutter = async () => {
    if (!props.pizarra || !props.pizarra.id) return;

    try {
        // Ensure ID is a valid number
        if (isNaN(props.pizarra.id)) {
            console.error('Invalid pizarra ID:', props.pizarra.id);
            AlertService.prototype.error('Error', 'ID de pizarra inválido');
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
                }
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

        // Save both the legacy elements array (for backward compatibility)
        // and the new screens array
        const response = await axios.put(`/pizarra/${props.pizarra.id}`, {
            name: projectName.value,
            elements: currentScreen.value?.elements || [],
            screens: screens.value
        });
        console.log('Pizarra saved:', response.data);

        // AlertService.prototype.success('Éxito', 'Cambios guardados correctamente');
    } catch (error) {
        console.error('Error saving pizarra flutter:', error);
        AlertService.prototype.error('Error', 'No se pudieron guardar los cambios');
    }
};
// Debounced save function
const debouncedSave = debounce(() => {
    if (props.pizarra && props.isCreador && props.pizarra.id) {
        savePizarraFlutter();
    }
}, 1000); // 1 second debounce

// Watch for changes in flutterWidgets and save them
watch(
    flutterWidgets,
    () => {
        debouncedSave();
    },
    { deep: true, flush: 'post' }
);
// Load collaborators

// Invite a collaborator
/*const inviteCollaborator = async () => {

};*/

// Toggle floating chat visibility

// Toggle AI chat visibility
const toggleAIChat = () => {
    console.log('Toggling AI chat visibility desde Pizarra Flutter ');
    showAIChat.value = !showAIChat.value;

    // Close regular chat if opening AI chat
    if (showAIChat.value) {
        showFloatingChat.value = false;
    }
};

/**
 * Extracts Flutter code from an AI response.
 *
 * This improved function can:
 * 1. Extract code blocks from markdown format (```dart ... ```)
 * 2. Find import statements
 * 3. Find class definitions
 * 4. Find widget definitions
 * 5. Handle errors gracefully
 *
 * @param inputString The AI response text
 * @returns The extracted Flutter code
 */
function extractFromFirstImport(inputString: string): string {
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
 * Parses Flutter widgets from code and creates a widget hierarchy.
 *
 * This improved function can:
 * 1. Detect a wide range of Flutter widgets
 * 2. Extract property values from widget definitions
 * 3. Detect parent-child relationships between widgets
 * 4. Create a proper widget hierarchy
 * 5. Handle errors gracefully with fallback mechanisms
 * 6. Provide detailed logging for debugging
 *
 * @param inputCode The Flutter code to parse
 */
function parseFlutterWidgets(inputCode: string) {
    console.log('Parsing Flutter widgets from code...');

    try {
        // Define regex patterns for different widget structures
        const widgetRegex =
            /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableList|CardText|Scaffold|AppBar|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\b/g;

        // This regex captures widget definitions with their content between parentheses
        // It handles nested parentheses by using a non-greedy approach
        const widgetWithContentRegex =
            /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableList|CardText|Scaffold|AppBar|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(([\s\S]*?)(?:\)\s*,|\)$|\);)/g;

        // These regex patterns capture child and children properties
        // Improved to handle more complex child widget references
        const childRegex = /child\s*:\s*(?:(?:const\s+)?([A-Za-z][A-Za-z0-9_]*)\s*\(|([A-Za-z][A-Za-z0-9_]*)\s*\.\s*[a-zA-Z]+\()/;

        // Improved to better extract the content of the children array
        const childrenRegex = /children\s*:\s*\[\s*([\s\S]*?)\s*\]\s*(?:,|$)/;

        // This regex helps identify widget types within a children array
        const childrenWidgetsRegex =
            /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableList|CardText|Scaffold|AppBar|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(/g;

        // Helper function to extract property values from widget content
        const extractProperties = (widgetContent: string, widgetDefinition: any) => {
            const props = {};

            // Initialize with default values first
            widgetDefinition.properties.forEach((prop) => {
                props[prop.name] = prop.defaultValue;
            });

            // Try to extract actual values for common properties
            widgetDefinition.properties.forEach((prop) => {
                // Different regex patterns based on property type
                let propRegex;
                let valueExtractor = (match) => match[1];

                switch (prop.type) {
                    case 'string':
                        // Match string values with quotes
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*['"]([^'"]*?)['"]`, 'i');
                        break;
                    case 'number':
                        // Match numeric values
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i');
                        valueExtractor = (match) => parseFloat(match[1]);
                        break;
                    case 'boolean':
                        // Match boolean values
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*(true|false)`, 'i');
                        valueExtractor = (match) => match[1].toLowerCase() === 'true';
                        break;
                    case 'color':
                        // Try to match color values in various formats
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*(?:Colors\\.([a-zA-Z]+)|Color\\(0x([0-9A-Fa-f]+)\\)|'#([0-9A-Fa-f]+)')`, 'i');
                        valueExtractor = (match) => {
                            if (match[1]) return `#${colorNameToHex(match[1])}`;
                            if (match[2]) return `#${match[2]}`;
                            if (match[3]) return `#${match[3]}`;
                            return prop.defaultValue;
                        };
                        break;
                    case 'select':
                        // Match enum values
                        const options = prop.options.map((opt) => opt.replace(/\./g, '\\.'));
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*(${options.join('|')})`, 'i');
                        break;
                    default:
                        // For other types, try a generic approach
                        propRegex = new RegExp(`${prop.name}\\s*:\\s*([^,}]+)`, 'i');
                        valueExtractor = (match) => match[1].trim();
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
        const colorNameToHex = (colorName) => {
            const colorMap = {
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
        };

        // First pass: identify all widgets and their content
        const widgetDefinitions = [];
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
                    children: []
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
                    newWidget.pendingChildren = childrenMatch[1];
                }

                // Store the widget definition for further processing
                widgetDefinitions.push(newWidget);
            }
        }

        // Second pass: create a hierarchy of widgets
        const rootWidgets = [];
        const processedWidgets = new Set();

        // Process widgets with children first
        widgetDefinitions.forEach((widget) => {
            if (widget.pendingChildren) {
                // Reset the regex lastIndex to ensure we start from the beginning
                childrenWidgetsRegex.lastIndex = 0;

                // Find child widgets mentioned in the children array using our specialized regex
                const childrenContent = widget.pendingChildren;
                const childTypes = [];
                let widgetMatch;

                while ((widgetMatch = childrenWidgetsRegex.exec(childrenContent)) !== null) {
                    childTypes.push(widgetMatch[1]);
                }

                console.log(`Found ${childTypes.length} child widgets in children array for ${widget.type}:`, childTypes);

                childTypes.forEach((childType) => {
                    // Find a widget of this type that hasn't been processed yet
                    const childWidget = widgetDefinitions.find((w) => w.type === childType && !processedWidgets.has(w.id));

                    if (childWidget) {
                        widget.children.push(childWidget);
                        processedWidgets.add(childWidget.id);
                    }
                });

                delete widget.pendingChildren;
            }
        });

        // Process widgets with a single child
        widgetDefinitions.forEach((widget) => {
            if (widget.pendingChild) {
                const childType = widget.pendingChild;
                console.log(`Processing widget ${widget.type} with child type: ${childType}`);

                // Find a widget of this type that hasn't been processed yet
                const childWidget = widgetDefinitions.find((w) => w.type === childType && !processedWidgets.has(w.id));

                if (childWidget) {
                    widget.children.push(childWidget);
                    processedWidgets.add(childWidget.id);
                }

                delete widget.pendingChild;
            }
        });

        // Add widgets that haven't been assigned as children to the root level
        widgetDefinitions.forEach((widget) => {
            if (!processedWidgets.has(widget.id)) {
                rootWidgets.push(widget);
                console.log(`Adding ${widget.type} as a root widget`);
            }
        });

        // Log the widget hierarchy for debugging
        console.log(`Found ${rootWidgets.length} root widgets`);

        // Helper function to print the widget tree
        const printWidgetTree = (widget, depth = 0) => {
            const indent = '  '.repeat(depth);
            console.log(`${indent}${widget.type} (${widget.id})`);
            if (widget.children && widget.children.length > 0) {
                widget.children.forEach((child) => printWidgetTree(child, depth + 1));
            }
        };

        // Print the widget tree for each root widget
        rootWidgets.forEach((widget) => {
            printWidgetTree(widget);
        });

        // Add root widgets to the canvas
        rootWidgets.forEach((widget) => {
            flutterWidgets.value.push(widget);

            // Emit event to socket
            socket.emit('flutter-widget-added', {
                roomId: roomId.value,
                widget: widget,
                userId: currentUser.value
            });
        });

        // If no widgets were found or processed, fall back to the simple approach
        if (rootWidgets.length === 0) {
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
                        children: []
                    };

                    // Initialize properties with default values
                    widgetDefinition.properties.forEach((prop) => {
                        newWidget.props[prop.name] = prop.defaultValue;
                    });

                    flutterWidgets.value.push(newWidget);

                    // Emit event to socket
                    socket.emit('flutter-widget-added', {
                        roomId: roomId.value,
                        widget: newWidget,
                        userId: currentUser.value
                    });
                } else {
                    console.warn(`Widget no reconocido: ${widgetType}`);
                }
            });
        }
    } catch (error : any) {
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
                    children: []
                };

                // Initialize properties with default values
                widgetDefinition.properties.forEach((prop) => {
                    newWidget.props[prop.name] = prop.defaultValue;
                });

                flutterWidgets.value.push(newWidget);

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
        timestamp: Date.now()
    });

    // Store the prompt
    const prompt = aiPrompt.value;

    // Clear input and set processing state
    aiPrompt.value = '';
    isProcessingAI.value = true;

    // Extraer configuración de Azure desde el .env
    const azureApiUrl = 'https://pinto-maype3p5-eastus2.cognitiveservices.azure.com/'; //import.meta.env.AZURE_API_URL;
    const azureApiKey = '54FCfTb8CIMMHT5W7T2pTNeicQNxssRuTYYHh1UJQ8BMUyLd4HPjJQQJ99BEACHYHv6XJ3w3AAAAACOGcky8'; //import.meta.env.AZURE_API_KEY;
    const azureModelName = 'gpt-4.1'; //import.meta.env.AZURE_MODEL_NAME;

    try {
        // Validar que las variables de entorno estén definidas
        if (!azureApiUrl || !azureApiKey || !azureModelName) {
            throw new Error('La configuración de Azure no está completa en el archivo .env.');
        }

        // Enviar el prompt al servicio de Azure
        const response = await axios.post(
            `${azureApiUrl}/openai/deployments/${azureModelName}/chat/completions?api-version=2023-03-15-preview`,
            {
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente útil para Flutter. Cuando te pidan crear componentes, formularios o widgets de Flutter, responde SIEMPRE con un JSON que describa los widgets solicitados. El JSON debe tener la siguiente estructura: {"widgets": [{"type": "Widget_Type", "props": {"prop1": "value1"}, "children": []}], "explanation": "Explicación de los widgets"}.  \n\nLos tipos de widgets disponibles incluyen: Container, Row, Column, Text, Image, Icon, Scaffold, AppBar, Center, Form, TextFormField, TextField, DropdownButton, Checkbox, SizedBox, Drawer, Card, ListTile, FloatingActionButton. \n\nEjemplo de respuesta para un formulario de login: \n```json\n{"widgets": [{"type": "Form", "props": {"key": "GlobalKey<FormState>()"}, "children": [{"type": "Column", "props": {"mainAxisAlignment": "MainAxisAlignment.center"}, "children": [{"type": "TextFormField", "props": {"decoration": "InputDecoration(labelText: \\"Email\\")", "keyboardType": "TextInputType.email"}, "children": []}, {"type": "TextFormField", "props": {"decoration": "InputDecoration(labelText: \\"Password\\")", "obscureText": true}, "children": []}, {"type": "ElevatedButton", "props": {"child": "Text(\\"Login\\")"}, "children": []}]}]}], "explanation": "Este es un formulario de login con campos para email y contraseña, y un botón para enviar."}\n```'
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
                const jsonResponse = parseAIResponseAsJSON(aiResponse);
                if (jsonResponse && jsonResponse.widgets && Array.isArray(jsonResponse.widgets)) {
                    // Add the response to the chat with widgets
                    aiMessages.value.push({
                        text: jsonResponse.explanation || aiResponse,
                        isUser: false,
                        timestamp: Date.now(),
                        widgets: jsonResponse.widgets
                    });

                    // Show success message
                    AlertService.prototype.success('Éxito', 'Widgets generados por la IA listos para añadir a la pizarra');
                } else {
                    // Add the response to the chat without widgets
                    aiMessages.value.push({
                        text: aiResponse,
                        isUser: false,
                        timestamp: Date.now()
                    });
                    // If JSON parsing fails, try to extract Flutter code
                    const dart = extractFromFirstImport(aiResponse);
                    console.log('Extracted Dart code:', dart);
                    parseFlutterWidgets(dart);
                }
            } catch (error) {
                console.error('Error parsing AI response:', error);

                // Add the response to the chat without widgets
                aiMessages.value.push({
                    text: aiResponse,
                    isUser: false,
                    timestamp: Date.now()
                });

                // If JSON parsing fails, try to extract Flutter code
                const dart = extractFromFirstImport(aiResponse);
                console.log('Extracted Dart code:', dart);
                parseFlutterWidgets(dart);
            }
        } else {
            aiMessages.value.push({
                text: 'No se pudo generar una respuesta.',
                isUser: false,
                timestamp: Date.now()
            });
        }
    } catch (error: any) {
        console.error('Error al consultar Azure:', error);
        aiMessages.value.push({
            text: `Error: ${error.response?.data?.message || 'Error interno del servidor'}`,
            isUser: false,
            timestamp: Date.now()
        });
    } finally {
        isProcessingAI.value = false;
    }
};
/**
 * Parses the AI response as JSON.
 *
 * This function attempts to:
 * 1. Extract JSON from the AI response text
 * 2. Parse it into a JavaScript object
 * 3. Validate that it has the expected structure
 *
 * @param aiResponse The AI response text
 * @returns The parsed JSON object or null if parsing fails
 */
function parseAIResponseAsJSON(aiResponse: string): any {
    console.log('Parsing AI response as JSON...');

    try {
        // First, try to parse the entire response as JSON
        try {
            const jsonObject = JSON.parse(aiResponse);
            console.log('Successfully parsed entire response as JSON:', jsonObject);
            return jsonObject;
        } catch (error : any) {
            console.error('Failed to parse entire response as JSON:', error.message);
            console.log('Could not parse entire response as JSON, trying to extract JSON...');
        }

        // If that fails, try to extract JSON from the response
        // First look for JSON code blocks
        const jsonCodeBlockRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/g;
        let matches = [...aiResponse.matchAll(jsonCodeBlockRegex)];

        // If no code blocks found, try to find JSON objects directly
        if (matches.length === 0) {
            const jsonObjectRegex = /({[\s\S]*?"widgets"\s*:\s*\[[\s\S]*?\]})/g;
            matches = [...aiResponse.matchAll(jsonObjectRegex)];
        }

        if (matches.length > 0) {
            // Use the first match that can be parsed as JSON
            for (const match of matches) {
                const jsonString = match[1] || match[0];
                try {
                    const jsonObject = JSON.parse(jsonString);
                    console.log('Successfully extracted and parsed JSON:', jsonObject);
                    return jsonObject;
                } catch (error : any) {
                    console.error('Failed to parse extracted JSON:', error.message);
                    console.log('Failed to parse extracted JSON, trying next match...');
                }
            }
        }

        console.log('No valid JSON found in AI response');
        return null;
    } catch (error) {
        console.error('Error in parseAIResponseAsJSON:', error);
        return null;
    }
}
// Agregue widgets generados por IA al lienzo
const addAIWidgetsToCanvas = (widgets: any) => {
    if (!widgets || !Array.isArray(widgets) || widgets.length === 0) {
        AlertService.prototype.error('Error', 'No se encontraron widgets generados por la IA');
        return;
    }

    try {
        // Process each widget before adding to the canvas
        const processedWidgets = widgets.map((widget) => {
            // Ensure the widget has a unique ID
            if (!widget.id) {
                widget.id = `widget-${widgetIdCounter++}`;
            }

            // Ensure the widget has a children property initialized as an array
            if (!widget.children || !Array.isArray(widget.children)) {
                widget.children = [];
            }

            // Check if this widget type exists in the database
            const dbWidget = dbWidgets.value.find((w) => w.type === widget.type);
            if (dbWidget) {
                console.log('Found widget in database for AI-generated widget:', dbWidget);

                // Use code_string from database if available
                if (dbWidget.code_string && dbWidget.code_string.trim() !== '') {
                    widget.code_string = dbWidget.code_string;
                }

                // Use category from database if available
                if (dbWidget.categoria_widget_id) {
                    widget.categoria_widget_id = dbWidget.categoria_widget_id;
                    widget.categoria = dbWidget.categoria;
                }

                // Merge properties from database if available
                if (dbWidget.propiedades && Array.isArray(dbWidget.propiedades)) {
                    dbWidget.propiedades.forEach((prop) => {
                        // Only set if the property doesn't already exist in the widget
                        if (!widget.props[prop.name]) {
                            widget.props[prop.name] = prop.value || prop.defaultValue;
                        }
                    });
                }
            }

            return widget;
        });

        // Add processed widgets to the canvas
        processedWidgets.forEach((widget) => {
            flutterWidgets.value.push(widget);
        });

        // Emit widget added event to socket for each widget
        processedWidgets.forEach((widget) => {
            socket.emit('flutter-widget-added', {
                roomId: roomId.value,
                widget: widget,
                userId: currentUser.value,
                screenId: currentScreen.value?.id
            });
        });

        // Show success message
        AlertService.prototype.success('Éxito', 'Widgets generados por la IA añadidos a la pizarra');
    } catch (error) {
        console.error('Error adding widgets to canvas:', error);
        AlertService.prototype.error('Error', 'No se pudieron añadir los widgets generados por la IA');
    }
};
const onChatInputAI = () => {
    // Emit typing event for AI chat
    socket.emit('typingAI', {
        roomId: roomId.value,
        user: currentUser.value
    });
};
// Socket event handlers
onMounted(() => {
    console.log('Mounted PizarraFlutter');
    console.log(props.pizarra);
    applyDarkMode();
    initializeScreens();
    initNavigationDrawer();
    fetchWidgetsFromDB(); // Fetch widgets from the database
    socketService = new SocketService(socketConfig.value, roomId.value, currentUser.value);
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
        userName: currentUser.value
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
            flutterWidgets.value.push(ensureWidgetChildren(data.widget));
        }
    });

    socket.on('flutter-widget-updated', (data) => {
        if (data.userId !== currentUser.value) {
            const widget = ensureWidgetChildren(data.widget);
            const index = flutterWidgets.value.findIndex((w) => w.id === widget.id);
            if (index !== -1) {
                flutterWidgets.value[index] = widget;
            }
        }
    });

    socket.on('flutter-widget-removed', (data) => {
        if (data.userId !== currentUser.value) {
            flutterWidgets.value.splice(data.widgetIndex, 1);
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
        }
    });

    socket.on('roomUsers', (data) => {
        // Update online collaborators list
        onlineCollaborators.value = data.users.filter((user: string) => user !== props.user.name);
    });

    // Listen for chat messages
    /*socket.on('chatMessage', (data) => {
        console.log('Received chat message:', data);

        // Add message to chat if from another user
        if (data.user !== currentUser.value) {
            chatMessages.value.push({
                text: data.text,
                user: data.user,
                timestamp: data.timestamp
            });

            // Show notification if chat is not open
            if (!showFloatingChat.value) {
                AlertService.prototype.info('Nuevo Mensajes', `Nuevo mensaje de ${data.user}: ${data.text}`);
            }
        }
    });*/

    // Listen for typing events
    /*socket.on('typing', (data) => {
        if (data.user !== currentUser.value) {
            chatTyping.typing = data.user + ' está escribiendo...';

            // Clear typing message after 2 seconds
            if (chatTyping.timeout) clearTimeout(chatTyping.timeout);
            chatTyping.timeout = setTimeout(() => {
                chatTyping.typing = '';
            }, 2000);
        }
    });*/

    // Listen for collaborator acceptance events
    socket.on('collaboratorAccepted', (data) => {
        AlertService.prototype.success('Colaborador Aceptado', `El colaborador ${data.user} ha sido aceptado.`);

        // Reload the collaborators list to get the updated list
        // loadCollaborators();
    });

    // Load collaborators and chat messages if we have a form ID
    if (props.pizarra?.id) {
        // loadCollaborators();
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
                <input
                    v-model="projectName"
                    type="text"
                    placeholder="Nombre del proyecto"
                    class="w-full rounded-md border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:w-1/2"
                    @keyup.enter="savePizarraFlutter"
                />
                <div class="flex w-full flex-wrap justify-center gap-2 md:w-auto md:justify-end">
                    <button
                        @click="showImageUpload = !showImageUpload"
                        class="rounded-md bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
                    >
                        Subir Imagen
                    </button>
                    <button @click="savePizarraFlutter"
                            class="rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
                        Guardar Cambios
                    </button>
                    <button
                        @click="showScreenManager = !showScreenManager"
                        class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                    >
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
                        <button
                            @click="closeImageUpload"
                            class="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Results Panel (after processing) -->
                    <div v-if="showResultsPanel" class="mb-6">
                        <h3 class="mb-2 text-lg font-semibold dark:text-white">Resultados del Análisis ROBOFLOW</h3>

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
                        <div v-if="roboflowData && roboflowData.predictions" class="mt-4 rounded-lg border p-3 dark:border-gray-600">
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
                                            <td class="p-2">x: {{ Math.round(prediction.x) }}, y: {{ Math.round(prediction.y) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Action buttons for results panel -->
                        <div class="mt-4 flex justify-end gap-2">
                            <button @click="showResultsPanel = false; showImageUpload = false"
                                    class="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600">
                                Cerrar y Continuar
                            </button>
                            <button @click="showResultsPanel = false; clearSelectedImage()"
                                    class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                                Procesar Otra Imagen
                            </button>
                        </div>
                    </div>

                    <!-- Upload Panel (before processing) -->
                    <div v-if="!showResultsPanel">
                        <div class="mb-4">
                            <p class="mb-2 text-sm text-gray-600 dark:text-gray-300">
                                Sube una imagen de un boceto o diseño para que ROBOFLOW lo convierta en componentes Flutter.
                            </p>

                            <!-- Image preview -->
                            <div v-if="previewImage" class="mb-4">
                                <img :src="previewImage" alt="Preview"
                                     class="mx-auto max-h-60 rounded border dark:border-gray-600" />
                                <div class="mt-2 flex justify-center">
                                    <button
                                        @click="clearSelectedImage"
                                        class="rounded bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            <!-- Upload options -->
                            <div v-if="!previewImage" class="flex flex-col gap-3">
                                <!-- Camera option -->
                                <label
                                    class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                        />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span class="dark:text-white">Tomar Foto</span>
                                    <input type="file" accept="image/*" capture="environment" class="hidden"
                                           @change="handleImageUpload" />
                                </label>

                                <!-- Gallery option -->
                                <label
                                    class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-6 w-6 text-gray-500 dark:text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span class="dark:text-white">Seleccionar de Galería</span>
                                    <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
                                </label>
                            </div>
                        </div>

                        <!-- Action buttons -->
                        <div class="flex justify-end gap-2">
                            <button @click="closeImageUpload" class="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button
                                @click="processImage"
                                class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                :disabled="!selectedImage || isProcessingImage"
                                :class="{ 'cursor-not-allowed opacity-50': !selectedImage || isProcessingImage }"
                            >
                                {{ isProcessingImage ? 'Procesando...' : 'Procesar Imagen' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Screen Manager -->
            <div class="mb-1">
                <div class="mb-2 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Pantallas</h3>
                </div>

                <!-- Screen tabs -->
                <div class="screen-tabs mb-2 flex overflow-x-auto pb-2">
                    <button
                        v-for="(screen, index) in screens"
                        :key="screen.id"
                        @click="selectScreen(index)"
                        class="mr-1 flex items-center whitespace-nowrap rounded-t-lg border px-4 py-2 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        :class="
                            currentScreenIndex === index
                                ? 'border-b-0 border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900 dark:bg-opacity-30'
                                : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                        "
                    >
                        <span>{{ screen.name }}</span>
                        <span v-if="screen.isHome" class="ml-1 rounded bg-green-500 px-1 text-xs text-white">Home</span>
                    </button>
                    <button
                        @click="showFlutterCode = !showFlutterCode"
                        class="rounded-t-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
                    >
                        {{ showFlutterCode ? 'Ocultar Código' : 'Mostrar Código' }}
                    </button>
                </div>

                <!-- Screen Manager Panel Gestion de Pantallas -->
                <div
                    v-if="showScreenManager"
                    class="mb-4 rounded-lg border bg-white p-4 shadow transition-colors dark:border-gray-600 dark:bg-gray-800"
                >
                    <h4 class="mb-2 font-semibold dark:text-white">Gestionar Pantallas</h4>

                    <!-- Add new screen -->
                    <div class="mb-4 flex">
                        <input
                            v-model="newScreenName"
                            type="text"
                            placeholder="Nombre de la nueva pantalla"
                            class="flex-1 rounded-l border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button @click="addScreen"
                                class="rounded-r bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
                            Añadir
                        </button>
                    </div>

                    <!-- Screen list -->
                    <div class="max-h-60 overflow-y-auto">
                        <div
                            v-for="(screen, index) in screens"
                            :key="screen.id"
                            class="flex items-center justify-between border-b p-2 dark:border-gray-600"
                        >
                            <div class="flex items-center">
                                <span class="mr-2 dark:text-white">{{ screen.name }}</span>
                                <span v-if="screen.isHome"
                                      class="rounded bg-green-500 px-1 text-xs text-white">Home</span>
                            </div>
                            <div class="flex">
                                <button
                                    @click="setHomeScreen(index)"
                                    class="mr-1 rounded bg-green-500 px-2 py-1 text-xs text-white transition-colors hover:bg-green-600"
                                    :disabled="screen.isHome"
                                    :class="{ 'cursor-not-allowed opacity-50': screen.isHome }"
                                >
                                    Set Home
                                </button>
                                <button
                                    @click="deleteScreen(index)"
                                    class="rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600"
                                    :disabled="screens.length <= 1"
                                    :class="{ 'cursor-not-allowed opacity-50': screens.length <= 1 }"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Flutter code display -->
            <FlutterCodeViewer
                :show="showFlutterCode"
                :flutterCode="flutterCode"
                :selectedCodeTab="selectedCodeTab"
                :screens="screens"
                :generateNavigationDrawerCode="generateNavigationDrawerCode"
                :generateScreenCode="generateScreenCode"
                :downloadFlutterProject="downloadFlutterProject"
                :copyFlutterCode="copyFlutterCode"
                :setSelectedCodeTab="setSelectedCodeTab"
                :initNavigationDrawer="initNavigationDrawer"
            />

            <div v-if="!showFlutterCode" class="flex h-full flex-1 flex-col gap-4">
                <!-- Mobile widget selector (visible on small screens) -->
                <div class="mb-4 md:hidden">
                    <!-- Toggle button for mobile -->
                    <div class="widget-toggle-container mb-2 px-3 py-2 border-b dark:border-gray-600 bg-gray-100 rounded-md dark:bg-gray-700">
                        <button
                            @click="toggleWidgetVerification"
                            class="widget-toggle-button rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 w-full"
                        >
                            {{ showWidgetVerification ? 'Mostrar Paleta' : 'Verificar Componentes' }}
                        </button>
                    </div>

                    <!-- Widget palette for mobile -->
                    <WidgetPalette
                        v-if="!showWidgetVerification"
                        :categoriesWidget="categoriesWidget"
                        :activeWidgetCategory="activeWidgetCategory"
                        :widgetsByActiveCategory="widgetsByActiveCategory"
                        @update:activeWidgetCategory="val => activeWidgetCategory = val"
                        @addWidget="addWidget"
                        @onPaletteDragStart="onPaletteDragStart"
                        @onPaletteDragEnd="onPaletteDragEnd"
                    />

                    <!-- Widget verification for mobile -->
                    <WidgetVerification
                        v-if="showWidgetVerification"
                        :isVisible="showWidgetVerification"
                        @close="toggleWidgetVerification"
                    />
                </div>

                <div class="flex h-full flex-col gap-4 md:flex-row">
                    <!-- Widget section with toggle button -->
                    <div class="widget-section w-64 overflow-hidden rounded-md bg-gray-100 transition-colors dark:bg-gray-700">
                        <!-- Toggle button -->
                        <div class="widget-toggle-container mb-2 px-3 py-2 border-b dark:border-gray-600">
                            <button
                                @click="toggleWidgetVerification"
                                class="widget-toggle-button rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                            >
                                {{ showWidgetVerification ? 'Mostrar Paleta' : 'Verificar Componentes' }}
                            </button>
                        </div>

                        <!-- Widget palette (desktop version with mobile-like style) -->
                        <WidgetPalette
                            v-if="!showWidgetVerification"
                            :categoriesWidget="categoriesWidget"
                            :activeWidgetCategory="activeWidgetCategory"
                            :widgetsByActiveCategory="widgetsByActiveCategory"
                            @update:activeWidgetCategory="val => activeWidgetCategory = val"
                            @addWidget="addWidget"
                            @onPaletteDragStart="onPaletteDragStart"
                            @onPaletteDragEnd="onPaletteDragEnd"
                        />

                        <!-- Widget verification component -->
                        <WidgetVerification
                            v-if="showWidgetVerification"
                            :isVisible="showWidgetVerification"
                            @close="toggleWidgetVerification"
                        />
                    </div>

                    <!-- Canvas with Mobile Phone Frame -->
                    <div class="flex flex-1 flex-col gap-4">
                        <!-- Mobile phone frame container -->
                        <div class="flex items-start justify-center">
                            <div
                                class="mobile-phone-frame transition-colors dark:bg-gray-900 dark:shadow-[0_0_0_10px_#000,0_0_0_11px_#333,0_20px_30px_rgba(0,0,0,0.5)]"
                            >
                                <!-- Phone status bar -->
                                <PhoneStatusBar
                                    :title="currentScreen?.name || 'Pantalla Flutter'"
                                    :showMenu="true"
                                    :actions="[]"
                                    :class="{
                                        'selected-widget m-2': selectedWidget?.id === 'widget-1'
                                    }"
                                    class="cursor-move"
                                    @click="selectWidget(currentScreen.elements[0])"
                                />
                                <br/>
                                <!-- Phone content area (draggable canvas) -->
                                <div class="phone-content-area transition-colors bg-sky-50 dark:bg-gray-800 mt-4">
                                    <!-- Si la pantalla esta vacia-->
                                    <div
                                        v-if="!currentScreen || !Array.isArray(currentScreen.elements)"
                                        class="flex min-h-full w-full items-center justify-center"
                                    >
                                        <div
                                            class="rounded-lg bg-gray-100 p-4 text-center transition-colors dark:bg-gray-700">
                                            <p class="text-gray-600 dark:text-gray-300">Cargando pantalla...</p>
                                            <button
                                                @click="initializeScreens"
                                                class="mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                                            >
                                                Reiniciar pantalla
                                            </button>
                                        </div>
                                    </div>
                                    <!-- Draggable elements -->
                                    <draggable
                                        v-else
                                        v-model="currentScreen.elements"
                                        group="widgets"
                                        item-key="id"
                                        class="min-h-full w-full "
                                        :animation="150"
                                        ghost-class="ghost-widget"
                                        chosen-class="chosen-widget"
                                    >
                                        <template #item="{ element }">
                                            <div
                                                class="mobile-widget relative cursor-move transition-colors dark:bg-gray-700 dark:shadow-gray-900"
                                                :class="{
                                                    'selected-widget': selectedWidget?.id === element.id,
                                                    'text-widget dark:bg-blue-900 dark:bg-opacity-20': ['Text', 'h1', 'h2', 'h3'].includes(
                                                        element.type,
                                                    ),
                                                    'input-widget dark:bg-orange-900 dark:bg-opacity-20': [
                                                        'TextField',
                                                        'Checkbox',
                                                        'DropdownButton',
                                                    ].includes(element.type),
                                                    'container-widget dark:bg-green-900 dark:bg-opacity-20': ['Container', 'SafeArea'].includes(
                                                        element.type,
                                                    ),
                                                    'layout-widget dark:bg-pink-900 dark:bg-opacity-20': ['Row', 'Column', 'Padding'].includes(
                                                        element.type,
                                                    ),
                                                    'display-widget dark:bg-purple-900 dark:bg-opacity-20': ['Image', 'Icon'].includes(element.type),
                                                }"
                                                @click.stop="selectWidget(element)"
                                            >
<!--                                                <div class="widget-header dark:border-gray-600 dark:bg-gray-800">
                                                    <span class="widget-type dark:text-white">Widget: {{ element.type }}</span>
                                                </div>-->

                                                <!-- Realistic Flutter Widget Rendering -->
                                                <div class="flutter-widget-preview bg-red-100 static">
                                                    <div class="absolute top-0 right-0 z-10">
                                                        <button @click.stop="removeWidget(element)" class="widget-remove-btn ">
                                                            ×
                                                        </button>
                                                    </div>
                                                    <!-- Text Widget -->
                                                    <div v-if="element.type === 'Text'"
                                                        class="flutter-text"
                                                        :style="{
                                                            fontSize: '16px',
                                                            fontWeight: 'normal',
                                                            color: '#000000',
                                                            textAlign: 'left',
                                                        }"
                                                    >
                                                        {{ element.props.data || 'Text' }}
                                                    </div>

                                                    <!-- TextField Widget -->
                                                    <div v-else-if="element.type === 'TextField'"
                                                         class="flutter-text-field">
                                                        <div class="text-field-label" v-if="element.props.decoration">
                                                            Label
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter text"
                                                            :class="{ 'text-field-obscured': element.props.obscureText === true }"
                                                            :disabled="element.props.enabled === false"
                                                        />
                                                    </div>

                                                    <!-- Container Widget -->
                                                    <div v-else-if="element.type === 'Container'"
                                                        class="flutter-container droppable-container"
                                                        :style="{
                                                            width: (element.props.width || 200) + 'px',
                                                            minHeight: (element.props.height || 200) + 'px',
                                                            backgroundColor: element.props.color || '#FFFFFF',
                                                            padding: '16px',
                                                            margin: '8px',
                                                            borderRadius: '4px',
                                                            boxShadow: element.props.decoration?.includes('boxShadow')
                                                                ? '0 2px 5px rgba(0,0,0,0.2)'
                                                                : 'none',
                                                            overflowY: 'auto',
                                                            maxHeight: '400px',
                                                        }"
                                                        @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                        @drop.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                    >
                                                        <div
                                                            v-if="
                                                                !element.children || !Array.isArray(element.children) || element.children.length === 0
                                                            "
                                                            class="container-placeholder"
                                                        >
                                                            <div class="drop-here-indicator">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    class="h-6 w-6"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                        stroke-width="2"
                                                                        d="M12 4v16m8-8H4"
                                                                    />
                                                                </svg>
                                                                <span>Arrastra componentes aquí</span>
                                                            </div>
                                                            <div class="add-child-widget-container">
                                                                <button @click.stop="showAddChildMenu = element.id"
                                                                        class="add-child-widget-btn">
                                                                    Agregar Widget Hijo
                                                                </button>
                                                                <div v-if="showAddChildMenu === element.id"
                                                                     class="add-child-widget-menu">
                                                                    <div class="widget-category-tabs">
                                                                        <button
                                                                            v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                                                                            :key="category"
                                                                            class="widget-category-tab"
                                                                            :class="{ 'active-tab': activeAddChildCategory === index }"
                                                                            @click.stop="activeAddChildCategory = index"
                                                                        >
                                                                            {{ category }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 0">
                                                                        <button
                                                                            v-for="widget in inputWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button input-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 1">
                                                                        <button
                                                                            v-for="widget in layoutWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button layout-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 2">
                                                                        <button
                                                                            v-for="widget in displayWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button display-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-else-if="Array.isArray(element.children)"
                                                             class="container-children">
                                                            <div
                                                                class="add-child-widget-container children-container-btn">
                                                                <button @click.stop="showAddChildMenu = element.id"
                                                                        class="add-child-widget-btn">
                                                                    + Agregar Widget Hijo
                                                                </button>
                                                                <div v-if="showAddChildMenu === element.id"
                                                                     class="add-child-widget-menu">
                                                                    <div class="widget-category-tabs">
                                                                        <button
                                                                            v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                                                                            :key="category"
                                                                            class="widget-category-tab"
                                                                            :class="{ 'active-tab': activeAddChildCategory === index }"
                                                                            @click.stop="activeAddChildCategory = index"
                                                                        >
                                                                            {{ category }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 0">
                                                                        <button
                                                                            v-for="widget in inputWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button input-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 1">
                                                                        <button
                                                                            v-for="widget in layoutWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button layout-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 2">
                                                                        <button
                                                                            v-for="widget in displayWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button display-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-for="child in element.children" :key="child.id"
                                                                 class="container-child">
                                                                <!-- Text Widget -->
                                                                <div
                                                                    v-if="child.type === 'Text'"
                                                                    class="flutter-text"
                                                                    :style="{
                                                                        fontSize: '16px',
                                                                        fontWeight: 'normal',
                                                                        color: '#000000',
                                                                        textAlign: 'left',
                                                                    }"
                                                                >
                                                                    {{ child.props.data || 'Text' }}
                                                                </div>

                                                                <!-- TextField Widget -->
                                                                <div v-else-if="child.type === 'TextField'"
                                                                     class="flutter-text-field">
                                                                    <div class="text-field-label"
                                                                         v-if="child.props.decoration">Label
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter text"
                                                                        :class="{ 'text-field-obscured': child.props.obscureText === true }"
                                                                        :disabled="child.props.enabled === false"
                                                                    />
                                                                </div>

                                                                <!-- Checkbox Widget -->
                                                                <div v-else-if="child.type === 'Checkbox'"
                                                                     class="flutter-checkbox">
                                                                    <input type="checkbox"
                                                                           :checked="child.props.value === true" />
                                                                    <div
                                                                        class="checkbox-active-color"
                                                                        :style="{ backgroundColor: child.props.activeColor || '#2196F3' }"
                                                                    ></div>
                                                                </div>

                                                                <!-- DropdownButton Widget -->
                                                                <div v-else-if="child.type === 'DropdownButton'"
                                                                     class="flutter-dropdown">
                                                                    <select>
                                                                        <option
                                                                            v-for="(item, index) in child.props.items"
                                                                            :key="index"
                                                                            :selected="item === child.props.value"
                                                                        >
                                                                            {{ item }}
                                                                        </option>
                                                                    </select>
                                                                </div>

                                                                <!-- Image Widget -->
                                                                <div v-else-if="child.type === 'Image'"
                                                                     class="flutter-image">
                                                                    <img
                                                                        :src="child.props.src"
                                                                        :style="{
                                                                            width: (child.props.width || 150) + 'px',
                                                                            height: (child.props.height || 150) + 'px',
                                                                            objectFit: 'cover',
                                                                        }"
                                                                        alt="Flutter Image"
                                                                    />
                                                                </div>

                                                                <!-- Icon Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'Icon'"
                                                                    class="flutter-icon"
                                                                    :style="{
                                                                        color: child.props.color || '#000000',
                                                                        fontSize: (child.props.size || 24) + 'px',
                                                                    }"
                                                                >
                                                                    <i class="material-icons">star</i>
                                                                </div>

                                                                <!-- TextFormField Widget -->
                                                                <div v-else-if="child.type === 'TextFormField'"
                                                                     class="flutter-text-field">
                                                                    <div class="text-field-label"
                                                                         v-if="child.props.decoration">
                                                                        {{ child.props.decoration.includes('labelText') ? 'Label' : ''
                                                                        }}
                                                                        <span
                                                                            class="text-field-hint"
                                                                            v-if="child.props.decoration.includes('hintText')"
                                                                        >
                                                                            (Hint: Enter text)
                                                                        </span>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter text"
                                                                        :class="{ 'text-field-obscured': child.props.obscureText === true }"
                                                                        :disabled="child.props.enabled === false"
                                                                    />
                                                                </div>

                                                                <!-- Form Widget -->
                                                                <div v-else-if="child.type === 'Form'"
                                                                     class="flutter-form droppable-container">
                                                                    <div class="form-header">Form</div>
                                                                    <div class="form-content">
                                                                        <div
                                                                            v-if="
                                                                                !child.children ||
                                                                                !Array.isArray(child.children) ||
                                                                                child.children.length === 0
                                                                            "
                                                                            class="form-placeholder"
                                                                        >
                                                                            <div class="drop-here-indicator">
                                                                                <span>Form Fields Go Here</span>
                                                                            </div>
                                                                        </div>
                                                                        <div v-else class="form-fields">
                                                                            <div
                                                                                v-for="grandchild in child.children"
                                                                                :key="grandchild.id"
                                                                                class="form-field"
                                                                            >
                                                                                <!-- Render form fields recursively -->
                                                                                <div
                                                                                    v-if="grandchild.type === 'TextFormField'"
                                                                                    class="flutter-text-field"
                                                                                >
                                                                                    <div class="text-field-label"
                                                                                         v-if="grandchild.props.decoration">
                                                                                        {{
                                                                                            grandchild.props.decoration.includes('labelText')
                                                                                                ? 'Label'
                                                                                                : ''
                                                                                        }}
                                                                                    </div>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Enter text"
                                                                                        :class="{
                                                                                            'text-field-obscured':
                                                                                                grandchild.props.obscureText === true,
                                                                                        }"
                                                                                        :disabled="grandchild.props.enabled === false"
                                                                                    />
                                                                                </div>
                                                                                <div v-else class="widget-properties">
                                                                                    <div
                                                                                        v-for="(value, key) in grandchild.props"
                                                                                        :key="key"
                                                                                        class="widget-property"
                                                                                    >
                                                                                        <span
                                                                                            class="property-name">{{ key
                                                                                            }}:</span>
                                                                                        <span
                                                                                            class="property-value">{{ value
                                                                                            }}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <!-- Scaffold Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'Scaffold'"
                                                                    class="flutter-scaffold droppable-container"
                                                                    :style="{ backgroundColor: child.props.backgroundColor || '#FFFFFF' }"
                                                                >
                                                                    <div class="scaffold-header">Scaffold</div>
                                                                    <div class="scaffold-content">
                                                                        <div
                                                                            v-if="
                                                                                !child.children ||
                                                                                !Array.isArray(child.children) ||
                                                                                child.children.length === 0
                                                                            "
                                                                            class="scaffold-placeholder"
                                                                        >
                                                                            <div class="drop-here-indicator">
                                                                                <span>Scaffold Content Goes Here</span>
                                                                            </div>
                                                                        </div>
                                                                        <div v-else class="scaffold-children">
                                                                            <div
                                                                                v-for="grandchild in child.children"
                                                                                :key="grandchild.id"
                                                                                class="scaffold-child"
                                                                            >
                                                                                <!-- Render scaffold children recursively -->
                                                                                <div
                                                                                    v-if="grandchild.type === 'AppBar'"
                                                                                    class="flutter-app-bar"
                                                                                    :style="{
                                                                                        backgroundColor:
                                                                                            grandchild.props.backgroundColor || '#2196F3',
                                                                                    }"
                                                                                >
                                                                                    <div class="app-bar-title">
                                                                                        {{ grandchild.props.title || 'AppBar Title'
                                                                                        }}
                                                                                    </div>
                                                                                </div>
                                                                                <div v-else class="widget-properties">
                                                                                    <div
                                                                                        v-for="(value, key) in grandchild.props"
                                                                                        :key="key"
                                                                                        class="widget-property"
                                                                                    >
                                                                                        <span
                                                                                            class="property-name">{{ key
                                                                                            }}:</span>
                                                                                        <span
                                                                                            class="property-value">{{ value
                                                                                            }}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <!-- AppBar Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'AppBar'"
                                                                    class="flutter-app-bar"
                                                                    :style="{ backgroundColor: child.props.backgroundColor || '#2196F3' }"
                                                                >
                                                                    <div class="app-bar-title">
                                                                        {{ child.props.title || 'AppBar Title' }}
                                                                    </div>
                                                                    <div
                                                                        v-if="
                                                                            child.children &&
                                                                            Array.isArray(child.children) &&
                                                                            child.children.length > 0
                                                                        "
                                                                        class="app-bar-actions"
                                                                    >
                                                                        <div
                                                                            v-for="grandchild in child.children"
                                                                            :key="grandchild.id"
                                                                            class="app-bar-action"
                                                                        >
                                                                            <!-- Render app bar actions -->
                                                                            <div class="widget-properties">
                                                                                <div
                                                                                    v-for="(value, key) in grandchild.props"
                                                                                    :key="key"
                                                                                    class="widget-property"
                                                                                >
                                                                                    <span class="property-name">{{ key
                                                                                        }}:</span>
                                                                                    <span
                                                                                        class="property-value">{{ value
                                                                                        }}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <!-- Center Widget -->
                                                                <div v-else-if="child.type === 'Center'"
                                                                     class="flutter-center droppable-container">
                                                                    <div class="center-content">
                                                                        <div
                                                                            v-if="
                                                                                !child.children ||
                                                                                !Array.isArray(child.children) ||
                                                                                child.children.length === 0
                                                                            "
                                                                            class="center-placeholder"
                                                                        >
                                                                            <div class="drop-here-indicator">
                                                                                <span>Centered Content Goes Here</span>
                                                                            </div>
                                                                        </div>
                                                                        <div v-else class="center-children">
                                                                            <div
                                                                                v-for="grandchild in child.children"
                                                                                :key="grandchild.id"
                                                                                class="center-child"
                                                                            >
                                                                                <!-- Render centered children -->
                                                                                <div class="widget-properties">
                                                                                    <div
                                                                                        v-for="(value, key) in grandchild.props"
                                                                                        :key="key"
                                                                                        class="widget-property"
                                                                                    >
                                                                                        <span
                                                                                            class="property-name">{{ key
                                                                                            }}:</span>
                                                                                        <span
                                                                                            class="property-value">{{ value
                                                                                            }}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <!-- SizedBox Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'SizedBox'"
                                                                    class="flutter-sized-box droppable-container"
                                                                    :style="{
                                                                        width: (child.props.width || 100) + 'px',
                                                                        height: (child.props.height || 100) + 'px',
                                                                        border: '1px dashed #ccc',
                                                                    }"
                                                                >
                                                                    <div
                                                                        v-if="
                                                                            !child.children ||
                                                                            !Array.isArray(child.children) ||
                                                                            child.children.length === 0
                                                                        "
                                                                        class="sized-box-placeholder"
                                                                    >
                                                                        <div class="drop-here-indicator">
                                                                            <span
                                                                            >SizedBox: {{ child.props.width || 100 }}x{{
                                                                                    child.props.height || 100
                                                                                }}</span
                                                                            >
                                                                        </div>
                                                                    </div>
                                                                    <div v-else class="sized-box-children">
                                                                        <div
                                                                            v-for="grandchild in child.children"
                                                                            :key="grandchild.id"
                                                                            class="sized-box-child"
                                                                        >
                                                                            <!-- Render sized box children -->
                                                                            <div class="widget-properties">
                                                                                <div
                                                                                    v-for="(value, key) in grandchild.props"
                                                                                    :key="key"
                                                                                    class="widget-property"
                                                                                >
                                                                                    <span class="property-name">{{ key
                                                                                        }}:</span>
                                                                                    <span
                                                                                        class="property-value">{{ value
                                                                                        }}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <!-- Drawer Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'Drawer'"
                                                                    class="flutter-drawer droppable-container"
                                                                    :style="{
                                                                        backgroundColor: child.props.backgroundColor || '#FFFFFF',
                                                                        width: (child.props.width || 300) + 'px',
                                                                        boxShadow: `0 0 ${child.props.elevation || 16}px rgba(0,0,0,0.3)`,
                                                                    }"
                                                                >
                                                                    <!-- User Account Drawer Header -->
                                                                    <div class="drawer-header" style="background-color: #2196F3; color: white; padding: 16px; height: 150px; display: flex; flex-direction: column; justify-content: flex-end;">
                                                                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                                                            <div style="width: 60px; height: 60px; border-radius: 30px; background-color: white; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                                                                                <span style="font-size: 24px; color: #2196F3;">U</span>
                                                                            </div>
                                                                            <div>
                                                                                <div style="font-weight: bold; font-size: 16px;">User Name</div>
                                                                                <div style="font-size: 14px;">user@example.com</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div class="drawer-content">
                                                                        <!-- Default ListTiles for navigation -->
                                                                        <div class="drawer-list-tiles">
                                                                            <!-- Home screen -->
                                                                            <div class="flutter-list-tile" style="padding: 16px; display: flex; align-items: center; border-bottom: 1px solid #f0f0f0;">
                                                                                <div style="margin-right: 16px; color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                                                                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                                <div style="flex: 1;">Home</div>
                                                                                <div style="color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                                                                                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                            </div>

                                                                            <!-- Profile screen -->
                                                                            <div class="flutter-list-tile" style="padding: 16px; display: flex; align-items: center; border-bottom: 1px solid #f0f0f0;">
                                                                                <div style="margin-right: 16px; color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                                <div style="flex: 1;">Profile</div>
                                                                                <div style="color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                                                                                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                            </div>

                                                                            <!-- Divider -->
                                                                            <div style="height: 1px; background-color: #e0e0e0; margin: 8px 0;"></div>

                                                                            <!-- Settings -->
                                                                            <div class="flutter-list-tile" style="padding: 16px; display: flex; align-items: center; border-bottom: 1px solid #f0f0f0;">
                                                                                <div style="margin-right: 16px; color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                                                                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                                <div style="flex: 1;">Settings</div>
                                                                                <div style="color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                                                                                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                            </div>

                                                                            <!-- Help & Feedback -->
                                                                            <div class="flutter-list-tile" style="padding: 16px; display: flex; align-items: center; border-bottom: 1px solid #f0f0f0;">
                                                                                <div style="margin-right: 16px; color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                                                                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                                <div style="flex: 1;">Help & Feedback</div>
                                                                                <div style="color: #757575;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                                                                                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <!-- Custom drawer children if any -->
                                                                        <div v-if="child.children && Array.isArray(child.children) && child.children.length > 0" class="drawer-children">
                                                                            <div
                                                                                v-for="grandchild in child.children"
                                                                                :key="grandchild.id"
                                                                                class="drawer-child"
                                                                            >
                                                                                <!-- Render drawer children recursively -->
                                                                                <div class="widget-properties">
                                                                                    <div
                                                                                        v-for="(value, key) in grandchild.props"
                                                                                        :key="key"
                                                                                        class="widget-property"
                                                                                    >
                                                                                        <span
                                                                                            class="property-name">{{ key
                                                                                            }}:</span>
                                                                                        <span
                                                                                            class="property-value">{{ value
                                                                                            }}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <!-- Card Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'Card'"
                                                                    class="flutter-card droppable-container"
                                                                    :style="{
                                                                        backgroundColor: child.props.color || '#FFFFFF',
                                                                        boxShadow: `0 0 ${child.props.elevation || 1}px rgba(0,0,0,0.3)`,
                                                                        margin: child.props.margin || '8px',
                                                                        borderRadius: '4px',
                                                                    }"
                                                                >
                                                                    <div
                                                                        v-if="
                                                                            !child.children ||
                                                                            !Array.isArray(child.children) ||
                                                                            child.children.length === 0
                                                                        "
                                                                        class="card-placeholder"
                                                                    >
                                                                        <div class="drop-here-indicator">
                                                                            <span>Card Content Goes Here</span>
                                                                        </div>
                                                                    </div>
                                                                    <div v-else class="card-children">
                                                                        <div
                                                                            v-for="grandchild in child.children"
                                                                            :key="grandchild.id"
                                                                            class="card-child"
                                                                        >
                                                                            <!-- Render card children recursively -->
                                                                            <div class="widget-properties">
                                                                                <div
                                                                                    v-for="(value, key) in grandchild.props"
                                                                                    :key="key"
                                                                                    class="widget-property"
                                                                                >
                                                                                    <span class="property-name">{{ key
                                                                                        }}:</span>
                                                                                    <span
                                                                                        class="property-value">{{ value
                                                                                        }}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <!-- ListTile Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'ListTile'"
                                                                    class="flutter-list-tile"
                                                                    :class="{ 'list-tile-disabled': child.props.enabled === false }"
                                                                >
                                                                    <div v-if="child.props.leading"
                                                                         class="list-tile-leading">
                                                                        <span>{{ child.props.leading }}</span>
                                                                    </div>
                                                                    <div class="list-tile-content">
                                                                        <div class="list-tile-title">
                                                                            {{ child.props.title || 'List Tile Title' }}
                                                                        </div>
                                                                        <div v-if="child.props.subtitle"
                                                                             class="list-tile-subtitle">
                                                                            {{ child.props.subtitle }}
                                                                        </div>
                                                                    </div>
                                                                    <div v-if="child.props.trailing"
                                                                         class="list-tile-trailing">
                                                                        <span>{{ child.props.trailing }}</span>
                                                                    </div>
                                                                </div>

                                                                <!-- FloatingActionButton Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'FloatingActionButton'"
                                                                    class="flutter-fab"
                                                                    :style="{
                                                                        backgroundColor: child.props.backgroundColor || '#2196F3',
                                                                        color: child.props.foregroundColor || '#FFFFFF',
                                                                        boxShadow: `0 0 ${child.props.elevation || 6}px rgba(0,0,0,0.3)`,
                                                                        width: child.props.mini ? '40px' : '56px',
                                                                        height: child.props.mini ? '40px' : '56px',
                                                                    }"
                                                                    :title="child.props.tooltip || 'Floating Action Button'"
                                                                >
                                                                    <div class="fab-icon">
                                                                        <span>{{ child.props.child || 'Icon(Icons.add)'
                                                                            }}</span>
                                                                    </div>
                                                                </div>

                                                                <!-- Default Widget Display -->
                                                                <div v-else class="widget-properties">
                                                                    <div v-for="(value, key) in child.props" :key="key"
                                                                         class="widget-property">
                                                                        <span class="property-name">{{ key }}:</span>
                                                                        <span class="property-value">{{ value }}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Row Widget -->
                                                    <div v-else-if="element.type === 'Row'"
                                                        class="flutter-row droppable-container"
                                                        :style="{
                                                            justifyContent: 'flex-start',
                                                            alignItems: 'center',
                                                        }"
                                                        @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                        @drop.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                    >
                                                        <div
                                                            v-if="
                                                                !element.children || !Array.isArray(element.children) || element.children.length === 0
                                                            "
                                                            class="row-placeholder"
                                                        >
                                                            <div class="drop-here-indicator">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    class="h-6 w-6"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                        stroke-width="2"
                                                                        d="M9 5l7 7-7 7"
                                                                    />
                                                                </svg>
                                                                <span>Arrastra componentes aquí</span>
                                                            </div>
                                                            <div class="add-child-widget-container">
                                                                <button @click.stop="showAddChildMenu = element.id"
                                                                        class="add-child-widget-btn">
                                                                    Agregar Widget Hijo
                                                                </button>
                                                                <div v-if="showAddChildMenu === element.id"
                                                                     class="add-child-widget-menu">
                                                                    <div class="widget-category-tabs">
                                                                        <button
                                                                            v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                                                                            :key="category"
                                                                            class="widget-category-tab"
                                                                            :class="{ 'active-tab': activeAddChildCategory === index }"
                                                                            @click.stop="activeAddChildCategory = index"
                                                                        >
                                                                            {{ category }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 0">
                                                                        <button
                                                                            v-for="widget in inputWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button input-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 1">
                                                                        <button
                                                                            v-for="widget in layoutWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button layout-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 2">
                                                                        <button
                                                                            v-for="widget in displayWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button display-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-else-if="Array.isArray(element.children)"
                                                             class="row-children">
                                                            <div
                                                                class="add-child-widget-container children-container-btn">
                                                                <button @click.stop="showAddChildMenu = element.id"
                                                                        class="add-child-widget-btn">
                                                                    + Agregar Widget Hijo
                                                                </button>
                                                                <div v-if="showAddChildMenu === element.id"
                                                                     class="add-child-widget-menu">
                                                                    <div class="widget-category-tabs">
                                                                        <button
                                                                            v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                                                                            :key="category"
                                                                            class="widget-category-tab"
                                                                            :class="{ 'active-tab': activeAddChildCategory === index }"
                                                                            @click.stop="activeAddChildCategory = index"
                                                                        >
                                                                            {{ category }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 0">
                                                                        <button
                                                                            v-for="widget in inputWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button input-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 1">
                                                                        <button
                                                                            v-for="widget in layoutWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button layout-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 2">
                                                                        <button
                                                                            v-for="widget in displayWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button display-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-for="child in element.children" :key="child.id"
                                                                 class="row-child">
                                                                <!-- Text Widget -->
                                                                <div
                                                                    v-if="child.type === 'Text'"
                                                                    class="flutter-text"
                                                                    :style="{
                                                                        fontSize: '16px',
                                                                        fontWeight: 'normal',
                                                                        color: '#000000',
                                                                        textAlign: 'left',
                                                                    }"
                                                                >
                                                                    {{ child.props.data || 'Text' }}
                                                                </div>

                                                                <!-- TextField Widget -->
                                                                <div v-else-if="child.type === 'TextField'"
                                                                     class="flutter-text-field">
                                                                    <div class="text-field-label"
                                                                         v-if="child.props.decoration">Label
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter text"
                                                                        :class="{ 'text-field-obscured': child.props.obscureText === true }"
                                                                        :disabled="child.props.enabled === false"
                                                                    />
                                                                </div>

                                                                <!-- Checkbox Widget -->
                                                                <div v-else-if="child.type === 'Checkbox'"
                                                                     class="flutter-checkbox">
                                                                    <input type="checkbox"
                                                                           :checked="child.props.value === true" />
                                                                    <div
                                                                        class="checkbox-active-color"
                                                                        :style="{ backgroundColor: child.props.activeColor || '#2196F3' }"
                                                                    ></div>
                                                                </div>

                                                                <!-- DropdownButton Widget -->
                                                                <div v-else-if="child.type === 'DropdownButton'"
                                                                     class="flutter-dropdown">
                                                                    <select>
                                                                        <option
                                                                            v-for="(item, index) in child.props.items"
                                                                            :key="index"
                                                                            :selected="item === child.props.value"
                                                                        >
                                                                            {{ item }}
                                                                        </option>
                                                                    </select>
                                                                </div>

                                                                <!-- Image Widget -->
                                                                <div v-else-if="child.type === 'Image'"
                                                                     class="flutter-image">
                                                                    <img
                                                                        :src="child.props.src"
                                                                        :style="{
                                                                            width: (child.props.width || 150) + 'px',
                                                                            height: (child.props.height || 150) + 'px',
                                                                            objectFit: 'cover',
                                                                        }"
                                                                        alt="Flutter Image"
                                                                    />
                                                                </div>

                                                                <!-- Icon Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'Icon'"
                                                                    class="flutter-icon"
                                                                    :style="{
                                                                        color: child.props.color || '#000000',
                                                                        fontSize: (child.props.size || 24) + 'px',
                                                                    }"
                                                                >
                                                                    <i class="material-icons">star</i>
                                                                </div>

                                                                <!-- Default Widget Display -->
                                                                <div v-else class="widget-properties">
                                                                    <div v-for="(value, key) in child.props" :key="key"
                                                                         class="widget-property">
                                                                        <span class="property-name">{{ key }}:</span>
                                                                        <span class="property-value">{{ value }}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Column Widget -->
                                                    <div v-else-if="element.type === 'Column'"
                                                        class="flutter-column droppable-container"
                                                        :style="{
                                                            justifyContent: 'flex-start',
                                                            alignItems: 'center',
                                                        }"
                                                        @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                        @drop.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                    >
                                                        <div
                                                            v-if="
                                                                !element.children || !Array.isArray(element.children) || element.children.length === 0
                                                            "
                                                            class="column-placeholder"
                                                        >
                                                            <div class="drop-here-indicator">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    class="h-6 w-6"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                        stroke-width="2"
                                                                        d="M19 9l-7 7-7-7"
                                                                    />
                                                                </svg>
                                                                <span>Arrastra componentes aquí</span>
                                                            </div>
                                                            <div class="add-child-widget-container">
                                                                <button @click.stop="showAddChildMenu = element.id"
                                                                        class="add-child-widget-btn">
                                                                    Agregar Widget Hijo
                                                                </button>
                                                                <div v-if="showAddChildMenu === element.id"
                                                                     class="add-child-widget-menu">
                                                                    <div class="widget-category-tabs">
                                                                        <button
                                                                            v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                                                                            :key="category"
                                                                            class="widget-category-tab"
                                                                            :class="{ 'active-tab': activeAddChildCategory === index }"
                                                                            @click.stop="activeAddChildCategory = index"
                                                                        >
                                                                            {{ category }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 0">
                                                                        <button
                                                                            v-for="widget in inputWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button input-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 1">
                                                                        <button
                                                                            v-for="widget in layoutWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button layout-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 2">
                                                                        <button
                                                                            v-for="widget in displayWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button display-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-else-if="Array.isArray(element.children)"
                                                             class="column-children">
                                                            <div
                                                                class="add-child-widget-container children-container-btn">
                                                                <button @click.stop="showAddChildMenu = element.id"
                                                                        class="add-child-widget-btn">
                                                                    + Agregar Widget Hijo
                                                                </button>
                                                                <div v-if="showAddChildMenu === element.id"
                                                                     class="add-child-widget-menu">
                                                                    <div class="widget-category-tabs">
                                                                        <button
                                                                            v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                                                                            :key="category"
                                                                            class="widget-category-tab"
                                                                            :class="{ 'active-tab': activeAddChildCategory === index }"
                                                                            @click.stop="activeAddChildCategory = index"
                                                                        >
                                                                            {{ category }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 0">
                                                                        <button
                                                                            v-for="widget in inputWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button input-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 1">
                                                                        <button
                                                                            v-for="widget in layoutWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button layout-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 2">
                                                                        <button
                                                                            v-for="widget in displayWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button display-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-for="child in element.children" :key="child.id"
                                                                 class="column-child">
                                                                <!-- Text Widget -->
                                                                <div
                                                                    v-if="child.type === 'Text'"
                                                                    class="flutter-text"
                                                                    :style="{
                                                                        fontSize: '16px',
                                                                        fontWeight: 'normal',
                                                                        color: '#000000',
                                                                        textAlign: 'left',
                                                                    }"
                                                                >
                                                                    {{ child.props.data || 'Text' }}
                                                                </div>

                                                                <!-- TextField Widget -->
                                                                <div v-else-if="child.type === 'TextField'"
                                                                     class="flutter-text-field">
                                                                    <div class="text-field-label"
                                                                         v-if="child.props.decoration">Label
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter text"
                                                                        :class="{ 'text-field-obscured': child.props.obscureText === true }"
                                                                        :disabled="child.props.enabled === false"
                                                                    />
                                                                </div>

                                                                <!-- Checkbox Widget -->
                                                                <div v-else-if="child.type === 'Checkbox'"
                                                                     class="flutter-checkbox">
                                                                    <input type="checkbox"
                                                                           :checked="child.props.value === true" />
                                                                    <div
                                                                        class="checkbox-active-color"
                                                                        :style="{ backgroundColor: child.props.activeColor || '#2196F3' }"
                                                                    ></div>
                                                                </div>

                                                                <!-- DropdownButton Widget -->
                                                                <div v-else-if="child.type === 'DropdownButton'"
                                                                     class="flutter-dropdown">
                                                                    <select>
                                                                        <option
                                                                            v-for="(item, index) in child.props.items"
                                                                            :key="index"
                                                                            :selected="item === child.props.value"
                                                                        >
                                                                            {{ item }}
                                                                        </option>
                                                                    </select>
                                                                </div>

                                                                <!-- Image Widget -->
                                                                <div v-else-if="child.type === 'Image'"
                                                                     class="flutter-image">
                                                                    <img
                                                                        :src="child.props.src"
                                                                        :style="{
                                                                            width: (child.props.width || 150) + 'px',
                                                                            height: (child.props.height || 150) + 'px',
                                                                            objectFit: 'cover',
                                                                        }"
                                                                        alt="Flutter Image"
                                                                    />
                                                                </div>

                                                                <!-- Icon Widget -->
                                                                <div
                                                                    v-else-if="child.type === 'Icon'"
                                                                    class="flutter-icon"
                                                                    :style="{
                                                                        color: child.props.color || '#000000',
                                                                        fontSize: (child.props.size || 24) + 'px',
                                                                    }"
                                                                >
                                                                    <i class="material-icons">star</i>
                                                                </div>

                                                                <!-- Default Widget Display -->
                                                                <div v-else class="widget-properties">
                                                                    <div v-for="(value, key) in child.props" :key="key"
                                                                         class="widget-property">
                                                                        <span class="property-name">{{ key }}:</span>
                                                                        <span class="property-value">{{ value }}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Image Widget -->
                                                    <div v-else-if="element.type === 'Image'" class="flutter-image">
                                                        <img
                                                            :src="element.props.src"
                                                            :style="{
                                                                width: (element.props.width || 150) + 'px',
                                                                height: (element.props.height || 150) + 'px',
                                                                objectFit: 'cover',
                                                            }"
                                                            alt="Flutter Image"
                                                        />
                                                    </div>

                                                    <!-- Icon Widget -->
                                                    <div v-else-if="element.type === 'Icon'"
                                                        class="flutter-icon"
                                                        :style="{
                                                            color: element.props.color || '#000000',
                                                            fontSize: (element.props.size || 24) + 'px',
                                                        }"
                                                    >
                                                        <i class="material-icons">star</i>
                                                    </div>

                                                    <!-- Checkbox Widget -->
                                                    <div v-else-if="element.type === 'Checkbox'"
                                                         class="flutter-checkbox">
                                                        <input type="checkbox"
                                                               :checked="element.props.value === true" />
                                                        <div
                                                            class="checkbox-active-color"
                                                            :style="{ backgroundColor: element.props.activeColor || '#2196F3' }"
                                                        ></div>
                                                    </div>

                                                    <!-- DropdownButton Widget -->
                                                    <div v-else-if="element.type === 'DropdownButton'"
                                                         class="flutter-dropdown">
                                                        <select>
                                                            <option
                                                                v-for="(item, index) in element.props.items"
                                                                :key="index"
                                                                :selected="item === element.props.value"
                                                            >
                                                                {{ item }}
                                                            </option>
                                                        </select>
                                                    </div>

                                                    <!-- ScrollChildren Widget -->
                                                    <div v-else-if="element.type === 'ScrollChildren'"
                                                        class="flutter-scroll-children droppable-container"
                                                        :style="{
                                                            width: '100%',
                                                            minHeight: '200px',
                                                            maxHeight: '400px',
                                                            overflowX: element.props.scrollDirection === 'Axis.horizontal' ? 'auto' : 'hidden',
                                                            overflowY: 'auto',
                                                            padding: '8px',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                            borderRadius: '4px',
                                                        }"
                                                        @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                        @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                        @drop.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                    >
                                                        <div
                                                            v-if="
                                                                !element.children || !Array.isArray(element.children) || element.children.length === 0
                                                            "
                                                            class="scroll-placeholder"
                                                        >
                                                            <div class="drop-here-indicator">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    class="h-6 w-6"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                        stroke-width="2"
                                                                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                                    />
                                                                </svg>
                                                                <span>Arrastra componentes aquí para crear una lista desplazable</span>
                                                            </div>
                                                            <div class="add-child-widget-container">
                                                                <button @click.stop="showAddChildMenu = element.id"
                                                                        class="add-child-widget-btn">
                                                                    Agregar Widget Hijo
                                                                </button>
                                                                <div v-if="showAddChildMenu === element.id"
                                                                     class="add-child-widget-menu">
                                                                    <div class="widget-category-tabs">
                                                                        <button
                                                                            v-for="(category, index) in ['Inputs', 'Layouts', 'Display']"
                                                                            :key="category"
                                                                            class="widget-category-tab"
                                                                            :class="{ 'active-tab': activeAddChildCategory === index }"
                                                                            @click.stop="activeAddChildCategory = index"
                                                                        >
                                                                            {{ category }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 0">
                                                                        <button
                                                                            v-for="widget in inputWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button input-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 1">
                                                                        <button
                                                                            v-for="widget in layoutWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button layout-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                    <div class="widget-grid"
                                                                         v-if="activeAddChildCategory === 2">
                                                                        <button
                                                                            v-for="widget in displayWidgets"
                                                                            :key="widget.type"
                                                                            class="widget-button display-widget-btn"
                                                                            @click.stop="
                                                                                addChildWidget(element.id, widget.type);
                                                                                showAddChildMenu = null;
                                                                            "
                                                                        >
                                                                            {{ widget.label }}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- TableList Widget -->
                                                    <div v-else-if="element.type === 'TableList'"
                                                         class="flutter-table-list">
                                                        <table class="w-full border-collapse">
                                                            <thead>
                                                            <tr :style="{ backgroundColor: element.props.headerColor || '#E0E0E0' }">
                                                                <th
                                                                    v-for="(column, index) in element.props.columns"
                                                                    :key="index"
                                                                    class="p-2 text-left"
                                                                    :style="{ border: element.props.border ? '1px solid #ddd' : 'none' }"
                                                                >
                                                                    {{ column }}
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            <tr v-for="row in parseInt(element.props.rows)" :key="row">
                                                                <td
                                                                    v-for="(column, index) in element.props.columns"
                                                                    :key="index"
                                                                    class="p-2"
                                                                    :style="{ border: element.props.border ? '1px solid #ddd' : 'none' }"
                                                                >
                                                                    Cell {{ row }}-{{ index + 1 }}
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <!-- CardText Widget -->
                                                    <div v-else-if="element.type === 'CardText'"
                                                        class="flutter-card-text"
                                                        :style="{
                                                            backgroundColor: element.props.color || '#FFFFFF',
                                                            borderRadius: (element.props.borderRadius || 8) + 'px',
                                                            boxShadow: `0 ${element.props.elevation || 2}px ${(element.props.elevation || 2) * 2}px rgba(0,0,0,0.1)`,
                                                            overflow: 'hidden',
                                                            width: '100%',
                                                        }"
                                                    >
                                                        <div class="card-header border-b border-gray-200 p-3">
                                                            <h3 class="text-lg font-semibold">
                                                                {{ element.props.title || 'Card Title' }}
                                                            </h3>
                                                            <p class="text-sm text-gray-600">
                                                                {{ element.props.subtitle || 'Card Subtitle' }}
                                                            </p>
                                                        </div>
                                                        <div class="card-content p-3">
                                                            <p>
                                                                {{
                                                                    element.props.content ||
                                                                    'Card content goes here with more details about the item.'
                                                                }}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <!-- Default Widget Display -->
                                                    <div v-else class="widget-properties">
                                                        <div v-for="(value, key) in element.props" :key="key"
                                                             class="widget-property">
                                                            <span class="property-name">{{ key }}:</span>
                                                            <span class="property-value">{{ value }}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Niños anidados si los hay -->
                                                <div
                                                    v-if="element.children && Array.isArray(element.children) && element.children.length > 0"
                                                    class="widget-children"
                                                >
                                                    <h4 class="nested-widgets-title">Componentes anidados</h4>
                                                    <draggable
                                                        v-model="element.children"
                                                        group="widgets"
                                                        item-key="id"
                                                        class="nested-widgets-container"
                                                        :animation="150"
                                                        ghost-class="ghost-widget"
                                                        chosen-class="chosen-widget"
                                                    >
                                                        <template #item="{ element: child }">
                                                            <div
                                                                class="child-widget cursor-move"
                                                                :class="{
                                                                    'selected-widget': selectedWidget?.id === child.id,
                                                                    'text-child-widget': ['Text', 'h1', 'h2', 'h3'].includes(child.type),
                                                                    'input-child-widget': ['TextField', 'Checkbox', 'DropdownButton'].includes(
                                                                        child.type,
                                                                    ),
                                                                    'container-child-widget': ['Container', 'SafeArea'].includes(child.type),
                                                                    'layout-child-widget': ['Row', 'Column', 'Padding'].includes(child.type),
                                                                    'display-child-widget': ['Image', 'Icon'].includes(child.type),
                                                                }"
                                                                @click.stop="selectWidget(child)"
                                                            >
                                                                <div class="child-widget-header">
                                                                    <span class="child-widget-type">{{ child.type }}</span>
                                                                    <button @click.stop="removeWidget(child)"
                                                                            class="widget-remove-btn">×
                                                                    </button>
                                                                </div>
                                                                <div class="child-widget-preview">
                                                                    <!-- Text preview -->
                                                                    <div v-if="child.type === 'Text'"
                                                                         class="child-widget-content">
                                                                        {{ child.props.data || 'Text' }}
                                                                    </div>
                                                                    <!-- TextField preview -->
                                                                    <div v-else-if="child.type === 'TextField'"
                                                                         class="child-widget-content">
                                                                        <div class="mini-input-preview">Input Field
                                                                        </div>
                                                                    </div>
                                                                    <!-- Container preview -->
                                                                    <div
                                                                        v-else-if="['Container', 'Row', 'Column'].includes(child.type)"
                                                                        class="child-widget-content"
                                                                    >
                                                                        <div class="mini-container-preview">
                                                                            {{ child.type }}
                                                                        </div>
                                                                    </div>
                                                                    <!-- Image preview -->
                                                                    <div v-else-if="child.type === 'Image'"
                                                                         class="child-widget-content">
                                                                        <div class="mini-image-preview">Image</div>
                                                                    </div>
                                                                    <!-- Default preview -->
                                                                    <div v-else class="child-widget-content">
                                                                        {{ child.type }}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </draggable>
                                                    <div class="add-nested-widget-hint">
                                                        <span>Arrastra más componentes aquí para añadirlos</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </draggable>
                                </div>

                                <!-- Phone home button/navigation bar -->
                                <div class="phone-nav-bar">
                                    <div class="home-indicator"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Properties panel -->
                    <div v-if="selectedWidget" class="w-80 overflow-y-auto rounded-md bg-gray-100 p-4">
                        <h2 class="mb-4 text-lg font-semibold">Propiedades</h2>

                        <div class="flex flex-col gap-4">
                            <div v-for="(value, key) in selectedWidget.props" :key="key" class="flex flex-col gap-1">
                                <label class="text-sm font-medium">{{ key }}</label>

                                <!-- String input -->
                                <input
                                    v-if="
                                        typeof value === 'string' &&
                                        !(
                                            availableWidgets
                                                .find((w: any) => w.type === selectedWidget.type)
                                                ?.properties.find((p: any) => p.name === key)?.type === 'select'
                                        )
                                    "
                                    v-model="selectedWidget.props[key]"
                                    type="text"
                                    class="rounded-md border px-3 py-2"
                                    @change="updateWidgetProperty(key, selectedWidget.props[key])"
                                />

                                <!-- Number input -->
                                <input
                                    v-else-if="typeof value === 'number'"
                                    v-model.number="selectedWidget.props[key]"
                                    type="number"
                                    class="rounded-md border px-3 py-2"
                                    @change="updateWidgetProperty(key, selectedWidget.props[key])"
                                />

                                <!-- Boolean input -->
                                <div v-else-if="typeof value === 'boolean'" class="flex items-center">
                                    <input
                                        :id="key"
                                        v-model="selectedWidget.props[key]"
                                        type="checkbox"
                                        class="mr-2"
                                        @change="updateWidgetProperty(key, selectedWidget.props[key])"
                                    />
                                    <label :for="key">{{ selectedWidget.props[key] ? 'Sí' : 'No' }}</label>
                                </div>

                                <!-- Color input with @ckpack/vue-color -->
                                <div
                                    v-else-if="
                                        availableWidgets.find((w: any) => w.type === selectedWidget.type)?.properties.find((p: any) => p.name === key)
                                            ?.type === 'color'
                                    "
                                    class="flex flex-col gap-2"
                                >
                                    <ColorPicker
                                        v-model="selectedWidget.props[key]"
                                        @change="updateColorProperty(key, $event)"
                                    />
                                    <div class="grid grid-cols-3 gap-2 text-xs">
                                        <div class="rounded border p-1 dark:border-gray-600">
                                            <span class="font-semibold">HEX:</span>
                                            {{ getHexColor(selectedWidget.props[key]) }}
                                        </div>
                                        <div class="rounded border p-1 dark:border-gray-600">
                                            <span class="font-semibold">RGB:</span>
                                            {{ getRgbColor(selectedWidget.props[key]) }}
                                        </div>
                                        <div class="rounded border p-1 dark:border-gray-600">
                                            <span class="font-semibold">HSL:</span>
                                            {{ getHslColor(selectedWidget.props[key]) }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Select input -->
                                <select
                                    v-else-if="
                                        availableWidgets.find((w: any) => w.type === selectedWidget.type)?.properties.find((p: any) => p.name === key)
                                            ?.type === 'select'
                                    "
                                    v-model="selectedWidget.props[key]"
                                    class="rounded-md border px-3 py-2"
                                    @change="updateWidgetProperty(key, selectedWidget.props[key])"
                                >
                                    <option
                                        v-for="option in availableWidgets
                                            .find((w: any) => w.type === selectedWidget.type)
                                            ?.properties.find((p: any) => p.name === key)?.options"
                                        :key="option"
                                        :value="option"
                                    >
                                        {{ option }}
                                    </option>
                                </select>

                                <!-- Array input -->
                                <div v-else-if="Array.isArray(value)" class="flex flex-col gap-2">
                                    <div v-for="(item, index) in value" :key="index" class="flex gap-2">
                                        <input
                                            v-model="selectedWidget.props[key][index]"
                                            type="text"
                                            class="flex-1 rounded-md border px-3 py-2"
                                            @change="updateWidgetProperty(key, [...selectedWidget.props[key]])"
                                        />
                                        <button
                                            @click="
                                                selectedWidget.props[key].splice(index, 1);
                                                updateWidgetProperty(key, [...selectedWidget.props[key]]);
                                            "
                                            class="rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600"
                                        >
                                            -
                                        </button>
                                    </div>
                                    <button
                                        @click="
                                            selectedWidget.props[key].push('');
                                            updateWidgetProperty(key, [...selectedWidget.props[key]]);
                                        "
                                        class="rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                                    >
                                        + Agregar
                                    </button>
                                </div>

                                <!-- Default fallback -->
                                <input
                                    v-else
                                    v-model="selectedWidget.props[key]"
                                    type="text"
                                    class="rounded-md border px-3 py-2"
                                    @change="updateWidgetProperty(key, selectedWidget.props[key])"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Socket connection status -->
            <div class="flex items-center gap-2 text-sm">
                <div class="h-3 w-3 rounded-full" :class="socketConnected ? 'bg-green-500' : 'bg-red-500'"></div>
                <span>{{ socketConnected ? 'Conectado' : 'Desconectado' }}</span>
                <span v-if="socketError" class="text-red-500">Error: {{ socketError }}</span>
            </div>

            <!-- Collaborator Management Section -->
            <Colaboradores
                v-if="isCreator"
                :collaborators="collaborators"
                :online-collaborators="onlineCollaborators"
                :pizarra="props.pizarra"
            />

            <!-- Chat Buttons -->
            <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <!-- THEMES -->
                <button
                    @click="toggleDarkMode"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
                    aria-label="Toggle Socket Server"
                >
                    <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                         fill="currentColor">
                        <path
                            fill-rule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                         fill="currentColor">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                </button>
                <!-- CHANGE SOCKETS -->
                <button
                    @click="toggleSocketServer"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
                    aria-label="Toggle Socket Server"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                        <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                        <path
                            fill="#ffffff"
                            d="M54.2 202.9C123.2 136.7 216.8 96 320 96s196.8 40.7 265.8 106.9c12.8 12.2 33 11.8 45.2-.9s11.8-33-.9-45.2C549.7 79.5 440.4 32 320 32S90.3 79.5 9.8 156.7C-2.9 169-3.3 189.2 8.9 202s32.5 13.2 45.2 .9zM320 256c56.8 0 108.6 21.1 148.2 56c13.3 11.7 33.5 10.4 45.2-2.8s10.4-33.5-2.8-45.2C459.8 219.2 393 192 320 192s-139.8 27.2-190.5 72c-13.3 11.7-14.5 31.9-2.8 45.2s31.9 14.5 45.2 2.8c39.5-34.9 91.3-56 148.2-56zm64 160a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z"
                        />
                    </svg>
                </button>
                <!-- AI Chat Button -->
                <button
                    @click="toggleAIChat"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-colors hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                    :class="{ 'bg-purple-700 dark:bg-purple-800': showAIChat }"
                    aria-label="Toggle AI Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.051l.311.093c1.135.34 2.345.34 3.48 0l.312-.093a2.25 2.25 0 001.357-2.051V3.104M18 14.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-1.5a2.25 2.25 0 012.25-2.25h7.5z"
                        />
                    </svg>
                </button>

                <!-- Regular Chat Button -->
                <button
                    @click="toggleFloatingChat"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    :class="{ 'animate-pulse': !showFloatingChat, 'bg-blue-600 dark:bg-blue-700': showFloatingChat }"
                    aria-label="Toggle Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </button>
            </div>

            <!-- Floating Chat Window -->
            <ChatColaborativo
                v-if="showFloatingChat"
                :socket="socket"
                :currentUser="currentUser"
                :roomId="roomId"
                :showChat="showFloatingChat"
                @close="showFloatingChat = false"
                @send-message="handleChatMessage"
                @typing="handleTyping"
            />
            <!-- AI Chat Window -->
            <ChatAI
                :showAIChat="showAIChat"
                :aiMessages="aiMessages"
                :aiPrompt="aiPrompt"
                :isProcessingAI="isProcessingAI"
                @toggleAIChat="toggleAIChat"
                @sendAIPrompt="sendAIPrompt"
                @onAIPromptInput="onChatInputAI"
                @addAIWidgetsToCanvas="addAIWidgetsToCanvas"
                @update:aiPrompt="(value) => (aiPrompt = value)"
                @update:isProcessingAI="(value) => (isProcessingAI = value)"
            />
        </div>
    </AppLayout>
</template>
