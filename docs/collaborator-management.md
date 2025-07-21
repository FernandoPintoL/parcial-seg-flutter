# Gestión de Colaboradores en Pizarra Unificada

Este documento describe la funcionalidad de gestión de colaboradores implementada en la Pizarra Unificada, incluyendo la generación de enlaces de invitación.

## Características Implementadas

1. **Gestión de Colaboradores**
   - Ver la lista de colaboradores actuales
   - Agregar nuevos colaboradores
   - Eliminar colaboradores existentes

2. **Enlaces de Invitación**
   - Generar enlaces de invitación para compartir
   - Copiar enlaces al portapapeles
   - Generar nuevos enlaces con timestamps únicos

## Componentes Principales

### CollaboratorManagementModal

Este componente muestra un modal con dos secciones principales:

1. **Sección de Enlaces de Invitación**
   - Muestra un enlace de invitación generado automáticamente
   - Permite copiar el enlace al portapapeles
   - Permite generar un nuevo enlace con un timestamp único

2. **Sección de Colaboradores Actuales**
   - Muestra al usuario actual con su rol (creador o colaborador)
   - Muestra la lista de otros colaboradores
   - Permite eliminar colaboradores (si el usuario es el creador)
   - Permite agregar nuevos colaboradores por correo electrónico (si el usuario es el creador)

### UnifiedCollaborationService

Se han agregado los siguientes métodos al servicio de colaboración:

- `addCollaborator(userId, status)`: Agrega un colaborador a la pizarra
- `removeCollaborator(userId)`: Elimina un colaborador de la pizarra
- `updateCollaboratorStatus(userId, status)`: Actualiza el estado de un colaborador
- `generateInvitationLink()`: Genera un enlace de invitación para la pizarra

### usePizarraCollaboration

Se han agregado los siguientes métodos al composable de colaboración:

- `addCollaborator(userId, status)`: Llama al método correspondiente en el servicio de colaboración
- `removeCollaborator(userId)`: Llama al método correspondiente en el servicio de colaboración
- `updateCollaboratorStatus(userId, status)`: Llama al método correspondiente en el servicio de colaboración
- `generateInvitationLink()`: Llama al método correspondiente en el servicio de colaboración

## Cómo Usar

### Abrir el Modal de Gestión de Colaboradores

1. Haga clic en el botón de "Gestión de Colaboradores" en la barra de herramientas flotante (icono de personas)
2. El modal se abrirá mostrando la lista de colaboradores actuales y un enlace de invitación

### Generar y Compartir Enlaces de Invitación

1. El enlace de invitación se genera automáticamente al abrir el modal
2. Haga clic en el botón "Copiar" para copiar el enlace al portapapeles
3. Comparta el enlace con las personas que desea invitar a colaborar
4. Si desea generar un nuevo enlace, haga clic en el botón "Generar Nuevo Enlace"

### Gestionar Colaboradores

1. Para agregar un colaborador, ingrese su correo electrónico en el campo correspondiente y haga clic en "Agregar"
2. Para eliminar un colaborador, haga clic en el botón de eliminar (icono de papelera) junto al nombre del colaborador

## Consideraciones de Seguridad

- Los enlaces de invitación incluyen un timestamp único para evitar duplicados
- Solo el creador de la pizarra puede agregar o eliminar colaboradores
- Los colaboradores solo pueden ver y editar la pizarra, no pueden agregar o eliminar otros colaboradores

## Implementación Técnica

La implementación sigue los principios SOLID:

- **Principio de Responsabilidad Única (SRP)**: Cada componente tiene una responsabilidad clara
- **Principio Abierto/Cerrado (OCP)**: Se ha extendido la funcionalidad existente sin modificarla
- **Principio de Segregación de Interfaces (ISP)**: Las interfaces están enfocadas en tareas específicas
- **Principio de Inversión de Dependencias (DIP)**: Se depende de abstracciones en lugar de implementaciones concretas

## Pruebas

Para probar la funcionalidad de gestión de colaboradores:

1. Abra la Pizarra Unificada
2. Haga clic en el botón de "Gestión de Colaboradores" en la barra de herramientas flotante
3. Verifique que puede ver la lista de colaboradores actuales
4. Verifique que puede generar y copiar enlaces de invitación
5. Si es el creador, verifique que puede agregar y eliminar colaboradores
6. Comparta un enlace de invitación y verifique que otros usuarios pueden unirse a la pizarra

## Solución de Problemas

Si encuentra algún problema con la gestión de colaboradores:

1. Verifique que está conectado al servidor de sockets
2. Verifique que tiene los permisos necesarios (debe ser el creador para agregar o eliminar colaboradores)
3. Verifique que el enlace de invitación incluye el roomId y pizarraId correctos
4. Si el problema persiste, consulte la consola del navegador para ver si hay errores específicos
