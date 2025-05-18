<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { ref, onMounted, onUnmounted, computed, watch, reactive, defineProps } from 'vue';
import draggable from 'vuedraggable';
import { io } from 'socket.io-client';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getSocketConfig, toggleSocketEnvironment } from '@/lib/socketConfig';
import type { BreadcrumbItem } from '@/types';
import type { FlutterWidget, FlutterWidgetDefinition } from '@/types/PizarraFlutter';

// Props
const props = defineProps({
    user: {
        type: Object,
        required: true,
    },
    pizarraFlutter: {
        type: Object,
        default: null,
    },
    creador: {
        type: Object,
        default: null,
    },
    isCreador: {
        type: Boolean,
        default: false,
    },
    colaboradores: {
        type: Array,
        default: () => [],
    },
});

// Breadcrumbs for navigation
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pizarra Flutter',
        href: '/pizarra-flutter',
    },
];

// Socket.io connection
const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
const socketConfig = ref(getSocketConfig(useLocalSocket.value));
const socket = io(socketConfig.value.url, socketConfig.value.options);
const socketConnected = ref(false);
const socketError = ref('');
const roomId = ref(props.pizarraFlutter ? `flutter-room-${props.pizarraFlutter.id}` : 'flutter-room-1');
const currentUser = ref(props.user?.name || 'Usuario');
const user_id = ref(props.user?.id);

// Collaborator management
const collaborators = ref(props.colaboradores || []);
const onlineCollaborators = ref([]);
const isCreator = ref(props.isCreador);

// Invitation system
const inviteEmail = ref('');
const showInviteForm = ref(false);
const showInviteLink = ref(false);
const inviteLink = ref('');

// Floating chat
const showFloatingChat = ref(false);
const chatMessages = ref([]);
const chatMessage = ref('');
const chatTyping = reactive({
    typing: '',
    timeout: null,
});

// AI chat
const showAIChat = ref(false);
const aiMessages = ref([]);
const aiPrompt = ref('');
const isProcessingAI = ref(false);

// Only show chat for collaborators, not for the creator
const showChatButton = computed(() => !isCreator.value || collaborators.value.length > 0);

// Function to toggle between local and production socket servers
const toggleSocketServer = () => {
    // Disconnect current socket
    socket.disconnect();

    // Toggle socket environment
    useLocalSocket.value = !useLocalSocket.value;
    socketConfig.value = toggleSocketEnvironment(useLocalSocket.value);

    // Reconnect with new configuration
    socket.io.opts.hostname = socketConfig.value.url;
    socket.io.opts.port = '';
    socket.io.opts.secure = socketConfig.value.url.startsWith('https');
    socket.connect();

    // Show notification
    Swal.fire({
        title: 'Servidor Socket Cambiado',
        text: `Ahora usando servidor socket ${useLocalSocket.value ? 'local' : 'de producción'}: ${socketConfig.value.url}`,
        icon: 'info',
        timer: 3000,
        showConfirmButton: false,
    });
};

// Counter for generating unique widget IDs
let widgetIdCounter = 1;

// Project name ref
const projectName = ref(props.pizarraFlutter?.name || 'Nueva Pizarra Flutter');

// Flutter widgets on the canvas
// Initialize with a properly computed value
const getInitialFlutterWidgets = (): FlutterWidget[] => {
    let widgets = [];

    if (!props.pizarraFlutter?.elements) {
        return [];
    }

    if (Array.isArray(props.pizarraFlutter.elements)) {
        widgets = props.pizarraFlutter.elements;
    } else {
        try {
            widgets = JSON.parse(props.pizarraFlutter.elements || '[]');
        } catch (error) {
            console.error('Error parsing pizarra elements:', error);
            return [];
        }
    }

    // Ensure all widgets have unique IDs
    const addIdsToWidgets = (widgetList) => {
        return widgetList.map(widget => {
            // Add ID if not present
            if (!widget.id) {
                widget.id = `widget-${widgetIdCounter++}`;
            }

            // Process children recursively if they exist
            if (widget.children && Array.isArray(widget.children)) {
                widget.children = addIdsToWidgets(widget.children);
            }

            return widget;
        });
    };

    return addIdsToWidgets(widgets);
};

const flutterWidgets = ref<FlutterWidget[]>(getInitialFlutterWidgets());

// Selected widget for editing
const selectedWidget = ref<FlutterWidget | null>(null);

