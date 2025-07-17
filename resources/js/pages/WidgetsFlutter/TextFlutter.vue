<template>
  <div class="text-flutter" :style="containerStyle">
    <component :is="textTag" :class="textClasses" :style="textStyle">
      <span v-html="formattedText"></span>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';

// Define props - accept both legacy and new formats
interface Props {
  properties?: {
    data?: string;
    style?: any;
    textAlign?: string;
    maxLines?: number;
    overflow?: string;
    textDirection?: string;
    locale?: string;
    softWrap?: boolean;
    textScaleFactor?: number;
    semanticsLabel?: string;
    textWidthBasis?: string;
    textHeightBehavior?: any;
    strutStyle?: any;
  };
  // Direct props for new format
  data?: string;
  style?: any;
  textAlign?: string;
  maxLines?: number;
  overflow?: string;
  textDirection?: string;
  locale?: string;
  softWrap?: boolean;
  textScaleFactor?: number;
  semanticsLabel?: string;
  textWidthBasis?: string;
  textHeightBehavior?: any;
  strutStyle?: any;
}

const props = withDefaults(defineProps<Props>(), {
  properties: () => ({}),
  data: '',
  style: () => ({}),
  textAlign: 'left',
  maxLines: undefined,
  overflow: 'visible',
  textDirection: 'ltr',
  locale: undefined,
  softWrap: true,
  textScaleFactor: 1.0,
  semanticsLabel: undefined,
  textWidthBasis: 'parent',
  textHeightBehavior: () => ({}),
  strutStyle: () => ({})
});

// Normalize properties to handle both legacy and new formats
const normalizedProperties = computed(() => {
  // If properties prop exists and has data, use it (legacy format)
  if (props.properties && typeof props.properties === 'object' && Object.keys(props.properties).length > 0) {
    return {
      data: props.properties.data || '',
      style: props.properties.style || {},
      textAlign: props.properties.textAlign || 'left',
      maxLines: props.properties.maxLines,
      overflow: props.properties.overflow || 'visible',
      textDirection: props.properties.textDirection || 'ltr',
      locale: props.properties.locale,
      softWrap: props.properties.softWrap ?? true,
      textScaleFactor: props.properties.textScaleFactor || 1.0,
      semanticsLabel: props.properties.semanticsLabel,
      textWidthBasis: props.properties.textWidthBasis || 'parent',
      textHeightBehavior: props.properties.textHeightBehavior || {},
      strutStyle: props.properties.strutStyle || {}
    };
  }

  // Otherwise, use direct props (new format)
  return {
    data: props.data || '',
    style: props.style || {},
    textAlign: props.textAlign || 'left',
    maxLines: props.maxLines,
    overflow: props.overflow || 'visible',
    textDirection: props.textDirection || 'ltr',
    locale: props.locale,
    softWrap: props.softWrap ?? true,
    textScaleFactor: props.textScaleFactor || 1.0,
    semanticsLabel: props.semanticsLabel,
    textWidthBasis: props.textWidthBasis || 'parent',
    textHeightBehavior: props.textHeightBehavior || {},
    strutStyle: props.strutStyle || {}
  };
});

// Computed properties
const textTag = computed(() => {
  const data = normalizedProperties.value?.data || '';
  const style = normalizedProperties.value?.style || {};

  // Determine HTML tag based on text content or style
  if (data.includes('<h1>') || (style.fontSize && style.fontSize >= 32)) return 'h1';
  if (data.includes('<h2>') || (style.fontSize && style.fontSize >= 28)) return 'h2';
  if (data.includes('<h3>') || (style.fontSize && style.fontSize >= 24)) return 'h3';
  if (data.includes('<h4>') || (style.fontSize && style.fontSize >= 20)) return 'h4';
  if (data.includes('<h5>') || (style.fontSize && style.fontSize >= 18)) return 'h5';
  if (data.includes('<h6>') || (style.fontSize && style.fontSize >= 16)) return 'h6';
  return 'p';
});

const textClasses = computed(() => {
  const classes = ['flutter-text'];
  const style = normalizedProperties.value?.style || {};

  // Font weight
  if (style.fontWeight === 'bold' || style.fontWeight >= 700) {
    classes.push('font-bold');
  } else if (style.fontWeight === 'normal' || (style.fontWeight >= 400 && style.fontWeight < 700)) {
    classes.push('font-normal');
  } else if (style.fontWeight <= 300) {
    classes.push('font-light');
  }

  // Font style
  if (style.fontStyle === 'italic') {
    classes.push('italic');
  }

  // Text decoration
  if (style.decoration === 'underline') {
    classes.push('underline');
  } else if (style.decoration === 'lineThrough') {
    classes.push('line-through');
  }

  // Text alignment
  const textAlign = normalizedProperties.value?.textAlign || 'left';
  if (textAlign === 'center') {
    classes.push('text-center');
  } else if (textAlign === 'right') {
    classes.push('text-right');
  } else if (textAlign === 'justify') {
    classes.push('text-justify');
  } else {
    classes.push('text-left');
  }

  return classes;
});

