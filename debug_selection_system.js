// Script de diagnóstico para el sistema de selección de elementos
// Ejecutar en la consola del navegador después de cargar la pizarra

console.log('🔍 Iniciando diagnóstico del sistema de selección...');

// Función para encontrar el componente Vue de la pizarra
function findPizarraComponent() {
    const canvas = document.querySelector('.unified-canvas');
    if (!canvas) {
        console.error('❌ No se encontró el canvas de la pizarra');
        return null;
    }
    
    const vueComponent = canvas.__vueParentComponent || canvas.__vue__;
    if (!vueComponent) {
        console.error('❌ No se encontró el componente Vue');
        return null;
    }
    
    return vueComponent;
}

// Función para verificar elementos en el DOM
function checkElementsInDOM() {
    console.log('🔍 Verificando elementos en el DOM...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados en el DOM: ${elements.length}`);
    
    elements.forEach((element, index) => {
        console.log(`📍 Elemento ${index + 1}:`, {
            id: element.getAttribute('data-id') || 'sin-id',
            class: element.className,
            style: element.style.cssText,
            hasClickHandler: element.onclick !== null
        });
        
        // Verificar si tiene eventos de clic
        const clickEvents = element.getEventListeners ? element.getEventListeners('click') : 'No disponible';
        console.log(`   - Eventos de clic:`, clickEvents);
    });
    
    return elements.length > 0;
}

// Función para verificar el estado del componente Vue
function checkVueComponentState() {
    const component = findPizarraComponent();
    if (!component) return false;
    
    console.log('🔍 Verificando estado del componente Vue...');
    
    // Verificar propiedades del componente
    console.log('📋 Propiedades del componente:');
    console.log(`   - selectedElement:`, component.selectedElement);
    console.log(`   - currentScreen:`, component.currentScreen);
    console.log(`   - selectedFramework:`, component.selectedFramework);
    
    // Verificar funciones disponibles
    console.log('🔧 Funciones disponibles:');
    const requiredFunctions = ['selectElement', 'addWidget', 'removeElement'];
    requiredFunctions.forEach(funcName => {
        if (typeof component[funcName] === 'function') {
            console.log(`   ✅ ${funcName}: disponible`);
        } else {
            console.log(`   ❌ ${funcName}: NO disponible`);
        }
    });
    
    // Verificar elementos en el estado
    const elements = component.currentScreen?.elements || [];
    console.log(`📊 Elementos en el estado: ${elements.length}`);
    elements.forEach((element, index) => {
        console.log(`   - Elemento ${index + 1}: ${element.type} (${element.id})`);
    });
    
    return true;
}

// Función para simular clic en un elemento
function simulateElementClick() {
    console.log('🎯 Simulando clic en elemento...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para hacer clic');
        return false;
    }
    
    const firstElement = elements[0];
    console.log('🎯 Haciendo clic en el primer elemento:', firstElement);
    
    // Crear un evento de clic
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    
    // Disparar el evento
    firstElement.dispatchEvent(clickEvent);
    
    console.log('✅ Evento de clic disparado');
    
    // Verificar si se seleccionó
    setTimeout(() => {
        const component = findPizarraComponent();
        if (component && component.selectedElement) {
            console.log('✅ Elemento seleccionado:', component.selectedElement);
        } else {
            console.log('❌ Elemento no se seleccionó');
        }
    }, 100);
    
    return true;
}

// Función para agregar elementos de prueba
function addTestElements() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('🔧 Agregando elementos de prueba...');
    
    // Limpiar elementos existentes
    if (component.currentScreen) {
        component.currentScreen.elements = [];
    }
    
    // Agregar un elemento de prueba
    if (component.addWidget) {
        component.addWidget('TextField');
        console.log('✅ Elemento TextField agregado');
    } else {
        console.log('❌ Función addWidget no disponible');
    }
}

// Función para verificar el panel de propiedades
function checkPropertiesPanel() {
    console.log('🔍 Verificando panel de propiedades...');
    
    const propertiesPanel = document.querySelector('.properties-panel');
    if (propertiesPanel) {
        console.log('✅ Panel de propiedades encontrado en el DOM');
        console.log('   - Visible:', propertiesPanel.style.display !== 'none');
        console.log('   - Clases:', propertiesPanel.className);
    } else {
        console.log('❌ Panel de propiedades NO encontrado en el DOM');
    }
    
    // Verificar si está en el estado del componente
    const component = findPizarraComponent();
    if (component) {
        console.log('📋 Estado del panel en el componente:');
        console.log(`   - showPropertiesPanel:`, component.showPropertiesPanel);
        console.log(`   - selectedElement:`, component.selectedElement);
    }
}

