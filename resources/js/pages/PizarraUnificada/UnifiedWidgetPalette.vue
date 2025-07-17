<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
    availableWidgets: any[];
    selectedFramework: 'flutter' | 'angular' | 'both';
}>();

const emit = defineEmits(['add-widget', 'drag-start', 'drag-end']);

// Group widgets by category
const widgetCategories = computed(() => {
    const categories = new Map();

    props.availableWidgets.forEach(widget => {
        if (!categories.has(widget.category)) {
            categories.set(widget.category, {
                category: widget.category,
                label: getCategoryLabel(widget.category),
                widgets: []
            });
        }
        categories.get(widget.category).widgets.push(widget);
    });

    return Array.from(categories.values());
});

// Get a user-friendly label for a category
function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        'input': 'Entrada',
        'layout': 'Diseño',
        'containers': 'Contenedores',
        'display': 'Visualización',
        'material-cupertino': 'Material & Cupertino'
    };

    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// Active category index
const activeCategory = ref(0);

// Widgets in the active category
const widgetsByActiveCategory = computed(() => {
    if (widgetCategories.value.length === 0) return [];
    return widgetCategories.value[activeCategory.value]?.widgets || [];
});

// Handle widget drag start
function handleDragStart(widgetType: string, event: DragEvent) {
    if (event.dataTransfer) {
        event.dataTransfer.setData('widget-type', widgetType);
        event.dataTransfer.effectAllowed = 'copy';
    }
    emit('drag-start', widgetType);
}

// Handle widget drag end
function handleDragEnd() {
    emit('drag-end');
}

// Get the framework icon based on the framework type
function getFrameworkIcon(framework: 'flutter' | 'angular'): string {
    switch (framework) {
        case 'flutter':
            return '🎯'; // Flutter icon
        case 'angular':
            return '🅰️'; // Angular icon
        default:
            return '📦';
    }
}

// Get widget-specific icon based on widget type
function getWidgetIcon(widgetType: string): string {
    const iconMap: Record<string, string> = {
        // Flutter Navigation
        'Drawer': 'menu',
        'AppBar': 'app_bar',
        'AppBarFlutter': 'app_bar',
        'BottomNavigationBar': 'bottom_navigation',
        'TabBar': 'tab',
        'NavigationRail': 'navigation_rail',

        // Layout widgets
        'Container': 'crop_square',
        'Column': 'view_column',
        'Row': 'view_week',
        'Stack': 'layers',
        'Scaffold': 'dashboard',
        'Center': 'center_focus_strong',
        'Expanded': 'expand',
        'Flexible': 'flexible',
        'Wrap': 'wrap_text',
        'Flow': 'flow',
        'ListView': 'list',
        'GridView': 'grid_view',
        'Card': 'card_membership',
        'SizedBox': 'crop_square',
        'Padding': 'padding',

        // Input widgets
        'TextField': 'text_fields',
        'TextFormField': 'text_fields',
        'Button': 'smart_button',
        'ElevatedButton': 'smart_button',
        'OutlinedButton': 'radio_button_unchecked',
        'TextButton': 'text_format',
        'IconButton': 'radio_button_checked',
        'FloatingActionButton': 'add_circle',
        'Checkbox': 'check_box',
        'Switch': 'toggle_on',
        'Radio': 'radio_button_checked',
        'Slider': 'tune',
        'DropdownButton': 'arrow_drop_down',
        'DatePicker': 'date_range',
        'TimePicker': 'access_time',
        'Form': 'description',

        // Display widgets
        'Text': 'text_format',
        'RichText': 'text_rotation_none',
        'Icon': 'star',
        'Image': 'image',
        'CircleAvatar': 'account_circle',
        'Divider': 'remove',
        'LinearProgressIndicator': 'linear_scale',
        'CircularProgressIndicator': 'refresh',
        'Chip': 'label',
        'Badge': 'badge',
        'Tooltip': 'help_outline',
        'Snackbar': 'info',
        'AlertDialog': 'warning',
        'BottomSheet': 'vertical_align_bottom',

        // Material Design
        'MaterialApp': 'apps',
        'MaterialButton': 'smart_button',
        'MaterialBanner': 'banner',
        'ExpansionTile': 'expand_more',
        'ListTile': 'list_alt',
        'DataTable': 'table_chart',
        'Stepper': 'linear_scale',
        'TabBarView': 'tab_unselected',
        'PageView': 'pages',
        'PopupMenuButton': 'more_vert',

        // Angular Components
        'div': 'crop_square',
        'span': 'text_format',
        'p': 'text_snippet',
        'h1': 'title',
        'h2': 'title',
        'h3': 'title',
        'button': 'smart_button',
        'input': 'text_fields',
        'select': 'arrow_drop_down',
        'textarea': 'text_fields',
        'form': 'description',
        'table': 'table_chart',
        'ul': 'list',
        'ol': 'format_list_numbered',
        'li': 'fiber_manual_record',
        'img': 'image',
        'nav': 'navigation',
        'header': 'web_asset',
        'footer': 'web_asset',
        'section': 'section',
        'article': 'article',
        'aside': 'side_navigation',
        'main': 'dashboard',
        'mat-toolbar': 'app_bar',
        'mat-button': 'smart_button',
        'mat-icon': 'star',
        'mat-card': 'card_membership',
        'mat-list': 'list',
        'mat-grid-list': 'grid_view',
        'mat-table': 'table_chart',
        'mat-form-field': 'text_fields',
        'mat-input': 'text_fields',
        'mat-select': 'arrow_drop_down',
        'mat-checkbox': 'check_box',
        'mat-radio': 'radio_button_checked',
        'mat-slider': 'tune',
        'mat-toggle': 'toggle_on',
        'mat-datepicker': 'date_range',
        'mat-dialog': 'warning',
        'mat-snackbar': 'info',
        'mat-tooltip': 'help_outline',
        'mat-badge': 'badge',
        'mat-chip': 'label',
        'mat-progress-bar': 'linear_scale',
        'mat-progress-spinner': 'refresh',
        'mat-expansion-panel': 'expand_more',
        'mat-stepper': 'linear_scale',
        'mat-tab-group': 'tab',
        'mat-paginator': 'pages',
        'mat-sort': 'sort',
        'mat-menu': 'more_vert',
        'mat-sidenav': 'menu',
        'mat-drawer': 'menu',
    };

    return iconMap[widgetType] || 'widgets';
}

