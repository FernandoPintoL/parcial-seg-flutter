<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import { io } from 'socket.io-client';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import axios from 'axios';
import { getSocketConfig, toggleSocketEnvironment } from '@/lib/socketConfig';
import Swal from 'sweetalert2';

// Get current user from page props
const page = usePage();
const currentUser = computed(() => page.props.auth?.user);

// Get forms for chat room selection
const ownedForms = ref([]);
const collaboratingForms = ref([]);
const selectedRoom = ref('general');

// Load forms for chat room selection
const loadForms = async () => {
    try {
        const response = await axios.get('/form-builder');
        ownedForms.value = response.data.ownedForms || [];
        collaboratingForms.value = response.data.collaboratingForms || [];
    } catch (error) {
        console.error('Error loading forms:', error);
    }
};

// Socket.io connection
const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
const socketConfig = ref(getSocketConfig(useLocalSocket.value));
const socket = io(socketConfig.value.url, socketConfig.value.options);
const socketConnected = ref(false);
const socketError = ref('');

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
        title: 'Socket Server Changed',
        text: `Now using ${useLocalSocket.value ? 'local' : 'production'} socket server: ${socketConfig.value.url}`,
        icon: 'info',
        timer: 3000,
        showConfirmButton: false
    });

    // Rejoin the current room
    if (selectedRoom.value) {
        joinRoom(selectedRoom.value);
    }
};
const messages = ref<Array<{text: string, user: string, timestamp: number}>>([]);
const message = ref('');
const escribiendoP = reactive({
    escribiendo: '',
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Chat',
        href: '/chat',
    },
];
// Join a chat room
const joinRoom = (roomId) => {
    // Leave current room if any
    if (selectedRoom.value) {
        socket.emit('leaveRoom', { roomId: selectedRoom.value, user: currentUser.value.name });
    }

    // Join new room
    selectedRoom.value = roomId;
    socket.emit('joinRoom', { roomId, user: currentUser.value.name });

    // Clear messages when changing rooms
    messages.value = [];

    // If this is a form-specific room, load messages from the database
    if (roomId.startsWith('form-')) {
        loadFormMessages(roomId.replace('form-', ''));
    }
};

// Load chat messages for a specific form from the database
const loadFormMessages = async (formId) => {
    try {
        const response = await axios.get(`/chat/form/${formId}/messages`);

        // Convert database messages to the format expected by the UI
        const dbMessages = response.data.map(msg => ({
            text: msg.message,
            user: msg.user.name,
            timestamp: new Date(msg.created_at).getTime(),
            isSystemMessage: msg.is_system_message
        }));

        // Add messages to the messages array
        messages.value = dbMessages;
    } catch (error) {
        console.error('Error loading form messages:', error);
        if (error.response?.status === 403) {
            Swal.fire({
                title: 'Access Denied',
                text: 'You do not have access to this form\'s chat.',
                icon: 'error'
            });
            // Revert to general chat
            joinRoom('general');
        }
    }
};

