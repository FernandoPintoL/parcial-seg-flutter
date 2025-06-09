export interface Pizarra {
    id?: number;
    name: string;
    room_id?: string;
    widgets?: FlutterWidget[];
    user_id: number;
    pizarra_id?: number;
    created_at?: string;
    isHome? : boolean;
    isDrawer? : boolean;
}
/*export interface PizarraScreen {
    id: string;
    name: string;
    elements: FlutterWidget[];
    isHome?: boolean;
    isDrawer?: boolean;
}*/
export interface Chats{
    id: number;
    pizarra_id: number;
    user_id: number;
    user_name: string;
    message: string;
    isSystemMessage: boolean;
    created_at: string;
}
export interface PizarraCollaborators{
    id: number;
    pizarra_id: number;
    userId: number;
    status: string;
}
export interface FlutterWidget {
    id : number;
    type: string;
    label: string;
    icon: string;
    code_string: string;
    categoria_widget_id: number;
    categoria: CategoriaWidget;
    propiedades: Record<string, any>;
    children?: FlutterWidget[];
    pendingChild?: any; // For widgets that can have children but are not yet defined
    pendingChildren?: any[]; // For widgets that can have multiple children but are not yet defined
}
// Define la estructura de las propiedades de un widget de Flutter
export interface FlutterWidgetProperty {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'array';
    defaultValue: any;
    options?: string[]; // For select type
}
// Define la estructura de un widget de Flutter
export interface FlutterWidgetDefinition {
    type: string;
    category: 'widgets'| 'layout' |'input' | 'plataforma' | 'animation' | 'list' | 'navegation' | 'containers' | 'material-cupertino';
    label: string;
    properties: FlutterWidgetProperty[];
    hasChildren: boolean;
}
export interface CategoriaWidget{
    id : number;
    category: string;
    label: string;
}
export interface PropiedadesWidget{
    id?: number;
    name: string;
    type: string;
    defaultValue: string;
}
export interface WhiteboardActivities{
    id: number;
    pizarra_id: number;
    userId: number;
    actionType: string;
    actionData: any;
    description: string;
}
