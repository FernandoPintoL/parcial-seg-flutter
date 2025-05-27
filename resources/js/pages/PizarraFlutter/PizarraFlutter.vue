<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import './PizarraFlutter.css';
import { ref, onMounted, onUnmounted, computed, watch, reactive, defineProps } from 'vue';
import draggable from 'vuedraggable';
import { io } from 'socket.io-client';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AlertService } from '@/Services/AlertService';
import { getSocketConfig, toggleSocketEnvironment } from '@/lib/socketConfig';
import type { BreadcrumbItem } from '@/types';
import type { Pizarra, PizarraCollaborators, FlutterWidget } from '@/types/Pizarra';
import { availableFlutterWidgets } from '@/types/availableFlutterWidgets';
import type { User } from '@/types/User';
import { SocketService } from '@/Services/SocketService';
import ChatColaborativo from '@/pages/Chat/ChatColaborativo.vue';

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
const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
const socketConfig = ref(getSocketConfig(useLocalSocket.value));
const roomId = ref(props.pizarra ? props.pizarra.room_id : '');
const currentUser = ref(props.user?.name || 'Usuario');

// User ID for socket events
const user_id = ref(props.user?.id);
const socket = io(socketConfig.value.url, socketConfig.value.options);
const socketConnected = ref<boolean>(false);
const socketError = ref<string>('');

// Collaborator management
const collaborators = ref<any>(props.colaboradores || []);
const onlineCollaborators = ref<any>([]);
const isCreator = ref<boolean>(props.isCreador);

// Invitation system
const inviteEmail = ref<string>('');
const showInviteForm = ref<boolean>(false);
const showInviteLink = ref<boolean>(false);
const inviteLink = ref<string>('');

// Floating chat
const showFloatingChat = ref<boolean>(false);
const chatMessages = ref<{ text: string; user: string; timestamp: number }[]>([]);
const chatMessage = ref<string>('');
const chatTyping = reactive<{ typing: string, timeout: number | null }>({
    typing: '',
    timeout: null
});
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

// Counter for generating unique widget IDs
let widgetIdCounter = 1;

// Project name ref
const projectName = ref<string>(props.pizarra?.name || 'Nueva Pizarra Flutter');


// Selected widget for editing
const selectedWidget = ref<FlutterWidget | null>(null);

