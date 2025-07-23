# Test Plan: Automatic Code Optimization Feature

This document outlines the test plan for verifying that the automatic code optimization feature works correctly. The tests cover both Angular and Flutter code optimization.

## Test Environment Setup

Before running the tests, ensure the following:

1. The application is running in development mode
2. You have access to the browser console to view log messages
3. The AI service is properly configured and accessible

## Test Cases

### 1. Flutter Code Optimization Test

#### Test Case 1.1: Basic Flutter Code Optimization

**Input:**
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

**Expected Behavior:**
1. When clicking the "Code Viewer" button, a loading indicator should appear with the message "Optimizing code..."
2. After a brief delay, the Code Viewer modal should open
3. The code displayed should be the optimized version with:
   - `const` constructor for `MyApp`
   - `Key?` parameter in the constructor
   - `const` for `Text` widgets
   - A theme configuration
4. A success message should indicate that the code has been automatically optimized
5. The console should show log messages indicating that the code was optimized

#### Test Case 1.2: Flutter Code with Syntax Errors

**Input:**
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

**Expected Behavior:**
1. When clicking the "Code Viewer" button, a loading indicator should appear
2. After a brief delay, the Code Viewer modal should open
3. The code displayed should be the corrected version with:
   - Fixed syntax error (missing closing brace for the `main` function)
   - Other optimizations as in Test Case 1.1
4. A success message should indicate that the code has been automatically optimized
5. The console should show log messages indicating that the code was optimized

### 2. Angular Code Optimization Test

#### Test Case 2.1: Basic Angular Code Optimization

**Input:**
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

**Expected Behavior:**
1. When clicking the "Code Viewer" button, a loading indicator should appear
2. After a brief delay, the Code Viewer modal should open
3. The code displayed should be the optimized version with:
   - Added closing curly brace for the `AppModule` class
4. A success message should indicate that the code has been automatically optimized
5. The console should show log messages indicating that the code was optimized

#### Test Case 2.2: Angular Component with Missing Files

**Input:**
```typescript
// pantalla-principal.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pantalla-principal',
  templateUrl: './pantalla-principal.component.html',
  styleUrls: ['./pantalla-principal.component.scss']
})
export class PantallaPrincipalComponent implements OnInit {
  
  constructor() { }

  ngOnInit(): void {
  }
}
```

**Expected Behavior:**
1. When clicking the "Code Viewer" button, a loading indicator should appear
2. After a brief delay, the Code Viewer modal should open
3. The code displayed should include:
   - The TypeScript file as provided
   - Generated HTML and SCSS files for the component
4. A success message should indicate that the code has been automatically optimized
5. The console should show log messages indicating that the code was optimized

### 3. Download Functionality Test

#### Test Case 3.1: Download Optimized Flutter Code

**Steps:**
1. Create a Flutter project with some basic widgets
2. Click the "Code Viewer" button to generate and optimize the code
3. Go to the "Download" tab
4. Select "Complete project with instructions"
5. Click the "Download" button

**Expected Behavior:**
1. The download should start automatically
2. The downloaded ZIP file should contain:
   - The optimized Flutter code
   - A complete project structure with all necessary files
   - An instructions file with setup and usage information
3. The console should show log messages indicating that the download was successful

#### Test Case 3.2: Download Optimized Angular Code

**Steps:**
1. Create an Angular project with some basic components
2. Click the "Code Viewer" button to generate and optimize the code
3. Go to the "Download" tab
4. Select "Complete project with instructions"
5. Click the "Download" button

**Expected Behavior:**
1. The download should start automatically
2. The downloaded ZIP file should contain:
   - The optimized Angular code
   - A complete project structure with all necessary files
   - An instructions file with setup and usage information
3. The console should show log messages indicating that the download was successful

## Test Execution

For each test case, follow these steps:

1. Set up the test environment as described above
2. Create a project with the specified input code
3. Execute the test steps
4. Verify the expected behavior
5. Document any deviations from the expected behavior

## Test Results

Document the results of each test case in the following format:

| Test Case | Result | Notes |
|-----------|--------|-------|
| 1.1       | Pass/Fail | Any observations or issues |
| 1.2       | Pass/Fail | Any observations or issues |
| 2.1       | Pass/Fail | Any observations or issues |
| 2.2       | Pass/Fail | Any observations or issues |
| 3.1       | Pass/Fail | Any observations or issues |
| 3.2       | Pass/Fail | Any observations or issues |

## Conclusion

Summarize the overall test results and any issues that need to be addressed. If all tests pass, the automatic code optimization feature is working correctly and ready for production use.
