<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { AIService } from '@/services/AIService';

interface Props {
  show: boolean;
  code: string;
  framework: string;
  pizarra?: any;
  initialVerificationResult?: { isValid: boolean; message: string } | null;
  initialCorrectedCode?: string | null;
  initialHasCorrections?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'copy'): void;
  (e: 'download', type: 'single' | 'complete', verifiedCode?: string): void;
  (e: 'update-code', code: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const activeTab = ref('structure');
const selectedScreen = ref('all');
const isVerifying = ref(false);
const verificationResult = ref<{ isValid: boolean; message: string } | null>(null);
const parsedCode = ref<Record<string, string>>({});
const downloadType = ref<'single' | 'complete'>('single');
const showInstructions = ref(false);
const correctedCode = ref<string | null>(null);
const hasCorrections = ref(false);
const isVerifyingBeforeDownload = ref(false);
const verificationProgress = ref({ current: 0, total: 0, file: '' });
const fileVerificationResults = ref<Record<string, { isValid: boolean; correctedCode?: string; message: string }>>({});
const showImprovingDialog = ref(false);

// Computed properties
const fileExtension = computed(() => getFileExtension(props.framework));

const frameworkStructure = computed(() => {
  if (props.framework === 'angular') {
    return {
      name: 'Angular',
      structure: [
        { name: 'src/app', type: 'folder', description: 'Main application code' },
        { name: 'src/app/components', type: 'folder', description: 'UI components' },
        { name: 'src/app/services', type: 'folder', description: 'Services for data handling' },
        { name: 'src/app/app.module.ts', type: 'file', description: 'Main module configuration' },
        { name: 'src/app/app-routing.module.ts', type: 'file', description: 'Routing configuration' },
        { name: 'src/assets', type: 'folder', description: 'Static assets like images' },
        { name: 'angular.json', type: 'file', description: 'Angular CLI configuration' },
        { name: 'package.json', type: 'file', description: 'Dependencies and scripts' }
      ]
    };
  } else if (props.framework === 'flutter') {
    return {
      name: 'Flutter',
      structure: [
        { name: 'lib', type: 'folder', description: 'Main application code' },
        { name: 'lib/screens', type: 'folder', description: 'UI screens' },
        { name: 'lib/widgets', type: 'folder', description: 'Reusable widgets' },
        { name: 'lib/services', type: 'folder', description: 'Services for data handling' },
        { name: 'lib/main.dart', type: 'file', description: 'Application entry point' },
        { name: 'assets', type: 'folder', description: 'Static assets like images' },
        { name: 'pubspec.yaml', type: 'file', description: 'Dependencies and configuration' }
      ]
    };
  }
  return { name: 'Unknown', structure: [] };
});

const displayCode = computed(() => {
  // If we have corrected code and we're showing all screens, use the corrected code
  if (correctedCode.value && selectedScreen.value === 'all') {
    return correctedCode.value;
  }

  // If we're showing a specific screen
  if (selectedScreen.value !== 'all' && parsedCode.value) {
    return parsedCode.value[selectedScreen.value] || props.code;
  }

  // Default to original code
  return props.code;
});

const installInstructions = computed(() => {
  if (props.framework === 'angular') {
    return `
# Angular Installation Instructions

## Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

## Steps to run the project
1. Extract the downloaded ZIP file
2. Open a terminal and navigate to the project folder
3. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
4. Start the development server:
   \`\`\`
   npm start
   \`\`\`
5. Open your browser and navigate to http://localhost:4200

## Project Structure
- \`src/app\`: Contains all the application components and modules
- \`src/assets\`: Contains static assets like images
- \`src/environments\`: Contains environment configuration

## Additional Commands
- Build for production: \`npm run build\`
- Run tests: \`npm test\`
`;
  } else if (props.framework === 'flutter') {
    return `
# Flutter Installation Instructions

## Prerequisites
- Flutter SDK (v3.0 or later)
- Dart SDK (v2.17 or later)
- Android Studio or VS Code with Flutter extensions

## Steps to run the project
1. Extract the downloaded ZIP file
2. Open a terminal and navigate to the project folder
3. Install dependencies:
   \`\`\`
   flutter pub get
   \`\`\`
4. Run the application:
   \`\`\`
   flutter run
   \`\`\`

## Project Structure
- \`lib\`: Contains all the Dart code for the application
- \`lib/screens\`: Contains screen widgets
- \`lib/widgets\`: Contains reusable widgets
- \`assets\`: Contains static assets like images

## Additional Commands
- Build APK: \`flutter build apk\`
- Run tests: \`flutter test\`
`;
  }
  return '';
});

// Methods
const copyCode = () => {
  if (props.code) {
    navigator.clipboard.writeText(props.code);
    emit('copy');
  }
};

const applyCorrections = () => {
  if (!correctedCode.value) return;

  // Emit the corrected code to the parent component
  emit('update-code', correctedCode.value);

  // Update the parsed code based on the corrected code
  parseCodeByScreens();

  // Show success message
  verificationResult.value = {
    isValid: true,
    message: `El código ha sido corregido automáticamente y ahora sigue las mejores prácticas.`
  };

  // Reset correction state
  hasCorrections.value = false;
  correctedCode.value = null;
};

const proceedWithDownload = () => {
  if (downloadType.value === 'single') {
    downloadSingleFile();
  } else {
    downloadCompleteProject();
  }

  // Pass the corrected code if available, otherwise use the original code
  const codeToDownload = correctedCode.value || props.code;
  emit('download', downloadType.value, codeToDownload);
};

const verifyAndCorrectBeforeDownload = async () => {
  if (!props.code) return;
  isVerifyingBeforeDownload.value = true;
  verificationProgress.value = { current: 0, total: 0, file: 'Verificando y corrigiendo código...' };
  fileVerificationResults.value = {};
  try {
    const functionalCode = getFunctionalCodeOnly();
    let corrected = functionalCode;
    let isValid = true;
    if (props.framework === 'flutter') {
      corrected = await AIService.correctFlutterCode(functionalCode);
      isValid = corrected === functionalCode;
      console.log('🤖 AI Response (Flutter) - Código corregido (primeras 200 chars):', corrected.substring(0, 200));
      console.log('🔍 AI Response (Flutter) - ¿Contiene imports?', corrected.includes('import'));
    } else if (props.framework === 'angular') {
      corrected = await AIService.correctAngularCode(functionalCode);
      isValid = corrected === functionalCode;
      console.log('🤖 AI Response (Angular) - Código corregido (primeras 200 chars):', corrected.substring(0, 200));
      console.log('🔍 AI Response (Angular) - ¿Contiene imports?', corrected.includes('import'));
      console.log('🔍 AI Response (Angular) - ¿Contiene archivos .html?', corrected.includes('.component.html'));
      console.log('🔍 AI Response (Angular) - ¿Contiene archivos .scss?', corrected.includes('.component.scss'));
    }
    if (!isValid) {
      correctedCode.value = corrected;
      hasCorrections.value = true;
      console.log('✏️ Código corregido guardado para descarga');
    } else {
      correctedCode.value = null;
      hasCorrections.value = false;
      console.log('✅ Código validado sin cambios');
    }
    verificationResult.value = {
      isValid: isValid,
      message: isValid
        ? 'El código es válido y sigue las mejores prácticas.'
        : 'Se aplicaron correcciones automáticas antes de la descarga.'
    };
    proceedWithDownload();
  } catch (error) {
      console.error('Error verifying/correcting code before download:', error);
    verificationResult.value = {
      isValid: false,
      message: 'Error al verificar/corregir el código antes de la descarga.'
    };
  } finally {
    isVerifyingBeforeDownload.value = false;
  }
};

const downloadCode = async () => {
  if (isVerifyingBeforeDownload.value) return;
  await verifyAndCorrectBeforeDownload();
};

// These functions are now just placeholders since the actual download
// is handled by the parent component through the 'download' event
const downloadSingleFile = () => {
  console.log('Requesting single file download');
  // The actual download is handled by the parent component
};

const downloadCompleteProject = () => {
  console.log('Requesting complete project download');
  // The actual download is handled by the parent component
};

// Extrae solo el código funcional (sin archivos de configuración)
const getFunctionalCodeOnly = () => {
  if (props.framework === 'flutter') {
    // Extrae imports + clases Dart (widgets, servicios, etc.)
    // Mantener los imports y las clases, pero excluir archivos de configuración
    const codeBlocks = [];

    // Extraer todos los imports
    const imports = props.code.match(/import\s+[^;]+;/g);
    if (imports) {
      codeBlocks.push(imports.join('\n'));
      console.log('✅ getFunctionalCodeOnly - Imports encontrados:', imports.length);
    } else {
      console.log('❌ getFunctionalCodeOnly - NO se encontraron imports');
    }

    // Extraer todas las clases
    const classMatches = props.code.match(/class [\s\S]*?\n}/g);
    if (classMatches) {
      codeBlocks.push(...classMatches);
      console.log('✅ getFunctionalCodeOnly - Clases encontradas:', classMatches.length);
    }

    const result = codeBlocks.length > 0 ? codeBlocks.join('\n\n') : props.code;
    console.log('📝 getFunctionalCodeOnly - Código enviado a AI (primeras 200 chars):', result.substring(0, 200));
    return result;
  } else if (props.framework === 'angular') {
    // Extrae solo los archivos de componentes, servicios y módulos (manteniendo imports y estructura completa)
    const codeBlocks = [];

    // Extraer archivos .ts de componentes, servicios y módulos (con sus imports)
    const tsMatches = props.code.match(/\/\/ [\w\-.]+\.(component|service|module)\.ts[\s\S]*?(?=\/\/ [\w\-.]+\.(component|service|module|html|css)|$)/g);
    if (tsMatches) {
      codeBlocks.push(...tsMatches);
      console.log('✅ getFunctionalCodeOnly (Angular) - Archivos .ts encontrados:', tsMatches.length);
    }

    // Extraer archivos .html de componentes
    const htmlMatches = props.code.match(/\/\/ [\w\-.]+\.component\.html[\s\S]*?(?=\/\/ [\w\-.]+\.(component|service|module|html|css)|$)/g);
    if (htmlMatches) {
      codeBlocks.push(...htmlMatches);
      console.log('✅ getFunctionalCodeOnly (Angular) - Archivos .html encontrados:', htmlMatches.length);
    }

    // Extraer archivos .scss/.css de componentes
    const styleMatches = props.code.match(/\/\/ [\w\-.]+\.component\.(scss|css)[\s\S]*?(?=\/\/ [\w\-.]+\.(component|service|module|html|css)|$)/g);
    if (styleMatches) {
      codeBlocks.push(...styleMatches);
      console.log('✅ getFunctionalCodeOnly (Angular) - Archivos de estilos encontrados:', styleMatches.length);
    }

    if (codeBlocks.length === 0) {
      console.log('❌ getFunctionalCodeOnly (Angular) - NO se encontraron archivos funcionales');
      return props.code;
    }

    const result = codeBlocks.join('\n\n');
    console.log('📝 getFunctionalCodeOnly (Angular) - Código enviado a AI (primeras 200 chars):', result.substring(0, 200));
    console.log('🔍 getFunctionalCodeOnly (Angular) - ¿Contiene imports?', result.includes('import'));
    return result;
  }
  return props.code;
};

