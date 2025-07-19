// Guía completa para ver puntos de depuración
// Ejecutar en la consola del navegador

console.log('🔍 GUÍA PARA VER PUNTOS DE DEPURACIÓN');

// ========================================
// 1. CONSOLA DEL NAVEGADOR (F12)
// ========================================

console.log('📋 1. CONSOLA DEL NAVEGADOR:');
console.log('   - Presiona F12 para abrir las herramientas de desarrollador');
console.log('   - Ve a la pestaña "Console"');
console.log('   - Los mensajes de depuración aparecerán automáticamente');
console.log('   - Busca mensajes con emojis: 🖱️ 📊 📍 ✅ 🔄');

// Función para mostrar todos los logs de depuración
function showAllDebugLogs() {
    console.log('🔍 Mostrando todos los puntos de depuración disponibles:');
    console.log('');
    console.log('🖱️ Mouse down on element: [tipo] [id]');
    console.log('📊 Drag offset calculated: {x: [valor], y: [valor]}');
    console.log('✅ Drag started successfully');
    console.log('📍 New position calculated: {x: [valor], y: [valor]}');
    console.log('📍 Position after boundary check: {x: [valor], y: [valor]}');
    console.log('🖱️ Mouse up - ending drag');
    console.log('🔄 Drag ended for element: [tipo] [id]');
    console.log('📍 Posición final del DOM: {x: [valor], y: [valor]}');
    console.log('✅ Drag state reset');
    console.log('');
    console.log('🎯 Element clicked: [tipo] [id]');
    console.log('📤 Select event emitted for element: [id]');
    console.log('');
    console.log('⚠️ No se encontró el contenedor del canvas');
    console.log('❌ Elemento no encontrado: [id]');
}

// ========================================
// 2. DEPURADOR DE CHROME (BREAKPOINTS)
// ========================================

console.log('📋 2. DEPURADOR DE CHROME:');
console.log('   - En F12, ve a la pestaña "Sources"');
console.log('   - Busca el archivo: UnifiedWidgetRenderer.vue');
console.log('   - Haz clic en los números de línea para agregar breakpoints');
console.log('   - Líneas recomendadas para breakpoints:');

function showBreakpointLocations() {
    console.log('🔍 Líneas recomendadas para breakpoints:');
    console.log('');
    console.log('📌 handleMouseDown:');
    console.log('   - Línea ~240: Inicio de la función');
    console.log('   - Línea ~259: Cálculo del drag offset');
    console.log('   - Línea ~277: Fin de la función');
    console.log('');
    console.log('📌 handleMouseMove:');
    console.log('   - Línea ~290: Inicio de la función');
    console.log('   - Línea ~301: Cálculo de nueva posición');
    console.log('   - Línea ~311: Posición después de límites');
    console.log('   - Línea ~325: Aplicación al DOM');
    console.log('');
    console.log('📌 handleMouseUp:');
    console.log('   - Línea ~340: Inicio de la función');
    console.log('   - Línea ~350: Lectura de posición del DOM');
    console.log('   - Línea ~358: Fin de la función');
    console.log('');
    console.log('📌 handleElementClick:');
    console.log('   - Línea ~220: Inicio de la función');
    console.log('   - Línea ~240: Emisión del evento select');
}

// ========================================
// 3. HERRAMIENTAS DE DESARROLLO
// ========================================

console.log('📋 3. HERRAMIENTAS DE DESARROLLO:');
console.log('   - En F12, ve a la pestaña "Elements"');
console.log('   - Busca elementos con clase "unified-widget-element"');
console.log('   - Inspecciona los estilos en tiempo real');
console.log('   - Ve a la pestaña "Performance" para grabar el arrastre');

// Función para inspeccionar elementos en tiempo real
function inspectElements() {
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log('🔍 Elementos encontrados para inspección:');
    
    elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        console.log(`📍 Elemento ${index + 1}:`);
        console.log(`   - ID: ${element.dataset.elementId}`);
        console.log(`   - Tipo: ${element.dataset.elementType}`);
        console.log(`   - Posición: x=${rect.left}, y=${rect.top}`);
        console.log(`   - Tamaño: ${rect.width}x${rect.height}`);
        console.log(`   - Z-index: ${style.zIndex}`);
        console.log(`   - Cursor: ${style.cursor}`);
        console.log(`   - Seleccionado: ${element.classList.contains('selected-widget')}`);
        console.log(`   - Arrastrando: ${element.classList.contains('is-dragging')}`);
    });
}

