// Test script for widget interaction in the unified whiteboard
// This script tests both widget selection to show properties and widget dragging to persist position

// Function to test widget selection
function testWidgetSelection() {
    console.log('Testing widget selection...');

    // Find a widget element
    const widget = document.querySelector('.unified-widget-element');
    if (!widget) {
        console.error('No widget found on the canvas');
        return false;
    }

    // Click the widget to select it
    console.log('Clicking widget to select it...');
    widget.click();

    // Check if the widget is selected (has the selected-widget class)
    const isSelected = widget.classList.contains('selected-widget') || widget.classList.contains('is-selected');
    console.log('Widget selected:', isSelected);

    // Check if the properties panel is visible
    const propertiesPanel = document.querySelector('.property-panel') ||
                           document.querySelector('[data-testid="properties-panel"]');
    const isPanelVisible = propertiesPanel &&
                          !propertiesPanel.classList.contains('hidden') &&
                          window.getComputedStyle(propertiesPanel).display !== 'none';
    console.log('Properties panel visible:', isPanelVisible);

    return isSelected && isPanelVisible;
}

// Function to test widget dragging with improved offset calculation
function testWidgetDragging() {
    console.log('Testing widget dragging with improved offset calculation...');

    // Find a widget element
    const widget = document.querySelector('.unified-widget-element');
    if (!widget) {
        console.error('No widget found on the canvas');
        return false;
    }

    // Get the initial position
    const initialRect = widget.getBoundingClientRect();
    const initialPosition = {
        x: initialRect.left,
        y: initialRect.top
    };
    console.log('Initial position:', initialPosition);

    // Get the canvas container for reference
    const canvas = document.querySelector('.unified-canvas') ||
                  document.querySelector('.canvas-container') ||
                  document.querySelector('.phone-content-area');
    if (!canvas) {
        console.error('Canvas container not found');
        return false;
    }
    const canvasRect = canvas.getBoundingClientRect();
    console.log('Canvas rect:', canvasRect);

    // Calculate click position (center of the widget)
    const clickX = initialRect.left + initialRect.width / 2;
    const clickY = initialRect.top + initialRect.height / 2;
    console.log('Click position (center of widget):', { x: clickX, y: clickY });

    // Simulate a mouse down event on the center of the widget
    console.log('Simulating mouse down on widget center...');
    const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: clickX,
        clientY: clickY
    });
    widget.dispatchEvent(mouseDownEvent);

    // Calculate drag destination (100px to the right, 50px down)
    const dragToX = clickX + 100;
    const dragToY = clickY + 50;
    console.log('Drag destination:', { x: dragToX, y: dragToY });

    // Simulate a mouse move event to drag the widget
    console.log('Simulating mouse move to drag widget...');
    const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: dragToX,
        clientY: dragToY
    });
    document.dispatchEvent(mouseMoveEvent);

    // Simulate a mouse up event to end the drag
    console.log('Simulating mouse up to end drag...');
    const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: dragToX,
        clientY: dragToY
    });
    document.dispatchEvent(mouseUpEvent);

    // Wait for any animations to complete
    return new Promise(resolve => {
        setTimeout(() => {
            // Get the final position
            const finalRect = widget.getBoundingClientRect();
            const finalPosition = {
                x: finalRect.left,
                y: finalRect.top
            };
            console.log('Final position:', finalPosition);

            // Calculate expected position change
            const expectedChangeX = dragToX - clickX;
            const expectedChangeY = dragToY - clickY;
            console.log('Expected position change:', { x: expectedChangeX, y: expectedChangeY });

            // Calculate actual position change
            const actualChangeX = finalPosition.x - initialPosition.x;
            const actualChangeY = finalPosition.y - initialPosition.y;
            console.log('Actual position change:', { x: actualChangeX, y: actualChangeY });

            // Check if the position has changed and persisted
            // Allow for small differences due to rounding and boundary checks
            const tolerance = 5; // 5px tolerance
            const xChangeCorrect = Math.abs(actualChangeX - expectedChangeX) <= tolerance;
            const yChangeCorrect = Math.abs(actualChangeY - expectedChangeY) <= tolerance;
            const positionChangedCorrectly = xChangeCorrect && yChangeCorrect;

            console.log('Position changed correctly:', positionChangedCorrectly);
            console.log('X change correct:', xChangeCorrect);
            console.log('Y change correct:', yChangeCorrect);

            resolve(positionChangedCorrectly);
        }, 500);
    });
}

// Run the tests
async function runTests() {
    console.log('Running widget interaction tests...');

    const selectionResult = testWidgetSelection();
    console.log('Widget selection test result:', selectionResult);

    const draggingResult = await testWidgetDragging();
    console.log('Widget dragging test result:', draggingResult);

    console.log('All tests completed.');

    return {
        selection: selectionResult,
        dragging: draggingResult,
        overall: selectionResult && draggingResult
    };
}

// Run the tests when the page is loaded
window.addEventListener('load', () => {
    // Wait for the canvas to be fully initialized
    setTimeout(() => {
        runTests().then(results => {
            console.log('Test results:', results);
            if (results.overall) {
                console.log('✅ All tests passed! Widget interaction is working correctly.');
            } else {
                console.log('❌ Some tests failed. Check the console for details.');
            }
        });
    }, 1000);
});

// Alternatively, you can run the tests manually from the console
console.log('You can run the tests manually by calling runTests() from the console.');
