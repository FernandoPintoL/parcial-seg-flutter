# Gestión de Invitaciones en Pizarra Unificada

Este documento describe la funcionalidad de gestión de invitaciones implementada en la Pizarra Unificada, incluyendo la generación de enlaces de invitación y el envío de invitaciones por correo electrónico.

## Características Implementadas

1. **Generación de Enlaces de Invitación**
   - Generar enlaces de invitación para compartir
   - Copiar enlaces al portapapeles
   - Generar nuevos enlaces con timestamps únicos

2. **Invitaciones por Correo Electrónico**
   - Enviar invitaciones a colaboradores por correo electrónico
   - Gestionar invitaciones pendientes
   - Aceptar o rechazar invitaciones recibidas

## Componentes Principales

### InvitationModal

Este componente muestra un modal con dos secciones principales:

1. **Sección de Enlaces de Invitación**
   - Muestra un enlace de invitación generado automáticamente
   - Permite copiar el enlace al portapapeles
   - Permite generar un nuevo enlace con un timestamp único

2. **Sección de Invitaciones por Correo Electrónico**
   - Permite ingresar el correo electrónico de un colaborador
   - Envía una invitación al correo electrónico ingresado
   - Muestra un mensaje de confirmación cuando la invitación se envía correctamente

### InvitationLinkGenerator

Este componente se encarga de generar enlaces de invitación:

- Genera enlaces con parámetros de roomId y pizarraId
- Agrega un timestamp único para evitar duplicados
- Proporciona botones para copiar y regenerar enlaces

### InvitationService

Este servicio proporciona métodos para gestionar invitaciones:

- `generateInvitationLink()`: Genera un enlace de invitación
- `sendInvitation()`: Envía una invitación por correo electrónico
- `acceptInvitation()`: Acepta una invitación recibida
- `rejectInvitation()`: Rechaza una invitación recibida
- `getInvitations()`: Obtiene todas las invitaciones del usuario actual
- `getCollaborators()`: Obtiene todos los colaboradores de una pizarra
- `addCollaborator()`: Agrega un colaborador a una pizarra
- `removeCollaborator()`: Elimina un colaborador de una pizarra

## Cómo Usar

### Generar y Compartir Enlaces de Invitación

1. **Desde la página de Índice**
   - Haga clic en el botón "Invitar" junto a una pizarra
   - Se abrirá un modal con un enlace de invitación
   - Haga clic en "Copiar" para copiar el enlace al portapapeles
   - Comparta el enlace con las personas que desea invitar

2. **Desde el Dashboard**
   - Haga clic en el botón "Invitar" (icono de persona) en cualquier tarjeta de pizarra
   - Se abrirá un modal con un enlace de invitación
   - Haga clic en "Copiar" para copiar el enlace al portapapeles
   - Comparta el enlace con las personas que desea invitar

### Enviar Invitaciones por Correo Electrónico

1. **Desde la página de Índice o Dashboard**
   - Haga clic en el botón "Invitar" junto a una pizarra
   - En la sección "Invitar por Correo Electrónico", ingrese el correo del colaborador
   - Haga clic en "Enviar" para enviar la invitación
   - Se mostrará un mensaje de confirmación cuando la invitación se envíe correctamente

### Gestionar Invitaciones Recibidas

1. **Ver Invitaciones Pendientes**
   - En la página de Índice o Dashboard, se muestra una sección de "Invitaciones Pendientes"
   - Aquí puede ver todas las invitaciones que ha recibido

2. **Aceptar o Rechazar Invitaciones**
   - Para cada invitación pendiente, hay botones para "Aceptar" o "Rechazar"
   - Al aceptar, se le agregará como colaborador a la pizarra
   - Al rechazar, la invitación se eliminará de su lista

## Pruebas

Para probar la funcionalidad de gestión de invitaciones:

1. **Generar Enlaces de Invitación**
   - Abra la página de Índice o Dashboard
   - Haga clic en el botón "Invitar" junto a una pizarra
   - Verifique que se genera un enlace de invitación
   - Copie el enlace y ábralo en una ventana de incógnito o en otro navegador
   - Verifique que puede acceder a la pizarra como colaborador

2. **Enviar Invitaciones por Correo Electrónico**
   - Abra la página de Índice o Dashboard
   - Haga clic en el botón "Invitar" junto a una pizarra
   - Ingrese un correo electrónico válido y haga clic en "Enviar"
   - Verifique que recibe un mensaje de confirmación
   - Acceda a la cuenta de correo electrónico y verifique que recibió la invitación
   - Haga clic en el enlace de la invitación y verifique que puede acceder a la pizarra

3. **Gestionar Invitaciones Recibidas**
   - Pida a otro usuario que le envíe una invitación
   - Acceda a la página de Índice o Dashboard
   - Verifique que la invitación aparece en la sección "Invitaciones Pendientes"
   - Acepte la invitación y verifique que puede acceder a la pizarra
   - Pida a otro usuario que le envíe otra invitación
   - Rechace la invitación y verifique que desaparece de la lista

## Consideraciones de Seguridad

- Los enlaces de invitación incluyen un timestamp único para evitar duplicados
- Las invitaciones por correo electrónico requieren autenticación
- Solo el creador de la pizarra puede enviar invitaciones
- Las invitaciones tienen un tiempo de expiración (configurable)

## Solución de Problemas

Si encuentra algún problema con la gestión de invitaciones:

1. **Enlaces de Invitación no Funcionan**
   - Verifique que el enlace incluye los parámetros correctos (roomId, pizarraId, timestamp)
   - Verifique que el enlace no ha expirado
   - Verifique que tiene permisos para acceder a la pizarra

2. **Invitaciones por Correo Electrónico no Llegan**
   - Verifique que el correo electrónico es válido
   - Verifique la carpeta de spam
   - Verifique que el servidor de correo está configurado correctamente

3. **No Puede Aceptar Invitaciones**
   - Verifique que está autenticado en la aplicación
   - Verifique que la invitación no ha expirado
   - Verifique que la pizarra aún existe
