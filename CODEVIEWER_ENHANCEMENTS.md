# Code Viewer Enhancements

## Overview

The Code Viewer component has been enhanced to provide a better user experience when displaying generated code. The following features have been added:

1. **Framework-specific structure visualization**: Display the real structure of the framework (Angular or Flutter)
2. **AI code verification**: Analyze the generated code using AI to ensure its accuracy
3. **Separate screens/components view**: View code for each screen in separate windows
4. **Complete project download**: Download complete framework files with instructions for setup and usage

## Features in Detail

### Framework-specific Structure Visualization

The Code Viewer now includes a "Structure" tab that displays the file and folder structure of the selected framework (Angular or Flutter). This helps users understand how the code is organized in a real project.

- For Angular: Shows the structure of components, services, modules, and configuration files
- For Flutter: Shows the structure of screens, widgets, services, and configuration files

### AI Code Verification with Automatic Correction

The Code Viewer now includes a "Verify Code" button that uses AI to analyze the generated code and ensure its accuracy. The verification process:

1. For Flutter: Uses the `AIService.correctFlutterCode` method to check if the code needs corrections
2. For other frameworks: Uses a generic approach to verify the code

The verification results are displayed with appropriate styling (green for valid code, red for issues). When issues are found:

1. The system automatically generates corrected code that follows best practices
2. A button appears allowing users to apply the corrections with one click
3. When applied, the corrected code replaces the original code for both display and download

This ensures that users always have access to high-quality, optimized code that follows framework-specific best practices.

### Separate Screens/Components View

The Code Viewer now includes a screen selector dropdown that allows users to view code for each screen/component separately. This makes it easier to understand and work with the generated code.

- For Angular: Parses the code by components
- For Flutter: Parses the code by screen classes

### Complete Project Download with Real Architecture

The Code Viewer now includes a "Download" tab with options for:

1. **Single file download**: Download the generated code as a single file with the appropriate extension
2. **Complete project download**: Download a ZIP file with the complete real project architecture and a separate instructions file

The complete project download includes:

**For Flutter:**
- Full project structure with all necessary folders (lib, android, ios, web, assets, test)
- Configuration files (pubspec.yaml, analysis_options.yaml, .gitignore)
- Platform-specific files for Android and iOS
- Basic model and service classes
- Test files
- README with detailed instructions

**For Angular:**
- Full project structure with all necessary folders (src/app/components, services, models, etc.)
- Configuration files (package.json, angular.json, tsconfig.json, .gitignore)
- Basic application files (index.html, main.ts, styles.scss)
- Environment configuration
- Basic model and service classes
- README with detailed instructions

The instructions file includes:
- Prerequisites for running the project
- Steps to install dependencies and run the application
- Project structure explanation
- Additional commands for building and testing

## How to Use

### Viewing Code Structure

1. Click on the "Structure" tab to view the framework-specific structure
2. Browse through the list of files and folders to understand the project organization

### Verifying Code

1. Click on the "Verify Code" button in the header
2. Wait for the verification process to complete
3. Review the verification results displayed above the code

### Viewing Code by Screen

1. In the "Code" tab, use the screen selector dropdown to choose a specific screen/component
2. The code display will update to show only the code for the selected screen

### Downloading Code

1. Click on the "Download" tab
2. Choose between "Single file" or "Complete project with instructions"
3. For complete projects, you can preview the instructions before downloading
4. Click the "Download" button to start the download process

## Technical Implementation

The enhancements were implemented by:

1. Updating the `CodeViewerModal.vue` component with new tabs, UI elements, and functionality
2. Adding AI code verification using the existing `AIService`
3. Implementing code parsing to separate screens/components
4. Enhancing the download functionality in `PizarraUnificadaCore.vue` to support both single file and complete project downloads
5. Adding detailed installation instructions for each framework

## Future Improvements

Potential future improvements could include:

1. More detailed code analysis with specific suggestions for improvements
2. Support for additional frameworks (React, Vue, etc.)
3. Interactive code editor for making changes before downloading
4. Preview of the generated UI directly in the Code Viewer
