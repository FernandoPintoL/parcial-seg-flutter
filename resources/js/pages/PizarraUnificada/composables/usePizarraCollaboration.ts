import { ref, onUnmounted } from 'vue';
import type { User, PizarraUnificada, UnifiedElement } from '@/Data/PizarraUnificada';
import { UnifiedCollaborationService } from '@/services/UnifiedCollaborationService';
import { getSocketConfig } from '@/lib/socketConfig';

interface CollaborationProps {
    user: User;
    pizarra: PizarraUnificada;
    creador: User;
    isCreador: boolean;
    colaboradores: User[];
}

interface CollaborationCallbacks {
    onElementAdded?: (element: UnifiedElement, screenId: string) => void;
    onElementUpdated?: (element: UnifiedElement, screenId: string) => void;
    onElementDeleted?: (elementId: string, screenId: string) => void;
    onFrameworkSwitched?: (framework: string) => void;
    onUserJoined?: (user: User) => void;
    onUserLeft?: (userId: string) => void;
}

export function usePizarraCollaboration(
    props: CollaborationProps,
    callbacks: CollaborationCallbacks = {}
) {
    // State
    const collaborationService = ref<UnifiedCollaborationService | null>(null);
    const socketConnected = ref<boolean>(false);
    const onlineCollaborators = ref<User[]>([]);
    const isCollaborating = ref<boolean>(false);
    const showChat = ref<boolean>(false);

    // Socket configuration
    const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
    const socketConfig = ref(getSocketConfig(useLocalSocket.value));
    const roomId = ref<string | null>(props.pizarra?.room_id || null);
    const currentUser = ref(props.user?.name || 'Usuario');
    const currentUserId = ref(props.user?.id || '');
    const pizarraId = ref(props.pizarra?.id || '');

    // We don't need this computed property as we're using collaborationService directly
    // const service = computed(() => collaborationService.value);

    // Initialize collaboration
    const initializeCollaboration = () => {
        console.log('Initializing collaboration with:', {
            roomId: roomId.value,
            currentUser: currentUser.value,
            pizarra: props.pizarra
        });

        if (!roomId.value) {
            console.warn('No room ID provided for collaboration');
            return;
        }

        try {
            console.log('Creating UnifiedCollaborationService with config:', socketConfig.value);

            collaborationService.value = new UnifiedCollaborationService(
                socketConfig.value,
                roomId.value,
                currentUser.value,
                currentUserId.value.toString(),
                pizarraId.value.toString()
            );

            console.log('Collaboration service created:', collaborationService.value);

            // Setup event listeners
            setupEventListeners();

            // Connect to collaboration service
            collaborationService.value.connect();

            // Don't set socketConnected to true here
            // It will be set by the 'connect' event handler
            isCollaborating.value = true;

            console.log('Collaboration service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize collaboration:', error);
            socketConnected.value = false;
            isCollaborating.value = false;
        }
    };

    // Setup event listeners for collaboration events
    const setupEventListeners = () => {
        if (!collaborationService.value) return;

        const service = collaborationService.value;

        // Element events
        service.socket.on('element-added', (data: { element: UnifiedElement; screenId: string; userId: string }) => {
            if (data.userId !== currentUser.value) {
                callbacks.onElementAdded?.(data.element, data.screenId);
            }
        });

        service.socket.on('element-updated', (data: { element: UnifiedElement; screenId: string; userId: string }) => {
            if (data.userId !== currentUser.value) {
                callbacks.onElementUpdated?.(data.element, data.screenId);
            }
        });

        service.socket.on('element-deleted', (data: { elementId: string; screenId: string; userId: string }) => {
            if (data.userId !== currentUser.value) {
                callbacks.onElementDeleted?.(data.elementId, data.screenId);
            }
        });

        // Framework switch events
        service.socket.on('framework-switched', (data: { framework: 'flutter' | 'angular' | 'both'; userId: string }) => {
            if (data.userId !== currentUser.value) {
                callbacks.onFrameworkSwitched?.(data.framework);
            }
        });

        // User presence events
        service.socket.on('user-joined', (user: User) => {
            if (!onlineCollaborators.value.find(c => String(c.id) === String(user.id))) {
                onlineCollaborators.value.push(user);
                callbacks.onUserJoined?.(user);
            }
        });

        service.socket.on('user-left', (userId: string) => {
            onlineCollaborators.value = onlineCollaborators.value.filter(c => String(c.id) !== String(userId));
            callbacks.onUserLeft?.(userId);
        });

        // Connection events
        service.socket.on('connect', () => {
            socketConnected.value = true;
            console.log('Connected to collaboration service');
        });

        service.socket.on('disconnect', () => {
            socketConnected.value = false;
            console.log('Disconnected from collaboration service');
        });

        service.socket.on('error', (error: any) => {
            console.error('Collaboration service error:', error);
            socketConnected.value = false;
        });
    };

    // Emit element addition to collaborators
    const emitElementAdded = (element: UnifiedElement, screenId: string) => {
        if (collaborationService.value && isCollaborating.value) {
            collaborationService.value.emitElementAdded(element, screenId);
        }
    };

    // Emit element update to collaborators
    const emitElementUpdated = (element: UnifiedElement, screenId: string) => {
        if (collaborationService.value && isCollaborating.value) {
            collaborationService.value.emitElementUpdated(element, screenId);
        }
    };

    // Emit element deletion to collaborators
    const emitElementDeleted = (elementId: string, screenId: string) => {
        if (collaborationService.value && isCollaborating.value) {
            collaborationService.value.emitElementDeleted(elementId, screenId);
        }
    };

    // Emit framework switch to collaborators
    const emitFrameworkSwitched = (framework: 'flutter' | 'angular' | 'both') => {
        if (collaborationService.value && isCollaborating.value) {
            collaborationService.value.emitFrameworkSwitched(framework);
        }
    };

    // Emit chat message
    const emitChatMessage = (message: string) => {
        if (collaborationService.value && isCollaborating.value) {
            collaborationService.value.emitChatMessage(message);
        }
    };

    // Emit typing indicator
    const emitTyping = () => {
        if (collaborationService.value && isCollaborating.value) {
            collaborationService.value.emitTyping();
        }
    };

    // Toggle chat visibility
    const toggleChat = () => {
        showChat.value = !showChat.value;
    };

    // Reconnect to collaboration service
    const reconnect = () => {
        if (collaborationService.value) {
            collaborationService.value.disconnect();
            collaborationService.value.connect();
        } else {
            initializeCollaboration();
        }
    };

    // Disconnect from collaboration service
    const disconnect = () => {
        if (collaborationService.value) {
            collaborationService.value.disconnect();
            socketConnected.value = false;
            isCollaborating.value = false;
        }
    };

    // Cleanup function
    const cleanup = () => {
        disconnect();
        onlineCollaborators.value = [];
    };

    // Auto cleanup on component unmount
    onUnmounted(() => {
        cleanup();
    });

    // Collaborator management methods
    const addCollaborator = async (email: string, status: string = 'pending') => {
        if (collaborationService.value && isCollaborating.value) {
            return await collaborationService.value.addCollaborator(email, status);
        }
        return { success: false, error: 'Collaboration service not available' };
    };

    const removeCollaborator = async (userId: string) => {
        if (collaborationService.value && isCollaborating.value) {
            return await collaborationService.value.removeCollaborator(userId);
        }
        return { success: false, error: 'Collaboration service not available' };
    };

    const updateCollaboratorStatus = async (userId: string, status: string) => {
        if (collaborationService.value && isCollaborating.value) {
            return await collaborationService.value.updateCollaboratorStatus(userId, status);
        }
        return { success: false, error: 'Collaboration service not available' };
    };

    const generateInvitationLink = () => {
        if (collaborationService.value && isCollaborating.value) {
            return collaborationService.value.generateInvitationLink();
        }
        return '';
    };

    return {
        // State
        collaborationService,
        socketConnected,
        onlineCollaborators,
        isCollaborating,
        currentUser,
        roomId,
        showChat,
        socketConfig, // Expose socketConfig
        currentUserId,
        pizarraId,

        // Methods
        initializeCollaboration,
        emitElementAdded,
        emitElementUpdated,
        emitElementDeleted,
        emitFrameworkSwitched,
        emitChatMessage,
        emitTyping,
        toggleChat,
        reconnect,
        disconnect,
        cleanup,

        // Collaborator management methods
        addCollaborator,
        removeCollaborator,
        updateCollaboratorStatus,
        generateInvitationLink
    };
}
