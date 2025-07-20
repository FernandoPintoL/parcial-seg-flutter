// composables/usePizarraStorage.ts
import type { PizarraUnificada } from '@/Data/PizarraUnificada';

export interface UsePizarraStorageOptions {
    pizarra: PizarraUnificada;
}

export function usePizarraStorage(options: UsePizarraStorageOptions) {
    const { pizarra } = options;
    
    // Obtener token CSRF
    const getCSRFToken = (): string => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        return token || '';
    };
    
    // Guardar pizarra
    const savePizarra = async (pizarraData: any) => {
        try {
            console.log('💾 Saving pizarra:', pizarraData);
            
            // Validar que elements no sea null
            if (pizarraData.elements === null) {
                pizarraData.elements = [];
            } else {
                // Validar que elements sea un array
                if (!Array.isArray(pizarraData.elements)) {
                    pizarraData.elements = [];
                }
            }
            console.log('💾 Pizarra data:', pizarraData);
            
            const response = await fetch(`/api/pizarra_unificada/${pizarra.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCSRFToken(),
                },
                body: JSON.stringify(pizarraData),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Pizarra saved successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Error saving pizarra:', error);
            throw error;
        }
    };
    
    return {
        savePizarra,
        getCSRFToken
    };
} 