// Get user-friendly widget name
function getWidgetDisplayName(widget: any): string {
    const nameMap: Record<string, string> = {
        // Flutter
        'Drawer': 'Cajón de Navegación',
        'AppBar': 'Barra de Aplicación',
        'AppBarFlutter': 'Barra App Flutter',
        'BottomNavigationBar': 'Navegación Inferior',
        'TabBar': 'Pestañas',
        'NavigationRail': 'Carril de Navegación',
        'Container': 'Contenedor',
        'Column': 'Columna',
        'Row': 'Fila',
        'Stack': 'Pila',
        'Scaffold': 'Andamio',
        'Center': 'Centrado',
        'Expanded': 'Expandido',
        'Flexible': 'Flexible',
        'Wrap': 'Envolver',
        'Flow': 'Flujo',
        'ListView': 'Lista',
        'GridView': 'Cuadrícula',
        'Card': 'Tarjeta',
        'SizedBox': 'Caja Dimensionada',
        'Padding': 'Relleno',
        'TextField': 'Campo de Texto',
        'TextFormField': 'Campo Formulario',
        'Button': 'Botón',
        'ElevatedButton': 'Botón Elevado',
        'OutlinedButton': 'Botón Contorno',
        'TextButton': 'Botón Texto',
        'IconButton': 'Botón Icono',
        'FloatingActionButton': 'Botón Flotante',
        'Checkbox': 'Casilla de Verificación',
        'Switch': 'Interruptor',
        'Radio': 'Botón Radio',
        'Slider': 'Deslizador',
        'DropdownButton': 'Menú Desplegable',
        'DatePicker': 'Selector Fecha',
        'TimePicker': 'Selector Hora',
        'Form': 'Formulario',
        'Text': 'Texto',
        'RichText': 'Texto Enriquecido',
        'Icon': 'Icono',
        'Image': 'Imagen',
        'CircleAvatar': 'Avatar Circular',
        'Divider': 'Divisor',
        'LinearProgressIndicator': 'Progreso Lineal',
        'CircularProgressIndicator': 'Progreso Circular',
        'Chip': 'Etiqueta',
        'Badge': 'Insignia',
        'Tooltip': 'Información Emergente',
        'Snackbar': 'Mensaje Emergente',
        'AlertDialog': 'Diálogo Alerta',
        'BottomSheet': 'Hoja Inferior',

        // Angular
        'div': 'División',
        'span': 'Span',
        'p': 'Párrafo',
        'h1': 'Título 1',
        'h2': 'Título 2',
        'h3': 'Título 3',
        'button': 'Botón',
        'input': 'Entrada',
        'select': 'Selector',
        'textarea': 'Área de Texto',
        'form': 'Formulario',
        'table': 'Tabla',
        'ul': 'Lista',
        'ol': 'Lista Ordenada',
        'li': 'Elemento Lista',
        'img': 'Imagen',
        'nav': 'Navegación',
        'header': 'Encabezado',
        'footer': 'Pie de Página',
        'section': 'Sección',
        'article': 'Artículo',
        'aside': 'Barra Lateral',
        'main': 'Principal',
        'mat-toolbar': 'Barra Herramientas',
        'mat-button': 'Botón Material',
        'mat-icon': 'Icono Material',
        'mat-card': 'Tarjeta Material',
        'mat-list': 'Lista Material',
        'mat-grid-list': 'Cuadrícula Material',
        'mat-table': 'Tabla Material',
        'mat-form-field': 'Campo Formulario',
        'mat-input': 'Entrada Material',
        'mat-select': 'Selector Material',
        'mat-checkbox': 'Casilla Material',
        'mat-radio': 'Radio Material',
        'mat-slider': 'Deslizador Material',
        'mat-toggle': 'Interruptor Material',
        'mat-datepicker': 'Selector Fecha Material',
        'mat-dialog': 'Diálogo Material',
        'mat-snackbar': 'Mensaje Material',
        'mat-tooltip': 'Tooltip Material',
        'mat-badge': 'Insignia Material',
        'mat-chip': 'Etiqueta Material',
        'mat-progress-bar': 'Progreso Material',
        'mat-progress-spinner': 'Spinner Material',
        'mat-expansion-panel': 'Panel Expansión',
        'mat-stepper': 'Stepper Material',
        'mat-tab-group': 'Grupo Pestañas',
        'mat-paginator': 'Paginador Material',
        'mat-sort': 'Ordenamiento Material',
        'mat-menu': 'Menú Material',
        'mat-sidenav': 'Navegación Lateral',
        'mat-drawer': 'Cajón Material',
    };

    return nameMap[widget.type] || widget.name || widget.label || widget.type;
}
</script>

