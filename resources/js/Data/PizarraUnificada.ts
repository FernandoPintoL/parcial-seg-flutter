// types/PizarraUnificada.ts
import { BaseData } from '@/Data/BaseData';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PizarraUnificada {
    id: number;
    name: string;
    type: 'flutter' | 'angular' | 'both';
    framework: 'flutter' | 'angular' | 'both';
    description?: string;
    elements: UnifiedElement[];
    screens?: UnifiedScreen[];
    user_id: number;
    user?: User;
    room_id?: string;
    created_at?: string;
    updated_at?: string;
}
export interface UnifiedElement {
    id?: string;
    type: string;
    framework: 'flutter' | 'angular' | 'both';
    props: Record<string, any>;
    children: UnifiedElement[];
    code_string?: string;
    position?: {
        x: number;
        y: number;
    };
    created_at?: string;
    updated_at?: string;
}
export interface UnifiedScreen {
    id: string;
    name: string;
    elements: UnifiedElement[];
    isHome?: boolean;
    isDrawer?: boolean;
    framework: 'flutter' | 'angular' | 'both';
    route?: string;
    created_at?: string;
    updated_at?: string;
}
export interface DiagramData {
    type: 'class' | 'sequence' | 'use_case' | 'activity';
    source: 'image' | 'xml' | 'plantuml' | 'text';
    content: string;
    elements: ParsedDiagramElement[];
}
export interface ParsedDiagramElement {
    type: 'class' | 'interface' | 'enum' | 'component';
    name: string;
    properties: DiagramProperty[];
    methods: DiagramMethod[];
    relationships: DiagramRelationship[];
}
export interface DiagramProperty {
    name: string;
    type: string;
    visibility: 'public' | 'private' | 'protected';
    isStatic?: boolean;
    defaultValue?: string;
}
export interface DiagramMethod {
    name: string;
    returnType: string;
    parameters: DiagramParameter[];
    visibility: 'public' | 'private' | 'protected';
    isStatic?: boolean;
    isAbstract?: boolean;
}
export interface DiagramParameter {
    name: string;
    type: string;
    defaultValue?: string;
}
export interface DiagramRelationship {
    type: 'inheritance' | 'composition' | 'aggregation' | 'association' | 'dependency';
    target: string;
    cardinality?: string;
}
export interface CodeExportOptions {
    framework: 'flutter' | 'angular' | 'both';
    format: 'download' | 'copy' | 'preview';
    includeTests?: boolean;
    includeDocumentation?: boolean;
    version?: string;
    theme?: string;
}
export interface CollaborationData {
    userId: string;
    userName: string;
    action: 'editing' | 'viewing' | 'adding' | 'deleting';
    elementId?: string;
    elementType?: string;
    timestamp: string;
}
export class PizarraUnificadaData extends BaseData<PizarraUnificada> {
    protected path_api_url: string = 'api.pizarra-unificada';
}
export class DiagramDataHandlerData extends BaseData<DiagramData> {
    protected path_api_url: string = 'api.diagram-data';
}
export class CodeExportData extends BaseData<CodeExportOptions> {
    protected path_api_url: string = 'api.code-export';
}
export class CollaborationDataHandler extends BaseData<CollaborationData> {
    protected path_api_url: string = 'api.collaboration-data';
}
export class UnifiedElementData extends BaseData<UnifiedElement> {
    protected path_api_url: string = 'api.unified-element';
}
export class UnifiedScreenData extends BaseData<UnifiedScreen> {
    protected path_api_url: string = 'api.unified-screen';
}
export class DiagramElementData extends BaseData<ParsedDiagramElement> {
    protected path_api_url: string = 'api.diagram-element';
}
export class DiagramPropertyData extends BaseData<DiagramProperty> {
    protected path_api_url: string = 'api.diagram-property';
}
export class DiagramMethodData extends BaseData<DiagramMethod> {
    protected path_api_url: string = 'api.diagram-method';
}
export class DiagramParameterData extends BaseData<DiagramParameter> {
    protected path_api_url: string = 'api.diagram-parameter';
}
export class DiagramRelationshipData extends BaseData<DiagramRelationship> {
    protected path_api_url: string = 'api.diagram-relationship';
}
export class CodeExportOptionsData extends BaseData<CodeExportOptions> {
    protected path_api_url: string = 'api.code-export-options';
}
export class CollaborationDataOptions extends BaseData<CollaborationData> {
    protected path_api_url: string = 'api.collaboration-data-options';
}
export class UnifiedElementOptionsData extends BaseData<UnifiedElement> {
    protected path_api_url: string = 'api.unified-element-options';
}
