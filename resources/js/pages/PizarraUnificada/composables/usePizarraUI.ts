import { ref, onMounted } from 'vue';

export function usePizarraUI() {
    // UI State
    const isDarkMode = ref<boolean>(localStorage.getItem('darkMode') === 'true');
    const showWidgetPalette = ref<boolean>(true);
    const showPropertiesPanel = ref<boolean>(true);
    const showScreenManager = ref<boolean>(false);
    const isPanelsCollapsed = ref<boolean>(false);
    const isFullscreen = ref<boolean>(false);

    // Modal States
    const showAIChat = ref<boolean>(false);
    const showCollaborationChat = ref<boolean>(false);
    const showImageUpload = ref<boolean>(false);
    const showDiagramUpload = ref<boolean>(false);
    const showCodeViewer = ref<boolean>(false);

    // Apply dark mode to DOM
    const applyDarkMode = () => {
        if (isDarkMode.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Toggle functions
    const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value;
        localStorage.setItem('darkMode', isDarkMode.value.toString());
        applyDarkMode();
    };

    const toggleWidgetPalette = () => {
        showWidgetPalette.value = !showWidgetPalette.value;
    };

    const togglePropertiesPanel = () => {
        showPropertiesPanel.value = !showPropertiesPanel.value;
    };

    const toggleScreenManager = () => {
        showScreenManager.value = !showScreenManager.value;
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

    // Panel management utilities
    const hideAllModals = () => {
        showAIChat.value = false;
        showCollaborationChat.value = false;
        showImageUpload.value = false;
        showDiagramUpload.value = false;
        showCodeViewer.value = false;
        showScreenManager.value = false;
    };

    const isAnyModalOpen = () => {
        return showAIChat.value ||
            showCollaborationChat.value ||
            showImageUpload.value ||
            showDiagramUpload.value ||
            showCodeViewer.value ||
            showScreenManager.value;
    };

    // Keyboard shortcuts
    const setupKeyboardShortcuts = () => {
        const handleKeydown = (event: KeyboardEvent) => {
            // Ctrl/Cmd + Shift shortcuts
            if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                switch (event.code) {
                    case 'KeyP':
                        event.preventDefault();
                        toggleWidgetPalette();
                        break;
                    case 'KeyR':
                        event.preventDefault();
                        togglePropertiesPanel();
                        break;
                    case 'KeyS':
                        event.preventDefault();
                        toggleScreenManager();
                        break;
                    case 'KeyD':
                        event.preventDefault();
                        toggleDarkMode();
                        break;
                    case 'KeyF':
                        event.preventDefault();
                        toggleFullscreen();
                        break;
                    case 'KeyA':
                        event.preventDefault();
                        toggleAIChat();
                        break;
                }
            }

            // Escape key to close modals
            if (event.code === 'Escape' && isAnyModalOpen()) {
                event.preventDefault();
                hideAllModals();
            }
        };

        document.addEventListener('keydown', handleKeydown);

        // Return cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    };

    // Initialize UI
    onMounted(() => {
        applyDarkMode();
        const cleanupKeyboard = setupKeyboardShortcuts();

        // Handle fullscreen change events
        const handleFullscreenChange = () => {
            isFullscreen.value = !!document.fullscreenElement;
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Cleanup function would be returned if this were a separate composable
        return () => {
            cleanupKeyboard();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    });

    return {
        // State
        isDarkMode,
        showWidgetPalette,
        showPropertiesPanel,
        showScreenManager,
        isPanelsCollapsed,
        isFullscreen,
        showAIChat,
        showCollaborationChat,
        showImageUpload,
        showDiagramUpload,
        showCodeViewer,

        // Actions
        toggleDarkMode,
        toggleWidgetPalette,
        togglePropertiesPanel,
        toggleScreenManager,
        togglePanelsCollapse,
        toggleFullscreen,
        toggleAIChat,
        toggleCollaborationChat,
        toggleImageUpload,
        toggleDiagramUpload,
        toggleCodeViewer,
        applyDarkMode,
        hideAllModals,
        isAnyModalOpen
    };
}
