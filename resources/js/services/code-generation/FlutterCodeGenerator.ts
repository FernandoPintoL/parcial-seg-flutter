// services/code-generation/FlutterCodeGenerator.ts
import { BaseCodeGenerator } from './BaseCodeGenerator';
import type { PizarraUnificada, UnifiedElement, UnifiedScreen, CodeExportOptions } from '@/Data/PizarraUnificada';
import { WidgetService } from '@/services/WidgetService';

export class FlutterCodeGenerator extends BaseCodeGenerator {
    
    generateCode(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const screens = pizarra.screens || [];
        const projectName = pizarra.name || 'MyApp';
        
        // Generar estructura del proyecto
        let code = this.generateProjectStructure(pizarra, options);
        
        // Generar código de pantallas
        const screenClasses = screens
            .filter(screen => !screen.isDrawer)
            .map(screen => this.generateScreenCode(screen, options))
            .join('\n\n');
        
        // Generar navegación
        const navigationCode = this.generateNavigationCode(screens, projectName);
        
        // Generar aplicación principal
        const mainAppCode = this.generateMainAppCode(screens, projectName);
        
        return `${code}\n\n${navigationCode}\n\n${screenClasses}\n\n${mainAppCode}`;
    }
    
    generateScreenCode(screen: UnifiedScreen, options: CodeExportOptions): string {
        const className = this.formatClassName(screen.name);
        const scaffoldWidget = screen.elements?.find(element => element.type === 'Scaffold');
        
        if (scaffoldWidget) {
            return this.generateScaffoldScreen(className, scaffoldWidget, options);
        } else {
            return this.generateDefaultScreen(className, screen, options);
        }
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
            case 'Text':
                return this.generateTextWidget(props, indent);
            case 'TextField':
            case 'TextFormField':
                return this.generateTextFieldWidget(props, indent);
            case 'ElevatedButton':
                return this.generateElevatedButtonWidget(props, indent);
            case 'Container':
                return this.generateContainerWidget(props, element.children, options, indent);
            case 'Row':
            case 'Column':
                return this.generateLayoutWidget(element.type, props, element.children, options, indent);
            case 'Image':
                return this.generateImageWidget(props, indent);
            case 'Icon':
                return this.generateIconWidget(props, indent);
            case 'Checkbox':
                return this.generateCheckboxWidget(props, indent);
            case 'DropdownButton':
                return this.generateDropdownWidget(props, indent);
            case 'Card':
                return this.generateCardWidget(props, element.children, options, indent);
            case 'AppBar':
                return this.generateAppBarWidget(props, indent);
            case 'Scaffold':
                return this.generateScaffoldWidget(props, element.children, options, indent);
            default:
                return this.generateGenericWidget(element, props, indent);
        }
    }
    
    generateProjectStructure(pizarra: PizarraUnificada, options: CodeExportOptions): string {
        const projectName = pizarra.name || 'MyApp';
        
        return `// Generated Flutter project structure for ${projectName}
// This code was generated automatically from the unified pizarra

import 'package:flutter/material.dart';

// Project configuration
class ProjectConfig {
  static const String appName = '${projectName}';
  static const String version = '1.0.0';
  static const String description = '${pizarra.description || 'Generated Flutter application'}';
}`;
    }
    
    getSupportedExtensions(): string[] {
        return ['.dart', '.yaml', '.lock'];
    }
    
    getFrameworkName(): string {
        return 'Flutter';
    }
    
    // Métodos privados para generar widgets específicos
    private generateTextWidget(props: Record<string, any>, indent: string): string {
        const text = this.getPropertyValue(props, 'text', 'Text');
        const style = this.getPropertyValue(props, 'style', '');
        const textAlign = this.getPropertyValue(props, 'textAlign', '');
        
        let code = `${indent}Text(\n`;
        code += `${indent}  "${text}",\n`;
        if (style) code += `${indent}  style: ${style},\n`;
        if (textAlign) code += `${indent}  textAlign: ${textAlign},\n`;
        code += `${indent})`;
        
        return code;
    }
    
    private generateTextFieldWidget(props: Record<string, any>, indent: string): string {
        const label = this.getPropertyValue(props, 'label', 'Input');
        const hint = this.getPropertyValue(props, 'hint', 'Enter text');
        const value = this.getPropertyValue(props, 'value', '');
        
        return `${indent}TextFormField(
${indent}  decoration: InputDecoration(
${indent}    labelText: "${label}",
${indent}    hintText: "${hint}",
${indent}  ),
${indent}  initialValue: "${value}",
${indent})`;
    }
    
    private generateElevatedButtonWidget(props: Record<string, any>, indent: string): string {
        const text = this.getPropertyValue(props, 'text', 'Button');
        const onPressed = this.getPropertyValue(props, 'onPressed', '() {}');
        
        return `${indent}ElevatedButton(
${indent}  onPressed: ${onPressed},
${indent}  child: Text("${text}"),
${indent})`;
    }
    
    private generateContainerWidget(props: Record<string, any>, children: UnifiedElement[], options: CodeExportOptions, indent: string): string {
        const width = this.getPropertyValue(props, 'width', 200);
        const height = this.getPropertyValue(props, 'height', 200);
        const color = this.getPropertyValue(props, 'color', 'Colors.white');
        
        let code = `${indent}Container(
${indent}  width: ${width},
${indent}  height: ${height},
${indent}  color: ${color},`;
        
        if (children && children.length > 0) {
            code += `\n${indent}  child: ${this.generateChildrenCode(children, options, this.indent(indent, 1))}`;
        }
        
        code += `\n${indent})`;
        return code;
    }
    
    private generateLayoutWidget(type: string, props: Record<string, any>, children: UnifiedElement[], options: CodeExportOptions, indent: string): string {
        const mainAxisAlignment = this.getPropertyValue(props, 'mainAxisAlignment', 'MainAxisAlignment.start');
        const crossAxisAlignment = this.getPropertyValue(props, 'crossAxisAlignment', 'CrossAxisAlignment.center');
        
        let code = `${indent}${type}(\n`;
        code += `${indent}  mainAxisAlignment: ${mainAxisAlignment},\n`;
        code += `${indent}  crossAxisAlignment: ${crossAxisAlignment},\n`;
        code += `${indent}  children: [\n`;
        
        if (children && children.length > 0) {
            code += this.generateChildrenCode(children, options, this.indent(indent, 2));
        }
        
        code += `\n${indent}  ],\n`;
        code += `${indent})`;
        
        return code;
    }
    
    private generateImageWidget(props: Record<string, any>, indent: string): string {
        const src = this.getPropertyValue(props, 'src', '/images/placeholder.png');
        const width = this.getPropertyValue(props, 'width', 100);
        const height = this.getPropertyValue(props, 'height', 100);
        
        return `${indent}Image.network(
${indent}  "${src}",
${indent}  width: ${width},
${indent}  height: ${height},
${indent})`;
    }
    
    private generateIconWidget(props: Record<string, any>, indent: string): string {
        const icon = this.getPropertyValue(props, 'icon', 'Icons.star');
        const size = this.getPropertyValue(props, 'size', 24);
        const color = this.getPropertyValue(props, 'color', 'Colors.black');
        
        return `${indent}Icon(
${indent}  ${icon},
${indent}  size: ${size},
${indent}  color: ${color},
${indent})`;
    }
    
    private generateCheckboxWidget(props: Record<string, any>, indent: string): string {
        const label = this.getPropertyValue(props, 'label', 'Checkbox');
        const value = this.getPropertyValue(props, 'value', false);
        
        return `${indent}CheckboxListTile(
${indent}  title: Text("${label}"),
${indent}  value: ${value},
${indent}  onChanged: (bool? value) {},
${indent})`;
    }
    
    private generateDropdownWidget(props: Record<string, any>, indent: string): string {
        const items = this.getPropertyValue(props, 'items', ['Option 1', 'Option 2', 'Option 3']);
        const value = this.getPropertyValue(props, 'value', items[0]);
        
        return `${indent}DropdownButton<String>(
${indent}  value: "${value}",
${indent}  items: ${JSON.stringify(items)}.map<DropdownMenuItem<String>>((String value) {
${indent}    return DropdownMenuItem<String>(
${indent}      value: value,
${indent}      child: Text(value),
${indent}    );
${indent}  }).toList(),
${indent}  onChanged: (String? newValue) {},
${indent})`;
    }
    
    private generateCardWidget(props: Record<string, any>, children: UnifiedElement[], options: CodeExportOptions, indent: string): string {
        const title = this.getPropertyValue(props, 'title', 'Card Title');
        const content = this.getPropertyValue(props, 'content', 'Card Content');
        
        let code = `${indent}Card(
${indent}  child: Padding(
${indent}    padding: const EdgeInsets.all(16.0),
${indent}    child: Column(
${indent}      crossAxisAlignment: CrossAxisAlignment.start,
${indent}      children: [
${indent}        Text("${title}", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
${indent}        SizedBox(height: 8),
${indent}        Text("${content}"),`;
        
        if (children && children.length > 0) {
            code += `\n${this.generateChildrenCode(children, options, this.indent(indent, 4))}`;
        }
        
        code += `\n${indent}      ],
${indent}    ),
${indent}  ),
${indent})`;
        
        return code;
    }
    
    private generateAppBarWidget(props: Record<string, any>, indent: string): string {
        const title = this.getPropertyValue(props, 'title', 'App Bar');
        const backgroundColor = this.getPropertyValue(props, 'backgroundColor', 'Colors.blue');
        
        return `${indent}AppBar(
${indent}  title: Text("${title}"),
${indent}  backgroundColor: ${backgroundColor},
${indent})`;
    }
    
    private generateScaffoldWidget(props: Record<string, any>, children: UnifiedElement[], options: CodeExportOptions, indent: string): string {
        const appBar = this.getPropertyValue(props, 'appBar', 'AppBar(title: Text("App"))');
        
        let code = `${indent}Scaffold(
${indent}  appBar: ${appBar},
${indent}  body: Padding(
${indent}    padding: const EdgeInsets.all(24.0),
${indent}    child: Center(
${indent}      child: Column(
${indent}        mainAxisAlignment: MainAxisAlignment.center,
${indent}        children: [`;
        
        if (children && children.length > 0) {
            code += `\n${this.generateChildrenCode(children, options, this.indent(indent, 5))}`;
        }
        
        code += `\n${indent}        ],
${indent}      ),
${indent}    ),
${indent}  ),
${indent})`;
        
        return code;
    }
    
    private generateGenericWidget(element: UnifiedElement, props: Record<string, any>, indent: string): string {
        // Usar WidgetService para generar código genérico
        const widgetData = {
            type: element.type,
            props: props,
            children: element.children || [],
            code_string: element.code_string || ''
        };
        
        return WidgetService.generateDefaultCodeString(widgetData as any, []);
    }
    
    private generateScaffoldScreen(className: string, scaffoldWidget: UnifiedElement, options: CodeExportOptions): string {
        return `class ${className} extends StatelessWidget {
  const ${className}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ${this.generateElementCode(scaffoldWidget, options, '    ')};
  }
}`;
    }
    
    private generateDefaultScreen(className: string, screen: UnifiedScreen, options: CodeExportOptions): string {
        const screenWidgetsCode = screen.elements
            .map(element => this.generateElementCode(element, options, '      '))
            .join(',\n');
        
        return `class ${className} extends StatelessWidget {
  const ${className}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("${screen.name}"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
${screenWidgetsCode}
            ],
          ),
        ),
      ),
    );
  }
}`;
    }
    
    private generateNavigationCode(screens: UnifiedScreen[], projectName: string): string {
        const navigationItems = screens
            .filter(screen => !screen.isDrawer)
            .map(screen => `ListTile(
      title: Text("${screen.name}"),
      onTap: () {
        Navigator.pushNamed(context, '/${this.formatSelectorName(screen.name)}');
      },
    )`)
            .join(',\n    ');
        
        return `class NavigationDrawer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Colors.blue,
            ),
            child: Text(
              "${projectName}",
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
              ),
            ),
          ),
          ${navigationItems}
        ],
      ),
    );
  }
}`;
    }
    
    private generateMainAppCode(screens: UnifiedScreen[], projectName: string): string {
        const homeScreen = screens.find(screen => screen.isHome) || screens[0];
        const homeScreenName = homeScreen ? this.formatClassName(homeScreen.name) : 'App';
        
        return `void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${projectName}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const ${homeScreenName}(),
    );
  }
}`;
    }
} 