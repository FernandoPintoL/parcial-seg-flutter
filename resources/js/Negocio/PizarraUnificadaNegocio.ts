import { BaseNegocio } from '@/Negocio/BaseNegocio';
import {
    CodeExportData,
    CodeExportOptions, CodeExportOptionsData,
    CollaborationData,
    CollaborationDataHandler, CollaborationDataOptions,
    DiagramData,
    DiagramDataHandlerData,
    DiagramElementData, DiagramMethod,
    DiagramMethodData, DiagramParameter, DiagramParameterData,
    DiagramProperty,
    DiagramPropertyData, DiagramRelationship, DiagramRelationshipData,
    ParsedDiagramElement,
    PizarraUnificada,
    PizarraUnificadaData,
    UnifiedElement,
    UnifiedElementData, UnifiedElementOptionsData,
    UnifiedScreen,
    UnifiedScreenData
} from '@/Data/PizarraUnificada';

export class PizarraUnificadaNegocio extends BaseNegocio<PizarraUnificada>{
    public model: string = 'api.pizarra-unificada';
    protected dataService: PizarraUnificadaData;

    constructor() {
        super();
        this.dataService = new PizarraUnificadaData();
    }
    protected validar(pizarraUnificada: PizarraUnificada) {
        if (!pizarraUnificada.name) {
            throw new Error('El nombre de la pizarra unificada es requerido');
        }
        if (!pizarraUnificada.user_id) {
            throw new Error('El ID del usuario es requerido');
        }
        // ... otras validaciones específicas para la pizarra unificada
    }
}

export class DiagramaDataHandlerNegocio extends BaseNegocio<DiagramData> {
    public model: string = 'api.diagram-data';
    protected dataService: DiagramDataHandlerData;

    constructor() {
        super();
        this.dataService = new DiagramDataHandlerData();
    }

    protected validar(diagramData: DiagramData) {
        if (!diagramData.content) {
            throw new Error('El contenido del diagrama es requerido');
        }
        if (!Array.isArray(diagramData.elements) || diagramData.elements.length === 0) {
            throw new Error('Debe haber al menos un elemento en el diagrama');
        }
        diagramData.elements.forEach(element => {
            if (!element.type || !element.name) {
                throw new Error('Cada elemento del diagrama debe tener un tipo y un nombre');
            }
            // Validar propiedades, métodos y relaciones de cada elemento
            element.properties.forEach(prop => {
                if (!prop.name || !prop.type) {
                    throw new Error('Cada propiedad debe tener un nombre y un tipo');
                }
            });
            element.methods.forEach(method => {
                if (!method.name || !method.returnType) {
                    throw new Error('Cada método debe tener un nombre y un tipo de retorno');
                }
            });
            element.relationships.forEach(rel => {
                if (!rel.type || !rel.target) {
                    throw new Error('Cada relación debe tener un tipo y un objetivo');
                }
            });
        });
        // ... otras validaciones específicas para el manejo de datos del diagrama
    }
}

export class CodeExportNegocio extends BaseNegocio<CodeExportOptions> {
    public model: string = 'api.code-export';
    protected dataService: CodeExportData;

    constructor() {
        super();
        this.dataService = new CodeExportData();
    }

    protected validar(codeExportOptions: CodeExportOptions) {
        if (!codeExportOptions.framework) {
            throw new Error('El framework es requerido');
        }
        if (!['flutter', 'angular', 'both'].includes(codeExportOptions.framework)) {
            throw new Error('El framework debe ser "flutter", "angular" o "both"');
        }
        if (!['download', 'copy', 'preview'].includes(codeExportOptions.format)) {
            throw new Error('El formato debe ser "download", "copy" o "preview"');
        }
        // ... otras validaciones específicas para la exportación de código
    }
}

export class CollaborationNegocio extends BaseNegocio<CollaborationData> {
    public model: string = 'api.collaboration';
    protected dataService: CollaborationDataHandler;

    constructor() {
        super();
        this.dataService = new CollaborationDataHandler();
    }

    protected validar(collaborationData: CollaborationData) {
        if (!collaborationData.userId || !collaborationData.userName) {
            throw new Error('El ID y el nombre del usuario son requeridos');
        }
        if (!['editing', 'viewing', 'adding', 'deleting'].includes(collaborationData.action)) {
            throw new Error('La acción debe ser "editing", "viewing", "adding" o "deleting"');
        }
        // ... otras validaciones específicas para la colaboración
    }
}

export class UnifiedElementNegocio extends BaseNegocio<UnifiedElement> {
    public model: string = 'api.unified-element';
    protected dataService: UnifiedElementData;

    constructor() {
        super();
        this.dataService = new UnifiedElementData();
    }

    protected validar(unifiedElement: UnifiedElement) {
        if (!unifiedElement.type) {
            throw new Error('El type del elemento unificado es requerido');
        }
        if (!unifiedElement.type) {
            throw new Error('El tipo del elemento unificado es requerido');
        }
        // ... otras validaciones específicas para el elemento unificado
    }

    // Aquí puedes agregar métodos específicos para manejar elementos unificados
}

export class UnifiedScreenNegocio extends BaseNegocio<UnifiedScreen>{
    public model: string = 'api.unified-screen';
    protected dataService: UnifiedScreenData;

    constructor() {
        super();
        this.dataService = new UnifiedScreenData();
    }

