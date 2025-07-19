// Script de diagnóstico para el problema de arrastre
// Ejecutar en la consola del navegador

console.log('🔍 Diagnóstico del problema de arrastre...');

// Función para verificar el estado del elemento
function checkElementState(elementId) {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) {
        console.error('❌ Elemento no encontrado:', elementId);
        return;
    }
    
    console.log('📊 Estado del elemento:', elementId);
    console.log('   - Elemento DOM:', element);
    console.log('   - Clases:', element.className);
    console.log('   - Estilos inline:');
    console.log('     * left:', element.style.left);
    console.log('     * top:', element.style.top);
    console.log('     * z-index:', element.style.zIndex);
    console.log('     * transform:', element.style.transform);
    console.log('     * transition:', element.style.transition);
    
    const computedStyle = window.getComputedStyle(element);
    console.log('   - Estilos computados:');
    console.log('     * left:', computedStyle.left);
    console.log('     * top:', computedStyle.top);
    console.log('     * z-index:', computedStyle.zIndex);
    console.log('     * position:', computedStyle.position);
    
    const rect = element.getBoundingClientRect();
    console.log('   - Posición real:');
    console.log('     * x:', rect.left);
    console.log('     * y:', rect.top);
    console.log('     * width:', rect.width);
    console.log('     * height:', rect.height);
}

// Función para verificar el componente Vue
function checkVueComponent() {
    const app = document.querySelector('#app');
    if (!app) {
        console.error('❌ No se encontró el elemento #app');
        return null;
    }
    
    const vueComponent = app.__vueParentComponent || app.__vue__;
    if (!vueComponent) {
        console.error('❌ No se encontró el componente Vue principal');
        return null;
    }
    
    console.log('📊 Componente Vue encontrado:', vueComponent);
    
    // Verificar si tiene la propiedad currentScreen
    if (vueComponent.currentScreen) {
        console.log('✅ currentScreen encontrado');
        console.log('   - Elementos:', vueComponent.currentScreen.elements?.length || 0);
        
        if (vueComponent.currentScreen.elements) {
            vueComponent.currentScreen.elements.forEach((element, index) => {
                console.log(`   - Elemento ${index}:`, {
                    id: element.id,
                    type: element.type,
                    position: element.position,
                    zIndex: element.zIndex
                });
            });
        }
    } else {
        console.log('❌ currentScreen no encontrado');
    }
    
    return vueComponent;
}

// Función para simular arrastre manual
function simulateManualDrag(elementId) {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) {
        console.error('❌ Elemento no encontrado:', elementId);
        return;
    }
    
    console.log('🎯 Simulando arrastre manual para:', elementId);
    
    // Obtener posición inicial
    const initialRect = element.getBoundingClientRect();
    console.log('📍 Posición inicial:', { x: initialRect.left, y: initialRect.top });
    
    // Simular mousedown en el elemento
    const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: initialRect.left + 50,
        clientY: initialRect.top + 25
    });
    
    console.log('🖱️ Disparando mousedown...');
    element.dispatchEvent(mousedownEvent);
    
    // Verificar estado después del mousedown
    setTimeout(() => {
        console.log('📊 Estado después del mousedown:');
        checkElementState(elementId);
        
        // Simular mousemove
        setTimeout(() => {
            const mousemoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: initialRect.left + 150,
                clientY: initialRect.top + 75
            });
            
            console.log('🖱️ Disparando mousemove...');
            document.dispatchEvent(mousemoveEvent);
            
            // Verificar estado después del mousemove
            setTimeout(() => {
                console.log('📊 Estado después del mousemove:');
                checkElementState(elementId);
                
                // Simular mouseup
                setTimeout(() => {
                    const mouseupEvent = new MouseEvent('mouseup', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    
                    console.log('🖱️ Disparando mouseup...');
                    document.dispatchEvent(mouseupEvent);
                    
                    // Verificar estado final
                    setTimeout(() => {
                        console.log('📊 Estado final:');
                        checkElementState(elementId);
                        
                        const finalRect = element.getBoundingClientRect();
                        const moved = finalRect.left !== initialRect.left || finalRect.top !== initialRect.top;
                        console.log(`✅ Elemento ${moved ? 'se movió' : 'NO se movió'}`);
                        
                        if (moved) {
                            console.log('📍 Desplazamiento:', {
                                x: finalRect.left - initialRect.left,
                                y: finalRect.top - initialRect.top
                            });
                        }
                    }, 500);
                }, 100);
            }, 100);
        }, 100);
    }, 100);
}

