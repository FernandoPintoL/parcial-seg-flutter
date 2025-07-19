import { ref } from 'vue';
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { UnifiedCollaborationService } from '@/services/UnifiedCollaborationService';
import { UnifiedCodeGenerationService } from '@/services/UnifiedCodeGenerationService';
import { DiagramProcessingService } from '@/services/DiagramProcessingService';
import { AIService } from '@/services/AIService';
import { ImageProcessingService } from '@/services/ImageProcessingService';
import { getSocketConfig } from '@/lib/socketConfig';
import type { PizarraUnificada, CodeExportOptions, UnifiedElement } from '@/Data/PizarraUnificada';

export interface UsePizarraServicesProps {
    pizarra: PizarraUnificada;
    user: { name: string };
}

export function usePizarraServices(props: UsePizarraServicesProps) {
    // Socket configuration
    const useLocalSocket = ref(import.meta.env.VITE_USE_LOCAL_SOCKET === 'true');
    const socketConfig = ref(getSocketConfig(useLocalSocket.value));
    const roomId = ref<string | null>(props.pizarra?.room_id || null);
    const currentUser = ref(props.user?.name || 'Usuario');
    const socketConnected = ref<boolean>(false);

    // Initialize collaboration service
    let collaborationService: UnifiedCollaborationService;

    // Export options
    const exportOptions = ref<CodeExportOptions>({
        framework: 'both',
        format: 'preview',
        includeTests: false,
        includeDocumentation: false,
        version: 'latest',
        theme: 'default'
    });

    // AI Chat state
    const aiMessages = ref<any[]>([]);
    const aiPrompt = ref<string>('');
    const isProcessingAI = ref<boolean>(false);

    // Collaboration Chat state
    const unreadMessages = ref<number>(0);

    // Image processing state
    const selectedImage = ref<File | null>(null);
    const previewImage = ref<string | null>(null);
    const isProcessingImage = ref<boolean>(false);

    // Diagram processing state
    const selectedDiagramFile = ref<File | null>(null);
    const diagramContent = ref<string>('');
    const diagramType = ref<'image' | 'xml' | 'plantuml' | 'text'>('image');
    const isProcessingDiagram = ref<boolean>(false);

    // Code generation state
    const generatedCode = ref<string>('');

    // Initialize collaboration
    const initializeCollaboration = () => {
        if (roomId.value) {
            collaborationService = new UnifiedCollaborationService(
                socketConfig.value,
                roomId.value,
                currentUser.value
            );
            collaborationService.connect();
            socketConnected.value = true;
        }
    };

    // Save pizarra data
    const savePizarra = async (data: {
        name: string;
        type: string;
        screens: any[];
        elements: any[];
    }) => {
        try {
            await axios.put(`/api/pizarra_unificada/${props.pizarra.id}`, data);
            console.log('Pizarra saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving pizarra:', error);
            await AlertService.prototype.error('Error', 'No se pudo guardar la pizarra');
            return false;
        }
    };

    // AI functionality
    const sendAIPrompt = async (onCodeParsed?: (code: string) => void) => {
        if (!aiPrompt.value.trim() || isProcessingAI.value) {
            return;
        }

        aiMessages.value.push({
            text: aiPrompt.value,
            isUser: true,
            timestamp: Date.now(),
        });

        const prompt = aiPrompt.value;
        aiPrompt.value = '';
        isProcessingAI.value = true;

        try {
            const result = await AIService.sendAIPrompt(
                prompt,
                aiMessages.value,
                isProcessingAI.value,
                onCodeParsed || ((code: string) => console.log('Parsing AI code:', code))
            );

            aiMessages.value = result.aiMessages;
            isProcessingAI.value = result.isProcessingAI;
        } catch (error: any) {
            console.error('Error AI:', error);
            aiMessages.value.push({
                text: `Error: ${error.message || 'Error interno del servidor'}`,
                isUser: false,
                timestamp: Date.now(),
            });
            isProcessingAI.value = false;
        }
    };

    // Image processing
    const handleImageUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            selectedImage.value = input.files[0];

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.value = e.target?.result as string;
            };
            reader.readAsDataURL(selectedImage.value);
        }
    };

    const clearSelectedImage = () => {
        selectedImage.value = null;
        previewImage.value = null;
    };

    const processImage = async (onWidgetsAdded: (widgets: any[]) => void) => {
        if (!selectedImage.value) return false;

        try {
            isProcessingImage.value = true;
            const result = await ImageProcessingService.processImage(
                selectedImage.value,
                Date.now(),
                onWidgetsAdded
            );

            if (result.success) {
                await AlertService.prototype.success('Éxito', 'Imagen procesada correctamente');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error processing image:', error);
            await AlertService.prototype.error('Error', error.message || 'Error al procesar la imagen');
            return false;
        } finally {
            isProcessingImage.value = false;
        }
    };

    // Diagram processing
    const handleDiagramFileUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            selectedDiagramFile.value = input.files[0];

            if (selectedDiagramFile.value.type.includes('image')) {
                diagramType.value = 'image';
            } else if (selectedDiagramFile.value.name.endsWith('.xml')) {
                diagramType.value = 'xml';
                const reader = new FileReader();
                reader.onload = (e) => {
                    diagramContent.value = e.target?.result as string;
                };
                reader.readAsText(selectedDiagramFile.value);
            } else if (selectedDiagramFile.value.name.endsWith('.puml') || selectedDiagramFile.value.name.endsWith('.plantuml')) {
                diagramType.value = 'plantuml';
                const reader = new FileReader();
                reader.onload = (e) => {
                    diagramContent.value = e.target?.result as string;
                };
                reader.readAsText(selectedDiagramFile.value);
            }
        }
    };

    const clearDiagramData = () => {
        selectedDiagramFile.value = null;
        diagramContent.value = '';
        diagramType.value = 'image';
    };

    const processDiagram = async (framework: string, onElementsAdded: (elements: any[]) => void) => {
        if (!selectedDiagramFile.value && !diagramContent.value) return false;

        try {
            isProcessingDiagram.value = true;
            let result;

            if (diagramType.value === 'image' && selectedDiagramFile.value) {
                result = await DiagramProcessingService.processImageDiagram(
                    selectedDiagramFile.value,
                    Date.now()
                );
            } else if (diagramType.value === 'xml' && diagramContent.value) {
                result = await DiagramProcessingService.processXMLDiagram(diagramContent.value);
            } else if (diagramType.value === 'plantuml' && diagramContent.value) {
                result = await DiagramProcessingService.processPlantUMLDiagram(diagramContent.value);
            }

            if (result?.success && result.data) {
                const elements = DiagramProcessingService.convertDiagramToUnifiedElements(
                    result.data.elements,
                    framework,
                    Date.now()
                );

                onElementsAdded(elements);
                await AlertService.prototype.success('Éxito', 'Diagrama procesado correctamente');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error processing diagram:', error);
            await AlertService.prototype.error('Error', error.message || 'Error al procesar el diagrama');
            return false;
        } finally {
            isProcessingDiagram.value = false;
        }
    };

    // Code generation
    const generateCode = (pizarra: PizarraUnificada, options: CodeExportOptions) => {
        generatedCode.value = UnifiedCodeGenerationService.generateCode(pizarra, options);
        return generatedCode.value;
    };

    const downloadCode = (projectName: string, framework: string) => {
        if (!generatedCode.value) {
            return false;
        }

        const element = document.createElement('a');
        const file = new Blob([generatedCode.value], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${projectName}-${framework}-code.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        return true;
    };

    const copyCode = async () => {
        if (!generatedCode.value) {
            return false;
        }

        try {
            await navigator.clipboard.writeText(generatedCode.value);
            await AlertService.prototype.success('Éxito', 'Código copiado al portapapeles');
            return true;
        } catch (error) {
            console.error('Error copying code:', error);
            await AlertService.prototype.error('Error', 'No se pudo copiar el código');
            return false;
        }
    };

    // Collaboration
    const emitElementAdded = (element: UnifiedElement, screenId: string) => {
        if (collaborationService) {
            collaborationService.emitElementAdded(element, screenId);
        }
    };

    const emitElementUpdated = (element: UnifiedElement, screenId: string) => {
        if (collaborationService) {
            collaborationService.emitElementUpdated(element, screenId);
        }
    };

    const emitElementDeleted = (elementId: string, screenId: string) => {
        if (collaborationService) {
            collaborationService.emitElementDeleted(elementId, screenId);
        }
    };

    const emitElementSelected = (element: UnifiedElement, screenId: string) => {
        if (collaborationService) {
            collaborationService.emitElementSelected(element, screenId);
        }
    };

    const emitFrameworkSwitched = (framework: string) => {
        if (collaborationService) {
            collaborationService.emitFrameworkSwitched(framework);
        }
    };

    // Cleanup
    const disconnect = () => {
        if (collaborationService) {
            collaborationService.disconnect();
        }
    };

    return {
        // State
        socketConnected,
        currentUser,
        exportOptions,
        aiMessages,
        aiPrompt,
        isProcessingAI,
        unreadMessages,
        selectedImage,
        previewImage,
        isProcessingImage,
        selectedDiagramFile,
        diagramContent,
        diagramType,
        isProcessingDiagram,
        generatedCode,

        // Actions
        initializeCollaboration,
        savePizarra,
        sendAIPrompt,
        handleImageUpload,
        clearSelectedImage,
        processImage,
        handleDiagramFileUpload,
        clearDiagramData,
        processDiagram,
        generateCode,
        downloadCode,
        copyCode,
        emitElementAdded,
        emitElementUpdated,
        emitElementDeleted,
        emitElementSelected,
        emitFrameworkSwitched,
        disconnect
    };
} 