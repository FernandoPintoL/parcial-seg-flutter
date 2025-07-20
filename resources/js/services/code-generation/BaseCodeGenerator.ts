// services/code-generation/BaseCodeGenerator.ts
import type { PizarraUnificada, UnifiedElement, UnifiedScreen, CodeExportOptions } from '@/Data/PizarraUnificada';
import { ICodeGenerator } from './ICodeGenerator';

export abstract class BaseCodeGenerator implements ICodeGenerator {
    
    /**
     * Genera código para el framework específico
     */
    abstract generateCode(pizarra: PizarraUnificada, options: CodeExportOptions): string;
    
    /**
     * Genera código para una pantalla específica
     */
    abstract generateScreenCode(screen: UnifiedScreen, options: CodeExportOptions): string;
    
    /**
     * Genera código para un elemento específico
     */
    abstract generateElementCode(element: UnifiedElement, options: CodeExportOptions, indent?: string): string;
    
    /**
     * Genera la estructura del proyecto
     */
    abstract generateProjectStructure(pizarra: PizarraUnificada, options: CodeExportOptions): string;
    
    /**
     * Obtiene las extensiones de archivo soportadas
     */
    abstract getSupportedExtensions(): string[];
    
    /**
     * Obtiene el nombre del framework
     */
    abstract getFrameworkName(): string;
    
    /**
     * Formatea el nombre de la pantalla para usar como nombre de clase
     */
    protected formatClassName(name: string): string {
        return name
            .replace(/[^\w\s]/g, '')  // Remove special characters
            .replace(/\s+/g, '')      // Remove spaces
            .replace(/^./, match => match.toUpperCase()); // Capitalize first letter
    }
    
    /**
     * Formatea el nombre para usar como selector/identificador
     */
    protected formatSelectorName(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }
    
    /**
     * Genera indentación consistente
     */
    protected indent(text: string, level: number = 1): string {
        const indentStr = '  '.repeat(level);
        return text.split('\n').map(line => `${indentStr}${line}`).join('\n');
    }
    
    /**
     * Procesa las propiedades de un elemento
     */
    protected processElementProperties(element: UnifiedElement): Record<string, any> {
        return {
            ...element.props,
            ...element.properties
        };
    }
    
    /**
     * Genera código para elementos hijos recursivamente
     */
    protected generateChildrenCode(children: UnifiedElement[], options: CodeExportOptions, indent: string = ''): string {
        if (!children || children.length === 0) {
            return '';
        }
        
        return children
            .map(child => this.generateElementCode(child, options, indent))
            .join('\n');
    }
    
    /**
     * Valida que el elemento tenga las propiedades requeridas
     */
    protected validateElement(element: UnifiedElement): boolean {
        return !!(element && element.type && element.framework);
    }
    
    /**
     * Obtiene el valor de una propiedad con valor por defecto
     */
    protected getPropertyValue(props: Record<string, any>, key: string, defaultValue: any): any {
        return props[key] !== undefined ? props[key] : defaultValue;
    }
} 