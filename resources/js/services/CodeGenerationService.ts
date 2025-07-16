// services/CodeGenerationService.ts
import { Pizarra, FlutterWidget } from '@/Data/Pizarra';
import { WidgetService } from '@/services/WidgetService';

export class CodeGenerationService {
    /**
     * Generates Flutter code for the entire application
     * @param screens Array of screens
     * @param projectName Name of the project
     * @param availableWidgets Array of available widget definitions
     * @returns The generated Flutter code
     */
    static generateFlutterCode(screens: Pizarra[], projectName: string, availableWidgets: any[]): string {
        let flutterCode = '';
        // Generate screen classes
        let screenClasses = '';
        let homeScreenName = '';

        screens.forEach((screen) => {
            // Skip drawer screen as it's handled separately
            if (screen.isDrawer) {
                return;
            }

            // Format screen name for class name (remove spaces, special chars, capitalize)
            const screenClassName = screen.name
                .replace(/[^\w\s]/g, '')  // Remove special characters
                .replace(/\s+/g, '')      // Remove spaces
                .replace(/^./, match => match.toUpperCase()); // Capitalize first letter

            // Find the home screen
            if (screen.isHome) {
                homeScreenName = screenClassName;
            }

            // Check if the screen already has a Scaffold widget
            const scaffoldWidget = screen.elements?.find(widget => widget.type === 'Scaffold');

            if (scaffoldWidget) {
                // If the screen already has a Scaffold widget, use it directly
                screenClasses += `
            class ${screenClassName} extends StatelessWidget {
              const ${screenClassName}({Key? key}) : super(key: key);

              @override
              Widget build(BuildContext context) {
                return ${this.generateWidgetCode(scaffoldWidget, availableWidgets, '    ')};
              }
            }
            `;
            } else {
                // If the screen doesn't have a Scaffold widget, generate code for each widget
                let screenWidgetsCode = '';
                if (screen.elements && Array.isArray(screen.elements)) {
                    screen.elements.forEach((widget) => {
                        screenWidgetsCode += this.generateWidgetCode(widget, availableWidgets, '      ') + ',\n';
                    });
                }

                // Create a screen class with a new Scaffold
                screenClasses += `
            class ${screenClassName} extends StatelessWidget {
              const ${screenClassName}({Key? key}) : super(key: key);

              @override
              Widget build(BuildContext context) {
                return Scaffold(
                  appBar: AppBar(
                    title: const Text("${screen.name}"),
                    actions: [
                      IconButton(
                        icon: const Icon(Icons.menu),
                        onPressed: () {
                          // Show navigation drawer
                          Scaffold.of(context).openDrawer();
                        },
                      ),
                    ],
                  ),
                  drawer: NavigationDrawer(),
                  body: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Form(
                        key: GlobalKey<FormState>(),
                        autovalidateMode: AutovalidateMode.disabled,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ${screenWidgetsCode}
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }
            }
            `;
            }

        });

        // Si no se define ninguna pantalla de inicio, utilice la primera pantalla
        if (!homeScreenName && screens.length > 0) {
            homeScreenName = 'Screen0';
        }

        // Create navigation drawer
        const navigationDrawer = `
        class NavigationDrawer extends StatelessWidget {
          @override
          Widget build(BuildContext context) {
            return Drawer(
              child: Padding(
                padding: const EdgeInsets.all(24),
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
                    ${screens
                  .map(
                      (screen) => `
                    ListTile(
                      title: Text("${screen.name}"),
                      onTap: () {
                        Navigator.pushNamed(context, '/${screen.name.toLowerCase().replace(/\s+/g, '_')}');
                      },
                    ),`
                  )
                  .join('\n')}
                  ],
                ),
              ),
            );
          }
        }
        `;

        // Wrap everything in a Flutter app with navigation
        flutterCode = `
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const ${homeScreenName || 'App'}(),
    );
  }
}

${navigationDrawer}

${screenClasses}
`;

        return flutterCode;
    }

