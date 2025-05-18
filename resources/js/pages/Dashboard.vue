<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/vue3';
import FormBuilderDashboard from '@/pages/FormBuilder/FormBuilderDashboard.vue';

const props = defineProps({
    ownedForms: {
        type: Array,
        required: true,
    },
    collaboratingForms: {
        type: Array,
        required: true,
    },
    pendingInvitations: {
        type: Array,
        required: true,
    },
});

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];
</script>

<template>
    <Head title="Dashboard" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <FormBuilderDashboard
            :owned-forms="props.ownedForms"
            :collaborating-forms="props.collaboratingForms"
            :pending-invitations="props.pendingInvitations"
        />
    </AppLayout>
</template>
