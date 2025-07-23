# Pre-Code Verification Feature

## Overview

The Code Viewer component has been enhanced with automatic code verification before displaying the code to the user. This feature ensures that users always see code that is correctly structured and follows best practices for the selected framework.

## Key Features

1. **Automatic Verification Before Display**: Code is automatically verified before the Code Viewer modal is opened
2. **Framework-Specific Verification**: Verification is tailored to the specific framework (Angular or Flutter)
3. **Immediate Feedback**: Users see verification results as soon as the modal opens
4. **Automatic Correction**: If issues are found, the system automatically generates corrected code that can be applied with one click
5. **Seamless Integration**: The verification process happens in the background while the code is being generated

## How It Works

### Verification Process

1. When a user clicks the "Code Viewer" button, the system generates code for the selected framework
2. Before opening the Code Viewer modal, the system automatically verifies the generated code:
   - For Flutter: Uses AIService.correctFlutterCode to check if the code needs corrections
   - For Angular: Uses AIService.correctAngularCode to check if the code needs corrections
3. The system compares the corrected code with the original to determine if any issues were found
4. The verification results are stored in state variables (codeVerificationResult, codeCorrectedCode, codeHasCorrections)
5. The Code Viewer modal is opened with the verification results passed as props

### User Experience

When the Code Viewer modal opens:
- If the code is valid, a green notification appears confirming that the code follows best practices
- If issues are found, a red notification appears with an "Apply Corrections" button
- Users can apply the corrections with one click, or continue with the original code
- The verification results are displayed immediately, without requiring the user to manually click the "Verify Code" button

## Benefits

1. **Improved User Experience**: Users see verification results immediately, without having to manually verify the code
2. **Higher Code Quality**: Users are immediately aware of any issues in the generated code
3. **Time Saving**: The verification process happens in the background while the code is being generated
4. **Reduced Errors**: Users are less likely to download code with issues
5. **Educational**: Users learn about best practices for the selected framework

## Technical Implementation

The pre-verification feature is implemented across several components:

1. **PizarraUnificadaCore.vue**:
   - Added state variables to store verification results:
     ```typescript
     const codeVerificationResult = ref<{ isValid: boolean; message: string } | null>(null);
     const codeCorrectedCode = ref<string | null>(null);
     const codeHasCorrections = ref<boolean>(false);
     const isVerifyingCode = ref<boolean>(false);
     ```
   - Enhanced the `handleCodeViewerToggle` method to verify code before opening the modal:
     ```typescript
     const handleCodeViewerToggle = async () => {
       try {
         // Reset verification state
         codeVerificationResult.value = null;
         codeCorrectedCode.value = null;
         codeHasCorrections.value = false;
         
         // Save pizarra and generate code
         await savePizarra();
         const result = await pizarraServices.generateCode();
         
         if (result.success) {
           // Verify code before showing the modal
           isVerifyingCode.value = true;
           
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
             
             // If code needed corrections, store the corrected code
             if (!isValid) {
               codeCorrectedCode.value = correctedCode;
               codeHasCorrections.value = true;
             }
           } catch (verifyError) {
             console.error('Error verifying code:', verifyError);
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
           console.error('Error generating code:', result.error);
           alert(`Error generating code: ${result.error || 'Unknown error'}`);
         }
       } catch (error) {
         console.error('Error in handleCodeViewerToggle:', error);
         alert('Error generating code. Please try again.');
       }
     };
     ```
   - Updated the CodeViewerModal component usage to pass verification results as props:
     ```html
     <CodeViewerModal
       v-if="showCodeViewer"
       :show="showCodeViewer"
       :code="pizarraServices.generatedCode.value"
       :framework="pizarraState.selectedFramework.value"
       :pizarra="pizarra"
       :initial-verification-result="codeVerificationResult"
       :initial-corrected-code="codeCorrectedCode"
       :initial-has-corrections="codeHasCorrections"
       @close="() => showCodeViewer = false"
       @download="handleCodeDownload"
       @copy="pizarraServices.copyCode"
       @update-code="handleCodeUpdate"
     />
     ```

2. **CodeViewerModal.vue**:
   - Added props to accept initial verification results:
     ```typescript
     interface Props {
       show: boolean;
       code: string;
       framework: string;
       pizarra?: any;
       initialVerificationResult?: { isValid: boolean; message: string } | null;
       initialCorrectedCode?: string | null;
       initialHasCorrections?: boolean;
     }
     ```
   - Updated the `onMounted` and `watch` hooks to initialize state from props:
     ```typescript
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
     
     watch(() => props.show, (newValue) => {
       if (newValue) {
         parseCodeByScreens();
         
         // Initialize verification state from props if available
         if (props.initialVerificationResult) {
           verificationResult.value = props.initialVerificationResult;
         } else {
           verificationResult.value = null;
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
       }
     });
     ```

## Testing

To test the pre-verification feature:

1. **Generate Code**:
   - Create a project with multiple screens/components
   - Click the "Code Viewer" button to generate code

2. **Observe Verification Results**:
   - The Code Viewer modal should open with verification results already displayed
   - If the code is valid, a green notification should appear
   - If issues are found, a red notification should appear with an "Apply Corrections" button

3. **Apply Corrections**:
   - If issues are found, click the "Apply Corrections" button
   - Verify that the code display updates to show the corrected code
   - Verify that a green notification appears confirming the correction

4. **Test Different Frameworks**:
   - Switch between Angular and Flutter
   - Generate code for each framework
   - Verify that the verification process works correctly for both frameworks

## Conclusion

The pre-verification feature significantly improves the user experience by providing immediate feedback on code quality and offering automatic corrections for any issues found. By verifying code before it's displayed to the user, we ensure that users always have access to high-quality, optimized code that follows framework-specific best practices.