const textStyle = computed(() => {
  const style = normalizedProperties.value?.style || {};
  const textScaleFactor = normalizedProperties.value?.textScaleFactor || 1.0;
  const computedStyle: any = {};

  // Font size
  if (style.fontSize && typeof style.fontSize === 'number') {
    computedStyle.fontSize = `${style.fontSize * textScaleFactor}px`;
  }

  // Color
  if (style.color) {
    if (typeof style.color === 'string') {
      computedStyle.color = style.color;
    } else if (typeof style.color === 'object' && style.color && style.color.value) {
      computedStyle.color = `#${style.color.value.toString(16).padStart(8, '0').slice(2)}`;
    }
  }

  // Font family
  if (style.fontFamily && typeof style.fontFamily === 'string') {
    computedStyle.fontFamily = style.fontFamily;
  }

  // Letter spacing
  if (style.letterSpacing && typeof style.letterSpacing === 'number') {
    computedStyle.letterSpacing = `${style.letterSpacing}px`;
  }

  // Word spacing
  if (style.wordSpacing && typeof style.wordSpacing === 'number') {
    computedStyle.wordSpacing = `${style.wordSpacing}px`;
  }

  // Height (line height)
  if (style.height && (typeof style.height === 'number' || typeof style.height === 'string')) {
    computedStyle.lineHeight = style.height;
  }

  // Text direction
  const textDirection = normalizedProperties.value?.textDirection || 'ltr';
  computedStyle.direction = textDirection;

  // Max lines handling
  const maxLines = normalizedProperties.value?.maxLines;
  if (maxLines && typeof maxLines === 'number' && maxLines > 0) {
    computedStyle.display = '-webkit-box';
    computedStyle.webkitLineClamp = maxLines;
    computedStyle.webkitBoxOrient = 'vertical';
    computedStyle.overflow = 'hidden';
  }

  // Text overflow
  const overflow = normalizedProperties.value?.overflow || 'visible';
  if (overflow === 'ellipsis') {
    computedStyle.textOverflow = 'ellipsis';
    computedStyle.overflow = 'hidden';
    computedStyle.whiteSpace = 'nowrap';
  } else if (overflow === 'fade') {
    computedStyle.overflow = 'hidden';
    computedStyle.maskImage = 'linear-gradient(to right, black 80%, transparent 100%)';
  }

  // Soft wrap
  const softWrap = normalizedProperties.value?.softWrap ?? true;
  if (!softWrap) {
    computedStyle.whiteSpace = 'nowrap';
  }

  return computedStyle;
});

const containerStyle = computed(() => {
  const style: any = {};
  const textWidthBasis = normalizedProperties.value?.textWidthBasis || 'parent';

  if (textWidthBasis === 'longestLine') {
    style.width = 'max-content';
  }

  return style;
});

const formattedText = computed(() => {
  let text = normalizedProperties.value?.data || '';

  // Handle basic HTML-like formatting
  text = text.replace(/\n/g, '<br>');

  // Handle Flutter-specific text formatting
  text = text.replace(/\\n/g, '<br>');

  // Handle rich text spans (basic implementation)
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/__(.*?)__/g, '<u>$1</u>');

  return text;
});

// Reactive updates
const isVisible = ref(false);

onMounted(() => {
  isVisible.value = true;
});

// Watch for property changes
watch(() => normalizedProperties.value, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    // Handle any reactive updates if needed
    console.log('TextFlutter properties updated:', newVal);
  }
}, { deep: true });

// Expose component methods if needed
defineExpose({
  getText: () => normalizedProperties.value?.data || '',
  getStyle: () => normalizedProperties.value?.style || {},
  updateText: (newText: string) => {
    // This would require emitting an event or updating a reactive reference
    console.log('Update text called with:', newText);
  }
});
</script>

<style scoped>
.text-flutter {
  position: relative;
  display: inline-block;
}

.flutter-text {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
  transition: all 0.2s ease-in-out;
}

/* Override default margins for headings */
.flutter-text h1,
.flutter-text h2,
.flutter-text h3,
.flutter-text h4,
.flutter-text h5,
.flutter-text h6 {
  margin: 0;
  padding: 0;
}

/* Flutter-like text animations */
.text-flutter.animate-in {
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Text selection styling */
.flutter-text::selection {
  background-color: rgba(33, 150, 243, 0.3);
}

/* Accessibility improvements */
.flutter-text:focus {
  outline: 2px solid #2196F3;
  outline-offset: 2px;
}

/* Responsive font scaling */
@media (max-width: 768px) {
  .flutter-text {
    font-size: 0.9em;
  }
}

@media (max-width: 480px) {
  .flutter-text {
    font-size: 0.8em;
  }
}
</style>
