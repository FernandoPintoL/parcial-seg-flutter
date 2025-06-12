<script setup lang="ts">
import { computed } from 'vue';

// Define interfaces para los tipos complejos
interface PaddingMargin {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

// Define el mapa de alineación con su tipo específico
interface AlignmentMap {
    [key: string]: string;
}

// Define la interfaz para el estilo del contenedor
interface ContainerStyle {
    backgroundColor: string;
    padding: string;
    margin: string;
    borderWidth: string;
    borderColor: string;
    borderStyle: string;
    borderRadius: string;
    justifyContent: string;
    alignItems: string;
    display: string;
    position: string;
    width?: string;
    height?: string;
    boxShadow?: string;
    outline?: string;
}

const props = defineProps({
    // Propiedades de estilo
    width: {
        type: [Number, String],
        default: null
    },
    height: {
        type: [Number, String],
        default: null
    },
    color: {
        type: String,
        default: 'transparent'
    },
    padding: {
        type: [Number, String, Object] as unknown as () => number | string | PaddingMargin,
        default: 0
    },
    margin: {
        type: [Number, String, Object] as unknown as () => number | string | PaddingMargin,
        default: 0
    },
    alignment: {
        type: String,
        default: 'center' // center, topLeft, topCenter, topRight, etc.
    },
    // Propiedades de borde
    borderWidth: {
        type: Number,
        default: 0
    },
    borderRadius: {
        type: Number,
        default: 0
    },
    borderColor: {
        type: String,
        default: '#000000'
    },
    // Propiedades de sombra
    boxShadow: {
        type: Boolean,
        default: false
    },
    boxShadowColor: {
        type: String,
        default: 'rgba(0, 0, 0, 0.2)'
    },
    boxShadowBlur: {
        type: Number,
        default: 10
    },
    boxShadowSpread: {
        type: Number,
        default: 0
    },
    boxShadowOffsetX: {
        type: Number,
        default: 0
    },
    boxShadowOffsetY: {
        type: Number,
        default: 5
    },
    // Propiedades de pizarra interactiva
    id: {
        type: String,
        default: ''
    },
    top: {
        type: Number,
        default: 0
    },
    left: {
        type: Number,
        default: 0
    },
    zIndex: {
        type: Number,
        default: 1
    },
    isSelected: {
        type: Boolean,
        default: false
    },
});

const emit = defineEmits(['select']);

const getPadding = computed(() => {
    if (typeof props.padding === 'number') {
        return `${props.padding}px`;
    } else if (typeof props.padding === 'object') {
        const p = props.padding as PaddingMargin;
        return `${p.top || 0}px ${p.right || 0}px ${p.bottom || 0}px ${p.left || 0}px`;
    }
    return props.padding;
});

const getMargin = computed(() => {
    if (typeof props.margin === 'number') {
        return `${props.margin}px`;
    } else if (typeof props.margin === 'object') {
        const m = props.margin as PaddingMargin;
        return `${m.top || 0}px ${m.right || 0}px ${m.bottom || 0}px ${m.left || 0}px`;
    }
    return props.margin;
});

const getAlignment = computed(() => {
    const alignmentMap: Record<string, string> = {
        center: 'center center',
        topLeft: 'flex-start flex-start',
        topCenter: 'center flex-start',
        topRight: 'flex-end flex-start',
        centerLeft: 'flex-start center',
        centerRight: 'flex-end center',
        bottomLeft: 'flex-start flex-end',
        bottomCenter: 'center flex-end',
        bottomRight: 'flex-end flex-end',
    };

    if (props.alignment in alignmentMap) {
        const [justify, align] = alignmentMap[props.alignment].split(' ');
        return { justifyContent: justify, alignItems: align };
    }

    return { justifyContent: 'center', alignItems: 'center' };
});

const containerStyle = computed(() => {
    const style: ContainerStyle = {
        backgroundColor: props.color,
        padding: getPadding.value,
        margin: getMargin.value,
        borderWidth: `${props.borderWidth}px`,
        borderColor: props.borderColor,
        borderStyle: props.borderWidth > 0 ? 'solid' : 'none',
        borderRadius: `${props.borderRadius}px`,
        justifyContent: getAlignment.value.justifyContent,
        alignItems: getAlignment.value.alignItems,
        display: 'flex',
        position: 'relative',
    };

    // Si hay dimensiones específicas
    if (props.width !== null) {
        style.width = typeof props.width === 'number' ? `${props.width}px` : props.width as string;
    }

    if (props.height !== null) {
        style.height = typeof props.height === 'number' ? `${props.height}px` : props.height as string;
    }

    // Sombra
    if (props.boxShadow) {
        style.boxShadow = `${props.boxShadowOffsetX}px ${props.boxShadowOffsetY}px ${props.boxShadowBlur}px ${props.boxShadowSpread}px ${props.boxShadowColor}`;
    }

    // Borde de selección para el editor
    if (props.isSelected) {
        style.outline = '2px solid #2196F3';
    }

    return style;
});

const selectWidget = () => {
    emit('select', props.id);
};
</script>

<template>
    <div
        :style="containerStyle"
        class="flutter-container"
        @click.stop="selectWidget"
    >
        <slot>
            <!-- Contenido del container -->
        </slot>
    </div>
</template>

<style scoped>
.flutter-container {
    min-width: 20px;
    min-height: 20px;
    transition: all 0.2s ease;
}

.flutter-container:hover {
    outline: 1px dashed #9e9e9e;
}
</style>
