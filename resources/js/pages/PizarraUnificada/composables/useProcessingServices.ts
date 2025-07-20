// composables/useProcessingServices.ts
import { ref } from 'vue';
import { UnifiedProcessingService } from '@/services/UnifiedProcessingService';

export interface UseProcessingServicesOptions {
    defaultFramework?: 'flutter' | 'angular' | 'both';
}

export function useProcessingServices(options: UseProcessingServicesOptions = {}) {
    const { defaultFramework = 'flutter' } = options;
    
    // Estado reactivo para imágenes
    const selectedImage = ref<File | null>(null);
    const previewImage = ref<string>('');
    const isProcessingImage = ref(false);
    
    // Estado reactivo para diagramas
    const selectedDiagramFile = ref<File | null>(null);
    const diagramContent = ref<string>('');
    const diagramType = ref<string>('mermaid');
    const isProcessingDiagram = ref(false);
    
    // Servicio de procesamiento
    const processingService = new UnifiedProcessingService();
    
    // Métodos para manejo de imágenes
    const handleImageUpload = (file: File) => {
        console.log('📁 Image uploaded:', file.name);
        selectedImage.value = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };
    
    const clearSelectedImage = () => {
        selectedImage.value = null;
        previewImage.value = '';
    };
    
    const processImage = async (addAIWidgetsToCanvas: (widgets: any[]) => void) => {
        try {
            console.log('🖼️ Processing image');
            isProcessingImage.value = true;

            const result = await processingService.processImage({
                selectedImage: selectedImage.value,
                framework: defaultFramework,
                canvasWidth: 400
            });

            if (result.success && result.elements) {
                console.log('✅ Image processed successfully, adding widgets');
                addAIWidgetsToCanvas(result.elements);
                return true;
            } else {
                console.error('❌ Image processing failed:', result.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Error processing image:', error);
            return false;
        } finally {
            isProcessingImage.value = false;
        }
    };
    
    // Métodos para manejo de diagramas
    const handleDiagramFileUpload = (file: File) => {
        console.log('📁 Diagram file uploaded:', file.name);
        selectedDiagramFile.value = file;
        
        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
            diagramContent.value = e.target?.result as string;
        };
        reader.readAsText(file);
    };
    
    const clearDiagramData = () => {
        selectedDiagramFile.value = null;
        diagramContent.value = '';
        diagramType.value = 'mermaid';
    };
    
    const processDiagram = async (framework: string, addAIWidgetsToCanvas: (widgets: any[]) => void) => {
        try {
            console.log('📊 Processing diagram');
            isProcessingDiagram.value = true;

            const result = await processingService.processDiagram({
                selectedFile: selectedDiagramFile.value,
                diagramContent: diagramContent.value,
                diagramType: diagramType.value,
                framework: framework as 'flutter' | 'angular' | 'both',
                canvasWidth: 400
            });

            if (result.success && result.elements) {
                console.log('✅ Diagram processed successfully, adding widgets');
                addAIWidgetsToCanvas(result.elements);
                return true;
            } else {
                console.error('❌ Diagram processing failed:', result.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Error processing diagram:', error);
            return false;
        } finally {
            isProcessingDiagram.value = false;
        }
    };
    
    const processCode = async (code: string, framework: string, addAIWidgetsToCanvas: (widgets: any[]) => void) => {
        try {
            console.log('💻 Processing code');
            
            const result = await processingService.processCode(
                code,
                framework as 'flutter' | 'angular' | 'both',
                400
            );

            if (result.success && result.elements) {
                console.log('✅ Code processed successfully, adding widgets');
                addAIWidgetsToCanvas(result.elements);
                return true;
            } else {
                console.error('❌ Code processing failed:', result.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Error processing code:', error);
            return false;
        }
    };
    
    // Métodos de validación
    const validateImageFile = (file: File): boolean => {
        return processingService.validateImageFile(file);
    };
    
    const validateDiagramFile = (file: File): boolean => {
        return processingService.validateDiagramFile(file);
    };
    
    return {
        // Estado de imágenes
        selectedImage,
        previewImage,
        isProcessingImage,
        
        // Estado de diagramas
        selectedDiagramFile,
        diagramContent,
        diagramType,
        isProcessingDiagram,
        
        // Métodos de imágenes
        handleImageUpload,
        clearSelectedImage,
        processImage,
        
        // Métodos de diagramas
        handleDiagramFileUpload,
        clearDiagramData,
        processDiagram,
        
        // Métodos de código
        processCode,
        
        // Métodos de validación
        validateImageFile,
        validateDiagramFile
    };
} 