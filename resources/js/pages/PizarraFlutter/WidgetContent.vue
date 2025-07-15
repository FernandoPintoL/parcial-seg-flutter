<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import AppBarFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/AppBarFlutter.vue';
import ScaffoldFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/ScaffoldFlutter.vue';
import InputFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/InputFlutter.vue';
import TableFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/TableFlutter.vue';
import ListCardFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/ListCardFlutter.vue';
import ElevatedButtonFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/ElevatedButtonFlutter.vue';
import CheckboxFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/CheckboxFlutter.vue';
import RadioButtonFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/RadioButtonFlutter.vue';
import GroupRadioButtonFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/GroupRadioButtonFlutter.vue';
import GroupCheckBoxFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/GroupCheckBoxFlutter.vue';
import SwitchFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/SwitchFlutter.vue';
import SwitchListFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/SwitchListFlutter.vue';
import DrawerFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/DrawerFlutter.vue';
import DropdownFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/DropdownFlutter.vue';
import SliderFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/SliderFlutter.vue';
import CardFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/CardFlutter.vue';
import ListTitleFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/ListTitleFlutter.vue';
import ImageFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/ImageFlutter.vue';
import IconFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/IconFlutter.vue';
import LayoutsFlutter from '@/pages/PizarraFlutter/WidgetsFlutter/LayoutsFlutter.vue';

// Definición de tipos
interface ElementProps {
    [key: string]: any;
}

interface Element {
    id: string | number;
    type: string;
    props: ElementProps;
    children?: Element[];
}

// Define props utilizando la sintaxis de script setup
defineProps({
    element: {
        type: Object as () => Element,
        required: true
    },
    inputWidgets: {
        type: Array,
        default: () => []
    },
    layoutWidgets: {
        type: Array,
        default: () => []
    },
    displayWidgets: {
        type: Array,
        default: () => []
    },
    showAddChildMenu: {
        type: [String, Number, null],
        default: null
    },
    activeAddChildCategory: {
        type: Number,
        default: 0
    }
});

// Define emits utilizando la sintaxis de script setup
const emit = defineEmits([
    'screen-selected',
    'update:showAddChildMenu',
    'update:activeAddChildCategory',
    'add-child-widget',
    'handle-drag-enter',
    'handle-drag-leave',
    'handle-drop',
    'remove-widget',
    'select-widget'
]);

// Function to emit remove-widget event
const removeWidget = (widget: Element) => {
    emit('remove-widget', widget);
};

// Track selected layouts for the LayoutsFlutter component
const selectedLayouts = ref<string[]>([]);

// Function to handle layout selection
const selectLayout = (layout: any) => {
    // Here you would typically emit an event to select the widget in the parent component
    // For now, we'll just add it to the selectedLayouts array
    if (!selectedLayouts.value.includes(layout.id)) {
        selectedLayouts.value.push(layout.id);
    }

    // Emit an event to select the widget in the parent component
    emit('select-widget', layout.id);
};

// Function to handle layout removal
const removeLayout = (layout: any) => {
    // Remove the layout from the selectedLayouts array
    selectedLayouts.value = selectedLayouts.value.filter(id => id !== layout.id);

    // Emit an event to remove the widget in the parent component
    emit('remove-widget', { id: layout.id });
};

// Function to get color for a layout type
const getLayoutColor = (layoutType: string): string => {
    // Define colors for different layout types
    const layoutColors: Record<string, string> = {
        'Row': '#2196F3',      // Blue
        'Column': '#4CAF50',   // Green
        'Center': '#FF9800',   // Orange
        'SizedBox': '#795548', // Brown
        'Padding': '#607D8B',  // Blue Grey
        'ScrollChildren': '#9C27B0', // Purple
        'SafeArea': '#E91E63', // Pink
        'Form': '#3F51B5',     // Indigo
    };

    // Return the color for the layout type, or a default color if not found
    return layoutColors[layoutType] || '#9E9E9E'; // Default to grey
};