    /**
     * Generates code for a specific screen
     * @param screen The screen to generate code for
     * @param availableWidgets Array of available widget definitions
     * @returns The generated screen code
     */
    static generateScreenCode(screen: Pizarra, availableWidgets: any[]): string {
        // Skip generating code for the drawer screen, as it's handled separately
        if (screen.isDrawer) {
            return this.generateNavigationDrawerCode(screen);
        }

        // Format screen name for class name
        const screenClassName = screen.name
            .replace(/[^\w\s]/g, '')  // Remove special characters
            .replace(/\s+/g, '')      // Remove spaces
            .replace(/^./, (match) => match.toUpperCase()); // Capitalize first letter

        // Check if the screen already has a Scaffold widget
        const scaffoldWidget = screen.elements?.find(widget => widget.type === 'Scaffold');

        // Generate code for the screen
        if (scaffoldWidget) {
            // If the screen already has a Scaffold widget, use it directly
            return `
import 'package:flutter/material.dart';
import 'navigation_drawer.dart';

class ${screenClassName} extends StatelessWidget {
  const ${screenClassName}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ${this.generateWidgetCode(scaffoldWidget, availableWidgets, '    ')};
  }
}
`;
        } else {
            // If the screen doesn't have a Scaffold widget, generate code for each widget
            let screenWidgetsCode = '';
            if (screen.elements && Array.isArray(screen.elements)) {
                screen.elements.forEach((widget) => {
                    screenWidgetsCode += this.generateWidgetCode(widget, availableWidgets, '      ') + ',\n';
                });
            }

            // Create a screen class with a new Scaffold
            return `
import 'package:flutter/material.dart';
import 'navigation_drawer.dart';

class ${screenClassName} extends StatelessWidget {
  const ${screenClassName}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("${screen.name}"),
        actions: [
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              // Show navigation drawer
              Scaffold.of(context).openDrawer();
            },
          ),
        ],
      ),
      drawer: const NavigationDrawer(),
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
}
`;
        }
    }

    /**
     * Generates code for the navigation drawer
     * @param drawerScreen The drawer screen
     * @returns The generated navigation drawer code
     */
    static generateNavigationDrawerCode(drawerScreen: Pizarra): string {
        // Find the drawer widget
        const drawerWidget = drawerScreen.elements?.find(widget => widget.type === 'Drawer');
        if (!drawerWidget) {
            return '// No NavigationDrawer widget found';
        }

        // Generate code for the NavigationDrawer
        return `
import 'package:flutter/material.dart';

class NavigationDrawer extends StatelessWidget {
  const NavigationDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: ${drawerWidget.props.backgroundColor ? `Color(0xFF${drawerWidget.props.backgroundColor.substring(1).toUpperCase()})` : 'Colors.white'},
      width: ${drawerWidget.props.width || 300},
      elevation: ${drawerWidget.props.elevation || 16},
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              accountName: Text("${drawerWidget.props.userName || 'User Name'}"),
              accountEmail: Text("${drawerWidget.props.userEmail || 'user@example.com'}"),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  "${drawerWidget.props.avatarText || 'U'}",
                  style: TextStyle(
                    fontSize: 40.0,
                    color: ${drawerWidget.props.avatarColor ?
                      `Color(0xFF${drawerWidget.props.avatarColor.substring(1).toUpperCase()})` :
                      'Colors.blue'}
                  ),
                ),
              ),
              decoration: BoxDecoration(
                color: ${drawerWidget.props.headerColor ?
                  `Color(0xFF${drawerWidget.props.headerColor.substring(1).toUpperCase()})` :
                  'Colors.blue'},
              ),
            ),
            // Add screen navigation items here
            Divider(),
            ListTile(
              leading: Icon(Icons.settings),
              title: Text("Settings"),
              onTap: () {
                // Navigate to settings
              },
            ),
            ListTile(
              leading: Icon(Icons.help),
              title: Text("Help & Feedback"),
              onTap: () {
                // Navigate to help
              },
            ),
          ],
        ),
      ),
    );
  }
}
`;
    }

    /**
     * Generates code for a widget
     * @param widget The widget to generate code for
     * @param availableWidgets Array of available widget definitions
     * @param indent Indentation string
     * @returns The generated widget code
     */
    static generateWidgetCode(widget: FlutterWidget, availableWidgets: any[], indent: string = ''): string {
        // If the widget has a code_string property, use it directly
        if (widget.code_string && widget.code_string.trim() !== '') {
            // Check if the code_string already includes the widget type
            if (widget.code_string.trim().startsWith(widget.type)) {
                return `${indent}${widget.code_string}`;
            } else {
                // If not, wrap it with the widget type
                return `${indent}${widget.type}(\n${indent}  ${widget.code_string}\n${indent})`;
            }
        }

        // Otherwise, use the WidgetService to generate the code
        return WidgetService.generateDefaultCodeString(widget, availableWidgets);
    }
}
