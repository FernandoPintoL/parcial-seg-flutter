# Flutter and Angular UI Component Integration in PizarraUnificada

## Overview

This document describes the implementation of Flutter and Angular UI component editing capabilities in the PizarraUnificada module. The implementation allows users to create, edit, and manage UI components for both Flutter and Angular frameworks within a unified interface.

## Implementation Details

### 1. Component Structure

The implementation consists of three main components:

1. **UnifiedWidgetPalette**: Displays available widgets categorized by type, with visual indicators for framework-specific widgets.
2. **UnifiedPropertiesPanel**: Provides property editing for the selected widget, with support for different property types (string, number, boolean, color, select, array).
3. **UnifiedCanvas**: Renders the UI components on a canvas, allowing selection, drag-and-drop, and interaction.

### 2. Data Model

The implementation uses the existing UnifiedElement and UnifiedScreen data models, which already support both Flutter and Angular frameworks:

```typescript
export interface UnifiedElement {
    id?: string;
    type: string;
    framework: 'flutter' | 'angular' | 'both';
    props: Record<string, any>;
    children: UnifiedElement[];
    code_string?: string;
    position?: {
        x: number;
        y: number;
    };
    created_at?: string;
    updated_at?: string;
}

export interface UnifiedScreen {
    id: string;
    name: string;
    elements: UnifiedElement[];
    isHome?: boolean;
    isDrawer?: boolean;
    framework: 'flutter' | 'angular' | 'both';
    route?: string;
    created_at?: string;
    updated_at?: string;
}
```

### 3. Widget Management

The implementation includes functions for:

- Adding widgets to the canvas
- Selecting widgets for editing
- Updating widget properties
- Removing widgets from the canvas
- Managing screens (adding, deleting, selecting, setting home screen)

### 4. Framework Integration

The implementation integrates with the existing UnifiedWidgetService, which provides:

- Widget definitions for both Flutter and Angular
- Conversion between framework-specific and unified elements
- Code generation for both frameworks

### 5. User Interface

The user interface includes:

- A framework selector to switch between Flutter, Angular, or both
- A widget palette showing available widgets for the selected framework
- A properties panel for editing the selected widget
- A canvas for displaying and interacting with the UI components
- A screen manager for managing multiple screens

## Usage

1. Select a framework (Flutter, Angular, or both) from the dropdown in the header
2. Drag widgets from the palette to the canvas or click on a widget to add it
3. Select a widget on the canvas to edit its properties in the properties panel
4. Use the screen manager to add, delete, or switch between screens

## Technical Notes

- The implementation uses Vue.js components with TypeScript for type safety
- The components are responsive and support both light and dark modes
- The implementation integrates with the existing collaboration features, allowing real-time collaboration on UI design

## Future Improvements

- Add more advanced widget interactions (resizing, alignment, etc.)
- Enhance the visual representation of widgets on the canvas
- Add more framework-specific properties and styling options
- Implement a more advanced code preview and export functionality