// Función para obtener el componente correspondiente al tipo de widget
const getWidgetComponent = (type: string) => {
    const componentMap : Record<string, any> = {
        'Radio': RadioButtonFlutter,
        'Switch': SwitchFlutter,
        'RadioListTile': GroupRadioButtonFlutter,
        'CheckboxListTile': GroupCheckBoxFlutter,
        // 'SwitchListTile': SwitchListFlutter,
        // 'Drawer': DrawerFlutter,
        // 'Select': SelectFlutter,
        'DropdownButton': DropdownFlutter,
        'Image': ImageFlutter,
        'Icon': IconFlutter,
    };

    return componentMap[type] || 'div';
};

// Función para procesar las propiedades y convertir strings de eventos en funciones
const processProps = (props: ElementProps): ElementProps => {
    const processedProps: ElementProps = {};

    for (const [key, value] of Object.entries(props)) {
        // Caso especial para appBar: si es un string, convertirlo a un objeto
        if (key === 'appBar' && typeof value === 'string') {
            // Extraer el título del AppBar si está presente
            let title = 'AppBar';
            const titleMatch = value.match(/title:\s*Text\("([^"]*)"\)/);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1];
            }

            // Crear un objeto AppBar con valores por defecto
            processedProps[key] = {
                title: title,
                backgroundColor: '#2196F3',
                elevation: 4,
                foregroundColor: '#FFFFFF',
                centerTitle: false,
                actions: []
            };
        }
        // Caso especial para bottomNavigationBar: si es un string, convertirlo a un objeto
        else if (key === 'bottomNavigationBar' && typeof value === 'string') {
            // Crear un objeto BottomNavigationBar con valores por defecto
            processedProps[key] = {
                backgroundColor: '#FFFFFF',
                selectedItemColor: '#2196F3',
                unselectedItemColor: '#757575',
                items: [
                    { icon: 'home', label: 'Home' },
                    { icon: 'search', label: 'Search' },
                    { icon: 'favorite', label: 'Favorites' },
                    { icon: 'settings', label: 'Settings' }
                ],
                currentIndex: 0
            };
        }
        // Caso especial para child: si es un string que parece un Text widget, extraer el texto
        else if (key === 'child' && typeof value === 'string') {
            // Extraer el texto del Text widget si está presente
            const textMatch = value.match(/Text\("([^"]*)"\)/);
            if (textMatch && textMatch[1]) {
                // Añadir el texto como label para que sea accesible para ElevatedButtonFlutter
                processedProps['label'] = textMatch[1];
            }

            // Mantener el valor original para child
            processedProps[key] = value;
        }
        // Si la propiedad es un string que parece una función (como "onChanged", "onPressed", etc.)
        // y el valor es un string que parece una definición de función
        else if (
            (key.startsWith('on') || key === 'validator') &&
            typeof value === 'string' &&
            value.includes('(') &&
            value.includes(')')
        ) {
            // Crear una función real a partir del string
            try {
                // Extraer los parámetros y el cuerpo de la función
                const paramMatch = value.match(/\((.*?)\)/);
                const params = paramMatch ? paramMatch[1] : '';

                // Crear una nueva función usando Function constructor
                processedProps[key] = new Function(params, '/* Event handler */');
            } catch (e) {
                console.error(`Error creating function from string for ${key}:`, e);
                processedProps[key] = () => {}; // Fallback a una función vacía
            }
        } else {
            // Mantener el valor original para otras propiedades
            processedProps[key] = value;
        }
    }

    return processedProps;
};
</script>

<template>
    <div class="widget-content">
        <div class="absolute top-0 right-0 z-10">
            <button @click.stop="removeWidget(element)" class="widget-remove-btn">
                ×
            </button>
        </div>
        <!-- Scaffold Widget -->