// Available Flutter widgets
const availableWidgets = ref(availableFlutterWidgets);


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
}
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
}
const flutterWidgets = ref<FlutterWidget[]>(getInitialFlutterWidgets());
// Function to add a widget to the canvas
const addWidget = (widgetType: string) => {
    const widgetDefinition = availableWidgets.value.find(w => w.type === widgetType);

    if (!widgetDefinition) return;

    const newWidget: FlutterWidget = {
        id: `widget-${widgetIdCounter++}`,
        type: widgetDefinition.type,
        props: {},
        children: [] // Always initialize as an array to avoid "elements must be an array" error
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
        userId: currentUser.value
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
        userId: currentUser.value
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
            userId: currentUser.value
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
        if (widget.children && Array.isArray(widget.children) && widget.children.length > 0) {
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
    let widgetsCode = '';
    flutterWidgets.value.forEach(widget => {
        widgetsCode += generateWidgetCode(widget) + ',\n';
    });

    // Wrap the widgets in a StatelessWidget
    flutterCode = `
import 'package:flutter/material.dart';

class MyFlutterApp extends StatelessWidget {
  const MyFlutterApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('${projectName.value}'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ${widgetsCode}
          ],
        ),
      ),
    );
  }
}
`;

    return flutterCode;
};

// --- DRAG & DROP PARA AGREGAR WIDGETS DENTRO DE OTROS WIDGETS ---
// Widget que se está arrastrando desde la paleta
const draggingWidgetType = ref<string | null>(null);

// Variables para el menú de agregar widget hijo
const showAddChildMenu = ref<string | null>(null);
const activeAddChildCategory = ref<number>(0);

// Cuando empieza a arrastrar desde la paleta
const onPaletteDragStart = (widgetType: string) => {
    draggingWidgetType.value = widgetType;
};

// Cuando termina el arrastre (en cualquier lugar)
const onPaletteDragEnd = () => {
    draggingWidgetType.value = null;
};

// Función para agregar un widget hijo a un widget padre (por id)
const addChildWidget = (parentId: string, widgetType: string) => {
    const widgetDefinition = availableWidgets.value.find(w => w.type === widgetType);
    if (!widgetDefinition) return;
    const newWidget: FlutterWidget = {
        id: `widget-${widgetIdCounter++}`,
        type: widgetDefinition.type,
        props: {},
        children: []
    };
    widgetDefinition.properties.forEach(prop => {
        newWidget.props[prop.name] = prop.defaultValue;
    });
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
    addToParent(flutterWidgets.value);
    // Emitir evento socket
    socket.emit('flutter-widget-added', {
        roomId: roomId.value,
        widget: newWidget,
        userId: currentUser.value
    });
};

let socketService: SocketService;

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
// Socket event handlers
onMounted(() => {
    console.log('Mounted PizarraFlutter');
    console.log(props.pizarra);
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

    /* Only add formBuilderId if it exists and is not undefined
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
    });*/

    socket.on('flutter-widget-added', (data) => {
        if (data.userId !== currentUser.value) {
            // Ensure the widget has a children property initialized as an array
            if (!data.widget.children || !Array.isArray(data.widget.children)) {
                data.widget.children = [];
            }
            flutterWidgets.value.push(data.widget);
        }
    });

    socket.on('flutter-widget-updated', (data) => {
        if (data.userId !== currentUser.value) {
            // Ensure the widget has a children property initialized as an array
            if (!data.widget.children || !Array.isArray(data.widget.children)) {
                data.widget.children = [];
            }
            const index = flutterWidgets.value.findIndex(w => w.id === data.widget.id);
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
    socket.on('chatMessage', (data) => {
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
        AlertService.prototype.success('Colaborador Aceptado', `El colaborador ${data.user} ha sido aceptado.`);

        // Reload the collaborators list to get the updated list
        loadCollaborators();
    });

    // Load collaborators and chat messages if we have a form ID
    if (props.pizarra?.id) {
        loadCollaborators();
    }
});

onUnmounted(() => {
    // Disconnect from socket
    socketService.disconnect();

    // Clear all socket listeners
    /*socket.off('connect');
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
    socket.off('collaboratorAccepted');*/
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
const showFlutterCode = ref<boolean>(false);
const flutterCode = computed(() => generateFlutterCode());

// Active widget category for mobile selector
const activeWidgetCategory = ref<number>(0);

// Flutter widget rendering helper comment
// These functions were removed as they are no longer needed
// The widget rendering has been simplified to use static values

// Copy Flutter code to clipboard
const copyFlutterCode = () => {
    navigator.clipboard.writeText(flutterCode.value);
    AlertService.prototype.success('Código copiado al portapapeles');
};

// Function to download the complete Flutter project
const downloadFlutterProject = async () => {
    try {
        // Show loading message
        AlertService.prototype.info('Procesando', 'Generando proyecto Flutter...');

        // Send request to backend to generate and download the project
        const response = await axios.post('/pizarra/download-flutter-project', {
            name: projectName.value || 'FlutterProject',
            elements: flutterWidgets.value, // Enviar como array, no como string
            code: flutterCode.value,
            project_name: projectName.value || 'FlutterProject',
            id: props.pizarra?.id || null,
        }, {
            responseType: 'blob' // Important to set response type for file download
        });

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

    try {
        isProcessingImage.value = true;
        AlertService.prototype.info('Procesando', 'Analizando imagen con IA...');

        // Create form data
        const formData = new FormData();
        formData.append('image', selectedImage.value);

        // Send to backend for processing
        const response = await axios.post('/pizarra/scan-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data.success) {
            // Add the generated widgets to the canvas
            if (response.data.widgets && response.data.widgets.length > 0) {
                addAIWidgetsToCanvas(response.data.widgets);

                // Close the modal
                closeImageUpload();

                // Show success message
                AlertService.prototype.success('Éxito', 'Imagen procesada correctamente');
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
        // const id = parseInt(props.pizarra.id);
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

        await axios.put(`/pizarra/${props.pizarra.id}/edit`, {
            name: projectName.value,
            elements: flutterWidgets.value // Enviar como array, no como string
        });

        AlertService.prototype.success('Éxito', 'Cambios guardados correctamente');
    } catch (error) {
        console.error('Error saving pizarra flutter:', error);
        AlertService.prototype.error('Error', 'No se pudieron guardar los cambios');
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
    if (props.pizarra && props.isCreador && props.pizarra.id) {
        savePizarraFlutter();
    }
}, 1000); // 1 second debounce
// Watch for changes in flutterWidgets and save them
watch(flutterWidgets, () => {
    debouncedSave();
}, { deep: true, flush: 'post' });

// Load collaborators
const loadCollaborators = async () => {
    if (!props.pizarra?.id) return;

    try {
        const response = await axios.get(`/pizarra/${props.pizarra.id}/collaborators/flutter`);
        console.log(response);
        // Add showActivities property to each collaborator for UI toggle
        collaborators.value = response.data.map((collaborator: any) => ({
            ...collaborator,
            showActivities: false
        }));
    } catch (error) {
        console.error('Error loading collaborators:', error);
        AlertService.prototype.error('Error', 'No se pudo cargar los colaboradores');
    }
};
// Invite a collaborator
const inviteCollaborator = async () => {
    if (!props.pizarra?.id || !inviteEmail.value) return;

    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail.value)) {
            AlertService.prototype.error('Error', 'Formato de correo electrónico inválido');
            return;
        }

        await axios.post(`/pizarra/${props.pizarra.id}/invite/flutter`, {
            email: inviteEmail.value
        });

        AlertService.prototype.success('Éxito', 'Invitación enviada correctamente');

        inviteEmail.value = '';
        showInviteForm.value = false;
        loadCollaborators();
    } catch (error) {
        console.error('Error inviting collaborator:', error);
        AlertService.prototype.error('Error', 'No se pudo enviar la invitación');
    }
};
// Generate invite link
const generateInviteLink = () => {
    showInviteLink.value = !showInviteLink.value;
    inviteLink.value = `${window.location.origin}/pizarra/${props.pizarra.id}/invite/flutter`;
};
// Copy text to clipboard
const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
        AlertService.prototype.success(successMessage);
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        AlertService.prototype.error('Error', 'No se pudo copiar al portapapeles');
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
    if (showFloatingChat.value && props.pizarra?.id) {
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
    if (!props.pizarra?.id) return;

    try {
        const response = await axios.get(`/chat/form/${props.pizarra.id}/messages`);
        console.log('Chat messages loaded:', response.data);

        // Format messages from the database
        const dbMessages = response.data.map((msg: any) => ({
            text: msg.message,
            user: msg.user_name || msg.user_email || 'Usuario',
            timestamp: new Date(msg.created_at).getTime()
        }));

        chatMessages.value = dbMessages;
    } catch (error) {
        console.error('Error loading chat messages:', error);
        AlertService.prototype.error('Error', 'No se pudieron cargar los mensajes del chat');
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
            timestamp: Date.now()
        };

        // Emit message to socket
        socket.emit('chatMessage', messageData);

        // Add message to local chat
        chatMessages.value.push({
            text: chatMessage.value,
            user: currentUser.value,
            timestamp: Date.now()
        });

        // Save message to database
        try {
            await axios.post('/chat/message', {
                form_id: props.pizarra?.id,
                message: chatMessage.value,
                user_id: user_id.value
            });
        } catch (error) {
            console.error('Error saving chat message:', error);
            AlertService.prototype.error('Error', 'No se pudo guardar el mensaje en la base de datos');
        }

        // Clear input
        chatMessage.value = '';
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
        const widgetRegex = /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableList|CardText|Scaffold|AppBar|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\b/g;

        // This regex captures widget definitions with their content between parentheses
        // It handles nested parentheses by using a non-greedy approach
        const widgetWithContentRegex = /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableList|CardText|Scaffold|AppBar|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(([\s\S]*?)(?:\)\s*,|\)$|\);)/g;

        // These regex patterns capture child and children properties
        // Improved to handle more complex child widget references
        const childRegex = /child\s*:\s*(?:(?:const\s+)?([A-Za-z][A-Za-z0-9_]*)\s*\(|([A-Za-z][A-Za-z0-9_]*)\s*\.\s*[a-zA-Z]+\()/;

        // Improved to better extract the content of the children array
        const childrenRegex = /children\s*:\s*\[\s*([\s\S]*?)\s*\]\s*(?:,|$)/;

        // This regex helps identify widget types within a children array
        const childrenWidgetsRegex = /\b(Container|Row|Column|TextField|DropdownButton|Checkbox|Text|Image|Icon|Padding|SafeArea|ScrollChildren|TableList|CardText|Scaffold|AppBar|Center|Form|TextFormField|SizedBox|Drawer|Card|ListTile|FloatingActionButton|Stack|ListView|GridView|Expanded|Flexible|Align|Positioned|Wrap)\s*\(/g;

        // Helper function to extract property values from widget content
        const extractProperties = (widgetContent: string, widgetDefinition: any) => {
            const props = {};

            // Initialize with default values first
            widgetDefinition.properties.forEach(prop => {
                props[prop.name] = prop.defaultValue;
            });

            // Try to extract actual values for common properties
            widgetDefinition.properties.forEach(prop => {
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
                        const options = prop.options.map(opt => opt.replace(/\./g, '\\.'));
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
                'red': 'FF0000',
                'blue': '0000FF',
                'green': '00FF00',
                'yellow': 'FFFF00',
                'black': '000000',
                'white': 'FFFFFF',
                'grey': '808080',
                'purple': '800080',
                'orange': 'FFA500',
                'pink': 'FFC0CB',
                'brown': 'A52A2A',
                'cyan': '00FFFF',
                'teal': '008080',
                'indigo': '4B0082',
                'amber': 'FFBF00',
                'lime': '00FF00'
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
            const widgetDefinition = availableWidgets.value.find(w => w.type === widgetType);
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
        widgetDefinitions.forEach(widget => {
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

                childTypes.forEach(childType => {
                    // Find a widget of this type that hasn't been processed yet
                    const childWidget = widgetDefinitions.find(w =>
                        w.type === childType && !processedWidgets.has(w.id)
                    );

                    if (childWidget) {
                        widget.children.push(childWidget);
                        processedWidgets.add(childWidget.id);
                    }
                });

                delete widget.pendingChildren;
            }
        });

        // Process widgets with a single child
        widgetDefinitions.forEach(widget => {
            if (widget.pendingChild) {
                const childType = widget.pendingChild;
                console.log(`Processing widget ${widget.type} with child type: ${childType}`);

                // Find a widget of this type that hasn't been processed yet
                const childWidget = widgetDefinitions.find(w =>
                    w.type === childType && !processedWidgets.has(w.id)
                );

                if (childWidget) {
                    widget.children.push(childWidget);
                    processedWidgets.add(childWidget.id);
                }

                delete widget.pendingChild;
            }
        });

        // Add widgets that haven't been assigned as children to the root level
        widgetDefinitions.forEach(widget => {
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
                widget.children.forEach(child => printWidgetTree(child, depth + 1));
            }
        };

        // Print the widget tree for each root widget
        rootWidgets.forEach(widget => {
            printWidgetTree(widget);
        });

        // Add root widgets to the canvas
        rootWidgets.forEach(widget => {
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

            foundWidgets.forEach(widgetType => {
                const widgetDefinition = availableWidgets.value.find(w => w.type === widgetType);
                if (widgetDefinition) {
                    const newWidget: FlutterWidget = {
                        id: `widget-${widgetIdCounter++}`,
                        type: widgetDefinition.type,
                        props: {},
                        children: []
                    };

                    // Initialize properties with default values
                    widgetDefinition.properties.forEach(prop => {
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
    } catch (error) {
        console.error('Error in parseFlutterWidgets:', error);

        // Fallback to simple widget detection in case of error
        const foundWidgets = new Set<string>();
        let match;

        while ((match = widgetRegex.exec(inputCode)) !== null) {
            foundWidgets.add(match[1]); // Add the widget name
        }

        foundWidgets.forEach(widgetType => {
            const widgetDefinition = availableWidgets.value.find(w => w.type === widgetType);
            if (widgetDefinition) {
                const newWidget: FlutterWidget = {
                    id: `widget-${widgetIdCounter++}`,
                    type: widgetDefinition.type,
                    props: {},
                    children: []
                };

                // Initialize properties with default values
                widgetDefinition.properties.forEach(prop => {
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
    const azureApiUrl = 'https://pinto-maype3p5-eastus2.cognitiveservices.azure.com/';//import.meta.env.AZURE_API_URL;
    const azureApiKey = '54FCfTb8CIMMHT5W7T2pTNeicQNxssRuTYYHh1UJQ8BMUyLd4HPjJQQJ99BEACHYHv6XJ3w3AAAAACOGcky8';//import.meta.env.AZURE_API_KEY;
    const azureModelName = 'gpt-4.1';//import.meta.env.AZURE_MODEL_NAME;

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
                    { role: 'system', content: 'Eres un asistente útil para Flutter.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
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
            /*
            const dart = extractFromFirstImport(aiResponse);
            console.log(dart);
            parseFlutterWidgets(dart);
            */
            // Add the response to the chat
            aiMessages.value.push({
                text: aiResponse,
                isUser: false,
                timestamp: Date.now()
            });
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
// Add AI-generated widgets to the canvas
const addAIWidgetsToCanvas = (widgets: any) => {
    if (!widgets || !Array.isArray(widgets) || widgets.length === 0) {
        AlertService.prototype.error('Error', 'No se encontraron widgets generados por la IA');
        return;
    }

    try {
        // Add each widget to the canvas
        widgets.forEach(widget => {
            // Ensure the widget has a unique ID
            if (!widget.id) {
                widget.id = `widget-${widgetIdCounter++}`;
            }

            // Ensure the widget has a children property initialized as an array
            if (!widget.children || !Array.isArray(widget.children)) {
                widget.children = [];
            }

            // Add the widget to the canvas
            flutterWidgets.value.push(widget);
        });

        // Show success message
        // AlertService.prototype.success('Éxito', 'Widgets generados por la IA añadidos a la pizarra');

        // Emit widget added event to socket for each widget
        widgets.forEach(widget => {
            socket.emit('flutter-widget-added', {
                roomId: roomId.value,
                widget: widget,
                userId: currentUser.value
            });
        });
    } catch (error) {
        console.error('Error adding widgets to canvas:', error);
        AlertService.prototype.error('Error', 'No se pudieron añadir los widgets generados por la IA');
    }
};
// Handle typing in the chat input
const onChatInput = () => {
    // Emit typing event
    socket.emit('typing', {
        roomId: roomId.value,
        user: currentUser.value
    });
};
</script>

<template>
    <Head title="Pizarra Flutter" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <h1 class="text-2xl font-bold">Pizarra Flutter</h1>
            <div class="flex justify-between items-center">
                <input
                    v-model="projectName"
                    type="text"
                    placeholder="Nombre del proyecto"
                    class="px-3 py-2 border rounded-md w-1/2"
                    @keyup.enter="savePizarraFlutter"
                />
                <div class="flex gap-2 ml-2">
                    <button
                        @click="toggleSocketServer"
                        class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Cambiar Socket ({{ useLocalSocket ? 'Local' : 'Producción' }})
                    </button>
                    <button
                        @click="showImageUpload = !showImageUpload"
                        class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                    >
                        Subir Imagen
                    </button>
                    <button
                        @click="showFlutterCode = !showFlutterCode"
                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        {{ showFlutterCode ? 'Ocultar Código' : 'Mostrar Código' }}
                    </button>
                    <button
                        @click="savePizarraFlutter"
                        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <!-- Image Upload Modal -->
            <div v-if="showImageUpload"
                 class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold">Subir Imagen</h2>
                        <button @click="closeImageUpload" class="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-2">
                            Sube una imagen de un boceto o diseño para que la IA lo convierta en código Flutter.
                        </p>

                        <!-- Image preview -->
                        <div v-if="previewImage" class="mb-4">
                            <img :src="previewImage" alt="Preview" class="max-h-60 mx-auto rounded border" />
                            <button
                                @click="clearSelectedImage"
                                class="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                                Eliminar
                            </button>
                        </div>

                        <!-- Upload options -->
                        <div v-if="!previewImage" class="flex flex-col gap-3">
                            <!-- Camera option -->
                            <label
                                class="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Tomar Foto</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    class="hidden"
                                    @change="handleImageUpload"
                                />
                            </label>

                            <!-- Gallery option -->
                            <label
                                class="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Seleccionar de Galería</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    class="hidden"
                                    @change="handleImageUpload"
                                />
                            </label>
                        </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex justify-end gap-2">
                        <button
                            @click="closeImageUpload"
                            class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="processImage"
                            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            :disabled="!selectedImage || isProcessingImage"
                            :class="{ 'opacity-50 cursor-not-allowed': !selectedImage || isProcessingImage }"
                        >
                            {{ isProcessingImage ? 'Procesando...' : 'Procesar Imagen' }}
                        </button>
                    </div>
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
                            draggable="true"
                            @dragstart="onPaletteDragStart(widget.type)"
                            @dragend="onPaletteDragEnd"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                     fill="currentColor">
                                    <path fill-rule="evenodd"
                                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                          clip-rule="evenodd" />
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
                            draggable="true"
                            @dragstart="onPaletteDragStart(widget.type)"
                            @dragend="onPaletteDragEnd"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                     fill="currentColor">
                                    <path
                                        d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
                            draggable="true"
                            @dragstart="onPaletteDragStart(widget.type)"
                            @dragend="onPaletteDragEnd"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                     fill="currentColor">
                                    <path
                                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
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
                            draggable="true"
                            @dragstart="onPaletteDragStart(widget.type)"
                            @dragend="onPaletteDragEnd"
                        >
                            <span class="widget-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                     fill="currentColor">
                                    <path fill-rule="evenodd"
                                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                          clip-rule="evenodd" />
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
                                draggable="true"
                                @dragstart="onPaletteDragStart(widget.type)"
                                @dragend="onPaletteDragEnd"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path fill-rule="evenodd"
                                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                              clip-rule="evenodd" />
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
                                draggable="true"
                                @dragstart="onPaletteDragStart(widget.type)"
                                @dragend="onPaletteDragEnd"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path
                                            d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
                                draggable="true"
                                @dragstart="onPaletteDragStart(widget.type)"
                                @dragend="onPaletteDragEnd"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path
                                            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
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
                                draggable="true"
                                @dragstart="onPaletteDragStart(widget.type)"
                                @dragend="onPaletteDragEnd"
                            >
                                <span class="widget-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path fill-rule="evenodd"
                                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                              clip-rule="evenodd" />
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
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20"
                                             fill="currentColor">
                                            <path
                                                d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20"
                                             fill="currentColor">
                                            <path fill-rule="evenodd"
                                                  d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 100-2 1 1 0 000 2z"
                                                  clip-rule="evenodd" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20"
                                             fill="currentColor">
                                            <path
                                                d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                            <path
                                                d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2a2 2 0 012 2v3a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-2a4 4 0 00-4-4h-3V6a1 1 0 00-1-1H3z" />
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
                                                'selected-widget': selectedWidget?.id === element.id,
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
                                                <div v-else-if="element.type === 'TextField'"
                                                     class="flutter-text-field">
                                                    <div class="text-field-label" v-if="element.props.decoration">
                                                        Label
                                                    </div>
                                                    <input type="text"
                                                           placeholder="Enter text"
                                                           :class="{'text-field-obscured': element.props.obscureText === true}"
                                                           :disabled="element.props.enabled === false">
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
                                                        boxShadow: element.props.decoration?.includes('boxShadow') ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
                                                        overflowY: 'auto',
                                                        maxHeight: '400px'
                                                    }"
                                                     @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                     @drop.prevent="$event.currentTarget?.classList.remove('dragover')">
                                                    <div
                                                        v-if="!element.children || !Array.isArray(element.children) || element.children.length === 0"
                                                        class="container-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                                                                 fill="none" viewBox="0 0 24 24"
                                                                 stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                      stroke-width="2"
                                                                      d="M12 4v16m8-8H4" />
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
                                                                    >
                                                                        {{ widget.label }}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div v-else-if="Array.isArray(element.children)"
                                                         class="container-children">
                                                        <div class="add-child-widget-container children-container-btn">
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
                                                                    >
                                                                        {{ widget.label }}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-for="child in element.children" :key="child.id"
                                                             class="container-child">
                                                            <!-- Text Widget -->
                                                            <div v-if="child.type === 'Text'" class="flutter-text"
                                                                 :style="{
                                                                    fontSize: '16px',
                                                                    fontWeight: 'normal',
                                                                    color: '#000000',
                                                                    textAlign: 'left'
                                                                }">
                                                                {{ child.props.data || 'Text' }}
                                                            </div>

                                                            <!-- TextField Widget -->
                                                            <div v-else-if="child.type === 'TextField'"
                                                                 class="flutter-text-field">
                                                                <div class="text-field-label"
                                                                     v-if="child.props.decoration">
                                                                    Label
                                                                </div>
                                                                <input type="text"
                                                                       placeholder="Enter text"
                                                                       :class="{'text-field-obscured': child.props.obscureText === true}"
                                                                       :disabled="child.props.enabled === false">
                                                            </div>

                                                            <!-- Checkbox Widget -->
                                                            <div v-else-if="child.type === 'Checkbox'"
                                                                 class="flutter-checkbox">
                                                                <input type="checkbox"
                                                                       :checked="child.props.value === true">
                                                                <div class="checkbox-active-color"
                                                                     :style="{ backgroundColor: child.props.activeColor || '#2196F3' }"></div>
                                                            </div>

                                                            <!-- DropdownButton Widget -->
                                                            <div v-else-if="child.type === 'DropdownButton'"
                                                                 class="flutter-dropdown">
                                                                <select>
                                                                    <option v-for="(item, index) in child.props.items"
                                                                            :key="index"
                                                                            :selected="item === child.props.value">
                                                                        {{ item }}
                                                                    </option>
                                                                </select>
                                                            </div>

                                                            <!-- Image Widget -->
                                                            <div v-else-if="child.type === 'Image'"
                                                                 class="flutter-image">
                                                                <img :src="child.props.src"
                                                                     :style="{
                                                                        width: (child.props.width || 150) + 'px',
                                                                        height: (child.props.height || 150) + 'px',
                                                                        objectFit: 'cover'
                                                                    }"
                                                                     alt="Flutter Image">
                                                            </div>

                                                            <!-- Icon Widget -->
                                                            <div v-else-if="child.type === 'Icon'" class="flutter-icon"
                                                                 :style="{
                                                                    color: child.props.color || '#000000',
                                                                    fontSize: (child.props.size || 24) + 'px'
                                                                }">
                                                                <i class="material-icons">star</i>
                                                            </div>

                                                            <!-- TextFormField Widget -->
                                                            <div v-else-if="child.type === 'TextFormField'"
                                                                 class="flutter-text-field">
                                                                <div class="text-field-label"
                                                                     v-if="child.props.decoration">
                                                                    {{ child.props.decoration.includes('labelText') ? 'Label' : ''}}
                                                                    <span class="text-field-hint"
                                                                          v-if="child.props.decoration.includes('hintText')">
                                                                        (Hint: Enter text)
                                                                    </span>
                                                                </div>
                                                                <input type="text"
                                                                       placeholder="Enter text"
                                                                       :class="{'text-field-obscured': child.props.obscureText === true}"
                                                                       :disabled="child.props.enabled === false">
                                                            </div>

                                                            <!-- Form Widget -->
                                                            <div v-else-if="child.type === 'Form'"
                                                                 class="flutter-form droppable-container">
                                                                <div class="form-header">Form</div>
                                                                <div class="form-content">
                                                                    <div
                                                                        v-if="!child.children || !Array.isArray(child.children) || child.children.length === 0"
                                                                        class="form-placeholder">
                                                                        <div class="drop-here-indicator">
                                                                            <span>Form Fields Go Here</span>
                                                                        </div>
                                                                    </div>
                                                                    <div v-else class="form-fields">
                                                                        <div v-for="grandchild in child.children"
                                                                             :key="grandchild.id"
                                                                             class="form-field">
                                                                            <!-- Render form fields recursively -->
                                                                            <div
                                                                                v-if="grandchild.type === 'TextFormField'"
                                                                                class="flutter-text-field">
                                                                                <div class="text-field-label"
                                                                                     v-if="grandchild.props.decoration">
                                                                                    {{ grandchild.props.decoration.includes('labelText') ? 'Label' : ''
                                                                                    }}
                                                                                </div>
                                                                                <input type="text"
                                                                                       placeholder="Enter text"
                                                                                       :class="{'text-field-obscured': grandchild.props.obscureText === true}"
                                                                                       :disabled="grandchild.props.enabled === false">
                                                                            </div>
                                                                            <div v-else class="widget-properties">
                                                                                <div
                                                                                    v-for="(value, key) in grandchild.props"
                                                                                    :key="key"
                                                                                    class="widget-property">
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
                                                            </div>

                                                            <!-- Scaffold Widget -->
                                                            <div v-else-if="child.type === 'Scaffold'"
                                                                 class="flutter-scaffold droppable-container"
                                                                 :style="{ backgroundColor: child.props.backgroundColor || '#FFFFFF' }">
                                                                <div class="scaffold-header">Scaffold</div>
                                                                <div class="scaffold-content">
                                                                    <div
                                                                        v-if="!child.children || !Array.isArray(child.children) || child.children.length === 0"
                                                                        class="scaffold-placeholder">
                                                                        <div class="drop-here-indicator">
                                                                            <span>Scaffold Content Goes Here</span>
                                                                        </div>
                                                                    </div>
                                                                    <div v-else class="scaffold-children">
                                                                        <div v-for="grandchild in child.children"
                                                                             :key="grandchild.id"
                                                                             class="scaffold-child">
                                                                            <!-- Render scaffold children recursively -->
                                                                            <div v-if="grandchild.type === 'AppBar'"
                                                                                 class="flutter-app-bar"
                                                                                 :style="{ backgroundColor: grandchild.props.backgroundColor || '#2196F3' }">
                                                                                <div class="app-bar-title">
                                                                                    {{ grandchild.props.title || 'AppBar Title'
                                                                                    }}
                                                                                </div>
                                                                            </div>
                                                                            <div v-else class="widget-properties">
                                                                                <div
                                                                                    v-for="(value, key) in grandchild.props"
                                                                                    :key="key"
                                                                                    class="widget-property">
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
                                                            </div>

                                                            <!-- AppBar Widget -->
                                                            <div v-else-if="child.type === 'AppBar'"
                                                                 class="flutter-app-bar"
                                                                 :style="{ backgroundColor: child.props.backgroundColor || '#2196F3' }">
                                                                <div class="app-bar-title">
                                                                    {{ child.props.title || 'AppBar Title' }}
                                                                </div>
                                                                <div
                                                                    v-if="child.children && Array.isArray(child.children) && child.children.length > 0"
                                                                    class="app-bar-actions">
                                                                    <div v-for="grandchild in child.children"
                                                                         :key="grandchild.id"
                                                                         class="app-bar-action">
                                                                        <!-- Render app bar actions -->
                                                                        <div class="widget-properties">
                                                                            <div
                                                                                v-for="(value, key) in grandchild.props"
                                                                                :key="key"
                                                                                class="widget-property">
                                                                                <span class="property-name">{{ key
                                                                                    }}:</span>
                                                                                <span class="property-value">{{ value
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
                                                                        v-if="!child.children || !Array.isArray(child.children) || child.children.length === 0"
                                                                        class="center-placeholder">
                                                                        <div class="drop-here-indicator">
                                                                            <span>Centered Content Goes Here</span>
                                                                        </div>
                                                                    </div>
                                                                    <div v-else class="center-children">
                                                                        <div v-for="grandchild in child.children"
                                                                             :key="grandchild.id"
                                                                             class="center-child">
                                                                            <!-- Render centered children -->
                                                                            <div class="widget-properties">
                                                                                <div
                                                                                    v-for="(value, key) in grandchild.props"
                                                                                    :key="key"
                                                                                    class="widget-property">
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
                                                            </div>

                                                            <!-- SizedBox Widget -->
                                                            <div v-else-if="child.type === 'SizedBox'"
                                                                 class="flutter-sized-box droppable-container"
                                                                 :style="{
                                                                    width: (child.props.width || 100) + 'px',
                                                                    height: (child.props.height || 100) + 'px',
                                                                    border: '1px dashed #ccc'
                                                                 }">
                                                                <div
                                                                    v-if="!child.children || !Array.isArray(child.children) || child.children.length === 0"
                                                                    class="sized-box-placeholder">
                                                                    <div class="drop-here-indicator">
                                                                        <span>SizedBox: {{ child.props.width || 100
                                                                            }}x{{ child.props.height || 100 }}</span>
                                                                    </div>
                                                                </div>
                                                                <div v-else class="sized-box-children">
                                                                    <div v-for="grandchild in child.children"
                                                                         :key="grandchild.id"
                                                                         class="sized-box-child">
                                                                        <!-- Render sized box children -->
                                                                        <div class="widget-properties">
                                                                            <div
                                                                                v-for="(value, key) in grandchild.props"
                                                                                :key="key"
                                                                                class="widget-property">
                                                                                <span class="property-name">{{ key
                                                                                    }}:</span>
                                                                                <span class="property-value">{{ value
                                                                                    }}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <!-- Drawer Widget -->
                                                            <div v-else-if="child.type === 'Drawer'"
                                                                 class="flutter-drawer droppable-container"
                                                                 :style="{
                                                                    backgroundColor: child.props.backgroundColor || '#FFFFFF',
                                                                    width: (child.props.width || 300) + 'px',
                                                                    boxShadow: `0 0 ${child.props.elevation || 16}px rgba(0,0,0,0.3)`
                                                                 }">
                                                                <div class="drawer-header">Drawer</div>
                                                                <div class="drawer-content">
                                                                    <div
                                                                        v-if="!child.children || !Array.isArray(child.children) || child.children.length === 0"
                                                                        class="drawer-placeholder">
                                                                        <div class="drop-here-indicator">
                                                                            <span>Drawer Content Goes Here</span>
                                                                        </div>
                                                                    </div>
                                                                    <div v-else class="drawer-children">
                                                                        <div v-for="grandchild in child.children"
                                                                             :key="grandchild.id"
                                                                             class="drawer-child">
                                                                            <!-- Render drawer children recursively -->
                                                                            <div class="widget-properties">
                                                                                <div
                                                                                    v-for="(value, key) in grandchild.props"
                                                                                    :key="key"
                                                                                    class="widget-property">
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
                                                            </div>

                                                            <!-- Card Widget -->
                                                            <div v-else-if="child.type === 'Card'"
                                                                 class="flutter-card droppable-container"
                                                                 :style="{
                                                                    backgroundColor: child.props.color || '#FFFFFF',
                                                                    boxShadow: `0 0 ${child.props.elevation || 1}px rgba(0,0,0,0.3)`,
                                                                    margin: child.props.margin || '8px',
                                                                    borderRadius: '4px'
                                                                 }">
                                                                <div
                                                                    v-if="!child.children || !Array.isArray(child.children) || child.children.length === 0"
                                                                    class="card-placeholder">
                                                                    <div class="drop-here-indicator">
                                                                        <span>Card Content Goes Here</span>
                                                                    </div>
                                                                </div>
                                                                <div v-else class="card-children">
                                                                    <div v-for="grandchild in child.children"
                                                                         :key="grandchild.id"
                                                                         class="card-child">
                                                                        <!-- Render card children recursively -->
                                                                        <div class="widget-properties">
                                                                            <div
                                                                                v-for="(value, key) in grandchild.props"
                                                                                :key="key"
                                                                                class="widget-property">
                                                                                <span class="property-name">{{ key
                                                                                    }}:</span>
                                                                                <span class="property-value">{{ value
                                                                                    }}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <!-- ListTile Widget -->
                                                            <div v-else-if="child.type === 'ListTile'"
                                                                 class="flutter-list-tile"
                                                                 :class="{ 'list-tile-disabled': child.props.enabled === false }">
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
                                                            <div v-else-if="child.type === 'FloatingActionButton'"
                                                                 class="flutter-fab"
                                                                 :style="{
                                                                    backgroundColor: child.props.backgroundColor || '#2196F3',
                                                                    color: child.props.foregroundColor || '#FFFFFF',
                                                                    boxShadow: `0 0 ${child.props.elevation || 6}px rgba(0,0,0,0.3)`,
                                                                    width: child.props.mini ? '40px' : '56px',
                                                                    height: child.props.mini ? '40px' : '56px'
                                                                 }"
                                                                 :title="child.props.tooltip || 'Floating Action Button'">
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
                                                        alignItems: 'center'
                                                    }"
                                                     @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                     @drop.prevent="$event.currentTarget?.classList.remove('dragover')">
                                                    <div
                                                        v-if="!element.children || !Array.isArray(element.children) || element.children.length === 0"
                                                        class="row-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                                                                 fill="none" viewBox="0 0 24 24"
                                                                 stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                      stroke-width="2" d="M9 5l7 7-7 7" />
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
                                                                    >
                                                                        {{ widget.label }}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div v-else-if="Array.isArray(element.children)"
                                                         class="row-children">
                                                        <div class="add-child-widget-container children-container-btn">
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
                                                                    >
                                                                        {{ widget.label }}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-for="child in element.children" :key="child.id"
                                                             class="row-child">
                                                            <!-- Text Widget -->
                                                            <div v-if="child.type === 'Text'" class="flutter-text"
                                                                 :style="{
                                                                    fontSize: '16px',
                                                                    fontWeight: 'normal',
                                                                    color: '#000000',
                                                                    textAlign: 'left'
                                                                }">
                                                                {{ child.props.data || 'Text' }}
                                                            </div>

                                                            <!-- TextField Widget -->
                                                            <div v-else-if="child.type === 'TextField'"
                                                                 class="flutter-text-field">
                                                                <div class="text-field-label"
                                                                     v-if="child.props.decoration">
                                                                    Label
                                                                </div>
                                                                <input type="text"
                                                                       placeholder="Enter text"
                                                                       :class="{'text-field-obscured': child.props.obscureText === true}"
                                                                       :disabled="child.props.enabled === false">
                                                            </div>

                                                            <!-- Checkbox Widget -->
                                                            <div v-else-if="child.type === 'Checkbox'"
                                                                 class="flutter-checkbox">
                                                                <input type="checkbox"
                                                                       :checked="child.props.value === true">
                                                                <div class="checkbox-active-color"
                                                                     :style="{ backgroundColor: child.props.activeColor || '#2196F3' }"></div>
                                                            </div>

                                                            <!-- DropdownButton Widget -->
                                                            <div v-else-if="child.type === 'DropdownButton'"
                                                                 class="flutter-dropdown">
                                                                <select>
                                                                    <option v-for="(item, index) in child.props.items"
                                                                            :key="index"
                                                                            :selected="item === child.props.value">
                                                                        {{ item }}
                                                                    </option>
                                                                </select>
                                                            </div>

                                                            <!-- Image Widget -->
                                                            <div v-else-if="child.type === 'Image'"
                                                                 class="flutter-image">
                                                                <img :src="child.props.src"
                                                                     :style="{
                                                                        width: (child.props.width || 150) + 'px',
                                                                        height: (child.props.height || 150) + 'px',
                                                                        objectFit: 'cover'
                                                                    }"
                                                                     alt="Flutter Image">
                                                            </div>

                                                            <!-- Icon Widget -->
                                                            <div v-else-if="child.type === 'Icon'" class="flutter-icon"
                                                                 :style="{
                                                                    color: child.props.color || '#000000',
                                                                    fontSize: (child.props.size || 24) + 'px'
                                                                }">
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
                                                        alignItems: 'center'
                                                    }"
                                                     @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                     @drop.prevent="$event.currentTarget?.classList.remove('dragover')">
                                                    <div
                                                        v-if="!element.children || !Array.isArray(element.children) || element.children.length === 0"
                                                        class="column-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                                                                 fill="none" viewBox="0 0 24 24"
                                                                 stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                      stroke-width="2"
                                                                      d="M19 9l-7 7-7-7" />
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
                                                                    >
                                                                        {{ widget.label }}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div v-else-if="Array.isArray(element.children)"
                                                         class="column-children">
                                                        <div class="add-child-widget-container children-container-btn">
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
                                                                    >
                                                                        {{ widget.label }}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-for="child in element.children" :key="child.id"
                                                             class="column-child">
                                                            <!-- Text Widget -->
                                                            <div v-if="child.type === 'Text'" class="flutter-text"
                                                                 :style="{
                                                                    fontSize: '16px',
                                                                    fontWeight: 'normal',
                                                                    color: '#000000',
                                                                    textAlign: 'left'
                                                                }">
                                                                {{ child.props.data || 'Text' }}
                                                            </div>

                                                            <!-- TextField Widget -->
                                                            <div v-else-if="child.type === 'TextField'"
                                                                 class="flutter-text-field">
                                                                <div class="text-field-label"
                                                                     v-if="child.props.decoration">
                                                                    Label
                                                                </div>
                                                                <input type="text"
                                                                       placeholder="Enter text"
                                                                       :class="{'text-field-obscured': child.props.obscureText === true}"
                                                                       :disabled="child.props.enabled === false">
                                                            </div>

                                                            <!-- Checkbox Widget -->
                                                            <div v-else-if="child.type === 'Checkbox'"
                                                                 class="flutter-checkbox">
                                                                <input type="checkbox"
                                                                       :checked="child.props.value === true">
                                                                <div class="checkbox-active-color"
                                                                     :style="{ backgroundColor: child.props.activeColor || '#2196F3' }"></div>
                                                            </div>

                                                            <!-- DropdownButton Widget -->
                                                            <div v-else-if="child.type === 'DropdownButton'"
                                                                 class="flutter-dropdown">
                                                                <select>
                                                                    <option v-for="(item, index) in child.props.items"
                                                                            :key="index"
                                                                            :selected="item === child.props.value">
                                                                        {{ item }}
                                                                    </option>
                                                                </select>
                                                            </div>

                                                            <!-- Image Widget -->
                                                            <div v-else-if="child.type === 'Image'"
                                                                 class="flutter-image">
                                                                <img :src="child.props.src"
                                                                     :style="{
                                                                        width: (child.props.width || 150) + 'px',
                                                                        height: (child.props.height || 150) + 'px',
                                                                        objectFit: 'cover'
                                                                    }"
                                                                     alt="Flutter Image">
                                                            </div>

                                                            <!-- Icon Widget -->
                                                            <div v-else-if="child.type === 'Icon'" class="flutter-icon"
                                                                 :style="{
                                                                    color: child.props.color || '#000000',
                                                                    fontSize: (child.props.size || 24) + 'px'
                                                                }">
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
                                                <div v-else-if="element.type === 'DropdownButton'"
                                                     class="flutter-dropdown">
                                                    <select>
                                                        <option v-for="(item, index) in element.props.items"
                                                                :key="index"
                                                                :selected="item === element.props.value">
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
                                                        borderRadius: '4px'
                                                    }"
                                                     @dragenter.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragover.prevent="$event.currentTarget?.classList.add('dragover')"
                                                     @dragleave.prevent="$event.currentTarget?.classList.remove('dragover')"
                                                     @drop.prevent="$event.currentTarget?.classList.remove('dragover')">
                                                    <div
                                                        v-if="!element.children || !Array.isArray(element.children) || element.children.length === 0"
                                                        class="scroll-placeholder">
                                                        <div class="drop-here-indicator">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                                                                 fill="none" viewBox="0 0 24 24"
                                                                 stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                      stroke-width="2"
                                                                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                                        @click.stop="addChildWidget(element.id, widget.type); showAddChildMenu = null"
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
                                                            <th v-for="(column, index) in element.props.columns"
                                                                :key="index"
                                                                class="p-2 text-left"
                                                                :style="{ border: element.props.border ? '1px solid #ddd' : 'none' }">
                                                                {{ column }}
                                                            </th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr v-for="row in parseInt(element.props.rows)" :key="row">
                                                            <td v-for="(column, index) in element.props.columns"
                                                                :key="index"
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
                                                        <h3 class="text-lg font-semibold">
                                                            {{ element.props.title || 'Card Title' }}</h3>
                                                        <p class="text-sm text-gray-600">
                                                            {{ element.props.subtitle || 'Card Subtitle' }}</p>
                                                    </div>
                                                    <div class="card-content p-3">
                                                        <p>{{
                                                                element.props.content || 'Card content goes here with more details about the item.'
                                                            }}</p>
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

                                            <!-- Nested children if any -->
                                            <div
                                                v-if="element.children && Array.isArray(element.children) && element.children.length > 0"
                                                class="widget-children">
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
                                                                <div v-if="child.type === 'Text'"
                                                                     class="child-widget-content">
                                                                    {{ child.props.data || 'Text' }}
                                                                </div>
                                                                <!-- TextField preview -->
                                                                <div v-else-if="child.type === 'TextField'"
                                                                     class="child-widget-content">
                                                                    <div class="mini-input-preview">Input Field</div>
                                                                </div>
                                                                <!-- Container preview -->
                                                                <div
                                                                    v-else-if="['Container', 'Row', 'Column'].includes(child.type)"
                                                                    class="child-widget-content">
                                                                    <div class="mini-container-preview">{{ child.type }}
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

                    <!-- Flutter code display -->
                    <div v-if="showFlutterCode" class="bg-gray-800 text-white p-4 rounded-md">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-medium">Código Flutter</h3>
                            <div class="flex gap-2">
                                <button
                                    @click="downloadFlutterProject"
                                    class="px-2 py-1 bg-green-600 rounded hover:bg-green-700 text-sm text-white"
                                >
                                    Descargar Proyecto
                                </button>
                                <button
                                    @click="copyFlutterCode"
                                    class="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                                >
                                    Copiar
                                </button>
                            </div>
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
                                v-if="typeof value === 'string' && !(availableWidgets.find((w : any) => w.type === selectedWidget.type)?.properties.find((p : any) => p.name === key)?.type === 'select')"
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
                            <div
                                v-else-if="availableWidgets.find((w : any) => w.type === selectedWidget.type)?.properties.find((p : any) => p.name === key)?.type === 'color'"
                                class="flex items-center gap-2">
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
                                v-else-if="availableWidgets.find((w : any) => w.type === selectedWidget.type)?.properties.find((p : any) => p.name === key)?.type === 'select'"
                                v-model="selectedWidget.props[key]"
                                class="px-3 py-2 border rounded-md"
                                @change="updateWidgetProperty(key, selectedWidget.props[key])"
                            >
                                <option
                                    v-for="option in availableWidgets.find((w: any) => w.type === selectedWidget.type)?.properties.find((p: any) => p.name === key)?.options"
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.051l.311.093c1.135.34 2.345.34 3.48 0l.312-.093a2.25 2.25 0 001.357-2.051V3.104M18 14.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-1.5a2.25 2.25 0 012.25-2.25h7.5z" />
                    </svg>
                </button>

                <!-- Regular Chat Button -->
                <button
                    @click="toggleFloatingChat"
                    class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600"
                    :class="{'animate-pulse': chatMessages.length > 0 && !showFloatingChat, 'bg-blue-600': showFloatingChat}"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            </div>

            <!-- Floating Chat Window -->
            <ChatColaborativo
                :showFloatingChat="showFloatingChat"
                :chatMessages="chatMessages"
                :chatTyping="chatTyping"
                :chatMessage="chatMessage"
                :currentUser="currentUser"
                @toggleFloatingChat="toggleFloatingChat"
                @sendChatMessage="sendChatMessage"
                @onChatInput="onChatInput"
            />
            <!-- AI Chat Window -->
            <div v-if="showAIChat"
                 class="fixed bottom-20 right-4 z-50 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col">
                <!-- AI Chat Header -->
                <div class="bg-purple-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
                    <h3 class="font-semibold">Asistente IA para Flutter</h3>
                    <button @click="toggleAIChat" class="text-white hover:text-gray-200 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>

                <!-- AI Chat Messages -->
                <div class="flex-1 overflow-y-auto p-4">
                    <div v-if="aiMessages.length === 0" class="text-gray-500 text-center py-4">
                        <p>Bienvenido al asistente IA para Flutter.</p>
                        <p class="mt-2">Describe la interfaz que deseas crear y la IA generará los widgets
                            correspondientes.</p>
                        <p class="mt-2 text-xs">Ejemplo: "Crea un formulario flutter para login con campos para email y
                            contraseña, y un botón
                            para iniciar sesión"</p>
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
                            <div class="font-semibold text-xs"
                                 :class="msg.isUser ? 'text-purple-600' : 'text-gray-600'">
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

</style>