// Función para verificar el contenedor del canvas
function checkCanvasContainer() {
    console.log('🔍 Verificando contenedor del canvas...');
    
    const containers = [
        '.unified-canvas',
        '.canvas-container',
        '.phone-content-area',
        '.browser-content'
    ];
    
    containers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            const rect = container.getBoundingClientRect();
            console.log(`✅ Contenedor ${selector} encontrado:`);
            console.log(`   - Tamaño: ${rect.width}x${rect.height}`);
            console.log(`   - Posición: x=${rect.left}, y=${rect.top}`);
            console.log(`   - Scroll: left=${container.scrollLeft}, top=${container.scrollTop}`);
            console.log(`   - Overflow: ${window.getComputedStyle(container).overflow}`);
        } else {
            console.log(`❌ Contenedor ${selector} NO encontrado`);
        }
    });
}

// Función para verificar elementos disponibles
function checkAvailableElements() {
    console.log('🔍 Verificando elementos disponibles...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    elements.forEach((element, index) => {
        const elementId = element.dataset.elementId;
        const elementType = element.dataset.elementType;
        const rect = element.getBoundingClientRect();
        
        console.log(`📍 Elemento ${index + 1}:`);
        console.log(`   - ID: ${elementId}`);
        console.log(`   - Tipo: ${elementType}`);
        console.log(`   - Posición: x=${rect.left}, y=${rect.top}`);
        console.log(`   - Seleccionado: ${element.classList.contains('selected-widget')}`);
        console.log(`   - Tiene handle de arrastre: ${element.querySelector('.drag-handle') !== null}`);
    });
    
    return elements;
}

// Función para forzar actualización de un elemento
function forceElementUpdate(elementId) {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) {
        console.error('❌ Elemento no encontrado:', elementId);
        return;
    }
    
    console.log('🔧 Forzando actualización del elemento:', elementId);
    
    // Forzar repaint
    element.offsetHeight;
    
    // Aplicar estilos directamente
    const currentLeft = element.style.left;
    const currentTop = element.style.top;
    
    element.style.left = currentLeft;
    element.style.top = currentTop;
    
    console.log('✅ Actualización forzada completada');
}

// Función principal de diagnóstico
function runDragDiagnostic() {
    console.log('🚀 Ejecutando diagnóstico completo de arrastre...');
    
    // Paso 1: Verificar contenedor del canvas
    checkCanvasContainer();
    
    // Paso 2: Verificar componente Vue
    const component = checkVueComponent();
    
    // Paso 3: Verificar elementos disponibles
    const elements = checkAvailableElements();
    
    if (elements.length === 0) {
        console.log('⚠️ No hay elementos para diagnosticar. Agrega elementos primero.');
        return;
    }
    
    // Paso 4: Verificar estado del primer elemento
    const firstElement = elements[0];
    const firstElementId = firstElement.dataset.elementId;
    
    console.log('\n📋 Diagnóstico del primer elemento:');
    checkElementState(firstElementId);
    
    // Paso 5: Simular arrastre en el primer elemento
    console.log('\n🎯 Simulando arrastre en el primer elemento...');
    simulateManualDrag(firstElementId);
    
    console.log('\n💡 Para diagnosticar un elemento específico:');
    console.log('- checkElementState("element-id")');
    console.log('- simulateManualDrag("element-id")');
    console.log('- forceElementUpdate("element-id")');
}

// Función para diagnosticar un elemento específico
function diagnoseElement(elementId) {
    console.log(`🔍 Diagnóstico específico para elemento: ${elementId}`);
    
    // Verificar estado inicial
    console.log('📊 Estado inicial:');
    checkElementState(elementId);
    
    // Simular arrastre
    console.log('\n🎯 Simulando arrastre...');
    simulateManualDrag(elementId);
}

// Exportar funciones
window.runDragDiagnostic = runDragDiagnostic;
window.checkElementState = checkElementState;
window.simulateManualDrag = simulateManualDrag;
window.forceElementUpdate = forceElementUpdate;
window.checkCanvasContainer = checkCanvasContainer;
window.checkAvailableElements = checkAvailableElements;
window.diagnoseElement = diagnoseElement;

console.log('📋 Funciones de diagnóstico disponibles:');
console.log('- runDragDiagnostic(): Diagnóstico completo');
console.log('- checkElementState("id"): Verificar estado de un elemento');
console.log('- simulateManualDrag("id"): Simular arrastre en un elemento');
console.log('- forceElementUpdate("id"): Forzar actualización de un elemento');
console.log('- checkCanvasContainer(): Verificar contenedor del canvas');
console.log('- checkAvailableElements(): Verificar elementos disponibles');
console.log('- diagnoseElement("id"): Diagnóstico específico de un elemento');

console.log('💡 Para ejecutar el diagnóstico completo, usa: runDragDiagnostic()'); 