# Mejoras de IA con Respuestas JSON Estructuradas

## 📋 Resumen de Cambios

Se ha implementado un sistema mejorado de generación de widgets/componentes que utiliza respuestas JSON estructuradas para facilitar la inserción directa en la pizarra.

## 🚀 Características Principales

### 1. **Respuestas JSON Estructuradas**
- **Formato consistente**: Todas las respuestas siguen un esquema JSON predefinido
- **Multi-framework**: Soporte nativo para Flutter y Angular
- **Metadatos enriquecidos**: Incluye framework, explicaciones y código completo

### 2. **Auto-detección de Framework**
- **Detección inteligente**: Analiza el prompt para determinar si el usuario quiere Flutter o Angular
- **Palabras clave**: Reconoce términos como "Angular", "TypeScript", "reactive forms", etc.
- **Fallback**: Por defecto usa Flutter si no se puede determinar

### 3. **Posicionamiento Automático**
- **Distribución inteligente**: Los widgets se posicionan automáticamente en la pizarra
- **Layout en grilla**: 3 columnas con separación de 200px horizontalmente y 100px verticalmente
- **Sin superposición**: Evita que los widgets se monten unos sobre otros

## 🛠️ Estructura JSON de Respuesta

```json
{
    "framework": "flutter" | "angular",
    "widgets": [
        {
            "type": "TextFormField" | "input" | "button" | "...",
            "props": {
                "decoration": "InputDecoration(labelText: 'Email')",
                "keyboardType": "TextInputType.emailAddress",
                "validator": "validation function"
            },
            "children": [],
            "position": {
                "x": 50,
                "y": 100
            },
            "id": "ai-widget-1234567890-0",
            "framework": "flutter"
        }
    ],
    "explanation": "Explicación detallada de los widgets generados",
    "code": "Código completo del componente (opcional)"
}
```

## 🔧 Componentes Técnicos Actualizados

### Frontend (`AIService.ts`)
- **Prompt mejorado**: Sistema de prompts que solicita específicamente respuestas JSON
- **Parser robusto**: Múltiples estrategias para extraer JSON de respuestas de IA
- **Fallback al backend**: Si Azure falla, usa el backend de Laravel como respaldo
- **Validación de respuestas**: Verifica que las respuestas tengan la estructura esperada

### Backend (`AzureService.php`)
- **Método `generateUI()`**: Auto-detecta framework y genera respuesta apropiada
- **Método `generateAngularUI()`**: Especializado en componentes Angular
- **Prompts especializados**: Diferentes prompts optimizados para cada framework

### Controller (`AIController.php`)
- **Endpoint `/ai/generate-ui-components`**: Nueva API que retorna JSON estructurado
- **Parser JSON mejorado**: Limpia y valida respuestas JSON
- **Soporte multi-framework**: Maneja tanto Flutter como Angular

### UI (`ChatAI.vue`)
- **Preview de widgets**: Muestra los tipos de widgets antes de añadir
- **Indicador de framework**: Identifica visualmente si es Flutter o Angular
- **Botón de código**: Permite ver el código completo generado
- **Contador de widgets**: Muestra cuántos widgets se van a añadir

## 📊 Widgets Soportados

### Flutter
- `TextFormField`, `ElevatedButton`, `TextButton`, `OutlinedButton`
- `DropdownButton`, `DropdownButtonFormField`
- `RadioListTile`, `Radio`, `CheckboxListTile`, `Checkbox`
- `Switch`, `SwitchListTile`, `Slider`
- `Text`

### Angular
- `input` (text, email, password, number, etc.)
- `button`, `select`, `radio`, `checkbox`, `textarea`
- `switch`, `toggle`, `slider`, `range`, `datepicker`

## 🎯 Ejemplos de Uso

### Comando por Voz Optimizado
- **Flutter**: "Formulario de registro con email, contraseña y botón"
- **Angular**: "Formulario de contacto Angular con validación"
- **Auto-detección**: "Crear login con email y password"

### Respuesta Esperada
```json
{
    "framework": "flutter",
    "widgets": [
        {
            "type": "TextFormField",
            "props": {
                "decoration": "InputDecoration(labelText: 'Email')",
                "keyboardType": "TextInputType.emailAddress"
            },
            "position": {"x": 50, "y": 100}
        },
        {
            "type": "TextFormField", 
            "props": {
                "decoration": "InputDecoration(labelText: 'Contraseña')",
                "obscureText": true
            },
            "position": {"x": 50, "y": 200}
        },
        {
            "type": "ElevatedButton",
            "props": {
                "onPressed": "() => _submitForm()",
                "child": "Text('Registrarse')"
            },
            "position": {"x": 50, "y": 300}
        }
    ],
    "explanation": "Formulario de registro con validación de email y contraseña",
    "code": "// Código Flutter completo aquí..."
}
```

## 🔄 Flujo de Funcionamiento

1. **Usuario habla** o escribe un prompt
2. **AIService** detecta si es Azure o Backend
3. **Prompt especializado** se envía a la IA
4. **Respuesta JSON** se parsea y valida
5. **Widgets se procesan** con posicionamiento automático
6. **Preview se muestra** en el chat
7. **Usuario confirma** y widgets se añaden a la pizarra

## 🚦 Estados y Fallbacks

### Orden de Prioridad
1. **Azure OpenAI** (si está configurado)
2. **Backend Laravel** (como fallback)
3. **Parser de código** (último recurso)

### Manejo de Errores
- **JSON inválido**: Intenta múltiples estrategias de parsing
- **Framework no detectado**: Usa Flutter por defecto
- **Widgets no reconocidos**: Los filtra automáticamente
- **Configuración faltante**: Usa backend como fallback

## ✅ Beneficios de la Implementación

1. **Inserción directa**: Los widgets se insertan sin procesamiento adicional
2. **Posicionamiento inteligente**: No hay overlapping ni posiciones aleatorias
3. **Multi-framework**: Soporte nativo para Flutter y Angular
4. **Respuestas consistentes**: Estructura predecible facilita el procesamiento
5. **Experiencia mejorada**: Preview de widgets antes de añadir
6. **Robustez**: Múltiples fallbacks aseguran funcionamiento
7. **Extensibilidad**: Fácil añadir nuevos frameworks o widgets

## 🔮 Próximas Mejoras Posibles

- **Soporte para React/Vue**: Añadir más frameworks
- **Templates predefinidos**: Formularios comunes pre-configurados
- **Validación visual**: Preview en tiempo real en la pizarra
- **Exportación optimizada**: Código más limpio y estructurado
- **IA contextual**: Recordar preferencias del usuario
- **Widgets compuestos**: Generar layouts completos (forms con containers)

## 🧪 Pruebas Recomendadas

1. **Prompt básico**: "formulario de login"
2. **Framework específico**: "formulario Angular con validación"
3. **Comando complejo**: "registro de usuario con email, password, confirmación, términos y botón"
4. **Auto-detección**: "crear contacto con nombre, email, mensaje"
5. **Fallback**: Desconectar Azure y probar backend
