// composables/useInput.ts
import { ref } from 'vue';

export interface UseInputOptions {
  initialValue?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function useInput(options: UseInputOptions = {}) {
  const value = ref(options.initialValue || '');
  const isFocused = ref(false);

  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    value.value = target.value;
    options.onInput?.(target.value);
  };

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    value.value = target.value;
    options.onChange?.(target.value);
  };

  const handleFocus = (event: Event) => {
    isFocused.value = true;
    options.onFocus?.();
  };

  const handleBlur = (event: Event) => {
    isFocused.value = false;
    options.onBlur?.();
  };

  const setValue = (newValue: string) => {
    value.value = newValue;
  };

  return {
    value,
    isFocused,
    handleInput,
    handleChange,
    handleFocus,
    handleBlur,
    setValue
  };
} 