// ========================================
// 4. LOGS PERSONALIZADOS
// ========================================

console.log('📋 4. LOGS PERSONALIZADOS:');
console.log('   - Puedes agregar console.log() en cualquier parte del código');
console.log('   - Usa console.warn() para advertencias');
console.log('   - Usa console.error() para errores');
console.log('   - Usa console.table() para datos tabulares');

// Función para agregar logs personalizados
function addCustomLogs() {
    console.log('🔧 Agregando logs personalizados...');
    
    // Interceptar eventos de mouse
    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('.unified-widget-element')) {
            console.log('🎯 MOUSEDOWN detectado en elemento:', e.target.closest('.unified-widget-element').dataset.elementId);
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (document.querySelector('.is-dragging')) {
            console.log('🖱️ MOUSEMOVE durante arrastre:', { x: e.clientX, y: e.clientY });
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        if (document.querySelector('.is-dragging')) {
            console.log('🖱️ MOUSEUP - fin de arrastre');
        }
    });
    
    console.log('✅ Logs personalizados agregados');
}

// ========================================
// 5. MONITOREO EN TIEMPO REAL
// ========================================

console.log('📋 5. MONITOREO EN TIEMPO REAL:');
console.log('   - Usa setInterval para monitorear cambios');
console.log('   - Observa cambios en el DOM');
console.log('   - Monitorea el estado de Vue');

// Función para monitorear en tiempo real
function startRealTimeMonitoring() {
    console.log('🔍 Iniciando monitoreo en tiempo real...');
    
    let lastPositions = new Map();
    
    const monitor = setInterval(() => {
        const elements = document.querySelectorAll('.unified-widget-element');
        
        elements.forEach(element => {
            const id = element.dataset.elementId;
            const rect = element.getBoundingClientRect();
            const currentPos = { x: rect.left, y: rect.top };
            
            if (lastPositions.has(id)) {
                const lastPos = lastPositions.get(id);
                if (lastPos.x !== currentPos.x || lastPos.y !== currentPos.y) {
                    console.log(`📍 Elemento ${id} se movió:`, {
                        from: lastPos,
                        to: currentPos,
                        delta: {
                            x: currentPos.x - lastPos.x,
                            y: currentPos.y - lastPos.y
                        }
                    });
                }
            }
            
            lastPositions.set(id, currentPos);
        });
    }, 100);
    
    console.log('✅ Monitoreo iniciado. Para detener, ejecuta: clearInterval(monitor)');
    return monitor;
}

// ========================================
// 6. FUNCIONES DE DEPURACIÓN RÁPIDA
// ========================================

// Función para ver estado actual
function showCurrentState() {
    console.log('🔍 Estado actual del sistema:');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    const selectedElements = document.querySelectorAll('.selected-widget');
    const draggingElements = document.querySelectorAll('.is-dragging');
    
    console.log(`📊 Elementos totales: ${elements.length}`);
    console.log(`📊 Elementos seleccionados: ${selectedElements.length}`);
    console.log(`📊 Elementos arrastrando: ${draggingElements.length}`);
    
    if (draggingElements.length > 0) {
        draggingElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            console.log(`🖱️ Elemento arrastrando: ${element.dataset.elementId} en (${rect.left}, ${rect.top})`);
        });
    }
}

// Función para limpiar logs
function clearDebugLogs() {
    console.clear();
    console.log('🧹 Logs de depuración limpiados');
}

// ========================================
// EXPORTAR FUNCIONES
// ========================================

window.showAllDebugLogs = showAllDebugLogs;
window.showBreakpointLocations = showBreakpointLocations;
window.inspectElements = inspectElements;
window.addCustomLogs = addCustomLogs;
window.startRealTimeMonitoring = startRealTimeMonitoring;
window.showCurrentState = showCurrentState;
window.clearDebugLogs = clearDebugLogs;

console.log('📋 FUNCIONES DE DEPURACIÓN DISPONIBLES:');
console.log('- showAllDebugLogs(): Mostrar todos los puntos de depuración');
console.log('- showBreakpointLocations(): Mostrar ubicaciones de breakpoints');
console.log('- inspectElements(): Inspeccionar elementos en tiempo real');
console.log('- addCustomLogs(): Agregar logs personalizados');
console.log('- startRealTimeMonitoring(): Monitoreo en tiempo real');
console.log('- showCurrentState(): Mostrar estado actual');
console.log('- clearDebugLogs(): Limpiar logs');

console.log('💡 Para ver todos los puntos de depuración, ejecuta: showAllDebugLogs()'); 