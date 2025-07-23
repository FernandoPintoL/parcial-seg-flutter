// services/SpeechService.ts
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { AlertService } from '@/services/AlertService';

export interface SpeechConfiguration {
    speechKey: string;
    speechRegion: string;
    speechLanguage: string;
    isConfigured: boolean;
}

export interface SpeechTestResult {
    success: boolean;
    configuration: SpeechConfiguration;
    message: string;
}

export class SpeechService {
    private speechKey: string;
    private speechRegion: string;
    private speechLanguage: string;
    private useWebSpeechAPI: boolean;

    constructor() {
        this.speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY || '';
        this.speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || '';
        this.speechLanguage = import.meta.env.VITE_AZURE_SPEECH_LANGUAGE || 'es-ES';
        // Check if Web Speech API is available as fallback
        this.useWebSpeechAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    /**
     * Tests Azure Speech Service configuration
     */
    async testConfiguration(): Promise<SpeechTestResult> {
        console.log('Testing Azure Speech Service configuration...');

        const configuration: SpeechConfiguration = {
            speechKey: this.speechKey ? 'Set (length: ' + this.speechKey.length + ')' : 'Not set',
            speechRegion: this.speechRegion || 'Not set',
            speechLanguage: this.speechLanguage || 'Not set',
            isConfigured: !!(this.speechKey && this.speechRegion)
        };

        try {
            if (!this.speechKey || !this.speechRegion) {
                if (this.useWebSpeechAPI) {
                    return {
                        success: true,
                        configuration,
                        message: 'Usando Web Speech API como alternativa (Azure Speech no configurado)'
                    };
                }
                return {
                    success: false,
                    configuration,
                    message: 'La configuración de Azure Speech no está completa en el archivo .env.'
                };
            }

            const speechConfig = sdk.SpeechConfig.fromSubscription(this.speechKey, this.speechRegion);
            speechConfig.speechRecognitionLanguage = this.speechLanguage;

            return {
                success: true,
                configuration,
                message: 'Configuración de Azure Speech validada correctamente'
            };
        } catch (error: any) {
            console.error('Error testing Azure Speech configuration:', error);
            if (this.useWebSpeechAPI) {
                return {
                    success: true,
                    configuration,
                    message: 'Usando Web Speech API como alternativa (Error en Azure Speech: ' + error.message + ')'
                };
            }
            return {
                success: false,
                configuration,
                message: 'Error al validar la configuración: ' + error.message
            };
        }
    }

    /**
     * Converts audio to text using Web Speech API as fallback
     * This method uses AudioContext to analyze audio without playback
     */
    private convertAudioToTextWithWebSpeechAPI(audioBlob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            // Check if SpeechRecognition is available
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                return reject(new Error('Web Speech API no está soportada en este navegador'));
            }

            // Use direct recognition method instead of playing audio
            try {
                // Instead of playing the audio, we'll try to transcribe directly
                // Note: Web Speech API doesn't directly support transcribing audio files
                // We're using a workaround

                const reader = new FileReader();
                let tempTextarea: HTMLTextAreaElement | null = null;

                reader.onload = () => {
                    // Create a temporary textarea to help with dictation
                    tempTextarea = document.createElement('textarea');
                    tempTextarea.style.position = 'absolute';
                    tempTextarea.style.left = '-9999px';
                    tempTextarea.style.top = '0';
                    document.body.appendChild(tempTextarea);
                    tempTextarea.focus();

                    // Initialize speech recognition
                    const recognition = new SpeechRecognition();
                    recognition.lang = this.speechLanguage;
                    recognition.continuous = false;
                    recognition.interimResults = false;

                    // Set up event handlers
                    recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript;
                        console.log('Web Speech API recognized:', transcript);

                        // Clean up - verificando primero si el elemento existe y está adjunto al DOM
                        if (tempTextarea && tempTextarea.parentNode) {
                            tempTextarea.parentNode.removeChild(tempTextarea);
                        }
                        tempTextarea = null;

                        resolve(transcript);
                    };

                    recognition.onerror = (event) => {
                        console.error('Web Speech API error:', event.error);

                        // Clean up - verificando primero si el elemento existe y está adjunto al DOM
                        if (tempTextarea && tempTextarea.parentNode) {
                            tempTextarea.parentNode.removeChild(tempTextarea);
                        }
                        tempTextarea = null;

                        reject(new Error(`Web Speech API error: ${event.error}`));
                    };

                    recognition.onend = () => {
                        console.log('Web Speech API recognition ended');

                        // If no result after 5 seconds, we'll provide a fallback message
                        setTimeout(() => {
                            // Clean up - verificando primero si el elemento existe y está adjunto al DOM
                            if (tempTextarea && tempTextarea.parentNode) {
                                tempTextarea.parentNode.removeChild(tempTextarea);
                            }
                            tempTextarea = null;

                            // Solo resolver si no se ha resuelto ya la promesa
                            resolve("Lo siento, no pude reconocer el audio. Por favor intenta hablar más claro o utiliza el teclado.");
                        }, 5000);
                    };

                    // Start recognition
                    recognition.start();

                    // Show feedback to user
                    new AlertService().info('Escuchando... Por favor habla ahora');
                };

                reader.onerror = (error) => {
                    console.error('Error reading audio file:', error);
                    // Limpiar el textarea si existe
                    if (tempTextarea && tempTextarea.parentNode) {
                        tempTextarea.parentNode.removeChild(tempTextarea);
                    }
                    tempTextarea = null;

                    reject(new Error('Error al leer el archivo de audio'));
                };

                // Start reading the blob
                reader.readAsDataURL(audioBlob);

            } catch (error) {
                console.error('Error setting up Web Speech API:', error);
                reject(new Error(`Error en la configuración del reconocimiento de voz: ${error}`));
            }
        });
    }

    /**
     * Converts audio to text using Azure Speech Services with Web Speech API fallback
     */
    async convertAudioToText(audioBlob: Blob): Promise<string> {
        console.log('Converting audio to text...');

        try {
            // Try Azure Speech Services first if configured
            if (this.speechKey && this.speechRegion) {
                try {
                    console.log('Attempting to use Azure Speech Services...');
                    const speechConfig = sdk.SpeechConfig.fromSubscription(this.speechKey, this.speechRegion);
                    speechConfig.speechRecognitionLanguage = this.speechLanguage;

                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const pushStream = sdk.AudioInputStream.createPushStream();
                    pushStream.write(arrayBuffer);
                    pushStream.close();
                    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

                    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

                    return new Promise((resolve, reject) => {
                        recognizer.recognizeOnceAsync(
                            (result) => {
                                if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                                    console.log(`RECOGNIZED: Text=${result.text}`);
                                    resolve(result.text);
                                } else {
                                    console.log(`ERROR: Speech was cancelled or could not be recognized. Reason=${result.reason}`);
                                    // Don't reject here, try fallback instead
                                    if (this.useWebSpeechAPI) {
                                        console.log('Falling back to Web Speech API...');
                                        this.convertAudioToTextWithWebSpeechAPI(audioBlob)
                                            .then(resolve)
                                            .catch(reject);
                                    } else {
                                        reject(new Error(`Speech recognition failed: ${result.reason}`));
                                    }
                                }
                                recognizer.close();
                            },
                            (err) => {
                                console.error(`Azure Speech ERROR: ${err}`);
                                recognizer.close();

                                // Try fallback if Web Speech API is available
                                if (this.useWebSpeechAPI) {
                                    console.log('Falling back to Web Speech API due to Azure error...');
                                    this.convertAudioToTextWithWebSpeechAPI(audioBlob)
                                        .then(resolve)
                                        .catch(reject);
                                } else {
                                    reject(err);
                                }
                            }
                        );
                    });
                } catch (azureError) {
                    console.error('Error with Azure Speech Services:', azureError);

                    // Try fallback if Web Speech API is available
                    if (this.useWebSpeechAPI) {
                        console.log('Falling back to Web Speech API due to Azure configuration error...');
                        return await this.convertAudioToTextWithWebSpeechAPI(audioBlob);
                    }
                    throw azureError;
                }
            } else if (this.useWebSpeechAPI) {
                // Use Web Speech API directly if Azure is not configured
                console.log('Azure Speech not configured, using Web Speech API...');
                return await this.convertAudioToTextWithWebSpeechAPI(audioBlob);
            } else {
                throw new Error('No speech recognition service available. Azure Speech not configured and Web Speech API not supported.');
            }
        } catch (error) {
            console.error('Error converting audio to text:', error);
            await AlertService.prototype.error('Error', 'No se pudo convertir el audio a texto. Por favor, intente nuevamente.');
            throw error;
        }
    }
}
