<script setup lang="ts">
defineProps<{
    categoriesWidget: any[];
    activeWidgetCategory: number;
    widgetsByActiveCategory: any[];
}>();
defineEmits(['update:activeWidgetCategory', 'addWidget', 'onPaletteDragStart', 'onPaletteDragEnd']);
</script>

<template>
    <div class="w-full sm:w-auto overflow-hidden rounded-md bg-gray-100 transition-colors dark:bg-gray-700 max-h-screen sm:max-h-96">
        <div class="mobile-widget-selector desktop-widget-selector dark:border-gray-600">
            <div class="widget-category-tabs dark:border-gray-600 dark:bg-gray-800 overflow-x-auto flex flex-nowrap">
                <button
                    v-for="(category, index) in categoriesWidget"
                    :key="category.category"
                    class="widget-category-tab dark:text-gray-300 dark:hover:bg-gray-700 whitespace-nowrap"
                    :class="{
                        'active-tab': activeWidgetCategory === index,
                        'dark:border-blue-400 dark:text-blue-400': activeWidgetCategory === index,
                    }"
                    @click="$emit('update:activeWidgetCategory', index)"
                >
                    {{ category.label }}
                </button>
            </div>
            <div class="widget-grid overflow-y-auto max-h-[60vh]">
                <button
                    v-for="widget in widgetsByActiveCategory"
                    :key="widget.type"
                    class="widget-button dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    @click="$emit('addWidget', widget.type)"
                    draggable="true"
                    @dragstart="$emit('onPaletteDragStart', widget.type)"
                    @dragend="$emit('onPaletteDragEnd')"
                >
                    <span
                        class="widget-icon"
                        :class="{
                            'dark:bg-orange-900 dark:bg-opacity-30': widget.category === 'input',
                            'dark:bg-pink-900 dark:bg-opacity-30': widget.category === 'layout',
                            'dark:bg-green-900 dark:bg-opacity-30': widget.category === 'containers',
                            'dark:bg-purple-900 dark:bg-opacity-30': widget.category === 'material-cupertino',
                        }"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fill-rule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </span>
                    <span class="widget-label dark:text-white">{{ widget.label }}</span>
                </button>
            </div>
        </div>
    </div>
</template>
