// services/code-generation/UnifiedCodeGenerationService.ts
import { CodeGeneratorFactory } from './CodeGeneratorFactory';
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
     * Agrega archivos Flutter al ZIP con estructura completa de proyecto
     */
    private static addFlutterFilesToZip(zip: any, code: string, projectName: string) {
        // Ensure the project name doesn't conflict with 'flutter'
        let projectNameSlug = projectName.toLowerCase().replace(/\s+/g, '_');
        if (projectNameSlug === 'flutter') {
            projectNameSlug = 'flutter_app';
        }

        // Separar el código en archivos individuales
        const files = this.parseFlutterCode(code);

        // Verificar si existe un archivo main.dart, si no, crear uno por defecto
        if (!files['lib/main.dart']) {
            files['lib/main.dart'] = `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${projectName}',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: const Center(
        child: Text(
          'Welcome to ${projectName}!',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}`;
        }

        // Agregar los archivos de código generados
        Object.entries(files).forEach(([filename, content]) => {
            zip.file(filename, content);
        });

        // Crear estructura de carpetas estándar de Flutter
        this.createFlutterFolderStructure(zip);

        // Agregar archivos de configuración

        // pubspec.yaml
        zip.file('pubspec.yaml', `name: ${projectNameSlug}
description: Generated Flutter application
version: 1.0.0+1

environment:
  sdk: ">=2.17.0 <3.0.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  provider: ^6.0.5
  http: ^0.13.5
  shared_preferences: ^2.0.15
  path_provider: ^2.0.11

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0
  build_runner: ^2.3.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
`);

        // analysis_options.yaml
        zip.file('analysis_options.yaml', `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - avoid_print: true
    - prefer_single_quotes: true
    - sort_child_properties_last: true
    - always_use_package_imports: true
`);

        // .gitignore
        zip.file('.gitignore', `# Miscellaneous
*.class
*.log
*.pyc
*.swp
.DS_Store
.atom/
.buildlog/
.history
.svn/
migrate_working_dir/

# IntelliJ related
*.iml
*.ipr
*.iws
.idea/

# Flutter/Dart/Pub related
**/doc/api/
**/ios/Flutter/.last_build_id
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
/build/

# Web related
lib/generated_plugin_registrant.dart

# Symbolication related
app.*.symbols

# Obfuscation related
app.*.map.json

# Android Studio will place build artifacts here
/android/app/debug
/android/app/profile
/android/app/release
`);

        // README.md
        zip.file('README.md', `# ${projectName}

A Flutter application generated from Pizarra Unificada.

## Getting Started

This project is a Flutter application that was automatically generated.

To run this project:

1. Make sure you have Flutter installed on your machine
2. Run \`flutter pub get\` to install dependencies
3. Run \`flutter run\` to start the application

## Project Structure

- \`lib/\`: Contains all the Dart code for the application
  - \`lib/screens/\`: Contains screen widgets
  - \`lib/widgets/\`: Contains reusable widgets
  - \`lib/services/\`: Contains service classes
  - \`lib/models/\`: Contains data models
  - \`lib/main.dart\`: Application entry point

## Dependencies

This project uses the following packages:
- provider: For state management
- http: For API requests
- shared_preferences: For local storage
- path_provider: For file system access
`);

        // Agregar archivos de modelo y servicios básicos
        zip.file('lib/models/app_state.dart', `class AppState {
  final bool isLoading;
  final String? error;

  AppState({
    this.isLoading = false,
    this.error,
  });

  AppState copyWith({
    bool? isLoading,
    String? error,
  }) {
    return AppState(
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}
`);

        zip.file('lib/services/api_service.dart', `import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl;

  ApiService({required this.baseUrl});

  Future<Map<String, dynamic>> get(String endpoint) async {
    final response = await http.get(Uri.parse('$baseUrl/$endpoint'));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load data: \${response.statusCode}');
    }
  }

  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to post data: \${response.statusCode}');
    }
  }
}
`);
    }

    /**
     * Crea la estructura de carpetas estándar de un proyecto Flutter
     */
    private static createFlutterFolderStructure(zip: any) {
        // Crear carpetas principales
        const folders = [
            'android',
            'ios',
            'web',
            'assets',
            'assets/images',
            'lib/screens',
            'lib/widgets',
            'lib/services',
            'lib/models',
            'lib/utils',
            'test',
        ];

        // Crear archivos vacíos para mantener la estructura de carpetas en el ZIP
        folders.forEach(folder => {
            zip.file(`${folder}/.gitkeep`, '');
        });

        // Agregar archivos básicos para Android
        zip.file('android/build.gradle', `buildscript {
    ext.kotlin_version = '1.7.10'
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:7.2.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.buildDir = '../build'
subprojects {
    project.buildDir = "\${rootProject.buildDir}/\${project.name}"
}
subprojects {
    project.evaluationDependsOn(':app')
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`);

        // Agregar archivos básicos para iOS
        zip.file('ios/Runner/Info.plist', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>Flutter App</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>flutter_app</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>$(FLUTTER_BUILD_NAME)</string>
	<key>CFBundleSignature</key>
	<string>????</string>
	<key>CFBundleVersion</key>
	<string>$(FLUTTER_BUILD_NUMBER)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<false/>
	<key>CADisableMinimumFrameDurationOnPhone</key>
	<true/>
	<key>UIApplicationSupportsIndirectInputEvents</key>
	<true/>
</dict>
</plist>
`);

        // Agregar archivo de test básico
        zip.file('test/widget_test.dart', `import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package/flutter_app/main.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
`);
    }

    /**
     * Agrega archivos Angular al ZIP con estructura completa de proyecto
     */
    private static addAngularFilesToZip(zip: any, code: string, projectName: string) {
        const projectNameSlug = projectName.toLowerCase().replace(/\s+/g, '_');

        // Separar el código en archivos individuales
        const files = this.parseAngularCode(code);

        // Agregar los archivos de código generados
        Object.entries(files).forEach(([filename, content]) => {
            zip.file(filename, content);
        });

        // Crear estructura de carpetas estándar de Angular
        this.createAngularFolderStructure(zip);

        // Agregar archivos de configuración

        // package.json
        zip.file('package.json', `{
  "name": "${projectNameSlug}",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^15.0.0",
    "@angular/common": "^15.0.0",
    "@angular/compiler": "^15.0.0",
    "@angular/core": "^15.0.0",
    "@angular/forms": "^15.0.0",
    "@angular/platform-browser": "^15.0.0",
    "@angular/platform-browser-dynamic": "^15.0.0",
    "@angular/router": "^15.0.0",
    "bootstrap": "^5.3.0",
    "rxjs": "~7.5.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.12.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^15.0.0",
    "@angular/cli": "~15.0.0",
    "@angular/compiler-cli": "^15.0.0",
    "@types/jasmine": "~4.3.0",
    "@types/node": "^18.7.0",
    "jasmine-core": "~4.4.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.1.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.0.0",
    "typescript": "~4.8.0"
  }
}`);

        // angular.json
        zip.file('angular.json', `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "${projectNameSlug}": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/${projectNameSlug}",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.scss",
              "node_modules/bootstrap/dist/css/bootstrap.min.css"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "browserTarget": "${projectNameSlug}:build:production"
            },
            "development": {
              "browserTarget": "${projectNameSlug}:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "browserTarget": "${projectNameSlug}:build"
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.scss"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}`);

        // tsconfig.json
        zip.file('tsconfig.json', `{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": [
      "ES2022",
      "dom"
    ]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}`);

        // tsconfig.app.json
        zip.file('tsconfig.app.json', `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts",
    "src/polyfills.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}`);

        // tsconfig.spec.json
        zip.file('tsconfig.spec.json', `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}`);

        // .gitignore
        zip.file('.gitignore', `# See http://help.github.com/ignore-files/ for more about ignoring files.

# Compiled output
/dist
/tmp
/out-tsc
/bazel-out

# Node
/node_modules
npm-debug.log
yarn-error.log

# IDEs and editors
.idea/
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# Visual Studio Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.history/*

# Miscellaneous
/.angular/cache
.sass-cache/
/connect.lock
/coverage
/libpeerconnection.log
testem.log
/typings

# System files
.DS_Store
Thumbs.db
`);

        // README.md
        zip.file('README.md', `# ${projectName}

This project was generated with Angular CLI and enhanced by Pizarra Unificada.

## Development server

Run \`ng serve\` for a dev server. Navigate to \`http://localhost:4200/\`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run \`ng generate component component-name\` to generate a new component. You can also use \`ng generate directive|pipe|service|class|guard|interface|enum|module\`.

## Build

Run \`ng build\` to build the project. The build artifacts will be stored in the \`dist/\` directory.

## Running unit tests

Run \`ng test\` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Project Structure

- \`src/app\`: Contains all the application components and modules
  - \`src/app/components\`: Contains UI components
  - \`src/app/services\`: Contains service classes
  - \`src/app/models\`: Contains data models
  - \`src/app/app.module.ts\`: Main module configuration
  - \`src/app/app-routing.module.ts\`: Routing configuration
- \`src/assets\`: Contains static assets like images
- \`src/environments\`: Contains environment configuration
`);

        // Agregar archivos básicos de Angular

        // src/index.html
        zip.file('src/index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${projectName}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`);

        // src/main.ts
        zip.file('src/main.ts', `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`);

        // src/styles.scss
        zip.file('src/styles.scss', `/* You can add global styles to this file, and also import other style files */
html, body {
  height: 100%;
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}
`);

        // src/polyfills.ts
        zip.file('src/polyfills.ts', `/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

import 'zone.js';  // Included with Angular CLI.
`);

        // src/app/app.component.ts
        zip.file('src/app/app.component.ts', `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '${projectName}';
}
`);

        // src/app/app.component.html
        zip.file('src/app/app.component.html', `<div class="container">
  <div class="row">
    <div class="col-12">
      <h1>{{ title }}</h1>
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">{{ title }}</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item">
                <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <router-outlet></router-outlet>
    </div>
  </div>
</div>
`);

        // src/app/app.component.scss
        zip.file('src/app/app.component.scss', `h1 {
  color: #3f51b5;
  margin-top: 20px;
  margin-bottom: 20px;
}
`);

        // src/app/models/index.ts
        zip.file('src/app/models/index.ts', `export interface AppState {
  isLoading: boolean;
  error: string | null;
}
`);

        // src/app/services/api.service.ts
        zip.file('src/app/services/api.service.ts', `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(\`\${this.baseUrl}/\${endpoint}\`);
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(\`\${this.baseUrl}/\${endpoint}\`, data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(\`\${this.baseUrl}/\${endpoint}\`, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(\`\${this.baseUrl}/\${endpoint}\`);
  }
}
`);

        // src/environments/environment.ts
        zip.file('src/environments/environment.ts', `export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
`);

        // src/environments/environment.prod.ts
        zip.file('src/environments/environment.prod.ts', `export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api'
};
`);
    }

    /**
     * Crea la estructura de carpetas estándar de un proyecto Angular
     */
    private static createAngularFolderStructure(zip: any) {
        // Crear carpetas principales
        const folders = [
            'src/app/components',
            'src/app/services',
            'src/app/models',
            'src/app/shared',
            'src/app/guards',
            'src/app/interceptors',
            'src/app/directives',
            'src/app/pipes',
            'src/assets/images',
            'src/assets/icons',
            'src/environments',
        ];

        // Crear archivos vacíos para mantener la estructura de carpetas en el ZIP
        folders.forEach(folder => {
            zip.file(`${folder}/.gitkeep`, '');
        });
    }

    /**
     * Parsea el código Flutter en archivos individuales
     */
    private static parseFlutterCode(code: string): Record<string, string> {
        const files: Record<string, string> = {};

        // Extraer main.dart completo con imports
        // Buscar desde el primer import hasta el final de la clase MyApp
        const mainMatch = code.match(/(?:import\s+[^;]+;[\s]*)*void main\(\)[\s\S]*?class MyApp[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/);
        if (mainMatch) {
            files['lib/main.dart'] = mainMatch[0];
        }

        // Extraer todas las clases de widgets con sus imports
        const widgetPattern = /(?:(?:import\s+[^;]+;[\s]*)*)?class (\w+) extends (StatelessWidget|StatefulWidget|ChangeNotifier|InheritedWidget|Widget|State<\w+>)[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
        const widgetMatches = code.matchAll(widgetPattern);

        for (const match of widgetMatches) {
            const className = match[1];
            // const widgetType = match[2]; // Not used, commented out to avoid ESLint warning

            // Determinar la carpeta según el tipo de widget
            let folder = 'lib/widgets';
            if (className.endsWith('Screen') || className.endsWith('Page')) {
                folder = 'lib/screens';
            }

            if (className !== 'MyApp') {
                const fileName = className.charAt(0).toLowerCase() + className.slice(1);

                // Buscar imports específicos para esta clase
                const classStartIndex = code.indexOf(match[0]);
                const beforeClass = code.substring(0, classStartIndex);
                const importsMatch = beforeClass.match(/(?:import\s+[^;]+;[\s]*)+$/);

                let fileContent = match[0];
                if (importsMatch) {
                    fileContent = importsMatch[0] + '\n' + match[0];
                } else {
                    // Agregar import básico de Flutter si no hay imports
                    fileContent = "import 'package:flutter/material.dart';\n\n" + match[0];
                }

                files[`${folder}/${fileName}.dart`] = fileContent;
            }
        }

        // Extraer clases de servicios con imports
        const servicePattern = /(?:(?:import\s+[^;]+;[\s]*)*)?class (\w+)Service[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
        const serviceMatches = code.matchAll(servicePattern);

        for (const match of serviceMatches) {
            const className = match[1];
            const fileName = className.charAt(0).toLowerCase() + className.slice(1);

            // Buscar imports específicos para esta clase
            const classStartIndex = code.indexOf(match[0]);
            const beforeClass = code.substring(0, classStartIndex);
            const importsMatch = beforeClass.match(/(?:import\s+[^;]+;[\s]*)+$/);

            let fileContent = match[0];
            if (importsMatch) {
                fileContent = importsMatch[0] + '\n' + match[0];
            } else {
                // Agregar imports básicos para servicios
                fileContent = "import 'dart:convert';\nimport 'package:http/http.dart' as http;\n\n" + match[0];
            }

            files[`lib/services/${fileName}_service.dart`] = fileContent;
        }

        // Extraer clases de modelos con imports
        const modelPattern = /(?:(?:import\s+[^;]+;[\s]*)*)?class (\w+)(?:\s+extends\s+\w+)?(?:\s+with\s+\w+)?[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
        const modelMatches = code.matchAll(modelPattern);

        for (const match of modelMatches) {
            const className = match[1];

            // Solo incluir si no es widget, servicio o MyApp
            if (!className.includes('Widget') && !className.includes('Service') &&
                !className.includes('State') && className !== 'MyApp' &&
                !className.includes('Screen') && !className.includes('Page')) {
                const fileName = className.charAt(0).toLowerCase() + className.slice(1);

                // Buscar imports específicos para esta clase
                const classStartIndex = code.indexOf(match[0]);
                const beforeClass = code.substring(0, classStartIndex);
                const importsMatch = beforeClass.match(/(?:import\s+[^;]+;[\s]*)+$/);

                let fileContent = match[0];
                if (importsMatch) {
                    fileContent = importsMatch[0] + '\n' + match[0];
                } else {
                    // Agregar import básico de Flutter si no hay imports
                    fileContent = "import 'package:flutter/material.dart';\n\n" + match[0];
                }

                files[`lib/models/${fileName}.dart`] = fileContent;
            }
        }

        // Extraer archivos de test con imports
        const testPattern = /\/\/ (\w+)_test\.dart[\s\S]*?(?:(?:import\s+[^;]+;[\s]*)*)?void main\([\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
        const testMatches = code.matchAll(testPattern);

        for (const match of testMatches) {
            const testName = match[1];
            let fileContent = match[0].replace(`// ${testName}_test.dart`, '');

            // Asegurar que tenga los imports necesarios para tests
            if (!fileContent.includes('import')) {
                fileContent = "import 'package:flutter/material.dart';\nimport 'package:flutter_test/flutter_test.dart';\n\n" + fileContent;
            }

            files[`test/${testName}_test.dart`] = fileContent;
        }

        // Extraer NavigationDrawer si existe con imports
        const drawerPattern = /(?:(?:import\s+[^;]+;[\s]*)*)?class NavigationDrawer[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/;
        const drawerMatch = code.match(drawerPattern);

        if (drawerMatch) {
            let fileContent = drawerMatch[0];

            // Buscar imports específicos para NavigationDrawer
            const classStartIndex = code.indexOf(drawerMatch[0]);
            const beforeClass = code.substring(0, classStartIndex);
            const importsMatch = beforeClass.match(/(?:import\s+[^;]+;[\s]*)+$/);

            if (importsMatch) {
                fileContent = importsMatch[0] + '\n' + drawerMatch[0];
            } else {
                // Agregar import básico de Flutter
                fileContent = "import 'package:flutter/material.dart';\n\n" + drawerMatch[0];
            }

            files['lib/widgets/navigation_drawer.dart'] = fileContent;
        }

        return files;
    }

    /**
     * Parsea el código Angular en archivos individuales
     */
    private static parseAngularCode(code: string): Record<string, string> {
        const files: Record<string, string> = {};

        // Buscar archivos de configuración
        const angularJsonMatch = code.match(/\/\/ angular\.json[\s\S]*?\}/);
        if (angularJsonMatch) {
            files['angular.json'] = angularJsonMatch[0].replace('// angular.json', '');
        }

        const packageJsonMatch = code.match(/\/\/ package\.json[\s\S]*?\}/);
        if (packageJsonMatch) {
            files['package.json'] = packageJsonMatch[0].replace('// package.json', '');
        }

        // Buscar componentes con expresiones regulares mejoradas
        const componentMatches = code.matchAll(/\/\/ (\w+)\.component\.ts[\s\S]*?export class (\w+)Component[\s\S]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g);
        for (const match of componentMatches) {
            const componentName = match[1];
            const componentClassName = match[2];

            // Convertir nombre a kebab-case para consistencia con directorios
            const kebabCaseName = this.toKebabCase(componentName);

            // Obtener el contenido del componente sin el comentario de archivo
            let tsContent = match[0].replace(`// ${componentName}.component.ts`, '');

            // Limpiar y consolidar imports de Angular
            tsContent = this.consolidateAngularImports(tsContent);

            // Add TypeScript file con nombre consistente
            files[`src/app/${kebabCaseName}/${kebabCaseName}.component.ts`] = tsContent;

            // Look for HTML template in the code
            const htmlMatch = code.match(new RegExp(`\\/\\/ ${componentName}\\.component\\.html[\\s\\S]*?<\\/[^>]+>`, 'i'));
            if (htmlMatch) {
                files[`src/app/${kebabCaseName}/${kebabCaseName}.component.html`] = htmlMatch[0].replace(`// ${componentName}.component.html`, '');
            } else {
                // Generate default HTML template
                files[`src/app/${kebabCaseName}/${kebabCaseName}.component.html`] = `<div class="${kebabCaseName}-container">
  <h2>${this.formatDisplayName(componentName)}</h2>
  <div class="content">
    <!-- ${componentClassName} content goes here -->
    <p>This is the ${this.formatDisplayName(componentName)} component.</p>
  </div>
</div>`;
            }

            // Look for SCSS styles in the code
            const scssMatch = code.match(new RegExp(`\\/\\/ ${componentName}\\.component\\.scss[\\s\\S]*?\\.([a-z-]+)\\s*\\{[\\s\\S]*?\\}`, 'i'));
            if (scssMatch) {
                files[`src/app/${kebabCaseName}/${kebabCaseName}.component.scss`] = scssMatch[0].replace(`// ${componentName}.component.scss`, '');
            } else {
                // Generate default SCSS styles
                files[`src/app/${kebabCaseName}/${kebabCaseName}.component.scss`] = `.${kebabCaseName}-container {
  padding: 20px;

  h2 {
    color: #333;
    margin-bottom: 15px;
  }

  .content {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
  }
}`;
            }
        }

        // Buscar servicios
        const serviceMatches = code.matchAll(/\/\/ (\w+)\.service\.ts[\s\S]*?export class (\w+)Service[\sS]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g);
        for (const match of serviceMatches) {
            const serviceName = match[1];
            const kebabCaseName = this.toKebabCase(serviceName);

            let serviceContent = match[0].replace(`// ${serviceName}.service.ts`, '');
            if (!serviceContent.includes('import { Injectable }')) {
                serviceContent = `import { Injectable } from '@angular/core';\n\n${serviceContent}`;
            }

            files[`src/app/services/${kebabCaseName}.service.ts`] = serviceContent;
        }

        // Buscar y generar app.module.ts con imports correctos
        const moduleMatches = code.matchAll(/\/\/ (\w+)\.module\.ts[\s\S]*?export class (\w+)Module[\sS]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g);
        for (const match of moduleMatches) {
            const moduleName = match[1];
            let moduleContent = match[0].replace(`// ${moduleName}.module.ts`, '');

            if (moduleName === 'app') {
                // Para app.module.ts, corregir los imports y usar nombres consistentes
                const correctedModuleContent = this.fixAppModuleImports(moduleContent, code);
                files['src/app/app.module.ts'] = correctedModuleContent;
            } else {
                // Agregar imports básicos de Angular para otros módulos
                if (!moduleContent.includes('import { NgModule }')) {
                    const basicImports = `import { NgModule } from '@angular/core';\nimport { CommonModule } from '@angular/common';\n\n`;
                    moduleContent = basicImports + moduleContent;
                }

                const kebabCaseName = this.toKebabCase(moduleName);
                files[`src/app/${kebabCaseName}/${kebabCaseName}.module.ts`] = moduleContent;
            }
        }

        // Buscar routing modules
        const routingMatches = code.matchAll(/\/\/ (\w+)-routing\.module\.ts[\s\S]*?export class (\w+)RoutingModule[\sS]*?\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g);
        for (const match of routingMatches) {
            const routingName = match[1];
            let routingContent = match[0].replace(`// ${routingName}-routing.module.ts`, '');

            // Agregar imports básicos para routing
            if (!routingContent.includes('import { NgModule }')) {
                const routingImports = `import { NgModule } from '@angular/core';\nimport { RouterModule, Routes } from '@angular/router';\n\n`;
                routingContent = routingImports + routingContent;
            }

            if (routingName === 'app') {
                // Para app-routing.module.ts, agregar imports de componentes usados en rutas
                routingContent = this.fixAppRoutingImports(routingContent, code);
                files['src/app/app-routing.module.ts'] = routingContent;
            } else {
                const kebabCaseName = this.toKebabCase(routingName);
                files[`src/app/${kebabCaseName}/${kebabCaseName}-routing.module.ts`] = routingContent;
            }
        }

        return files;
    }

    /**
     * Corrige los imports del app.module.ts para usar nombres consistentes en kebab-case
     */
    private static fixAppModuleImports(moduleContent: string, fullCode: string): string {
        // Asegurar que tenga los imports básicos de Angular
        if (!moduleContent.includes('import { NgModule }')) {
            const basicImports = `import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'

`;
            moduleContent = basicImports + moduleContent;
        }

        // Extraer todos los componentes del código para corregir los imports
        const componentMatches = fullCode.matchAll(/\/\/ (\w+)\.component\.ts[\s\S]*?export class (\w+)Component/g);
        const componentImports: string[] = [];

        for (const match of componentMatches) {
            const componentName = match[1];
            const componentClassName = match[2];
            const kebabCaseName = this.toKebabCase(componentName);

            // Agregar import con ruta consistente
            componentImports.push(`import { ${componentClassName}Component } from './${kebabCaseName}/${kebabCaseName}.component';`);
        }

        // Buscar la línea de imports existente y reemplazarla
        const importPattern = /import\s+\{[^}]+Component\s*\}\s+from\s+['"]\.[^'"]+['"];?/g;
        let updatedContent = moduleContent.replace(importPattern, '');

        // Agregar los imports corregidos después de los imports básicos
        const appComponentImport = "import { AppComponent } from './app.component';";
        if (componentImports.length > 0) {
            const allImports = [appComponentImport, ...componentImports].join('\n');

            // Buscar dónde insertar los imports (después de los imports de Angular)
            const insertPoint = updatedContent.indexOf('@NgModule');
            if (insertPoint > 0) {
                updatedContent = updatedContent.slice(0, insertPoint) + allImports + '\n\n' + updatedContent.slice(insertPoint);
            } else {
                updatedContent = allImports + '\n\n' + updatedContent;
            }
        }

        return updatedContent;
    }

    /**
     * Agrega imports de componentes utilizados en las rutas al app-routing.module.ts
     */
    private static fixAppRoutingImports(routingContent: string, fullCode: string): string {
        // Extraer todas las clases de componentes del código con una expresión regular más flexible
        const componentMatches = fullCode.matchAll(/export class (\w+Component)/g);
        const componentImports: string[] = [];
        const usedComponents = new Set<string>();

        // Obtener componentes que se usan en las rutas
        const routeMatches = routingContent.matchAll(/component:\s*(\w+Component)/g);
        for (const match of routeMatches) {
            usedComponents.add(match[1]);
        }

        // Generar imports solo para los componentes que se usan en las rutas
        for (const match of componentMatches) {
            const componentClassName = match[1];

            if (usedComponents.has(componentClassName)) {
                // Convertir el nombre del componente a lowercase sin guiones para la ruta del archivo
                const componentName = componentClassName.replace(/Component$/, '');
                const directoryName = componentName.toLowerCase();

                // Agregar import con ruta consistente (sin guiones)
                componentImports.push(`import { ${componentClassName} } from './${directoryName}/${directoryName}.component';`);
            }
        }

        // Buscar el punto de inserción después de los imports básicos
        const routerImportIndex = routingContent.indexOf("import { RouterModule, Routes } from '@angular/router';");
        if (routerImportIndex !== -1) {
            const insertPoint = routingContent.indexOf('\n', routerImportIndex) + 1;

            if (componentImports.length > 0) {
                const allImports = componentImports.join('\n') + '\n';
                routingContent = routingContent.slice(0, insertPoint) + allImports + routingContent.slice(insertPoint);
            }
        }

        return routingContent;
    }

    /**
     * Formatea un nombre de componente para mostrar
     * Convierte kebab-case a Title Case con espacios
     */
    private static formatDisplayName(name: string): string {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Convierte un nombre de componente a kebab-case para consistencia con Angular CLI
     */
    private static toKebabCase(name: string): string {
        return name
            .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Limpia y consolida los imports de Angular en el contenido TypeScript
     * Elimina imports duplicados y ordena los imports de Angular de manera coherente
     */
    private static consolidateAngularImports(tsContent: string): string {
        // Expresión regular para encontrar imports de Angular
        const angularImportPattern = /import\s+{([^}]+)}\s+from\s+['"]@angular\/([^'"]+)['"];?/g;

        // Objeto para almacenar los imports encontrados
        const importsMap: Record<string, string[]> = {};

        // Buscar todos los imports de Angular en el contenido
        let match;
        while ((match = angularImportPattern.exec(tsContent)) !== null) {
            const importedMembers = match[1].split(',').map(m => m.trim());
            const modulePath = match[2].trim();

            // Agregar los miembros importados al mapa
            if (!importsMap[modulePath]) {
                importsMap[modulePath] = [];
            }
            importsMap[modulePath] = [...new Set([...importsMap[modulePath], ...importedMembers])];
        }

        // Construir los nuevos imports consolidados
        let consolidatedImports = Object.entries(importsMap)
            .map(([modulePath, members]) => `import { ${members.join(', ')} } from '@angular/${modulePath}';`)
            .join('\n');

        // Reemplazar el contenido original de imports por el consolidado
        tsContent = tsContent.replace(angularImportPattern, '').trim();
        tsContent = consolidatedImports + '\n\n' + tsContent;

        return tsContent;
    }
}
