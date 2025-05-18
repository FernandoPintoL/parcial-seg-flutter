<script setup lang="ts">
import {Head} from "@inertiajs/vue3";
import AppLayout from "@/layouts/AppLayout.vue";
import type {BreadcrumbItem} from "@/types";

const props = defineProps({
    form: {
        type: Object,
        required: true,
    },
    formId: {
        type: Number,
        required: true,
    },
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Editar Formulario ID: ' + props.form.id,
        href: '/form-builder',
    },
];
</script>

<template>
    <Head title="Editar Formulario" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <h1>Editar formulario {{ props.form.id }} | {{ props.form.name }}</h1>
    </AppLayout>
</template>

<style scoped>

</style>
