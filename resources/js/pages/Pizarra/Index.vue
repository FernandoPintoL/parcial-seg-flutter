<script setup lang="ts">

import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import type { BreadcrumbItem } from '@/types';
import Canvas from './../Canva/Canvas.vue';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pizarra',
        href: '/pizarra',
    },
];
</script>

<template>
    <Head title="Pizarra" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <h1>PIZARRRASSS</h1>
            <Canvas />
        </div>
    </AppLayout>
</template>

<style scoped>

</style>
