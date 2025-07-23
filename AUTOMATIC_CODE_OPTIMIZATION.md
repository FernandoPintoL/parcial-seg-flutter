# Automatic Code Optimization Feature

## Overview

The Code Viewer component has been enhanced with an automatic code optimization feature that verifies and optimizes code before displaying it to the user. This feature ensures that users always see high-quality, optimized code that follows best practices for the selected framework.

## How It Works

1. **Automatic Verification**: When a user clicks the "Code Viewer" button, the system automatically verifies the generated code before displaying it.
2. **Framework-Specific Optimization**: The verification process is tailored to the specific framework (Angular or Flutter).
3. **Immediate Feedback**: Users see verification results as soon as the modal opens, without having to manually click the "Verify Code" button.
4. **Automatic Correction**: If issues are found, the system automatically applies corrections to the code.
5. **Pre-Download Verification**: Before downloading code, the system verifies all files to ensure they are correctly structured and follow best practices.

## Technical Implementation

The automatic code optimization feature is implemented across several components:

### PizarraUnificadaCore.vue

```typescript
// State variables to store verification results
const codeVerificationResult = ref<{ isValid: boolean; message: string } | null>(null);
const codeCorrectedCode = ref<string | null>(null);
const codeHasCorrections = ref<boolean>(false);
const isVerifyingCode = ref<boolean>(false);

// Enhanced handleCodeViewerToggle method
const handleCodeViewerToggle = async () => {
  try {
    // Reset verification state
    codeVerificationResult.value = null;
    codeCorrectedCode.value = null;
    codeHasCorrections.value = false;
    
    // Show loading message
    isVerifyingCode.value = true;
    
    // Save pizarra and generate code
    await savePizarra();
    const result = await pizarraServices.generateCode();
    
    if (result.success) {
      try {
        // Use appropriate verification method based on framework
        let correctedCode: string;
        if (pizarraState.selectedFramework.value === 'flutter') {
          correctedCode = await AIService.correctFlutterCode(pizarraServices.generatedCode.value);
        } else if (pizarraState.selectedFramework.value === 'angular') {
          correctedCode = await AIService.correctAngularCode(pizarraServices.generatedCode.value);
        } else {
          correctedCode = pizarraServices.generatedCode.value;
        }
        
        // Check if code needed corrections
        const isValid = correctedCode === pizarraServices.generatedCode.value;
        
        // Set verification result
        codeVerificationResult.value = {
          isValid,
          message: isValid
            ? `El código ${pizarraState.selectedFramework.value.toUpperCase()} es válido y sigue las mejores prácticas.`
            : `Se encontraron problemas en el código ${pizarraState.selectedFramework.value.toUpperCase()}. Se han aplicado correcciones automáticamente.`
        };
        
        // If code needed corrections, automatically apply them
        if (!isValid) {
          codeCorrectedCode.value = correctedCode;
          codeHasCorrections.value = true;
          console.log('🔧 Code corrections applied');
          
          // Automatically apply corrections
          pizarraServices.generatedCode.value = correctedCode;
          console.log('✅ Code automatically updated with corrections');
        } else {
          console.log('✅ Code verification passed, no corrections needed');
        }
      } catch (verifyError) {
        console.error('❌ Error verifying code:', verifyError);
        codeVerificationResult.value = {
          isValid: false,
          message: 'Error al verificar el código. Se mostrará el código original.'
        };
      } finally {
        isVerifyingCode.value = false;
      }
      
      // Show the code viewer modal
      toggleCodeViewer();
    } else {
      console.error('❌ Error generating code:', result.error);
      alert(`Error generating code: ${result.error || 'Unknown error'}`);
      isVerifyingCode.value = false;
    }
  } catch (error) {
    console.error('❌ Error in handleCodeViewerToggle:', error);
    alert('Error generating code. Please try again.');
    isVerifyingCode.value = false;
  }
};
```

### CodeViewerModal.vue

```typescript
// Props to accept initial verification results
interface Props {
  show: boolean;
  code: string;
  framework: string;
  pizarra?: any;
  initialVerificationResult?: { isValid: boolean; message: string } | null;
  initialCorrectedCode?: string | null;
  initialHasCorrections?: boolean;
}

// Initialize state from props
onMounted(() => {
  parseCodeByScreens();
  
  // Initialize verification state from props if available
  if (props.initialVerificationResult) {
    verificationResult.value = props.initialVerificationResult;
  }
  
  if (props.initialCorrectedCode) {
    correctedCode.value = props.initialCorrectedCode;
  }
  
  if (props.initialHasCorrections !== undefined) {
    hasCorrections.value = props.initialHasCorrections;
  }
  
  // If we have initial verification results, set the active tab to 'code'
  if (props.initialVerificationResult) {
    activeTab.value = 'code';
  }
});
```

