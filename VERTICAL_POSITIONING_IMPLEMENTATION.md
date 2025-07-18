# Vertical Positioning Implementation

## Overview

This document describes the implementation of vertical positioning for elements in the whiteboard application. The changes ensure that when new elements are added to the whiteboard, they are positioned in an orderly manner one below the other, rather than using a grid-based or random approach.

## Changes Made

### 1. Modified `calculateOptimalPosition` Function

The `calculateOptimalPosition` function in `PizarraUnificada.vue` was modified to position elements vertically:

```javascript
// Calculate an optimal position for a new element to position elements vertically
const calculateOptimalPosition = (widgetType: string): { x: number, y: number } => {
    if (!currentScreen.value || !currentScreen.value.elements || currentScreen.value.elements.length === 0) {
        // If no elements exist, start at a default position
        return { x: 100, y: 100 };
    }

    // Get existing elements
    const existingElements = currentScreen.value.elements;
    
    // Define constants for positioning
    const startX = 100; // Fixed X position for vertical alignment
    const startY = 100; // Initial Y position
    const margin = 20;  // Margin between elements
    
    // Find the bottom-most element to place new element below it
    let maxBottom = startY;
    
    existingElements.forEach(element => {
        if (element.position && element.size) {
            const elementBottom = element.position.y + (element.size.height || 0);
            if (elementBottom > maxBottom) {
                maxBottom = elementBottom;
            }
        }
    });
    
    // Add margin to the bottom-most element
    let newY = maxBottom + margin;
    
    // Determine the framework to adjust horizontal position if needed
    const framework = selectedFramework.value === 'both' ? 'flutter' : selectedFramework.value;
    
    // For Angular, we might want to center elements more
    let newX = startX;
    if (framework === 'angular') {
        // Center more for Angular components in the browser view
        const browserContent = document.querySelector('.browser-content');
        if (browserContent) {
            const rect = browserContent.getBoundingClientRect();
            // Center horizontally with a slight offset
            newX = Math.max(startX, (rect.width / 2) - 100);
        }
    }
    
    // Get the default size for this widget type to ensure it fits
    const elementSizes = {
        'Container': { width: 150, height: 100 },
        'Text': { width: 100, height: 30 },
        'Button': { width: 120, height: 40 },
        // ... other element sizes ...
    };
    
    const defaultSize = elementSizes[widgetType as keyof typeof elementSizes] || { width: 120, height: 80 };

    // Check if the new position would be too far down
    const canvasHeight = framework === 'angular' ? 600 : 500; // Different heights for different frameworks
    if (newY + defaultSize.height > canvasHeight - margin) {
        // If we're too far down, create a new column to the right
        newX += 200; // Move to the right
        newY = startY; // Reset Y to the top
    }
    
    return { x: newX, y: newY };
};
```

Key changes:
- Find the bottom-most element in the canvas
- Position new elements below the bottom-most element with a margin
- If the new position would be too far down, create a new column to the right
- Adjust horizontal position based on the framework (Angular vs Flutter)

### 2. Modified `getSmartPosition` Function

The `getSmartPosition` function in `PizarraUnificada.vue` was also modified to use the same vertical positioning approach:

```javascript
// Smart positioning function to position elements vertically
const getSmartPosition = (elementType: string, existingElements: any[]) => {
    // Define constants for positioning
    const startX = 100; // Fixed X position for vertical alignment
    const startY = 100; // Initial Y position
    const margin = 20;  // Margin between elements
    
    // If no elements exist, start at a default position
    if (!existingElements || existingElements.length === 0) {
        return { x: startX, y: startY };
    }
    
    // Find the bottom-most element to place new element below it
    let maxBottom = startY;
    
    existingElements.forEach(element => {
        if (element.position && element.size) {
            const elementBottom = element.position.y + (element.size.height || 0);
            if (elementBottom > maxBottom) {
                maxBottom = elementBottom;
            }
        }
    });
    
    // Add margin to the bottom-most element
    let newY = maxBottom + margin;
    
    // Determine the framework to adjust horizontal position if needed
    const framework = selectedFramework.value === 'both' ? 'flutter' : selectedFramework.value;
    
    // For Angular, we might want to center elements more
    let newX = startX;
    if (framework === 'angular') {
        // Center more for Angular components in the browser view
        const browserContent = document.querySelector('.browser-content');
        if (browserContent) {
            const rect = browserContent.getBoundingClientRect();
            // Center horizontally with a slight offset
            newX = Math.max(startX, (rect.width / 2) - 100);
        }
    }
    
    // Get the element size to ensure it fits
    const elementSizes = {
        'Container': { width: 150, height: 100 },
        'Text': { width: 100, height: 30 },
        'Button': { width: 120, height: 40 },
        // ... other element sizes ...
    };
    
    const elementSize = elementSizes[elementType as keyof typeof elementSizes] || { width: 120, height: 80 };
    
    // Check if the new position would be too far down
    const canvasHeight = framework === 'angular' ? 600 : 500; // Different heights for different frameworks
    if (newY + elementSize.height > canvasHeight - margin) {
        // If we're too far down, create a new column to the right
        newX += 200; // Move to the right
        newY = startY; // Reset Y to the top
    }
    
    return { x: newX, y: newY };
};
```

This ensures consistent behavior between the `addWidget` function and the `addAIWidgetsToCanvas` function, which uses `getSmartPosition`.

## Testing

A test script (`test_vertical_positioning.js`) has been created to verify that elements are positioned vertically when added to the whiteboard. The script includes:

1. Functions to test adding multiple widgets and checking their positions
2. Tests for both Flutter and Angular frameworks
3. Helper functions to find Vue components and access the current elements

To run the tests:
1. Open the whiteboard application in the browser
2. Open the browser console (F12)
3. Load the test script
4. Run `window.runAllTests()` in the console

## Benefits

The vertical positioning implementation provides several benefits:

1. **Improved Organization**: Elements are positioned in a clear, orderly manner, making it easier to understand the structure of the whiteboard.
2. **Reduced Overlap**: By positioning elements vertically with appropriate margins, the chance of elements overlapping is minimized.
3. **Framework-Specific Adjustments**: The implementation takes into account the differences between Angular and Flutter frameworks, adjusting the positioning accordingly.
4. **Automatic Column Creation**: When elements would extend beyond the visible area, a new column is automatically created, ensuring all elements remain visible.

## Future Improvements

Potential future improvements to the vertical positioning implementation:

1. **User-Configurable Spacing**: Allow users to configure the spacing between elements.
2. **Alignment Options**: Add options for different alignment patterns (vertical, horizontal, grid).
3. **Grouping**: Implement automatic grouping of related elements.
4. **Snap-to-Grid**: Add a snap-to-grid feature for more precise positioning.
5. **Responsive Positioning**: Improve positioning for different screen sizes and orientations.