const verifyCode = async () => {
  if (!props.code) return;
  isVerifying.value = true;
  verificationResult.value = null;
  correctedCode.value = null;
  hasCorrections.value = false;
  try {
    let result;
    if (props.framework === 'flutter') {
      // Solo envía el código funcional a la AI
      const functionalCode = getFunctionalCodeOnly();
      const flutterCorrectedCode = await AIService.correctFlutterCode(functionalCode);
      const isValid = flutterCorrectedCode === functionalCode;
      result = {
        isValid,
        message: isValid
          ? 'El código Flutter es válido y sigue las mejores prácticas.'
          : 'Se encontraron problemas en el código Flutter. Se han aplicado correcciones automáticamente.'
      };
      if (!isValid) {
        correctedCode.value = flutterCorrectedCode;
        hasCorrections.value = true;
      }
    } else if (props.framework === 'angular') {
      // Solo envía el código funcional a la AI
      const functionalCode = getFunctionalCodeOnly();
      const angularCorrectedCode = await AIService.correctAngularCode(functionalCode);
      const isValid = angularCorrectedCode === functionalCode;
      result = {
        isValid,
        message: isValid
          ? 'El código Angular es válido y sigue las mejores prácticas.'
          : 'Se encontraron problemas en el código Angular. Se han aplicado correcciones automáticamente.'
      };
      if (!isValid) {
        correctedCode.value = angularCorrectedCode;
        hasCorrections.value = true;
      }
    } else {
      result = {
        isValid: true,
        message: `El código ${props.framework.toUpperCase()} ha sido verificado y parece correcto.`
      };
    }
    verificationResult.value = result;
  } catch (error) {
    console.error('Error verifying code:', error);
    verificationResult.value = {
      isValid: false,
      message: 'Error al verificar el código. Por favor, inténtelo de nuevo.'
    };
  } finally {
    isVerifying.value = false;
  }
};