const sendMessage = async () => {
    if (message.value.trim()) {
        const timestamp = Date.now();
        const messageData = {
            text: message.value,
            user: currentUser.value.name,
            timestamp: timestamp,
            roomId: selectedRoom.value
        };

        // Emit message to socket for real-time updates
        socket.emit('chatMessage', messageData);

        // Add message to local messages array
        messages.value.push({
            text: message.value,
            user: currentUser.value.name,
            timestamp: timestamp
        });

        // If this is a form-specific room, save message to database
        if (selectedRoom.value.startsWith('form-')) {
            try {
                const formId = selectedRoom.value.replace('form-', '');
                await axios.post('/chat/message', {
                    form_id: formId,
                    message: message.value,
                    is_system_message: false
                });
            } catch (error) {
                console.error('Error saving message to database:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to save message to database. Please try again.',
                    icon: 'error',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
        }

        message.value = '';
    }
};

const onInputText = () => {
    socket.emit('escribiendo', {
        user: currentUser.value.name,
        roomId: selectedRoom.value
    });
};

onMounted(() => {
    // Load forms for chat room selection
    loadForms();

    // Set up socket connection event handlers
    socket.on('connect', () => {
        console.log('Socket connected');
        socketConnected.value = true;
        socketError.value = '';

        // Join the general room by default
        joinRoom('general');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        socketConnected.value = false;
        socketError.value = `Connection error: ${err.message}`;
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        socketConnected.value = false;
        if (reason === 'io server disconnect') {
            // the disconnection was initiated by the server, reconnect manually
            socket.connect();
        }
    });

    // Listen for chat messages
    socket.on('chatMessage', (data) => {
        console.log('Received message:', data);
        // Only add messages for the current room
        if (data.roomId === selectedRoom.value) {
            messages.value.push({
                text: data.text,
                user: data.user,
                timestamp: data.timestamp
            });
        }
    });

    // Listen for legacy messages (for backward compatibility)
    socket.on('mensaje', (msg) => {
        console.log('Received legacy message:', msg);
        if (typeof msg === 'string') {
            messages.value.push({
                text: msg,
                user: 'Unknown',
                timestamp: Date.now()
            });
        }
    });

    // Listen for typing events
    socket.on('escribiendo', (data) => {
        console.log('Usuario escribiendo:', data);
        // Only show typing indicator for the current room
        if (data.roomId === selectedRoom.value) {
            escribiendoP.escribiendo = data.user + ' está escribiendo...';
            setTimeout(() => {
                escribiendoP.escribiendo = '';
            }, 4000);
        }
    });
});

onUnmounted(() => {
    // Clean up all socket event listeners
    socket.off('connect');
    socket.off('connect_error');
    socket.off('disconnect');
    socket.off('chatMessage');
    socket.off('mensaje');
    socket.off('escribiendo');

    // Leave the current room
    if (selectedRoom.value) {
        socket.emit('leaveRoom', { roomId: selectedRoom.value, user: currentUser.value.name });
    }
});
</script>

<template>
    <Head title="Chat" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <!-- Socket connection status -->
            <div class="mb-2 flex items-center justify-between">
                <div>
                    <span v-if="socketConnected" class="text-green-600 flex items-center">
                        <span class="inline-block w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                        Connected to {{ useLocalSocket ? 'Local' : 'Production' }} server
                    </span>
                    <span v-else class="text-red-600 flex items-center">
                        <span class="inline-block w-2 h-2 bg-red-600 rounded-full mr-1"></span>
                        Disconnected from server
                    </span>
                    <span v-if="socketError" class="block text-red-600 mt-1">{{ socketError }}</span>
                </div>
                <button
                    @click="toggleSocketServer"
                    class="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                    title="Switch between local and production socket servers"
                >
                    Switch to {{ useLocalSocket ? 'Production' : 'Local' }}
                </button>
            </div>

            <!-- Room selector -->
            <div class="mb-4">
                <h2 class="text-lg font-semibold mb-2">Chat Rooms</h2>
                <div class="flex flex-wrap gap-2">
                    <button
                        @click="joinRoom('general')"
                        :class="['px-3 py-1 rounded text-sm', selectedRoom === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300']"
                    >
                        General
                    </button>

                    <!-- Owned forms rooms -->
                    <template v-if="ownedForms.length > 0">
                        <button
                            v-for="form in ownedForms"
                            :key="'owned-' + form.id"
                            @click="joinRoom('form-' + form.id)"
                            :class="['px-3 py-1 rounded text-sm', selectedRoom === 'form-' + form.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300']"
                        >
                            {{ form.name }}
                        </button>
                    </template>

                    <!-- Collaborating forms rooms -->
                    <template v-if="collaboratingForms.length > 0">
                        <button
                            v-for="form in collaboratingForms"
                            :key="'collab-' + form.id"
                            @click="joinRoom('form-' + form.id)"
                            :class="['px-3 py-1 rounded text-sm', selectedRoom === 'form-' + form.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300']"
                        >
                            {{ form.name }}
                        </button>
                    </template>
                </div>
            </div>

            <!-- Chat messages -->
            <div class="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4 mb-4">
                <h2 class="text-lg font-semibold mb-2">{{ selectedRoom === 'general' ? 'General Chat' : 'Project Chat' }}</h2>
                <div v-if="messages.length === 0" class="text-gray-500 text-center py-4">
                    No messages yet. Start the conversation!
                </div>
                <ul class="space-y-3">
                    <li
                        v-for="(msg, index) in messages"
                        :key="index"
                        :class="[
                            'p-3 rounded-lg max-w-3/4',
                            msg.user === currentUser.name ?
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
                <p v-if="escribiendoP.escribiendo" class="text-sm text-gray-500 italic mt-2">
                    {{ escribiendoP.escribiendo }}
                </p>
            </div>

            <!-- Message input -->
            <form @submit.prevent="sendMessage" class="flex gap-2">
                <input
                    v-model="message"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                    autocomplete="off"
                    @input="onInputText"
                />
                <button
                    type="submit"
                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Send
                </button>
            </form>
        </div>
    </AppLayout>
</template>

<style scoped>
/* Chat styles are now handled by Tailwind classes in the template */
</style>
