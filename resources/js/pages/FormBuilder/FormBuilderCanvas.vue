<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue';
import draggable from 'vuedraggable';
import { io } from 'socket.io-client';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getSocketConfig, toggleSocketEnvironment } from '@/lib/socketConfig';
import type { BreadcrumbItem } from '@/types';
import type { FormBuilder } from '@/types/FormBuilder';
import type { User } from '@types/User';

// Props
const props = defineProps({
    formBuilder: {
        type: Object as () => FormBuilder,
        required: true,
    },
    user: {
        type: Object as () => User,
        required: true,
    },
    creador: {
        type: Object as () => User,
        required: true,
    },
    isCreador:{
        type: Boolean,
        default: false,
    },
    colaboradores:{
        type: Array as () => User[],
        default: () => [],
    },
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Editar Formulario ID: ' + props.formBuilder.id,
        href: '/form-builder/' + props.formBuilder.id + '/editar',
    },
];

// Socket.io connection
const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
const socketConfig = ref(getSocketConfig(useLocalSocket.value));
const socket = io(socketConfig.value.url, socketConfig.value.options);
const socketConnected = ref(false);
const socketError = ref('');
const roomId = ref('room-'+props.formBuilder?.id);
const form_builder_id = ref(props.formBuilder?.id); // Dynamic room ID based on form ID
const user_id = ref(props.user?.id);
const currentUser = ref(props.user.name);

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

// Form elements
const formElements = ref(
    Array.isArray(props.formBuilder.elements)
        ? props.formBuilder.elements
        : typeof props.formBuilder.elements === 'string'
            ? JSON.parse(props.formBuilder.elements || '[]')
            : []
);

const formName = ref(props.formBuilder?.name || 'Form Default');

const availableElements = ref([
    {
        type: 'h1',
        props: {
            text: 'Heading 1',
            label: 'Heading 1',
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '32px',
            fontWeight: 'bold',
            textColor: '#000000',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: '0px',
            borderRadius: '0px',
            padding: '8px'
        }
    },
    {
        type: 'h2',
        props: {
            text: 'Heading 2',
            label: 'Heading 2',
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '24px',
            fontWeight: 'bold',
            textColor: '#000000',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: '0px',
            borderRadius: '0px',
            padding: '8px'
        }
    },
    {
        type: 'h3',
        props: {
            text: 'Heading 3',
            label: 'Heading 3',
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '20px',
            fontWeight: 'bold',
            textColor: '#000000',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: '0px',
            borderRadius: '0px',
            padding: '8px'
        }
    },
    {
        type: 'label',
        props: {
            text: 'Label Text',
            label: 'Label',
            for: '',
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: '0px',
            borderRadius: '0px',
            padding: '8px'
        }
    },
    {
        type: 'div',
        props: {
            content: 'Div Content',
            label: 'Div Container',
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#f8f9fa',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '16px'
        }
    },
    {
        type: 'span',
        props: {
            text: 'Span Text',
            label: 'Span',
            // Style properties
            width: 'auto',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: '0px',
            borderRadius: '0px',
            padding: '0px'
        }
    },
    {
        type: 'input',
        props: {
            placeholder: 'Text Input',
            type: 'text',
            label: 'Text Input',
            required: false,
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px'
        }
    },
    {
        type: 'select',
        props: {
            options: ['Option 1', 'Option 2', 'Option 3'],
            label: 'Select',
            required: false,
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px'
        }
    },
    {
        type: 'textarea',
        props: {
            placeholder: 'Text Area',
            label: 'Text Area',
            required: false,
            // Style properties
            width: '100%',
            height: '100px',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px'
        }
    },
    {
        type: 'checkbox',
        props: {
            label: 'Checkbox',
            checked: false,
            // Style properties
            width: 'auto',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '4px'
        }
    },
    {
        type: 'radio',
        props: {
            options: ['Option 1', 'Option 2'],
            label: 'Radio Group',
            // Style properties
            width: 'auto',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '50%',
            padding: '4px'
        }
    },
    {
        type: 'number',
        props: {
            placeholder: 'Number Input',
            label: 'Number',
            min: 0,
            max: 100,
            required: false,
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px'
        }
    },
    {
        type: 'date',
        props: {
            label: 'Date',
            required: false,
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px'
        }
    },
    {
        type: 'button',
        props: {
            text: 'Button',
            variant: 'primary',
            // Style properties
            width: 'auto',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'bold',
            textColor: '#ffffff',
            backgroundColor: '#007bff',
            borderColor: '#007bff',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px 16px'
        }
    },
    {
        type: 'table',
        props: {
            label: 'Table',
            rows: 3,
            columns: 3,
            headers: ['Header 1', 'Header 2', 'Header 3'],
            data: [
                ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
                ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
            ],
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px',
            headerBackgroundColor: '#f8f9fa',
            headerTextColor: '#212529'
        }
    },
    {
        type: 'menu',
        props: {
            label: 'Menu',
            items: ['Item 1', 'Item 2', 'Item 3'],
            orientation: 'horizontal', // horizontal or vertical
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#f8f9fa',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '8px',
            hoverBackgroundColor: '#e9ecef',
            hoverTextColor: '#000000'
        }
    },
    {
        type: 'card',
        props: {
            label: 'Card',
            title: 'Card Title',
            content: 'This is a card content. You can edit this text.',
            hasFooter: true,
            footerText: 'Card Footer',
            // Style properties
            width: '100%',
            height: 'auto',
            fontSize: '16px',
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: '1px',
            borderRadius: '4px',
            padding: '16px',
            headerBackgroundColor: '#f8f9fa',
            footerBackgroundColor: '#f8f9fa'
        }
    },
]);

// Image upload and scanning
const uploadedImage = ref(null);
const isProcessingImage = ref(false);
const showImageUpload = ref(false);
const imagePreview = ref('');
const scanResults = ref(null);

// Selected element for editing
const selectedElement = ref(null);

// Collaboration status
// const collaborators = ref<User>([]);
const collaborators = ref<User[]>(props.colaboradores);
const onlineCollaborators = ref<User[]>([]);
const isTyping = ref({});
const inviteEmail = ref('');
const showInviteForm = ref(false);
const showInviteLink = ref(false);
const inviteLink = ref('');

// Whiteboard activity notifications
const recentActivities = ref([]);
const collaboratorActivities = ref({});
const showActivityNotifications = ref(true);
const showCurrentUserActivities = ref(false);

// Floating chat
const showFloatingChat = ref(false);
const chatMessages = ref<Array<{text: string, user: string, timestamp: number}>>([]);
const chatMessage = ref('');
const chatTyping = reactive({
    typing: '',
});
// Only show chat for collaborators, not for the creator
const showChatButton = computed(() => !isCreator.value || collaborators.value.length > 0);

// Check if currentuser is the creator
const isCreator = computed(() => props.isCreador);

// Save form to database
const updateForm = async () => {
    // Check if the current user is the creator of the project
    // Update existing form
    const response = await axios.put(`/form-builder/${props.formBuilder.id}`, {
        name: formName.value,
        elements: JSON.stringify(formElements.value),
    });
    if(response.status !== 200) {
        Swal.fire({
            title: '¡Error!',
            text: 'No se pudo guardar el formulario',
            icon: 'error',
        });
        return false;
    }

    // Also emit the formUpdate event with saveToDatabase: true to ensure all clients have the latest data
    socket.emit('formUpdate', {
        elements: formElements.value,
        roomId: roomId.value,
        user: currentUser.value,
        action: 'save',
        saveToDatabase: true, // Explicitly set to save to database
        formBuilderId: props.formBuilder?.id, // Add formBuilderId to help server find the correct FormBuilder
    });

    Swal.fire({
        title: '¡Guardado!',
        text: 'El formulario ha sido guardado exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
    });
    return true;
};

// Define saveForm function for backward compatibility
const saveForm = async () => {
    return await updateForm();
};

// Load collaborators
const loadCollaborators = async () => {
    if (!props.formBuilder) return;

    try {
        const response = await axios.get(`/form-builder/${props.formBuilder.id}/collaborators`);
        // Add showActivities property to each collaborator for UI toggle
        collaborators.value = response.data.map((collaborator : User) => ({
            ...collaborator,
            showActivities: false,
        }));
    } catch (error) {
        console.error('Error al cargar colaboradores:', error);
    }
};

// Cargar actividades de pizarra anteriores
const loadWhiteboardActivities = async () => {
    if (!props.formBuilder?.id) return;

    try {
        const response = await axios.get(`/whiteboard/form/${props.formBuilder.id}/activities`);

        // Process activities if needed
        const activities = response.data;

        if (activities.length > 0) {
            // Show notification about previous activities
            Swal.fire({
                title: 'Actividades Previas',
                text: `Se cargaron ${activities.length} actividades previas para este formulario.`,
                icon: 'info',
                timer: 3000,
                showConfirmButton: false,
            });

            // You could display these activities in a UI component
            // For now, we'll just log them to the console
            console.log('Previous whiteboard activities:', activities);
        }
    } catch (error : any) {
        console.error('Error loading whiteboard activities:', error);
        if (error.response?.status === 403) {
            Swal.fire({
                title: 'Acceso Denegado',
                text: 'No tienes acceso a las actividades de este formulario.',
                icon: 'error',
            });
        }
    }
};