const parseCodeByScreens = () => {
  // Use corrected code if available, otherwise use original code
  const codeToUse = correctedCode.value || props.code;
  if (!codeToUse) return;

  const result: Record<string, string> = {};

  if (props.framework === 'angular') {
    // Parse Angular code by components
    const componentMatches = codeToUse.matchAll(/\/\/ (\w+)\.component\.ts[\s\S]*?export class (\w+)Component[\s\S]*?}/g);
    for (const match of componentMatches) {
      const componentName = match[1];
      result[componentName] = match[0];
    }
  } else if (props.framework === 'flutter') {
    // Parse Flutter code by screen classes
    const screenMatches = codeToUse.matchAll(/class (\w+) extends StatelessWidget[\s\S]*?}/g);
    for (const match of screenMatches) {
      const screenName = match[1];
      if (screenName !== 'MyApp' && screenName !== 'NavigationDrawer') {
        result[screenName] = match[0];
      }
    }
  }

  parsedCode.value = result;
};

const getFileExtension = (framework: string): string => {
  const extensions: Record<string, string> = {
    'flutter': 'dart',
    'react': 'jsx',
    'vue': 'vue',
    'angular': 'ts',
    'html': 'html',
    'css': 'css'
  };
  return extensions[framework.toLowerCase()] || 'txt';
};