<template>
    <div class="w-full sm:w-64 overflow-hidden rounded-md bg-gray-100 transition-colors dark:bg-gray-700 max-h-screen sm:max-h-[calc(100vh-200px)]">
        <div class="widget-palette dark:border-gray-600">
            <div class="widget-category-tabs dark:border-gray-600 dark:bg-gray-800 overflow-x-auto flex flex-nowrap">
                <button
                    v-for="(category, index) in widgetCategories"
                    :key="category.category"
                    class="widget-category-tab dark:text-gray-300 dark:hover:bg-gray-700 whitespace-nowrap px-3 py-2 text-sm"
                    :class="{
                        'bg-blue-500 text-white': activeCategory === index,
                        'dark:border-blue-400 dark:text-blue-400': activeCategory === index,
                    }"
                    @click="activeCategory = index"
                >
                    {{ category.label }}
                </button>
            </div>
            <div class="widget-grid overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh]">
                <div
                    v-for="widget in widgetsByActiveCategory"
                    :key="widget.type"
                    class="widget-card group relative overflow-hidden border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-300 hover:shadow-lg cursor-pointer"
                    :class="{
                        'framework-flutter-widget': widget.framework === 'flutter',
                        'framework-angular-widget': widget.framework === 'angular',
                        'framework-both-widget': widget.framework === 'both' || !widget.framework
                    }"
                    @click="$emit('add-widget', widget.type)"
                    draggable="true"
                    @dragstart="handleDragStart(widget.type, $event)"
                    @dragend="handleDragEnd()"
                >
                    <!-- Framework indicator badge -->
                    <div v-if="widget.framework && widget.framework !== 'both'"
                         class="absolute top-2 right-2 z-10 framework-badge-indicator rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md"
                         :class="{
                             'bg-blue-500 text-white': widget.framework === 'flutter',
                             'bg-red-500 text-white': widget.framework === 'angular'
                         }">
                        <span class="text-xs">{{ getFrameworkIcon(widget.framework) }}</span>
                    </div>

                    <!-- Widget content -->
                    <div class="p-4 flex flex-col items-center text-center h-full">
                        <!-- Widget icon with enhanced styling -->
                        <div class="widget-icon-container relative mb-3 p-3 rounded-xl transition-all duration-300 group-hover:scale-110"
                             :class="{
                                 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400': widget.category === 'input',
                                 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400': widget.category === 'layout',
                                 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400': widget.category === 'containers',
                                 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400': widget.category === 'display',
                                 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400': widget.category === 'material-cupertino',
                                 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400': widget.category === 'navegation',
                                 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400': !widget.category
                             }">
                            <span class="material-icons text-2xl">{{ getWidgetIcon(widget.type) }}</span>

                            <!-- Icon glow effect -->
                            <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                                 :class="{
                                     'bg-orange-400': widget.category === 'input',
                                     'bg-pink-400': widget.category === 'layout',
                                     'bg-green-400': widget.category === 'containers',
                                     'bg-purple-400': widget.category === 'display',
                                     'bg-blue-400': widget.category === 'material-cupertino',
                                     'bg-indigo-400': widget.category === 'navegation',
                                     'bg-gray-400': !widget.category
                                 }"></div>
                        </div>

                        <!-- Widget name -->
                        <h3 class="widget-name text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">
                            {{ getWidgetDisplayName(widget) }}
                        </h3>

                        <!-- Widget type subtitle -->
                        <p class="widget-type text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono">
                            {{ widget.type }}
                        </p>

                        <!-- Framework badge -->
                        <div v-if="widget.framework && widget.framework !== 'both'"
                             class="framework-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                             :class="{
                                 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200': widget.framework === 'flutter',
                                 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200': widget.framework === 'angular'
                             }">
                            <span class="mr-1">{{ getFrameworkIcon(widget.framework) }}</span>
                            <span>{{ widget.framework?.toUpperCase() || 'UNKNOWN' }}</span>
                        </div>
                    </div>

                    <!-- Hover overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    <!-- Selection indicator -->
                    <div class="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg transition-all duration-300"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Modern widget palette styling */
