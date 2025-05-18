<script setup lang="ts">
import { usePage, router } from '@inertiajs/vue3';
import { ref, defineProps, computed, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import type { FormBuilder } from '@/types/FormBuilder';
import FormList from '@/pages/FormBuilder/FormList.vue';

// Define props
const props = defineProps({
    ownedForms: {
        type: Array,
        required: true,
    },
    collaboratingForms: {
        type: Array,
        required: true,
    },
    pendingInvitations: {
        type: Array,
        required: true,
    },
});

const page = usePage();
const invitationLink = ref('');
const processingLink = ref(false);

// Get forms from props
const ownedForms = ref(props.ownedForms);
const collaboratingForms = ref(props.collaboratingForms);
const pendingInvitations = ref(props.pendingInvitations);

// Selected form for editing
const selectedForm = ref(null);
const showNewForm = ref(false);

const flashMessage = computed(() => page.props.flash?.message);

// Initialize data
onMounted(() => {
    ownedForms.value = props.ownedForms;
    collaboratingForms.value = props.collaboratingForms;
    pendingInvitations.value = props.pendingInvitations;
});

// Select a form to edit
const selectForm = (form) => {
    router.get(`/form-builder/${form.id}/edit`);
};

const createNewForm = async () => {
    const { value: formName } = await Swal.fire({
        title: 'Nombre del nuevo formulario',
        input: 'text',
        inputPlaceholder: 'Ingresa el nombre del formulario',
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'El nombre del formulario no puede estar vacío';
            }
        },
    });

    if (formName) {
        try {
            // Crear el formulario en el servidor
            const response = await axios.post('/form-builder', { name: formName });
            console.log('Formulario creado:', response.data);

            // Redirigir a la página de edición del formulario recién creado
            window.location.href = `/form-builder/${response.data.id}/edit`;
        } catch (error) {
            console.error('Error al crear el formulario:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al crear el formulario. Inténtalo de nuevo.',
                icon: 'error',
            });
        }
    }
};

// Accept an invitation
const acceptInvitation = async (formBuilder) => {
    const response = await axios.post(`/form-builder/${formBuilder.id}/accept`);
    if (response.status !== 200) {
        Swal.fire({
            title: 'Error!',
            text: 'No se pudo aceptar la invitación. Inténtalo de nuevo.',
            icon: 'error',
        });
        return;
    }

    // Update the lists
    collaboratingForms.value.push(formBuilder);
    pendingInvitations.value = pendingInvitations.value.filter(
        (form) => form.id !== formBuilder.id
    );

    Swal.fire({
        title: 'Éxito!',
        text: 'Invitación aceptada exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
    }).then(() => {
        window.location.href = `/form-builder/${formBuilder.id}/edit`;
    });
};

// Reject an invitation
const rejectInvitation = async (formBuilder) => {
    try {
        await axios.post(`/form-builder/${formBuilder.id}/reject`);

        // Update the lists
        pendingInvitations.value = pendingInvitations.value.filter((form) => form.id !== formBuilder.id);

        Swal.fire({
            title: 'Success!',
            text: 'Invitación rechazada.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        Swal.fire({
            title: 'Error!',
            text: 'No se pudo rechazar la invitación. Inténtalo de nuevo.',
            icon: 'error',
        });
    }
};