<!--        <ScaffoldFlutter v-if="element.type === 'Scaffold'"
                         v-bind="processProps(element.props)"
                         @screen-selected="$emit('screen-selected', $event)"
        />-->

        <!-- AppBar Widget -->
        <AppBarFlutter v-if="element.type === 'AppBar' || element.type === 'AppBarFlutter'"
                       v-bind="processProps(element.props)"
        />

        <!-- Text Widget -->
        <div v-else-if="element.type === 'Text'"
             class="flutter-text"
             :style="{
                fontSize: element.props.fontSize || '16px',
                fontWeight: element.props.fontWeight || 'normal',
                color: element.props.color || '#000000',
                textAlign: element.props.textAlign || 'left',
             }"
        >
            {{ element.props.data || 'Text' }}
        </div>

        <!-- TextField Widget -->
        <InputFlutter v-else-if="element.type === 'TextField' || element.type === 'TextFormField'"
                      v-bind="processProps(element.props)"
        />

        <!-- DataTable Widget -->
        <TableFlutter
            v-else-if="element.type === 'DataTable' || element.type === 'TableFlutter' || element.type === 'TableList' || element.type === 'Table'"
            v-bind="processProps(element.props)"
        />

        <!-- CardText Widget -->
        <ListCardFlutter
            v-else-if="element.type === 'CardText'"
            v-bind="processProps(element.props)"
        />

        <!-- ElevatedButton Widget -->
        <ElevatedButtonFlutter v-else-if="element.type === 'ElevatedButtonFlutter' || element.type === 'ElevatedButton'"
                               v-bind="processProps(element.props)"
                               :label="element.props.label || 'Elevated Button'"
        />
        <!-- Select Widget -->
        <DropdownFlutter v-else-if="element.type === 'Select' || element.type === 'DropdownButton'"
                         v-bind="processProps(element.props)"
                         :options="element.props.options || []"
                         :value="element.props.value"
                         :label="element.props.label || 'Select Option'"/>

        <!-- Checkbox Widget -->
        <CheckboxFlutter v-else-if="element.type === 'Checkbox'"
                         v-bind="processProps(element.props)"
                         :label="element.props.label || 'Checkbox'"
        />
        <!-- RadioButton Widget -->
        <RadioButtonFlutter v-else-if="element.type === 'Radio'"
                            v-bind="processProps(element.props)"
                            :value="element.props.value"
                            :label="element.props.label || 'Radio'"
        />
        <!-- Importar Switch -->
        <SwitchFlutter v-else-if="element.type === 'Switch'"
                       v-bind="processProps(element.props)"
                       :label="element.props.label || 'Switch'"/>
        <!-- Importar SwitchListFlutter -->
        <SwitchListFlutter v-else-if="element.type === 'SwitchListTile'"
                           v-bind="processProps(element.props)"
                           :label="element.props.label || 'Switch List'"/>

        <!-- Importar GroupRadioButtonFlutter -->
        <GroupRadioButtonFlutter v-else-if="element.type === 'RadioListTile'"
                                    v-bind="processProps(element.props)"
                                    :options="element.props.items || []"
                                    :modelValue="element.props.value"
                                    :activeColor="element.props.activeColor || '#2196F3'"
                                    :size="element.props.size || 24"
                                    :orientation="element.props.orientation || 'vertical'"
                                    :spacing="element.props.spacing || 8"
                                    :disabled="element.props.disabled || false"/>
        <!-- Importar SliderFlutter -->
        <SliderFlutter v-else-if="element.type === 'Slider'"
                        v-bind="processProps(element.props)"
                        :min="element.props.min || 0"
                        :max="element.props.max || 100"
                        :value="element.props.value || 50"/>
        <!-- Importar CardFlutter -->
        <CardFlutter v-else-if="element.type === 'Card'"
                        v-bind="processProps(element.props)"
                        :title="element.props.title || 'Card Title'"
                        :content="element.props.content || 'Card Content'"/>
        <!-- Importar ListCardFlutter -->
        <ListCardFlutter v-else-if="element.type === 'ListCard'"
                         v-bind="processProps(element.props)"
                         :items="element.props.items || []"
                         :title="element.props.title || 'List Card'"/>
        <!-- Importar ListTitleFlutter -->
        <ListTitleFlutter v-else-if="element.type === 'ListTitle'"
                         v-bind="processProps(element.props)"
                         :title="element.props.title || 'List Title'"
                         :subtitle="element.props.subtitle || ''"
                         :leadingIcon="element.props.leadingIcon || ''"
                         :trailingIcon="element.props.trailingIcon || ''"
                         :trailingIconColor="element.props.trailingIconColor || '#000000'"/>
        <!-- Importar ImagenFlutter -->
        <ImageFlutter v-else-if="element.type === 'Image'"
                      v-bind="processProps(element.props)"
                      :src="element.props.src || ''"
                      :alt="element.props.alt || 'Image'"
                      :width="element.props.width || '100%'"
                      :height="element.props.height || 'auto'"
                      :borderRadius="element.props.borderRadius || 0"
                      :borderColor="element.props.borderColor || 'transparent'"
                      :borderWidth="element.props.borderWidth || 0"
                      :opacity="element.props.opacity || 1.0"
                      :showErrorPlaceholder="element.props.showErrorPlaceholder || false"/>
        <!-- Importar IconFlutter -->
        <IconFlutter v-else-if="element.type === 'Icon'"
                     v-bind="processProps(element.props)"
                     :name="element.props.name || 'star'"
                     :color="element.props.color || '#000000'"
                     :size="element.props.size || 24"
                     :opacity="element.props.opacity || 1.0"
                     :disabled="element.props.disabled || false"
                     :iconSet="element.props.iconSet || 'material'"
                     :rotate="element.props.rotate || 0"
                     :filled="element.props.filled || true"
                     :shadow="element.props.shadow || 'none'"/>
        <!-- Drawer Widget -->
        <div v-else-if="element.type === 'Drawer'" class="drawer-wrapper h-full" style="height: 100vh;">
            <DrawerFlutter
                class="h-full"
                v-bind="processProps(element.props)"
                :screens="element.props.screens || []"
                :currentScreenIndex="element.props.currentScreenIndex || 0"
                @screen-selected="$emit('screen-selected', $event)"
            />
        </div>

        <!-- Contenedor para widgets de tipo Container -->
