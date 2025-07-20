// composables/useDropdown.ts
import { ref } from 'vue';

export interface UseDropdownOptions {
    onSelect?: (option: string) => void;
    onToggle?: (isOpen: boolean) => void;
}

export function useDropdown(options: UseDropdownOptions = {}) {
    const isOpen = ref(false);
    const selectedOption = ref<string>('');

    const toggleDropdown = () => {
        isOpen.value = !isOpen.value;
        options.onToggle?.(isOpen.value);
    };

    const selectOption = (option: string) => {
        selectedOption.value = option;
        isOpen.value = false;
        options.onSelect?.(option);
    };

    const closeDropdown = () => {
        isOpen.value = false;
        options.onToggle?.(false);
    };

    return {
        isOpen,
        selectedOption,
        toggleDropdown,
        selectOption,
        closeDropdown
    };
} 