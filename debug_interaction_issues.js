// Script de diagnóstico para problemas de interacción
// Ejecutar en la consola del navegador

console.log('🔍 Diagnóstico de problemas de interacción...');

// Función para encontrar el componente principal
function findMainComponent() {
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
    
    return vueComponent;
}

// Función para agregar elementos de prueba
function addTestElements() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🔧 Agregando elementos de prueba...');
    
    // Limpiar elementos existentes
    if (component.currentScreen) {
        component.currentScreen.elements = [];
    }
    
    // Agregar elementos de prueba
    const testElements = ['TextField', 'ElevatedButton'];
    
    testElements.forEach((widgetType, index) => {
        setTimeout(() => {
            if (component.addWidget) {
                component.addWidget(widgetType);
                console.log(`✅ ${widgetType} agregado`);
            }
        }, index * 1000);
    });
}

// Función para verificar eventos en elementos
function checkElementEvents() {
    console.log('🔍 Verificando eventos en elementos...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    elements.forEach((element, index) => {
        console.log(`📍 Elemento ${index + 1}:`);
        
        // Verificar atributos de eventos
        const hasClickAttribute = element.hasAttribute('@click') || element.getAttribute('v-on:click');
        const hasMouseDownAttribute = element.hasAttribute('@mousedown') || element.getAttribute('v-on:mousedown');
        
        console.log(`   - Tiene @click: ${hasClickAttribute}`);
        console.log(`   - Tiene @mousedown: ${hasMouseDownAttribute}`);
        
        // Verificar clases
        console.log(`   - Clases: ${element.className}`);
        
        // Verificar pointer-events
        const computedStyle = window.getComputedStyle(element);
        console.log(`   - Pointer events: ${computedStyle.pointerEvents}`);
        console.log(`   - Cursor: ${computedStyle.cursor}`);
        
        // Verificar si está visible y clickeable
        const rect = element.getBoundingClientRect();
        console.log(`   - Visible: ${rect.width > 0 && rect.height > 0}`);
        console.log(`   - Posición: x=${rect.left}, y=${rect.top}`);
        console.log(`   - Tamaño: width=${rect.width}, height=${rect.height}`);
    });
}

// Función para agregar listeners de debug
function addDebugListeners() {
    console.log('🔧 Agregando listeners de debug...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        // Listener de clic
        element.addEventListener('click', (e) => {
            console.log(`🎯 CLIC detectado en elemento ${index + 1}:`, {
                element: element,
                event: e,
                target: e.target,
                currentTarget: e.currentTarget,
                bubbles: e.bubbles,
                cancelable: e.cancelable,
                defaultPrevented: e.defaultPrevented,
                stopPropagation: e.stopPropagation
            });
        }, true);
        
        // Listener de mousedown
        element.addEventListener('mousedown', (e) => {
            console.log(`🖱️ MOUSEDOWN detectado en elemento ${index + 1}:`, {
                element: element,
                event: e,
                target: e.target,
                currentTarget: e.currentTarget
            });
        }, true);
        
        // Listener de mouseup
        element.addEventListener('mouseup', (e) => {
            console.log(`🖱️ MOUSEUP detectado en elemento ${index + 1}:`, {
                element: element,
                event: e,
                target: e.target,
                currentTarget: e.currentTarget
            });
        }, true);
    });
}

// Función para simular interacciones
function simulateInteractions() {
    console.log('🎯 Simulando interacciones...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para interactuar');
        return;
    }
    
    const element = elements[0];
    console.log('🎯 Elemento para interactuar:', element);
    
    // Simular clic
    console.log('📋 Simulando clic...');
    element.click();
    
    // Simular mousedown y mouseup
    setTimeout(() => {
        console.log('📋 Simulando mousedown...');
        const mousedownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(mousedownEvent);
        
        setTimeout(() => {
            console.log('📋 Simulando mouseup...');
            const mouseupEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(mouseupEvent);
        }, 100);
    }, 500);
}

// Función para verificar estado del componente
function checkComponentState() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🔍 Verificando estado del componente...');
    
    // Verificar funciones disponibles
    const requiredFunctions = ['selectElement', 'addWidget', 'removeElement', 'updateElementProperty'];
    requiredFunctions.forEach(funcName => {
        if (typeof component[funcName] === 'function') {
            console.log(`   ✅ ${funcName}: disponible`);
        } else {
            console.log(`   ❌ ${funcName}: NO disponible`);
        }
    });
    
    // Verificar estado
    console.log('📋 Estado actual:');
    console.log(`   - selectedElement:`, component.selectedElement);
    console.log(`   - showPropertiesPanel:`, component.showPropertiesPanel);
    console.log(`   - currentScreen:`, component.currentScreen);
    
    // Verificar elementos en el estado
    const elements = component.currentScreen?.elements || [];
    console.log(`   - Elementos en estado: ${elements.length}`);
    elements.forEach((element, index) => {
        console.log(`     - Elemento ${index + 1}: ${element.type} (${element.id})`);
    });
}