// Lifecycle hooks
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
    hasCorrections.value = props.initialHasCorrecciones;
  }

  // If we have initial verification results, set the active tab to 'code'
  if (props.initialVerificationResult) {
    activeTab.value = 'code';
  }
});

watch(() => props.code, () => {
  parseCodeByScreens();
});

watch(() => props.show, async (newValue) => {
  if (newValue) {
    showImprovingDialog.value = true;
    // Simula un pequeño retraso para mostrar el mensaje de mejora
    setTimeout(() => {
      showImprovingDialog.value = false;
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
        hasCorrections.value = props.initialHasCorrecciones;
      }
      // If we have initial verification results, set the active tab to 'code'
      if (props.initialVerificationResult) {
        activeTab.value = 'code';
      }
    }, 1200); // 1.2 segundos para UX
  }
});
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
      <!-- Dialogo de mejora -->
      <div v-if="showImprovingDialog" class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-50">
        <span class="material-icons text-5xl text-blue-500 mb-4 animate-spin">autorenew</span>
        <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">Mejorando el código, por favor espera...</p>
      </div>
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-blue-500 text-2xl">code</span>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              Código Generado ({{ framework.toUpperCase() }})
            </h3>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="copyCode"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
              <span class="material-icons text-sm">content_copy</span>
              <span>Copiar</span>
            </button>
