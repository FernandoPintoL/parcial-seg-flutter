export interface PizarraFlutter {
    id: number;
    name: string;
    elements: FlutterWidget[];
    user_id: number;
    created_at: string;
}

export interface FlutterWidget {
    type: string;
    props: Record<string, any>;
    children?: FlutterWidget[];
}

export interface FlutterWidgetProperty {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'array';
    defaultValue: any;
    options?: string[]; // For select type
}

export interface FlutterWidgetDefinition {
    type: string;
    category: 'input' | 'layout' | 'container' | 'display';
    label: string;
    properties: FlutterWidgetProperty[];
    hasChildren: boolean;
}
