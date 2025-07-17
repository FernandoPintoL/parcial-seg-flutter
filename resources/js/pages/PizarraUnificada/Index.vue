<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { router } from '@inertiajs/vue3';
import Swal from 'sweetalert2';
import axios from 'axios';
import type { PizarraUnificada } from '@/Data/PizarraUnificada';
// import type { User } from '@/types';

// Props
const props = defineProps({
    ownedPizarras: {
        type: Array as () => PizarraUnificada[],
        default: () => [],
    },
    collaboratingPizarras: {
        type: Array as () => PizarraUnificada[],
        default: () => [],
    },
    pendingInvitations: {
        type: Array as () => PizarraUnificada[],
        default: () => [],
    },
});

// Methods
const createPizarra = () => {
    router.visit('/pizarra-unificada/create');
};

const openPizarra = (id: number) => {
    router.visit(`/pizarra-unificada/${id}`);
};

const editPizarra = (id: number) => {
    router.visit(`/pizarra-unificada/${id}/edit`);
};

const deletePizarra = async (id: number) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await axios.delete(`/pizarra-unificada/${id}`);
            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'La pizarra ha sido eliminada',
                timer: 2000,
                showConfirmButton: false
            });
            router.reload();
        } catch (error: any) {
            console.error('Error al eliminar pizarra:', error);

            let errorMessage = 'No se pudo eliminar la pizarra';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 403) {
                errorMessage = 'No tienes permisos para eliminar esta pizarra';
            } else if (error.response?.status === 404) {
                errorMessage = 'La pizarra no fue encontrada';
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    }
};

const acceptInvitation = async (id: number) => {
    try {
        await axios.post(`/pizarra-unificada/${id}/accept`);
        Swal.fire({
            icon: 'success',
            title: 'Aceptado',
            text: 'Invitación aceptada correctamente',
            timer: 2000,
            showConfirmButton: false
        });
        router.reload();
    } catch (error: any) {
        console.error('Error al aceptar invitación:', error);

        let errorMessage = 'No se pudo aceptar la invitación';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.status === 403) {
            errorMessage = 'No tienes permisos para aceptar esta invitación';
        } else if (error.response?.status === 404) {
            errorMessage = 'La invitación no fue encontrada';
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
        });
    }
};

const rejectInvitation = async (id: number) => {
    try {
        await axios.post(`/pizarra-unificada/${id}/reject`);
        Swal.fire({
            icon: 'success',
            title: 'Rechazado',
            text: 'Invitación rechazada correctamente',
            timer: 2000,
            showConfirmButton: false
        });
        router.reload();
    } catch (error: any) {
        console.error('Error al rechazar invitación:', error);

        let errorMessage = 'No se pudo rechazar la invitación';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.status === 403) {
            errorMessage = 'No tienes permisos para rechazar esta invitación';
        } else if (error.response?.status === 404) {
            errorMessage = 'La invitación no fue encontrada';
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
        });
    }
};