    protected validar(unifiedScreen: UnifiedScreen) {
        if (!unifiedScreen.name) {
            throw new Error('El nombre de la pantalla unificada es requerido');
        }
        if (!unifiedScreen.elements || unifiedScreen.elements.length === 0) {
            throw new Error('Debe haber al menos un elemento en la pantalla unificada');
        }
        // ... otras validaciones específicas para la pantalla unificada
    }
}

export class DiagramElementNegocio extends BaseNegocio<ParsedDiagramElement>{
    public model: string = 'api.diagram-element';
    protected dataService: DiagramElementData;

    constructor() {
        super();
        this.dataService = new DiagramElementData();
    }

    protected validar(parsedDiagramElement: ParsedDiagramElement) {
        if (!parsedDiagramElement.type) {
            throw new Error('El tipo del elemento del diagrama es requerido');
        }
        if (!parsedDiagramElement.name) {
            throw new Error('El nombre del elemento del diagrama es requerido');
        }
        // ... otras validaciones específicas para el elemento del diagrama
    }
}

export class DiagramPropertyNegocio extends BaseNegocio<DiagramProperty> {
    public model: string = 'api.diagram-property';
    protected dataService: DiagramPropertyData;

    constructor() {
        super();
        this.dataService = new DiagramPropertyData();
    }

    protected validar(diagramProperty: DiagramProperty) {
        if (!diagramProperty.name) {
            throw new Error('El nombre de la propiedad del diagrama es requerido');
        }
        if (!diagramProperty.type) {
            throw new Error('El tipo de la propiedad del diagrama es requerido');
        }
        // ... otras validaciones específicas para la propiedad del diagrama
    }
}

export class DiagramMethodNegocio extends BaseNegocio<DiagramMethod> {
    public model: string = 'api.diagram-method';
    protected dataService: DiagramMethodData;

    constructor() {
        super();
        this.dataService = new DiagramMethodData();
    }

    protected validar(diagramMethod: DiagramMethod) {
        if (!diagramMethod.name) {
            throw new Error('El nombre del método del diagrama es requerido');
        }
        if (!diagramMethod.returnType) {
            throw new Error('El tipo de retorno del método del diagrama es requerido');
        }
        // ... otras validaciones específicas para el método del diagrama
    }
}

export class DiagramParameterNegocio extends BaseNegocio<DiagramParameter> {
    public model: string = 'api.diagram-parameter';
    protected dataService: DiagramParameterData;

    constructor() {
        super();
        this.dataService = new DiagramParameterData();
    }

    protected validar(diagramParameter: DiagramParameter) {
        if (!diagramParameter.name) {
            throw new Error('El nombre del parámetro del diagrama es requerido');
        }
        if (!diagramParameter.type) {
            throw new Error('El tipo del parámetro del diagrama es requerido');
        }
        // ... otras validaciones específicas para el parámetro del diagrama
    }
}

export class DiagramRelationshipNegocio extends BaseNegocio<DiagramRelationship> {
    public model: string = 'api.diagram-relationship';
    protected dataService: DiagramRelationshipData;

    constructor() {
        super();
        this.dataService = new DiagramRelationshipData();
    }

    protected validar(diagramRelationship: DiagramRelationship) {
        if (!diagramRelationship.type) {
            throw new Error('El tipo de relación del diagrama es requerido');
        }
        if (!diagramRelationship.target) {
            throw new Error('El objetivo de la relación del diagrama es requerido');
        }
        // ... otras validaciones específicas para la relación del diagrama
    }
}

export class CodeExportOptionsNegocio extends BaseNegocio<CodeExportOptions> {
    public model: string = 'api.code-export-options';
    protected dataService: CodeExportOptionsData;

    constructor() {
        super();
        this.dataService = new CodeExportOptionsData();
    }

    protected validar(codeExportOptions: CodeExportOptions) {
        if (!codeExportOptions.framework) {
            throw new Error('El framework es requerido');
        }
        if (!['flutter', 'angular', 'both'].includes(codeExportOptions.framework)) {
            throw new Error('El framework debe ser "flutter", "angular" o "both"');
        }
        if (!['download', 'copy', 'preview'].includes(codeExportOptions.format)) {
            throw new Error('El formato debe ser "download", "copy" o "preview"');
        }
        // ... otras validaciones específicas para las opciones de exportación de código
    }
}

export class CollaborationDataOptionsNegocio extends BaseNegocio<CollaborationData> {
    public model: string = 'api.collaboration-data-options';
    protected dataService: CollaborationDataOptions;

    constructor() {
        super();
        this.dataService = new CollaborationDataOptions();
    }

    protected validar(collaborationData: CollaborationData) {
        if (!collaborationData.userId || !collaborationData.userName) {
            throw new Error('El ID y el nombre del usuario son requeridos');
        }
        if (!['editing', 'viewing', 'adding', 'deleting'].includes(collaborationData.action)) {
            throw new Error('La acción debe ser "editing", "viewing", "adding" o "deleting"');
        }
        // ... otras validaciones específicas para las opciones de datos de colaboración
    }
}

export class UnifiedElementOptionsNegocio extends BaseNegocio<UnifiedElement> {
    public model: string = 'api.unified-element-options';
    protected dataService: UnifiedElementOptionsData;

    constructor() {
        super();
        this.dataService = new UnifiedElementOptionsData();
    }

    protected validar(unifiedElement: UnifiedElement) {
        if (!unifiedElement.type) {
            throw new Error('El tipo del elemento unificado es requerido');
        }
        if (!unifiedElement.type) {
            throw new Error('El type del elemento unificado es requerido');
        }
        // ... otras validaciones específicas para las opciones del elemento unificado
    }
}