<!--        <div v-else-if="element.type === 'Container'"
             class="flutter-container"
             :style="{
                backgroundColor: element.props.color || 'transparent',
                padding: element.props.padding || '0',
                margin: element.props.margin || '0',
                border: element.props.border || 'none',
                borderRadius: element.props.borderRadius ? `${element.props.borderRadius}px` : '0',
                width: element.props.width ? `${element.props.width}px` : 'auto',
                height: element.props.height ? `${element.props.height}px` : 'auto',
                display: 'flex',
                flexDirection: element.props.flexDirection || 'column',
                justifyContent: element.props.justifyContent || 'flex-start',
                alignItems: element.props.alignItems || 'flex-start',
             }"
        >
            &lt;!&ndash; Renderizar componentes hijos si hay alguno &ndash;&gt;
            <template v-if="element.children && element.children.length">
                <widget-content
                    v-for="child in element.children"
                    :key="child.id"
                    :element="child"
                    :inputWidgets="inputWidgets"
                    :layoutWidgets="layoutWidgets"
                    :displayWidgets="displayWidgets"
                    :showAddChildMenu="showAddChildMenu"
                    :activeAddChildCategory="activeAddChildCategory"
                    @update:showAddChildMenu="$emit('update:showAddChildMenu', $event)"
                    @update:activeAddChildCategory="$emit('update:activeAddChildCategory', $event)"
                    @add-child-widget="$emit('add-child-widget', $event)"
                    @handle-drag-enter="$emit('handle-drag-enter', $event)"
                    @handle-drag-leave="$emit('handle-drag-leave', $event)"
                    @handle-drop="$emit('handle-drop', $event)"
                    @remove-widget="$emit('remove-widget', $event)"
                />
            </template>
        </div>-->

        <!-- Layout widgets (except Container which has its own handling) -->
