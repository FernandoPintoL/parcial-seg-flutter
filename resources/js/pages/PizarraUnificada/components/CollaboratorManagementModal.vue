<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { User } from '@/Data/PizarraUnificada';

interface Props {
  show: boolean;
  collaborators: User[];
  currentUser: User;
  isCreator: boolean;
  roomId: string;
  pizarraId: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'remove-collaborator', userId: string): void;
  (e: 'add-collaborator', email: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const invitationLink = ref<string>('');
const newCollaboratorEmail = ref<string>('');
const isGeneratingLink = ref<boolean>(false);
const linkCopied = ref<boolean>(false);
const showLinkSection = ref<boolean>(true);
const showCollaboratorsList = ref<boolean>(true);

// Computed properties
const filteredCollaborators = computed(() => {
  return props.collaborators.filter(collaborator =>
    collaborator.id !== props.currentUser.id
  );
});

const canManageCollaborators = computed(() => {
  return props.isCreator;
});

// Methods
const generateInvitationLink = () => {
  isGeneratingLink.value = true;

  try {
    // Create a base URL (use the current origin)
    const baseUrl = window.location.origin;

    // Create a link with roomId and pizarraId
    invitationLink.value = `${baseUrl}/pizarra_unificada/join?roomId=${props.roomId}&pizarraId=${props.pizarraId}`;

    // Add a timestamp to make the link unique
    const timestamp = new Date().getTime();
    invitationLink.value += `&t=${timestamp}`;

    isGeneratingLink.value = false;
  } catch (error) {
    console.error('Error generating invitation link:', error);
    isGeneratingLink.value = false;
  }
};

const copyInvitationLink = async () => {
  try {
    await navigator.clipboard.writeText(invitationLink.value);
    linkCopied.value = true;

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Error copying invitation link:', error);
    alert('No se pudo copiar el enlace. Por favor, cópielo manualmente.');
  }
};

const handleAddCollaborator = () => {
  if (!newCollaboratorEmail.value.trim()) return;

  emit('add-collaborator', newCollaboratorEmail.value.trim());
  newCollaboratorEmail.value = '';
};

const handleRemoveCollaborator = (userId: string) => {
  if (confirm('¿Está seguro de que desea eliminar a este colaborador?')) {
    emit('remove-collaborator', userId);
  }
};

// Generate link on mount
onMounted(() => {
  if (props.show) {
    generateInvitationLink();
  }
});
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-blue-500 text-2xl">people</span>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              Gestión de Colaboradores
            </h3>
          </div>
          <button @click="$emit('close')"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span class="material-icons text-gray-500">close</span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto flex-1">
        <!-- Invitation Link Section -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Enlace de Invitación</h4>
            <button
              @click="showLinkSection = !showLinkSection"
              class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span class="material-icons">{{ showLinkSection ? 'expand_less' : 'expand_more' }}</span>
            </button>
          </div>

          <div v-if="showLinkSection" class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400">
              Comparta este enlace para invitar a otros usuarios a colaborar en esta pizarra.
            </p>

            <div class="flex items-center space-x-2">
              <input
                type="text"
                v-model="invitationLink"
                readonly
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <button
                @click="copyInvitationLink"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                :disabled="isGeneratingLink"
              >
                <span class="material-icons text-sm">{{ linkCopied ? 'check' : 'content_copy' }}</span>
                <span>{{ linkCopied ? 'Copiado' : 'Copiar' }}</span>
              </button>
            </div>

            <button
              @click="generateInvitationLink"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
              :disabled="isGeneratingLink"
            >
              <span class="material-icons text-sm">refresh</span>
              <span>{{ isGeneratingLink ? 'Generando...' : 'Generar Nuevo Enlace' }}</span>
            </button>
          </div>
        </div>

        <!-- Collaborators List Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Colaboradores Actuales</h4>
            <button
              @click="showCollaboratorsList = !showCollaboratorsList"
              class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span class="material-icons">{{ showCollaboratorsList ? 'expand_less' : 'expand_more' }}</span>
            </button>
          </div>

          <div v-if="showCollaboratorsList" class="space-y-4">
            <!-- Current user (you) -->
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="material-icons text-blue-500">person</span>
                <div>
                  <p class="font-medium text-gray-800 dark:text-gray-200">{{ props.currentUser.name }} (Tú)</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ props.isCreator ? 'Creador' : 'Colaborador' }}</p>
                </div>
              </div>
            </div>

            <!-- Other collaborators -->
            <div v-if="filteredCollaborators.length > 0" class="space-y-2">
              <div
                v-for="collaborator in filteredCollaborators"
                :key="collaborator.id"
                class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
              >
                <div class="flex items-center space-x-3">
                  <span class="material-icons text-gray-500">person</span>
                  <div>
                    <p class="font-medium text-gray-800 dark:text-gray-200">{{ collaborator.name }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Colaborador</p>
                  </div>
                </div>

                <button
                  v-if="canManageCollaborators"
                  @click="handleRemoveCollaborator(collaborator.id.toString())"
                  class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                  title="Eliminar colaborador"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>

            <div v-else class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <p class="text-gray-500 dark:text-gray-400">No hay otros colaboradores en esta pizarra.</p>
            </div>

            <!-- Add new collaborator form -->
            <div v-if="canManageCollaborators" class="mt-6">
              <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Agregar Colaborador</h5>
              <div class="flex items-center space-x-2">
                <input
                  type="email"
                  v-model="newCollaboratorEmail"
                  placeholder="Correo electrónico"
                  class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button
                  @click="handleAddCollaborator"
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span class="material-icons text-sm">person_add</span>
                  <span>Agregar</span>
                </button>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                El colaborador recibirá una notificación por correo electrónico.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
