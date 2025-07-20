// services/code-generation/UnifiedCodeGenerationService.ts
import { CodeGeneratorFactory } from './CodeGeneratorFactory';
import { ICodeGenerator } from './ICodeGenerator';
import type { PizarraUnificada, UnifiedElement, UnifiedScreen, CodeExportOptions } from '@/Data/PizarraUnificada';

export interface CodeGenerationResult {
    success: boolean;
    code: string;
    framework: string;
    extensions: string[];
    message?: string;
    error?: string;
}

export interface MultiFrameworkResult {
    success: boolean;
    results: {
        flutter?: CodeGenerationResult;
        angular?: CodeGenerationResult;
    };
    message?: string;
    error?: string;
}

export class UnifiedCodeGenerationService {
    
    /**
     * Genera código para un framework específico
     * @param pizarra Datos de la pizarra unificada
     * @param options Opciones de exportación
     * @returns Resultado de la generación de código
     */
    static generateCode(pizarra: PizarraUnificada, options: CodeExportOptions): CodeGenerationResult {
        try {
            console.log('🚀 Iniciando generación de código para:', options.framework);
            
            // Validar que el framework sea soportado
            if (!CodeGeneratorFactory.isFrameworkSupported(options.framework)) {
                return {
                    success: false,
                    code: '',
                    framework: options.framework,
                    extensions: [],
                    error: `Framework no soportado: ${options.framework}`
                };
            }
            
            // Crear el generador apropiado
            const generator = CodeGeneratorFactory.createGeneratorFromOptions(options);
            
            // Generar el código
            const code = generator.generateCode(pizarra, options);
            
            console.log('✅ Código generado exitosamente para:', options.framework);
            
            return {
                success: true,
                code,
                framework: options.framework,
                extensions: generator.getSupportedExtensions(),
                message: `Código ${generator.getFrameworkName()} generado exitosamente`
            };
            
        } catch (error) {
            console.error('❌ Error generando código:', error);
            return {
                success: false,
                code: '',
                framework: options.framework,
                extensions: [],
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    
    /**
     * Genera código para múltiples frameworks
     * @param pizarra Datos de la pizarra unificada
     * @param options Opciones de exportación
     * @returns Resultado de la generación para múltiples frameworks
     */
    static generateMultiFrameworkCode(pizarra: PizarraUnificada, options: CodeExportOptions): MultiFrameworkResult {
        try {
            console.log('🚀 Iniciando generación de código multi-framework');
            
            const results: { flutter?: CodeGenerationResult; angular?: CodeGenerationResult } = {};
            
            // Generar código para Flutter
            if (options.framework === 'flutter' || options.framework === 'both') {
                const flutterOptions = { ...options, framework: 'flutter' as const };
                results.flutter = this.generateCode(pizarra, flutterOptions);
            }
            
            // Generar código para Angular
            if (options.framework === 'angular' || options.framework === 'both') {
                const angularOptions = { ...options, framework: 'angular' as const };
                results.angular = this.generateCode(pizarra, angularOptions);
            }
            
            // Verificar si al menos una generación fue exitosa
            const hasSuccess = Object.values(results).some(result => result?.success);
            
            if (hasSuccess) {
                console.log('✅ Código multi-framework generado exitosamente');
                return {
                    success: true,
                    results,
                    message: 'Código generado para múltiples frameworks'
                };
            } else {
                console.error('❌ Falló la generación de código para todos los frameworks');
                return {
                    success: false,
                    results,
                    error: 'Falló la generación de código para todos los frameworks'
                };
            }
            
        } catch (error) {
            console.error('❌ Error generando código multi-framework:', error);
            return {
                success: false,
                results: {},
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    
    /**
     * Genera código para una pantalla específica
     * @param screen Pantalla a procesar
     * @param options Opciones de exportación
     * @returns Código de la pantalla
     */
    static generateScreenCode(screen: UnifiedScreen, options: CodeExportOptions): string {
        try {
            const generator = CodeGeneratorFactory.createGeneratorFromOptions(options);
            return generator.generateScreenCode(screen, options);
        } catch (error) {
            console.error('❌ Error generando código de pantalla:', error);
            return '';
        }
    }
    
    /**
     * Genera código para un elemento específico
     * @param element Elemento a procesar
     * @param options Opciones de exportación
     * @param indent Indentación para el código
     * @returns Código del elemento
     */
    static generateElementCode(element: UnifiedElement, options: CodeExportOptions, indent?: string): string {
        try {
            const generator = CodeGeneratorFactory.createGeneratorFromOptions(options);
            return generator.generateElementCode(element, options, indent);
        } catch (error) {
            console.error('❌ Error generando código de elemento:', error);
            return '';
        }
    }
    
    /**
     * Genera la estructura del proyecto
     * @param pizarra Datos de la pizarra unificada
     * @param options Opciones de exportación
     * @returns Estructura del proyecto
     */
    static generateProjectStructure(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        try {
            const generator = CodeGeneratorFactory.createGeneratorFromOptions(options);
            return generator.generateProjectStructure(pizarra, options);
        } catch (error) {
            console.error('❌ Error generando estructura del proyecto:', error);
            return '';
        }
    }
    
    /**
     * Obtiene información sobre los frameworks soportados
     * @returns Array con información de frameworks
     */
    static getSupportedFrameworks() {
        return CodeGeneratorFactory.getSupportedFrameworks();
    }
    
    /**
     * Valida si un framework es soportado
     * @param framework Framework a validar
     * @returns true si es soportado, false en caso contrario
     */
    static isFrameworkSupported(framework: string): boolean {
        return CodeGeneratorFactory.isFrameworkSupported(framework);
    }
    
    /**
     * Obtiene las extensiones de archivo para un framework
     * @param framework Framework para el cual obtener las extensiones
     * @returns Array de extensiones
     */
    static getFrameworkExtensions(framework: 'flutter' | 'angular'): string[] {
        try {
            const generator = CodeGeneratorFactory.createGenerator(framework);
            return generator.getSupportedExtensions();
        } catch (error) {
            console.error('❌ Error obteniendo extensiones del framework:', error);
            return [];
        }
    }
    
    /**
     * Genera un archivo ZIP con el código generado
     * @param pizarra Datos de la pizarra unificada
     * @param options Opciones de exportación
     * @returns Blob con el archivo ZIP
     */
    static async generateZipFile(pizarra: PizarraUnificada, options: CodeExportOptions): Promise<Blob | null> {
        try {
            console.log('📦 Generando archivo ZIP para:', options.framework);
            
            // Importar JSZip dinámicamente para evitar dependencias innecesarias
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            
            const result = this.generateCode(pizarra, options);
            
            if (!result.success) {
                throw new Error(result.error || 'Error generando código');
            }
            
            // Crear estructura de archivos según el framework
            if (options.framework === 'flutter') {
                this.addFlutterFilesToZip(zip, result.code, pizarra.name || 'MyApp');
            } else if (options.framework === 'angular') {
                this.addAngularFilesToZip(zip, result.code, pizarra.name || 'MyApp');
            }
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            console.log('✅ Archivo ZIP generado exitosamente');
            
            return zipBlob;
            
        } catch (error) {
            console.error('❌ Error generando archivo ZIP:', error);
            return null;
        }
    }
    
    /**
     * Agrega archivos Flutter al ZIP
     */
    private static addFlutterFilesToZip(zip: any, code: string, projectName: string) {
        // Separar el código en archivos individuales
        const files = this.parseFlutterCode(code);
        
        Object.entries(files).forEach(([filename, content]) => {
            zip.file(filename, content);
        });
        
        // Agregar pubspec.yaml básico
        zip.file('pubspec.yaml', `name: ${projectName.toLowerCase().replace(/\s+/g, '_')}
description: Generated Flutter application
version: 1.0.0+1

environment:
  sdk: ">=2.17.0 <3.0.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
`);
    }
    
    /**
     * Agrega archivos Angular al ZIP
     */
    private static addAngularFilesToZip(zip: any, code: string, projectName: string) {
        // Separar el código en archivos individuales
        const files = this.parseAngularCode(code);
        
        Object.entries(files).forEach(([filename, content]) => {
            zip.file(filename, content);
        });
    }
    
    /**
     * Parsea el código Flutter en archivos individuales
     */
    private static parseFlutterCode(code: string): Record<string, string> {
        const files: Record<string, string> = {};
        
        // Buscar el código principal (main.dart)
        const mainMatch = code.match(/void main\(\)[\s\S]*?class MyApp[\s\S]*?}/);
        if (mainMatch) {
            files['lib/main.dart'] = mainMatch[0];
        }
        
        // Buscar clases de pantallas
        const screenMatches = code.matchAll(/class (\w+) extends StatelessWidget[\s\S]*?}/g);
        for (const match of screenMatches) {
            const className = match[1];
            if (className !== 'MyApp') {
                files[`lib/screens/${className.toLowerCase()}.dart`] = match[0];
            }
        }
        
        // Buscar NavigationDrawer
        const drawerMatch = code.match(/class NavigationDrawer[\s\S]*?}/);
        if (drawerMatch) {
            files['lib/widgets/navigation_drawer.dart'] = drawerMatch[0];
        }
        
        return files;
    }
    
    /**
     * Parsea el código Angular en archivos individuales
     */
    private static parseAngularCode(code: string): Record<string, string> {
        const files: Record<string, string> = {};
        
        // Buscar archivos de configuración
        const angularJsonMatch = code.match(/\/\/ angular\.json[\s\S]*?}/);
        if (angularJsonMatch) {
            files['angular.json'] = angularJsonMatch[0].replace('// angular.json', '');
        }
        
        const packageJsonMatch = code.match(/\/\/ package\.json[\s\S]*?}/);
        if (packageJsonMatch) {
            files['package.json'] = packageJsonMatch[0].replace('// package.json', '');
        }
        
        // Buscar componentes
        const componentMatches = code.matchAll(/\/\/ (\w+)\.component\.ts[\s\S]*?export class (\w+)Component[\s\S]*?}/g);
        for (const match of componentMatches) {
            const componentName = match[1];
            const className = match[2];
            files[`src/app/${componentName}/${componentName}.component.ts`] = match[0].replace(`// ${componentName}.component.ts`, '');
        }
        
        // Buscar archivos de routing y módulos
        const routingMatch = code.match(/\/\/ app-routing\.module\.ts[\s\S]*?export class AppRoutingModule/);
        if (routingMatch) {
            files['src/app/app-routing.module.ts'] = routingMatch[0].replace('// app-routing.module.ts', '');
        }
        
        const moduleMatch = code.match(/\/\/ app\.module\.ts[\s\S]*?export class AppModule/);
        if (moduleMatch) {
            files['src/app/app.module.ts'] = moduleMatch[0].replace('// app.module.ts', '');
        }
        
        return files;
    }
} 