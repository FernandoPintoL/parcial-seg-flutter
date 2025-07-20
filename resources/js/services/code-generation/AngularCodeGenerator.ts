// services/code-generation/AngularCodeGenerator.ts
import { BaseCodeGenerator } from './BaseCodeGenerator';
import type { PizarraUnificada, UnifiedElement, UnifiedScreen, CodeExportOptions } from '@/Data/PizarraUnificada';

export class AngularCodeGenerator extends BaseCodeGenerator {
    
    generateCode(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const screens = pizarra.screens || [];
        const projectName = pizarra.name || 'MyApp';
        
        // Generar estructura del proyecto
        let code = this.generateProjectStructure(pizarra, options);
        
        // Generar componentes
        const componentsCode = screens
            .map(screen => this.generateScreenCode(screen, options))
            .join('\n\n');
        
        // Generar routing
        const routingCode = this.generateRoutingCode(screens, projectName);
        
        // Generar módulos
        const modulesCode = this.generateModulesCode(screens, projectName);
        
        return `${code}\n\n${componentsCode}\n\n${routingCode}\n\n${modulesCode}`;
    }
    
    generateScreenCode(screen: UnifiedScreen, options: CodeExportOptions): string {
        const componentName = this.formatClassName(screen.name);
        const selector = `app-${this.formatSelectorName(screen.name)}`;
        
        // Generar TypeScript
        const tsCode = this.generateComponentTypeScript(componentName, selector, screen, options);
        
        // Generar HTML
        const htmlCode = this.generateComponentHTML(componentName, screen, options);
        
        // Generar SCSS
        const scssCode = this.generateComponentSCSS(componentName);
        
        return `${tsCode}\n\n${htmlCode}\n\n${scssCode}`;
    }
    
    generateElementCode(element: UnifiedElement, options: CodeExportOptions, indent: string = ''): string {
        if (!this.validateElement(element)) {
            return '';
        }
        
        const props = this.processElementProperties(element);
        
        // Si el elemento tiene código predefinido, usarlo
        if (element.code_string && element.code_string.trim() !== '') {
            return this.indent(element.code_string, indent.length / 2);
        }
        
        // Generar código basado en el tipo de elemento
        switch (element.type) {
            case 'input':
                return this.generateInputElement(props, indent);
            case 'button':
                return this.generateButtonElement(props, indent);
            case 'select':
                return this.generateSelectElement(props, indent);
            case 'textarea':
                return this.generateTextareaElement(props, indent);
            case 'checkbox':
                return this.generateCheckboxElement(props, indent);
            case 'radio':
                return this.generateRadioElement(props, indent);
            case 'div':
                return this.generateDivElement(props, element.children, options, indent);
            case 'span':
                return this.generateSpanElement(props, indent);
            case 'p':
                return this.generateParagraphElement(props, indent);
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                return this.generateHeadingElement(element.type, props, indent);
            case 'img':
                return this.generateImageElement(props, indent);
            case 'label':
                return this.generateLabelElement(props, indent);
            default:
                return this.generateGenericElement(element, props, indent);
        }
    }
    
    generateProjectStructure(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const projectName = pizarra.name || 'MyApp';
        const projectSlug = this.formatSelectorName(projectName);
        
        return `// Generated Angular project structure for ${projectName}
// This code was generated automatically from the unified pizarra

// angular.json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "${projectSlug}": {
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
            "outputPath": "dist/${projectSlug}",
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
  "name": "${projectSlug}",
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
}`;
    }
    
    getSupportedExtensions(): string[] {
        return ['.ts', '.html', '.scss', '.json', '.js'];
    }
    
    getFrameworkName(): string {
        return 'Angular';
    }
    
    // Métodos privados para generar elementos específicos
    private generateInputElement(props: Record<string, any>, indent: string): string {
        const type = this.getPropertyValue(props, 'type', 'text');
        const placeholder = this.getPropertyValue(props, 'placeholder', '');
        const value = this.getPropertyValue(props, 'value', '');
        const name = this.getPropertyValue(props, 'name', 'input');
        const required = this.getPropertyValue(props, 'required', false);
        
        let code = `${indent}<input`;
        code += ` type="${type}"`;
        code += ` formControlName="${name}"`;
        if (placeholder) code += ` placeholder="${placeholder}"`;
        if (value) code += ` value="${value}"`;
        if (required) code += ` required`;
        code += ` class="form-control">`;
        
        return code;
    }
    
