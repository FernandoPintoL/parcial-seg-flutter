// Script de diagnóstico específico para eventos de clic
// Ejecutar en la consola del navegador

console.log('🔍 Diagnóstico específico de eventos de clic...');

// Función para agregar listeners de debug a elementos
function addDebugListeners() {
    console.log('🔧 Agregando listeners de debug...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    elements.forEach((element, index) => {
        console.log(`📍 Agregando listeners al elemento ${index + 1}:`, element);
        
        // Agregar listener de clic
        element.addEventListener('click', (e) => {
            console.log(`🎯 CLIC detectado en elemento ${index + 1}:`, {
                element: element,
                event: e,
                target: e.target,
                currentTarget: e.currentTarget,
                bubbles: e.bubbles,
                cancelable: e.cancelable,
                defaultPrevented: e.defaultPrevented
            });
        }, true); // Usar capture para detectar el evento antes
        
        // Agregar listener de mousedown
        element.addEventListener('mousedown', (e) => {
            console.log(`🖱️ MOUSEDOWN detectado en elemento ${index + 1}:`, {
                element: element,
                event: e,
                target: e.target,
                currentTarget: e.currentTarget
            });
        }, true);
        
        // Verificar si tiene eventos de Vue
        const vueComponent = element.__vueParentComponent || element.__vue__;
        if (vueComponent) {
            console.log(`   - Componente Vue encontrado:`, vueComponent);
        } else {
            console.log(`   - No se encontró componente Vue`);
        }
    });
}

// Función para verificar la estructura del DOM
function checkDOMStructure() {
    console.log('🔍 Verificando estructura del DOM...');
    
    const canvas = document.querySelector('.unified-canvas');
    if (!canvas) {
        console.error('❌ No se encontró el canvas');
        return;
    }
    
    console.log('📋 Estructura del canvas:', canvas);
    
    // Verificar elementos anidados
    const elements = canvas.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        console.log(`📍 Elemento ${index + 1}:`);
        console.log(`   - Tag: ${element.tagName}`);
        console.log(`   - Classes: ${element.className}`);
        console.log(`   - ID: ${element.id}`);
        console.log(`   - Data attributes:`, element.dataset);
        console.log(`   - Style: ${element.style.cssText}`);
        console.log(`   - Computed style:`, window.getComputedStyle(element));
        
        // Verificar si está visible
        const rect = element.getBoundingClientRect();
        console.log(`   - Bounding rect:`, rect);
        console.log(`   - Visible: ${rect.width > 0 && rect.height > 0}`);
        
        // Verificar pointer-events
        const computedStyle = window.getComputedStyle(element);
        console.log(`   - Pointer events: ${computedStyle.pointerEvents}`);
        console.log(`   - Z-index: ${computedStyle.zIndex}`);
    });
}

// Función para simular clic con diferentes métodos
function testClickMethods() {
    console.log('🎯 Probando diferentes métodos de clic...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para probar');
        return;
    }
    
    const element = elements[0];
    console.log('🎯 Probando clic en:', element);
    
    // Método 1: click() nativo
    console.log('📋 Método 1: click() nativo');
    element.click();
    
    // Método 2: dispatchEvent con MouseEvent
    setTimeout(() => {
        console.log('📋 Método 2: dispatchEvent con MouseEvent');
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(clickEvent);
    }, 500);
    
    // Método 3: dispatchEvent con Event
    setTimeout(() => {
        console.log('📋 Método 3: dispatchEvent con Event');
        const clickEvent = new Event('click', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(clickEvent);
    }, 1000);
    
    // Método 4: Simular clic en el centro del elemento
    setTimeout(() => {
        console.log('📋 Método 4: Simular clic en el centro');
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY
        });
        element.dispatchEvent(clickEvent);
    }, 1500);
}

// Función para verificar eventos de Vue
function checkVueEvents() {
    console.log('🔍 Verificando eventos de Vue...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        console.log(`📍 Elemento ${index + 1}:`);
        
        // Buscar el componente Vue
        const vueComponent = element.__vueParentComponent || element.__vue__;
        if (vueComponent) {
            console.log(`   - Componente Vue:`, vueComponent);
            console.log(`   - Props:`, vueComponent.props);
            console.log(`   - Emits:`, vueComponent.emits);
            console.log(`   - Context:`, vueComponent.ctx);
            
            // Verificar si tiene la función handleElementClick
            if (vueComponent.handleElementClick) {
                console.log(`   ✅ Función handleElementClick disponible`);
            } else {
                console.log(`   ❌ Función handleElementClick NO disponible`);
            }
        } else {
            console.log(`   ❌ No se encontró componente Vue`);
        }
    });
}

// Función para verificar el estado del componente padre
function checkParentComponent() {
    console.log('🔍 Verificando componente padre...');
    
    // Buscar el componente principal
    const app = document.querySelector('#app');
    if (!app) {
        console.error('❌ No se encontró #app');
        return;
    }
    
    const vueComponent = app.__vueParentComponent || app.__vue__;
    if (!vueComponent) {
        console.error('❌ No se encontró componente Vue principal');
        return;
    }
    
    console.log('📋 Componente principal:', vueComponent);
    
    // Verificar funciones importantes
    const importantFunctions = ['selectElement', 'addWidget', 'removeElement'];
    importantFunctions.forEach(funcName => {
        if (typeof vueComponent[funcName] === 'function') {
            console.log(`   ✅ ${funcName}: disponible`);
        } else {
            console.log(`   ❌ ${funcName}: NO disponible`);
        }
    });
    
    // Verificar estado
    console.log('📋 Estado del componente:');
    console.log(`   - selectedElement:`, vueComponent.selectedElement);
    console.log(`   - showPropertiesPanel:`, vueComponent.showPropertiesPanel);
    console.log(`   - currentScreen:`, vueComponent.currentScreen);
}

// Función principal de diagnóstico
function runClickDiagnostic() {
    console.log('🚀 Ejecutando diagnóstico completo de eventos de clic...');
    
    // Paso 1: Verificar estructura del DOM
    checkDOMStructure();
    
    // Paso 2: Verificar componente padre
    checkParentComponent();
    
    // Paso 3: Verificar eventos de Vue
    checkVueEvents();
    
    // Paso 4: Agregar listeners de debug
    addDebugListeners();
    
    // Paso 5: Probar métodos de clic
    setTimeout(() => {
        testClickMethods();
    }, 2000);
    
    console.log('💡 Los listeners de debug están activos. Haz clic en los elementos para ver los logs.');
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
window.runClickDiagnostic = runClickDiagnostic;
window.addDebugListeners = addDebugListeners;
window.checkDOMStructure = checkDOMStructure;
window.testClickMethods = testClickMethods;
window.checkVueEvents = checkVueEvents;
window.checkParentComponent = checkParentComponent;
window.clearDebugListeners = clearDebugListeners;

console.log('📋 Funciones de diagnóstico disponibles:');
console.log('- runClickDiagnostic(): Diagnóstico completo');
console.log('- addDebugListeners(): Agregar listeners de debug');
console.log('- checkDOMStructure(): Verificar estructura DOM');
console.log('- testClickMethods(): Probar métodos de clic');
console.log('- checkVueEvents(): Verificar eventos de Vue');
console.log('- checkParentComponent(): Verificar componente padre');
console.log('- clearDebugListeners(): Limpiar listeners de debug');

console.log('💡 Para ejecutar el diagnóstico, usa: runClickDiagnostic()'); 