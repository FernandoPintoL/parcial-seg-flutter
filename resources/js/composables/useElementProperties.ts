// composables/useElementProperties.ts
import { ref, computed, watch } from 'vue';
import type { UnifiedElement } from '@/Data/PizarraUnificada';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';

export interface PropertyDefinition {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'color' | 'select' | 'array' | 'object';
    label: string;
    defaultValue?: any;
    options?: any[];
    category: 'Básico' | 'Apariencia' | 'Layout' | 'Comportamiento' | 'Validación' | 'Otros';
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
}

export interface PropertyGroup {
    name: string;
    properties: PropertyDefinition[];
}

export interface UseElementPropertiesOptions {
    selectedElement: UnifiedElement | null;
    framework: 'flutter' | 'angular' | 'both';
    availableWidgets?: any[];
    onPropertyUpdate?: (property: string, value: any) => void;
    onElementUpdate?: (element: UnifiedElement) => void;
}

export function useElementProperties(options: UseElementPropertiesOptions) {
    // Reactive state
    const localProps = ref<Record<string, any>>({});
    const propertyGroups = ref<PropertyGroup[]>([]);

    // Get available widgets for current framework
    const availableWidgets = computed(() => {
        return options.availableWidgets || UnifiedWidgetService.getAvailableWidgets(options.framework);
    });

    // Get current widget definition
    const currentWidgetDefinition = computed(() => {
        if (!options.selectedElement) return null;
        return availableWidgets.value.find((w: any) => w.type === options.selectedElement?.type);
    });

    // Watch for changes in the selected element
    watch(
        () => options.selectedElement,
        (newElement) => {
            if (newElement) {
                localProps.value = { ...newElement.props };
                updatePropertyGroups();
            } else {
                localProps.value = {};
                propertyGroups.value = [];
            }
        },
        { immediate: true, deep: true }
    );

    // Update property groups based on current widget definition
    const updatePropertyGroups = () => {
        if (!currentWidgetDefinition.value) {
            propertyGroups.value = [];
            return;
        }

        const groups: Record<string, PropertyDefinition[]> = {
            'Básico': [],
            'Apariencia': [],
            'Layout': [],
            'Comportamiento': [],
            'Validación': [],
            'Otros': []
        };

        // Categorizar propiedades
        currentWidgetDefinition.value.properties?.forEach((prop: any) => {
            const propertyDef = createPropertyDefinition(prop);
            groups[propertyDef.category].push(propertyDef);
        });

        // Convertir a array y filtrar grupos vacíos
        propertyGroups.value = Object.entries(groups)
            .filter(([, props]) => props.length > 0)
            .map(([name, properties]) => ({ name, properties }));
    };

    // Create property definition from widget property
    const createPropertyDefinition = (prop: any): PropertyDefinition => {
        let category: PropertyDefinition['category'] = 'Otros';

        // Categorizar propiedades
        if (['text', 'label', 'title', 'subtitle', 'data', 'value', 'placeholder', 'hint'].includes(prop.name)) {
            category = 'Básico';
        } else if (['color', 'backgroundColor', 'textColor', 'borderColor', 'activeColor', 'elevation', 'borderRadius', 'opacity'].includes(prop.name)) {
            category = 'Apariencia';
        } else if (['width', 'height', 'padding', 'margin', 'alignment', 'mainAxisAlignment', 'crossAxisAlignment'].includes(prop.name)) {
            category = 'Layout';
        } else if (['disabled', 'enabled', 'readonly', 'onPressed', 'onChanged', 'onTap'].includes(prop.name)) {
            category = 'Comportamiento';
        } else if (['required', 'validator', 'maxLength', 'minLength', 'pattern'].includes(prop.name)) {
            category = 'Validación';
        }

        return {
            name: prop.name,
            type: determinePropertyType(prop),
            label: prop.label || prop.name,
            defaultValue: prop.defaultValue,
            options: prop.options,
            category,
            required: prop.required,
            min: prop.min,
            max: prop.max,
            step: prop.step
        };
    };

    // Determine property type based on property definition
    const determinePropertyType = (prop: any): PropertyDefinition['type'] => {
        if (prop.type) return prop.type;
        
        if (prop.options && Array.isArray(prop.options)) {
            return 'select';
        }
        
        if (prop.name.includes('color') || prop.name.includes('Color')) {
            return 'color';
        }
        
        if (typeof prop.defaultValue === 'boolean') {
            return 'boolean';
        }
        
        if (typeof prop.defaultValue === 'number') {
            return 'number';
        }
        
        if (Array.isArray(prop.defaultValue)) {
            return 'array';
        }
        
        if (typeof prop.defaultValue === 'object' && prop.defaultValue !== null) {
            return 'object';
        }
        
        return 'text';
    };

    // Update property value
    const updateProperty = (propertyName: string, value: any) => {
        localProps.value[propertyName] = value;

        if (options.selectedElement) {
            const updatedElement = UnifiedWidgetService.updateElementProperties(
                options.selectedElement,
                { [propertyName]: value }
            );
            
            options.onElementUpdate?.(updatedElement);
            options.onPropertyUpdate?.(propertyName, value);
        }
    };

    // Update nested property (e.g., size.width, position.x)
    const updateNestedProperty = (propertyPath: string, value: any) => {
        const [parentKey, childKey] = propertyPath.split('.');
        
        if (!options.selectedElement) return;

        const updatedElement = { ...options.selectedElement };

        if (parentKey === 'position') {
            updatedElement.position = {
                x: childKey === 'x' ? value : (updatedElement.position?.x ?? 0),
                y: childKey === 'y' ? value : (updatedElement.position?.y ?? 0)
            };
        } else if (parentKey === 'size') {
            updatedElement.size = {
                width: childKey === 'width' ? value : (updatedElement.size?.width ?? 100),
                height: childKey === 'height' ? value : (updatedElement.size?.height ?? 100)
            };
        }

        options.onElementUpdate?.(updatedElement);
        options.onPropertyUpdate?.(propertyPath, value);
    };

    // Handle array property updates
    const updateArrayProperty = (propertyName: string, index: number, field: string, value: any) => {
        const currentArray = localProps.value[propertyName] || [];
        const updatedArray = [...currentArray];

        if (updatedArray[index]) {
            updatedArray[index] = {
                ...updatedArray[index],
                [field]: value
            };
        }

        updateProperty(propertyName, updatedArray);
    };

    // Add new item to array property
    const addArrayItem = (propertyName: string) => {
        const currentArray = localProps.value[propertyName] || [];
        const propDef = getPropertyDefinition(propertyName);

        let newItem: any = {};
        if (propDef?.defaultValue && Array.isArray(propDef.defaultValue) && propDef.defaultValue.length > 0) {
            newItem = { ...propDef.defaultValue[0] };
            newItem.id = Date.now().toString();
        } else {
            newItem = { id: Date.now().toString(), label: 'New Item', value: false };
        }

        updateProperty(propertyName, [...currentArray, newItem]);
    };

    // Remove item from array property
    const removeArrayItem = (propertyName: string, index: number) => {
        const currentArray = localProps.value[propertyName] || [];
        const updatedArray = currentArray.filter((_: any, i: number) => i !== index);
        updateProperty(propertyName, updatedArray);
    };

    // Get property definition from widget definition
    const getPropertyDefinition = (propertyName: string): PropertyDefinition | null => {
        if (!currentWidgetDefinition.value) return null;
        return propertyGroups.value
            .flatMap(group => group.properties)
            .find(prop => prop.name === propertyName) || null;
    };

    // Format property display name
    const formatPropertyName = (propertyName: string): string => {
        return propertyName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    // Get property value with fallback
    const getPropertyValue = (propertyName: string): any => {
        return localProps.value[propertyName] ?? getPropertyDefinition(propertyName)?.defaultValue;
    };

    // Validate property value
    const validateProperty = (propertyName: string, value: any): boolean => {
        const propDef = getPropertyDefinition(propertyName);
        if (!propDef) return true;

        if (propDef.required && (value === null || value === undefined || value === '')) {
            return false;
        }

        if (propDef.type === 'number') {
            const numValue = Number(value);
            if (isNaN(numValue)) return false;
            if (propDef.min !== undefined && numValue < propDef.min) return false;
            if (propDef.max !== undefined && numValue > propDef.max) return false;
        }

        return true;
    };

    // Reset properties to defaults
    const resetToDefaults = () => {
        if (!options.selectedElement) return;

        const defaultProps: Record<string, any> = {};
        propertyGroups.value.forEach(group => {
            group.properties.forEach(prop => {
                if (prop.defaultValue !== undefined) {
                    defaultProps[prop.name] = prop.defaultValue;
                }
            });
        });

        localProps.value = { ...defaultProps };
        
        const updatedElement = UnifiedWidgetService.updateElementProperties(
            options.selectedElement,
            defaultProps
        );
        
        options.onElementUpdate?.(updatedElement);
    };

    return {
        // State
        localProps,
        propertyGroups,
        currentWidgetDefinition,
        availableWidgets,

        // Methods
        updateProperty,
        updateNestedProperty,
        updateArrayProperty,
        addArrayItem,
        removeArrayItem,
        getPropertyDefinition,
        formatPropertyName,
        getPropertyValue,
        validateProperty,
        resetToDefaults,
        updatePropertyGroups
    };
} 