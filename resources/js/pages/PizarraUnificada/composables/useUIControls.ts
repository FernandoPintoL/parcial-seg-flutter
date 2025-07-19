import { ref } from 'vue';

export function useUIControls() {
    // Panel visibility states
    const showWidgetPalette = ref<boolean>(true);
    const showPropertiesPanel = ref<boolean>(true);
    const showScreenManager = ref<boolean>(false);
    const isPanelsCollapsed = ref<boolean>(false);
    const isFullscreen = ref<boolean>(false);

    // Feature panel states
    const showAIChat = ref<boolean>(false);
    const showCollaborationChat = ref<boolean>(false);
    const showImageUpload = ref<boolean>(false);
    const showDiagramUpload = ref<boolean>(false);
    const showCodeViewer = ref<boolean>(false);

    // Dark mode
    const isDarkMode = ref<boolean>(localStorage.getItem('darkMode') === 'true');

    // Panel visibility toggles
    const toggleWidgetPalette = () => {
        showWidgetPalette.value = !showWidgetPalette.value;
    };

    const togglePropertiesPanel = () => {
        showPropertiesPanel.value = !showPropertiesPanel.value;
    };

    const togglePanelsCollapse = () => {
        isPanelsCollapsed.value = !isPanelsCollapsed.value;
        if (isPanelsCollapsed.value) {
            showWidgetPalette.value = false;
            showPropertiesPanel.value = false;
        } else {
            showWidgetPalette.value = true;
            showPropertiesPanel.value = true;
        }
    };

    const toggleFullscreen = () => {
        isFullscreen.value = !isFullscreen.value;
        if (isFullscreen.value) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    // Feature toggles
    const toggleAIChat = () => {
        showAIChat.value = !showAIChat.value;
        if (showAIChat.value) {
            showCollaborationChat.value = false;
        }
    };

    const toggleCollaborationChat = () => {
        showCollaborationChat.value = !showCollaborationChat.value;
        if (showCollaborationChat.value) {
            showAIChat.value = false;
        }
    };

    const toggleImageUpload = () => {
        showImageUpload.value = !showImageUpload.value;
    };

    const toggleDiagramUpload = () => {
        showDiagramUpload.value = !showDiagramUpload.value;
    };

    const toggleCodeViewer = () => {
        showCodeViewer.value = !showCodeViewer.value;
    };

    // Dark mode toggle
    const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value;
        localStorage.setItem('darkMode', isDarkMode.value.toString());
        applyDarkMode();
    };

    const applyDarkMode = () => {
        if (isDarkMode.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return {
        // Panel states
        showWidgetPalette,
        showPropertiesPanel,
        showScreenManager,
        isPanelsCollapsed,
        isFullscreen,

        // Feature states
        showAIChat,
        showCollaborationChat,
        showImageUpload,
        showDiagramUpload,
        showCodeViewer,

        // Theme state
        isDarkMode,

        // Panel actions
        toggleWidgetPalette,
        togglePropertiesPanel,
        togglePanelsCollapse,
        toggleFullscreen,

        // Feature actions
        toggleAIChat,
        toggleCollaborationChat,
        toggleImageUpload,
        toggleDiagramUpload,
        toggleCodeViewer,

        // Theme actions
        toggleDarkMode,
        applyDarkMode
    };
} 