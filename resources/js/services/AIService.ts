// services/AIService.ts
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { SpeechService } from '@/services/SpeechService';
import { WidgetParserService } from '@/services/WidgetParserService';
import { AIConfigurationService } from '@/services/AIConfigurationService';
import type { AIMessage, AIConfig } from '@/composables/useChatStore';

export interface AIResponse {
    framework: string;
    widgets: any[];
    explanation: string;
    code?: string;
}

export interface AIPromptRequest {
    prompt: string;
    aiMessages: AIMessage[];
    isProcessingAI: boolean;
    config?: AIConfig;
}

export interface AIPromptResponse {
    aiMessages: AIMessage[];
    isProcessingAI: boolean;
}

export class AIService {
    private static speechService = new SpeechService();
    private static widgetParser = new WidgetParserService();
    private static configService = new AIConfigurationService();

    // Variable para almacenar el proveedor de API preferido tras la verificación
    private static preferredProvider: 'azure' | 'openai' | 'backend' = 'azure';

    /**
     * Establece el proveedor de API preferido
     */
    static setPreferredProvider(provider: 'azure' | 'openai' | 'backend'): void {
        this.preferredProvider = provider;
        console.log(`Proveedor de API establecido a: ${provider}`);
    }

    /**
     * Obtiene el proveedor de API preferido actual
     */
    static getPreferredProvider(): 'azure' | 'openai' | 'backend' {
        return this.preferredProvider;
    }

    /**
     * Sends a prompt to the AI and processes the response
     */
    static async sendAIPrompt(
        request: AIPromptRequest
    ): Promise<AIPromptResponse> {
        console.log('=== AIService.sendAIPrompt STARTED ===');

        const { prompt, aiMessages, isProcessingAI, config } = request;

        if (!prompt.trim()) {
            return { aiMessages, isProcessingAI };
        }

        const updatedMessages = [...aiMessages];
        updatedMessages.push({
            id: this.generateMessageId(),
            text: prompt,
            isUser: true,
            timestamp: new Date(),
        });

        let processingState = true;

        try {
            const aiResponse = await this.sendPromptToAI(prompt, config);
            const parsedResponse = this.parseAIResponse(aiResponse);

            if (parsedResponse && parsedResponse.widgets?.length > 0) {
                const processedWidgets = this.processWidgets(parsedResponse.widgets, parsedResponse.framework);

                updatedMessages.push({
                    id: this.generateMessageId(),
                    text: parsedResponse.explanation || aiResponse,
                    isUser: false,
                    timestamp: new Date(),
                    widgets: processedWidgets
                });

                await AlertService.prototype.success(
                    'Éxito',
                    `${processedWidgets.length} widgets de ${parsedResponse.framework.toUpperCase()} generados correctamente`
                );
            } else {
                updatedMessages.push({
                    id: this.generateMessageId(),
                    text: aiResponse,
                    isUser: false,
                    timestamp: new Date(),
                });
            }
        } catch (error: any) {
            console.error('Error in AIService.sendAIPrompt:', error);
            updatedMessages.push({
                id: this.generateMessageId(),
                text: `Error: ${error.message || 'Error interno del servidor'}`,
                isUser: false,
                timestamp: new Date(),
            });
        } finally {
            processingState = false;
        }

        return { aiMessages: updatedMessages, isProcessingAI: processingState };
    }

    /**
     * Processes audio prompt and converts to text
     */
    static async processAudioPrompt(
        audioBlob: Blob,
        request: AIPromptRequest
    ): Promise<AIPromptResponse> {
        try {
            const transcribedText = await this.speechService.convertAudioToText(audioBlob);

            if (!transcribedText.trim()) {
                throw new Error('No se pudo transcribir el audio. Por favor, inténtalo de nuevo.');
            }

            const updatedRequest = {
                ...request,
                prompt: transcribedText
            };

            return await this.sendAIPrompt(updatedRequest);
        } catch (error: any) {
            console.error('Error processing audio prompt:', error);

            const updatedMessages = [...request.aiMessages];
            updatedMessages.push({
                id: this.generateMessageId(),
                text: `Error al procesar el audio: ${error.message || 'Error desconocido'}`,
                isUser: false,
                timestamp: new Date(),
            });

            return { aiMessages: updatedMessages, isProcessingAI: false };
        }
    }

    /**
     * Tests speech configuration
     */
    static async testSpeechConfiguration() {
        return await this.speechService.testConfiguration();
    }

    /**
     * Corrects Flutter code
     */
    static async correctFlutterCode(flutterCode: string): Promise<string> {
        return await this.widgetParser.correctFlutterCode(flutterCode);
    }

    /**
     * Corrects Angular code
     */
    static async correctAngularCode(angularCode: string): Promise<string> {
        return await this.widgetParser.correctAngularCode(angularCode);
    }

    /**
     * Extracts individual files from project code based on framework
     */
    static extractFilesFromProject(code: string, framework: string): Record<string, string> {
        return this.widgetParser.extractFilesFromProject(code, framework);
    }

