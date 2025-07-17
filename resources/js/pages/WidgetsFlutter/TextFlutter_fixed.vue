<template>
    <div class="text-flutter" :style="containerStyle">
        <component :is="textTag" :class="textClasses" :style="textStyle"
            v-if="['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(textTag)">
            <span v-html="formattedText"></span>
        </component>
        <span v-else :class="textClasses" :style="textStyle" v-html="formattedText" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    properties: {
        data: string;
        style: string;
        textAlign: string;
        fontSize?: number;
        fontWeight?: string;
        color?: string;
        fontFamily?: string;
        letterSpacing?: number;
        lineHeight?: number;
        textDecoration?: string;
        textTransform?: string;
        overflow?: string;
        maxLines?: number;
        width?: number;
        height?: number;
        padding?: string;
        margin?: string;
        backgroundColor?: string;
    };
}>();

// Computed properties
const textTag = computed(() => {
    // Determine HTML tag based on text content or style
    if (props.properties?.data?.includes('<h1>') || props.properties?.style?.includes('headline1')) return 'h1';
    if (props.properties?.data?.includes('<h2>') || props.properties?.style?.includes('headline2')) return 'h2';
    if (props.properties?.data?.includes('<h3>') || props.properties?.style?.includes('headline3')) return 'h3';
    if (props.properties?.data?.includes('<h4>') || props.properties?.style?.includes('headline4')) return 'h4';
    if (props.properties?.data?.includes('<h5>') || props.properties?.style?.includes('headline5')) return 'h5';
    if (props.properties?.data?.includes('<h6>') || props.properties?.style?.includes('headline6')) return 'h6';
    return 'p';
});

const containerStyle = computed(() => ({
    width: props.properties?.width ? `${props.properties.width}px` : 'auto',
    height: props.properties?.height ? `${props.properties.height}px` : 'auto',
    padding: props.properties?.padding || '0',
    margin: props.properties?.margin || '0',
    backgroundColor: props.properties?.backgroundColor || 'transparent',
    overflow: props.properties?.overflow || 'visible',
}));

const textClasses = computed(() => [
    'flutter-text',
    {
        'text-ellipsis': props.properties?.overflow === 'ellipsis',
        'text-clamp': props.properties?.maxLines && props.properties.maxLines > 1,
    }
]);

const textStyle = computed(() => {
    const style: Record<string, any> = {};

    // Parse textAlign
    if (props.properties?.textAlign) {
        switch (props.properties.textAlign) {
            case 'TextAlign.left':
                style.textAlign = 'left';
                break;
            case 'TextAlign.center':
                style.textAlign = 'center';
                break;
            case 'TextAlign.right':
                style.textAlign = 'right';
                break;
            case 'TextAlign.justify':
                style.textAlign = 'justify';
                break;
            default:
                style.textAlign = 'left';
        }
    }

    // Parse Flutter TextStyle
    if (props.properties?.style) {
        const fontSize = props.properties.style.match(/fontSize:\s*(\d+(?:\.\d+)?)/);
        if (fontSize) {
            style.fontSize = `${fontSize[1]}px`;
        }

        const fontWeight = props.properties.style.match(/fontWeight:\s*FontWeight\.(\w+)/);
        if (fontWeight) {
            switch (fontWeight[1]) {
                case 'bold':
                    style.fontWeight = 'bold';
                    break;
                case 'w100':
                    style.fontWeight = '100';
                    break;
                case 'w200':
                    style.fontWeight = '200';
                    break;
                case 'w300':
                    style.fontWeight = '300';
                    break;
                case 'w400':
                    style.fontWeight = '400';
                    break;
                case 'w500':
                    style.fontWeight = '500';
                    break;
                case 'w600':
                    style.fontWeight = '600';
                    break;
                case 'w700':
                    style.fontWeight = '700';
                    break;
                case 'w800':
                    style.fontWeight = '800';
                    break;
                case 'w900':
                    style.fontWeight = '900';
                    break;
                default:
                    style.fontWeight = 'normal';
            }
        }

        const color = props.properties.style.match(/color:\s*Color\(0x([A-Fa-f0-9]{8})\)/);
        if (color) {
            const hex = color[1];
            const r = parseInt(hex.substring(2, 4), 16);
            const g = parseInt(hex.substring(4, 6), 16);
            const b = parseInt(hex.substring(6, 8), 16);
            style.color = `rgb(${r}, ${g}, ${b})`;
        }

        const fontFamily = props.properties.style.match(/fontFamily:\s*['"]([^'"]+)['"]/);
        if (fontFamily) {
            style.fontFamily = fontFamily[1];
        }

        const letterSpacing = props.properties.style.match(/letterSpacing:\s*(\d+(?:\.\d+)?)/);
        if (letterSpacing) {
            style.letterSpacing = `${letterSpacing[1]}px`;
        }

        const height = props.properties.style.match(/height:\s*(\d+(?:\.\d+)?)/);
        if (height) {
            style.lineHeight = height[1];
        }

        const decoration = props.properties.style.match(/decoration:\s*TextDecoration\.(\w+)/);
        if (decoration) {
            switch (decoration[1]) {
                case 'underline':
                    style.textDecoration = 'underline';
                    break;
                case 'lineThrough':
                    style.textDecoration = 'line-through';
                    break;
                case 'overline':
                    style.textDecoration = 'overline';
                    break;
                default:
                    style.textDecoration = 'none';
            }
        }
    }

    // Direct style properties from component props
    if (props.properties?.fontSize) style.fontSize = `${props.properties.fontSize}px`;
    if (props.properties?.fontWeight) style.fontWeight = props.properties.fontWeight;
    if (props.properties?.color) style.color = props.properties.color;
    if (props.properties?.fontFamily) style.fontFamily = props.properties.fontFamily;
    if (props.properties?.letterSpacing) style.letterSpacing = `${props.properties.letterSpacing}px`;
    if (props.properties?.lineHeight) style.lineHeight = props.properties.lineHeight;
    if (props.properties?.textDecoration) style.textDecoration = props.properties.textDecoration;
    if (props.properties?.textTransform) style.textTransform = props.properties.textTransform;

    // Handle maxLines
    if (props.properties?.maxLines && props.properties.maxLines > 1) {
        style.display = '-webkit-box';
        style.webkitLineClamp = props.properties.maxLines;
        style.webkitBoxOrient = 'vertical';
        style.overflow = 'hidden';
    }

    return style;
});

