<script setup lang="ts">
import type { FormBuilder } from '@/types/FormBuilder';

interface Props {
    title: string;
    userCreador?: string;
    forms: FormBuilder[];
    onSelect: (form: FormBuilder) => void;
    onDelete?: (form: FormBuilder, event: MouseEvent) => void;
    onAcept?: (form: FormBuilder) => void;
    onReject?: (form: FormBuilder) => void;
    onQuit?: (form: FormBuilder) => void;
    isOwner?: boolean;
    isInvitations?: boolean;
    isColaborator?: boolean;
}

defineProps<Props>();
</script>

<template>
    <div v-if="forms.length > 0" class="col-span-full mb-4">
        <h2 class="mb-2 text-xl font-semibold">{{ title }}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div
                v-for="form in forms"
                :key="form.id"
                class="relative cursor-pointer rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
            >
                <h3 class="text-lg font-medium">{{ form.name }} | ID: {{ form.id }}</h3>
                <p class="text-sm text-gray-500">Creado: {{ new Date(form.created_at).toLocaleDateString() }}</p>
                <div v-if="isColaborator || isOwner" class="mt-2 flex items-center gap-2">
                    <span class="text-xs text-gray-500">Creador: {{ userCreador }}</span>
                    <button
                        v-if="onSelect"
                        @click="onSelect(form)"
                        class="bg-sky-500 text-white px-2 py-1 rounded text-xs hover:bg-sky-600"
                    >
                        Iniciar Edición
                    </button>
                    <button
                        v-if="onDelete && isOwner"
                        @click.stop="onDelete(form, $event)"
                        class="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                        title="Delete form"
                    >
                        Eliminar
                    </button>
                </div>
                <div v-if="isInvitations" class="mt-2 flex space-x-2">
                    <button
                        v-if="onAcept"
                        @click="onAcept(form)"
                        class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    >
                        Acceptar
                    </button>
                    <button
                        v-if="onReject"
                        @click="onReject(form)"
                        class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                        Rechazar
                    </button>
                </div>
                <div v-if="isColaborator" class="mt-2 flex space-x-2">
                    <button
                        v-if="onQuit"
                        @click="onQuit(form)"
                        class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                        Dejar de ser Colaborador
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
