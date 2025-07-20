<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ColorPicker from '@/components/ColorPicker.vue';
import type { UnifiedElement } from '@/Data/PizarraUnificada';
import { UnifiedWidgetService } from '@/services/UnifiedWidgetService';

const props = defineProps<{
    selectedElement: UnifiedElement | null;
    framework: 'flutter' | 'angular' | 'both';
    availableWidgets?: any[];
}>();

const emit = defineEmits(['update-property', 'update-element', 'delete-element']);

// Local reactive copy of the selected element's properties
const localProps = ref<Record<string, any>>({});

// Function to handle element deletion
function handleDeleteElement() {
    if (props.selectedElement) {
        console.log('🗑️ Delete element requested from properties panel:', props.selectedElement.id);
        emit('delete-element', props.selectedElement);
    }
}

// Get available widgets for current framework
const availableWidgets = computed(() => {
    // Use passed availableWidgets prop if available, otherwise get from service
    return props.availableWidgets || UnifiedWidgetService.getAvailableWidgets(props.framework);
});

// Get current widget definition
const currentWidgetDefinition = computed(() => {
    if (!props.selectedElement) return null;
    return availableWidgets.value.find((w: any) => w.type === props.selectedElement?.type);
});

// Get grouped properties by category
const groupedProperties = computed(() => {
    if (!currentWidgetDefinition.value) return {};

    const groups: Record<string, any[]> = {
        'Básico': [],
        'Apariencia': [],
        'Layout': [],
        'Comportamiento': [],
        'Validación': [],
        'Otros': []
    };

    currentWidgetDefinition.value.properties.forEach((prop: any) => {
        let category = 'Otros';

        // Categorize properties
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

        groups[category].push(prop);
    });

    // Filter out empty groups
    return Object.fromEntries(
        Object.entries(groups).filter(([, props]) => props.length > 0)
    );
});

// Watch for changes in the selected element
watch(
    () => props.selectedElement,
    (newVal) => {
        if (newVal) {
            localProps.value = { ...newVal.props };
        } else {
            localProps.value = {};
        }
    },
    { immediate: true, deep: true }
);

// Emit property update
function emitUpdate(key: string, value: any) {
    localProps.value[key] = value;

    if (props.selectedElement) {
        const updatedElement = UnifiedWidgetService.updateElementProperties(
            props.selectedElement,
            { [key]: value }
        );
        emit('update-element', updatedElement);
    }
}

// Handle array property updates
// function updateArrayProperty(propertyName: string, index: number, field: string, value: any) {
//     const currentArray = localProps.value[propertyName] || [];
//     const updatedArray = [...currentArray];

//     if (updatedArray[index]) {
//         updatedArray[index] = {
//             ...updatedArray[index],
//             [field]: value
//         };
//     }

//     emitUpdate(propertyName, updatedArray);
// }

// Add new item to array property
function addArrayItem(propertyName: string) {
    const currentArray = localProps.value[propertyName] || [];
    const propDef = getPropertyDefinition(propertyName);

    let newItem: any = {};
    if (propDef?.defaultValue && Array.isArray(propDef.defaultValue) && propDef.defaultValue.length > 0) {
        newItem = { ...propDef.defaultValue[0] };
        newItem.id = Date.now().toString();
    } else {
        newItem = { id: Date.now().toString(), label: 'New Item', value: false };
    }

    emitUpdate(propertyName, [...currentArray, newItem]);
}

// Remove item from array property
// function removeArrayItem(propertyName: string, index: number) {
//     const currentArray = localProps.value[propertyName] || [];
//     const updatedArray = currentArray.filter((_: any, i: number) => i !== index);
//     emitUpdate(propertyName, updatedArray);
// }

// Get property definition from widget definition
function getPropertyDefinition(propertyName: string) {
    if (!currentWidgetDefinition.value) return null;
    return currentWidgetDefinition.value.properties?.find((p: any) => p.name === propertyName);
}