// Función para forzar selección
function forceSelection() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🎯 Forzando selección...');
    
    const elements = component.currentScreen?.elements || [];
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para seleccionar');
        return;
    }
    
    const firstElement = elements[0];
    console.log('🎯 Seleccionando elemento:', firstElement);
    
    if (component.selectElement) {
        component.selectElement(firstElement);
        console.log('✅ Función selectElement ejecutada');
        
        setTimeout(() => {
            console.log('📋 Estado después de forzar selección:');
            console.log(`   - selectedElement:`, component.selectedElement);
            console.log(`   - showPropertiesPanel:`, component.showPropertiesPanel);
        }, 100);
    } else {
        console.log('❌ Función selectElement no disponible');
    }
}

// Función para verificar conflictos de CSS
function checkCSSConflicts() {
    console.log('🎨 Verificando conflictos de CSS...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        
        console.log(`📍 Elemento ${index + 1} - CSS:`);
        console.log(`   - Pointer events: ${computedStyle.pointerEvents}`);
        console.log(`   - User select: ${computedStyle.userSelect}`);
        console.log(`   - Cursor: ${computedStyle.cursor}`);
        console.log(`   - Position: ${computedStyle.position}`);
        console.log(`   - Z-index: ${computedStyle.zIndex}`);
        console.log(`   - Overflow: ${computedStyle.overflow}`);
        
        // Verificar si hay elementos que bloqueen los clics
        const parent = element.parentElement;
        if (parent) {
            const parentStyle = window.getComputedStyle(parent);
            console.log(`   - Parent pointer events: ${parentStyle.pointerEvents}`);
            console.log(`   - Parent overflow: ${parentStyle.overflow}`);
        }
    });
}

// Función principal de diagnóstico
function runInteractionDiagnostic() {
    console.log('🚀 Ejecutando diagnóstico completo de interacciones...');
    
    // Paso 1: Verificar estado del componente
    checkComponentState();
    
    // Paso 2: Agregar elementos de prueba
    addTestElements();
    
    // Paso 3: Verificar elementos y eventos
    setTimeout(() => {
        checkElementEvents();
        checkCSSConflicts();
        
        // Paso 4: Agregar listeners de debug
        addDebugListeners();
        
        // Paso 5: Simular interacciones
        setTimeout(() => {
            simulateInteractions();
            
            // Paso 6: Forzar selección
            setTimeout(() => {
                forceSelection();
                
                // Resumen final
                setTimeout(() => {
                    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
                    const component = findMainComponent();
                    if (component) {
                        console.log(`✅ Elementos en pantalla: ${component.currentScreen?.elements?.length || 0}`);
                        console.log(`✅ Elemento seleccionado: ${component.selectedElement ? 'SÍ' : 'NO'}`);
                        console.log(`✅ Panel de propiedades: ${component.showPropertiesPanel ? 'VISIBLE' : 'OCULTO'}`);
                    }
                    
                    const selectedElements = document.querySelectorAll('.selected-widget');
                    console.log(`✅ Elementos con estilo seleccionado: ${selectedElements.length}`);
                    
                    console.log('\n💡 INSTRUCCIONES:');
                    console.log('1. Haz clic en los elementos para ver los logs de eventos');
                    console.log('2. Verifica si aparecen los logs de CLIC y MOUSEDOWN');
                    console.log('3. Si no aparecen logs, hay un problema con los eventos');
                    console.log('4. Si aparecen logs pero no se selecciona, hay un problema con la función selectElement');
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
}

// Función para limpiar listeners de debug
function clearDebugListeners() {
    console.log('🧹 Limpiando listeners de debug...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        // Clonar el elemento para remover todos los listeners
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        console.log(`✅ Listeners removidos del elemento ${index + 1}`);
    });
}

// Exportar funciones
window.runInteractionDiagnostic = runInteractionDiagnostic;
window.addTestElements = addTestElements;
window.checkElementEvents = checkElementEvents;
window.addDebugListeners = addDebugListeners;
window.simulateInteractions = simulateInteractions;
window.checkComponentState = checkComponentState;
window.forceSelection = forceSelection;
window.checkCSSConflicts = checkCSSConflicts;
window.clearDebugListeners = clearDebugListeners;

console.log('📋 Funciones de diagnóstico disponibles:');
console.log('- runInteractionDiagnostic(): Diagnóstico completo');
console.log('- addTestElements(): Agregar elementos de prueba');
console.log('- checkElementEvents(): Verificar eventos');
console.log('- addDebugListeners(): Agregar listeners de debug');
console.log('- simulateInteractions(): Simular interacciones');
console.log('- checkComponentState(): Verificar estado del componente');
console.log('- forceSelection(): Forzar selección');
console.log('- checkCSSConflicts(): Verificar conflictos CSS');
console.log('- clearDebugListeners(): Limpiar listeners de debug');

console.log('💡 Para ejecutar el diagnóstico completo, usa: runInteractionDiagnostic()'); 