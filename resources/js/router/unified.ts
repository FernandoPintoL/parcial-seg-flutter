import { createRouter, createWebHistory } from 'vue-router'
import { PizarraUnificada } from '@/Pages/PizarraUnificada'

const routes = [
    {
        path: '/pizarra-unificada/:id',
        name: 'PizarraUnificada',
        component: PizarraUnificada,
        props: true
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})
