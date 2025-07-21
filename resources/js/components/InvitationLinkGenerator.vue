<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { InvitationService, type InvitationLinkOptions } from '@/services/InvitationService';

interface Props {
  pizarraId: string | number;
  roomId?: string;
  showCopyButton?: boolean;
  showRefreshButton?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
  buttonVariant?: 'primary' | 'secondary' | 'success' | 'danger';
  inputClass?: string;
  buttonClass?: string;
  containerClass?: string;
}

interface Emits {
  (e: 'link-generated', link: string): void;
  (e: 'link-copied'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showCopyButton: true,
  showRefreshButton: true,
  buttonSize: 'md',
  buttonVariant: 'primary',
  inputClass: '',
  buttonClass: '',
  containerClass: '',
});

const emit = defineEmits<Emits>();

// State
const invitationLink = ref<string>('');
const isGeneratingLink = ref<boolean>(false);
const linkCopied = ref<boolean>(false);

// Methods
const generateInvitationLink = () => {
  isGeneratingLink.value = true;

  try {
    const options: InvitationLinkOptions = {
      pizarraId: props.pizarraId,
      roomId: props.roomId,
      includeTimestamp: true
    };

    invitationLink.value = InvitationService.generateInvitationLink(options);
    emit('link-generated', invitationLink.value);

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
    emit('link-copied');

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Error copying invitation link:', error);
    alert('No se pudo copiar el enlace. Por favor, cópielo manualmente.');
  }
};

// Computed styles
const getButtonClasses = () => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return `${sizeClasses[props.buttonSize]} ${variantClasses[props.buttonVariant]} rounded-lg transition-colors flex items-center space-x-2 ${props.buttonClass}`;
};

// Generate link on mount
onMounted(() => {
  generateInvitationLink();
});
</script>

<template>
  <div :class="`flex flex-col space-y-2 ${containerClass}`">
    <div class="flex items-center space-x-2">
      <input
        type="text"
        v-model="invitationLink"
        readonly
        :class="`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ${inputClass}`"
      />

      <button
        v-if="showCopyButton"
        @click="copyInvitationLink"
        :class="getButtonClasses()"
        :disabled="isGeneratingLink"
      >
        <span class="material-icons text-sm">{{ linkCopied ? 'check' : 'content_copy' }}</span>
        <span>{{ linkCopied ? 'Copiado' : 'Copiar' }}</span>
      </button>
    </div>

    <button
      v-if="showRefreshButton"
      @click="generateInvitationLink"
      class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2 self-start"
      :disabled="isGeneratingLink"
    >
      <span class="material-icons text-sm">refresh</span>
      <span>{{ isGeneratingLink ? 'Generando...' : 'Generar Nuevo Enlace' }}</span>
    </button>
  </div>
</template>

<style scoped>
/* Component-specific styles */
</style>
