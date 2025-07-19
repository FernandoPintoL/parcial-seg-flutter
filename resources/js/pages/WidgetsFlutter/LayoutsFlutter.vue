<script setup lang="ts">

interface Layout {
    id: string;
    name: string;
    color: string;
}
const props = defineProps({
  layouts: {
    type: Array as () => Layout[],
    default: () => [
      { id: 'row', name: 'Row', color: '#2196F3' },
      { id: 'column', name: 'Column', color: '#4CAF50' },
      { id: 'stack', name: 'Stack', color: '#FF9800' },
      { id: 'container', name: 'Container', color: '#9C27B0' },
      { id: 'expanded', name: 'Expanded', color: '#F44336' },
      { id: 'padding', name: 'Padding', color: '#607D8B' },
      { id: 'sizedBox', name: 'SizedBox', color: '#795548' },
      { id: 'scaffold', name: 'Scaffold', color: '#3F51B5' }
    ]
  },
  selectedLayouts: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select-layout', 'remove-layout']);

const isSelected = (layoutId: string) => {
  return props.selectedLayouts.includes(layoutId);
};

const selectLayout = (layout: any) => {
  emit('select-layout', layout);
};

const removeLayout = (layout: any) => {
  emit('remove-layout', layout);
};
</script>

<template>
  <div class="layouts-flutter-container">
    <div class="layouts-title">Layouts de Flutter</div>
    <div class="layouts-tags-container">
      <div
        v-for="layout in layouts"
        :key="layout.id"
        class="layout-tag"
        :class="{ selected: isSelected(layout.id) }"
        :style="{
          backgroundColor: isSelected(layout.id) ? layout.color : '#e0e0e0',
          color: isSelected(layout.id) ? '#fff' : layout.color
        }"
        @click="selectLayout(layout)"
      >
        {{ layout.name }}
        <span
          v-if="isSelected(layout.id)"
          class="tag-close-btn"
          @click.stop="removeLayout(layout)"
        >×</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layouts-flutter-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background-color: #F5F5F5;
  font-family: 'Roboto', sans-serif;
}

.layouts-title {
  font-weight: 500;
  color: #424242;
  margin-bottom: 4px;
  font-size: 14px;
}

.layouts-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.layout-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 16px;
  padding: 0 12px;
  height: 32px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s, color 0.2s;
}

.layout-tag.selected {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.tag-close-btn {
  margin-left: 8px;
  font-size: 18px;
  line-height: 14px;
  opacity: 0.7;
  cursor: pointer;
}

.tag-close-btn:hover {
  opacity: 1;
}
</style>
