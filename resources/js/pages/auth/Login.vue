<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthBase from '@/layouts/AuthLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import { LoaderCircle } from 'lucide-vue-next';

defineProps<{
    status?: string;
    canResetPassword: boolean;
}>();

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
    });
};
</script>

<template>
    <AuthBase title="Bienvenido de vuelta"
        description="Ingresa tus credenciales para acceder a tu espacio de trabajo colaborativo">

        <Head title="Iniciar Sesión" />

        <div v-if="status"
            class="mb-4 text-center text-sm font-medium text-green-600 bg-green-50 py-3 px-4 rounded-lg border border-green-200">
            {{ status }}
        </div>

        <form @submit.prevent="submit" class="flex flex-col gap-6">
            <!-- Logo/Icono animado -->
            <div class="flex justify-center mb-6">
                <div class="relative">
                    <div
                        class="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-105">
                        <svg class="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    <div
                        class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg animate-bounce">
                    </div>
                </div>
            </div>

            <div class="grid gap-6">
                <div class="grid gap-2">
                    <Label for="email" class="text-gray-700 font-semibold flex items-center">
                        <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        Correo Electrónico
                    </Label>
                    <Input id="email" type="email" required autofocus :tabindex="1" autocomplete="email"
                        v-model="form.email" placeholder="tu@email.com"
                        class="h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" />
                    <InputError :message="form.errors.email" />
                </div>

                <div class="grid gap-2">
                    <div class="flex items-center justify-between">
                        <Label for="password" class="text-gray-700 font-semibold flex items-center">
                            <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Contraseña
                        </Label>
                        <TextLink v-if="canResetPassword" :href="route('password.request')"
                            class="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-4"
                            :tabindex="5">
                            ¿Olvidaste tu contraseña?
                        </TextLink>
                    </div>
                    <Input id="password" type="password" required :tabindex="2" autocomplete="current-password"
                        v-model="form.password" placeholder="Tu contraseña"
                        class="h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" />
                    <InputError :message="form.errors.password" />
                </div>

                <div class="flex items-center justify-between" :tabindex="3">
                    <Label for="remember" class="flex items-center space-x-3 cursor-pointer">
                        <Checkbox id="remember" v-model="form.remember" :tabindex="4" />
                        <span class="text-sm text-gray-600">Recordarme</span>
                    </Label>
                </div>

                <Button type="submit"
                    class="mt-4 w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                    :tabindex="4" :disabled="form.processing">
                    <LoaderCircle v-if="form.processing" class="h-5 w-5 animate-spin mr-2" />
                    <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Iniciar Sesión
                </Button>
            </div>

            <!-- Stats de la plataforma -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mt-4">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="flex flex-col items-center">
                        <div class="text-lg font-bold text-blue-600">1K+</div>
                        <div class="text-xs text-gray-600">Usuarios</div>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="text-lg font-bold text-purple-600">500+</div>
                        <div class="text-xs text-gray-600">Proyectos</div>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="text-lg font-bold text-green-600">99%</div>
                        <div class="text-xs text-gray-600">Uptime</div>
                    </div>
                </div>
            </div>

            <div class="text-center text-sm text-gray-600">
                ¿No tienes una cuenta?
                <TextLink :href="route('register')"
                    class="text-blue-600 hover:text-blue-700 underline underline-offset-4 font-semibold" :tabindex="5">
                    Registrarse
                </TextLink>
            </div>
        </form>
    </AuthBase>
</template>