// Format property display name
function formatPropertyName(name: string): string {
    const nameMap: Record<string, string> = {
        'backgroundColor': 'Color de Fondo',
        'textColor': 'Color de Texto',
        'borderColor': 'Color de Borde',
        'activeColor': 'Color Activo',
        'borderRadius': 'Radio de Borde',
        'borderWidth': 'Ancho de Borde',
        'fontSize': 'Tamaño de Fuente',
        'fontWeight': 'Peso de Fuente',
        'textAlign': 'Alineación de Texto',
        'mainAxisAlignment': 'Alineación Principal',
        'crossAxisAlignment': 'Alineación Cruzada',
        'keyboardType': 'Tipo de Teclado',
        'obscureText': 'Texto Oculto',
        'maxLength': 'Longitud Máxima',
        'minLength': 'Longitud Mínima',
        'prefixIcon': 'Icono Prefijo',
        'suffixIcon': 'Icono Sufijo',
        'showHeader': 'Mostrar Encabezado',
        'showImage': 'Mostrar Imagen',
        'showActions': 'Mostrar Acciones',
        'showFooter': 'Mostrar Pie',
        'fullWidth': 'Ancho Completo',
        'iconPosition': 'Posición del Icono',
    };

    return nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

// Check if color is valid hex
function isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Convert color to hex if needed
function ensureHexColor(color: string | undefined | null): string {
    // Handle undefined, null, or empty values
    if (!color || typeof color !== 'string') {
        return '#000000';
    }

    if (isValidHexColor(color)) return color;
    if (color === 'transparent') return '#00000000';
    if (color.startsWith('rgb')) {
        // Simple RGB to hex conversion
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
            const r = parseInt(match[0]).toString(16).padStart(2, '0');
            const g = parseInt(match[1]).toString(16).padStart(2, '0');
            const b = parseInt(match[2]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
    }
    return '#000000';
}

// Get property type from definition or infer from value
function getPropertyType(propertyName: string, value: any): string {
    const propDef = getPropertyDefinition(propertyName);
    if (propDef && propDef.type) return propDef.type;

    // Infer type from value
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    return 'string';
}

// Get property options for select inputs
function getPropertyOptions(propertyName: string): string[] {
    const propDef = getPropertyDefinition(propertyName);
    return propDef?.options || [];
}

// Helper functions for color formatting
function getHexColor(color: string): string {
    return ensureHexColor(color);
}

function getRgbColor(color: string): string {
    const hex = ensureHexColor(color);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function getHslColor(color: string): string {
    const hex = ensureHexColor(color);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
        s = l > 0.5 ? diff / (2 - sum) : diff / sum;

        switch (max) {
            case r: h = ((g - b) / diff) + (g < b ? 6 : 0); break;
            case g: h = (b - r) / diff + 2; break;
            case b: h = (r - g) / diff + 4; break;
        }
        h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}
</script>

<template>
    <div v-if="selectedElement"
        class="w-80 overflow-y-auto rounded-md bg-gray-100 p-4 dark:bg-gray-700 dark:text-white">
        <h2 class="mb-4 text-lg font-semibold">
            {{ selectedElement.type }} Propiedades
            <span v-if="selectedElement.framework !== 'both'" class="ml-2 text-xs px-2 py-1 rounded" :class="{
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': selectedElement.framework === 'flutter',
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': selectedElement.framework === 'angular'
            }">
                {{ selectedElement.framework }}
            </span>
        </h2>

        <!-- Botón de eliminar elemento -->
        <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="material-icons text-red-500 mr-2">warning</span>
                    <span class="text-sm text-red-700 dark:text-red-300">Acción destructiva</span>
                </div>
                <button 
                    @click="handleDeleteElement"
                    class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors duration-200 flex items-center"
                    title="Eliminar elemento">
                    <span class="material-icons text-sm mr-1">delete</span>
                    Eliminar
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-4">
            <div v-for="(props, category) in groupedProperties" :key="category" class="flex flex-col gap-2">
                <h3 class="text-md font-semibold text-gray-800 dark:text-gray-200">{{ category }}</h3>
                <div v-for="(prop) in props" :key="prop.name" class="flex flex-col gap-1">
                    <label class="text-sm font-medium">{{ formatPropertyName(prop.name) }}</label>

                    <!-- String input -->
                    <input
                        v-if="getPropertyType(prop.name, localProps[prop.name]) === 'string' && getPropertyType(prop.name, localProps[prop.name]) !== 'select' && getPropertyType(prop.name, localProps[prop.name]) !== 'color'"
                        v-model="localProps[prop.name]" type="text"
                        class="rounded-md border px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        @change="emitUpdate(prop.name, localProps[prop.name])" />

                    <!-- Number input -->
                    <input v-else-if="getPropertyType(prop.name, localProps[prop.name]) === 'number'"
                        v-model.number="localProps[prop.name]" type="number"
                        class="rounded-md border px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        @change="emitUpdate(prop.name, localProps[prop.name])" />

                    <!-- Boolean input -->
                    <div v-else-if="getPropertyType(prop.name, localProps[prop.name]) === 'boolean'"
                        class="flex items-center">
                        <input :id="String(prop.name)" v-model="localProps[prop.name]" type="checkbox" class="mr-2"
                            @change="emitUpdate(prop.name, localProps[prop.name])" />
                        <label :for="String(prop.name)">{{ localProps[prop.name] ? 'Yes' : 'No' }}</label>
                    </div>

                    <!-- Color input -->
                    <div v-else-if="getPropertyType(prop.name, localProps[prop.name]) === 'color'"
                        class="flex flex-col gap-2">
                        <ColorPicker :model-value="ensureHexColor(localProps[prop.name])"
                            @update:model-value="emitUpdate(prop.name, $event)"
                            @change="emitUpdate(prop.name, $event)" />
                        <div class="grid grid-cols-3 gap-2 text-xs">
                            <div class="rounded border p-1 dark:border-gray-600">
                                <span class="font-semibold">HEX:</span>
                                {{ getHexColor(localProps[prop.name]) }}
                            </div>
                            <div class="rounded border p-1 dark:border-gray-600">
                                <span class="font-semibold">RGB:</span>
                                {{ getRgbColor(localProps[prop.name]) }}
                            </div>
                            <div class="rounded border p-1 dark:border-gray-600">
                                <span class="font-semibold">HSL:</span>
                                {{ getHslColor(localProps[prop.name]) }}
                            </div>
                        </div>
                    </div>

                    <!-- Select input -->
                    <select v-else-if="getPropertyType(prop.name, localProps[prop.name]) === 'select'"
                        v-model="localProps[prop.name]"
                        class="rounded-md border px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        @change="emitUpdate(prop.name, localProps[prop.name])">
                        <option v-for="option in getPropertyOptions(prop.name)" :key="option" :value="option">
                            {{ option }}
                        </option>
                    </select>

                    <!-- Array input -->
                    <div v-else-if="Array.isArray(localProps[prop.name]) && localProps[prop.name].length > 0"
                        class="flex flex-col gap-2">
                        <div v-for="(item, index) in localProps[prop.name]" :key="index" class="flex gap-2">
                            <input v-model="localProps[prop.name][index]" type="text"
                                class="flex-1 rounded-md border px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                @change="emitUpdate(prop.name, [...localProps[prop.name]])" />
                            <button @click="
                                localProps[prop.name].splice(index, 1);
                            emitUpdate(prop.name, [...localProps[prop.name]]);
                            " class="rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600">
                                -
                            </button>
                        </div>
                        <button @click="addArrayItem(prop.name)"
                            class="rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600">
                            + Add Item
                        </button>
                    </div>

                    <!-- Default fallback -->
                    <input v-else v-model="localProps[prop.name]" type="text"
                        class="rounded-md border px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        @change="emitUpdate(prop.name, localProps[prop.name])" />
                </div>
            </div>
        </div>
    </div>
    <div v-else class="w-80 p-4 text-center text-gray-500 dark:text-gray-400">
        <p>Select an element to edit its properties</p>
    </div>
</template>

<style scoped>
.properties-panel {
    width: 320px;
    max-width: 100vw;
    min-width: 240px;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 100vh;
    background: white;
    border-left: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}
.property-item {
    word-break: break-word;
    min-width: 0;
}
input, select, textarea {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
}
</style>
