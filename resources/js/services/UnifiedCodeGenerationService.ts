// services/UnifiedCodeGenerationService.ts
import type { PizarraUnificada, UnifiedElement, UnifiedScreen, CodeExportOptions } from '@/types/PizarraUnificada';
import { CodeGenerationService } from '@/services/CodeGenerationService';

export class UnifiedCodeGenerationService {

    /**
     * Genera código basado en el framework seleccionado
     * @param pizarra Datos de la pizarra unificada
     * @param options Opciones de exportación
     * @returns Código generado
     */
    static generateCode(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        if (options.framework === 'flutter') {
            return this.generateFlutterCode(pizarra, options);
        } else if (options.framework === 'angular') {
            return this.generateAngularCode(pizarra, options);
        } else {
            return this.generateBothFrameworks(pizarra, options);
        }
    }

    /**
     * Genera código Flutter
     */
    private static generateFlutterCode(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const screens = pizarra.screens || [];
        const projectName = pizarra.name || 'MyApp';

        // Usar el servicio existente de generación de código Flutter
        return CodeGenerationService.generateFlutterCode(
            screens.map(screen => ({
                id: screen.id,
                name: screen.name,
                elements: screen.elements,
                isHome: screen.isHome,
                isDrawer: screen.isDrawer,
                user_id: pizarra.user_id,
                created_at: screen.created_at || new Date().toISOString(),
                updated_at: screen.updated_at || new Date().toISOString()
            })),
            projectName,
            [] // availableWidgets - se puede obtener desde el contexto
        );
    }

    /**
     * Genera código Angular
     */
    private static generateAngularCode(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        let code = '';

        // Generar estructura de proyecto Angular
        code += this.generateAngularProjectStructure(pizarra, options);

        // Generar componentes
        if (pizarra.screens) {
            pizarra.screens.forEach(screen => {
                code += this.generateAngularComponent(screen, options);
            });
        } else {
            // Generar componente único con elementos directos
            code += this.generateAngularSingleComponent(pizarra.elements, options);
        }

        // Generar routing
        code += this.generateAngularRouting(pizarra, options);

        // Generar módulos
        code += this.generateAngularModules(pizarra, options);

        return code;
    }

    /**
     * Genera código para ambos frameworks
     */
    private static generateBothFrameworks(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const flutterCode = this.generateFlutterCode(pizarra, { ...options, framework: 'flutter' });
        const angularCode = this.generateAngularCode(pizarra, { ...options, framework: 'angular' });

        return `// ========== FLUTTER CODE ==========\n\n${flutterCode}\n\n// ========== ANGULAR CODE ==========\n\n${angularCode}`;
    }

    /**
     * Genera la estructura del proyecto Angular
     */
    private static generateAngularProjectStructure(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const projectName = pizarra.name.toLowerCase().replace(/\s+/g, '-');

        return `
// angular.json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "${projectName}": {
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
            "outputPath": "dist/${projectName}",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json",
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
}

// package.json
{
  "name": "${projectName}",
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
}
`;
    }

    /**
     * Genera un componente Angular para una pantalla
     */
    private static generateAngularComponent(screen: UnifiedScreen, options: CodeExportOptions): string {
        const componentName = screen.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const selector = `app-${componentName.toLowerCase()}`;

        // Generar TypeScript
        const tsCode = `
// ${componentName.toLowerCase()}.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: '${selector}',
  templateUrl: './${componentName.toLowerCase()}.component.html',
  styleUrls: ['./${componentName.toLowerCase()}.component.scss']
})
export class ${componentName}Component implements OnInit {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      ${this.generateFormControls(screen.elements)}
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form data:', this.form.value);
    }
  }

  ${this.generateComponentMethods(screen.elements)}
}
`;

        // Generar HTML
        const htmlCode = `
<!-- ${componentName.toLowerCase()}.component.html -->
<div class="container">
  <div class="row">
    <div class="col-12">
      <h2>${screen.name}</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        ${this.generateHTMLElements(screen.elements)}
        <div class="mb-3">
          <button type="submit" class="btn btn-primary" [disabled]="!form.valid">
            Enviar
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
`;

        // Generar SCSS
        const scssCode = `
// ${componentName.toLowerCase()}.component.scss
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 1rem;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`;

        return `${tsCode}\n${htmlCode}\n${scssCode}`;
    }

    /**
     * Genera un componente Angular único con elementos directos
     */
    private static generateAngularSingleComponent(elements: UnifiedElement[], options: CodeExportOptions): string {
        const componentName = 'App';
        const selector = 'app-root';

        // Similar a generateAngularComponent pero para elementos directos
        const tsCode = `
// app.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: '${selector}',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      ${this.generateFormControls(elements)}
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form data:', this.form.value);
    }
  }

  ${this.generateComponentMethods(elements)}
}
`;

        const htmlCode = `
<!-- app.component.html -->
<div class="container">
  <div class="row">
    <div class="col-12">
      <h1>{{ title }}</h1>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        ${this.generateHTMLElements(elements)}
        <div class="mb-3">
          <button type="submit" class="btn btn-primary" [disabled]="!form.valid">
            Enviar
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
`;

        const scssCode = `
// app.component.scss
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 1rem;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`;

        return `${tsCode}\n${htmlCode}\n${scssCode}`;
    }

