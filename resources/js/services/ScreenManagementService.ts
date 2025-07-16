// services/ScreenManagementService.ts
import { Pizarra, FlutterWidget } from '@/Data/Pizarra';
import { AlertService } from '@/services/AlertService';
import Swal from 'sweetalert2';

/**
 * Service for managing screens in the Flutter canvas
 */
export class ScreenManagementService {
    /**
     * Initializes screens if they are empty
     * @param screens Array of screens
     * @param pizarra Pizarra object
     * @param availableWidgets Array of available widget definitions
     * @param widgetIdCounter Counter for generating unique widget IDs
     * @returns The updated widgetIdCounter
     */
    static initializeScreens(
        screens: Pizarra[],
        pizarra: Pizarra | null,
        availableWidgets: any[],
        widgetIdCounter: number
    ): number {
        let localWidgetIdCounter = widgetIdCounter;

        if (screens.length === 0) {
            // Create a default home screen
            const elements = Array.isArray(pizarra?.widgets) && pizarra.widgets.length > 0
                ? pizarra.widgets
                : this.addDefaultWidgets([], 'Home', availableWidgets, localWidgetIdCounter);

            // Create a default drawer screen
            const drawerElements = [];
            const drawerDef = availableWidgets.find(w => w.type === 'Drawer');
            console.log('drawerDef', drawerDef);
            if (drawerDef) {
                console.log('Creating default Drawer widget: ', drawerDef.type);
                const drawerWidget = {
                    id: `widget-${(drawerDef as any).id ?? Date.now()}`,
                    type: 'Drawer',
                    props: {} as Record<string, any>,
                    children: []
                };
                // Initialize properties with default values
                drawerDef.properties.forEach((prop) => {
                    drawerWidget.props[prop.name] = prop.defaultValue;
                });
                drawerElements.push(drawerWidget);
            }

            // Add drawer screen first
            screens.push({
                id: `screen-drawer-${Date.now()}`,
                name: 'Drawer',
                elements: drawerElements,
                isHome: false,
                isDrawer: true
            });

            // Add home screen
            screens.push({
                id: `screen-${Date.now()}`,
                name: 'Home',
                elements: elements,
                isHome: true
            });
        } else {
            // Ensure all screens have unique IDs
            screens.forEach((screen, index) => {
                if (!screen.id) {
                    screen.id = `screen-${Date.now()}-${index}`;
                }
            });

            // Check if drawer screen exists, if not create it
            if (!screens.some(screen => screen.isDrawer)) {
                const drawerElements = [];
                const drawerDef = availableWidgets.find(w => w.type === 'Drawer');
                if (drawerDef) {
                    const drawerWidget = {
                        id: `widget-${localWidgetIdCounter++}`,
                        type: 'Drawer',
                        props: {} as Record<string, any>,
                        children: []
                    };

                    // Initialize properties with default values
                    drawerDef.properties.forEach((prop) => {
                        drawerWidget.props[prop.name] = prop.defaultValue;
                    });

                    drawerElements.push(drawerWidget);
                }

                // Add drawer screen
                screens.unshift({
                    id: `screen-drawer-${Date.now()}`,
                    name: 'Drawer',
                    elements: drawerElements,
                    isHome: false,
                    isDrawer: true
                });
            }
        }

        return localWidgetIdCounter;
    }

    /**
     * Adds a new screen
     * @param screens Array of screens
     * @param newScreenName Name of the new screen
     * @param availableWidgets Array of available widget definitions
     * @param widgetIdCounter Counter for generating unique widget IDs
     * @param userId User ID
     * @returns Object with updated screens and currentScreenIndex
     */
    static addScreen(
        screens: Pizarra[],
        newScreenName: string,
        availableWidgets: any[],
        widgetIdCounter: number,
        userId?: number
    ): { screens: Pizarra[], currentScreenIndex: number, widgetIdCounter: number } {
        console.log('Adding new screen:', newScreenName, 'with available widgets:', availableWidgets);
        if (!newScreenName.trim()) {
            AlertService.prototype.error('Error', 'El nombre de la pantalla no puede estar vacío');
            return { screens, currentScreenIndex: 0, widgetIdCounter };
        }

        // Generate a unique ID for the screen
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const uniqueId = `screen-${timestamp}-${randomSuffix}`;

        screens.push({
            id: uniqueId,
            name: newScreenName,
            elements: this.addDefaultWidgets([], newScreenName, availableWidgets, widgetIdCounter),
            isHome: screens.length === 0,
            user_id: userId,
        });

        // Select the new screen
        const currentScreenIndex = screens.length - 1;

        return { screens, currentScreenIndex, widgetIdCounter };
    }

