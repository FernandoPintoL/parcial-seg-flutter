// services/AIService.ts
import axios from 'axios';
import { AlertService } from '@/services/AlertService';
import { SpeechService } from '@/services/SpeechService';
import { WidgetParserService } from '@/services/WidgetParserService';
import { AIConfigurationService } from '@/services/AIConfigurationService';
import type { AIMessage, AIConfig } from '@/composables/useChatStore';
import { JsonUtils } from '@/utils/JsonUtils';

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

    // Private methods
    private static async sendPromptToAI(prompt: string, config?: AIConfig): Promise<string> {
        const aiConfig = config || this.configService.getDefaultConfig();
        const azureConfig = this.configService.getAzureConfig();
        
        try {
            const response = await axios.post(
                azureConfig.endpoint,
                {
                    messages: [
                        {
                            role: 'system',
                            content: azureConfig.systemPrompt
                        },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: azureConfig.maxTokens,
                    temperature: azureConfig.temperature
                },
                { headers: azureConfig.headers }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                return response.data.choices[0].message.content;
            }
            
            throw new Error('Respuesta inválida del servicio de IA');
        } catch (error: any) {
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
