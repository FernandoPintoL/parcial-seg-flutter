// pages/Chat/types.ts
export interface AIModel {
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    supportsVision: boolean;
    supportsCode: boolean;
    icon: string;
}

export interface WidgetSuggestion {
    id: string;
    name: string;
    description: string;
    framework: string;
    complexity: 'simple' | 'medium' | 'complex';
    code: string;
    preview?: string;
} 