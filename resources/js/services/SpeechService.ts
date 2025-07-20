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

    constructor() {
        this.speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY || '';
        this.speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || '';
        this.speechLanguage = import.meta.env.VITE_AZURE_SPEECH_LANGUAGE || 'es-ES';
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
            return {
                success: false,
                configuration,
                message: 'Error al validar la configuración: ' + error.message
            };
        }
    }

    /**
     * Converts audio to text using Azure Speech Services
     */
    async convertAudioToText(audioBlob: Blob): Promise<string> {
        console.log('Converting audio to text using Azure Speech Services...');

        try {
            if (!this.speechKey || !this.speechRegion) {
                throw new Error('La configuración de Azure Speech no está completa en el archivo .env.');
            }

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
                            reject(new Error(`Speech recognition failed: ${result.reason}`));
                        }
                        recognizer.close();
                    },
                    (err) => {
                        console.error(`ERROR: ${err}`);
                        recognizer.close();
                        reject(err);
                    }
                );
            });
        } catch (error) {
            console.error('Error converting audio to text:', error);
            await AlertService.prototype.error('Error', 'No se pudo convertir el audio a texto');
            throw error;
        }
    }
} 