### AIService.ts

```typescript
// Corrects Angular code
static async correctAngularCode(angularCode: string): Promise<string> {
  return await this.widgetParser.correctAngularCode(angularCode);
}

// Verifies project code before download
static async verifyProjectBeforeDownload(
  code: string, 
  framework: string,
  progressCallback?: (progress: number, total: number, currentFile: string) => void
): Promise<{
  isValid: boolean;
  fileResults: Record<string, { isValid: boolean; correctedCode?: string; message: string }>;
  correctedProjectCode?: string;
}> {
  try {
    // Extract files from project code
    const files = this.extractFilesFromProject(code, framework);
    
    // Verify all files
    const verificationResult = await this.verifyProjectFiles(files, framework, progressCallback);
    
    // If all files are valid, return the original code
    if (verificationResult.isValid) {
      return {
        isValid: true,
        fileResults: verificationResult.fileResults
      };
    }
    
    // If some files need correction, create corrected project code
    let correctedProjectCode = code;
    
    // Replace each section of code that needs correction
    Object.entries(verificationResult.fileResults).forEach(([filePath, result]) => {
      if (!result.isValid && result.correctedCode) {
        // Framework-specific code replacement logic
        // ...
      }
    });
    
    return {
      isValid: false,
      fileResults: verificationResult.fileResults,
      correctedProjectCode
    };
  } catch (error) {
    console.error('Error verifying project before download:', error);
    throw error;
  }
}
```

### UnifiedCodeGenerationService.ts

```typescript
// Enhanced parseAngularCode method
private static parseAngularCode(code: string): Record<string, string> {
  const files: Record<string, string> = {};

  // Extract component files
  const componentMatches = code.matchAll(/\/\/ (\w+)\.component\.ts[\s\S]*?export class (\w+)Component[\s\S]*?}/g);
  for (const match of componentMatches) {
    const componentName = match[1];
    const componentClassName = match[2];
    
    // Add TypeScript file
    files[`src/app/${componentName}/${componentName}.component.ts`] = match[0].replace(`// ${componentName}.component.ts`, '');
    
    // Generate HTML template if not found
    // ...
    
    // Generate SCSS styles if not found
    // ...
  }

  // Extract routing and module files with closing braces
  const routingMatch = code.match(/\/\/ app-routing\.module\.ts[\s\S]*?export class AppRoutingModule[\s\S]*?}/);
  const moduleMatch = code.match(/\/\/ app\.module\.ts[\s\S]*?export class AppModule[\s\S]*?}/);
  
  // ...

  return files;
}
```

## User Interface Changes

The user interface has been enhanced to provide a better experience with the automatic code optimization feature:

1. **Loading Indicator**: When generating code, a loading indicator shows that the code is being optimized.
2. **Verification Results**: When the Code Viewer modal opens, verification results are immediately displayed.
3. **Automatic Correction**: If issues are found, the corrected code is automatically displayed.
4. **Pre-Download Verification**: When downloading code, a progress indicator shows the verification status.

## Benefits

The automatic code optimization feature provides several benefits:

1. **Improved User Experience**: Users see optimized code without having to manually verify it.
2. **Higher Code Quality**: All code is automatically verified and optimized before being displayed or downloaded.
3. **Time Saving**: Users don't need to manually fix common issues in the generated code.
4. **Educational Value**: Users learn about best practices for the selected framework.
5. **Reduced Errors**: Users are less likely to encounter compilation errors when using the generated code.

## Examples

### Before Optimization (Angular)

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule
```

### After Optimization (Angular)

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Before Optimization (Flutter)

```dart
void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      home: Scaffold(
        appBar: AppBar(
          title: Text('Flutter Demo'),
        ),
        body: Center(
          child: Text('Hello World'),
        ),
      ),
    );
  }
}
```

### After Optimization (Flutter)

```dart
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Flutter Demo'),
        ),
        body: const Center(
          child: Text('Hello World'),
        ),
      ),
    );
  }
}
```

## Conclusion

The automatic code optimization feature significantly enhances the Code Viewer component by ensuring that users always see high-quality, optimized code that follows best practices for the selected framework. By automatically verifying and optimizing code before displaying it, we provide a more seamless and educational experience that helps users create better applications.

The feature has been thoroughly tested and documented, and is ready for production use. Users can now focus on designing their applications rather than fixing common issues in the generated code.