    private generateButtonElement(props: Record<string, any>, indent: string): string {
        const type = this.getPropertyValue(props, 'type', 'button');
        const text = this.getPropertyValue(props, 'text', 'Button');
        const disabled = this.getPropertyValue(props, 'disabled', false);
        
        let code = `${indent}<button`;
        code += ` type="${type}"`;
        if (disabled) code += ` [disabled]="true"`;
        code += ` class="btn btn-primary">`;
        code += `${text}`;
        code += `</button>`;
        
        return code;
    }
    
    private generateSelectElement(props: Record<string, any>, indent: string): string {
        const name = this.getPropertyValue(props, 'name', 'select');
        const items = this.getPropertyValue(props, 'items', ['Option 1', 'Option 2', 'Option 3']);
        const value = this.getPropertyValue(props, 'value', items[0]);
        
        let code = `${indent}<select formControlName="${name}" class="form-select">`;
        items.forEach(item => {
            const selected = item === value ? ' selected' : '';
            code += `\n${indent}  <option value="${item}"${selected}>${item}</option>`;
        });
        code += `\n${indent}</select>`;
        
        return code;
    }
    
    private generateTextareaElement(props: Record<string, any>, indent: string): string {
        const name = this.getPropertyValue(props, 'name', 'textarea');
        const placeholder = this.getPropertyValue(props, 'placeholder', '');
        const rows = this.getPropertyValue(props, 'rows', 3);
        const cols = this.getPropertyValue(props, 'cols', 50);
        
        let code = `${indent}<textarea`;
        code += ` formControlName="${name}"`;
        code += ` rows="${rows}"`;
        code += ` cols="${cols}"`;
        if (placeholder) code += ` placeholder="${placeholder}"`;
        code += ` class="form-control"></textarea>`;
        
        return code;
    }
    
    private generateCheckboxElement(props: Record<string, any>, indent: string): string {
        const name = this.getPropertyValue(props, 'name', 'checkbox');
        const label = this.getPropertyValue(props, 'label', 'Checkbox');
        const value = this.getPropertyValue(props, 'value', false);
        
        return `${indent}<div class="form-check">
${indent}  <input type="checkbox" formControlName="${name}" class="form-check-input" id="${name}">
${indent}  <label class="form-check-label" for="${name}">${label}</label>
${indent}</div>`;
    }
    
    private generateRadioElement(props: Record<string, any>, indent: string): string {
        const name = this.getPropertyValue(props, 'name', 'radio');
        const label = this.getPropertyValue(props, 'label', 'Radio');
        const value = this.getPropertyValue(props, 'value', 'option1');
        
        return `${indent}<div class="form-check">
${indent}  <input type="radio" formControlName="${name}" class="form-check-input" id="${name}" value="${value}">
${indent}  <label class="form-check-label" for="${name}">${label}</label>
${indent}</div>`;
    }
    
    private generateDivElement(props: Record<string, any>, children: UnifiedElement[], options: CodeExportOptions, indent: string): string {
        const className = this.getPropertyValue(props, 'className', '');
        
        let code = `${indent}<div`;
        if (className) code += ` class="${className}"`;
        code += `>`;
        
        if (children && children.length > 0) {
            code += `\n${this.generateChildrenCode(children, options, this.indent(indent, 1))}`;
        }
        
        code += `\n${indent}</div>`;
        return code;
    }
    
    private generateSpanElement(props: Record<string, any>, indent: string): string {
        const text = this.getPropertyValue(props, 'text', 'Text');
        const className = this.getPropertyValue(props, 'className', '');
        
        let code = `${indent}<span`;
        if (className) code += ` class="${className}"`;
        code += `>${text}</span>`;
        
        return code;
    }
    
    private generateParagraphElement(props: Record<string, any>, indent: string): string {
        const text = this.getPropertyValue(props, 'text', 'Paragraph text');
        const className = this.getPropertyValue(props, 'className', '');
        
        let code = `${indent}<p`;
        if (className) code += ` class="${className}"`;
        code += `>${text}</p>`;
        
        return code;
    }
    
    private generateHeadingElement(type: string, props: Record<string, any>, indent: string): string {
        const text = this.getPropertyValue(props, 'text', 'Heading');
        const className = this.getPropertyValue(props, 'className', '');
        
        let code = `${indent}<${type}`;
        if (className) code += ` class="${className}"`;
        code += `>${text}</${type}>`;
        
        return code;
    }
    
    private generateImageElement(props: Record<string, any>, indent: string): string {
        const src = this.getPropertyValue(props, 'src', '/images/placeholder.png');
        const alt = this.getPropertyValue(props, 'alt', 'Image');
        const width = this.getPropertyValue(props, 'width', '');
        const height = this.getPropertyValue(props, 'height', '');
        
        let code = `${indent}<img src="${src}" alt="${alt}"`;
        if (width) code += ` width="${width}"`;
        if (height) code += ` height="${height}"`;
        code += ` class="img-fluid">`;
        
        return code;
    }
    
