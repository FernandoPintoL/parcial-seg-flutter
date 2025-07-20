// composables/usePizarraServices.ts
import { ref, computed } from 'vue';
import type { PizarraUnificada, CodeExportOptions } from '@/Data/PizarraUnificada';
import { UnifiedCodeGenerationService, type CodeGenerationResult, type MultiFrameworkResult } from '@/services/code-generation/UnifiedCodeGenerationService';

export interface UsePizarraServicesOptions {
    pizarra: PizarraUnificada;
    defaultFramework?: 'flutter' | 'angular' | 'both';
}

export function usePizarraServices(options: UsePizarraServicesOptions) {
    const { pizarra, defaultFramework = 'flutter' } = options;
    
    // Estado reactivo
    const generatedCode = ref<string>('');
    const isGenerating = ref(false);
    const generationError = ref<string | null>(null);
    const selectedFramework = ref<'flutter' | 'angular' | 'both'>(defaultFramework);
    
    // Opciones de exportación
    const exportOptions = computed<CodeExportOptions>(() => ({
        framework: selectedFramework.value,
        includeTests: false,
        includeDocumentation: true,
        version: '1.0.0',
        theme: 'default',
        format: 'preview'
    }));
    
    // Frameworks soportados
    const supportedFrameworks = computed(() => {
        return UnifiedCodeGenerationService.getSupportedFrameworks();
    });
    
    // Generar código
    const generateCode = async (): Promise<CodeGenerationResult | MultiFrameworkResult> => {
        try {
            isGenerating.value = true;
            generationError.value = null;
            
            console.log('🚀 Iniciando generación de código para pizarra:', pizarra.name);
            
            let result: CodeGenerationResult | MultiFrameworkResult;
            
            if (selectedFramework.value === 'both') {
                result = UnifiedCodeGenerationService.generateMultiFrameworkCode(pizarra, exportOptions.value);
            } else {
                result = UnifiedCodeGenerationService.generateCode(pizarra, exportOptions.value);
            }
            
            if (result.success) {
                // Actualizar el código generado
                if ('code' in result) {
                    // Resultado de un solo framework
                    generatedCode.value = result.code;
                } else {
                    // Resultado multi-framework
                    const codes: string[] = [];
                    if (result.results.flutter?.success) {
                        codes.push(`// ========== FLUTTER CODE ==========\n\n${result.results.flutter.code}`);
                    }
                    if (result.results.angular?.success) {
                        codes.push(`// ========== ANGULAR CODE ==========\n\n${result.results.angular.code}`);
                    }
                    generatedCode.value = codes.join('\n\n');
                }
                
                console.log('✅ Código generado exitosamente');
            } else {
                generationError.value = result.error || 'Error desconocido al generar código';
                console.error('❌ Error generando código:', generationError.value);
            }
            
            return result;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            generationError.value = errorMessage;
            console.error('❌ Error en generateCode:', error);
            
            return {
                success: false,
                code: '',
                framework: selectedFramework.value,
                extensions: [],
                error: errorMessage
            };
        } finally {
            isGenerating.value = false;
        }
    };
    
    // Generar código para un framework específico
    const generateCodeForFramework = async (framework: 'flutter' | 'angular'): Promise<CodeGenerationResult> => {
        const previousFramework = selectedFramework.value;
        selectedFramework.value = framework;
        
        try {
            const result = await generateCode() as CodeGenerationResult;
            return result;
        } finally {
            selectedFramework.value = previousFramework;
        }
    };
    
    // Generar archivo ZIP
    const generateZipFile = async (): Promise<Blob | null> => {
        try {
            isGenerating.value = true;
            generationError.value = null;
            
            console.log('📦 Generando archivo ZIP para:', selectedFramework.value);
            
            const zipBlob = await UnifiedCodeGenerationService.generateZipFile(pizarra, exportOptions.value);
            
            if (zipBlob) {
                console.log('✅ Archivo ZIP generado exitosamente');
                return zipBlob;
            } else {
                generationError.value = 'Error generando archivo ZIP';
                console.error('❌ Error generando archivo ZIP');
                return null;
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            generationError.value = errorMessage;
            console.error('❌ Error en generateZipFile:', error);
            return null;
        } finally {
            isGenerating.value = false;
        }
    };
    
    // Descargar código
    const downloadCode = (projectName: string, framework: string) => {
        try {
            console.log('📥 Descargando código para proyecto:', projectName);
            
            const blob = new Blob([generatedCode.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName}-${framework}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Código descargado exitosamente');
        } catch (error) {
            console.error('❌ Error descargando código:', error);
            generationError.value = 'Error descargando código';
        }
    };
    
    // Descargar archivo ZIP
    const downloadZipFile = async (projectName: string) => {
        try {
            console.log('📦 Descargando archivo ZIP para proyecto:', projectName);
            
            const zipBlob = await generateZipFile();
            
            if (zipBlob) {
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${projectName}-${selectedFramework.value}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('✅ Archivo ZIP descargado exitosamente');
            }
        } catch (error) {
            console.error('❌ Error descargando archivo ZIP:', error);
            generationError.value = 'Error descargando archivo ZIP';
        }
    };
    
    // Copiar código al portapapeles
    const copyCode = async () => {
        try {
            console.log('📋 Copiando código al portapapeles');
            await navigator.clipboard.writeText(generatedCode.value);
            console.log('✅ Código copiado al portapapeles');
        } catch (error) {
            console.error('❌ Error copiando código:', error);
            generationError.value = 'Error copiando código';
        }
    };
    
    // Cambiar framework
    const changeFramework = (framework: 'flutter' | 'angular' | 'both') => {
        selectedFramework.value = framework;
        console.log('🔄 Framework cambiado a:', framework);
    };
    
    // Limpiar errores
    const clearError = () => {
        generationError.value = null;
    };
    
    // Limpiar código generado
    const clearGeneratedCode = () => {
        generatedCode.value = '';
        generationError.value = null;
    };
    
    return {
        // Estado
        generatedCode,
        isGenerating,
        generationError,
        selectedFramework,
        exportOptions,
        supportedFrameworks,
        
        // Métodos
        generateCode,
        generateCodeForFramework,
        generateZipFile,
        downloadCode,
        downloadZipFile,
        copyCode,
        changeFramework,
        clearError,
        clearGeneratedCode
    };
} 