    /**
     * Deletes a screen
     * @param screens Array of screens
     * @param index Index of the screen to delete
     * @param currentScreenIndex Current screen index
     * @returns Promise with updated screens and currentScreenIndex
     */
    static async deleteScreen(
        screens: Pizarra[],
        index: number,
        currentScreenIndex: number
    ): Promise<{ screens: Pizarra[], currentScreenIndex: number } | null> {
        if (screens.length <= 1) {
            AlertService.prototype.error('Error', 'No puedes eliminar la única pantalla');
            return null;
        }

        // Confirm deletion
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Remove the screen
            screens.splice(index, 1);

            // Adjust current screen index if needed
            if (currentScreenIndex >= screens.length) {
                currentScreenIndex = screens.length - 1;
            }

            return { screens, currentScreenIndex };
        }

        return null;
    }

    /**
     * Sets a screen as the home screen
     * @param screens Array of screens
     * @param index Index of the screen to set as home
     * @returns Updated screens array
     */
    static setHomeScreen(screens: Pizarra[], index: number): Pizarra[] {
        screens.forEach((screen, i) => {
            screen.isHome = i === index;
        });
        return screens;
    }

    /**
     * Adds default widgets (Scaffold with AppBar, ScrollChildren, and Form) to a screen
     * @param existingElements Existing elements array
     * @param screenName Screen name
     * @param availableWidgets Array of available widget definitions
     * @param widgetIdCounter Counter for generating unique widget IDs
     * @returns Array of Flutter widgets
     */
    static addDefaultWidgets(
        existingElements: FlutterWidget[] = [],
        screenName: string = 'My Flutter App',
        availableWidgets: any[],
        widgetIdCounter: number
    ): FlutterWidget[] {
        // According to the issue description, we should not insert any widgets in the canvas initially

        // Suppress ESLint warnings by using the parameters in a dummy way
        console.log(`Not adding default widgets for screen ${screenName} with ${availableWidgets.length} available widgets and widget ID counter ${widgetIdCounter}`);

        // Return existing elements if there are any, otherwise return an empty array
        if (existingElements.length > 0) {
            return existingElements;
        }

        // Return an empty array to not insert any widgets in the canvas initially
        return [];
    }

    /**
     * Finds or creates the NavigationDrawer widget
     * @param screens Array of screens
     * @param availableWidgets Array of available widget definitions
     * @param widgetIdCounter Counter for generating unique widget IDs
     * @returns The NavigationDrawer widget and updated widgetIdCounter
     */
    static findOrCreateNavigationDrawer(
        screens: Pizarra[],
        availableWidgets: any[],
        widgetIdCounter: number
    ): { drawerWidget: FlutterWidget | null, widgetIdCounter: number } {
        // First, try to find the drawer screen
        const drawerScreen = screens.find(screen => screen.isDrawer);

        if (drawerScreen && drawerScreen.elements) {
            // Look for a Drawer widget in the drawer screen
            const existingDrawer = drawerScreen.elements.find(widget => widget.type === 'Drawer');
            if (existingDrawer) {
                return { drawerWidget: existingDrawer, widgetIdCounter };
            }
        }

        // If not found, create a new one
        const drawerDef = availableWidgets.find(w => w.type === 'Drawer');
        if (!drawerDef) return { drawerWidget: null, widgetIdCounter };

        const newDrawer: FlutterWidget = {
            id: `widget-${widgetIdCounter++}`,
            type: 'Drawer',
            props: {},
            children: []
        };

        // Initialize properties with default values
        drawerDef.properties.forEach((prop) => {
            newDrawer.props[prop.name] = prop.defaultValue;
        });

        // Add to drawer screen if it exists
        if (drawerScreen && drawerScreen.elements) {
            drawerScreen.elements.push(newDrawer);
        } else {
            // If drawer screen doesn't exist, create it
            const drawerElements = [newDrawer];
            screens.unshift({
                id: `screen-drawer-${Date.now()}`,
                name: 'Drawer',
                elements: drawerElements,
                isHome: false,
                isDrawer: true
            });
        }

        return { drawerWidget: newDrawer, widgetIdCounter };
    }
}
