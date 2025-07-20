export class JsonUtils {
  /**
   * Limpia una cadena JSON para intentar hacerla parseable.
   */
  static cleanJsonString(jsonStr: string): string {
    let cleaned = jsonStr.replace(/,\s*([}\]])/g, '$1');
    cleaned = cleaned.replace(/'/g, '"');
    cleaned = cleaned.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
    return cleaned;
  }

  /**
   * Extrae el primer bloque JSON de un texto (por ejemplo, de un bloque markdown).
   */
  static extractJsonBlock(text: string): string | null {
    const match = text.match(/```json\n([\s\S]*?)```/);
    return match ? match[1] : null;
  }

  /**
   * Intenta parsear un string como JSON, limpiando antes si es necesario.
   */
  static parseJsonSafe(jsonStr: string): any | null {
    try {
      return JSON.parse(this.cleanJsonString(jsonStr));
    } catch {
      return null;
    }
  }
} 