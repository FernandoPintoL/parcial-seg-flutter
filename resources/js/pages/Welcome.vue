<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ref, onMounted, computed } from 'vue';

// Animation states
const isLoaded = ref(false);
const currentFeature = ref(0);

// Get page props safely
const page = usePage();
const isAuthenticated = computed(() => {
    try {
        return !!(page.props as any)?.auth?.user;
    } catch {
        return false;
    }
});

// Features carousel
const features = [
    {
        title: 'Editor Visual Intuitivo',
        description: 'Diseña interfaces con nuestro editor drag & drop profesional',
        icon: 'design_services',
        color: 'from-blue-500 to-purple-600'
    },
    {
        title: 'Flutter & Angular',
        description: 'Soporte completo para ambos frameworks en una sola herramienta',
        icon: 'integration_instructions',
        color: 'from-green-500 to-teal-600'
    },
    {
        title: 'IA Integrada',
        description: 'Asistente IA para generar código y optimizar diseños automáticamente',
        icon: 'smart_toy',
        color: 'from-purple-500 to-pink-600'
    },
    {
        title: 'Colaboración en Tiempo Real',
        description: 'Trabaja en equipo con sincronización instantánea',
        icon: 'groups',
        color: 'from-orange-500 to-red-600'
    }
];

onMounted(() => {
    isLoaded.value = true;

    // Auto-rotate features
    setInterval(() => {
        currentFeature.value = (currentFeature.value + 1) % features.length;
    }, 4000);
});
</script>