// Delete a form
const deleteForm = async (formBuilder, event) => {
    // Prevent the click from propagating to the parent
    event.stopPropagation();

    const result = await Swal.fire({
        title: 'Estas seguro?',
        text: '¡No podrás revertir esto!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, ¡eliminalo!',
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        await axios.delete(`/form-builder/${formBuilder.id}`);
        // Remove the form from the list
        ownedForms.value = ownedForms.value.filter((form) => form.id !== formBuilder.id);
        Swal.fire('Eliminado!', 'Su formulario ha sido eliminado.', 'success');
    } catch (error) {
        console.error('Error deleting form:', error);
        if (error.response && error.response.status === 403) {
            Swal.fire('Error!', 'No está autorizado a eliminar este formulario.', 'error');
        } else {
            Swal.fire('Error!', 'Se produjo un error al eliminar el formulario.', 'error');
        }
    }
};

// Leave collaboration
const leaveCollaboration = async (formBuilder) => {
    try {
        const response = await axios.post(`/form-builder/${formBuilder.id}/leave`);
        // Remove the form from the list
        collaboratingForms.value = collaboratingForms.value.filter((form) => form.id !== formBuilder.id);
        if(response.status === 200) {
            Swal.fire('Éxito!', 'Has dejado de colaborar en el formulario.', 'success');
        } else {
            Swal.fire('Error!', 'No se pudo dejar de colaborar en el formulario.', 'error');
        }
        window.location.reload();
        return;
    } catch (error) {
        console.error('Error al salir de la colaboración:', error);
        Swal.fire('Error!', 'No se pudo dejar de colaborar en el formulario.', 'error');
    }
};

// Process invitation link
const processInvitationLink = async () => {
    if (!invitationLink.value) {
        Swal.fire('Error!', 'Por favor, introduzca un enlace de invitación.', 'error');
        return;
    }

    processingLink.value = true;
    try {
        // Extract the form ID from the invitation link
        const url = new URL(invitationLink.value);
        const pathParts = url.pathname.split('/');
        const formId = pathParts[pathParts.length - 2];

        if (!formId) {
            throw new Error('Enlace de invitación no válido');
        }

        // Redirect to the invitation link
        window.location.href = `/form-builder/invite/${formId}`;
    } catch (error) {
        console.error('Error processing invitation link:', error);
        Swal.fire('Error!', 'Enlace de invitación no válido. Revísalo y vuelve a intentarlo.', 'error');
    } finally {
        processingLink.value = false;
    }
};
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <!-- Flash Message-->
        <div v-if="flashMessage" class="relative mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700" role="alert">
            <span class="block sm:inline">{{ flashMessage }}</span>
        </div>

        <div>
            <div>
                <h1 class="text-2xl font-bold">Creador de formularios</h1>
                <p class="text-gray-600">
                    Crea formularios arrastrando y soltando elementos. Los cambios se comparten con los colaboradores en tiempo real y se guardan
                    al hacer clic en el botón Guardar.
                </p>
            </div>
            <div class="mt-2">
                <button @click="createNewForm" class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Crear nuevo formulario</button>
            </div>
        </div>

        <!-- Invitation Link Input -->
        <div class="mb-4 rounded-lg bg-white p-4 shadow-md">
            <h2 class="mb-2 text-lg font-semibold">¿Tienes un enlace de invitación?</h2>
            <input
                v-model="invitationLink"
                type="text"
                placeholder="Paste invitation link here"
                class="flex-1 rounded border border-gray-300 p-2"
            />
            <button
                @click="processInvitationLink"
                class="ml-2 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                :disabled="processingLink"
            >
                <span v-if="processingLink">Procesando...</span>
                <span v-else>Unirse</span>
            </button>
        </div>

        <!-- Lista de Formularios -->
        <div v-if="!selectedForm && !showNewForm" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <!-- Mis Formularios -->
            <FormList
                :title="'Tus formularios: [ ' + ownedForms.length+' ]'"
                :forms="ownedForms"
                :onSelect="selectForm"
                :onDelete="deleteForm"
                :is-owner="true"
                :is-invitations="false"
                :is-colaborator="false"
            />

            <!-- Formularios de Colaboracion -->
            <FormList
                :title="'Formularios de colaboración: [ ' +collaboratingForms.length+' ]'"
                :forms="collaboratingForms"
                :onSelect="selectForm"
                :on-quit="leaveCollaboration"
                :is-owner="false"
                :is-colaborator="true"
                :is-invitations="false"
            />

            <!-- Invitaciones Pendientes -->
            <FormList
                :title="'Invitaciones pendientes: [ '+ pendingInvitations.length+' ]'"
                :forms="pendingInvitations"
                :onSelect="acceptInvitation"
                :onDelete="rejectInvitation"
                :onAcept="acceptInvitation"
                :onReject="rejectInvitation"
                :is-owner="false"
                :is-invitations="true"
                :is-colaborator="false"
            />

            <!-- No Forms Message -->
            <div
                v-if="ownedForms.length === 0 && collaboratingForms.length === 0 && pendingInvitations.length === 0"
                class="col-span-full py-8 text-center"
            >
                <p class="text-gray-500">Aún no tienes formularios. Haz clic en "Crear nuevo formulario" para empezar.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes highlight {
    0% {
        background-color: #f0f9ff;
        box-shadow: 0 0 0 2px #3b82f6;
    }
    50% {
        background-color: #dbeafe;
        box-shadow: 0 0 0 4px #3b82f6;
    }
    100% {
        background-color: #f0f9ff;
        box-shadow: 0 0 0 2px #3b82f6;
    }
}

.highlight-animation {
    animation: highlight 2s ease-in-out 3;
}
</style>
