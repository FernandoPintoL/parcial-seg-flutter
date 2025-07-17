<script setup lang="ts">
import { defineProps, computed } from 'vue';

const props = defineProps<{
  items?: any[];
  title?: string;
  subtitle?: string;
  elevation?: number;
  color?: string;
  borderRadius?: number;
}>();

// Generate default items if none provided
const cardItems = computed(() => {
  if (props.items && Array.isArray(props.items) && props.items.length > 0) {
    return props.items;
  }

  // Default items
  return [
    { title: 'Card 1', subtitle: 'Subtitle 1', content: 'Content for card 1' },
    { title: 'Card 2', subtitle: 'Subtitle 2', content: 'Content for card 2' },
    { title: 'Card 3', subtitle: 'Subtitle 3', content: 'Content for card 3' }
  ];
});

// Card style based on props
const cardStyle = computed(() => {
  return {
    backgroundColor: props.color || '#FFFFFF',
    borderRadius: `${props.borderRadius || 8}px`,
    boxShadow: `0 ${props.elevation || 2}px ${(props.elevation || 2) * 2}px rgba(0,0,0,0.1)`
  };
});
</script>

<template>
  <div class="list-card-flutter">
    <div
      v-for="(item, index) in cardItems"
      :key="index"
      class="card"
      :style="cardStyle"
    >
      <div class="card-content">
        <h3 class="card-title">{{ item.title || props.title || 'Card Title' }}</h3>
        <h4 class="card-subtitle">{{ item.subtitle || props.subtitle || 'Card Subtitle' }}</h4>
        <p class="card-text">{{ item.content || 'Card content goes here with more details about the item.' }}</p>
      </div>
      <div class="card-actions">
        <button class="card-button">Action</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-card-flutter {
  font-family: 'Roboto', sans-serif;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
}

.card {
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.card-content {
  padding: 16px;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.card-subtitle {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.6);
}

.card-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
}

.card-actions {
  display: flex;
  padding: 8px 16px 16px;
  justify-content: flex-end;
}

.card-button {
  background-color: transparent;
  color: #2196F3;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.card-button:hover {
  background-color: rgba(33, 150, 243, 0.1);
}
</style>
