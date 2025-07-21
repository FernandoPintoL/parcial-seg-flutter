<script setup lang="ts">
import { ref, computed } from 'vue';
import InvitationLinkGenerator from '@/components/InvitationLinkGenerator.vue';
import { InvitationService } from '@/services/InvitationService';

interface Props {
  show: boolean;
  pizarra: any;
  title?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'invitation-sent', email: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Invitar Colaboradores'
});

const emit = defineEmits<Emits>();

// State
const email = ref<string>('');
const isSending = ref<boolean>(false);
const sendResult = ref<{ success: boolean; message: string } | null>(null);

// Computed
const pizarraId = computed(() => props.pizarra?.id);
const roomId = computed(() => props.pizarra?.room_id);

// Methods
const sendInvitation = async () => {
  if (!email.value.trim()) return;

  isSending.value = true;
  sendResult.value = null;

  try {
    const result = await InvitationService.sendInvitation(email.value.trim(), pizarraId.value);

    if (result.success) {
      sendResult.value = {
        success: true,
        message: 'Invitación enviada exitosamente'
      };

      emit('invitation-sent', email.value.trim());
      email.value = ''; // Clear the input
    } else {
      sendResult.value = {
        success: false,
        message: result.error || 'Error al enviar la invitación'
      };
    }
  } catch (error: any) {
    console.error('Error sending invitation:', error);

    sendResult.value = {
      success: false,
      message: error.message || 'Error al enviar la invitación'
    };
  } finally {
    isSending.value = false;

    // Clear the result message after 3 seconds
    setTimeout(() => {
      sendResult.value = null;
    }, 3000);
  }
};

const closeModal = () => {
  emit('close');
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-blue-500 text-2xl">link</span>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              {{ title }}
            </h3>
          </div>
          <button @click="closeModal"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span class="material-icons text-gray-500">close</span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="space-y-6">
          <!-- Invitation Link Section -->
          <div>
            <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Enlace de Invitación</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Comparta este enlace para invitar a otros usuarios a colaborar en esta pizarra.
            </p>

            <InvitationLinkGenerator
              :pizarra-id="pizarraId"
              :room-id="roomId"
              button-variant="primary"
              container-class="mb-6"
            />
          </div>

          <!-- Email Invitation Section -->
          <div>
            <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Invitar por Correo Electrónico</h4>

            <div class="space-y-4">
              <div class="flex items-center space-x-2">
                <input
                  type="email"
                  v-model="email"
                  placeholder="Correo electrónico"
                  class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  @keyup.enter="sendInvitation"
                />
                <button
                  @click="sendInvitation"
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                  :disabled="isSending"
                >
                  <span class="material-icons text-sm">send</span>
                  <span>{{ isSending ? 'Enviando...' : 'Enviar' }}</span>
                </button>
              </div>

              <!-- Result message -->
              <div v-if="sendResult" :class="`p-3 rounded-lg ${sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`">
                {{ sendResult.message }}
              </div>

              <p class="text-sm text-gray-500 dark:text-gray-400">
                El colaborador recibirá una notificación por correo electrónico con un enlace para unirse a la pizarra.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          @click="closeModal"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles */
</style>
