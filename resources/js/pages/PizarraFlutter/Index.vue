<script setup lang="ts">
import { Head, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import type { BreadcrumbItem } from '@/types';
import { ref, defineProps, computed, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
// Using any type for now as PizarraFlutter type might not be defined yet
// import type { PizarraFlutter } from '@/types/PizarraFlutter';
import FormList from '@/pages/FormBuilder/FormList.vue';

// definir props form
const props = defineProps({
    ownedPizarras: {
        type: Array,
        required: true,
    },
    collaboratingPizarras: {
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

// Get pizarras from props
const ownedPizarras = ref(props.ownedPizarras);
const collaboratingPizarras = ref(props.collaboratingPizarras);
const pendingInvitations = ref(props.pendingInvitations);

// Selected pizarra for editing
const selectedPizarra = ref(null);
const showNewPizarra = ref(false);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pizarra Flutter',
        href: '/pizarra-flutter',
    },
];
const flashMessage = computed(() => page.props.flash?.message);
const highlightInvitationId = computed(() => page.props.flash?.highlight_invitation);

// Scroll to highlighted invitation if needed
onMounted(() => {
    ownedPizarras.value = props.ownedPizarras;
    collaboratingPizarras.value = props.collaboratingPizarras;
    pendingInvitations.value = props.pendingInvitations;
    if (highlightInvitationId.value) {
        setTimeout(() => {
            const element = document.getElementById(`invitation-${highlightInvitationId.value}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.classList.add('highlight-animation');
            }
        }, 500);
    }
});

// Select a pizarra to edit
const selectPizarra = (pizarra) => {
    router.get(`/pizarra-flutter/${pizarra.id}`);
};

const createNewPizarra = async () => {
    const { value: pizarraName } = await Swal.fire({
        title: 'Nombre de la nueva pizarra',
        input: 'text',
        inputPlaceholder: 'Ingresa el nombre de la pizarra',
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'El nombre de la pizarra no puede estar vacío';
            }
        },
    });

    if (pizarraName) {
        try {
            // Crear la pizarra en el servidor
            const response = await axios.post('/pizarra-flutter', { name: pizarraName });
            console.log('Pizarra creada:', response.data);

            // Redirigir a la página de edición de la pizarra recién creada
            window.location.href = `/pizarra-flutter/${response.data.id}`;
        } catch (error) {
            console.error('Error al crear la pizarra:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al crear la pizarra. Inténtalo de nuevo.',
                icon: 'error',
            });
        }
    }
};

// Accept an invitation
const acceptInvitation = async (pizarra) => {
    try {
        const response = await axios.post(`/pizarra-flutter/${pizarra.id}/accept`);
        if (response.status !== 200) {
            Swal.fire({
                title: 'Error!',
                text: 'No se pudo aceptar la invitación. Inténtalo de nuevo.',
                icon: 'error',
            });
            return;
        }

        // actualizar la lista de pizarras colaborativas y invitaciones pendientes
        collaboratingPizarras.value.push(pizarra);
        pendingInvitations.value = pendingInvitations.value.filter(
            (p) => p.id !== pizarra.id
        );

        Swal.fire({
            title: 'Éxito!',
            text: 'Invitación aceptada exitosamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        }).then(() => {
            window.location.href = `/pizarra-flutter/${pizarra.id}`;
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        Swal.fire({
            title: 'Error!',
            text: 'No se pudo aceptar la invitación. Inténtalo de nuevo.',
            icon: 'error',
        });
    }
};

// Reject an invitation
const rejectInvitation = async (pizarra) => {
    try {
        await axios.post(`/pizarra-flutter/${pizarra.id}/reject`);

        // Instead of reloading the page, update the lists directly
        pendingInvitations.value = pendingInvitations.value.filter((p) => p.id !== pizarra.id);

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

// Delete a pizarra
const deletePizarra = async (pizarra, event) => {
    // Prevent the click from propagating to the parent (which would open the pizarra)
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
        await axios.delete(`/pizarra-flutter/${pizarra.id}`);
        // Remove the pizarra from the list
        ownedPizarras.value = ownedPizarras.value.filter((p) => p.id !== pizarra.id);
        Swal.fire('Eliminado!', 'Su pizarra ha sido eliminada.', 'success');
    } catch (error) {
        console.error('Error deleting pizarra:', error);
        if (error.response && error.response.status === 403) {
            Swal.fire('Error!', 'No está autorizado a eliminar esta pizarra.', 'error');
        } else {
            Swal.fire('Error!', 'Se produjo un error al eliminar la pizarra.', 'error');
        }
    }
};

// Dejar de ser colaborador
const leaveCollaboration = async (pizarra) => {
    try {
        const response = await axios.post(`/pizarra-flutter/${pizarra.id}/leave`);
        // Remove the pizarra from the list
        collaboratingPizarras.value = collaboratingPizarras.value.filter((p) => p.id !== pizarra.id);
        if(response.status === 200) {
            Swal.fire('Éxito!', 'Has dejado de colaborar en la pizarra.', 'success');
        } else {
            Swal.fire('Error!', 'No se pudo dejar de colaborar en la pizarra.', 'error');
        }
    } catch (error) {
        console.error('Error al salir de la colaboración:', error);
        Swal.fire('Error!', 'No se pudo dejar de colaborar en la pizarra.', 'error');
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
        // Extract the pizarra ID from the invitation link
        const url = new URL(invitationLink.value);
        const pathParts = url.pathname.split('/');
        const pizarraId = pathParts[pathParts.length - 2];

        if (!pizarraId) {
            throw new Error('Enlace de invitación no válido');
        }

        // Redirect to the invitation link
        window.location.href = `/pizarra-flutter/invite/${pizarraId}`;
    } catch (error) {
        console.error('Error processing invitation link:', error);
        Swal.fire('Error!', 'Enlace de invitación no válido. Revísalo y vuelve a intentarlo.', 'error');
    } finally {
        processingLink.value = false;
    }
};
</script>

<template>
    <Head title="Pizarra Flutter" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <!-- Flash Message-->
            <div v-if="flashMessage" class="relative mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700" role="alert">
                <span class="block sm:inline">{{ flashMessage }}</span>
            </div>

            <div>
                <div>
                    <h1 class="text-2xl font-bold">Pizarra Flutter</h1>
                    <p class="text-gray-600">
                        Crea pizarras de Flutter arrastrando y soltando widgets. Los cambios se comparten con los colaboradores en tiempo real y se guardan
                        al hacer clic en el botón Guardar.
                    </p>
                </div>
                <div class="mt-2">
                    <button @click="createNewPizarra" class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Crear nueva pizarra</button>
                </div>
            </div>

            <!-- Invitation Link Input -->
            <div class="mb-4 rounded-lg bg-white p-4 shadow-md">
                <h2 class="mb-2 text-lg font-semibold">¿Tienes un enlace de invitación?</h2>
                <input
                    v-model="invitationLink"
                    type="text"
                    placeholder="Pega el enlace de invitación aquí"
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

            <!-- Lista de Pizarras -->
            <div v-if="!selectedPizarra && !showNewPizarra" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <!-- Mis Pizarras -->
                <FormList
                    :title="'Tus pizarras: [ ' + ownedPizarras.length+' ]'"
                    :forms="ownedPizarras"
                    :onSelect="selectPizarra"
                    :onDelete="deletePizarra"
                    :is-owner="true"
                    :is-invitations="false"
                    :is-colaborator="false"
                />

                <!-- Pizarras de Colaboracion -->
                <FormList
                    :title="'Pizarras de colaboración: [ ' +collaboratingPizarras.length+' ]'"
                    :forms="collaboratingPizarras"
                    :onSelect="selectPizarra"
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

                <!-- No Pizarras Message -->
                <div
                    v-if="ownedPizarras.length === 0 && collaboratingPizarras.length === 0 && pendingInvitations.length === 0"
                    class="col-span-full py-8 text-center"
                >
                    <p class="text-gray-500">Aún no tienes pizarras. Haz clic en "Crear nueva pizarra" para empezar.</p>
                </div>
            </div>
        </div>
    </AppLayout>
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