<template>

    <Head title="Pizarra Unificada - Editor de Interfaces Profesional">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
            rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </Head>

    <!-- Main Container with animated background -->
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <!-- Animated background elements -->
        <div class="absolute inset-0 overflow-hidden">
            <div
                class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob">
            </div>
            <div
                class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000">
            </div>
            <div
                class="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000">
            </div>
        </div>

        <!-- Navigation Header -->
        <header class="relative z-10 w-full">
            <nav class="flex items-center justify-between p-6 lg:px-8">
                <div class="flex items-center space-x-3">
                    <div
                        class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span class="material-icons text-white text-xl">dashboard</span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white">Pizarra Unificada</h1>
                        <p class="text-xs text-gray-300">Editor Profesional de Interfaces</p>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <Link v-if="isAuthenticated" :href="route('dashboard')"
                        class="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium">
                    <span class="material-icons text-sm mr-2">dashboard</span>
                    Dashboard
                    </Link>
                    <template v-else>
                        <Link :href="route('login')"
                            class="text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                        Iniciar Sesión
                        </Link>
                        <Link :href="route('register')"
                            class="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium">
                        <span class="material-icons text-sm mr-2">person_add</span>
                        Registrarse
                        </Link>
                    </template>
                </div>
            </nav>
        </header>

        <!-- Hero Section -->
        <main class="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
            <div class="max-w-4xl mx-auto space-y-8" :class="{ 'animate-fadeInUp': isLoaded }">

                <!-- Hero Title -->
                <div class="space-y-4">
                    <h1 class="text-5xl md:text-7xl font-bold text-white leading-tight">
                        Diseña
                        <span
                            class="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Interfaces
                        </span>
                        del Futuro
                    </h1>
                    <p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        La herramienta definitiva para crear aplicaciones Flutter y Angular con
                        <span class="text-blue-400 font-semibold">inteligencia artificial</span> y
                        <span class="text-purple-400 font-semibold">colaboración en tiempo real</span>
                    </p>
                </div>

                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                    <Link v-if="!isAuthenticated" :href="route('register')"
                        class="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <span class="relative z-10 flex items-center">
                        <span class="material-icons mr-2">rocket_launch</span>
                        Comenzar Gratis
                    </span>
                    <div
                        class="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    </Link>

                    <Link :href="isAuthenticated ? route('dashboard') : route('login')"
                        class="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <span class="material-icons mr-2">
                        {{ isAuthenticated ? 'dashboard' : 'login' }}
                    </span>
                    {{ isAuthenticated ? 'Ir al Dashboard' : 'Ver Demo' }}
                    </Link>
                </div>

                <!-- Stats/Features Preview -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto">
                    <div
                        class="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div
                            class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span class="material-icons text-white">speed</span>
                        </div>
                        <h3 class="text-xl font-semibold text-white mb-2">10x Más Rápido</h3>
                        <p class="text-gray-300">Desarrolla interfaces en minutos, no horas</p>
                    </div>

                    <div
                        class="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div
                            class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span class="material-icons text-white">code</span>
                        </div>
                        <h3 class="text-xl font-semibold text-white mb-2">Código Limpio</h3>
                        <p class="text-gray-300">Genera código optimizado automáticamente</p>
                    </div>

                    <div
                        class="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div
                            class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span class="material-icons text-white">psychology</span>
                        </div>
                        <h3 class="text-xl font-semibold text-white mb-2">IA Avanzada</h3>
                        <p class="text-gray-300">Asistente inteligente para diseño</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Features Section -->
        <section class="relative z-10 py-20 px-6">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                        Características
                        <span class="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Revolucionarias
                        </span>
                    </h2>
                    <p class="text-xl text-gray-300 max-w-3xl mx-auto">
                        Todo lo que necesitas para crear aplicaciones modernas en un solo lugar
                    </p>
                </div>

                <!-- Featured Feature Carousel -->
                <div class="relative mb-16">
                    <div class="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12">
                        <div class="grid md:grid-cols-2 gap-8 items-center">
                            <div class="space-y-6">
                                <div class="inline-flex items-center px-4 py-2 bg-gradient-to-r rounded-full text-white text-sm font-medium"
                                    :class="features[currentFeature].color">
                                    <span class="material-icons text-sm mr-2">{{ features[currentFeature].icon }}</span>
                                    Característica Destacada
                                </div>
                                <h3 class="text-3xl md:text-4xl font-bold text-white">
                                    {{ features[currentFeature].title }}
                                </h3>
                                <p class="text-xl text-gray-300 leading-relaxed">
                                    {{ features[currentFeature].description }}
                                </p>
                                <div class="flex space-x-2">
                                    <button v-for="(feature, index) in features" :key="index"
                                        @click="currentFeature = index"
                                        :class="index === currentFeature ? 'w-8 bg-white' : 'w-2 bg-white/30'"
                                        class="h-2 rounded-full transition-all duration-300"></button>
                                </div>
                            </div>
                            <div class="relative">
                                <div class="w-full h-64 bg-gradient-to-br rounded-2xl flex items-center justify-center"
                                    :class="features[currentFeature].color">
                                    <span class="material-icons text-white text-8xl">{{ features[currentFeature].icon
                                        }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- All Features Grid -->
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div v-for="(feature, index) in features" :key="index"
                        class="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                        @click="currentFeature = index">
                        <div class="w-12 h-12 bg-gradient-to-r rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                            :class="feature.color">
                            <span class="material-icons text-white">{{ feature.icon }}</span>
                        </div>
                        <h4 class="text-lg font-semibold text-white mb-2">{{ feature.title }}</h4>
                        <p class="text-gray-400 text-sm">{{ feature.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer CTA -->
        <footer class="relative z-10 text-center py-20 px-6">
            <div class="max-w-4xl mx-auto space-y-8">
                <h2 class="text-4xl md:text-5xl font-bold text-white">
                    ¿Listo para
                    <span class="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Revolucionar
                    </span>
                    tu Desarrollo?
                </h2>
                <p class="text-xl text-gray-300">
                    Únete a miles de desarrolladores que ya están creando el futuro
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link v-if="!isAuthenticated" :href="route('register')"
                        class="group relative inline-flex items-center px-10 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <span class="relative z-10 flex items-center">
                        <span class="material-icons mr-2">start</span>
                        Empezar Ahora
                    </span>
                    </Link>
                    <p class="text-gray-400 text-sm">
                        <span class="material-icons text-green-400 text-sm mr-1">check_circle</span>
                        Gratis por siempre • Sin tarjeta de crédito
                    </p>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* Modern Welcome Page Styles */

/* Blob animations for background */
@keyframes blob {
    0% {
        transform: translate(0px, 0px) scale(1);
    }

    33% {
        transform: translate(30px, -50px) scale(1.1);
    }

    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }

    100% {
        transform: translate(0px, 0px) scale(1);
    }
}

.animate-blob {
    animation: blob 7s infinite;
}

.animation-delay-2000 {
    animation-delay: 2s;
}

.animation-delay-4000 {
    animation-delay: 4s;
}

/* Fade in up animation */
@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeInUp {
    animation: fadeInUp 1s ease-out forwards;
}

/* Gradient text animation */
@keyframes gradient {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

.gradient-animate {
    background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Enhanced hover effects */
.group:hover .group-hover\:scale-110 {
    transform: scale(1.1);
}

.group:hover .group-hover\:opacity-100 {
    opacity: 1;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

/* Responsive typography */
@media (max-width: 768px) {
    .text-7xl {
        font-size: 3.5rem;
        line-height: 1.1;
    }

    .text-5xl {
        font-size: 2.5rem;
        line-height: 1.2;
    }

    .text-4xl {
        font-size: 2rem;
        line-height: 1.2;
    }
}

/* Glass morphism effect */
.glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Pulse animation for call-to-action */
@keyframes pulse-glow {
    0% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
}

.pulse-glow {
    animation: pulse-glow 2s infinite;
}

/* Feature card animations */
.feature-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
    transform: translateY(-8px) scale(1.02);
}

/* Text shimmer effect */
@keyframes shimmer {
    0% {
        background-position: -200px 0;
    }

    100% {
        background-position: calc(200px + 100%) 0;
    }
}

.text-shimmer {
    background: linear-gradient(90deg,
            #ffffff 0%,
            #e5e7eb 50%,
            #ffffff 100%);
    background-size: 200px 100%;
    background-repeat: no-repeat;
    animation: shimmer 2s infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Loading states */
.loading-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .5;
    }
}

/* Enhanced button interactions */
.btn-interactive {
    position: relative;
    overflow: hidden;
}

.btn-interactive::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent);
    transition: left 0.5s;
}

.btn-interactive:hover::before {
    left: 100%;
}

/* Smooth transitions for all interactive elements */
* {
    transition-property: transform, opacity, background-color, border-color, color, box-shadow;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