const formattedText = computed(() => {
    let text = props.properties?.data || '';

    // Handle basic HTML tags
    text = text.replace(/\\n/g, '<br>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');

    return text;
});
</script>

<style scoped>
.text-flutter {
    font-family: 'Roboto', sans-serif;
    word-wrap: break-word;
}

.flutter-text {
    margin: 0;
    padding: 0;
    transition: all 0.2s ease;
}

.flutter-text.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.flutter-text.text-clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Flutter Text Styles */
.flutter-text.headline1 {
    font-size: 96px;
    font-weight: 300;
    letter-spacing: -1.5px;
}

.flutter-text.headline2 {
    font-size: 60px;
    font-weight: 300;
    letter-spacing: -0.5px;
}

.flutter-text.headline3 {
    font-size: 48px;
    font-weight: 400;
    letter-spacing: 0px;
}

.flutter-text.headline4 {
    font-size: 34px;
    font-weight: 400;
    letter-spacing: 0.25px;
}

.flutter-text.headline5 {
    font-size: 24px;
    font-weight: 400;
    letter-spacing: 0px;
}

.flutter-text.headline6 {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 0.15px;
}

.flutter-text.subtitle1 {
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.15px;
}

.flutter-text.subtitle2 {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.1px;
}

.flutter-text.body1 {
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.5px;
}

.flutter-text.body2 {
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.25px;
}

.flutter-text.button {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 1.25px;
    text-transform: uppercase;
}

.flutter-text.caption {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.4px;
}

.flutter-text.overline {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 1.5px;
    text-transform: uppercase;
}

/* Responsive text sizes */
@media (max-width: 768px) {
    .flutter-text.headline1 {
        font-size: 56px;
    }

    .flutter-text.headline2 {
        font-size: 45px;
    }

    .flutter-text.headline3 {
        font-size: 36px;
    }

    .flutter-text.headline4 {
        font-size: 26px;
    }

    .flutter-text.headline5 {
        font-size: 20px;
    }

    .flutter-text.headline6 {
        font-size: 18px;
    }
}

@media (max-width: 480px) {
    .flutter-text.headline1 {
        font-size: 40px;
    }

    .flutter-text.headline2 {
        font-size: 32px;
    }

    .flutter-text.headline3 {
        font-size: 28px;
    }

    .flutter-text.headline4 {
        font-size: 22px;
    }

    .flutter-text.headline5 {
        font-size: 18px;
    }

    .flutter-text.headline6 {
        font-size: 16px;
    }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
    .flutter-text {
        color: #e0e0e0;
    }
}

/* Accessibility improvements */
.flutter-text:focus {
    outline: 2px solid #2196f3;
    outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
    .flutter-text {
        text-shadow: none;
        font-weight: 500;
    }
}

/* Animation classes */
.flutter-text.fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.flutter-text.slide-in {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
