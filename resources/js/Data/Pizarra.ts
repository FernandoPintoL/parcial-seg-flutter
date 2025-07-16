import { BaseData } from '@/Data/BaseData';

export interface Pizarra {
    id?: number | any;
    name: string;
    room_id?: string;
    widgets?: FlutterWidget[];
    elements?: FlutterWidget[];
    user_id?: number;
    pizarra_id?: number;
    created_at?: string;
    isHome? : boolean;
    isDrawer? : boolean;
    users: Record<string, any>;
}
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
    id : number | string;
    type: string;
    label?: string;
    icon?: string;
    code_string?: string;
    categoria_widget_id?: number;
    categoria?: CategoriaWidget;
    props: Record<string, any>;
    children?: FlutterWidget[];
    pendingChild?: any; // For widgets that can have children but are not yet defined
    pendingChildren?: any[]; // For widgets that can have multiple children but are not yet defined
}
// Define l'estructura de las propiedades de un widget de Flutter
export interface FlutterWidgetProperty {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'array';
    defaultValue: any;
    options?: string[]; // For select type
}
// Define l'estructura de un widget de Flutter
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

export class ChatData extends BaseData<Chats> {
    protected path_api_url: string = 'api.chat';
}

export class PizarraData extends BaseData<Pizarra> {
    protected path_api_url: string = 'api.pizarra';
}
export class PizarraCollaboratorsData extends BaseData<PizarraCollaborators> {
    protected path_api_url: string = 'api.pizarra-collaborators';
}
export class FlutterWidgetData extends BaseData<FlutterWidget> {
    protected path_api_url: string = 'api.flutter-widget';
}
export class FlutterWidgetDefinitionData extends BaseData<FlutterWidgetDefinition> {
    protected path_api_url: string = 'api.flutter-widget-definition';
}
export class CategoriaWidgetData extends BaseData<CategoriaWidget> {
    protected path_api_url: string = 'api.categoria-widget';
}

export class WhiteboardActivitiesData extends BaseData<WhiteboardActivities> {
    protected path_api_url: string = 'api.whiteboard-activities';
}

export class PropiedadesWidgetData extends BaseData<PropiedadesWidget> {
    protected path_api_url: string = 'api.propiedades-widget';
}
