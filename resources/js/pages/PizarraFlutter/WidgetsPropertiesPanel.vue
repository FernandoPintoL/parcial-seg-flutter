<script setup lang="ts">
import ColorPicker from '@/components/ColorPicker.vue';
import { ref, watch } from 'vue';

const props = defineProps<{
    selectedWidget: any;
    availableWidgets: any[];
    updateWidgetProperty: (key: string, value: any) => void;
    updateColorProperty: (key: string, value: string) => void;
    getHexColor: (color: string) => string;
    getRgbColor: (color: string) => string;
    getHslColor: (color: string) => string;
}>();
// Copia local reactiva de las props del widget seleccionado
const localProps = ref({ ...props.selectedWidget?.props });

watch(
    () => props.selectedWidget,
    (newVal) => {
        localProps.value = { ...newVal?.props };

        // Debug: Log widget type and properties
        if (newVal) {
            console.log('Selected widget type:', newVal.type);
            console.log('Selected widget properties:', newVal.props);

            // Check if widget type exists in availableWidgets
            const widgetDef = props.availableWidgets.find((w: any) => w.type === newVal.type);
            console.log('Widget definition found:', widgetDef ? 'yes' : 'no');

            if (widgetDef) {
                // Check if each property exists in the widget definition
                Object.keys(newVal.props).forEach(key => {
                    const propDef = widgetDef.properties.find((p: any) => p.name === key);
                    console.log(`Property '${key}' definition found:`, propDef ? 'yes' : 'no', propDef ? `(type: ${propDef.type})` : '');
                });
            }
        }
    },
    { immediate: true, deep: true },
);

function emitUpdate(key: string | number, value: any) {
    localProps.value[key] = value;
    props.updateWidgetProperty(String(key), value);
}

function isString(val: unknown): boolean {
    return typeof val === 'string';
}

function isNumber(val: unknown): boolean {
    return typeof val === 'number';
}

