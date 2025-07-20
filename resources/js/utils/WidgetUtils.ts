import type { UnifiedElement } from '@/Data/PizarraUnificada';

export class WidgetUtils {
  /**
   * Obtiene las propiedades por defecto para un tipo de widget y framework
   */
  static getDefaultProps(type: string, framework: string, availableWidgets: any[]): Record<string, any> {
    const widgetDef = availableWidgets.find(w => w.type === type && (w.framework === framework || !w.framework));
    if (!widgetDef) return {};
    const props: Record<string, any> = {};
    (widgetDef.properties || []).forEach((prop: any) => {
      props[prop.name] = prop.defaultValue;
    });
    return props;
  }

  /**
   * Crea un widget unificado
   */
  static createWidget(type: string, framework: string, availableWidgets: any[], position?: {x: number, y: number}, size?: {width: number, height: number}): UnifiedElement {
    const props = this.getDefaultProps(type, framework, availableWidgets);
    return {
      id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      framework,
      props,
      properties: props,
      position: position || { x: 120, y: 120 },
      size: size || { width: 200, height: 48 },
      children: [],
      zIndex: 1,
      opacity: 1,
      transform: 'none',
    };
  }

  /**
   * Duplica un widget unificado
   */
  static duplicateWidget(element: UnifiedElement): UnifiedElement {
    return {
      ...element,
      id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: element.position ? { x: element.position.x + 20, y: element.position.y + 20 } : { x: 120, y: 120 },
      children: element.children ? element.children.map(child => this.duplicateWidget(child)) : []
    };
  }

  /**
   * Valida que un widget tenga todas las propiedades requeridas
   */
  static validateWidget(element: UnifiedElement, availableWidgets: any[]): boolean {
    const widgetDef = availableWidgets.find(w => w.type === element.type && (w.framework === element.framework || !w.framework));
    if (!widgetDef) return false;
    const requiredProps = (widgetDef.properties || []).filter((prop: any) => prop.required);
    for (const prop of requiredProps) {
      if (!(prop.name in element.props)) {
        return false;
      }
    }
    return true;
  }
} 