    /**
     * Verifies all files in a project
     */
    static async verifyProjectFiles(
        files: Record<string, string>,
        framework: string,
        progressCallback?: (progress: number, total: number, currentFile: string) => void
    ): Promise<{
        isValid: boolean;
        fileResults: Record<string, { isValid: boolean; correctedCode?: string; message: string }>
    }> {
        return await this.widgetParser.verifyProjectFiles(files, framework, progressCallback);
    }

    /**
     * Verifies project code before download
     * This is a convenience method that extracts files and verifies them in one step
     */
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
                    // For Angular files
                    if (framework === 'angular') {
                        const componentName = filePath.match(/\/(\w+)\.component\.ts$/)?.[1];
                        if (componentName) {
                            // Replace component code
                            const componentRegex = new RegExp(`\\/\\/ ${componentName}\\.component\\.ts[\\s\\S]*?export class ${componentName}Component[\\s\\S]*?}`, 'g');
                            correctedProjectCode = correctedProjectCode.replace(componentRegex, result.correctedCode);
                        } else if (filePath.includes('app.module.ts')) {
                            // Replace module code
                            const moduleRegex = /\/\/ app\.module\.ts[\s\S]*?export class AppModule[\s\S]*?}/g;
                            correctedProjectCode = correctedProjectCode.replace(moduleRegex, result.correctedCode);
                        } else if (filePath.includes('app-routing.module.ts')) {
                            // Replace routing code
                            const routingRegex = /\/\/ app-routing\.module\.ts[\s\S]*?export class AppRoutingModule[\s\S]*?}/g;
                            correctedProjectCode = correctedProjectCode.replace(routingRegex, result.correctedCode);
                        }
                    }
                    // For Flutter files
                    else if (framework === 'flutter') {
                        if (filePath.includes('main.dart')) {
                            // Replace main.dart code
                            const mainRegex = /void main\(\)[\s\S]*?class MyApp[\s\S]*?}/g;
                            correctedProjectCode = correctedProjectCode.replace(mainRegex, result.correctedCode);
                        } else {
                            const screenName = filePath.match(/\/(\w+)\.dart$/)?.[1];
                            if (screenName) {
                                // Replace screen class code
                                const screenRegex = new RegExp(`class ${screenName.charAt(0).toUpperCase() + screenName.slice(1)} extends StatelessWidget[\\s\\S]*?}`, 'g');
                                correctedProjectCode = correctedProjectCode.replace(screenRegex, result.correctedCode);
                            } else if (filePath.includes('navigation_drawer.dart')) {
                                // Replace navigation drawer code
                                const drawerRegex = /class NavigationDrawer[\s\S]*?}/g;
                                correctedProjectCode = correctedProjectCode.replace(drawerRegex, result.correctedCode);
                            }
                        }
                    }
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

    /**
     * Parses Flutter widgets from code
     */
    static parseFlutterWidgets(
        inputCode: string,
        availableWidgets: any[],
        widgetIdCounter: number,
        currentScreen: any,
        roomId: string | null,
        currentUser: string,
        socket: any
    ): number {
        return this.widgetParser.parseFlutterWidgets(
            inputCode,
            availableWidgets,
            widgetIdCounter,
            currentScreen,
            roomId,
            currentUser,
            socket
        );
    }

    /**
     * Extracts code from AI response
     */
    static extractFromFirstImport(inputString: string): string {
        return this.widgetParser.extractFromFirstImport(inputString);
    }

    /**
     * Filters code for allowed widget types
     */
    static filterCodeForAllowedWidgets(code: string, allowedWidgetTypes: string[]): string {
        return this.widgetParser.filterCodeForAllowedWidgets(code, allowedWidgetTypes);
    }

    /**
     * Tests AI API configuration
     */
    static async testAIConfiguration(): Promise<{
        success: boolean;
        provider: 'azure' | 'openai' | 'backend';
        message: string;
    }> {
        console.log('Testing AI API configuration...');

        // Intentar con Azure primero
        try {
            const azureConfig = this.configService.getAzureConfig();

            // Verificar si tenemos configuración válida para Azure
            if (!azureConfig.headers['api-key'] || !azureConfig.endpoint) {
                console.log('Azure API no configurada, probando OpenAI...');
                throw new Error('Azure API no configurada');
            }

            // Hacer una solicitud simple a Azure para verificar que funciona
            const response = await axios.post(
                azureConfig.endpoint,
                {
                    messages: [
                        { role: 'user', content: 'Responde únicamente con la palabra "OK" para verificar conexión' }
                    ],
                    max_tokens: 5,
                    temperature: 0.1
                },
                { headers: azureConfig.headers }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                return {
                    success: true,
                    provider: 'azure',
                    message: 'Azure OpenAI API está funcionando correctamente'
                };
            }

            throw new Error('Respuesta inválida del servicio de Azure AI');
        } catch (azureError: any) {
            console.log('Error en Azure API:', azureError.message);

            // Intentar con OpenAI
            try {
                const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

                if (!openaiApiKey) {
                    console.log('OpenAI API no configurada, usando backend fallback...');
                    throw new Error('OpenAI API no configurada');
                }

                const response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'user', content: 'Responde únicamente con la palabra "OK" para verificar conexión' }
                        ],
                        max_tokens: 5,
                        temperature: 0.1
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openaiApiKey}`
                        }
                    }
                );

                if (response.data?.choices?.[0]?.message?.content) {
                    return {
                        success: true,
                        provider: 'openai',
                        message: 'OpenAI API está funcionando correctamente (fallback de Azure)'
                    };
                }

                throw new Error('Respuesta inválida del servicio de OpenAI');
            } catch (openaiError: any) {
                console.log('Error en OpenAI API:', openaiError.message);

                // Fallback al backend
                return {
                    success: false,
                    provider: 'backend',
                    message: 'Usando API del backend como fallback (Azure y OpenAI no disponibles)'
                };
            }
        }
    }

    /**
     * Verifica la API key y establece el proveedor preferido
     */
    static async verifyApiKey(): Promise<{
        valid: boolean;
        provider: 'azure' | 'openai' | 'backend';
        message: string;
    }> {
        try {
            const result = await this.testAIConfiguration();

            // Si la prueba fue exitosa, establecer el proveedor
            this.setPreferredProvider(result.provider);

            return {
                valid: result.success,
                provider: result.provider,
                message: result.message
            };
        } catch (error: any) {
            console.error('Error al verificar API key:', error);

            // En caso de error, usar el backend como fallback
            this.setPreferredProvider('backend');

            return {
                valid: false,
                provider: 'backend',
                message: error.message || 'Error al verificar API key'
            };
        }
    }

    // Private methods
    private static async sendPromptToAI(prompt: string, config?: AIConfig): Promise<string> {
        // Usar el proveedor preferido (azure por defecto)
        const provider = this.preferredProvider;

        try {
            // Si el proveedor es backend, vamos directo al fallback
            if (provider === 'backend') {
                throw new Error('Usando backend como proveedor principal');
            }

            // Obtener la configuración según el proveedor preferido
            const apiConfig = provider === 'azure'
                ? this.configService.getAzureConfig()
                : this.configService.getOpenAIConfig();

            // Estructura del cuerpo de la solicitud
            const requestBody = {
                messages: [
                    {
                        role: 'system',
                        content: apiConfig.systemPrompt
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: apiConfig.maxTokens,
                temperature: apiConfig.temperature
            };

            // Si es OpenAI, añadir el modelo al cuerpo de la solicitud
            if (provider === 'openai' && 'model' in apiConfig) {
                Object.assign(requestBody, { model: apiConfig.model });
            }

            // Realizar la solicitud a la API correspondiente
            const response = await axios.post(
                apiConfig.endpoint,
                requestBody,
                { headers: apiConfig.headers }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                return response.data.choices[0].message.content;
            }

            throw new Error('Respuesta inválida del servicio de IA');
        } catch (error: any) {
            console.error(`Error al usar ${provider} como proveedor:`, error);

            // Fallback to backend API
            const backendResponse = await this.sendPromptToBackend(prompt);
            if (backendResponse.success) {
                return backendResponse.explanation || 'Widgets generados correctamente';
            }
            throw error;
        }
    }

    private static parseAIResponse(aiResponse: string): AIResponse | null {
        return this.widgetParser.parseAIResponseAsJSON(aiResponse);
    }

    private static processWidgets(widgets: any[], framework: string): any[] {
        const allowedWidgetTypes = this.configService.getAllowedWidgetTypes(framework);
        const filteredWidgets = widgets.filter(widget =>
            allowedWidgetTypes.includes(widget.type)
        );

        // Add automatic positioning
        filteredWidgets.forEach((widget, index) => {
            if (!widget.position) {
                widget.position = this.calculateWidgetPosition(index, framework);
            }
            if (!widget.id) {
                widget.id = `ai-widget-${Date.now()}-${index}`;
            }
            widget.framework = framework;
        });

        return filteredWidgets;
    }

    private static calculateWidgetPosition(index: number, framework: string) {
        const startX = 50;
        const startY = 50;
        const margin = 30;

        if (framework === 'flutter') {
            return {
                x: startX + (index * 10),
                y: startY + (index * (80 + margin))
            };
        } else {
            const maxElementsPerRow = 3;
            const row = Math.floor(index / maxElementsPerRow);
            const col = index % maxElementsPerRow;
            return {
                x: startX + (col * 200),
                y: startY + (row * 100)
            };
        }
    }

    private static async sendPromptToBackend(prompt: string): Promise<any> {
        try {
            const response = await axios.post('/ai/generate-ui-components', {
                prompt: prompt,
                framework: 'auto'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            return {
                success: true,
                widgets: response.data.widgets || [],
                framework: response.data.framework || 'flutter',
                explanation: response.data.explanation || '',
                code: response.data.code || null
            };
        } catch (error: any) {
            return {
                success: false,
                error: 'Network error',
                message: error.message || 'Failed to connect to backend'
            };
        }
    }

    private static generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
