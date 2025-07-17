<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthBase from '@/layouts/AuthLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import { LoaderCircle } from 'lucide-vue-next';

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

const submit = () => {
    form.post(route('register'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
};
</script>

<template>
    <AuthBase title="Únete a la Pizarra Colaborativa"
        description="Crea tu cuenta y comienza a diseñar increíbles aplicaciones Flutter y Angular en equipo">

        <Head title="Registro" />

        <form @submit.prevent="submit" class="flex flex-col gap-6">
            <!-- Icono de pizarra -->
            <div class="flex justify-center mb-4">
                <div
                    class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            </div>

            <div class="grid gap-6">
                <div class="grid gap-2">
                    <Label for="name" class="text-gray-700 font-semibold">Nombre Completo</Label>
                    <Input id="name" type="text" required autofocus :tabindex="1" autocomplete="name"
                        v-model="form.name" placeholder="Tu nombre completo"
                        class="h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" />
                    <InputError :message="form.errors.name" />
                </div>

                <div class="grid gap-2">
                    <Label for="email" class="text-gray-700 font-semibold">Correo Electrónico</Label>
                    <Input id="email" type="email" required :tabindex="2" autocomplete="email" v-model="form.email"
                        placeholder="tu@email.com"
                        class="h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" />
                    <InputError :message="form.errors.email" />
                </div>

                <div class="grid gap-2">
                    <Label for="password" class="text-gray-700 font-semibold">Contraseña</Label>
                    <Input id="password" type="password" required :tabindex="3" autocomplete="new-password"
                        v-model="form.password" placeholder="Mínimo 8 caracteres"
                        class="h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" />
                    <InputError :message="form.errors.password" />
                </div>

                <div class="grid gap-2">
                    <Label for="password_confirmation" class="text-gray-700 font-semibold">Confirmar Contraseña</Label>
                    <Input id="password_confirmation" type="password" required :tabindex="4" autocomplete="new-password"
                        v-model="form.password_confirmation" placeholder="Repite tu contraseña"
                        class="h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" />
                    <InputError :message="form.errors.password_confirmation" />
                </div>

                <Button type="submit"
                    class="mt-4 w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                    tabindex="5" :disabled="form.processing">
                    <LoaderCircle v-if="form.processing" class="h-5 w-5 animate-spin mr-2" />
                    <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Crear Mi Cuenta
                </Button>
            </div>

            <!-- Características de la plataforma -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mt-4">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">✨ Lo que obtienes:</h3>
                <ul class="text-xs text-gray-600 space-y-1">
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Diseño colaborativo en tiempo real
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Generación de código Flutter y Angular
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Chat integrado con IA
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Procesamiento de diagramas
                    </li>
                </ul>
            </div>

            <div class="text-center text-sm text-gray-600">
                ¿Ya tienes una cuenta?
                <TextLink :href="route('login')"
                    class="text-blue-600 hover:text-blue-700 underline underline-offset-4 font-semibold" :tabindex="6">
                    Inicia Sesión
                </TextLink>
            </div>
        </form>
    </AuthBase>
</template>