// Invite a collaborator
const inviteCollaborator = async () => {
    if (!props.formBuilder?.id) {
        // Save the form first if it's new
        const savedForm = await saveForm();
        if (!savedForm) {
            Swal.fire({
                title: '¡Error!',
                text: 'Por favor guarda el formulario antes de invitar colaboradores',
                icon: 'error',
            });
            return;
        }
    }

    try {
        await axios.post(`/form-builder/${props.formBuilder?.id}/invite`, {
            email: inviteEmail.value,
        });

        Swal.fire({
            title: '¡Éxito!',
            text: `Invitación enviada a ${inviteEmail.value}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });

        inviteEmail.value = '';
        showInviteForm.value = false;
    } catch (error : any) {
        Swal.fire({
            title: 'Error!',
            text: error.response?.data?.message || 'Error sending invitation',
            icon: 'error',
        });
    }
};

// Generate invitation link
const generateInviteLink = () => {
    showInviteLink.value = !showInviteLink.value;
    inviteLink.value = `${window.location.origin}/form-builder/${props.formBuilder.id}/invite`;
};

// Function to copy text to clipboard
const copyToClipboard = (text : string, successMessage = '¡Texto copiado al portapapeles!') => {
    // Try using the Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                Swal.fire({
                    title: '¡Éxito!',
                    text: successMessage,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            })
            .catch((err) => {
                console.error('Error al usar la API del portapapeles: ', err);
                // Fallback to execCommand method
                fallbackCopyToClipboard(text, successMessage);
            });
    } else {
        // Fallback for browsers that don't support the Clipboard API
        fallbackCopyToClipboard(text, successMessage);
    }
};

// Fallback method using execCommand
const fallbackCopyToClipboard = (text : string, successMessage) => {
    try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;

        // Make the textarea out of viewport
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        // Execute the copy command
        const successful = document.execCommand('copy');

        // Remove the temporary element
        document.body.removeChild(textarea);

        if (successful) {
            Swal.fire({
                title: '¡Éxito!',
                text: successMessage,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
            });
        } else {
            throw new Error('Copy command was unsuccessful');
        }
    } catch (err : any) {
        console.error('Fallback copy method failed: ', err);
        Swal.fire({
            title: '¡Error!',
            text: 'No se pudo copiar el texto. Intente usar Ctrl+C.',
            icon: 'error',
        });
    }
};

// Copy invitation link to clipboard
const copyInviteLink = () => {
    copyToClipboard(inviteLink.value, '¡Enlace copiado al portapapeles!');
};

// Handle image upload
const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.match('image.*')) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, selecciona una imagen válida',
            icon: 'error',
        });
        return;
    }

    uploadedImage.value = file;

    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
        showImageUpload.value = true;
    };
    reader.readAsDataURL(file);
};

// Process the uploaded image
const processImage = async () => {
    if (!uploadedImage.value) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, sube una imagen primero',
            icon: 'error',
        });
        return;
    }

    isProcessingImage.value = true;

    try {
        // Create form data for upload
        const formData = new FormData();
        formData.append('image', uploadedImage.value);

        // Send image to backend for processing
        const response = await axios.post('/form-builder/scan-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Store scan results
        scanResults.value = response.data;

        // Convert scan results to form elements
        convertScanResultsToFormElements();

        Swal.fire({
            title: '¡Éxito!',
            text: 'Imagen procesada correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });
    } catch (error) {
        console.error('Error processing image:', error);
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al procesar la imagen',
            icon: 'error',
        });
    } finally {
        isProcessingImage.value = false;
    }
};

// Convert scan results to form elements
const convertScanResultsToFormElements = () => {
    if (!scanResults.value || !scanResults.value.elements) return;

    // Add detected elements to the form
    scanResults.value.elements.forEach((element) => {
        // Add a unique ID to each element
        const newElement = {
            ...element,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
        };
        formElements.value.push(newElement);
    });

    // Show success notification with details
    Swal.fire({
        title: '¡Formulario Detectado!',
        text: `Se han detectado ${scanResults.value.elements.length} elementos en la imagen.`,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
    });

    // Close the image upload section
    showImageUpload.value = false;

    // Update the form
    updateElement('add');
};

// Generate Angular code
const generateAngularCode = () => {
    // Create separate code sections for HTML, CSS, and TypeScript
    let htmlCode = `<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<div class="container">
  <div class="row">
    <div class="col-12 col-md-10 col-lg-8 mx-auto">
      <form [formGroup]="formGroup" (ngSubmit)="onSubmit()" class="needs-validation">\n`;

    formElements.value.forEach((element) => {
        switch (element.type) {
            case 'input':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label for="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" class="col-sm-12 col-md-4 col-form-label">${element.props.label}${element.props.required ? ' *' : ''}</label>\n`;
                htmlCode += `          <div class="col-sm-12 col-md-8">\n`;
                // Generate inline style string
                const inputStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                htmlCode += `            <input type="${element.props.type}" class="form-control custom-input-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" id="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" formControlName="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" placeholder="${element.props.placeholder}"${element.props.required ? ' required' : ''} ${inputStyle}>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'select':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label for="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" class="col-sm-12 col-md-4 col-form-label">${element.props.label}${element.props.required ? ' *' : ''}</label>\n`;
                htmlCode += `          <div class="col-sm-12 col-md-8">\n`;
                // Generate inline style string
                const selectStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                htmlCode += `            <select class="form-select custom-select-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" id="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" formControlName="${element.props.label.toLowerCase().replace(/\s+/g, '-')}"${element.props.required ? ' required' : ''} ${selectStyle}>\n`;
                element.props.options.forEach((option) => {
                    htmlCode += `              <option value="${option}">${option}</option>\n`;
                });
                htmlCode += `            </select>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'textarea':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label for="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" class="col-sm-12 col-md-4 col-form-label">${element.props.label}${element.props.required ? ' *' : ''}</label>\n`;
                htmlCode += `          <div class="col-sm-12 col-md-8">\n`;
                // Generate inline style string
                const textareaStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                htmlCode += `            <textarea class="form-control custom-textarea-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" id="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" formControlName="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" placeholder="${element.props.placeholder}" rows="3"${element.props.required ? ' required' : ''} ${textareaStyle}></textarea>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'checkbox':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12 offset-md-4 col-md-8">\n`;
                htmlCode += `            <div class="form-check">\n`;
                // Generate inline style string
                const checkboxStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                htmlCode += `              <input type="checkbox" class="form-check-input custom-checkbox-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" id="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" formControlName="${element.props.label.toLowerCase().replace(/\s+/g, '-')}"${element.props.checked ? ' checked' : ''} ${checkboxStyle}>\n`;
                htmlCode += `              <label class="form-check-label" for="${element.props.label.toLowerCase().replace(/\s+/g, '-')}">${element.props.label}</label>\n`;
                htmlCode += `            </div>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'radio':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label class="col-sm-12 col-md-4 col-form-label">${element.props.label}</label>\n`;
                htmlCode += `          <div class="col-sm-12 col-md-8">\n`;
                element.props.options.forEach((option, index) => {
                    htmlCode += `            <div class="form-check">\n`;
                    // Generate inline style string
                    const radioStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                    htmlCode += `              <input type="radio" class="form-check-input custom-radio-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" id="${element.props.label.toLowerCase().replace(/\s+/g, '-')}-${index}" formControlName="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" value="${option}" ${radioStyle}>\n`;
                    htmlCode += `              <label class="form-check-label" for="${element.props.label.toLowerCase().replace(/\s+/g, '-')}-${index}">${option}</label>\n`;
                    htmlCode += `            </div>\n`;
                });
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'number':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label for="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" class="col-sm-12 col-md-4 col-form-label">${element.props.label}${element.props.required ? ' *' : ''}</label>\n`;
                htmlCode += `          <div class="col-sm-12 col-md-8">\n`;
                // Generate inline style string
                const numberStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                htmlCode += `            <input type="number" class="form-control custom-number-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" id="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" formControlName="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" placeholder="${element.props.placeholder}" min="${element.props.min}" max="${element.props.max}"${element.props.required ? ' required' : ''} ${numberStyle}>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'date':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label for="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" class="col-sm-12 col-md-4 col-form-label">${element.props.label}${element.props.required ? ' *' : ''}</label>\n`;
                htmlCode += `          <div class="col-sm-12 col-md-8">\n`;
                // Generate inline style string
                const dateStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                htmlCode += `            <input type="date" class="form-control custom-date-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" id="${element.props.label.toLowerCase().replace(/\s+/g, '-')}" formControlName="${element.props.label.toLowerCase().replace(/\s+/g, '-')}"${element.props.required ? ' required' : ''} ${dateStyle}>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'button':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12 offset-md-4 col-md-8">\n`;
                // Generate inline style string
                const buttonStyle = `style="width: ${element.props.width}; height: ${element.props.height}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};"`;
                htmlCode += `            <button type="submit" class="btn btn-${element.props.variant} custom-button-${element.props.text.toLowerCase().replace(/\s+/g, '-')}" ${buttonStyle}>${element.props.text}</button>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'table':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label class="col-sm-12 col-form-label">${element.props.label}</label>\n`;
                htmlCode += `          <div class="col-sm-12">\n`;
                // Generate inline style string for the table
                const tableStyle = `style="width: ${element.props.width}; font-size: ${element.props.fontSize}; color: ${element.props.textColor}; border-color: ${element.props.borderColor}; border-width: ${element.props.borderWidth}; border-radius: ${element.props.borderRadius};"`;
                htmlCode += `            <table class="table table-bordered custom-table-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" ${tableStyle}>\n`;

                // Table header
                htmlCode += `              <thead style="background-color: ${element.props.headerBackgroundColor}; color: ${element.props.headerTextColor};">\n`;
                htmlCode += `                <tr>\n`;
                element.props.headers.forEach(header => {
                    htmlCode += `                  <th>${header}</th>\n`;
                });
                htmlCode += `                </tr>\n`;
                htmlCode += `              </thead>\n`;

                // Table body
                htmlCode += `              <tbody style="background-color: ${element.props.backgroundColor};">\n`;
                element.props.data.forEach(row => {
                    htmlCode += `                <tr>\n`;
                    row.forEach(cell => {
                        htmlCode += `                  <td>${cell}</td>\n`;
                    });
                    htmlCode += `                </tr>\n`;
                });
                htmlCode += `              </tbody>\n`;
                htmlCode += `            </table>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'menu':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label class="col-sm-12 col-form-label">${element.props.label}</label>\n`;
                htmlCode += `          <div class="col-sm-12">\n`;

                // Generate menu based on orientation
                if (element.props.orientation === 'horizontal') {
                    // Horizontal menu (navbar)
                    htmlCode += `            <nav class="navbar navbar-expand-lg custom-menu-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="background-color: ${element.props.backgroundColor}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius};">\n`;
                    htmlCode += `              <div class="container-fluid">\n`;
                    htmlCode += `                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">\n`;
                    htmlCode += `                  <span class="navbar-toggler-icon"></span>\n`;
                    htmlCode += `                </button>\n`;
                    htmlCode += `                <div class="collapse navbar-collapse" id="navbarNav">\n`;
                    htmlCode += `                  <ul class="navbar-nav">\n`;

                    element.props.items.forEach(item => {
                        htmlCode += `                    <li class="nav-item">\n`;
                        htmlCode += `                      <a class="nav-link" href="#" style="color: ${element.props.textColor}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; padding: ${element.props.padding};">${item}</a>\n`;
                        htmlCode += `                    </li>\n`;
                    });

                    htmlCode += `                  </ul>\n`;
                    htmlCode += `                </div>\n`;
                    htmlCode += `              </div>\n`;
                    htmlCode += `            </nav>\n`;
                } else {
                    // Vertical menu (list group)
                    htmlCode += `            <div class="list-group custom-menu-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="width: ${element.props.width}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius};">\n`;

                    element.props.items.forEach(item => {
                        htmlCode += `              <a href="#" class="list-group-item list-group-item-action" style="background-color: ${element.props.backgroundColor}; color: ${element.props.textColor}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; padding: ${element.props.padding};">${item}</a>\n`;
                    });

                    htmlCode += `            </div>\n`;
                }

                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'card':
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <label class="col-sm-12 col-form-label">${element.props.label}</label>\n`;
                htmlCode += `          <div class="col-sm-12">\n`;

                // Generate card component
                htmlCode += `            <div class="card custom-card-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="width: ${element.props.width}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius}; background-color: ${element.props.backgroundColor}; color: ${element.props.textColor};">\n`;

                // Card header
                htmlCode += `              <div class="card-header" style="background-color: ${element.props.headerBackgroundColor}; font-weight: ${element.props.fontWeight}; font-size: ${element.props.fontSize};">${element.props.title}</div>\n`;

                // Card body
                htmlCode += `              <div class="card-body" style="padding: ${element.props.padding};">\n`;
                htmlCode += `                <p class="card-text">${element.props.content}</p>\n`;
                htmlCode += `              </div>\n`;

                // Card footer (if enabled)
                if (element.props.hasFooter) {
                    htmlCode += `              <div class="card-footer" style="background-color: ${element.props.footerBackgroundColor};">${element.props.footerText}</div>\n`;
                }

                htmlCode += `            </div>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'h1':
                // Generate h1 component
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12">\n`;
                htmlCode += `            <h1 class="custom-h1-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="width: ${element.props.width}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};">${element.props.text}</h1>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'h2':
                // Generate h2 component
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12">\n`;
                htmlCode += `            <h2 class="custom-h2-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="width: ${element.props.width}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};">${element.props.text}</h2>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'h3':
                // Generate h3 component
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12">\n`;
                htmlCode += `            <h3 class="custom-h3-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="width: ${element.props.width}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};">${element.props.text}</h3>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'label':
                // Generate label component
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12">\n`;
                htmlCode += `            <label class="custom-label-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" for="${element.props.for}" style="width: ${element.props.width}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};">${element.props.text}</label>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'div':
                // Generate div component
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12">\n`;
                htmlCode += `            <div class="custom-div-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="width: ${element.props.width}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};">${element.props.content}</div>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
            case 'span':
                // Generate span component
                htmlCode += `        <div class="mb-3 row">\n`;
                htmlCode += `          <div class="col-sm-12">\n`;
                htmlCode += `            <span class="custom-span-${element.props.label.toLowerCase().replace(/\s+/g, '-')}" style="width: ${element.props.width}; font-size: ${element.props.fontSize}; font-weight: ${element.props.fontWeight}; color: ${element.props.textColor}; background-color: ${element.props.backgroundColor}; border: ${element.props.borderWidth} solid ${element.props.borderColor}; border-radius: ${element.props.borderRadius}; padding: ${element.props.padding};">${element.props.text}</span>\n`;
                htmlCode += `          </div>\n`;
                htmlCode += `        </div>\n`;
                break;
        }
    });

    htmlCode += `      </form>
    </div>
  </div>
</div>`;

    // CSS code
    let cssCode = `/* Responsive form styles */
form {
  max-width: 100%;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .form-group label {
    margin-bottom: 0.5rem;
  }
}

input.form-control, select.form-control, textarea.form-control {
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

button.btn {
  display: inline-block;
  font-weight: 400;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover {
  color: #fff;
  background-color: #0069d9;
  border-color: #0062cc;
}

/* Custom element styles */`;

    // Add custom CSS for each element
    formElements.value.forEach((element) => {
        const elementId = element.type === 'button'
            ? element.props.text.toLowerCase().replace(/\s+/g, '-')
            : element.props.label.toLowerCase().replace(/\s+/g, '-');

        let selector = '';
        switch (element.type) {
            case 'input':
                selector = `.custom-input-${elementId}`;
                break;
            case 'select':
                selector = `.custom-select-${elementId}`;
                break;
            case 'textarea':
                selector = `.custom-textarea-${elementId}`;
                break;
            case 'checkbox':
                selector = `.custom-checkbox-${elementId}`;
                break;
            case 'radio':
                selector = `.custom-radio-${elementId}`;
                break;
            case 'number':
                selector = `.custom-number-${elementId}`;
                break;
            case 'date':
                selector = `.custom-date-${elementId}`;
                break;
            case 'button':
                selector = `.custom-button-${elementId}`;
                break;
        }

        if (selector) {
            cssCode += `

${selector} {
  width: ${element.props.width};
  height: ${element.props.height};
  font-size: ${element.props.fontSize};
  font-weight: ${element.props.fontWeight};
  color: ${element.props.textColor};
  background-color: ${element.props.backgroundColor};
  border-color: ${element.props.borderColor};
  border-width: ${element.props.borderWidth};
  border-radius: ${element.props.borderRadius};
  padding: ${element.props.padding};
}`;
        }
    });

    // TypeScript code
    let tsCode = `import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-${formName.value.toLowerCase().replace(/\s+/g, '-')}',
  templateUrl: './${formName.value.toLowerCase().replace(/\s+/g, '-')}.component.html',
  styleUrls: ['./${formName.value.toLowerCase().replace(/\s+/g, '-')}.component.css']
})
export class ${formName.value.replace(/\s+/g, '')}Component implements OnInit {
  formGroup!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.formGroup = this.fb.group({`;

    formElements.value.forEach((element, index) => {
        if (element.type !== 'button') {
            const fieldName = element.props.label.toLowerCase().replace(/\s+/g, '-');
            tsCode += `
      '${fieldName}': [${element.type === 'checkbox' ? element.props.checked : "''"}${element.props.required ? ', Validators.required' : ''}]${index < formElements.value.length - 1 ? ',' : ''}`;
        }
    });

    tsCode += `
    });
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      console.log(this.formGroup.value);
      // Submit form data to your API
    }
  }
}`;

    return {
        html: htmlCode,
        css: cssCode,
        typescript: tsCode,
        all: `${htmlCode}\n\n${cssCode}\n\n${tsCode}`,
    };
};

// Computed properties for Angular code
const angularCodeObj = computed(() => generateAngularCode());
const htmlCode = computed(() => angularCodeObj.value.html);
const cssCode = computed(() => angularCodeObj.value.css);
const tsCode = computed(() => angularCodeObj.value.typescript);
const allCode = computed(() => angularCodeObj.value.all);

// Active code tab
const activeCodeTab = ref('html');

// Export modal state
const showExportModal = ref(false);

// Function to export Angular code
const exportAngularCode = () => {
    showExportModal.value = true;
};

// Function to download code as file
const downloadCode = (code, filename : string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Generate Angular project files
const generateAngularProjectFiles = () => {
    const baseName = formName.value.toLowerCase().replace(/\s+/g, '-');
    const componentName = formName.value.replace(/\s+/g, '');

    // package.json
    const packageJson = `{
  "name": "${baseName}-app",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^16.1.0",
    "@angular/common": "^16.1.0",
    "@angular/compiler": "^16.1.0",
    "@angular/core": "^16.1.0",
    "@angular/forms": "^16.1.0",
    "@angular/platform-browser": "^16.1.0",
    "@angular/platform-browser-dynamic": "^16.1.0",
    "@angular/router": "^16.1.0",
    "bootstrap": "^5.3.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.13.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^16.1.4",
    "@angular/cli": "~16.1.4",
    "@angular/compiler-cli": "^16.1.0",
    "@types/jasmine": "~4.3.0",
    "jasmine-core": "~4.6.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.1.3"
  }
}`;

    // angular.json
    const angularJson = `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "${baseName}-app": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/${baseName}-app",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": [
              "zone.js"
            ],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "src/styles.css"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "browserTarget": "${baseName}-app:build:production"
            },
            "development": {
              "browserTarget": "${baseName}-app:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "browserTarget": "${baseName}-app:build"
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": [
              "zone.js",
              "zone.js/testing"
            ],
            "tsConfig": "tsconfig.spec.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}`;

    // tsconfig.json
    const tsConfigJson = `{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": [
      "ES2022",
      "dom"
    ]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}`;

    // tsconfig.app.json
    const tsConfigAppJson = `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}`;

    // tsconfig.spec.json
    const tsConfigSpecJson = `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}`;

    // main.ts
    const mainTs = `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;

    // app.module.ts
    const appModuleTs = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ${componentName}Component } from './components/${baseName}/${baseName}.component';

@NgModule({
  declarations: [
    AppComponent,
    ${componentName}Component
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
`;

    // app.component.ts
    const appComponentTs = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="container mt-4">
      <h1>${formName.value}</h1>
      <app-${baseName}></app-${baseName}>
    </div>
  \`,
  styles: []
})
export class AppComponent {
  title = '${formName.value}';
}
`;

    // index.html
    const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${formName.value}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`;

    // styles.css
    const stylesCss = `/* You can add global styles to this file, and also import other style files */