// Función para verificar eventos de clic
function checkClickEvents() {
    console.log('🔍 Verificando eventos de clic...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        console.log(`📍 Elemento ${index + 1}:`);
        
        // Verificar si tiene el evento onclick
        console.log(`   - onclick:`, element.onclick);
        
        // Verificar si tiene event listeners (si está disponible)
        if (element.getEventListeners) {
            const listeners = element.getEventListeners('click');
            console.log(`   - Event listeners:`, listeners);
        }
        
        // Verificar si tiene el atributo @click
        const hasClickAttribute = element.hasAttribute('@click') || element.getAttribute('v-on:click');
        console.log(`   - Tiene atributo click:`, hasClickAttribute);
    });
}

// Función para forzar la selección de un elemento
function forceElementSelection() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('🎯 Forzando selección de elemento...');
    
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
        
        // Verificar el resultado
        setTimeout(() => {
            console.log('📋 Estado después de la selección:');
            console.log(`   - selectedElement:`, component.selectedElement);
            console.log(`   - showPropertiesPanel:`, component.showPropertiesPanel);
        }, 100);
    } else {
        console.log('❌ Función selectElement no disponible');
    }
}

// Función principal de diagnóstico
function runSelectionDiagnostic() {
    console.log('🚀 Ejecutando diagnóstico completo del sistema de selección...');
    
    // Verificar estado del componente Vue
    const componentStateOk = checkVueComponentState();
    
    // Verificar elementos en el DOM
    const elementsInDOM = checkElementsInDOM();
    
    // Verificar eventos de clic
    checkClickEvents();
    
    // Verificar panel de propiedades
    checkPropertiesPanel();
    
    // Si no hay elementos, agregar algunos de prueba
    if (!elementsInDOM) {
        console.log('ℹ️ No hay elementos en el DOM, agregando elementos de prueba...');
        addTestElements();
        
        // Esperar un poco y verificar de nuevo
        setTimeout(() => {
            checkElementsInDOM();
            simulateElementClick();
            forceElementSelection();
        }, 1000);
    } else {
        // Probar selección
        simulateElementClick();
        forceElementSelection();
    }
    
    // Resumen final
    setTimeout(() => {
        console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
        console.log(`✅ Estado del componente: ${componentStateOk ? 'OK' : 'ERROR'}`);
        console.log(`✅ Elementos en DOM: ${elementsInDOM ? 'OK' : 'ERROR'}`);
        
        const component = findPizarraComponent();
        if (component) {
            console.log(`✅ Elemento seleccionado: ${component.selectedElement ? 'SÍ' : 'NO'}`);
            console.log(`✅ Panel de propiedades: ${component.showPropertiesPanel ? 'VISIBLE' : 'OCULTO'}`);
        }
    }, 2000);
}

// Exportar funciones para uso en consola
window.runSelectionDiagnostic = runSelectionDiagnostic;
window.checkElementsInDOM = checkElementsInDOM;
window.checkVueComponentState = checkVueComponentState;
window.simulateElementClick = simulateElementClick;
window.addTestElements = addTestElements;
window.checkPropertiesPanel = checkPropertiesPanel;
window.checkClickEvents = checkClickEvents;
window.forceElementSelection = forceElementSelection;

console.log('📋 Funciones de diagnóstico disponibles:');
console.log('- runSelectionDiagnostic(): Diagnóstico completo');
console.log('- checkElementsInDOM(): Verificar elementos en DOM');
console.log('- checkVueComponentState(): Verificar estado del componente');
console.log('- simulateElementClick(): Simular clic en elemento');
console.log('- addTestElements(): Agregar elementos de prueba');
console.log('- checkPropertiesPanel(): Verificar panel de propiedades');
console.log('- checkClickEvents(): Verificar eventos de clic');
console.log('- forceElementSelection(): Forzar selección de elemento');

console.log('💡 Para ejecutar el diagnóstico completo, usa: runSelectionDiagnostic()'); 