// Available Flutter widgets
const availableWidgets = ref<FlutterWidgetDefinition[]>([
    // Input widgets
    {
        type: 'TextField',
        category: 'input',
        label: 'Text Field',
        properties: [
            { name: 'decoration', type: 'string', defaultValue: 'InputDecoration(labelText: "Label")' },
            { name: 'controller', type: 'string', defaultValue: 'TextEditingController()' },
            { name: 'keyboardType', type: 'select', defaultValue: 'TextInputType.text', options: ['TextInputType.text', 'TextInputType.number', 'TextInputType.email', 'TextInputType.phone'] },
            { name: 'obscureText', type: 'boolean', defaultValue: false },
        ],
        hasChildren: false,
    },
    {
        type: 'Checkbox',
        category: 'input',
        label: 'Checkbox',
        properties: [
            { name: 'value', type: 'boolean', defaultValue: false },
            { name: 'onChanged', type: 'string', defaultValue: '(value) {}' },
            { name: 'activeColor', type: 'color', defaultValue: '#2196F3' },
        ],
        hasChildren: false,
    },
    {
        type: 'DropdownButton',
        category: 'input',
        label: 'Dropdown',
        properties: [
            { name: 'value', type: 'string', defaultValue: 'Option 1' },
            { name: 'items', type: 'array', defaultValue: ['Option 1', 'Option 2', 'Option 3'] },
            { name: 'onChanged', type: 'string', defaultValue: '(value) {}' },
        ],
        hasChildren: false,
    },
    // Layout widgets
    {
        type: 'Container',
        category: 'container',
        label: 'Container',
        properties: [
            { name: 'width', type: 'number', defaultValue: 200 },
            { name: 'height', type: 'number', defaultValue: 200 },
            { name: 'color', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(16.0)' },
            { name: 'margin', type: 'string', defaultValue: 'EdgeInsets.all(8.0)' },
            { name: 'alignment', type: 'select', defaultValue: 'Alignment.center', options: ['Alignment.center', 'Alignment.topLeft', 'Alignment.topRight', 'Alignment.bottomLeft', 'Alignment.bottomRight'] },
        ],
        hasChildren: true,
    },
    {
        type: 'Row',
        category: 'layout',
        label: 'Row',
        properties: [
            { name: 'mainAxisAlignment', type: 'select', defaultValue: 'MainAxisAlignment.start', options: ['MainAxisAlignment.start', 'MainAxisAlignment.center', 'MainAxisAlignment.end', 'MainAxisAlignment.spaceBetween', 'MainAxisAlignment.spaceAround', 'MainAxisAlignment.spaceEvenly'] },
            { name: 'crossAxisAlignment', type: 'select', defaultValue: 'CrossAxisAlignment.center', options: ['CrossAxisAlignment.start', 'CrossAxisAlignment.center', 'CrossAxisAlignment.end', 'CrossAxisAlignment.stretch', 'CrossAxisAlignment.baseline'] },
        ],
        hasChildren: true,
    },
    {
        type: 'Column',
        category: 'layout',
        label: 'Column',
        properties: [
            { name: 'mainAxisAlignment', type: 'select', defaultValue: 'MainAxisAlignment.start', options: ['MainAxisAlignment.start', 'MainAxisAlignment.center', 'MainAxisAlignment.end', 'MainAxisAlignment.spaceBetween', 'MainAxisAlignment.spaceAround', 'MainAxisAlignment.spaceEvenly'] },
            { name: 'crossAxisAlignment', type: 'select', defaultValue: 'CrossAxisAlignment.center', options: ['CrossAxisAlignment.start', 'CrossAxisAlignment.center', 'CrossAxisAlignment.end', 'CrossAxisAlignment.stretch', 'CrossAxisAlignment.baseline'] },
        ],
        hasChildren: true,
    },
    {
        type: 'Padding',
        category: 'layout',
        label: 'Padding',
        properties: [
            { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(16.0)' },
        ],
        hasChildren: true,
    },
    {
        type: 'SafeArea',
        category: 'layout',
        label: 'SafeArea',
        properties: [
            { name: 'top', type: 'boolean', defaultValue: true },
            { name: 'bottom', type: 'boolean', defaultValue: true },
            { name: 'left', type: 'boolean', defaultValue: true },
            { name: 'right', type: 'boolean', defaultValue: true },
        ],
        hasChildren: true,
    },
    // Display widgets
    {
        type: 'Text',
        category: 'display',
        label: 'Text',
        properties: [
            { name: 'data', type: 'string', defaultValue: 'Hello World' },
            { name: 'style', type: 'string', defaultValue: 'TextStyle(fontSize: 16.0)' },
            { name: 'textAlign', type: 'select', defaultValue: 'TextAlign.left', options: ['TextAlign.left', 'TextAlign.center', 'TextAlign.right', 'TextAlign.justify'] },
        ],
        hasChildren: false,
    },
    {
        type: 'Image',
        category: 'display',
        label: 'Image',
        properties: [
            { name: 'src', type: 'string', defaultValue: 'https://via.placeholder.com/150' },
            { name: 'width', type: 'number', defaultValue: 150 },
            { name: 'height', type: 'number', defaultValue: 150 },
            { name: 'fit', type: 'select', defaultValue: 'BoxFit.cover', options: ['BoxFit.cover', 'BoxFit.contain', 'BoxFit.fill', 'BoxFit.fitWidth', 'BoxFit.fitHeight', 'BoxFit.none', 'BoxFit.scaleDown'] },
        ],
        hasChildren: false,
    },
    {
        type: 'Icon',
        category: 'display',
        label: 'Icon',
        properties: [
            { name: 'icon', type: 'string', defaultValue: 'Icons.star' },
            { name: 'size', type: 'number', defaultValue: 24 },
            { name: 'color', type: 'color', defaultValue: '#000000' },
        ],
        hasChildren: false,
    },
    {
        type: 'ScrollChildren',
        category: 'layout',
        label: 'Scroll Children',
        properties: [
            { name: 'scrollDirection', type: 'select', defaultValue: 'Axis.vertical', options: ['Axis.vertical', 'Axis.horizontal'] },
            { name: 'padding', type: 'string', defaultValue: 'EdgeInsets.all(8.0)' },
            { name: 'physics', type: 'select', defaultValue: 'ClampingScrollPhysics()', options: ['ClampingScrollPhysics()', 'BouncingScrollPhysics()', 'AlwaysScrollableScrollPhysics()'] },
        ],
        hasChildren: true,
    },
    {
        type: 'TableList',
        category: 'display',
        label: 'Table List',
        properties: [
            { name: 'columns', type: 'array', defaultValue: ['Column 1', 'Column 2', 'Column 3'] },
            { name: 'rows', type: 'number', defaultValue: 3 },
            { name: 'border', type: 'boolean', defaultValue: true },
            { name: 'headerColor', type: 'color', defaultValue: '#E0E0E0' },
        ],
        hasChildren: false,
    },
    {
        type: 'CardText',
        category: 'display',
        label: 'Card Text',
        properties: [
            { name: 'title', type: 'string', defaultValue: 'Card Title' },
            { name: 'subtitle', type: 'string', defaultValue: 'Card Subtitle' },
            { name: 'content', type: 'string', defaultValue: 'Card content goes here with more details about the item.' },
            { name: 'elevation', type: 'number', defaultValue: 2 },
            { name: 'color', type: 'color', defaultValue: '#FFFFFF' },
            { name: 'borderRadius', type: 'number', defaultValue: 8 },
        ],
        hasChildren: false,
    },
]);

// Function to add a widget to the canvas
const addWidget = (widgetType: string) => {
    const widgetDefinition = availableWidgets.value.find(w => w.type === widgetType);

    if (!widgetDefinition) return;

    const newWidget: FlutterWidget = {
        id: `widget-${widgetIdCounter++}`,
        type: widgetDefinition.type,
        props: {},
        children: widgetDefinition.hasChildren ? [] : undefined,
    };

    // Initialize properties with default values
    widgetDefinition.properties.forEach(prop => {
        newWidget.props[prop.name] = prop.defaultValue;
    });

    flutterWidgets.value.push(newWidget);

    // Emit widget added event to socket
    socket.emit('flutter-widget-added', {
        roomId: roomId.value,
        widget: newWidget,
        userId: currentUser.value,
    });
};

// Function to select a widget for editing
const selectWidget = (widget: FlutterWidget) => {
    selectedWidget.value = widget;
};

// Function to update a widget property
const updateWidgetProperty = (propertyName: string, value: any) => {
    if (!selectedWidget.value) return;

    selectedWidget.value.props[propertyName] = value;

    // Emit widget updated event to socket
    socket.emit('flutter-widget-updated', {
        roomId: roomId.value,
        widget: selectedWidget.value,
        userId: currentUser.value,
    });
};

// Function to remove a widget from the canvas
const removeWidget = (widget: FlutterWidget) => {
    const index = flutterWidgets.value.indexOf(widget);
    if (index !== -1) {
        flutterWidgets.value.splice(index, 1);

        // Emit widget removed event to socket
        socket.emit('flutter-widget-removed', {
            roomId: roomId.value,
            widgetIndex: index,
            userId: currentUser.value,
        });

        // Clear selection if the removed widget was selected
        if (selectedWidget.value === widget) {
            selectedWidget.value = null;
        }
    }
};

// Function to generate Flutter code
const generateFlutterCode = () => {
    let flutterCode = '';

    const generateWidgetCode = (widget: FlutterWidget, indent: string = ''): string => {
        let code = `${indent}${widget.type}(\n`;

        // Add properties
        Object.entries(widget.props).forEach(([key, value]) => {
            if (typeof value === 'string' && !value.includes('(')) {
                code += `${indent}  ${key}: '${value}',\n`;
            } else {
                code += `${indent}  ${key}: ${value},\n`;
            }
        });

        // Add children if any
        if (widget.children && widget.children.length > 0) {
            code += `${indent}  children: [\n`;
            widget.children.forEach(child => {
                code += generateWidgetCode(child, `${indent}    `) + ',\n';
            });
            code += `${indent}  ],\n`;
        }

        code += `${indent})`;
        return code;
    };

    // Generate code for each widget
    flutterWidgets.value.forEach(widget => {
        flutterCode += generateWidgetCode(widget) + '\n\n';
    });

    return flutterCode;
};

// Socket event handlers
onMounted(() => {
    // Connect to socket
    socket.connect();

    // Join room
    const joinRoomData = {
        roomId: roomId.value,
        userId: currentUser.value,
        user: currentUser.value
    };

    // Only add formBuilderId if it exists and is not undefined
    if (props.pizarraFlutter && props.pizarraFlutter.id) {
        joinRoomData.formBuilderId = props.pizarraFlutter.id;
    }

    socket.emit('joinRoom', joinRoomData);

    // Listen for socket events
    socket.on('connect', () => {
        socketConnected.value = true;
        console.log(`Connected to socket server: ${socketConfig.value.url}`);
    });

    socket.on('disconnect', () => {
        socketConnected.value = false;
        console.log('Disconnected from socket server');
    });

    socket.on('connect_error', (error) => {
        socketError.value = error.message;
        console.error(`Socket connection error: ${error.message}`);
        console.error(`Socket URL: ${socketConfig.value.url}`);
    });

    socket.on('flutter-widget-added', (data) => {
        if (data.userId !== currentUser.value) {
            flutterWidgets.value.push(data.widget);
        }
    });

    socket.on('flutter-widget-updated', (data) => {
        if (data.userId !== currentUser.value) {
            const index = flutterWidgets.value.findIndex(w => w === data.widget);
            if (index !== -1) {
                flutterWidgets.value[index] = data.widget;
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
            if (!collaborators.value.some(c => c.name === data.user || c.email === data.user)) {
                collaborators.value.push({ name: data.user, email: data.user });
            }
        }
    });

    socket.on('userLeft', (data) => {
        if (data.user !== currentUser.value) {
            // Remove user from collaborators
            const index = collaborators.value.findIndex(c => c.name === data.user || c.email === data.user);
            if (index !== -1) {
                collaborators.value.splice(index, 1);
            }
        }
    });

    socket.on('roomUsers', (data) => {
        // Update online collaborators list
        onlineCollaborators.value = data.users.filter(user => user !== props.user.name);
    });

    // Listen for chat messages
    socket.on('chatMessage', (data) => {
        console.log('Received chat message:', data);

        // Add message to chat if from another user
        if (data.user !== currentUser.value) {
            chatMessages.value.push({
                text: data.text,
                user: data.user,
                timestamp: data.timestamp,
            });

            // Show notification if chat is not open
            if (!showFloatingChat.value) {
                Swal.fire({
                    title: `Mensaje de ${data.user}`,
                    text: data.text,
                    icon: 'info',
                    timer: 3000,
                    showConfirmButton: false,
                });
            }
        }
    });

    // Listen for typing events
    socket.on('typing', (data) => {
        if (data.user !== currentUser.value) {
            chatTyping.typing = data.user + ' está escribiendo...';

            // Clear typing message after 2 seconds
            if (chatTyping.timeout) clearTimeout(chatTyping.timeout);
            chatTyping.timeout = setTimeout(() => {
                chatTyping.typing = '';
            }, 2000);
        }
    });

    // Listen for collaborator acceptance events
    socket.on('collaboratorAccepted', (data) => {
        Swal.fire({
            title: 'Colaborador Aceptado',
            text: `${data.user} ha aceptado tu invitación`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
        });

        // Reload the collaborators list to get the updated list
        loadCollaborators();
    });

    // Load collaborators and chat messages if we have a form ID
    if (props.pizarraFlutter?.id) {
        loadCollaborators();
    }
});

onUnmounted(() => {
    // Disconnect from socket
    socket.disconnect();

    // Clear all socket listeners
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('flutter-widget-added');
    socket.off('flutter-widget-updated');
    socket.off('flutter-widget-removed');
    socket.off('userJoined');
    socket.off('userLeft');
    socket.off('roomUsers');
    socket.off('chatMessage');
    socket.off('typing');
    socket.off('collaboratorAccepted');
});

// Computed properties for filtering widgets by category
const inputWidgets = computed(() =>
    availableWidgets.value.filter(widget => widget.category === 'input')
);

const layoutWidgets = computed(() =>
    availableWidgets.value.filter(widget => widget.category === 'layout')
);

const containerWidgets = computed(() =>
    availableWidgets.value.filter(widget => widget.category === 'container')
);

const displayWidgets = computed(() =>
    availableWidgets.value.filter(widget => widget.category === 'display')
);

// Flutter code display
const showFlutterCode = ref(false);
const flutterCode = computed(() => generateFlutterCode());

// Active widget category for mobile selector
const activeWidgetCategory = ref(0);

// Flutter widget rendering helper comment
// These functions were removed as they are no longer needed
// The widget rendering has been simplified to use static values

// Copy Flutter code to clipboard
const copyFlutterCode = () => {
    navigator.clipboard.writeText(flutterCode.value);
    Swal.fire({
        title: 'Código Copiado',
        text: 'El código Flutter ha sido copiado al portapapeles',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
    });
};

// Save changes to the pizarraFlutter
const savePizarraFlutter = async () => {
    if (!props.pizarraFlutter || !props.pizarraFlutter.id) return;

    try {
        // Ensure ID is a valid number
        const id = parseInt(props.pizarraFlutter.id);
        if (isNaN(id)) {
            console.error('Invalid pizarra ID:', props.pizarraFlutter.id);
            Swal.fire({
                title: 'Error',
                text: 'ID de pizarra inválido',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
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

        await axios.put(`/pizarra-flutter/${id}`, {
            name: projectName.value,
            elements: flutterWidgets.value, // Send as array, not as JSON string
        });

        Swal.fire({
            title: 'Guardado',
            text: 'Los cambios han sido guardados correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });
    } catch (error) {
        console.error('Error saving pizarra flutter:', error);
        Swal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error al guardar los cambios',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false,
        });
    }
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

// Debounced save function
const debouncedSave = debounce(() => {
    if (props.pizarraFlutter && props.isCreador && props.pizarraFlutter.id) {
        savePizarraFlutter();
    }
}, 1000); // 1 second debounce

// Watch for changes in flutterWidgets and save them
watch(flutterWidgets, () => {
    debouncedSave();
}, { deep: true, flush: 'post' });

// Create a new pizarraFlutter
const createNewPizarra = async () => {
    try {
        // Prompt for project name
        const { value: newName } = await Swal.fire({
            title: 'Nombre del Proyecto',
            input: 'text',
            inputLabel: 'Por favor ingrese un nombre para el proyecto',
            inputValue: projectName.value,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return 'El nombre del proyecto es requerido';
                }
            }
        });

        if (!newName) return; // User cancelled
        projectName.value = newName;

        const response = await axios.post('/pizarra-flutter', {
            name: projectName.value,
            elements: flutterWidgets.value, // Send as array, not as JSON string
        });

        // Redirect to the new pizarraFlutter
        if (response.data && response.data.id) {
            window.location.href = `/pizarra-flutter/${response.data.id}`;
        } else {
            console.error('No ID returned from server');
            Swal.fire({
                title: 'Error',
                text: 'No se pudo obtener el ID de la nueva pizarra',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
        }
    } catch (error) {
        console.error('Error creating pizarra flutter:', error);
        Swal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error al crear la pizarra',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false,
        });
    }
};

// Load collaborators
const loadCollaborators = async () => {
    if (!props.pizarraFlutter?.id) return;

    try {
        const response = await axios.get(`/pizarra-flutter/${props.pizarraFlutter.id}/collaborators`);
        // Add showActivities property to each collaborator for UI toggle
        collaborators.value = response.data.map((collaborator) => ({
            ...collaborator,
            showActivities: false,
        }));
    } catch (error) {
        console.error('Error loading collaborators:', error);
    }
};

// Invite a collaborator
const inviteCollaborator = async () => {
    if (!props.pizarraFlutter?.id || !inviteEmail.value) return;

    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail.value)) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor ingresa un correo electrónico válido',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        await axios.post(`/pizarra-flutter/${props.pizarraFlutter.id}/invite`, {
            email: inviteEmail.value,
        });

        Swal.fire({
            title: 'Invitación Enviada',
            text: `Invitación enviada a ${inviteEmail.value}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });

        inviteEmail.value = '';
        showInviteForm.value = false;
        loadCollaborators();
    } catch (error) {
        console.error('Error inviting collaborator:', error);
        Swal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error al enviar la invitación',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false,
        });
    }
};

// Generate invite link
const generateInviteLink = () => {
    showInviteLink.value = !showInviteLink.value;
    inviteLink.value = `${window.location.origin}/pizarra-flutter/${props.pizarraFlutter.id}/invite`;
};

// Copy text to clipboard
const copyToClipboard = (text, successMessage) => {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
            title: 'Copiado',
            text: successMessage,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo copiar al portapapeles',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false,
        });
    });
};

// Copy invite link to clipboard
const copyInviteLink = () => {
    copyToClipboard(inviteLink.value, '¡Enlace copiado al portapapeles!');
};

// Toggle floating chat visibility
const toggleFloatingChat = () => {
    showFloatingChat.value = !showFloatingChat.value;

    // Close AI chat if opening regular chat
    if (showFloatingChat.value) {
        showAIChat.value = false;
    }

    // If opening the chat and we have a form ID, load messages
    if (showFloatingChat.value && props.pizarraFlutter?.id) {
        loadChatMessages();
    }
};

// Toggle AI chat visibility
const toggleAIChat = () => {
    showAIChat.value = !showAIChat.value;

    // Close regular chat if opening AI chat
    if (showAIChat.value) {
        showFloatingChat.value = false;
    }
};

// Load chat messages for the current form
const loadChatMessages = async () => {
    if (!props.pizarraFlutter?.id) return;

    try {
        const response = await axios.get(`/chat/form/${props.pizarraFlutter.id}/messages`);

        // Format messages from the database
        const dbMessages = response.data.map(msg => ({
            text: msg.message,
            user: msg.user_name || msg.user_email || 'Usuario',
            timestamp: new Date(msg.created_at).getTime(),
        }));

        chatMessages.value = dbMessages;
    } catch (error) {
        console.error('Error loading chat messages:', error);
        Swal.fire({
            title: 'Error',
            text: 'No tienes acceso al chat de este formulario.',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false,
        });
    }
};

// Send a chat message
const sendChatMessage = async () => {
    if (chatMessage.value.trim()) {
        // Prepare message data
        const messageData = {
            roomId: roomId.value,
            text: chatMessage.value,
            user: currentUser.value,
            userId: user_id.value,
            timestamp: Date.now(),
        };

        // Emit message to socket
        socket.emit('chatMessage', messageData);

        // Add message to local chat
        chatMessages.value.push({
            text: chatMessage.value,
            user: currentUser.value,
            timestamp: Date.now(),
        });

        // Save message to database
        try {
            await axios.post('/chat/message', {
                form_id: props.pizarraFlutter?.id,
                message: chatMessage.value,
                user_id: user_id.value,
            });
        } catch (error) {
            console.error('Error saving chat message:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar el mensaje',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
        }

        // Clear input
        chatMessage.value = '';
    }
};

// Send a prompt to the AI
const sendAIPrompt = async () => {
    if (!aiPrompt.value.trim() || isProcessingAI.value) return;

    // Add user message to chat
    aiMessages.value.push({
        text: aiPrompt.value,
        isUser: true,
        timestamp: Date.now(),
    });

    // Store the prompt
    const prompt = aiPrompt.value;

    // Clear input and set processing state
    aiPrompt.value = '';
    isProcessingAI.value = true;

    try {
        // Send prompt to AI service
        const response = await axios.post('/ai/generate-flutter-ui', {
            prompt: prompt,
        });

        if (response.data.success) {
            // Add AI response to chat
            aiMessages.value.push({
                text: 'He generado los widgets solicitados. Puedes añadirlos a la pizarra haciendo clic en el botón de abajo.',
                isUser: false,
                timestamp: Date.now(),
                widgets: response.data.widgets,
                rawCode: response.data.rawCode,
            });

            // Log the raw code for debugging
            console.log('AI generated code:', response.data.rawCode);
        } else {
            // Add error message to chat
            aiMessages.value.push({
                text: `Lo siento, no pude generar los widgets. Error: ${response.data.message || 'Desconocido'}`,
                isUser: false,
                timestamp: Date.now(),
            });
        }
    } catch (error) {
        console.error('Error generating Flutter UI:', error);

        // Add error message to chat
        aiMessages.value.push({
            text: `Lo siento, ocurrió un error al comunicarse con el servicio de IA: ${error.message || 'Error desconocido'}`,
            isUser: false,
            timestamp: Date.now(),
        });

        Swal.fire({
            title: 'Error',
            text: 'No se pudo generar la interfaz de Flutter',
            icon: 'error',
            timer: 3000,
            showConfirmButton: false,
        });
    } finally {
        isProcessingAI.value = false;
    }
};

// Add AI-generated widgets to the canvas
const addAIWidgetsToCanvas = (widgets) => {
    if (!widgets || !Array.isArray(widgets) || widgets.length === 0) {
        Swal.fire({
            title: 'Error',
            text: 'No hay widgets para añadir a la pizarra',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false,
        });
        return;
    }

    try {
        // Add each widget to the canvas
        widgets.forEach(widget => {
            // Ensure the widget has a unique ID
            if (!widget.id) {
                widget.id = `widget-${widgetIdCounter++}`;
            }

            // Add the widget to the canvas
            flutterWidgets.value.push(widget);
        });

        // Show success message
        Swal.fire({
            title: 'Éxito',
            text: `${widgets.length} widgets añadidos a la pizarra`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });

        // Emit widget added event to socket for each widget
        widgets.forEach(widget => {
            socket.emit('flutter-widget-added', {
                roomId: roomId.value,
                widget: widget,
                userId: currentUser.value,
            });
        });
    } catch (error) {
        console.error('Error adding widgets to canvas:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron añadir los widgets a la pizarra',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false,
        });
    }
};

// Handle typing in the chat input
const onChatInput = () => {
    // Emit typing event
    socket.emit('typing', {
        roomId: roomId.value,
        user: currentUser.value,
    });
};
</script>

<template>
    <Head title="Pizarra Flutter" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <h1 class="text-2xl font-bold">Pizarra Flutter</h1>
                    <div class="flex items-center">
                        <input
                            v-model="projectName"
                            type="text"
                            placeholder="Nombre del proyecto"
                            class="px-3 py-2 border rounded-md"
                            @keyup.enter="savePizarraFlutter"
                        />
                    </div>
                </div>
                <div class="flex gap-2">
                    <button
                        @click="toggleSocketServer"
                        class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Cambiar Servidor Socket ({{ useLocalSocket ? 'Local' : 'Producción' }})
                    </button>
                    <button
                        @click="showFlutterCode = !showFlutterCode"
                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        {{ showFlutterCode ? 'Ocultar Código' : 'Mostrar Código' }}
                    </button>
                    <button
                        v-if="!props.pizarraFlutter"
                        @click="createNewPizarra"
                        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                        Guardar Pizarra
                    </button>
                    <button
                        v-else
                        @click="savePizarraFlutter"
                        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <!-- Mobile widget selector (visible on small screens) -->
            <div class="md:hidden mb-4">
                <div class="mobile-widget-selector">
                    <h2 class="widget-selector-title">Flutter Widgets</h2>

                    <!-- Widget category tabs -->
                    <div class="widget-category-tabs">
                        <button
                            v-for="(category, index) in ['Inputs', 'Layouts', 'Containers', 'Display']"
                            :key="category"
                            class="widget-category-tab"
                            :class="{ 'active-tab': activeWidgetCategory === index }"
                            @click="activeWidgetCategory = index"
                        >
                            {{ category }}
                        </button>
                    </div>

                    <!-- Widget grid for each category -->
                    <div class="widget-grid" v-if="activeWidgetCategory === 0">
                        <button
                            v-for="widget in inputWidgets"
                            :key="widget.type"
                            class="widget-button input-widget-btn"
                            @click="addWidget(widget.type)"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                </svg>
                            </span>
                            <span class="widget-label">{{ widget.label }}</span>
                        </button>
                    </div>

                    <div class="widget-grid" v-if="activeWidgetCategory === 1">
                        <button
                            v-for="widget in layoutWidgets"
                            :key="widget.type"
                            class="widget-button layout-widget-btn"
                            @click="addWidget(widget.type)"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </span>
                            <span class="widget-label">{{ widget.label }}</span>
                        </button>
                    </div>

                    <div class="widget-grid" v-if="activeWidgetCategory === 2">
                        <button
                            v-for="widget in containerWidgets"
                            :key="widget.type"
                            class="widget-button container-widget-btn"
                            @click="addWidget(widget.type)"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                            </span>
                            <span class="widget-label">{{ widget.label }}</span>
                        </button>
                    </div>

                    <div class="widget-grid" v-if="activeWidgetCategory === 3">
                        <button
                            v-for="widget in displayWidgets"
                            :key="widget.type"
                            class="widget-button display-widget-btn"
                            @click="addWidget(widget.type)"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                </svg>
                            </span>
                            <span class="widget-label">{{ widget.label }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-4 h-full">
                <!-- Widget palette (desktop version with mobile-like style) -->
                <div class="hidden md:block w-64 bg-gray-100 rounded-md overflow-hidden">
                    <div class="mobile-widget-selector desktop-widget-selector">
                        <h2 class="widget-selector-title">Flutter Widgets</h2>

                        <!-- Widget category tabs -->
                        <div class="widget-category-tabs">
                            <button
                                v-for="(category, index) in ['Inputs', 'Layouts', 'Containers', 'Display']"
                                :key="category"
                                class="widget-category-tab"
                                :class="{ 'active-tab': activeWidgetCategory === index }"
                                @click="activeWidgetCategory = index"
                            >
                                {{ category }}
                            </button>
                        </div>

                        <!-- Widget grid for each category -->
                        <div class="widget-grid" v-if="activeWidgetCategory === 0">
                            <button
                                v-for="widget in inputWidgets"
                                :key="widget.type"
                                class="widget-button input-widget-btn"
                                @click="addWidget(widget.type)"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span class="widget-label">{{ widget.label }}</span>
                            </button>
                        </div>

                        <div class="widget-grid" v-if="activeWidgetCategory === 1">
                            <button
                                v-for="widget in layoutWidgets"
                                :key="widget.type"
                                class="widget-button layout-widget-btn"
                                @click="addWidget(widget.type)"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </span>
                                <span class="widget-label">{{ widget.label }}</span>
                            </button>
                        </div>

                        <div class="widget-grid" v-if="activeWidgetCategory === 2">
                            <button
                                v-for="widget in containerWidgets"
                                :key="widget.type"
                                class="widget-button container-widget-btn"
                                @click="addWidget(widget.type)"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                    </svg>
                                </span>
                                <span class="widget-label">{{ widget.label }}</span>
                            </button>
                        </div>

                        <div class="widget-grid" v-if="activeWidgetCategory === 3">
                            <button
                                v-for="widget in displayWidgets"
                                :key="widget.type"
                                class="widget-button display-widget-btn"
                                @click="addWidget(widget.type)"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span class="widget-label">{{ widget.label }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Canvas with Mobile Phone Frame -->
                <div class="flex-1 flex flex-col gap-4">
                    <!-- Mobile phone frame container -->
                    <div class="flex justify-center items-start">
                        <div class="mobile-phone-frame">
                            <!-- Phone status bar -->
                            <div class="phone-status-bar">
                                <div class="flex justify-between items-center px-4 py-1">
                                    <span class="text-xs">9:41 AM</span>
                                    <div class="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2a2 2 0 012 2v3a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-2a4 4 0 00-4-4h-3V6a1 1 0 00-1-1H3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <!-- Phone content area (draggable canvas) -->
                            <div class="phone-content-area">
                                <draggable
                                    v-model="flutterWidgets"
                                    group="widgets"
                                    item-key="id"
                                    class="min-h-full w-full"
                                    :animation="150"
                                    ghost-class="ghost-widget"
                                    chosen-class="chosen-widget"
                                >
                                    <template #item="{ element }">
                                        <div
                                            class="mobile-widget cursor-move relative"
                                            :class="{
                                                'selected-widget': selectedWidget === element,
                                                'text-widget': ['Text', 'h1', 'h2', 'h3'].includes(element.type),
                                                'input-widget': ['TextField', 'Checkbox', 'DropdownButton'].includes(element.type),
                                                'container-widget': ['Container', 'SafeArea'].includes(element.type),
                                                'layout-widget': ['Row', 'Column', 'Padding'].includes(element.type),
                                                'display-widget': ['Image', 'Icon'].includes(element.type)
                                            }"
                                            @click.stop="selectWidget(element)"
                                        >
                                            <div class="widget-header">
                                                <span class="widget-type">{{ element.type }}</span>
                                                <button
                                                    @click.stop="removeWidget(element)"
                                                    class="widget-remove-btn"
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <!-- Realistic Flutter Widget Rendering -->
                                            <div class="flutter-widget-preview">
                                                <!-- Text Widget -->
                                                <div v-if="element.type === 'Text'" class="flutter-text"
                                                    :style="{
                                                        fontSize: '16px',
                                                        fontWeight: 'normal',
                                                        color: '#000000',
                                                        textAlign: 'left'
                                                    }">
                                                    {{ element.props.data || 'Text' }}
                                                </div>

                                                <!-- TextField Widget -->
                                                <div v-else-if="element.type === 'TextField'" class="flutter-text-field">
                                                    <div class="text-field-label" v-if="element.props.decoration">
                                                        Label
                                                    </div>
                                                    <input type="text"
                                                        placeholder="Enter text"
                                                        :class="{'text-field-obscured': element.props.obscureText === true}"
                                                        :disabled="element.props.enabled === false">
                                                </div>

                                                <!-- Container Widget -->
                                                <div v-else-if="element.type === 'Container'" class="flutter-container droppable-container"
                                                    :style="{
                                                        width: (element.props.width || 200) + 'px',
                                                        height: (element.props.height || 200) + 'px',
                                                        backgroundColor: element.props.color || '#FFFFFF',
                                                        padding: '16px',
                                                        margin: '8px',
                                                        borderRadius: '4px',
                                                        boxShadow: element.props.decoration?.includes('boxShadow') ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                                                    }"
                                                    @dragenter.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragover.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragleave.prevent="$event.currentTarget.classList.remove('dragover')"
                                                    @drop.prevent="$event.currentTarget.classList.remove('dragover')">
                                                    <div v-if="!element.children || element.children.length === 0" class="container-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            <span>Arrastra componentes aquí</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Row Widget -->
                                                <div v-else-if="element.type === 'Row'" class="flutter-row droppable-container"
                                                    :style="{
                                                        justifyContent: 'flex-start',
                                                        alignItems: 'center'
                                                    }"
                                                    @dragenter.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragover.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragleave.prevent="$event.currentTarget.classList.remove('dragover')"
                                                    @drop.prevent="$event.currentTarget.classList.remove('dragover')">
                                                    <div v-if="!element.children || element.children.length === 0" class="row-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                            <span>Arrastra componentes aquí</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Column Widget -->
                                                <div v-else-if="element.type === 'Column'" class="flutter-column droppable-container"
                                                    :style="{
                                                        justifyContent: 'flex-start',
                                                        alignItems: 'center'
                                                    }"
                                                    @dragenter.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragover.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragleave.prevent="$event.currentTarget.classList.remove('dragover')"
                                                    @drop.prevent="$event.currentTarget.classList.remove('dragover')">
                                                    <div v-if="!element.children || element.children.length === 0" class="column-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                            <span>Arrastra componentes aquí</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Image Widget -->
                                                <div v-else-if="element.type === 'Image'" class="flutter-image">
                                                    <img :src="element.props.src"
                                                        :style="{
                                                            width: (element.props.width || 150) + 'px',
                                                            height: (element.props.height || 150) + 'px',
                                                            objectFit: 'cover'
                                                        }"
                                                        alt="Flutter Image">
                                                </div>

                                                <!-- Icon Widget -->
                                                <div v-else-if="element.type === 'Icon'" class="flutter-icon"
                                                    :style="{
                                                        color: element.props.color || '#000000',
                                                        fontSize: (element.props.size || 24) + 'px'
                                                    }">
                                                    <i class="material-icons">star</i>
                                                </div>

                                                <!-- Checkbox Widget -->
                                                <div v-else-if="element.type === 'Checkbox'" class="flutter-checkbox">
                                                    <input type="checkbox" :checked="element.props.value === true">
                                                    <div class="checkbox-active-color"
                                                        :style="{ backgroundColor: element.props.activeColor || '#2196F3' }"></div>
                                                </div>

                                                <!-- DropdownButton Widget -->
                                                <div v-else-if="element.type === 'DropdownButton'" class="flutter-dropdown">
                                                    <select>
                                                        <option v-for="(item, index) in element.props.items" :key="index"
                                                            :selected="item === element.props.value">
                                                            {{ item }}
                                                        </option>
                                                    </select>
                                                </div>

                                                <!-- ScrollChildren Widget -->
                                                <div v-else-if="element.type === 'ScrollChildren'" class="flutter-scroll-children droppable-container"
                                                    :style="{
                                                        width: '100%',
                                                        height: '200px',
                                                        overflowX: element.props.scrollDirection === 'Axis.horizontal' ? 'auto' : 'hidden',
                                                        overflowY: element.props.scrollDirection === 'Axis.vertical' ? 'auto' : 'hidden',
                                                        padding: '8px',
                                                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                        borderRadius: '4px'
                                                    }"
                                                    @dragenter.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragover.prevent="$event.currentTarget.classList.add('dragover')"
                                                    @dragleave.prevent="$event.currentTarget.classList.remove('dragover')"
                                                    @drop.prevent="$event.currentTarget.classList.remove('dragover')">
                                                    <div v-if="!element.children || element.children.length === 0" class="scroll-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                            <span>Arrastra componentes aquí para crear una lista desplazable</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- TableList Widget -->
                                                <div v-else-if="element.type === 'TableList'" class="flutter-table-list">
                                                    <table class="w-full border-collapse">
                                                        <thead>
                                                            <tr :style="{ backgroundColor: element.props.headerColor || '#E0E0E0' }">
                                                                <th v-for="(column, index) in element.props.columns" :key="index"
                                                                    class="p-2 text-left"
                                                                    :style="{ border: element.props.border ? '1px solid #ddd' : 'none' }">
                                                                    {{ column }}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr v-for="row in parseInt(element.props.rows)" :key="row">
                                                                <td v-for="(column, index) in element.props.columns" :key="index"
                                                                    class="p-2"
                                                                    :style="{ border: element.props.border ? '1px solid #ddd' : 'none' }">
                                                                    Cell {{ row }}-{{ index + 1 }}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <!-- CardText Widget -->
                                                <div v-else-if="element.type === 'CardText'" class="flutter-card-text"
                                                    :style="{
                                                        backgroundColor: element.props.color || '#FFFFFF',
                                                        borderRadius: (element.props.borderRadius || 8) + 'px',
                                                        boxShadow: `0 ${element.props.elevation || 2}px ${(element.props.elevation || 2) * 2}px rgba(0,0,0,0.1)`,
                                                        overflow: 'hidden',
                                                        width: '100%'
                                                    }">
                                                    <div class="card-header p-3 border-b border-gray-200">
                                                        <h3 class="text-lg font-semibold">{{ element.props.title || 'Card Title' }}</h3>
                                                        <p class="text-sm text-gray-600">{{ element.props.subtitle || 'Card Subtitle' }}</p>
                                                    </div>
                                                    <div class="card-content p-3">
                                                        <p>{{ element.props.content || 'Card content goes here with more details about the item.' }}</p>
                                                    </div>
                                                </div>

                                                <!-- Default Widget Display -->
                                                <div v-else class="widget-properties">
                                                    <div v-for="(value, key) in element.props" :key="key" class="widget-property">
                                                        <span class="property-name">{{ key }}:</span>
                                                        <span class="property-value">{{ value }}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Nested children if any -->
                                            <div v-if="element.children && element.children.length > 0" class="widget-children">
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
                                                                'selected-widget': selectedWidget === child,
                                                                'text-child-widget': ['Text', 'h1', 'h2', 'h3'].includes(child.type),
                                                                'input-child-widget': ['TextField', 'Checkbox', 'DropdownButton'].includes(child.type),
                                                                'container-child-widget': ['Container', 'SafeArea'].includes(child.type),
                                                                'layout-child-widget': ['Row', 'Column', 'Padding'].includes(child.type),
                                                                'display-child-widget': ['Image', 'Icon'].includes(child.type)
                                                            }"
                                                            @click.stop="selectWidget(child)"
                                                        >
                                                            <div class="child-widget-header">
                                                                <span class="child-widget-type">{{ child.type }}</span>
                                                                <button
                                                                    @click.stop="removeWidget(child)"
                                                                    class="widget-remove-btn"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                            <div class="child-widget-preview">
                                                                <!-- Text preview -->
                                                                <div v-if="child.type === 'Text'" class="child-widget-content">
                                                                    {{ child.props.data || 'Text' }}
                                                                </div>
                                                                <!-- TextField preview -->
                                                                <div v-else-if="child.type === 'TextField'" class="child-widget-content">
                                                                    <div class="mini-input-preview">Input Field</div>
                                                                </div>
                                                                <!-- Container preview -->
                                                                <div v-else-if="['Container', 'Row', 'Column'].includes(child.type)" class="child-widget-content">
                                                                    <div class="mini-container-preview">{{ child.type }}</div>
                                                                </div>
                                                                <!-- Image preview -->
                                                                <div v-else-if="child.type === 'Image'" class="child-widget-content">
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

                    <!-- Flutter code display -->
                    <div v-if="showFlutterCode" class="bg-gray-800 text-white p-4 rounded-md">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-medium">Código Flutter</h3>
                            <button
                                @click="copyFlutterCode"
                                class="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                            >
                                Copiar
                            </button>
                        </div>
                        <pre class="text-sm overflow-auto max-h-60">{{ flutterCode }}</pre>
                    </div>
                </div>

                <!-- Properties panel -->
                <div v-if="selectedWidget" class="w-80 bg-gray-100 p-4 rounded-md overflow-y-auto">
                    <h2 class="text-lg font-semibold mb-4">Propiedades</h2>

                    <div class="flex flex-col gap-4">
                        <div v-for="(value, key) in selectedWidget.props" :key="key" class="flex flex-col gap-1">
                            <label class="text-sm font-medium">{{ key }}</label>

                            <!-- String input -->
                            <input
                                v-if="typeof value === 'string' && !availableWidgets.find(w => w.type === selectedWidget.type)?.properties.find(p => p.name === key)?.type === 'select'"
                                v-model="selectedWidget.props[key]"
                                type="text"
                                class="px-3 py-2 border rounded-md"
                                @change="updateWidgetProperty(key, selectedWidget.props[key])"
                            />

                            <!-- Number input -->
                            <input
                                v-else-if="typeof value === 'number'"
                                v-model.number="selectedWidget.props[key]"
                                type="number"
                                class="px-3 py-2 border rounded-md"
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

                            <!-- Color input -->
                            <div v-else-if="availableWidgets.find(w => w.type === selectedWidget.type)?.properties.find(p => p.name === key)?.type === 'color'" class="flex items-center gap-2">
                                <input
                                    v-model="selectedWidget.props[key]"
                                    type="color"
                                    class="w-10 h-10 border rounded"
                                    @change="updateWidgetProperty(key, selectedWidget.props[key])"
                                />
                                <input
                                    v-model="selectedWidget.props[key]"
                                    type="text"
                                    class="px-3 py-2 border rounded-md flex-1"
                                    @change="updateWidgetProperty(key, selectedWidget.props[key])"
                                />
                            </div>

                            <!-- Select input -->
                            <select
                                v-else-if="availableWidgets.find(w => w.type === selectedWidget.type)?.properties.find(p => p.name === key)?.type === 'select'"
                                v-model="selectedWidget.props[key]"
                                class="px-3 py-2 border rounded-md"
                                @change="updateWidgetProperty(key, selectedWidget.props[key])"
                            >
                                <option
                                    v-for="option in availableWidgets.find(w => w.type === selectedWidget.type)?.properties.find(p => p.name === key)?.options"
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
                                        class="px-3 py-2 border rounded-md flex-1"
                                        @change="updateWidgetProperty(key, [...selectedWidget.props[key]])"
                                    />
                                    <button
                                        @click="selectedWidget.props[key].splice(index, 1); updateWidgetProperty(key, [...selectedWidget.props[key]])"
                                        class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                    >
                                        -
                                    </button>
                                </div>
                                <button
                                    @click="selectedWidget.props[key].push(''); updateWidgetProperty(key, [...selectedWidget.props[key]])"
                                    class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    + Agregar
                                </button>
                            </div>

                            <!-- Default fallback -->
                            <input
                                v-else
                                v-model="selectedWidget.props[key]"
                                type="text"
                                class="px-3 py-2 border rounded-md"
                                @change="updateWidgetProperty(key, selectedWidget.props[key])"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Socket connection status -->
            <div class="flex items-center gap-2 text-sm">
                <div
                    class="w-3 h-3 rounded-full"
                    :class="socketConnected ? 'bg-green-500' : 'bg-red-500'"
                ></div>
                <span>{{ socketConnected ? 'Conectado' : 'Desconectado' }}</span>
                <span v-if="socketError" class="text-red-500">Error: {{ socketError }}</span>
            </div>

            <!-- Collaborator Management Section -->
            <div v-if="isCreator" class="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 class="text-lg font-semibold mb-2">Gestión de Colaboradores</h3>

                <!-- Invite Button -->
                <div class="flex gap-2 mb-4">
                    <button
                        @click="showInviteForm = !showInviteForm"
                        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                        {{ showInviteForm ? 'Cancelar' : 'Invitar Colaborador' }}
                    </button>

                    <button
                        @click="generateInviteLink"
                        class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                    >
                        {{ showInviteLink ? 'Ocultar Enlace' : 'Generar Enlace de Invitación' }}
                    </button>
                </div>

                <!-- Invite Form -->
                <div v-if="showInviteForm" class="mb-4 p-4 bg-white rounded-md border border-gray-300">
                    <div class="flex gap-2">
                        <input
                            v-model="inviteEmail"
                            type="email"
                            placeholder="Correo electrónico"
                            class="flex-1 px-3 py-2 border rounded-md"
                        />
                        <button
                            @click="inviteCollaborator"
                            class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Invitar
                        </button>
                    </div>
                </div>

                <!-- Invite Link -->
                <div v-if="showInviteLink" class="mb-4 p-4 bg-white rounded-md border border-gray-300">
                    <div class="flex gap-2">
                        <input
                            v-model="inviteLink"
                            type="text"
                            readonly
                            class="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                        />
                        <button
                            @click="copyInviteLink"
                            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Copiar
                        </button>
                    </div>
                </div>

                <!-- Collaborators List -->
                <div v-if="collaborators.length > 0" class="mt-4">
                    <h4 class="font-medium mb-2">Colaboradores</h4>
                    <div class="space-y-2">
                        <div
                            v-for="collaborator in collaborators"
                            :key="collaborator.id || collaborator.email"
                            class="p-2 bg-white rounded-md border border-gray-300 flex justify-between items-center"
                        >
                            <div class="flex items-center gap-2">
                                <div
                                    class="w-3 h-3 rounded-full"
                                    :class="onlineCollaborators.includes(collaborator.name || collaborator.email) ? 'bg-green-500' : 'bg-gray-400'"
                                    :title="onlineCollaborators.includes(collaborator.name || collaborator.email) ? 'En línea' : 'Desconectado'"
                                ></div>
                                <span>{{ collaborator.name || collaborator.email }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="mt-4 text-gray-500 text-center">
                    No hay colaboradores aún
                </div>
            </div>

            <!-- Chat Buttons -->
            <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <!-- AI Chat Button -->
                <button
                    @click="toggleAIChat"
                    class="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:bg-purple-700"
                    :class="{'bg-purple-700': showAIChat}"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.051l.311.093c1.135.34 2.345.34 3.48 0l.312-.093a2.25 2.25 0 001.357-2.051V3.104M18 14.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-1.5a2.25 2.25 0 012.25-2.25h7.5z" />
                    </svg>
                </button>

                <!-- Regular Chat Button -->
                <button
                    v-if="showChatButton"
                    @click="toggleFloatingChat"
                    class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600"
                    :class="{'animate-pulse': chatMessages.length > 0 && !showFloatingChat, 'bg-blue-600': showFloatingChat}"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            </div>

            <!-- Floating Chat Window -->
            <div v-if="showFloatingChat" class="fixed bottom-20 right-4 z-50 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col">
                <!-- Chat Header -->
                <div class="bg-blue-500 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
                    <h3 class="font-semibold">Chat del Proyecto</h3>
                    <button @click="toggleFloatingChat" class="text-white hover:text-gray-200 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>

                <!-- Chat Messages -->
                <div class="flex-1 overflow-y-auto p-4">
                    <div v-if="chatMessages.length === 0" class="text-gray-500 text-center py-4">
                        No hay mensajes aún
                    </div>

                    <div
                        v-for="(msg, index) in chatMessages"
                        :key="index"
                        class="mb-3"
                        :class="msg.user === currentUser ? 'text-right' : 'text-left'"
                    >
                        <div
                            class="inline-block px-3 py-2 rounded-lg max-w-[80%]"
                            :class="msg.user === currentUser ? 'bg-blue-100' : 'bg-gray-100'"
                        >
                            <div class="font-semibold text-xs text-gray-600">{{ msg.user }}</div>
                            <div>{{ msg.text }}</div>
                            <div class="text-xs text-gray-500 mt-1">{{ new Date(msg.timestamp).toLocaleTimeString() }}</div>
                        </div>
                    </div>

                    <p v-if="chatTyping.typing" class="text-sm text-gray-500 italic mt-2">
                        {{ chatTyping.typing }}
                    </p>
                </div>

                <!-- Chat Input -->
                <form @submit.prevent="sendChatMessage" class="border-t border-gray-300 p-2 flex gap-2">
                    <input
                        v-model="chatMessage"
                        type="text"
                        placeholder="Escribe un mensaje..."
                        class="flex-1 px-3 py-2 border rounded-md"
                        @input="onChatInput"
                    />
                    <button
                        type="submit"
                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Enviar
                    </button>
                </form>
            </div>

            <!-- AI Chat Window -->
            <div v-if="showAIChat" class="fixed bottom-20 right-4 z-50 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col">
                <!-- AI Chat Header -->
                <div class="bg-purple-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
                    <h3 class="font-semibold">Asistente IA para Flutter</h3>
                    <button @click="toggleAIChat" class="text-white hover:text-gray-200 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>

                <!-- AI Chat Messages -->
                <div class="flex-1 overflow-y-auto p-4">
                    <div v-if="aiMessages.length === 0" class="text-gray-500 text-center py-4">
                        <p>Bienvenido al asistente IA para Flutter.</p>
                        <p class="mt-2">Describe la interfaz que deseas crear y la IA generará los widgets correspondientes.</p>
                        <p class="mt-2 text-xs">Ejemplo: "Crea un formulario de login con campos para email y contraseña, y un botón para iniciar sesión"</p>
                    </div>

                    <div
                        v-for="(msg, index) in aiMessages"
                        :key="index"
                        class="mb-4"
                        :class="{'text-right': msg.isUser, 'text-left': !msg.isUser}"
                    >
                        <div
                            class="inline-block px-3 py-2 rounded-lg max-w-[90%]"
                            :class="msg.isUser ? 'bg-purple-100' : 'bg-gray-100'"
                        >
                            <div class="font-semibold text-xs" :class="msg.isUser ? 'text-purple-600' : 'text-gray-600'">
                                {{ msg.isUser ? 'Tú' : 'Asistente IA' }}
                            </div>
                            <div class="whitespace-pre-wrap">{{ msg.text }}</div>

                            <!-- Add to Canvas button for AI responses -->
                            <div v-if="!msg.isUser && msg.widgets && msg.widgets.length > 0" class="mt-2">
                                <button
                                    @click="addAIWidgetsToCanvas(msg.widgets)"
                                    class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                >
                                    Añadir a la Pizarra
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Loading indicator -->
                    <div v-if="isProcessingAI" class="flex items-center justify-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span class="ml-2 text-purple-600">Generando respuesta...</span>
                    </div>
                </div>

                <!-- AI Chat Input -->
                <form @submit.prevent="sendAIPrompt" class="border-t border-gray-300 p-2 flex flex-col gap-2">
                    <textarea
                        v-model="aiPrompt"
                        rows="3"
                        placeholder="Describe la interfaz que deseas crear..."
                        class="w-full px-3 py-2 border rounded-md resize-none"
                        :disabled="isProcessingAI"
                    ></textarea>
                    <button
                        type="submit"
                        class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="isProcessingAI || !aiPrompt.trim()"
                    >
                        {{ isProcessingAI ? 'Generando...' : 'Generar Widgets' }}
                    </button>
                </form>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
/* Draggable styles */
.draggable-ghost {
    opacity: 0.5;
    background: #c8ebfb;
}

.draggable-drag {
    cursor: grabbing;
}

.ghost-widget {
    opacity: 0.5;
    background: #e3f2fd;
    border: 2px dashed #2196F3;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
}

.chosen-widget {
    opacity: 0.8;
    transform: scale(1.02);
    z-index: 10;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
}

/* Mobile phone frame styles */
.mobile-phone-frame {
    width: 375px;
    height: 667px;
    background-color: white;
    border-radius: 36px;
    box-shadow: 0 0 0 10px #111, 0 0 0 11px #222, 0 20px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    margin: 20px auto;
    display: flex;
    flex-direction: column;
}

/* Phone status bar */
.phone-status-bar {
    height: 30px;
    background-color: #f8f8f8;
    border-bottom: 1px solid #e0e0e0;
    color: #333;
    font-weight: 500;
}

/* Phone content area */
.phone-content-area {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background-color: #f5f5f7;
    position: relative;
}

/* Phone navigation bar */
.phone-nav-bar {
    height: 34px;
    background-color: #f8f8f8;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.home-indicator {
    width: 134px;
    height: 5px;
    background-color: #000;
    border-radius: 3px;
}

/* Widget styles */
.mobile-widget {
    margin-bottom: 10px;
    border-radius: 8px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.2s ease;
}

.selected-widget {
    box-shadow: 0 0 0 2px #007aff, 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: scale(1.01);
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #f8f8f8;
    border-bottom: 1px solid #e0e0e0;
}

.widget-type {
    font-weight: 600;
    font-size: 14px;
    color: #333;
}

.widget-remove-btn {
    width: 24px;
    height: 24px;
    border-radius: 12px;
    background-color: #ff3b30;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    line-height: 1;
    border: none;
    cursor: pointer;
}

.widget-properties {
    padding: 8px 12px;
}

.widget-property {
    display: flex;
    margin-bottom: 4px;
    font-size: 12px;
}

.property-name {
    font-weight: 500;
    color: #666;
    margin-right: 4px;
}

.property-value {
    color: #333;
    word-break: break-word;
}

.widget-children {
    margin-top: 8px;
    padding: 8px 12px;
    border-top: 1px dashed #e0e0e0;
    background-color: #f5f5f7;
    border-radius: 0 0 8px 8px;
}

.nested-widgets-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
}

.nested-widgets-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 8px;
}

.child-widget {
    padding: 8px;
    background-color: #ffffff;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.child-widget:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.child-widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    padding-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
}

.child-widget-type {
    font-size: 12px;
    font-weight: 600;
    color: #333;
}

.child-widget-preview {
    padding: 4px 0;
}

.child-widget-content {
    font-size: 12px;
    color: #666;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mini-input-preview {
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    color: #6c757d;
}

.mini-container-preview {
    background-color: #e9ecef;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    color: #495057;
    text-align: center;
}

.mini-image-preview {
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    color: #6c757d;
    text-align: center;
}

.add-nested-widget-hint {
    text-align: center;
    font-size: 12px;
    color: #6c757d;
    padding: 8px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px dashed #ced4da;
}

.text-child-widget {
    border-left: 3px solid #007bff;
}

.input-child-widget {
    border-left: 3px solid #fd7e14;
}

.container-child-widget {
    border-left: 3px solid #28a745;
}

.layout-child-widget {
    border-left: 3px solid #e83e8c;
}

.display-child-widget {
    border-left: 3px solid #6f42c1;
}

/* Widget type-specific styles */
.text-widget {
    background-color: #f0f8ff;
}

.input-widget {
    background-color: #fff8f0;
}

.container-widget {
    background-color: #f0fff8;
}

.layout-widget {
    background-color: #fff0f8;
}

.display-widget {
    background-color: #f8f0ff;
}

/* Mobile widget selector styles */
.mobile-widget-selector {
    background-color: #f8f8f8;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.widget-selector-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    padding: 16px;
    text-align: center;
    background-color: #fff;
    border-bottom: 1px solid #e0e0e0;
}

.widget-category-tabs {
    display: flex;
    background-color: #fff;
    border-bottom: 1px solid #e0e0e0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.widget-category-tab {
    flex: 1;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.active-tab {
    color: #007aff;
    border-bottom-color: #007aff;
}

.widget-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
}

.widget-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.widget-button:active {
    transform: scale(0.95);
}

.widget-button:hover {
    background-color: #f5f5f5;
    border-color: #ccc;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.widget-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 8px;
    border-radius: 8px;
}

.widget-label {
    font-size: 12px;
    font-weight: 500;
    color: #333;
    text-align: center;
}

.input-widget-btn .widget-icon {
    background-color: #fff8f0;
    color: #ff9500;
}

.layout-widget-btn .widget-icon {
    background-color: #fff0f8;
    color: #ff2d55;
}

.container-widget-btn .widget-icon {
    background-color: #f0fff8;
    color: #34c759;
}

.display-widget-btn .widget-icon {
    background-color: #f8f0ff;
    color: #af52de;
}

/* Desktop widget selector specific styles */
.desktop-widget-selector {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.desktop-widget-selector .widget-grid {
    flex: 1;
    overflow-y: auto;
    grid-template-columns: repeat(2, 1fr);
}

.desktop-widget-selector .widget-button {
    cursor: pointer;
}

@media (min-width: 1024px) {
    .desktop-widget-selector .widget-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .mobile-phone-frame {
        width: 320px;
        height: 568px;
        border-radius: 24px;
    }

    .widget-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 480px) {
    .widget-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Flutter Widget Styles */
.flutter-widget-preview {
    padding: 8px;
    margin-bottom: 8px;
}

/* Droppable container styles */
.droppable-container {
    border: 2px dashed transparent;
    transition: all 0.2s ease;
    position: relative;
    min-height: 60px;
}

.droppable-container:hover {
    border-color: #007aff;
    background-color: rgba(0, 122, 255, 0.05);
}

.droppable-container.dragover {
    border-color: #2196F3;
    background-color: rgba(33, 150, 243, 0.1);
    box-shadow: inset 0 0 10px rgba(33, 150, 243, 0.2);
}

.drop-here-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #666;
    padding: 16px;
    text-align: center;
}

.drop-here-indicator svg {
    margin-bottom: 8px;
    color: #007aff;
}

.drop-here-indicator span {
    font-size: 14px;
    font-weight: 500;
}

/* Text Widget */
.flutter-text {
    font-family: 'Roboto', sans-serif;
    line-height: 1.5;
    padding: 4px 0;
    overflow-wrap: break-word;
}

/* TextField Widget */
.flutter-text-field {
    position: relative;
    margin: 8px 0;
}

.text-field-label {
    position: absolute;
    top: -12px;
    left: 12px;
    font-size: 12px;
    color: #6200ee;
    background-color: white;
    padding: 0 4px;
    z-index: 1;
}

.flutter-text-field input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
}

.flutter-text-field input:focus {
    border-color: #6200ee;
    outline: none;
}

.text-field-obscured {
    -webkit-text-security: disc;
    text-security: disc;
}

/* Container Widget */
.flutter-container {
    background-color: white;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.3s;
}

.container-placeholder {
    color: #757575;
    font-style: italic;
}

/* Row Widget */
.flutter-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    min-height: 40px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
    padding: 8px;
}

.row-placeholder {
    color: #757575;
    font-style: italic;
}

/* Column Widget */
.flutter-column {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 80px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
    padding: 8px;
}

.column-placeholder {
    color: #757575;
    font-style: italic;
}

/* Image Widget */
.flutter-image {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border-radius: 4px;
}

.flutter-image img {
    max-width: 100%;
    height: auto;
}

/* Icon Widget */
.flutter-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
}

/* Checkbox Widget */
.flutter-checkbox {
    display: flex;
    align-items: center;
    margin: 8px 0;
}

.flutter-checkbox input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #757575;
    border-radius: 2px;
    margin-right: 8px;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
}

.flutter-checkbox input[type="checkbox"]:checked {
    background-color: #6200ee;
    border-color: #6200ee;
}

.flutter-checkbox input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 5px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

/* DropdownButton Widget */
.flutter-dropdown {
    position: relative;
    margin: 8px 0;
}

.flutter-dropdown select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
}

/* ScrollChildren Widget */
.flutter-scroll-children {
    border: 1px solid #e0e0e0;
    background-color: #f9f9f9;
    position: relative;
    transition: all 0.2s ease;
}

.flutter-scroll-children::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.flutter-scroll-children::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.flutter-scroll-children::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.flutter-scroll-children::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.scroll-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #757575;
    font-style: italic;
}

/* TableList Widget */
.flutter-table-list {
    overflow-x: auto;
    margin: 8px 0;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.flutter-table-list table {
    min-width: 100%;
    border-collapse: collapse;
}

.flutter-table-list th {
    font-weight: 600;
    text-align: left;
    font-size: 14px;
}

.flutter-table-list td {
    font-size: 14px;
}

.flutter-table-list tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
}

/* CardText Widget */
.flutter-card-text {
    margin: 8px 0;
    transition: box-shadow 0.3s ease;
}

.flutter-card-text:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
}

.card-content {
    padding: 12px 16px;
}

.card-header h3 {
    margin: 0 0 4px 0;
    font-weight: 600;
}

.card-header p {
    margin: 0;
    color: #666;
    font-size: 14px;
}
</style>