<!--
        <div v-else-if="['Row', 'Column', 'Center', 'SizedBox', 'Padding', 'ScrollChildren', 'SafeArea', 'Form'].includes(element.type)"
             class="layout-widget-container"
             :class="`layout-${element.type.toLowerCase()}`"
        >
            &lt;!&ndash; Use LayoutsFlutter component to display layout tags &ndash;&gt;
            <LayoutsFlutter
                :layouts="[{ id: element.type.toLowerCase(), name: element.type, color: getLayoutColor(element.type) }]"
                :selectedLayouts="selectedLayouts"
                @select-layout="selectLayout"
                @remove-layout="removeLayout"
            />

            &lt;!&ndash; Renderizar componentes hijos si hay alguno &ndash;&gt;
            <div class="layout-widget-children">
                <template v-if="element.children && element.children.length">
                    <widget-content
                        v-for="child in element.children"
                        :key="child.id"
                        :element="child"
                        :inputWidgets="inputWidgets"
                        :layoutWidgets="layoutWidgets"
                        :displayWidgets="displayWidgets"
                        :showAddChildMenu="showAddChildMenu"
                        :activeAddChildCategory="activeAddChildCategory"
                        @update:showAddChildMenu="$emit('update:showAddChildMenu', $event)"
                        @update:activeAddChildCategory="$emit('update:activeAddChildCategory', $event)"
                        @add-child-widget="$emit('add-child-widget', $event)"
                        @handle-drag-enter="$emit('handle-drag-enter', $event)"
                        @handle-drag-leave="$emit('handle-drag-leave', $event)"
                        @handle-drop="$emit('handle-drop', $event)"
                        @remove-widget="$emit('remove-widget', $event)"
                    />
                </template>
                <div v-else class="layout-widget-empty">
                    Drop widgets here
                </div>
            </div>
        </div>
-->

        <!-- Otros widgets que usan componentes dinámicos -->
        <component
            v-else
            :is="getWidgetComponent(element.type)"
            v-bind="processProps(element.props)"
        />
    </div>
</template>

<style scoped>
.widget-content {
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
}

.flutter-text {
    font-family: 'Roboto', sans-serif;
}

.flutter-container {
    min-height: 20px;
    min-width: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.drawer-wrapper {
    position: relative;
    width: 100%;
    height: 400px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}

.layout-widget-container {
    position: relative;
    min-height: 50px;
    width: 100%;
    border: 1px dashed #2196F3;
    border-radius: 4px;
    padding: 24px 8px 8px;
    margin: 4px 0;
    background-color: rgba(33, 150, 243, 0.05);
}

.layout-widget-label {
    position: absolute;
    top: 0;
    left: 0;
    background-color: #2196F3;
    color: white;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 0 0 4px 0;
    z-index: 1;
}

.layout-widget-children {
    width: 100%;
    min-height: 30px;
}

.layout-widget-empty {
    width: 100%;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9e9e9e;
    font-style: italic;
    font-size: 14px;
    border: 1px dotted #e0e0e0;
    border-radius: 4px;
}

/* Specific styles for different layout widgets */
.layout-row .layout-widget-children {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.layout-column .layout-widget-children {
    display: flex;
    flex-direction: column;
}

.layout-center .layout-widget-children {
    display: flex;
    justify-content: center;
    align-items: center;
}

.layout-sizedbox {
    min-width: 100px;
    min-height: 100px;
}

.widget-remove-btn {
    background-color: rgba(255, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4px;
}

.widget-remove-btn:hover {
    background-color: rgba(255, 0, 0, 0.8);
}
</style>
