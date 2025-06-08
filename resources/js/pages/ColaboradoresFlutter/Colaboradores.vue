<script setup lang="ts">
import { ref } from 'vue';
import { AlertService } from '@/services/AlertService';
import axios from 'axios';
import type { Pizarra } from '@/types/Pizarra';

const props = defineProps<{
    collaborators: Array<{ id?: string; name?: string; email: string }>;
    onlineCollaborators: Array<string>;
    pizarra: Pizarra | null;
}>();

const showInviteForm = ref(false);
const showInviteLink = ref(false);
const inviteEmail = ref<string>('');
const inviteLink = ref<string>('');

const generateInviteLink = () => {
    // Simulate generating an invite link
    showInviteLink.value = !showInviteLink.value;
    inviteLink.value = `${window.location.origin}/pizarra/${props.pizarra?.id}/invite/flutter`;
};

const inviteCollaborator = async () => {
    if (!props.pizarra?.id || !inviteEmail.value) return;

    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail.value)) {
            AlertService.prototype.error('Error', 'Formato de correo electrónico inválido');
            return;
        }

        await axios.post(`/pizarra/${props.pizarra?.id}/invite/flutter`, {
            email: inviteEmail.value
        });

        AlertService.prototype.success('Éxito', 'Invitación enviada correctamente');

        inviteEmail.value = '';
        showInviteForm.value = false;
        // loadCollaborators();
    } catch (error) {
        console.error('Error inviting collaborator:', error);
        AlertService.prototype.error('Error', 'No se pudo enviar la invitación');
    }
};

const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            AlertService.prototype.success(successMessage);
        })
        .catch((err) => {
            console.error('Error copying to clipboard:', err);
            AlertService.prototype.error('Error', 'No se pudo copiar al portapapeles');
        });
};
// Copy invite link to clipboard
const copyInviteLink = () => {
    copyToClipboard(inviteLink.value, '¡Enlace copiado al portapapeles!');
};

</script>

<template>
    <div class="mt-4 rounded-md bg-gray-100 p-4">
        <h3 class="mb-2 text-lg font-semibold">Gestión de Colaboradores</h3>

        <!-- Invite Button -->
        <div class="mb-4 flex gap-2">
            <button @click="showInviteForm = !showInviteForm"
                    class="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600">
                {{ showInviteForm ? 'Cancelar' : 'Invitar Colaborador' }}
            </button>

            <button @click="generateInviteLink"
                    class="rounded-md bg-purple-500 px-4 py-2 text-white hover:bg-purple-600">
                {{ showInviteLink ? 'Ocultar Enlace' : 'Generar Enlace de Invitación' }}
            </button>
        </div>

        <!-- Invite Form -->
        <div v-if="showInviteForm" class="mb-4 rounded-md border border-gray-300 bg-white p-4">
            <div class="flex gap-2">
                <input v-model="inviteEmail" type="email" placeholder="Correo electrónico"
                       class="flex-1 rounded-md border px-3 py-2" />
                <button @click="inviteCollaborator"
                        class="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600">Invitar
                </button>
            </div>
        </div>

        <!-- Invite Link -->
        <div v-if="showInviteLink" class="mb-4 rounded-md border border-gray-300 bg-white p-4">
            <div class="flex gap-2">
                <input v-model="inviteLink" type="text" readonly
                       class="flex-1 rounded-md border bg-gray-50 px-3 py-2" />
                <button @click="copyInviteLink"
                        class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Copiar
                </button>
            </div>
        </div>

        <!-- Collaborators List -->
        <div v-if="collaborators.length > 0" class="mt-4">
            <h4 class="mb-2 font-medium">Colaboradores</h4>
            <div class="space-y-2">
                <div
                    v-for="collaborator in collaborators"
                    :key="collaborator.id || collaborator.email"
                    class="flex items-center justify-between rounded-md border border-gray-300 bg-white p-2"
                >
                    <div class="flex items-center gap-2">
                        <div
                            class="h-3 w-3 rounded-full"
                            :class="onlineCollaborators.includes(collaborator.name || collaborator.email) ? 'bg-green-500' : 'bg-gray-400'"
                            :title="onlineCollaborators.includes(collaborator.name || collaborator.email) ? 'En línea' : 'Desconectado'"
                        ></div>
                        <span>{{ collaborator.name || collaborator.email }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="mt-4 text-center text-gray-500">No hay colaboradores aún</div>
    </div>
</template>
