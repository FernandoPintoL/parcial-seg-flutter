// types/PizarraUnificada.ts
export interface PizarraUnificada {
    id: number;
    name: string;
    type: 'flutter' | 'angular' | 'both';
    elements: UnifiedElement[];
    screens?: UnifiedScreen[];
    user_id: number;
    room_id?: string;
    created_at: string;
    updated_at: string;
}

export interface UnifiedElement {
    id: string;
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