function isBoolean(val: unknown): boolean {
    return typeof val === 'boolean';
}
</script>
<template>
    <div v-if="selectedWidget" class="w-80 overflow-y-auto rounded-md bg-gray-100 p-4">
        <h2 class="mb-4 text-lg font-semibold">Propiedades</h2>

        <div class="flex flex-col gap-4">
            <div v-for="(value, key) in localProps" :key="String(key)" class="flex flex-col gap-1">
                <label class="text-sm font-medium">{{ key }}</label>

                <!-- String input -->
                <input
                    v-if="
                        (isString(value) &&
                        !(
                            props.availableWidgets.find((w: any) => w.type === props.selectedWidget.type)?.properties.find((p: any) => p.name === key)?.type ===
                            'select'
                        )) ||
                        // Special case for Card widgets to ensure string properties are displayed correctly
                        (props.selectedWidget.type === 'Card' && ['title', 'subtitle', 'content', 'imageUrl', 'margin'].includes(key)) ||
                        (props.selectedWidget.type === 'CardText' && ['title', 'subtitle', 'content'].includes(key)) ||
                        (props.selectedWidget.type === 'ListCard' && ['title', 'subtitle', 'leading', 'trailing', 'imageUrl'].includes(key))
                    "
                    v-model="localProps[key]"
                    type="text"
                    class="rounded-md border px-3 py-2"
                    @change="emitUpdate(key, localProps[key])"
                />

                <!-- Number input -->
                <input
                    v-else-if="isNumber(value) ||
                        // Special case for Card widgets to ensure number properties are displayed correctly
                        (props.selectedWidget.type === 'Card' && ['elevation', 'borderRadius', 'width', 'height', 'imageHeight'].includes(key)) ||
                        (props.selectedWidget.type === 'CardText' && ['elevation', 'borderRadius', 'width', 'height'].includes(key)) ||
                        (props.selectedWidget.type === 'ListCard' && ['elevation', 'borderRadius', 'width', 'height', 'imageHeight'].includes(key))
                    "
                    v-model.number="localProps[key]"
                    type="number"
                    class="rounded-md border px-3 py-2"
                    @change="emitUpdate(key, localProps[key])"
                />

                <!-- Boolean input -->
                <div v-else-if="isBoolean(value) ||
                    // Special case for Card widgets to ensure boolean properties are displayed correctly
                    (props.selectedWidget.type === 'Card' && ['showImage', 'showDivider', 'showActions'].includes(key)) ||
                    (props.selectedWidget.type === 'CardText' && ['showImage', 'showDivider', 'showActions'].includes(key)) ||
                    (props.selectedWidget.type === 'ListCard' && ['showImage'].includes(key))
                " class="flex items-center">
                    <input :id="String(key)" v-model="localProps[key]" type="checkbox" class="mr-2" @change="emitUpdate(key, localProps[key])" />
                    <label :for="String(key)">{{ localProps[key] ? 'Sí' : 'No' }}</label>
                </div>

                <!-- Color input with @ckpack/vue-color -->
                <div
                    v-else-if="
                        props.availableWidgets.find((w: any) => w.type === props.selectedWidget.type)?.properties.find((p: any) => p.name === key)?.type ===
                        'color' ||
                        // Special case for Card widgets to ensure color properties are displayed correctly
                        (props.selectedWidget.type === 'Card' && key === 'color') ||
                        (props.selectedWidget.type === 'CardText' && key === 'color') ||
                        (props.selectedWidget.type === 'ListCard' && key === 'color')
                    "
                    class="flex flex-col gap-2"
                >
                    <ColorPicker v-model="localProps[key]" @change="props.updateColorProperty(String(key), $event)" />
                    <div class="grid grid-cols-3 gap-2 text-xs">
                        <div class="rounded border p-1 dark:border-gray-600">
                            <span class="font-semibold">HEX:</span>
                            {{ props.getHexColor(localProps[key]) }}
                        </div>
                        <div class="rounded border p-1 dark:border-gray-600">
                            <span class="font-semibold">RGB:</span>
                            {{ props.getRgbColor(localProps[key]) }}
                        </div>
                        <div class="rounded border p-1 dark:border-gray-600">
                            <span class="font-semibold">HSL:</span>
                            {{ props.getHslColor(localProps[key]) }}
                        </div>
                    </div>
                </div>

                <!-- Select input -->
                <select
                    v-else-if="
                        props.availableWidgets.find((w: any) => w.type === props.selectedWidget.type)?.properties.find((p: any) => p.name === key)?.type ===
                        'select'
                    "
                    v-model="localProps[key]"
                    class="rounded-md border px-3 py-2"
                    @change="emitUpdate(key, localProps[key])"
                >
                    <option
                        v-for="option in props.availableWidgets
                            .find((w: any) => w.type === props.selectedWidget.type)
                            ?.properties.find((p: any) => p.name === key)?.options"
                        :key="option"
                        :value="option"
                    >
                        {{ option }}
                    </option>
                </select>

                <!-- Array input -->
                <div v-else-if="Array.isArray(value) ||
                    // Special case for Card widgets to ensure array properties are displayed correctly
                    (props.selectedWidget.type === 'Card' && ['actionButtons'].includes(key))
                " class="flex flex-col gap-2">
                    <div v-for="(item, index) in value" :key="index" class="flex gap-2">
                        <input
                            v-model="localProps[key][index]"
                            type="text"
                            class="flex-1 rounded-md border px-3 py-2"
                            @change="emitUpdate(key, [...localProps[key]])"
                        />
                        <button
                            @click="
                                localProps[key].splice(index, 1);
                                emitUpdate(key, [...localProps[key]]);
                            "
                            class="rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600"
                        >
                            -
                        </button>
                    </div>
                    <button
                        @click="
                            localProps[String(key)].push('');
                            emitUpdate(String(key), [...localProps[String(key)]]);
                        "
                        class="rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                    >
                        + Agregar
                    </button>
                </div>

                <!-- Default fallback -->
                <input
                    v-else
                    v-model="localProps[key]"
                    type="text"
                    class="rounded-md border px-3 py-2"
                    @change="emitUpdate(key, localProps[key])"
                />
            </div>
        </div>
    </div>
</template>

<style scoped></style>