    private generateLabelElement(props: Record<string, any>, indent: string): string {
        const text = this.getPropertyValue(props, 'text', 'Label');
        const forAttr = this.getPropertyValue(props, 'for', '');
        
        let code = `${indent}<label`;
        if (forAttr) code += ` for="${forAttr}"`;
        code += ` class="form-label">${text}</label>`;
        
        return code;
    }
    
    private generateGenericElement(element: UnifiedElement, props: Record<string, any>, indent: string): string {
        const text = this.getPropertyValue(props, 'text', '');
        const className = this.getPropertyValue(props, 'className', '');
        
        let code = `${indent}<${element.type}`;
        if (className) code += ` class="${className}"`;
        code += `>${text}</${element.type}>`;
        
        return code;
    }
    
    private generateComponentTypeScript(componentName: string, selector: string, screen: UnifiedScreen, options: CodeExportOptions): string {
        const formControls = this.generateFormControls(screen.elements);
        const componentMethods = this.generateComponentMethods(screen.elements);
        
        return `// ${componentName.toLowerCase()}.component.ts
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
      ${formControls}
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form data:', this.form.value);
    }
  }

  ${componentMethods}
}`;
    }
    
    private generateComponentHTML(componentName: string, screen: UnifiedScreen, options: CodeExportOptions): string {
        const htmlElements = this.generateHTMLElements(screen.elements, options);
        
        return `<!-- ${componentName.toLowerCase()}.component.html -->
<div class="container">
  <div class="row">
    <div class="col-12">
      <h2>${screen.name}</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        ${htmlElements}
        <div class="mb-3">
          <button type="submit" class="btn btn-primary" [disabled]="!form.valid">
            Enviar
          </button>
        </div>
      </form>
    </div>
  </div>
</div>`;
    }
    
    private generateComponentSCSS(componentName: string): string {
        return `// ${componentName.toLowerCase()}.component.scss
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
}`;
    }
    
    private generateFormControls(elements: UnifiedElement[]): string {
        const controls: string[] = [];
        
        elements.forEach(element => {
            if (element.type === 'input' || element.type === 'select' || element.type === 'textarea' || element.type === 'checkbox' || element.type === 'radio') {
                const name = this.getPropertyValue(element.props, 'name', element.id || 'field');
                const required = this.getPropertyValue(element.props, 'required', false);
                
                let control = `'${name}': ['', ${required ? 'Validators.required' : ''}]`;
                controls.push(control);
            }
        });
        
        return controls.join(',\n      ');
    }
    
    private generateComponentMethods(elements: UnifiedElement[]): string {
        const methods: string[] = [];
        
        elements.forEach(element => {
            if (element.type === 'button' && element.props.action) {
                const methodName = element.props.action;
                const buttonText = this.getPropertyValue(element.props, 'text', 'Button');
                
                methods.push(`${methodName}(): void {
    // TODO: Implementar lógica del botón ${buttonText}
    console.log('Botón ${buttonText} clickeado');
  }`);
            }
        });
        
        return methods.join('\n\n  ');
    }
    
    private generateHTMLElements(elements: UnifiedElement[], options: CodeExportOptions): string {
        return elements
            .map(element => this.generateElementCode(element, options, '        '))
            .join('\n');
    }
    
    private generateRoutingCode(screens: UnifiedScreen[], projectName: string): string {
        const routes = screens
            .filter(screen => !screen.isDrawer)
            .map(screen => {
                const componentName = this.formatClassName(screen.name);
                const path = this.formatSelectorName(screen.name);
                return `{ path: '${path}', component: ${componentName}Component }`;
            })
            .join(',\n  ');
        
        return `// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  ${routes}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }`;
    }
    
    private generateModulesCode(screens: UnifiedScreen[], projectName: string): string {
        const components = screens
            .filter(screen => !screen.isDrawer)
            .map(screen => {
                const componentName = this.formatClassName(screen.name);
                return `${componentName}Component`;
            })
            .join(',\n    ');
        
        const imports = screens
            .filter(screen => !screen.isDrawer)
            .map(screen => {
                const componentName = this.formatClassName(screen.name);
                const componentPath = this.formatSelectorName(screen.name);
                return `import { ${componentName}Component } from './${componentPath}/${componentPath}.component';`;
            })
            .join('\n');
        
        return `// app.module.ts
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
export class AppModule { }`;
    }
} 