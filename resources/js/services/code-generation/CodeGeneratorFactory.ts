// services/code-generation/CodeGeneratorFactory.ts
import { ICodeGenerator } from './ICodeGenerator';
import { FlutterCodeGenerator } from './FlutterCodeGenerator';
import { AngularCodeGenerator } from './AngularCodeGenerator';
import type { CodeExportOptions } from '@/Data/PizarraUnificada';

export class CodeGeneratorFactory {
    
    /**
     * Crea un generador de código basado en el framework especificado
     * @param framework Framework para el cual crear el generador
     * @returns Instancia del generador de código
     */
    static createGenerator(framework: 'flutter' | 'angular'): ICodeGenerator {
        switch (framework) {
            case 'flutter':
                return new FlutterCodeGenerator();
            case 'angular':
                return new AngularCodeGenerator();
            default:
                throw new Error(`Framework no soportado: ${framework}`);
        }
    }
    
    /**
     * Crea un generador de código basado en las opciones de exportación
     * @param options Opciones de exportación
     * @returns Instancia del generador de código
     */
    static createGeneratorFromOptions(options: CodeExportOptions): ICodeGenerator {
        return this.createGenerator(options.framework);
    }
    
    /**
     * Obtiene todos los generadores disponibles
     * @returns Array con todos los generadores
     */
    static getAllGenerators(): ICodeGenerator[] {
        return [
            new FlutterCodeGenerator(),
            new AngularCodeGenerator()
        ];
    }
    
    /**
     * Obtiene información sobre todos los frameworks soportados
     * @returns Array con información de frameworks
     */
    static getSupportedFrameworks(): Array<{
        name: string;
        value: 'flutter' | 'angular';
        extensions: string[];
        description: string;
    }> {
        return [
            {
                name: 'Flutter',
                value: 'flutter',
                extensions: ['.dart', '.yaml', '.lock'],
                description: 'Framework de desarrollo móvil multiplataforma de Google'
            },
            {
                name: 'Angular',
                value: 'angular',
                extensions: ['.ts', '.html', '.scss', '.json', '.js'],
                description: 'Framework de desarrollo web de Google'
            }
        ];
    }
    
    /**
     * Valida si un framework es soportado
     * @param framework Framework a validar
     * @returns true si es soportado, false en caso contrario
     */
    static isFrameworkSupported(framework: string): boolean {
        return ['flutter', 'angular'].includes(framework);
    }
} 