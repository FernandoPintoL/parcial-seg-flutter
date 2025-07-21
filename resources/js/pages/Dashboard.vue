<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/vue3';
import { ref, computed, onMounted } from 'vue';
import InvitationModal from '@/components/InvitationModal.vue';
import Swal from 'sweetalert2';

// Props interface
interface Pizarra {
    id: number;
    name: string;
    description?: string;
    type: 'flutter' | 'angular' | 'unified' | 'both';
    framework?: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    screens?: any[];
    elements?: any[];
}

interface Invitation {
    id: number;
    pizarra: Pizarra;
    status: string;
}

const props = defineProps<{
    ownedForms: Pizarra[];
    collaboratingForms: any[];
    pendingInvitations: Invitation[];
}>();// Reactive states
const selectedView = ref<'overview' | 'owned' | 'collaborating' | 'pending'>('overview');
const searchQuery = ref('');
const sortBy = ref<'name' | 'date' | 'type'>('date');
const isLoading = ref(false);

// State for invitation modal
const showInviteModal = ref(false);
const selectedPizarra = ref<Pizarra | null>(null);

// Show invitation modal for a specific pizarra
const showInvitationModal = (pizarra: Pizarra) => {
    selectedPizarra.value = pizarra;
    showInviteModal.value = true;
};

// Handle invitation sent event
const handleInvitationSent = (email: string) => {
    Swal.fire({
        icon: 'success',
        title: 'Invitación enviada',
        text: `Se ha enviado una invitación a ${email}`,
        timer: 2000,
        showConfirmButton: false
    });
};

// Computed properties
const filteredOwnedPizarras = computed(() => {
    let filtered = props.ownedForms || [];

    if (searchQuery.value) {
        filtered = filtered.filter(pizarra =>
            pizarra.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    }

    return filtered.sort((a, b) => {
        if (sortBy.value === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy.value === 'date') {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        } else {
            return a.type.localeCompare(b.type);
        }
    });
}); const stats = computed(() => ({
    total: (props.ownedForms?.length || 0) + (props.collaboratingForms?.length || 0),
    owned: props.ownedForms?.length || 0,
    collaborating: props.collaboratingForms?.length || 0,
    pending: props.pendingInvitations?.length || 0,
}));

const recentActivity = computed(() => {
    const allPizarras = [...(props.ownedForms || []), ...(props.collaboratingForms || [])];
    return allPizarras
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
});

// Methods
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    return date.toLocaleDateString('es-ES');
};

const getFrameworkIcon = (type: string) => {
    switch (type) {
        case 'flutter': return '🎯';
        case 'angular': return '🅰️';
        case 'unified': return '🔗';
        case 'both': return '🔄';
        default: return '📱';
    }
};

const getFrameworkColor = (type: string) => {
    switch (type) {
        case 'flutter': return 'from-blue-500 to-cyan-500';
        case 'angular': return 'from-red-500 to-pink-500';
        case 'unified': return 'from-green-500 to-teal-500';
        case 'both': return 'from-purple-500 to-indigo-500';
        default: return 'from-gray-500 to-gray-600';
    }
};

const createNewPizarra = () => {
    isLoading.value = true;
    router.visit('/pizarra_unificada/create');
};