.widget-palette {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .widget-palette {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

/* Enhanced category tabs */
.widget-category-tabs {
    display: flex;
    border-bottom: 1px solid #e2e8f0;
    overflow-x: auto;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    padding: 0.5rem;
}

.dark .widget-category-tabs {
    background: rgba(30, 41, 59, 0.8);
    border-bottom-color: #475569;
}

.widget-category-tab {
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    white-space: nowrap;
    border-radius: 8px;
    margin-right: 0.5rem;
    transition: all 0.2s ease;
    font-weight: 500;
    position: relative;
    overflow: hidden;
}

.widget-category-tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s;
}

.widget-category-tab:hover::before {
    left: 100%;
}

.widget-category-tab.bg-blue-500 {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Enhanced widget grid */
.widget-grid {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    background: transparent;
}

/* Modern widget cards */
.widget-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .widget-card {
    background: rgba(30, 41, 59, 0.8);
    border-color: #475569;
}

.widget-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.dark .widget-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

/* Widget icon container with glassmorphism effect */
.widget-icon-container {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    margin-bottom: 1rem;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.widget-icon-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), transparent);
    border-radius: 12px;
}

/* Widget text styling */
.widget-name {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 0.5rem;
    color: #1f2937;
    text-align: center;
    min-height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dark .widget-name {
    color: #f9fafb;
}

.widget-type {
    font-size: 0.75rem;
    color: #6b7280;
    font-family: 'Fira Code', monospace;
    margin-bottom: 0.75rem;
    text-align: center;
    opacity: 0.8;
}

.dark .widget-type {
    color: #9ca3af;
}

/* Framework indicator badge */
.framework-badge-indicator {
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Framework badges */
.framework-badge {
    font-size: 0.6875rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Framework-specific modern styling */
.framework-flutter-widget {
    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
    border-left: 4px solid #0ea5e9;
    position: relative;
}

.framework-flutter-widget::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.02), transparent);
    border-radius: 12px;
    pointer-events: none;
}

.framework-angular-widget {
    background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
    border-left: 4px solid #ef4444;
    position: relative;
}

.framework-angular-widget::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.02), transparent);
    border-radius: 12px;
    pointer-events: none;
}

.framework-both-widget {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-left: 4px solid #64748b;
    position: relative;
}

.framework-both-widget::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(100, 116, 139, 0.02), transparent);
    border-radius: 12px;
    pointer-events: none;
}

/* Dark mode framework styling */
.dark .framework-flutter-widget {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
    border-left-color: #0ea5e9;
}

.dark .framework-angular-widget {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
    border-left-color: #ef4444;
}

.dark .framework-both-widget {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
    border-left-color: #64748b;
}

/* Hover effects */
.widget-card:hover .widget-icon-container {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.widget-card:hover .widget-name {
    color: #3b82f6;
}

.dark .widget-card:hover .widget-name {
    color: #60a5fa;
}

/* Custom scrollbar */
.widget-grid::-webkit-scrollbar {
    width: 8px;
}

.widget-grid::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.widget-grid::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 10px;
}

.widget-grid::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
}

/* Animation keyframes */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.widget-card:active {
    animation: pulse 0.3s ease-in-out;
}

/* Line clamp utility */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
