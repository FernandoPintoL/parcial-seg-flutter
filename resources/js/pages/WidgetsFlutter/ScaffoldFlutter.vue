<template>
  <div class="scaffold-flutter" :style="scaffoldStyle">
    <!-- App Bar -->
    <div v-if="properties.appBar" class="scaffold-appbar" :style="appBarStyle">
      <div class="appbar-content">
        <span class="appbar-title">{{ properties.appBarTitle || 'Scaffold' }}</span>
      </div>
    </div>

    <!-- Body -->
    <div class="scaffold-body" :style="bodyStyle">
      <slot name="body">
        <div class="scaffold-placeholder">
          <span class="material-icons">dashboard</span>
          <span class="placeholder-text">Scaffold Body</span>
          <span class="scaffold-info">Drag widgets here</span>
        </div>
      </slot>
    </div>

    <!-- Bottom Navigation -->
    <div v-if="properties.bottomNavigationBar" class="scaffold-bottom-nav" :style="bottomNavStyle">
      <div class="bottom-nav-content">
        <div
          v-for="(item, index) in bottomNavItems"
          :key="index"
          class="nav-item"
          :class="{ 'nav-item-active': index === selectedNavIndex }"
          @click="selectNavItem(index)"
        >
          <span class="material-icons">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <div v-if="properties.floatingActionButton" class="scaffold-fab" :style="fabPositionStyle">
      <button class="scaffold-fab-button" :style="fabStyle" @click="handleFabClick">
        <span class="material-icons">{{ fabIcon }}</span>
      </button>
    </div>

    <!-- Drawer -->
    <div v-if="properties.drawer && isDrawerOpen" class="scaffold-drawer" :style="drawerStyle">
      <div class="drawer-content">
        <div class="drawer-header" :style="drawerHeaderStyle">
          <span class="drawer-title">Menu</span>
        </div>
        <div class="drawer-items">
          <div v-for="(item, index) in drawerItems" :key="index" class="drawer-item">
            <span class="material-icons">{{ item.icon }}</span>
            <span class="drawer-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div v-if="isDrawerOpen" class="drawer-overlay" @click="closeDrawer"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  properties: {
    appBar?: boolean;
    appBarTitle?: string;
    appBarColor?: string;
    backgroundColor?: string;
    body?: string;
    bottomNavigationBar?: boolean;
    floatingActionButton?: boolean;
    floatingActionButtonLocation?: string;
    drawer?: boolean;
    endDrawer?: boolean;
    resizeToAvoidBottomInset?: boolean;
    primary?: boolean;
    extendBody?: boolean;
    extendBodyBehindAppBar?: boolean;
  };
}>();

const emit = defineEmits(['update:properties', 'fab-click', 'nav-item-click', 'drawer-item-click']);

// Reactive state
const selectedNavIndex = ref(0);
const isDrawerOpen = ref(false);

// Computed properties
const scaffoldStyle = computed(() => ({
  backgroundColor: props.properties.backgroundColor || '#FFFFFF',
  fontFamily: 'Roboto, sans-serif',
}));

const appBarStyle = computed(() => ({
  backgroundColor: props.properties.appBarColor || '#2196F3',
  color: '#FFFFFF',
}));

const bodyStyle = computed(() => ({
  flex: 1,
  overflow: 'auto',
  paddingTop: props.properties.extendBodyBehindAppBar ? '0' : 'auto',
}));

const bottomNavStyle = computed(() => ({
  backgroundColor: '#FFFFFF',
  borderTop: '1px solid #E0E0E0',
}));

const fabPositionStyle = computed(() => {
  const location = props.properties.floatingActionButtonLocation || 'centerFloat';
  const style: Record<string, any> = {};

  switch (location) {
    case 'centerFloat':
      style.bottom = '16px';
      style.right = '16px';
      break;
    case 'centerDocked':
      style.bottom = '8px';
      style.right = '16px';
      break;
    case 'endFloat':
      style.bottom = '16px';
      style.right = '16px';
      break;
    case 'endDocked':
      style.bottom = '8px';
      style.right = '16px';
      break;
    default:
      style.bottom = '16px';
      style.right = '16px';
  }

  return style;
});

const fabStyle = computed(() => ({
  backgroundColor: '#2196F3',
  color: '#FFFFFF',
}));

const drawerStyle = computed(() => ({
  backgroundColor: '#FFFFFF',
  width: '280px',
}));

const drawerHeaderStyle = computed(() => ({
  backgroundColor: props.properties.appBarColor || '#2196F3',
  color: '#FFFFFF',
}));

// Sample data
const bottomNavItems = [
  { icon: 'home', label: 'Home' },
  { icon: 'search', label: 'Search' },
  { icon: 'favorite', label: 'Favorites' },
  { icon: 'person', label: 'Profile' },
];

const drawerItems = [
  { icon: 'home', label: 'Home' },
  { icon: 'settings', label: 'Settings' },
  { icon: 'help', label: 'Help' },
  { icon: 'info', label: 'About' },
];

const fabIcon = computed(() => 'add');

// Methods
const selectNavItem = (index: number) => {
  selectedNavIndex.value = index;
  emit('nav-item-click', index);
};

const handleFabClick = () => {
  emit('fab-click');
};

const openDrawer = () => {
  isDrawerOpen.value = true;
};

const closeDrawer = () => {
  isDrawerOpen.value = false;
};
</script>

<style scoped>
.scaffold-flutter {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.scaffold-appbar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.appbar-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.appbar-title {
  font-size: 20px;
  font-weight: 500;
}

.scaffold-body {
  flex: 1;
  overflow: auto;
  position: relative;
}

.scaffold-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #9E9E9E;
  text-align: center;
}

.scaffold-placeholder .material-icons {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.scaffold-info {
  font-size: 14px;
  opacity: 0.7;
}

.scaffold-bottom-nav {
  height: 56px;
  display: flex;
  align-items: center;
  border-top: 1px solid #E0E0E0;
}

.bottom-nav-content {
  display: flex;
  width: 100%;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #757575;
}

.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.nav-item.nav-item-active {
  color: #2196F3;
}

.nav-item .material-icons {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 12px;
}

.scaffold-fab {
  position: absolute;
  z-index: 20;
}

.scaffold-fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.scaffold-fab-button:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.scaffold-fab-button .material-icons {
  font-size: 24px;
}

.scaffold-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 30;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  animation: drawer-slide-in 0.3s ease-out;
}

.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  height: 150px;
  display: flex;
  align-items: flex-end;
  padding: 16px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 500;
}

.drawer-items {
  flex: 1;
  padding: 8px 0;
}

.drawer-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drawer-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.drawer-item .material-icons {
  margin-right: 32px;
  color: #757575;
}

.drawer-label {
  font-size: 16px;
  color: #212121;
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 25;
  animation: overlay-fade-in 0.3s ease-out;
}

@keyframes drawer-slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .scaffold-flutter {
    background-color: #121212;
  }

  .scaffold-bottom-nav {
    background-color: #1E1E1E;
    border-top-color: #424242;
  }

  .scaffold-drawer {
    background-color: #1E1E1E;
  }

  .drawer-item {
    color: #E0E0E0;
  }

  .drawer-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
}
</style>
