export interface Pizarra {
    id: number;
    name: string;
    room_id: string;
    elements: FlutterWidget[];
    user_id: number;
    created_at: string;
}
export interface Chats{
    id: number;
    pizarra_id: number;
    userId: number;
    message: string;
    isSystemMessage: boolean;
}
export interface PizarraCollaborators{
    id: number;
    pizarra_id: number;
    userId: number;
    status: string;
}
export interface WhiteboardActivities{
    id: number;
    pizarra_id: number;
    userId: number;
    actionType: string;
    actionData: any;
    description: string;
}
export interface FlutterWidget {
    id : string;
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
