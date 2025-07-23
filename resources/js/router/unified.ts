import { createRouter, createWebHistory } from 'vue-router'
import PizarraUnificadaCore from '@/pages/PizarraUnificada/PizarraUnificadaCore.vue'

const routes = [
    {
        path: '/pizarra-unificada/:id',
        name: 'PizarraUnificada',
        component: PizarraUnificadaCore,
        props: true
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})