html, body {
  height: 100%;
}
body {
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}
`;

    // README.md with instructions
    const readmeMd = `# ${formName.value} Angular Project

This project was generated with Angular CLI.

## Setup Instructions

1. Install Node.js and npm if you haven't already (https://nodejs.org/)
2. Install Angular CLI globally:
   \`\`\`
   npm install -g @angular/cli
   \`\`\`
3. Create a new folder for your project and place all the downloaded files in the correct structure:
   \`\`\`
   my-project/
   ├── src/
   │   ├── app/
   │   │   ├── components/
   │   │   │   └── ${baseName}/
   │   │   │       ├── ${baseName}.component.html
   │   │   │       ├── ${baseName}.component.css
   │   │   │       └── ${baseName}.component.ts
   │   │   ├── app.component.ts
   │   │   └── app.module.ts
   │   ├── assets/
   │   ├── index.html
   │   ├── main.ts
   │   └── styles.css
   ├── angular.json
   ├── package.json
   ├── tsconfig.json
   ├── tsconfig.app.json
   └── tsconfig.spec.json
   \`\`\`
4. Open a terminal in the project folder and run:
   \`\`\`
   npm install
   \`\`\`
5. Start the development server:
   \`\`\`
   ng serve
   \`\`\`
6. Open your browser and navigate to \`http://localhost:4200/\`

## Build

Run \`ng build\` to build the project. The build artifacts will be stored in the \`dist/\` directory.
`;

    return {
        packageJson,
        angularJson,
        tsConfigJson,
        tsConfigAppJson,
        tsConfigSpecJson,
        mainTs,
        appModuleTs,
        appComponentTs,
        indexHtml,
        stylesCss,
        readmeMd
    };
};

