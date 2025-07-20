// services/AIConfigurationService.ts
import type { AIConfig } from '@/composables/useChatStore';

export class AIConfigurationService {
    private defaultConfig: AIConfig = {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'Eres un asistente especializado en desarrollo de interfaces de usuario.',
        enableVoice: true,
        autoGenerateWidgets: true,
        framework: 'flutter',
        language: 'es'
    };

    /**
     * Gets the default AI configuration
     */
    getDefaultConfig(): AIConfig {
        return { ...this.defaultConfig };
    }

    /**
     * Gets the Azure API configuration
     */
    getAzureConfig() {
        const azureApiUrl = import.meta.env.VITE_AZURE_API_URL;
        const azureApiKey = import.meta.env.VITE_AZURE_API_KEY;
        const azureModelName = import.meta.env.VITE_AZURE_MODEL_NAME;
        const azureDeploymentName = import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || azureModelName;

        return {
            endpoint: `${azureApiUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=2023-05-15`,
            headers: {
                'Content-Type': 'application/json',
                'api-key': azureApiKey
            },
            systemPrompt: this.getSystemPrompt(),
            maxTokens: 1500,
            temperature: 0.7
        };
    }

    /**
     * Gets allowed widget types for a framework
     */
    getAllowedWidgetTypes(framework: string): string[] {
        if (framework === 'flutter') {
            return [
                'TextFormField', 'ElevatedButton', 'TextButton', 'OutlinedButton',
                'DropdownButton', 'DropdownButtonFormField', 'RadioListTile', 'Radio',
                'CheckboxListTile', 'Checkbox', 'Switch', 'SwitchListTile',
                'Text', 'Slider', 'DatePicker', 'TimePicker'
            ];
        } else if (framework === 'angular') {
            return [
                'input', 'button', 'select', 'radio', 'checkbox',
                'textarea', 'switch', 'toggle', 'slider', 'range', 'datepicker'
            ];
        }
        return [];
    }

    /**
     * Gets the system prompt for AI
     */
    private getSystemPrompt(): string {
        return `Eres un asistente especializado en Flutter y Angular. Cuando te pidan crear componentes, formularios o widgets, responde SIEMPRE con un JSON estructurado.

ESTRUCTURA JSON REQUERIDA:
{
    "framework": "flutter" | "angular",
    "widgets": [
        {
            "type": "Widget_Type",
            "props": {
                "prop1": "value1",
                "prop2": "value2"
            },
            "children": [],
            "position": {
                "x": number,
                "y": number
            }
        }
    ],
    "explanation": "Explicación detallada de los widgets creados",
    "code": "Código completo del componente (opcional)"
}

WIDGETS FLUTTER DISPONIBLES:
- TextFormField: Para campos de entrada de texto
- ElevatedButton, TextButton, OutlinedButton: Botones
- DropdownButton, DropdownButtonFormField: Selectores
- RadioListTile, Radio: Botones de radio
- CheckboxListTile, Checkbox: Casillas de verificación
- Switch, SwitchListTile: Interruptores
- Text: Texto estático
- Slider: Control deslizante
- DatePicker, TimePicker: Selectores de fecha/hora

COMPONENTES ANGULAR DISPONIBLES:
- input: Campos de entrada (text, email, password, number, etc.)
- button: Botones (submit, button, reset)
- select: Selectores desplegables
- radio: Botones de radio
- checkbox: Casillas de verificación
- textarea: Áreas de texto
- switch, toggle: Interruptores
- slider, range: Controles deslizantes
- datepicker: Selector de fecha

INSTRUCCIONES:
1. Detecta automáticamente si el usuario solicita Flutter o Angular
2. Si no especifica, pregunta o asume Flutter por defecto
3. Genera posiciones automáticas para los widgets (separación de ~80-100px)
4. Incluye propiedades relevantes para cada tipo de widget
5. Proporciona explicaciones claras y útiles`;
    }
} 