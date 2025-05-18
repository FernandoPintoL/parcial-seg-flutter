<script setup lang="ts">
import UserInfo from '@/components/UserInfo.vue';
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { User } from '@/types';
import { Link } from '@inertiajs/vue3';
import { LogOut, Settings, Moon, Sun } from 'lucide-vue-next';
import { useAppearance } from '@/composables/useAppearance';

interface Props {
    user: User;
}

defineProps<Props>();

const { appearance, updateAppearance } = useAppearance();
</script>

<template>
    <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserInfo :user="user" :show-email="true" />
        </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
        <DropdownMenuItem :as-child="true">
            <Link class="block w-full" :href="route('profile.edit')" as="button">
                <Settings class="mr-2 h-4 w-4" />
                Settings
            </Link>
        </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
        <DropdownMenuLabel class="px-2 py-1.5 text-xs font-semibold">Theme</DropdownMenuLabel>
        <DropdownMenuItem @click="updateAppearance('light')" :class="{ 'bg-accent': appearance === 'light' }">
            <Sun class="mr-2 h-4 w-4" />
            Light
        </DropdownMenuItem>
        <DropdownMenuItem @click="updateAppearance('dark')" :class="{ 'bg-accent': appearance === 'dark' }">
            <Moon class="mr-2 h-4 w-4" />
            Dark
        </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem :as-child="true">
        <Link class="block w-full" method="post" :href="route('logout')" as="button">
            <LogOut class="mr-2 h-4 w-4" />
            Log out
        </Link>
    </DropdownMenuItem>
</template>