const openPizarra = (pizarraId: number) => {
    isLoading.value = true;
    router.visit(`/pizarra_unificada/${pizarraId}/edit`);
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

onMounted(() => {
    // Animation delay for smooth loading
    setTimeout(() => {
        isLoading.value = false;
    }, 300);
});
</script>

<template>

    <Head title="Dashboard" />

    <AppLayout title="Dashboard" :breadcrumbs="breadcrumbs">
        <!-- Loading Overlay -->
        <div v-if="isLoading" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div class="bg-white rounded-2xl p-8 shadow-2xl">
                <div class="flex items-center space-x-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="text-gray-700 font-medium">Cargando...</span>
                </div>
            </div>
        </div>

        <!-- Hero Section -->
        <div
            class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl mb-8 shadow-xl">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
            <div class="relative px-8 py-12">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div class="mb-8 lg:mb-0">
                        <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            ¡Bienvenido de vuelta! 👋
                        </h1>
                        <p class="text-xl text-gray-600 mb-6 max-w-2xl">
                            Gestiona tus pizarras, colabora con tu equipo y crea experiencias increíbles.
                        </p>
                        <div class="flex flex-wrap gap-4">
                            <button @click="createNewPizarra"
                                class="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3">
                                <span class="material-icons text-2xl">add_circle</span>
                                <span>Nueva Pizarra</span>
                            </button>
                            <button
                                class="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3">
                                <span class="material-icons text-2xl">explore</span>
                                <span>Explorar Plantillas</span>
                            </button>
                        </div>
                    </div>
                    <div class="hidden lg:block">
                        <div class="w-64 h-64 relative">
                            <div
                                class="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse opacity-20">
                            </div>
                            <div
                                class="absolute inset-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-bounce opacity-30">
                            </div>
                            <div
                                class="absolute inset-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full opacity-40">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Total de Pizarras</p>
                        <p class="text-3xl font-bold text-gray-900">{{ stats.total }}</p>
                    </div>
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <span class="material-icons text-white text-xl">dashboard</span>
                    </div>
                </div>
            </div>

            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Mis Pizarras</p>
                        <p class="text-3xl font-bold text-gray-900">{{ stats.owned }}</p>
                    </div>
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <span class="material-icons text-white text-xl">person</span>
                    </div>
                </div>
            </div>

            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Colaboraciones</p>
                        <p class="text-3xl font-bold text-gray-900">{{ stats.collaborating }}</p>
                    </div>
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <span class="material-icons text-white text-xl">group</span>
                    </div>
                </div>
            </div>

            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Invitaciones</p>
                        <p class="text-3xl font-bold text-gray-900">{{ stats.pending }}</p>
                    </div>
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <span class="material-icons text-white text-xl">mail</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg mb-8 border border-white/50">
            <div class="flex space-x-1">
                <button @click="selectedView = 'overview'" :class="[
                    'flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2',
                    selectedView === 'overview'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                ]">
                    <span class="material-icons text-lg">view_quilt</span>
                    <span>Vista General</span>
                </button>
                <button @click="selectedView = 'owned'" :class="[
                    'flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2',
                    selectedView === 'owned'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                ]">
                    <span class="material-icons text-lg">person</span>
                    <span>Mis Pizarras</span>
                </button>
                <button @click="selectedView = 'collaborating'" :class="[
                    'flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2',
                    selectedView === 'collaborating'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                ]">
                    <span class="material-icons text-lg">group</span>
                    <span>Colaboraciones</span>
                </button>
                <button @click="selectedView = 'pending'" :class="[
                    'flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2',
                    selectedView === 'pending'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                ]">
                    <span class="material-icons text-lg">mail</span>
                    <span>Invitaciones</span>
                    <span v-if="stats.pending > 0" class="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                        {{ stats.pending }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Content Sections -->
        <div class="space-y-8">
            <!-- Overview Section -->
            <div v-if="selectedView === 'overview'" class="space-y-8">
                <!-- Search and Filters -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div class="flex-1 max-w-md">
                            <div class="relative">
                                <span
                                    class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                                <input v-model="searchQuery" type="text" placeholder="Buscar pizarras..."
                                    class="w-full pl-12 pr-4 py-3 rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-300">
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <select v-model="sortBy"
                                class="px-4 py-3 rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-300">
                                <option value="date">Más recientes</option>
                                <option value="name">Por nombre</option>
                                <option value="type">Por tipo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div v-if="recentActivity.length > 0"
                    class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span class="material-icons text-blue-600 mr-3">timeline</span>
                        Actividad Reciente
                    </h3>
                    <div class="space-y-3">
                        <div v-for="pizarra in recentActivity" :key="pizarra.id"
                            class="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 cursor-pointer group"
                            @click="openPizarra(pizarra.id)">
                            <div class="flex items-center space-x-4">
                                <div
                                    :class="`w-3 h-3 rounded-full bg-gradient-to-r ${getFrameworkColor(pizarra.type)}`">
                                </div>
                                <div>
                                    <p class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {{ pizarra.name }}
                                    </p>
                                    <p class="text-sm text-gray-500">{{ formatDate(pizarra.updated_at) }}</p>
                                </div>
                            </div>
                            <span class="text-2xl">{{ getFrameworkIcon(pizarra.type) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Owned Pizarras Grid -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span class="material-icons text-green-600 mr-3">person</span>
                        Mis Pizarras ({{ filteredOwnedPizarras.length }})
                    </h3>

                    <div v-if="filteredOwnedPizarras.length === 0" class="text-center py-12">
                        <div
                            class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <span class="material-icons text-4xl text-gray-400">dashboard</span>
                        </div>
                        <h4 class="text-xl font-semibold text-gray-700 mb-2">No tienes pizarras aún</h4>
                        <p class="text-gray-500 mb-6">Crea tu primera pizarra para empezar a diseñar</p>
                        <button @click="createNewPizarra"
                            class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                            Crear Primera Pizarra
                        </button>
                    </div>

                    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div v-for="pizarra in filteredOwnedPizarras" :key="pizarra.id"
                            class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-100"
                            @click="openPizarra(pizarra.id)">
                            <!-- Card Header -->
                            <div class="flex items-start justify-between mb-4">
                                <div
                                    :class="`w-12 h-12 rounded-xl bg-gradient-to-br ${getFrameworkColor(pizarra.type)} flex items-center justify-center text-2xl shadow-lg`">
                                    {{ getFrameworkIcon(pizarra.type) }}
                                </div>
                                <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                        <span class="material-icons text-sm">edit</span>
                                    </button>
                                    <button
                                        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                        <span class="material-icons text-sm">delete</span>
                                    </button>
                                    <button
                                        @click.stop="showInvitationModal(pizarra)"
                                        class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                                        <span class="material-icons text-sm">person_add</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Card Content -->
                            <div class="mb-4">
                                <h4
                                    class="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                                    {{ pizarra.name }}
                                </h4>
                                <p class="text-gray-600 text-sm line-clamp-2">
                                    {{ pizarra.description || 'Sin descripción' }}
                                </p>
                            </div>

                            <!-- Card Footer -->
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-500">{{ formatDate(pizarra.updated_at) }}</span>
                                <div class="flex items-center space-x-2">
                                    <span
                                        class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                                        {{ pizarra.type }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Owned Pizarras Section -->
            <div v-if="selectedView === 'owned'"
                class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900 flex items-center">
                        <span class="material-icons text-green-600 mr-3">person</span>
                        Mis Pizarras ({{ filteredOwnedPizarras.length }})
                    </h3>
                    <button @click="createNewPizarra"
                        class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                        <span class="material-icons">add</span>
                        <span>Nueva Pizarra</span>
                    </button>
                </div>

                <div v-if="filteredOwnedPizarras.length === 0" class="text-center py-12">
                    <div
                        class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                        <span class="material-icons text-4xl text-gray-400">dashboard</span>
                    </div>
                    <h4 class="text-xl font-semibold text-gray-700 mb-2">No tienes pizarras aún</h4>
                    <p class="text-gray-500">Crea tu primera pizarra para empezar a diseñar</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="pizarra in filteredOwnedPizarras" :key="pizarra.id"
                        class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-100"
                        @click="openPizarra(pizarra.id)">
                        <!-- Card content similar to overview section -->
                        <div class="flex items-start justify-between mb-4">
                            <div
                                :class="`w-12 h-12 rounded-xl bg-gradient-to-br ${getFrameworkColor(pizarra.type)} flex items-center justify-center text-2xl shadow-lg`">
                                {{ getFrameworkIcon(pizarra.type) }}
                            </div>
                            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                    <span class="material-icons text-sm">edit</span>
                                </button>
                                <button
                                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                    <span class="material-icons text-sm">delete</span>
                                </button>
                                <button
                                    @click.stop="showInvitationModal(pizarra)"
                                    class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                                    <span class="material-icons text-sm">person_add</span>
                                </button>
                            </div>
                        </div>
                        <div class="mb-4">
                            <h4
                                class="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                                {{ pizarra.name }}
                            </h4>
                            <p class="text-gray-600 text-sm line-clamp-2">
                                {{ pizarra.description || 'Sin descripción' }}
                            </p>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-500">{{ formatDate(pizarra.updated_at) }}</span>
                            <span
                                class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                                {{ pizarra.type }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Collaborating Section -->
            <div v-if="selectedView === 'collaborating'"
                class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span class="material-icons text-purple-600 mr-3">group</span>
                    Colaboraciones ({{ collaboratingForms.length }})
                </h3>

                <div v-if="collaboratingForms.length === 0" class="text-center py-12">
                    <div
                        class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex items-center justify-center">
                        <span class="material-icons text-4xl text-purple-400">group</span>
                    </div>
                    <h4 class="text-xl font-semibold text-gray-700 mb-2">No tienes colaboraciones activas</h4>
                    <p class="text-gray-500">Cuando otros usuarios te inviten a colaborar, aparecerán aquí</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="pizarra in collaboratingForms" :key="pizarra.id"
                        class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-100"
                        @click="openPizarra(pizarra.id)">
                        <div class="flex items-start justify-between mb-4">
                            <div
                                class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                                <span class="material-icons text-white">group</span>
                            </div>
                            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                Colaborador
                            </span>
                        </div>
                        <div class="mb-4">
                            <h4
                                class="font-bold text-gray-900 text-lg mb-2 group-hover:text-purple-600 transition-colors">
                                {{ pizarra.name }}
                            </h4>
                            <p class="text-gray-600 text-sm">
                                Colaborando con el equipo
                            </p>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-500">{{ formatDate(pizarra.updated_at) }}</span>
                            <span class="text-purple-600 font-medium">Ver proyecto</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pending Invitations Section -->
            <div v-if="selectedView === 'pending'"
                class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span class="material-icons text-orange-600 mr-3">mail</span>
                    Invitaciones Pendientes ({{ pendingInvitations.length }})
                </h3>

                <div v-if="pendingInvitations.length === 0" class="text-center py-12">
                    <div
                        class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full flex items-center justify-center">
                        <span class="material-icons text-4xl text-orange-400">mail_outline</span>
                    </div>
                    <h4 class="text-xl font-semibold text-gray-700 mb-2">No tienes invitaciones pendientes</h4>
                    <p class="text-gray-500">Las nuevas invitaciones de colaboración aparecerán aquí</p>
                </div>

                <div v-else class="space-y-4">
                    <div v-for="invitation in pendingInvitations" :key="invitation.id"
                        class="bg-white rounded-2xl p-6 border-l-4 border-orange-500 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-900 text-lg mb-2">
                                    {{ invitation.pizarra.name }}
                                </h4>
                                <p class="text-gray-600 mb-4">
                                    Te han invitado a colaborar en esta pizarra
                                </p>
                                <div class="flex space-x-3">
                                    <button
                                        class="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                                        Aceptar
                                    </button>
                                    <button
                                        class="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300">
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                            <div class="ml-4">
                                <div
                                    class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                                    <span class="material-icons text-white">mail</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invitation Modal -->
        <InvitationModal
            v-if="showInviteModal"
            :show="showInviteModal"
            :pizarra="selectedPizarra"
            @close="showInviteModal = false"
            @invitation-sent="handleInvitationSent"
        />
    </AppLayout>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Additional smooth animations */
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Glassmorphism effect enhancement */
.backdrop-blur-sm {
    backdrop-filter: blur(4px);
}

/* Loading animation */
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }

    50% {
        transform: none;
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
}

@keyframes pulse {
    50% {
        opacity: .5;
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

.animate-bounce {
    animation: bounce 1s infinite;
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