const leaveCollaboration = async (id: number) => {
    const result = await Swal.fire({
        title: '¿Salir de la colaboración?',
        text: 'Ya no podrás acceder a esta pizarra',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await axios.post(`/pizarra-unificada/${id}/leave`);
            Swal.fire({
                icon: 'success',
                title: 'Salida exitosa',
                text: 'Has salido de la colaboración',
                timer: 2000,
                showConfirmButton: false
            });
            router.reload();
        } catch (error: any) {
            console.error('Error al salir de colaboración:', error);

            let errorMessage = 'No se pudo salir de la colaboración';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 403) {
                errorMessage = 'No tienes permisos para salir de esta colaboración';
            } else if (error.response?.status === 404) {
                errorMessage = 'La colaboración no fue encontrada';
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    }
};

const getFrameworkBadgeClass = (framework: string) => {
    switch (framework) {
        case 'flutter':
            return 'bg-blue-100 text-blue-800';
        case 'angular':
            return 'bg-red-100 text-red-800';
        case 'both':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>

<style scoped>
.transition-shadow {
    transition: box-shadow 0.15s ease-in-out;
}
</style>

<template>
    <AppLayout>

        <Head title="Pizarras Unificadas" />

        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-6">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">
                                Pizarras Unificadas
                            </h1>
                            <p class="text-gray-600 mt-2">
                                Gestiona tus pizarras de Flutter y Angular
                            </p>
                        </div>
                        <button @click="createPizarra"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Nueva Pizarra</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Invitaciones Pendientes -->
                <div v-if="pendingInvitations.length > 0" class="mb-8">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">
                        Invitaciones Pendientes
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div v-for="pizarra in props.pendingInvitations" :key="pizarra.id"
                            class="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-lg font-medium text-gray-900">
                                    {{ pizarra.name }}
                                </h3>
                                <span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                    Pendiente
                                </span>
                            </div>
                            <p class="text-sm text-gray-600 mb-4">
                                Invitado por: {{ pizarra.user?.name ?? 'Desconocido' }}
                            </p>
                            <div class="flex space-x-2">
                                <button v-if="pizarra.id !== undefined" @click="acceptInvitation(pizarra.id as number)"
                                    class="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm">
                                    Aceptar
                                </button>
                                <button v-if="pizarra.id !== undefined" @click="rejectInvitation(pizarra.id as number)"
                                    class="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm">
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mis Pizarras -->
                <div class="mb-8">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">
                        Mis Pizarras
                    </h2>
                    <div v-if="ownedPizarras.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div v-for="pizarra in props.ownedPizarras" :key="pizarra.id"
                            class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            @click="openPizarra(pizarra.id)">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-lg font-medium text-gray-900">
                                    {{ pizarra.name }}
                                </h3>
                                <span class="text-xs font-medium px-2.5 py-0.5 rounded"
                                    :class="getFrameworkBadgeClass(pizarra.framework)">
                                    {{ pizarra.framework }}
                                </span>
                            </div>
                            <p v-if="pizarra.description" class="text-sm text-gray-600 mb-4">
                                {{ pizarra.description }}
                            </p>
                            <div class="flex items-center justify-between text-sm text-gray-500">
                                <span>
                                    {{ formatDate(pizarra.updated_at) }}
                                </span>
                                <div class="flex space-x-2">
                                    <button @click.stop="editPizarra(pizarra.id)"
                                        class="text-blue-600 hover:text-blue-800">
                                        Editar
                                    </button>
                                    <button @click.stop="deletePizarra(pizarra.id)"
                                        class="text-red-600 hover:text-red-800">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-8">
                        <div class="text-gray-400 mb-4">
                            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p class="text-gray-500 text-lg">No tienes pizarras creadas</p>
                        <p class="text-gray-400 text-sm mt-2">Crea tu primera pizarra para empezar</p>
                    </div>
                </div>

                <!-- Pizarras Colaborativas -->
                <div>
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">
                        Colaboraciones
                    </h2>
                    <div v-if="collaboratingPizarras.length > 0"
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div v-for="pizarra in props.collaboratingPizarras" :key="pizarra.id"
                            class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-400"
                            @click="openPizarra(pizarra.id)">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-lg font-medium text-gray-900">
                                    {{ pizarra.name }}
                                </h3>
                                <span class="text-xs font-medium px-2.5 py-0.5 rounded"
                                    :class="getFrameworkBadgeClass(pizarra.framework)">
                                    {{ pizarra.framework }}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600 mb-4">
                                Creado por: {{ pizarra.user?.name ?? 'Desconocido' }}
                            </p>
                            <div class="flex items-center justify-between text-sm text-gray-500">
                                <span>
                                    {{ formatDate(pizarra.updated_at) }}
                                </span>
                                <button @click.stop="leaveCollaboration(pizarra.id)"
                                    class="text-red-600 hover:text-red-800">
                                    Salir
                                </button>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-8">
                        <div class="text-gray-400 mb-4">
                            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p class="text-gray-500 text-lg">No tienes colaboraciones activas</p>
                        <p class="text-gray-400 text-sm mt-2">Acepta invitaciones para colaborar</p>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>