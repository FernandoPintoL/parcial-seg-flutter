<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';

const formElements = ref([
    { type: 'input', props: { placeholder: 'Input' } },
    { type: 'select', props: { options: ['Opcion1', 'Opcion2'] } },
    { type: 'textarea', props: { placeholder: 'Text Area' } },
    { type: 'button', props: { text: 'Button' } },
]);

const generateAngularCode = () => {
    let angularCode = '<form>\n';
    formElements.value.forEach(element => {
        switch (element.type) {
            case 'input':
                angularCode += `<input placeholder="${element.props.placeholder}" />\n`;
                break;
            case 'select':
                angularCode += `<select>\n`;
                element.props.options.forEach(option => {
                    angularCode += `  <option>${option}</option>\n`;
                });
                angularCode += `</select>\n`;
                break;
            case 'textarea':
                angularCode += `<textarea placeholder="${element.props.placeholder}"></textarea>\n`;
                break;
            case 'button':
                angularCode += `<button>${element.props.text}</button>\n`;
                break;
        }
    });
    angularCode += '</form>';
    console.log(angularCode);
};
</script>

<template>
    <div>
        <draggable v-model="formElements" @end="generateAngularCode" item-key="type">
            <template #item="{ element }">
                <div class="draggable-element">
                    <component :is="element.type" v-bind="element.props">
                        <template v-if="element.type === 'select'">
                            <option v-for="option in element.props.options" :key="option">{{ option }}</option>
                        </template>
                    </component>
                </div>
            </template>
        </draggable>
    </div>
</template>

<style scoped>
.draggable-element {
    margin-bottom: 10px;
}
</style>
