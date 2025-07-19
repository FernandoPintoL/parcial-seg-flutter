// Test script for widget selection and properties panel display
// This script tests:
// 1. Widget selection to show properties
// 2. Delete button visibility and functionality
// 3. Properties panel visibility when a widget is selected

// Function to test widget selection and properties panel display
function testWidgetSelectionAndProperties() {
    console.log('Testing widget selection and properties panel display...');

    // Find a widget element
    const widget = document.querySelector('.unified-widget-element');
    if (!widget) {
        console.error('No widget found on the canvas');
        return false;
    }

    // Log initial state
    console.log('Initial state:');
    console.log('- Widget:', widget);
    console.log('- Widget classes:', widget.className);
    console.log('- Widget ID:', widget.dataset.elementId);

    // Check if properties panel is visible before clicking
    const propertiesPanelContainerBefore = document.querySelector('.w-80.transition-all.duration-300.transform');
    const propertiesPanelBefore = document.querySelector('.properties-panel');
    console.log('- Properties panel container visible before click:', !!propertiesPanelContainerBefore && window.getComputedStyle(propertiesPanelContainerBefore).display !== 'none');
    console.log('- Properties panel visible before click:', !!propertiesPanelBefore && window.getComputedStyle(propertiesPanelBefore).display !== 'none');

    // Click the widget to select it
    console.log('Clicking widget to select it...');
    widget.click();

    // Wait a moment for the click event to be processed
    setTimeout(() => {
        // Check if the widget is selected (has the selected-widget class)
        const isSelected = widget.classList.contains('selected-widget') || widget.classList.contains('is-selected');
        console.log('Widget selected:', isSelected);
        console.log('Widget classes after click:', widget.className);

        // Check if the properties panel container is visible
        const propertiesPanelContainer = document.querySelector('.w-80.transition-all.duration-300.transform');
        const isContainerVisible = propertiesPanelContainer && window.getComputedStyle(propertiesPanelContainer).display !== 'none';
        console.log('Properties panel container visible after click:', isContainerVisible);

        // Check if the properties panel is visible
        const propertiesPanel = document.querySelector('.properties-panel');
        const isPanelVisible = propertiesPanel && window.getComputedStyle(propertiesPanel).display !== 'none';
        console.log('Properties panel visible after click:', isPanelVisible);

        if (propertiesPanel) {
            console.log('Properties panel content:', propertiesPanel.innerHTML.substring(0, 100) + '...');
        }

        // Check if the widget header with delete button is visible
        const widgetHeader = widget.querySelector('.widget-header');
        const isHeaderVisible = widgetHeader && window.getComputedStyle(widgetHeader).display !== 'none';
        console.log('Widget header visible:', isHeaderVisible);

        if (widgetHeader) {
            console.log('Widget header content:', widgetHeader.innerHTML);

            // Check if the delete button is visible
            const deleteButton = widgetHeader.querySelector('.widget-remove-btn');
            const isDeleteButtonVisible = deleteButton && window.getComputedStyle(deleteButton).display !== 'none';
            console.log('Delete button visible:', isDeleteButtonVisible);

            if (deleteButton) {
                console.log('Delete button content:', deleteButton.innerHTML);

                // Create a new widget before deleting the current one
                console.log('Creating a new widget before testing delete...');
                const addWidgetButton = document.querySelector('.widget-tool[data-type="Container"]');
                if (addWidgetButton) {
                    // Simulate drag and drop to create a new widget
                    const dragEvent = new DragEvent('dragstart', {
                        bubbles: true,
                        cancelable: true,
                    });

                    // Set the data transfer
                    Object.defineProperty(dragEvent, 'dataTransfer', {
                        value: {
                            setData: () => {},
                            getData: () => 'Container'
                        }
                    });

                    addWidgetButton.dispatchEvent(dragEvent);

                    // Find the canvas
                    const canvas = document.querySelector('.phone-content-area') ||
                                  document.querySelector('.canvas-container') ||
                                  document.querySelector('.unified-canvas');

                    if (canvas) {
                        // Simulate drop on canvas
                        const dropEvent = new DragEvent('drop', {
                            bubbles: true,
                            cancelable: true,
                            clientX: 100,
                            clientY: 100
                        });

                        // Set the data transfer
                        Object.defineProperty(dropEvent, 'dataTransfer', {
                            value: {
                                getData: () => 'Container'
                            }
                        });

                        canvas.dispatchEvent(dropEvent);
                        console.log('New widget created');
                    }
                }

                // Test clicking the delete button
                console.log('Clicking delete button...');
                deleteButton.click();

                // Check if the widget was deleted
                setTimeout(() => {
                    const widgetAfterDelete = document.querySelector(`[data-element-id="${widget.dataset.elementId}"]`);
                    console.log('Widget deleted:', !widgetAfterDelete);

                    // Final test result
                    const testResult = isSelected && isPanelVisible && isHeaderVisible && isDeleteButtonVisible && !widgetAfterDelete;
                    console.log('Test result:', testResult ? 'PASSED ✅' : 'FAILED ❌');

                    return testResult;
                }, 500);
            }
        }

        // Check for any console errors
        if (console.errors && console.errors.length > 0) {
            console.log('Console errors:', console.errors);
        }

        // Return intermediate test result
        return isSelected && isPanelVisible && isHeaderVisible;
    }, 500);
}

// Run the test when the page is loaded
window.addEventListener('load', () => {
    // Wait for the canvas to be fully initialized
    setTimeout(() => {
        console.log('Running widget selection and properties panel test...');
        testWidgetSelectionAndProperties();
    }, 2000);
});

// Alternatively, you can run the test manually from the console
console.log('You can run the test manually by calling testWidgetSelectionAndProperties() from the console.');
