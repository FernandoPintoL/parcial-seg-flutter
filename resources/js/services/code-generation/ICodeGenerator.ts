// services/code-generation/ICodeGenerator.ts
import type { PizarraUnificada, UnifiedElement, UnifiedScreen, CodeExportOptions } from '@/Data/PizarraUnificada';

export interface ICodeGenerator {
    /**
     * Genera código para el framework específico
     * @param pizarra Datos de la pizarra unificada
     * @param options Opciones de exportación
     * @returns Código generado
     */
    generateCode(pizarra: PizarraUnificada, options: CodeExportOptions): string;
    
    /**
     * Genera código para una pantalla específica
     * @param screen Pantalla a procesar
     * @param options Opciones de exportación
     * @returns Código de la pantalla
     */
    generateScreenCode(screen: UnifiedScreen, options: CodeExportOptions): string;
    
    /**
     * Genera código para un elemento específico
     * @param element Elemento a procesar
     * @param options Opciones de exportación
     * @param indent Indentación para el código
     * @returns Código del elemento
     */
    generateElementCode(element: UnifiedElement, options: CodeExportOptions, indent?: string): string;
    
    /**
     * Genera la estructura del proyecto
     * @param pizarra Datos de la pizarra unificada
     * @param options Opciones de exportación
     * @returns Estructura del proyecto
     */
    generateProjectStructure(pizarra: PizarraUnificada, options: CodeExportOptions): string;
    
    /**
     * Obtiene las extensiones de archivo soportadas
     * @returns Array de extensiones
     */
    getSupportedExtensions(): string[];
    
    /**
     * Obtiene el nombre del framework
     * @returns Nombre del framework
     */
    getFrameworkName(): string;
} 