    /**
     * Genera controles de formulario para Angular
     */
    private static generateFormControls(elements: UnifiedElement[]): string {
        const controls: string[] = [];

        elements.forEach(element => {
            if (element.type === 'input' || element.type === 'textarea' || element.type === 'select') {
                const controlName = element.props.name || element.props.label || element.id;
                const validators = element.props.required ? 'Validators.required' : '';
                controls.push(`${controlName}: ['${element.props.defaultValue || ''}', [${validators}]]`);
            }
        });

        return controls.join(',\n      ');
    }

    /**
     * Genera métodos del componente
     */
    private static generateComponentMethods(elements: UnifiedElement[]): string {
        const methods: string[] = [];

        elements.forEach(element => {
            if (element.type === 'button' && element.props.action) {
                methods.push(`
  ${element.props.action}(): void {
    // TODO: Implementar lógica del botón ${element.props.text}
    console.log('Botón ${element.props.text} clickeado');
  }`);
            }
        });

        return methods.join('\n');
    }

    /**
     * Genera elementos HTML para Angular
     */
    private static generateHTMLElements(elements: UnifiedElement[]): string {
        let html = '';

        elements.forEach(element => {
            html += this.generateHTMLElement(element);
        });

        return html;
    }

    /**
     * Genera un elemento HTML específico
     */
    private static generateHTMLElement(element: UnifiedElement): string {
        switch (element.type) {
            case 'input':
                return `
        <div class="mb-3">
          <label class="form-label">${element.props.label || element.props.name}</label>
          <input 
            type="${element.props.type || 'text'}" 
            class="form-control" 
            formControlName="${element.props.name || element.props.label || element.id}"
            placeholder="${element.props.placeholder || ''}"
            ${element.props.required ? 'required' : ''}
          />
        </div>`;

            case 'textarea':
                return `
        <div class="mb-3">
          <label class="form-label">${element.props.label || element.props.name}</label>
          <textarea 
            class="form-control" 
            formControlName="${element.props.name || element.props.label || element.id}"
            placeholder="${element.props.placeholder || ''}"
            rows="${element.props.rows || 3}"
            ${element.props.required ? 'required' : ''}
          ></textarea>
        </div>`;

            case 'select':
                const options = element.props.options || [];
                const optionsHtml = options.map((option: string) => `<option value="${option}">${option}</option>`).join('\n            ');
                return `
        <div class="mb-3">
          <label class="form-label">${element.props.label || element.props.name}</label>
          <select 
            class="form-select" 
            formControlName="${element.props.name || element.props.label || element.id}"
            ${element.props.required ? 'required' : ''}
          >
            <option value="">Seleccionar...</option>
            ${optionsHtml}
          </select>
        </div>`;

            case 'checkbox':
                return `
        <div class="mb-3 form-check">
          <input 
            type="checkbox" 
            class="form-check-input" 
            formControlName="${element.props.name || element.props.label || element.id}"
            id="${element.id}"
          />
          <label class="form-check-label" for="${element.id}">
            ${element.props.label || element.props.name}
          </label>
        </div>`;

            case 'button':
                return `
        <div class="mb-3">
          <button 
            type="${element.props.type || 'button'}" 
            class="btn btn-${element.props.variant || 'primary'}"
            ${element.props.action ? `(click)="${element.props.action}()"` : ''}
          >
            ${element.props.text || 'Botón'}
          </button>
        </div>`;

            default:
                return `
        <div class="mb-3">
          <p>${element.props.text || element.props.content || ''}</p>
        </div>`;
        }
    }

    /**
     * Genera el routing de Angular
     */
    private static generateAngularRouting(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        if (!pizarra.screens || pizarra.screens.length === 0) {
            return '';
        }

        const routes = pizarra.screens.map(screen => {
            const componentName = screen.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const path = screen.route || screen.name.toLowerCase().replace(/\s+/g, '-');

            return `  { path: '${path}', component: ${componentName}Component }`;
        }).join(',\n');

        return `
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
${pizarra.screens.map(screen => {
            const componentName = screen.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            return `import { ${componentName}Component } from './${componentName.toLowerCase()}/${componentName.toLowerCase()}.component';`;
        }).join('\n')}

const routes: Routes = [
${routes},
  { path: '', redirectTo: '/${pizarra.screens.find(s => s.isHome)?.route || pizarra.screens[0]?.route || 'home'}', pathMatch: 'full' },
  { path: '**', redirectTo: '/${pizarra.screens.find(s => s.isHome)?.route || pizarra.screens[0]?.route || 'home'}' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
`;
    }

    /**
     * Genera los módulos de Angular
     */
    private static generateAngularModules(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const components = pizarra.screens ? pizarra.screens.map(screen => {
            const componentName = screen.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            return `${componentName}Component`;
        }).join(',\n    ') : 'AppComponent';

        const imports = pizarra.screens ? pizarra.screens.map(screen => {
            const componentName = screen.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            return `import { ${componentName}Component } from './${componentName.toLowerCase()}/${componentName.toLowerCase()}.component';`;
        }).join('\n') : '';

        return `
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
${imports}

@NgModule({
  declarations: [
    AppComponent,
    ${components}
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
`;
    }
}
