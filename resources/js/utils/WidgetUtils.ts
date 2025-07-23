import type { UnifiedElement } from '@/Data/PizarraUnificada';

/**
 * Utility class for widget-related operations
 */
export class WidgetUtils {
    /**
     * Creates a new widget with the specified properties
     */
    static createWidget(
        type: string,
        framework: 'flutter' | 'angular',
        availableWidgets: any[],
        position: { x: number, y: number }
    ): UnifiedElement {
        // Find the widget definition by type
        const widgetDefinition = availableWidgets.find(widget => widget.type === type);

        if (!widgetDefinition) {
            console.error(`Widget definition not found for type: ${type}`);
            return {
                id: `unified-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                type,
                framework,
                position,
                props: {},
                properties: {}
            };
        }

        // Create properties from widget definition
        const props: Record<string, any> = {};

        // Process each property from the widget definition
        (widgetDefinition.properties || []).forEach((prop: any) => {
            // Convert string function props to actual functions
            if (typeof prop.defaultValue === 'string' &&
                (prop.name === 'onChanged' || prop.name === 'onPressed' || prop.name.toLowerCase().includes('on'))) {
                // Convert string function to actual function
                props[prop.name] = this.convertStringToFunction(prop.defaultValue);
            } else {
                props[prop.name] = prop.defaultValue;
            }
        });

        // Create the unified element
        return {
            id: `unified-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type,
            framework,
            position,
            props,
            properties: {},
            component: widgetDefinition.component,
            category: widgetDefinition.category
        };
    }

    /**
     * Validates a widget against available widget definitions
     */
    static validateWidget(element: UnifiedElement, availableWidgets: any[]): boolean {
        // Find the widget definition by type
        const widgetDefinition = availableWidgets.find(widget => widget.type === element.type);

        if (!widgetDefinition) {
            console.error(`Widget definition not found for type: ${element.type}`);
            return false;
        }

        // Check if all required properties are present
        const requiredProps = (widgetDefinition.properties || [])
            .filter((prop: any) => prop.required)
            .map((prop: any) => prop.name);

        return requiredProps.every(propName =>
            element.props && propName in element.props
        );
    }

    /**
     * Duplicates a unified element
     */
    static duplicateWidget(element: UnifiedElement): UnifiedElement {
        // Clone the element and generate a new ID
        return {
            ...JSON.parse(JSON.stringify(element)),
            id: `unified-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            position: {
                x: element.position.x + 20,
                y: element.position.y + 20
            }
        };
    }

    /**
     * Converts a string representation of a function to an actual function
     * Example: "(value) {}" becomes (value) => {}
     */
    static convertStringToFunction(functionStr: string): Function {
        try {
            // Handle common function string patterns
            if (functionStr.includes('=>')) {
                // Arrow function syntax already exists
                return new Function('return ' + functionStr)();
            } else if (functionStr.match(/\([^)]*\)\s*\{/)) {
                // Classic function declaration: (param) { body }
                const params = functionStr.substring(
                    functionStr.indexOf('(') + 1,
                    functionStr.indexOf(')')
                ).trim();

                const body = functionStr.substring(
                    functionStr.indexOf('{') + 1,
                    functionStr.lastIndexOf('}')
                ).trim();

                // Create a proper arrow function
                return new Function(...params.split(','), `${body}`);
            } else {
                // Default fallback - create an empty function
                return () => {};
            }
        } catch (error) {
            console.error('Error converting string to function:', error);
            return () => {}; // Return empty function as fallback
        }
    }
}
