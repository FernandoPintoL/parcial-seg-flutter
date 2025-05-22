<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/vue3';

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
<!--        <FormBuilderDashboard
            :owned-forms="props.ownedForms"
            :collaborating-forms="props.collaboratingForms"
            :pending-invitations="props.pendingInvitations"
        />-->
        <div class="flex flex-col gap-4 py-4 px-32">
            <h1 class="text-2xl font-bold">Dashboard</h1>
            <p class="text-gray-600">Welcome to your dashboard!</p>
            <p class="text-gray-600">Here you can manage your forms and view your statistics.</p>
            <p class="text-gray-600">You have {{ props.ownedForms.length }} owned forms and {{ props.collaboratingForms.length }} collaborating forms.</p>
            <p class="text-gray-600">You have {{ props.pendingInvitations.length }} pending invitations.</p>
            <p class="text-gray-600">You can create a new form by clicking the button below.</p>
            <router-link to="/form-builder/create" class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Create New Form
            </router-link>
            <p class="text-gray-600">You can view your forms by clicking the button below.</p>
            <router-link to="/form-builder" class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                View My Forms
            </router-link>
            <p class="text-gray-600">You can view your collaborating forms by clicking the button below.</p>
            <router-link to="/form-builder/collaborating" class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                View My Collaborating Forms
            </router-link>
            <p class="text-gray-600">You can view your pending invitations by clicking the button below.</p>
            <router-link to="/form-builder/invitations" class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                View My Pending Invitations
            </router-link>
        </div>
    </AppLayout>
</template>