// Download all files as a zip
const downloadAllFiles = async () => {
    // Show loading message
    Swal.fire({
        title: 'Creando archivo ZIP...',
        text: 'Por favor espera mientras se genera el archivo ZIP con todos los archivos del proyecto.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Dynamically load JSZip from CDN
        const JSZip = await loadJSZip();

        // Create a new ZIP file
        const zip = new JSZip();

        // Create filenames based on form name
        const baseName = formName.value.toLowerCase().replace(/\s+/g, '-');
        console.log("Base name for files:", baseName);

        // Generate project files
        const projectFiles = generateAngularProjectFiles();

        // Add component files to the zip in the correct directory
        const componentsDir = zip.folder("src/app/components/" + baseName);
        componentsDir.file(`${baseName}.component.html`, htmlCode.value);
        componentsDir.file(`${baseName}.component.css`, cssCode.value);
        componentsDir.file(`${baseName}.component.ts`, tsCode.value);

        // Add root project files
        zip.file("package.json", projectFiles.packageJson);
        zip.file("angular.json", projectFiles.angularJson);
        zip.file("tsconfig.json", projectFiles.tsConfigJson);
        zip.file("tsconfig.app.json", projectFiles.tsConfigAppJson);
        zip.file("tsconfig.spec.json", projectFiles.tsConfigSpecJson);
        zip.file("README.md", projectFiles.readmeMd);

        // Add src files
        const srcFolder = zip.folder("src");
        srcFolder.file("main.ts", projectFiles.mainTs);
        srcFolder.file("index.html", projectFiles.indexHtml);
        srcFolder.file("styles.css", projectFiles.stylesCss);

        // Add app files
        const appFolder = zip.folder("src/app");
        appFolder.file("app.module.ts", projectFiles.appModuleTs);
        appFolder.file("app.component.ts", projectFiles.appComponentTs);

        // Generate the ZIP file
        const content = await zip.generateAsync({ type: "blob" });

        // Download the ZIP file
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}-angular-project.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        Swal.fire({
            title: '¡Proyecto Angular Descargado!',
            html: `
                <div class="text-left">
                    <p>El archivo ZIP con todos los archivos del proyecto Angular ha sido descargado.</p>
                    <p class="mt-2"><strong>Próximos pasos:</strong></p>
                    <ol class="text-left pl-4 list-decimal">
                        <li>Descomprime el archivo ZIP en una carpeta para tu proyecto</li>
                        <li>Abre una terminal en la carpeta del proyecto</li>
                        <li>Ejecuta <code>npm install</code> para instalar las dependencias</li>
                        <li>Ejecuta <code>ng serve</code> para iniciar el servidor de desarrollo</li>
                    </ol>
                    <p class="mt-2">Consulta el archivo README.md para instrucciones detalladas.</p>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'Entendido',
            width: '500px',
        });
    } catch (error : any) {
        console.error("Error creating ZIP file:", error);
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al crear el archivo ZIP. Por favor, inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
};

// Function to dynamically load JSZip from CDN
const loadJSZip = () => {
    return new Promise((resolve, reject) => {
        // Check if JSZip is already loaded
        if (window.JSZip) {
            resolve(window.JSZip);
            return;
        }

        // Create script element to load JSZip
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';

        script.onload = () => {
            // JSZip loaded successfully
            resolve(window.JSZip);
        };

        script.onerror = () => {
            // Failed to load JSZip
            reject(new Error('Failed to load JSZip library'));
        };

        // Add script to document
        document.head.appendChild(script);
    });
};

// Select element for editing
const selectElement = (element) => {
    selectedElement.value = element;
    socket.emit('typing', { user: currentUser.value, roomId: roomId.value });
};

// Update element properties
const updateElement = async (action = 'update') => {
    console.log(`updateElement called with action: ${action}`);
    console.log(`Current room: ${roomId.value}, Current user: ${currentUser.value}`);

    // Ensure action is a string
    const actionString = typeof action === 'string' ? action : 'update';

    // Emit the change to other users
    console.log('Emitting formUpdate event');
    socket.emit('formUpdate', {
        elements: formElements.value,
        roomId: roomId.value,
        user: currentUser.value,
        action: actionString,
        saveToDatabase: true, // Always save to database
        formBuilderId: props.formBuilder?.id, // Add formBuilderId to help server find the correct FormBuilder
    });
    console.log('formUpdate event emitted');

    // We don't save the form on every change anymore
    // This will be done manually by clicking the Save button

    // Log whiteboard activity if we have a form ID
    if (props.formBuilder?.id) {
        try {
            // Determine action type and description
            const actionType = actionString;
            let description = '';

            switch (actionString) {
                case 'add':
                    description = `${currentUser.value} agregó un nuevo elemento`;
                    break;
                case 'remove':
                    description = `${currentUser.value} eliminó un elemento`;
                    break;
                case 'update':
                default:
                    description = `${currentUser.value} actualizó el formulario`;
                    break;
            }

            // Create activity object
            const timestamp = Date.now();
            const newActivity = {
                user: currentUser.value,
                action: actionType,
                description: description,
                timestamp: timestamp,
            };

            try {
                // Log the activity
                await axios.post('/whiteboard/activity', {
                    form_id: props.formBuilder.id,
                    action_type: actionType,
                    action_data: JSON.stringify(formElements.value),
                    description: description,
                });
            } catch (activityError) {
                console.error('Error logging whiteboard activity:', activityError);

                // Handle different types of errors
                if (activityError.response) {
                    switch (activityError.response.status) {
                        case 401:
                            // Authentication error
                            Swal.fire({
                                title: 'Sesión expirada',
                                text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.',
                                icon: 'warning',
                                confirmButtonText: 'Entendido'
                            });
                            break;
                        case 422:
                            // Validation error
                            let errorMessage = 'Error de validación al guardar la actividad.';
                            if (activityError.response.data && activityError.response.data.errors) {
                                // Extract validation error messages
                                const errors = Object.values(activityError.response.data.errors).flat();
                                if (errors.length > 0) {
                                    errorMessage = errors.join('\n');
                                }
                            }
                            console.warn('Validation error details:', errorMessage);
                            // Don't show alert for validation errors to avoid disrupting the user experience
                            break;
                        case 403:
                            // Authorization error
                            Swal.fire({
                                title: 'Acceso denegado',
                                text: 'No tienes permiso para realizar esta acción.',
                                icon: 'error',
                                confirmButtonText: 'Entendido'
                            });
                            break;
                        default:
                            // Other server errors
                            console.warn(`Server error (${activityError.response.status}):`, activityError.response.data);
                            // Don't show alert for other errors to avoid disrupting the user experience
                    }
                } else if (activityError.request) {
                    // Network error
                    console.warn('Network error - no response received:', activityError.request);
                } else {
                    // Other errors
                    console.warn('Error setting up request:', activityError.message);
                }
                // Continue execution even if logging fails
            }

            // Emit activity notification to other users
            socket.emit('whiteboardActivity', {
                user: currentUser.value,
                roomId: roomId.value,
                action: actionType,
                description: description,
                timestamp: timestamp,
            });

            // Also update local activities for current user
            // Add to recent activities
            recentActivities.value.unshift(newActivity);

            // Keep only the 10 most recent activities
            if (recentActivities.value.length > 10) {
                recentActivities.value.pop();
            }

            // Add to collaborator-specific activities for current user
            if (!collaboratorActivities.value[currentUser.value]) {
                collaboratorActivities.value[currentUser.value] = [];
            }

            // Add activity to the current user
            collaboratorActivities.value[currentUser.value].unshift(newActivity);

            // Keep only the 5 most recent activities per collaborator
            if (collaboratorActivities.value[currentUser.value].length > 5) {
                collaboratorActivities.value[currentUser.value].pop();
            }
        } catch (error) {
            console.error('Error logging whiteboard activity:', error);
        }
    }
};

// Handle form name change
const handleFormNameChange = () => {
    socket.emit('formNameChange', {
        name: formName.value,
        formBuilderId: form_builder_id.value,
        roomId: roomId.value,
        userId: props.user.id,
        user: currentUser.value
    });
};

// Function to print the current page
const printPage = () => {
    window.print();
}

const goToBack = () => {
    router.get('/form-builder', {}, { preserveState: false });
}

// Function to add a new row to a table component
const addNewTableRow = () => {
    if (selectedElement.value && selectedElement.value.type === 'table') {
        const headerCount = selectedElement.value.props.headers.length;
        const rowCount = selectedElement.value.props.data.length;

        // Create a new row with cells matching the number of headers
        const newRow = Array(headerCount).fill('').map((_, i) => `Fila ${rowCount + 1}, Celda ${i + 1}`);

        // Add the new row to the table data
        selectedElement.value.props.data.push(newRow);

        // Update the element
        updateElement();
    }
};

// Toggle floating chat visibility
const toggleFloatingChat = () => {
    showFloatingChat.value = !showFloatingChat.value;

    // If opening the chat and we have a form ID, load messages
    if (showFloatingChat.value && props.formBuilder?.id) {
        loadChatMessages();
    }
};

// Load chat messages for the current form
const loadChatMessages = async () => {
    if (!props.formBuilder?.id) return;

    try {
        const response = await axios.get(`/chat/form/${props.formBuilder.id}/messages`);

        // Convert database messages to the format expected by the UI
        const dbMessages = response.data.map(msg => ({
            text: msg.message,
            user: msg.user.name,
            timestamp: new Date(msg.created_at).getTime(),
            isSystemMessage: msg.is_system_message
        }));

        // Add messages to the messages array
        chatMessages.value = dbMessages;
    } catch (error) {
        console.error('Error loading chat messages:', error);
        if (error.response?.status === 403) {
            Swal.fire({
                title: 'Acceso Denegado',
                text: 'No tienes acceso al chat de este formulario.',
                icon: 'error'
            });
        }
    }
};

// Send a chat message
const sendChatMessage = async () => {
    if (chatMessage.value.trim()) {
        const timestamp = Date.now();
        const messageData = {
            text: chatMessage.value,
            user: currentUser.value,
            timestamp: timestamp,
            roomId: roomId.value
        };

        // Emit message to socket for real-time updates
        socket.emit('chatMessage', messageData);

        // Add message to local messages array
        chatMessages.value.push({
            text: chatMessage.value,
            user: currentUser.value,
            timestamp: timestamp
        });

        // Save message to database
        try {
            await axios.post('/chat/message', {
                form_id: props.formBuilder.id,
                message: chatMessage.value,
                is_system_message: false
            });
        } catch (error) {
            console.error('Error saving chat message:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar el mensaje. Inténtalo de nuevo.',
                icon: 'error',
                timer: 3000,
                showConfirmButton: false
            });
        }

        // Clear the input field
        chatMessage.value = '';
    }
};

// Handle typing in the chat input
const onChatInput = () => {
    socket.emit('escribiendo', {
        user: currentUser.value,
        roomId: roomId.value
    });
};
// Socket.io event handlers
onMounted(() => {
    // Set up socket connection event handlers
    socket.on('connect', () => {
        console.log('Socket connected');
        console.log(`Socket ID: ${socket.id}`);
        console.log(`Socket URL: ${socketConfig.value.url}`);
        console.log(`Using local socket: ${useLocalSocket.value}`);
        socketConnected.value = true;
        socketError.value = '';
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        console.error(`Error details: ${err.message}`);
        console.error(`Socket URL: ${socketConfig.value.url}`);
        console.error(`Using local socket: ${useLocalSocket.value}`);
        socketConnected.value = false;
        socketError.value = `Connection error: ${err.message}`;
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        console.log(`Socket ID: ${socket.id}`);
        console.log(`Socket URL: ${socketConfig.value.url}`);
        socketConnected.value = false;
        if (reason === 'io server disconnect') {
            // the disconnection was initiated by the server, reconnect manually
            console.log('Attempting to reconnect...');
            socket.connect();
        }
    });

    // Load collaborators and whiteboard activities if we have a form ID
    if (props.formBuilder?.id) {
        loadCollaborators();
        loadWhiteboardActivities();
    }

    // Join the room
    socket.emit('joinRoom', {
        formBuilderId: props.formBuilder.id,
        roomId: roomId.value,
        userId: props.user.id,
        user: currentUser.value });

    // Listen for form updates
    socket.on('formUpdate', (data) => {
        console.log(data);
        console.log(`Recibido el formulario de actualización de ${data.user} in proy ${data.roomId}, action: ${data.action}`);
        if (data.user !== currentUser.value) {
            console.log('Actualización de elementos del formulario con los datos recibidos');
            formElements.value = data.elements;
            console.log('Elementos del formulario actualizados exitosamente');
        } else {
            console.log('Ignorando formUpdate desde si mismo');
        }
    });

    // Listen for form name changes
    socket.on('formNameChange', (data) => {
        console.log("escuchando cambio : ", data);
        console.log("userActual: ", currentUser.value);
        if (data.user !== currentUser.value) {
            formName.value = data.name;
        }
    });

    // Listen for typing events
    socket.on('typing', (data) => {
        if (data.user !== currentUser.value) {
            isTyping.value[data.user] = true;
            setTimeout(() => {
                isTyping.value[data.user] = false;
            }, 3000);
        }
    });

    // Listen for user join/leave events
    socket.on('userJoined', (data) => {
        collaborators.value.push(data.user);
    });

    socket.on('userLeft', (data) => {
        const index = collaborators.value.indexOf(data.user);
        if (index !== -1) {
            collaborators.value.splice(index, 1);
        }
    });

    // Get current users in the room
    socket.on('roomUsers', (data) => {
        // Update online collaborators list
        onlineCollaborators.value = data.users.filter((user : string) => user !== props.user.name);

        // Keep the database collaborators list
        collaborators.value = collaborators.value;
    });

    // Listen for whiteboard activity events
    socket.on('whiteboardActivity', (data) => {
        if (data.user !== currentUser.value) {
            // Add to recent activities
            const newActivity = {
                user: data.user,
                action: data.action,
                description: data.description,
                timestamp: data.timestamp,
            };

            recentActivities.value.unshift(newActivity);

            // Keep only the 10 most recent activities
            if (recentActivities.value.length > 10) {
                recentActivities.value.pop();
            }

            // Add to collaborator-specific activities
            if (!collaboratorActivities.value[data.user]) {
                collaboratorActivities.value[data.user] = [];
            }

            // Add activity to the specific collaborator
            collaboratorActivities.value[data.user].unshift(newActivity);

            // Keep only the 5 most recent activities per collaborator
            if (collaboratorActivities.value[data.user].length > 5) {
                collaboratorActivities.value[data.user].pop();
            }

            // Show notification if enabled
            if (showActivityNotifications.value) {
                Swal.fire({
                    title: 'Actividad en la Pizarra',
                    text: data.description,
                    icon: 'info',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                });
            }
        }
    });

    // Listen for chat messages
    socket.on('chatMessage', (data) => {
        console.log('Received chat message:', data);
        // Only add messages for the current room
        if (data.roomId === roomId.value && data.user !== currentUser.value) {
            chatMessages.value.push({
                text: data.text,
                user: data.user,
                timestamp: data.timestamp
            });

            // Show notification if chat is not open
            if (!showFloatingChat.value) {
                Swal.fire({
                    title: 'Nuevo mensaje',
                    text: `${data.user}: ${data.text}`,
                    icon: 'info',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                });
            }
        }
    });

    // Listen for typing events
    socket.on('escribiendo', (data) => {
        console.log('Usuario escribiendo:', data);
        // Only show typing indicator for the current room
        if (data.roomId === roomId.value && data.user !== currentUser.value) {
            chatTyping.typing = data.user + ' está escribiendo...';
            setTimeout(() => {
                chatTyping.typing = '';
            }, 4000);
        }
    });

    // Listen for collaborator acceptance events
    socket.on('collaboratorAccepted', (data) => {
        console.log('Colaborador aceptado:', data);
        // Only process events for the current room
        if (data.roomId === roomId.value) {
            // Reload the collaborators list to get the updated list
            loadCollaborators();

            // Show a notification
            Swal.fire({
                title: '¡Nuevo Colaborador!',
                text: `${data.user} ha aceptado la invitación y ahora es colaborador del proyecto.`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
        }
    });
});

onUnmounted(() => {
    // Leave the room
    socket.emit('leaveRoom', { roomId: roomId.value, user: currentUser.value });

    // Disconnect socket events
    socket.off('formUpdate');
    socket.off('formNameChange');
    socket.off('typing');
    socket.off('userJoined');
    socket.off('userLeft');
    socket.off('roomUsers');
    socket.off('whiteboardActivity');
    socket.off('chatMessage');
    socket.off('escribiendo');
    socket.off('collaboratorAccepted');
});
</script>

<template>
    <Head title="Editar Formulario" />
    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="p-3">
            <!-- Back Button when editing a form -->
            <div class="flex mt-2 mb-2 items-center justify-between">
                <button
                    @click="goToBack"
                    class="text-blue-500 hover:underline"
                >
                    &larr; Regresar al listado
                </button>
                <div class="flex items-center space-x-2">
                        <span v-if="socketConnected" class="flex items-center text-xs text-green-400">
                            <span class="mr-1 inline-block h-2 w-2 rounded-full bg-green-400"></span>
                            Conectado a {{ useLocalSocket ? 'Local' : 'Producción' }}
                        </span>
                    <span v-else class="flex items-center text-xs text-red-400">
                            <span class="mr-1 inline-block h-2 w-2 rounded-full bg-red-400"></span>
                            Desconectado
                        </span>
                    <button
                        @click="toggleSocketServer"
                        class="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
                        title="Cambiar entre servidores socket local y de producción"
                    >
                        Cambiar a {{ useLocalSocket ? 'Producción' : 'Local' }}
                    </button>
                </div>
            </div>
            <!-- Navbar -->
<!--            <div class="rounded-lg bg-gray-800 px-4 py-2 text-white">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-400">ID: {{ props.formBuilder.id }}</span>
                        &lt;!&ndash; File Menu &ndash;&gt;
                        <div class="group relative">
                            <button class="rounded px-3 py-1 hover:bg-gray-700">Archivo</button>
                            <div class="absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-lg bg-white text-gray-800 shadow-lg group-hover:block">
                                <div class="py-1">
                                    <button v-if="isCreator" @click="saveForm" class="block w-full px-4 py-2 text-left hover:bg-gray-100">
                                        Guardar
                                    </button>
                                    <button @click="printPage" class="block w-full px-4 py-2 text-left hover:bg-gray-100">Imprimir</button>
                                    <button @click="exportAngularCode" class="block w-full px-4 py-2 text-left hover:bg-gray-100">
                                        Exportar Proyecto Angular
                                    </button>
                                    <button
                                        @click="goToBack"
                                        class="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                    >
                                        Salir
                                    </button>
                                </div>
                            </div>
                        </div>

                        &lt;!&ndash; Edit Menu &ndash;&gt;
                        <div class="group relative">
                            <button class="rounded px-3 py-1 hover:bg-gray-700">Editar</button>
                            <div class="absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-lg bg-white text-gray-800 shadow-lg group-hover:block">
                                <div class="py-1">
                                    <button
                                        v-if="isCreator"
                                        @click="
                                            formElements.pop();
                                            updateElement('remove');
                                        "
                                        class="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                    >
                                        Eliminar Último Elemento
                                    </button>
                                    <button
                                        v-if="isCreator"
                                        @click="
                                            formElements = [];
                                            updateElement('clear');
                                        "
                                        class="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                    >
                                        Limpiar Todo
                                    </button>
                                </div>
                            </div>
                        </div>

                        &lt;!&ndash; View Menu &ndash;&gt;
                        <div class="group relative">
                            <button class="rounded px-3 py-1 hover:bg-gray-700">Ver</button>
                            <div class="absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-lg bg-white text-gray-800 shadow-lg group-hover:block">
                                <div class="py-1">
                                    <button
                                        v-if="isCreator"
                                        @click="showInviteForm = !showInviteForm"
                                        class="block w-full px-4 py-2 text-left hover:bg-gray-100"
                                    >
                                        Mostrar Formulario de Invitación
                                    </button>
                                    <button v-if="isCreator" @click="generateInviteLink" class="block w-full px-4 py-2 text-left hover:bg-gray-100">
                                        Generar Enlace de Invitación
                                    </button>
                                </div>
                            </div>
                        </div>

                        &lt;!&ndash; Help Menu &ndash;&gt;
                        <div class="group relative">
                            <button class="rounded px-3 py-1 hover:bg-gray-700">Ayuda</button>
                            <div class="absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-lg bg-white text-gray-800 shadow-lg group-hover:block">
                                <div class="py-1">
                                    <button class="block w-full px-4 py-2 text-left hover:bg-gray-100">Documentación</button>
                                    <button class="block w-full px-4 py-2 text-left hover:bg-gray-100">Acerca de</button>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>-->
            <div class="rounded-lg bg-white p-4 shadow-md md:p-6">
                <!-- Toolbar -->
                <div class="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-100 p-2">
                    <div class="flex-1">
                        <input
                            v-if="isCreator"
                            v-model="formName"
                            class="w-full rounded border border-gray-300 px-2 py-1 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            @input="handleFormNameChange"
                            placeholder="Nombre del proyecto"
                        />
                        <div v-else class="px-2 py-1 text-lg font-bold">
                            {{ formName }}
                        </div>
                    </div>
                    <div class="mx-2 h-6 border-l border-gray-300"></div>
                    <button v-if="isCreator" @click="updateForm" class="flex items-center rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                            />
                        </svg>
                        Guardar Cambios
                    </button>
<!--                    <button
                        v-if="isCreator && props.formBuilder?.id"
                        @click="showInviteForm = !showInviteForm"
                        class="flex items-center rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                        </svg>
                        Invitar
                    </button>-->
                    <button
                        v-if="isCreator"
                        @click="generateInviteLink"
                        class="flex items-center rounded bg-purple-500 px-3 py-1 text-white hover:bg-purple-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
                            />
                        </svg>
                        Generar Enlace
                    </button>
<!--                    <button
                        @click="showImageUpload = !showImageUpload"
                        class="flex items-center rounded bg-amber-500 px-3 py-1 text-white hover:bg-amber-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Escanear Imagen
                    </button>
                    <button
                        @click="exportAngularCode"
                        class="flex items-center rounded bg-cyan-500 px-3 py-1 text-white hover:bg-cyan-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Exportar codigo
                    </button>-->
                    <button
                        @click="downloadAllFiles"
                        class="flex items-center rounded bg-cyan-500 px-3 py-1 text-white hover:bg-cyan-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Descargar Proyecto ZIP
                    </button>
                </div>

                <!-- Image Upload Section -->
                <div v-if="showImageUpload" class="mb-4 rounded-lg bg-gray-100 p-4">
                    <h3 class="mb-2 text-lg font-semibold">Escanear Imagen de Formulario</h3>
                    <p class="mb-4 text-sm text-gray-600">
                        Sube una imagen de un formulario dibujado a mano y la convertiremos en un formulario digital.
                    </p>

                    <div class="flex flex-col space-y-4">
                        <!-- Image Upload Input -->
                        <div class="flex items-center space-x-2">
                            <input type="file" accept="image/*" @change="handleImageUpload" class="hidden" id="image-upload" />
                            <label for="image-upload" class="cursor-pointer rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                                Seleccionar Imagen
                            </label>
                            <span v-if="uploadedImage" class="text-sm text-gray-600">
                                {{ uploadedImage.name }}
                            </span>
                        </div>

                        <!-- Image Preview -->
                        <div v-if="imagePreview" class="mt-4">
                            <h4 class="text-md mb-2 font-medium">Vista Previa:</h4>
                            <div class="rounded-lg border border-gray-300 bg-white p-2">
                                <img :src="imagePreview" alt="Vista previa" class="mx-auto max-h-64" />
                            </div>
                        </div>

                        <!-- Process Button -->
                        <div class="flex justify-end">
                            <button
                                @click="processImage"
                                class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                                :disabled="!uploadedImage || isProcessingImage"
                            >
                                <span v-if="isProcessingImage">Procesando...</span>
                                <span v-else>Procesar Imagen</span>
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Socket connection status for errors -->
                <div v-if="socketError" class="mb-4 rounded-lg bg-red-100 p-2 text-red-700">Error de conexión: {{ socketError }}</div>
                <!-- Invite Form -->
                <div v-if="isCreator && showInviteForm" class="mb-4 rounded-lg bg-gray-100 p-4">
                    <h3 class="mb-2 text-lg font-semibold">Invitar Colaborador</h3>
                    <div class="flex space-x-2">
                        <input
                            v-model="inviteEmail"
                            type="email"
                            placeholder="Ingresa dirección de correo"
                            class="flex-1 rounded border border-gray-300 p-2"
                        />
                        <button @click="inviteCollaborator" class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
                            Enviar Invitación
                        </button>
                    </div>
                </div>
                <!-- Invitation Link -->
                <div v-if="isCreator && showInviteLink" class="mb-4 rounded-lg bg-gray-100 p-4">
                    <h3 class="mb-2 text-lg font-semibold">Enlace de Invitación</h3>
                    <div class="flex space-x-2">
                        <input v-model="inviteLink" type="text" readonly class="flex-1 rounded border border-gray-300 bg-white p-2" />
                        <button @click="copyInviteLink" class="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600">Copiar Enlace</button>
                    </div>
                    <p class="mt-2 text-sm text-gray-600">
                        Comparte este enlace con cualquier persona que quieras invitar a colaborar en este formulario.
                    </p>
                </div>
                <div class="w-full flex justify-between gap-4">
                    <!-- Collaborators -->
                    <div class="mb-4">
                        <div class="mb-2 flex items-center justify-between">
                            <h3 class="text-lg font-semibold">Colaboradores: </h3>
                        </div>

                        <!-- Current User (You) -->
                        <div class="mb-4">
                            <h4 class="mb-1 text-sm font-medium text-gray-700">Tú:</h4>
                            <div class="rounded-lg border bg-white p-2 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <!-- Online status indicator (always online) -->
                                        <span class="mr-2 inline-block h-3 w-3 rounded-full bg-green-500" title="En línea"></span>

                                        <!-- User name -->
                                        <span class="font-medium">{{ props.user.name }} (Tú)</span>

                                        <!-- Typing indicator -->
                                        <span v-if="isTyping[user_id.value]" class="ml-2 text-xs italic text-green-600"> (escribiendo...) </span>
                                    </div>

                                    <!-- Expand/collapse button for activities -->
                                    <button
                                        @click="showCurrentUserActivities = !showCurrentUserActivities"
                                        class="text-gray-500 hover:text-gray-700"
                                        v-if="collaboratorActivities[user_id.value] && collaboratorActivities[currentUser.value].length > 0"
                                    >
                                        <span v-if="!showCurrentUserActivities">▼</span>
                                        <span v-else>▲</span>
                                    </button>
                                </div>

                                <!-- User activities (collapsible) -->
                                <div
                                    v-if="
                                    showCurrentUserActivities &&
                                    collaboratorActivities[currentUser.value] &&
                                    collaboratorActivities[currentUser.value].length > 0
                                "
                                    class="mt-2 border-l-2 border-gray-200 pl-5"
                                >
                                    <h5 class="mb-1 text-xs font-medium text-gray-600">Tus actividades recientes:</h5>
                                    <ul class="space-y-1">
                                        <li
                                            v-for="(activity, index) in collaboratorActivities[currentUser.value]"
                                            :key="index"
                                            class="text-xs text-gray-600"
                                        >
                                            <div class="flex justify-between">
                                                <span>{{ activity.description }}</span>
                                                <span class="text-gray-400">{{ new Date(activity.timestamp).toLocaleTimeString() }}</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- All Collaborators with Status -->
                        <div v-if="collaborators.length > 0" class="mb-2">
                            <h4 class="mb-1 text-sm font-medium text-gray-700">Colaboradores:</h4>
                            <div class="space-y-2">
                                <div v-for="user in collaborators" :key="user.id" class="rounded-lg border bg-white p-2 shadow-sm">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <!-- Online status indicator -->
                                            <span
                                                class="mr-2 inline-block h-3 w-3 rounded-full"
                                                :class="{
                                                    'bg-green-500': onlineCollaborators.includes(user.id),
                                                    'bg-gray-400': !onlineCollaborators.includes(user.id),
                                                }"
                                                :title="onlineCollaborators.includes(user.id) ? 'En línea' : 'Desconectado'"
                                            ></span>

                                            <!-- User name -->
                                            <span class="font-medium">{{ user.name || user.email }}</span>

                                            <!-- Typing indicator -->
                                            <span v-if="isTyping[user.name || user.email]" class="ml-2 text-xs italic text-green-600">
                                            (escribiendo...)
                                        </span>
                                        </div>

                                        <!-- Expand/collapse button for activities -->
                                        <button
                                            @click="user.showActivities = !user.showActivities"
                                            class="text-gray-500 hover:text-gray-700"
                                            v-if="
                                            collaboratorActivities[user.name || user.email] &&
                                            collaboratorActivities[user.name || user.email].length > 0
                                        "
                                        >
                                            <span v-if="!user.showActivities">▼</span>
                                            <span v-else>▲</span>
                                        </button>
                                    </div>

                                    <!-- User activities (collapsible) -->
                                    <div
                                        v-if="
                                        user.showActivities &&
                                        collaboratorActivities[user.name || user.email] &&
                                        collaboratorActivities[user.name || user.email].length > 0
                                    "
                                        class="mt-2 border-l-2 border-gray-200 pl-5"
                                    >
                                        <h5 class="mb-1 text-xs font-medium text-gray-600">Actividades recientes:</h5>
                                        <ul class="space-y-1">
                                            <li
                                                v-for="(activity, index) in collaboratorActivities[user.name || user.email]"
                                                :key="index"
                                                class="text-xs text-gray-600"
                                            >
                                                <div class="flex justify-between">
                                                    <span>{{ activity.description }}</span>
                                                    <span class="text-gray-400">{{ new Date(activity.timestamp).toLocaleTimeString() }}</span>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Real-time Collaborators (not in database) -->
                        <div
                            v-if="onlineCollaborators.filter((user) => !collaborators.some((c) => (c.name || c.email) === user)).length > 0"
                            class="mb-2"
                        >
                            <h4 class="mb-1 text-sm font-medium text-gray-700">Otros usuarios activos:</h4>
                            <div class="flex flex-wrap gap-2">
                                <div
                                    v-for="user in onlineCollaborators.filter((user) => !collaborators.some((c) => (c.name || c.email) === user))"
                                    :key="user"
                                    class="flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                                >
                                    <span class="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>
                                    {{ user }}
                                    <span v-if="isTyping[user]" class="ml-1 italic">(escribiendo...)</span>
                                </div>
                            </div>
                        </div>

                        <div v-if="collaborators.length === 0 && onlineCollaborators.length === 0" class="text-sm text-gray-500">
                            Aún no hay colaboradores. Invita a alguien a colaborar en este formulario.
                        </div>
                    </div>

                    <!-- Recent Activities -->
                    <div class="mb-4">
                        <div class="mb-2 flex items-center justify-between">
                            <h3 class="text-lg font-semibold">Actividades Recientes</h3>
                            <div class="flex items-center">
                                <label class="mr-2 text-sm text-gray-600">Mostrar Notificaciones</label>
                                <input type="checkbox" v-model="showActivityNotifications" class="form-checkbox h-4 w-4 text-blue-600" />
                            </div>
                        </div>

                        <div v-if="recentActivities.length > 0" class="max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-2">
                            <div
                                v-for="(activity, index) in recentActivities"
                                :key="index"
                                class="mb-1 border-b border-gray-200 pb-1 text-sm last:border-0"
                            >
                                <div class="flex justify-between">
                                    <span class="font-medium">{{ activity.user }}</span>
                                    <span class="text-xs text-gray-500">{{ new Date(activity.timestamp).toLocaleTimeString() }}</span>
                                </div>
                                <div>{{ activity.description }}</div>
                            </div>
                        </div>

                        <div v-else class="text-sm text-gray-500">No hay actividades recientes. Los cambios aparecerán aquí.</div>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-12 gap-4 p-3">
                <!-- Sidebar with available elements -->
                <div class="col-span-12 mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 p-4 md:col-span-3 md:mb-0">
                    <h2 class="mb-4 text-lg font-semibold dark:text-white">Elementos del Formulario</h2>
                    <draggable
                        :list="availableElements"
                        :group="{ name: 'formElements', pull: 'clone', put: false }"
                        item-key="type"
                        :clone="(item) => ({ ...item, id: 'element-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) })"
                        class="space-y-2"
                    >
                        <template #item="{ element }">
                            <div class="cursor-move rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">
                                {{ element.props.label || element.type }}
                            </div>
                        </template>
                    </draggable>
                </div>

                <!-- Form builder area -->
                <div class="col-span-12 md:col-span-6">
                    <div class="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-md md:p-6">
                        <!-- Form elements -->
                        <draggable
                            v-model="formElements"
                            group="formElements"
                            item-key="id"
                            class="min-h-[300px] rounded-lg border-2 border-dashed border-gray-300 p-4"
                            @end="updateElement('add')"
                        >
                            <template #item="{ element, index }">
                                <div
                                    class="relative mb-4 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:border-blue-500 dark:hover:border-blue-400"
                                    :class="{ 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20': selectedElement === element }"
                                    @click="selectElement(element)"
                                >
                                    <!-- Element label -->
                                    <div class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-300">{{ element.props.label || element.type }}</div>

                                    <!-- Render the actual form element -->
                                    <!-- Standard form elements -->
                                    <component
                                        v-if="['input', 'select', 'textarea', 'checkbox', 'radio', 'number', 'date', 'button'].includes(element.type)"
                                        :is="element.type"
                                        v-bind="element.props"
                                        :style="{
                                            width: element.props.width,
                                            height: element.props.height,
                                            fontSize: element.props.fontSize,
                                            fontWeight: element.props.fontWeight,
                                            color: element.props.textColor,
                                            backgroundColor: element.props.backgroundColor,
                                            borderColor: element.props.borderColor,
                                            borderWidth: element.props.borderWidth,
                                            borderRadius: element.props.borderRadius,
                                            padding: element.props.padding
                                        }"
                                    >
                                        <template v-if="element.type === 'select'">
                                            <option v-for="option in element.props.options" :key="option">{{ option }}</option>
                                        </template>
                                        <template v-else-if="element.type === 'button'">
                                            {{ element.props.text }}
                                        </template>
                                    </component>

                                    <!-- Table component -->
                                    <div v-else-if="element.type === 'table'" class="custom-table">
                                        <table class="table table-bordered" :style="{
                                            width: element.props.width,
                                            fontSize: element.props.fontSize,
                                            color: element.props.textColor,
                                            borderColor: element.props.borderColor,
                                            borderWidth: element.props.borderWidth,
                                            borderRadius: element.props.borderRadius
                                        }">
                                            <thead :style="{ backgroundColor: element.props.headerBackgroundColor, color: element.props.headerTextColor }">
                                                <tr>
                                                    <th v-for="(header, index) in element.props.headers" :key="index">{{ header }}</th>
                                                </tr>
                                            </thead>
                                            <tbody :style="{ backgroundColor: element.props.backgroundColor }">
                                                <tr v-for="(row, rowIndex) in element.props.data" :key="rowIndex">
                                                    <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Menu component -->
                                    <div v-else-if="element.type === 'menu'" class="custom-menu">
                                        <!-- Horizontal menu -->
                                        <nav v-if="element.props.orientation === 'horizontal'"
                                            class="navbar navbar-expand-lg"
                                            :style="{
                                                backgroundColor: element.props.backgroundColor,
                                                border: `${element.props.borderWidth} solid ${element.props.borderColor}`,
                                                borderRadius: element.props.borderRadius
                                            }">
                                            <div class="container-fluid">
                                                <div class="navbar-nav">
                                                    <a v-for="(item, index) in element.props.items"
                                                       :key="index"
                                                       href="#"
                                                       class="nav-link"
                                                       :style="{
                                                           color: element.props.textColor,
                                                           fontSize: element.props.fontSize,
                                                           fontWeight: element.props.fontWeight,
                                                           padding: element.props.padding
                                                       }">
                                                        {{ item }}
                                                    </a>
                                                </div>
                                            </div>
                                        </nav>

                                        <!-- Vertical menu -->
                                        <div v-else class="list-group" :style="{
                                            width: element.props.width,
                                            border: `${element.props.borderWidth} solid ${element.props.borderColor}`,
                                            borderRadius: element.props.borderRadius
                                        }">
                                            <a v-for="(item, index) in element.props.items"
                                               :key="index"
                                               href="#"
                                               class="list-group-item list-group-item-action"
                                               :style="{
                                                   backgroundColor: element.props.backgroundColor,
                                                   color: element.props.textColor,
                                                   fontSize: element.props.fontSize,
                                                   fontWeight: element.props.fontWeight,
                                                   padding: element.props.padding
                                               }">
                                                {{ item }}
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Card component -->
                                    <div v-else-if="element.type === 'card'" class="card" :style="{
                                        width: element.props.width,
                                        border: `${element.props.borderWidth} solid ${element.props.borderColor}`,
                                        borderRadius: element.props.borderRadius,
                                        backgroundColor: element.props.backgroundColor,
                                        color: element.props.textColor
                                    }">
                                        <div class="card-header" :style="{
                                            backgroundColor: element.props.headerBackgroundColor,
                                            fontWeight: element.props.fontWeight,
                                            fontSize: element.props.fontSize
                                        }">
                                            {{ element.props.title }}
                                        </div>
                                        <div class="card-body" :style="{ padding: element.props.padding }">
                                            <p class="card-text">{{ element.props.content }}</p>
                                        </div>
                                        <div v-if="element.props.hasFooter" class="card-footer" :style="{
                                            backgroundColor: element.props.footerBackgroundColor
                                        }">
                                            {{ element.props.footerText }}
                                        </div>
                                    </div>

                                    <!-- Heading 1 component -->
                                    <h1 v-else-if="element.type === 'h1'" :style="{
                                        width: element.props.width,
                                        fontSize: element.props.fontSize,
                                        fontWeight: element.props.fontWeight,
                                        color: element.props.textColor,
                                        backgroundColor: element.props.backgroundColor,
                                        borderColor: element.props.borderColor,
                                        borderWidth: element.props.borderWidth,
                                        borderRadius: element.props.borderRadius,
                                        padding: element.props.padding
                                    }">
                                        {{ element.props.text }}
                                    </h1>

                                    <!-- Heading 2 component -->
                                    <h2 v-else-if="element.type === 'h2'" :style="{
                                        width: element.props.width,
                                        fontSize: element.props.fontSize,
                                        fontWeight: element.props.fontWeight,
                                        color: element.props.textColor,
                                        backgroundColor: element.props.backgroundColor,
                                        borderColor: element.props.borderColor,
                                        borderWidth: element.props.borderWidth,
                                        borderRadius: element.props.borderRadius,
                                        padding: element.props.padding
                                    }">
                                        {{ element.props.text }}
                                    </h2>

                                    <!-- Heading 3 component -->
                                    <h3 v-else-if="element.type === 'h3'" :style="{
                                        width: element.props.width,
                                        fontSize: element.props.fontSize,
                                        fontWeight: element.props.fontWeight,
                                        color: element.props.textColor,
                                        backgroundColor: element.props.backgroundColor,
                                        borderColor: element.props.borderColor,
                                        borderWidth: element.props.borderWidth,
                                        borderRadius: element.props.borderRadius,
                                        padding: element.props.padding
                                    }">
                                        {{ element.props.text }}
                                    </h3>

                                    <!-- Label component -->
                                    <label v-else-if="element.type === 'label'" :for="element.props.for" :style="{
                                        width: element.props.width,
                                        fontSize: element.props.fontSize,
                                        fontWeight: element.props.fontWeight,
                                        color: element.props.textColor,
                                        backgroundColor: element.props.backgroundColor,
                                        borderColor: element.props.borderColor,
                                        borderWidth: element.props.borderWidth,
                                        borderRadius: element.props.borderRadius,
                                        padding: element.props.padding
                                    }">
                                        {{ element.props.text }}
                                    </label>

                                    <!-- Div component -->
                                    <div v-else-if="element.type === 'div'" :style="{
                                        width: element.props.width,
                                        fontSize: element.props.fontSize,
                                        fontWeight: element.props.fontWeight,
                                        color: element.props.textColor,
                                        backgroundColor: element.props.backgroundColor,
                                        border: `${element.props.borderWidth} solid ${element.props.borderColor}`,
                                        borderRadius: element.props.borderRadius,
                                        padding: element.props.padding
                                    }">
                                        {{ element.props.content }}
                                    </div>

                                    <!-- Span component -->
                                    <span v-else-if="element.type === 'span'" :style="{
                                        width: element.props.width,
                                        fontSize: element.props.fontSize,
                                        fontWeight: element.props.fontWeight,
                                        color: element.props.textColor,
                                        backgroundColor: element.props.backgroundColor,
                                        borderColor: element.props.borderColor,
                                        borderWidth: element.props.borderWidth,
                                        borderRadius: element.props.borderRadius,
                                        padding: element.props.padding
                                    }">
                                        {{ element.props.text }}
                                    </span>

                                    <!-- Remove button -->
                                    <button
                                        @click.stop="
                                            formElements.splice(index, 1);
                                            updateElement('remove');
                                        "
                                        class="absolute right-2 top-2 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            </template>
                            <template #header>
                                <div v-if="formElements.length === 0" class="py-8 text-center text-gray-500">
                                    Arrastra y suelta elementos aquí para construir tu formulario
                                </div>
                            </template>
                        </draggable>
                    </div>
                </div>

                <!-- Properties panel -->
                <div class="col-span-12 mt-4 rounded-lg bg-gray-100 dark:bg-gray-700 p-4 md:col-span-3 md:mt-0">
                    <h2 class="mb-4 text-lg font-semibold dark:text-white">Propiedades</h2>
                    <div v-if="selectedElement" class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Etiqueta</label>
                            <input v-model="selectedElement.props.label" class="w-full rounded border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-800 dark:text-white" @input="updateElement" />
                        </div>

                        <div v-if="['input', 'textarea', 'number'].includes(selectedElement.type)" class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Placeholder</label>
                            <input
                                v-model="selectedElement.props.placeholder"
                                class="w-full rounded border border-gray-300 p-2"
                                @input="updateElement"
                            />
                        </div>

                        <div v-if="selectedElement.type === 'input'" class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Tipo de Entrada</label>
                            <select v-model="selectedElement.props.type" class="w-full rounded border border-gray-300 p-2" @change="updateElement">
                                <option value="text">Texto</option>
                                <option value="email">Email</option>
                                <option value="password">Contraseña</option>
                                <option value="tel">Teléfono</option>
                                <option value="url">URL</option>
                            </select>
                        </div>

                        <div v-if="selectedElement.type === 'number'" class="grid grid-cols-2 gap-2">
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Mínimo</label>
                                <input
                                    v-model.number="selectedElement.props.min"
                                    type="number"
                                    class="w-full rounded border border-gray-300 p-2"
                                    @input="updateElement"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Máximo</label>
                                <input
                                    v-model.number="selectedElement.props.max"
                                    type="number"
                                    class="w-full rounded border border-gray-300 p-2"
                                    @input="updateElement"
                                />
                            </div>
                        </div>

                        <div v-if="['select', 'radio'].includes(selectedElement.type)" class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Opciones</label>
                            <div>
                                <div v-for="(option, i) in selectedElement.props.options" :key="i" class="mb-2 flex space-x-2">
                                    <input
                                        v-model="selectedElement.props.options[i]"
                                        class="flex-1 rounded border border-gray-300 p-2"
                                        @input="updateElement"
                                    />
                                    <button
                                        @click="
                                            selectedElement.props.options.splice(i, 1);
                                            updateElement();
                                        "
                                        class="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                                <button
                                    @click="
                                        selectedElement.props.options.push('Nueva Opción');
                                        updateElement();
                                    "
                                    class="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                                >
                                    Agregar Opción
                                </button>
                            </div>
                        </div>

                        <div v-if="selectedElement.type === 'button'" class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Texto del Botón</label>
                            <input v-model="selectedElement.props.text" class="w-full rounded border border-gray-300 p-2" @input="updateElement" />

                            <label class="block text-sm font-medium text-gray-700">Variante del Botón</label>
                            <select v-model="selectedElement.props.variant" class="w-full rounded border border-gray-300 p-2" @change="updateElement">
                                <option value="primary">Primario</option>
                                <option value="secondary">Secundario</option>
                                <option value="success">Éxito</option>
                                <option value="danger">Peligro</option>
                            </select>
                        </div>

                        <div v-if="!['button', 'checkbox'].includes(selectedElement.type)" class="flex items-center space-x-2">
                            <input type="checkbox" id="required" v-model="selectedElement.props.required" @change="updateElement" />
                            <label for="required" class="text-sm font-medium text-gray-700">Requerido</label>
                        </div>

                        <!-- Component-specific properties -->
                        <div v-if="selectedElement.type === 'table'" class="space-y-2">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Propiedades de Tabla</h3>

                            <!-- Table Headers -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Encabezados</label>
                                <div v-for="(header, i) in selectedElement.props.headers" :key="i" class="mb-2 flex space-x-2">
                                    <input
                                        v-model="selectedElement.props.headers[i]"
                                        class="flex-1 rounded border border-gray-300 p-2"
                                        @input="updateElement"
                                    />
                                    <button
                                        @click="
                                            selectedElement.props.headers.splice(i, 1);
                                            updateElement();
                                        "
                                        class="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                                <button
                                    @click="
                                        selectedElement.props.headers.push('Nuevo Encabezado');
                                        updateElement();
                                    "
                                    class="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                                >
                                    Agregar Encabezado
                                </button>
                            </div>

                            <!-- Table Data -->
                            <div class="space-y-2 mt-4">
                                <label class="block text-sm font-medium text-gray-700">Filas de Datos</label>
                                <div v-for="(row, rowIndex) in selectedElement.props.data" :key="rowIndex" class="mb-4 border-b pb-2">
                                    <div class="flex justify-between mb-2">
                                        <span class="text-sm font-medium">Fila {{ rowIndex + 1 }}</span>
                                        <button
                                            @click="
                                                selectedElement.props.data.splice(rowIndex, 1);
                                                updateElement();
                                            "
                                            class="text-red-500 hover:text-red-700"
                                        >
                                            Eliminar Fila
                                        </button>
                                    </div>
                                    <div v-for="(cell, cellIndex) in row" :key="cellIndex" class="mb-2 flex space-x-2">
                                        <input
                                            v-model="selectedElement.props.data[rowIndex][cellIndex]"
                                            class="flex-1 rounded border border-gray-300 p-2"
                                            @input="updateElement"
                                            :placeholder="`Celda ${cellIndex + 1}`"
                                        />
                                    </div>
                                </div>
                                <button
                                    @click="addNewTableRow"
                                    class="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                                >
                                    Agregar Fila
                                </button>
                            </div>

                            <!-- Table Header Colors -->
                            <div class="grid grid-cols-2 gap-2 mt-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Color de Fondo del Encabezado</label>
                                    <input
                                        v-model="selectedElement.props.headerBackgroundColor"
                                        type="color"
                                        class="w-full rounded border border-gray-300 p-1 h-10"
                                        @input="updateElement"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Color de Texto del Encabezado</label>
                                    <input
                                        v-model="selectedElement.props.headerTextColor"
                                        type="color"
                                        class="w-full rounded border border-gray-300 p-1 h-10"
                                        @input="updateElement"
                                    />
                                </div>
                            </div>
                        </div>

                        <div v-if="selectedElement.type === 'menu'" class="space-y-2">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Propiedades de Menú</h3>

                            <!-- Menu Items -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Elementos del Menú</label>
                                <div v-for="(item, i) in selectedElement.props.items" :key="i" class="mb-2 flex space-x-2">
                                    <input
                                        v-model="selectedElement.props.items[i]"
                                        class="flex-1 rounded border border-gray-300 p-2"
                                        @input="updateElement"
                                    />
                                    <button
                                        @click="
                                            selectedElement.props.items.splice(i, 1);
                                            updateElement();
                                        "
                                        class="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                                <button
                                    @click="
                                        selectedElement.props.items.push('Nuevo Elemento');
                                        updateElement();
                                    "
                                    class="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                                >
                                    Agregar Elemento
                                </button>
                            </div>

                            <!-- Menu Orientation -->
                            <div class="space-y-2 mt-4">
                                <label class="block text-sm font-medium text-gray-700">Orientación</label>
                                <select v-model="selectedElement.props.orientation" class="w-full rounded border border-gray-300 p-2" @change="updateElement">
                                    <option value="horizontal">Horizontal</option>
                                    <option value="vertical">Vertical</option>
                                </select>
                            </div>

                            <!-- Menu Hover Colors -->
                            <div class="grid grid-cols-2 gap-2 mt-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Color de Fondo al Pasar</label>
                                    <input
                                        v-model="selectedElement.props.hoverBackgroundColor"
                                        type="color"
                                        class="w-full rounded border border-gray-300 p-1 h-10"
                                        @input="updateElement"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Color de Texto al Pasar</label>
                                    <input
                                        v-model="selectedElement.props.hoverTextColor"
                                        type="color"
                                        class="w-full rounded border border-gray-300 p-1 h-10"
                                        @input="updateElement"
                                    />
                                </div>
                            </div>
                        </div>

                        <div v-if="selectedElement.type === 'card'" class="space-y-2">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Propiedades de Tarjeta</h3>

                            <!-- Card Title -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Título</label>
                                <input
                                    v-model="selectedElement.props.title"
                                    class="w-full rounded border border-gray-300 p-2"
                                    @input="updateElement"
                                />
                            </div>

                            <!-- Card Content -->
                            <div class="space-y-2 mt-4">
                                <label class="block text-sm font-medium text-gray-700">Contenido</label>
                                <textarea
                                    v-model="selectedElement.props.content"
                                    class="w-full rounded border border-gray-300 p-2"
                                    rows="3"
                                    @input="updateElement"
                                ></textarea>
                            </div>

                            <!-- Card Footer -->
                            <div class="space-y-2 mt-4">
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="hasFooter" v-model="selectedElement.props.hasFooter" @change="updateElement" />
                                    <label for="hasFooter" class="text-sm font-medium text-gray-700">Mostrar Pie de Tarjeta</label>
                                </div>

                                <div v-if="selectedElement.props.hasFooter" class="mt-2">
                                    <label class="block text-sm font-medium text-gray-700">Texto del Pie</label>
                                    <input
                                        v-model="selectedElement.props.footerText"
                                        class="w-full rounded border border-gray-300 p-2"
                                        @input="updateElement"
                                    />
                                </div>
                            </div>

                            <!-- Card Colors -->
                            <div class="grid grid-cols-2 gap-2 mt-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Color de Fondo del Encabezado</label>
                                    <input
                                        v-model="selectedElement.props.headerBackgroundColor"
                                        type="color"
                                        class="w-full rounded border border-gray-300 p-1 h-10"
                                        @input="updateElement"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Color de Fondo del Pie</label>
                                    <input
                                        v-model="selectedElement.props.footerBackgroundColor"
                                        type="color"
                                        class="w-full rounded border border-gray-300 p-1 h-10"
                                        @input="updateElement"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Heading components properties -->
                        <div v-if="['h1', 'h2', 'h3'].includes(selectedElement.type)" class="space-y-2">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Propiedades de Encabezado</h3>

                            <!-- Heading Text -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Texto</label>
                                <input
                                    v-model="selectedElement.props.text"
                                    class="w-full rounded border border-gray-300 p-2"
                                    @input="updateElement"
                                />
                            </div>
                        </div>

                        <!-- Label component properties -->
                        <div v-if="selectedElement.type === 'label'" class="space-y-2">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Propiedades de Etiqueta</h3>

                            <!-- Label Text -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Texto</label>
                                <input
                                    v-model="selectedElement.props.text"
                                    class="w-full rounded border border-gray-300 p-2"
                                    @input="updateElement"
                                />
                            </div>

                            <!-- For attribute -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Atributo 'for' (ID del elemento asociado)</label>
                                <input
                                    v-model="selectedElement.props.for"
                                    class="w-full rounded border border-gray-300 p-2"
                                    @input="updateElement"
                                    placeholder="ID del elemento asociado"
                                />
                            </div>
                        </div>

                        <!-- Div component properties -->
                        <div v-if="selectedElement.type === 'div'" class="space-y-2">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Propiedades de Contenedor</h3>

                            <!-- Div Content -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Contenido</label>
                                <textarea
                                    v-model="selectedElement.props.content"
                                    class="w-full rounded border border-gray-300 p-2"
                                    rows="3"
                                    @input="updateElement"
                                ></textarea>
                            </div>
                        </div>

                        <!-- Span component properties -->
                        <div v-if="selectedElement.type === 'span'" class="space-y-2">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Propiedades de Span</h3>

                            <!-- Span Text -->
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Texto</label>
                                <input
                                    v-model="selectedElement.props.text"
                                    class="w-full rounded border border-gray-300 p-2"
                                    @input="updateElement"
                                />
                            </div>
                        </div>

                        <!-- Style and Size Properties -->
                        <div class="mt-6 border-t border-gray-200 pt-4">
                            <h3 class="mb-3 text-md font-semibold text-gray-700">Estilos y Tamaños</h3>

                            <!-- Size Properties -->
                            <div class="mb-4 space-y-3">
                                <h4 class="text-sm font-medium text-gray-700">Dimensiones</h4>

                                <div class="grid grid-cols-2 gap-2">
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Ancho</label>
                                        <input
                                            v-model="selectedElement.props.width"
                                            class="w-full rounded border border-gray-300 p-2 text-sm"
                                            @input="updateElement"
                                            placeholder="100%, 200px, etc."
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Alto</label>
                                        <input
                                            v-model="selectedElement.props.height"
                                            class="w-full rounded border border-gray-300 p-2 text-sm"
                                            @input="updateElement"
                                            placeholder="auto, 40px, etc."
                                        />
                                    </div>
                                </div>

                                <div class="space-y-1">
                                    <label class="block text-xs text-gray-600">Padding</label>
                                    <input
                                        v-model="selectedElement.props.padding"
                                        class="w-full rounded border border-gray-300 p-2 text-sm"
                                        @input="updateElement"
                                        placeholder="8px, 10px 15px, etc."
                                    />
                                </div>
                            </div>

                            <!-- Text Properties -->
                            <div class="mb-4 space-y-3">
                                <h4 class="text-sm font-medium text-gray-700">Texto</h4>

                                <div class="grid grid-cols-2 gap-2">
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Tamaño de Fuente</label>
                                        <input
                                            v-model="selectedElement.props.fontSize"
                                            class="w-full rounded border border-gray-300 p-2 text-sm"
                                            @input="updateElement"
                                            placeholder="16px, 1.2rem, etc."
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Peso de Fuente</label>
                                        <select
                                            v-model="selectedElement.props.fontWeight"
                                            class="w-full rounded border border-gray-300 p-2 text-sm"
                                            @change="updateElement"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="bold">Negrita</option>
                                            <option value="lighter">Ligero</option>
                                            <option value="bolder">Más Negrita</option>
                                            <option value="100">100</option>
                                            <option value="200">200</option>
                                            <option value="300">300</option>
                                            <option value="400">400</option>
                                            <option value="500">500</option>
                                            <option value="600">600</option>
                                            <option value="700">700</option>
                                            <option value="800">800</option>
                                            <option value="900">900</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Color Properties -->
                            <div class="mb-4 space-y-3">
                                <h4 class="text-sm font-medium text-gray-700">Colores</h4>

                                <div class="grid grid-cols-2 gap-2">
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Color de Texto</label>
                                        <div class="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                v-model="selectedElement.props.textColor"
                                                class="h-8 w-8 cursor-pointer rounded border border-gray-300"
                                                @input="updateElement"
                                            />
                                            <input
                                                v-model="selectedElement.props.textColor"
                                                class="flex-1 rounded border border-gray-300 p-2 text-sm"
                                                @input="updateElement"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Color de Fondo</label>
                                        <div class="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                v-model="selectedElement.props.backgroundColor"
                                                class="h-8 w-8 cursor-pointer rounded border border-gray-300"
                                                @input="updateElement"
                                            />
                                            <input
                                                v-model="selectedElement.props.backgroundColor"
                                                class="flex-1 rounded border border-gray-300 p-2 text-sm"
                                                @input="updateElement"
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Border Properties -->
                            <div class="space-y-3">
                                <h4 class="text-sm font-medium text-gray-700">Bordes</h4>

                                <div class="grid grid-cols-3 gap-2">
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Color</label>
                                        <div class="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                v-model="selectedElement.props.borderColor"
                                                class="h-8 w-8 cursor-pointer rounded border border-gray-300"
                                                @input="updateElement"
                                            />
                                            <input
                                                v-model="selectedElement.props.borderColor"
                                                class="flex-1 rounded border border-gray-300 p-2 text-sm"
                                                @input="updateElement"
                                                placeholder="#ced4da"
                                            />
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Ancho</label>
                                        <input
                                            v-model="selectedElement.props.borderWidth"
                                            class="w-full rounded border border-gray-300 p-2 text-sm"
                                            @input="updateElement"
                                            placeholder="1px"
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-xs text-gray-600">Radio</label>
                                        <input
                                            v-model="selectedElement.props.borderRadius"
                                            class="w-full rounded border border-gray-300 p-2 text-sm"
                                            @input="updateElement"
                                            placeholder="4px"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="py-8 text-center text-gray-500">Selecciona un elemento para editar sus propiedades</div>
                </div>

                <!-- Code preview -->
                <div class="col-span-12 mt-6">
                    <div class="rounded-lg bg-gray-800 p-4 text-white">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="text-lg font-semibold">Código Angular</h2>
                            <div class="flex space-x-2">
                                <button
                                    @click="copyToClipboard(allCode, '¡Código completo copiado al portapapeles!')"
                                    class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                >
                                    Copiar Todo
                                </button>
                            </div>
                        </div>

                        <!-- Code tabs -->
                        <div class="mb-4 border-b border-gray-700">
                            <div class="flex">
                                <button
                                    @click="activeCodeTab = 'html'"
                                    class="px-4 py-2 font-medium"
                                    :class="
                                        activeCodeTab === 'html' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400 hover:text-gray-300'
                                    "
                                >
                                    HTML
                                </button>
                                <button
                                    @click="activeCodeTab = 'css'"
                                    class="px-4 py-2 font-medium"
                                    :class="
                                        activeCodeTab === 'css' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400 hover:text-gray-300'
                                    "
                                >
                                    CSS
                                </button>
                                <button
                                    @click="activeCodeTab = 'ts'"
                                    class="px-4 py-2 font-medium"
                                    :class="activeCodeTab === 'ts' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400 hover:text-gray-300'"
                                >
                                    TypeScript
                                </button>
                                <button
                                    @click="activeCodeTab = 'all'"
                                    class="px-4 py-2 font-medium"
                                    :class="
                                        activeCodeTab === 'all' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400 hover:text-gray-300'
                                    "
                                >
                                    Todo
                                </button>
                            </div>
                        </div>

                        <!-- HTML code -->
                        <div v-if="activeCodeTab === 'html'" class="relative">
                            <button
                                @click="copyToClipboard(htmlCode, '¡Código HTML copiado al portapapeles!')"
                                class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                            >
                                Copiar HTML
                            </button>
                            <pre class="overflow-x-auto whitespace-pre-wrap rounded bg-gray-900 p-4 text-green-400">{{ htmlCode }}</pre>
                        </div>

                        <!-- CSS code -->
                        <div v-if="activeCodeTab === 'css'" class="relative">
                            <button
                                @click="copyToClipboard(cssCode, '¡Código CSS copiado al portapapeles!')"
                                class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                            >
                                Copiar CSS
                            </button>
                            <pre class="overflow-x-auto whitespace-pre-wrap rounded bg-gray-900 p-4 text-green-400">{{ cssCode }}</pre>
                        </div>

                        <!-- TypeScript code -->
                        <div v-if="activeCodeTab === 'ts'" class="relative">
                            <button
                                @click="copyToClipboard(tsCode, '¡Código TypeScript copiado al portapapeles!')"
                                class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                            >
                                Copiar TypeScript
                            </button>
                            <pre class="overflow-x-auto whitespace-pre-wrap rounded bg-gray-900 p-4 text-green-400">{{ tsCode }}</pre>
                        </div>

                        <!-- All code -->
                        <div v-if="activeCodeTab === 'all'" class="relative">
                            <button
                                @click="copyToClipboard(allCode, '¡Código completo copiado al portapapeles!')"
                                class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                            >
                                Copiar Todo
                            </button>
                            <pre class="overflow-x-auto whitespace-pre-wrap rounded bg-gray-900 p-4 text-green-400">{{ allCode }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
    <!-- Floating Chat Button -->
    <div v-if="showChatButton" class="fixed bottom-4 right-4 z-50">
        <button
            @click="toggleFloatingChat"
            class="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 focus:outline-none"
            :class="{'animate-pulse': chatMessages.length > 0 && !showFloatingChat}"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        </button>
    </div>

    <!-- Floating Chat Window -->
    <div v-if="showFloatingChat" class="fixed bottom-20 right-4 z-50 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-300">
        <!-- Chat Header -->
        <div class="bg-blue-500 text-white px-4 py-2 flex justify-between items-center">
            <h3 class="font-semibold">Chat del Proyecto</h3>
            <button @click="toggleFloatingChat" class="text-white hover:text-gray-200 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div v-if="chatMessages.length === 0" class="text-gray-500 text-center py-4">
                No hay mensajes aún. ¡Inicia la conversación!
            </div>
            <ul class="space-y-3">
                <li
                    v-for="(msg, index) in chatMessages"
                    :key="index"
                    :class="[
                        'p-3 rounded-lg max-w-3/4',
                        msg.user === currentUser ?
                            'bg-blue-100 ml-auto' :
                            'bg-gray-100'
                    ]"
                >
                    <div class="font-semibold text-sm">{{ msg.user }}</div>
                    <div>{{ msg.text }}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        {{ new Date(msg.timestamp).toLocaleTimeString() }}
                    </div>
                </li>
            </ul>
            <p v-if="chatTyping.typing" class="text-sm text-gray-500 italic mt-2">
                {{ chatTyping.typing }}
            </p>
        </div>

        <!-- Message Input -->
        <form @submit.prevent="sendChatMessage" class="border-t border-gray-300 p-2 flex gap-2">
            <input
                v-model="chatMessage"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe tu mensaje..."
                autocomplete="off"
                @input="onChatInput"
            />
            <button
                type="submit"
                class="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </form>
    </div>

    <!-- Export Angular Code Modal -->
    <div v-if="showExportModal" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50">
        <div class="relative max-h-[90vh] w-11/12 max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl md:w-3/4">
            <!-- Modal Header -->
            <div class="flex items-center justify-between bg-blue-500 px-4 py-3 text-white">
                <h3 class="text-lg font-semibold">Exportar Proyecto Angular</h3>
                <button @click="showExportModal = false" class="text-white hover:text-gray-200 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-4">
                <div class="mb-4">
                    <p class="mb-2 text-gray-700">
                        Este es el código generado para tu componente Angular. Puedes copiar cada archivo individualmente o descargar todos los archivos como un único archivo ZIP.
                    </p>
                    <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 class="text-blue-700 font-medium mb-2">Proyecto Angular Completo en ZIP</h4>
                        <p class="text-sm text-gray-700 mb-2">
                            Al hacer clic en "Descargar Proyecto", obtendrás un archivo ZIP con todos los archivos necesarios para ejecutar un proyecto Angular completo, incluyendo:
                        </p>
                        <ul class="text-sm text-gray-700 list-disc pl-5 mb-2">
                            <li>Archivos de configuración (package.json, angular.json, tsconfig.json)</li>
                            <li>Archivos de la aplicación (main.ts, app.module.ts, app.component.ts)</li>
                            <li>Tu componente de formulario (HTML, CSS, TypeScript)</li>
                            <li>Instrucciones detalladas en README.md</li>
                        </ul>
                        <p class="text-sm text-gray-700">
                            El archivo ZIP mantiene la estructura de directorios correcta. Solo necesitas descomprimirlo y seguir las instrucciones en el archivo README.md para configurar y ejecutar tu proyecto.
                        </p>
                    </div>
                </div>

                <!-- Code Tabs -->
                <div class="mb-4 border-b border-gray-200">
                    <ul class="flex flex-wrap -mb-px">
                        <li class="mr-2">
                            <button
                                @click="activeCodeTab = 'html'"
                                class="inline-block p-4 rounded-t-lg"
                                :class="activeCodeTab === 'html' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'"
                            >
                                HTML
                            </button>
                        </li>
                        <li class="mr-2">
                            <button
                                @click="activeCodeTab = 'css'"
                                class="inline-block p-4 rounded-t-lg"
                                :class="activeCodeTab === 'css' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'"
                            >
                                CSS
                            </button>
                        </li>
                        <li class="mr-2">
                            <button
                                @click="activeCodeTab = 'typescript'"
                                class="inline-block p-4 rounded-t-lg"
                                :class="activeCodeTab === 'typescript' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'"
                            >
                                TypeScript
                            </button>
                        </li>
                        <li>
                            <button
                                @click="activeCodeTab = 'all'"
                                class="inline-block p-4 rounded-t-lg"
                                :class="activeCodeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'"
                            >
                                Todo
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Code Display -->
                <div class="mb-4">
                    <div v-if="activeCodeTab === 'html'" class="relative">
                        <pre class="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-sm"><code>{{ htmlCode }}</code></pre>
                        <button
                            @click="copyToClipboard(htmlCode, '¡Código HTML copiado!')"
                            class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                        >
                            Copiar
                        </button>
                    </div>
                    <div v-if="activeCodeTab === 'css'" class="relative">
                        <pre class="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-sm"><code>{{ cssCode }}</code></pre>
                        <button
                            @click="copyToClipboard(cssCode, '¡Código CSS copiado!')"
                            class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                        >
                            Copiar
                        </button>
                    </div>
                    <div v-if="activeCodeTab === 'typescript'" class="relative">
                        <pre class="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-sm"><code>{{ tsCode }}</code></pre>
                        <button
                            @click="copyToClipboard(tsCode, '¡Código TypeScript copiado!')"
                            class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                        >
                            Copiar
                        </button>
                    </div>
                    <div v-if="activeCodeTab === 'all'" class="relative">
                        <pre class="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-sm"><code>{{ allCode }}</code></pre>
                        <button
                            @click="copyToClipboard(allCode, '¡Todo el código copiado!')"
                            class="absolute right-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                        >
                            Copiar
                        </button>
                    </div>
                </div>

                <!-- Download Buttons -->
                <div class="flex flex-wrap justify-end gap-2">
                    <button
                        @click="downloadCode(htmlCode, `${formName.toLowerCase().replace(/\s+/g, '-')}.component.html`)"
                        class="rounded bg-green-500 px-3 py-2 text-white hover:bg-green-600"
                    >
                        Descargar HTML
                    </button>
                    <button
                        @click="downloadCode(cssCode, `${formName.toLowerCase().replace(/\s+/g, '-')}.component.css`)"
                        class="rounded bg-green-500 px-3 py-2 text-white hover:bg-green-600"
                    >
                        Descargar CSS
                    </button>
                    <button
                        @click="downloadCode(tsCode, `${formName.toLowerCase().replace(/\s+/g, '-')}.component.ts`)"
                        class="rounded bg-green-500 px-3 py-2 text-white hover:bg-green-600"
                    >
                        Descargar TypeScript
                    </button>
                    <button
                        @click="downloadAllFiles()"
                        class="rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                    >
                        Descargar Proyecto ZIP
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