<!--            <button @click="downloadCode"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
              <span class="material-icons text-sm">download</span>
              <span>Descargar</span>
            </button>-->
            <button @click="verifyCode"
              class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
              :disabled="isVerifying">
              <span class="material-icons text-sm">verified</span>
              <span>{{ isVerifying ? 'Verificando...' : 'Verificar Código' }}</span>
            </button>
            <button @click="$emit('close')"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <span class="material-icons text-gray-500">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <div class="flex">
          <button
            @click="activeTab = 'code'"
            :class="[
              'px-4 py-2 font-medium text-sm',
              activeTab === 'code'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            Código
          </button>
          <button
            @click="activeTab = 'structure'"
            :class="[
              'px-4 py-2 font-medium text-sm',
              activeTab === 'structure'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            Estructura
          </button>
          <button
            @click="activeTab = 'download'"
            :class="[
              'px-4 py-2 font-medium text-sm',
              activeTab === 'download'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            Descargar
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[70vh]">
        <!-- Code Tab -->
        <div v-if="activeTab === 'code'" class="space-y-4">
          <!-- Screen selector -->
          <div class="flex items-center space-x-2 mb-4">
            <label class="text-gray-700 dark:text-gray-300 font-medium">Pantalla:</label>
            <select
              v-model="selectedScreen"
              class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="all">Todas las pantallas</option>
              <option v-for="key in Object.keys(parsedCode)" :key="key" :value="key">
                {{ key }}
              </option>
            </select>
          </div>

          <!-- Verification progress -->
          <div v-if="isVerifyingBeforeDownload" class="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg mb-4">
            <div class="flex items-center">
              <div class="animate-spin mr-2">
                <span class="material-icons">refresh</span>
              </div>
              <div>
                <p class="font-medium">Verificando archivos del proyecto...</p>
                <p class="text-sm">
                  {{ verificationProgress.current }} de {{ verificationProgress.total }} archivos verificados
                </p>
                <p class="text-sm italic">
                  {{ verificationProgress.file }}
                </p>
              </div>
            </div>
            <div v-if="verificationProgress.total > 0" class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div class="bg-blue-600 h-2.5 rounded-full" :style="{width: `${(verificationProgress.current / verificationProgress.total) * 100}%`}"></div>
            </div>
          </div>

          <!-- Verification result -->
          <div v-if="verificationResult && !isVerifyingBeforeDownload" :class="[
            'p-4 rounded-lg mb-4',
            verificationResult.isValid ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          ]">
            <div class="flex items-start justify-between">
              <div class="flex items-start">
                <span class="material-icons mr-2">
                  {{ verificationResult.isValid ? 'check_circle' : 'error' }}
                </span>
                <p>{{ verificationResult.message }}</p>
              </div>
              <button
                v-if="hasCorrections"
                @click="applyCorrections"
                class="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
              >
                <span class="material-icons text-sm mr-1">auto_fix_high</span>
                Aplicar correcciones
              </button>
            </div>

            <!-- File verification results -->
            <div v-if="Object.keys(fileVerificationResults).length > 0" class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <p class="font-medium mb-2">Resultados de verificación por archivo:</p>
              <div class="max-h-40 overflow-y-auto">
                <div
                  v-for="(result, filePath) in fileVerificationResults"
                  :key="filePath"
                  :class="[
                    'p-2 mb-1 rounded text-sm',
                    result.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                  ]"
                >
                  <div class="flex items-start">
                    <span class="material-icons text-sm mr-1 mt-0.5">
                      {{ result.isValid ? 'check_circle' : 'error' }}
                    </span>
                    <div>
                      <p class="font-mono">{{ filePath }}</p>
                      <p class="text-xs mt-1">{{ result.message }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Code display -->
          <pre class="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm font-mono border">{{ displayCode || 'Generando código...' }}</pre>
        </div>

        <!-- Structure Tab -->
        <div v-else-if="activeTab === 'structure'" class="space-y-4">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Estructura del proyecto {{ frameworkStructure.name }}
          </h4>
          <div class="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
            <ul class="space-y-2">
              <li v-for="item in frameworkStructure.structure" :key="item.name" class="flex items-start">
                <span class="material-icons text-blue-500 mr-2">
                  {{ item.type === 'folder' ? 'folder' : 'description' }}
                </span>
                <div>
                  <p class="font-mono text-gray-800 dark:text-gray-200">{{ item.name }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ item.description }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Download Tab -->
        <div v-else-if="activeTab === 'download'" class="space-y-4">
          <div class="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Opciones de descarga
            </h4>

            <div class="space-y-4">
              <div class="flex items-center space-x-2">
                <input
                  type="radio"
                  id="single-file"
                  name="download-type"
                  value="single"
                  v-model="downloadType"
                  class="text-blue-500"
                >
                <label for="single-file" class="text-gray-700 dark:text-gray-300">
                  Archivo único ({{ fileExtension }})
                </label>
              </div>

              <div class="flex items-center space-x-2">
                <input
                  type="radio"
                  id="complete-project"
                  name="download-type"
                  value="complete"
                  v-model="downloadType"
                  class="text-blue-500"
                >
                <label for="complete-project" class="text-gray-700 dark:text-gray-300">
                  Proyecto completo con instrucciones
                </label>
              </div>

              <div v-if="downloadType === 'complete'" class="mt-4">
                <button
                  @click="showInstructions = !showInstructions"
                  class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                >
                  <span class="material-icons text-sm mr-1">{{ showInstructions ? 'visibility_off' : 'visibility' }}</span>
                  {{ showInstructions ? 'Ocultar instrucciones' : 'Ver instrucciones' }}
                </button>

                <div v-if="showInstructions" class="mt-4 bg-gray-200 dark:bg-gray-800 p-4 rounded-lg">
                  <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">{{ installInstructions }}</pre>
                </div>
              </div>

              <div class="mt-6">
                <button
                  @click="downloadCode"
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span class="material-icons text-sm">download</span>
                  <span>Descargar {{ downloadType === 'single' ? 'Archivo' : 'Proyecto' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
