// Script de prueba simple para el sistema de selección
// Ejecutar en la consola del navegador

console.log('🧪 Prueba simple del sistema de selección...');

// Función para encontrar el componente principal
function findMainComponent() {
    // Buscar el componente principal de la pizarra
    const app = document.querySelector('#app');
    if (!app) {
        console.error('❌ No se encontró el elemento #app');
        return null;
    }
    
    // Buscar el componente Vue
    const vueComponent = app.__vueParentComponent || app.__vue__;
    if (!vueComponent) {
        console.error('❌ No se encontró el componente Vue principal');
        return null;
    }
    
    return vueComponent;
}

// Función para agregar un elemento de prueba
function addTestElement() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🔧 Agregando elemento de prueba...');
    
    // Buscar la función addWidget
    if (component.addWidget) {
        component.addWidget('TextField');
        console.log('✅ Elemento TextField agregado');
        return true;
    } else {
        console.log('❌ Función addWidget no encontrada');
        return false;
    }
}

// Función para hacer clic en un elemento
function clickElement() {
    console.log('🎯 Buscando elementos para hacer clic...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para hacer clic');
        return false;
    }
    
    const firstElement = elements[0];
    console.log('🎯 Haciendo clic en:', firstElement);
    
    // Hacer clic en el elemento
    firstElement.click();
    
    console.log('✅ Clic realizado');
    return true;
}

// Función para verificar si se seleccionó
function checkSelection() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🔍 Verificando selección...');
    console.log('   - selectedElement:', component.selectedElement);
    console.log('   - showPropertiesPanel:', component.showPropertiesPanel);
    
    // Verificar en el DOM
    const selectedElements = document.querySelectorAll('.unified-widget-element.is-selected');
    console.log(`   - Elementos seleccionados en DOM: ${selectedElements.length}`);
    
    // Verificar panel de propiedades
    const propertiesPanel = document.querySelector('.properties-panel');
    console.log('   - Panel de propiedades visible:', propertiesPanel !== null);
    
    return component.selectedElement !== null;
}

// Función principal de prueba
function runSimpleTest() {
    console.log('🚀 Ejecutando prueba simple...');
    
    // Paso 1: Agregar elemento
    const elementAdded = addTestElement();
    
    if (!elementAdded) {
        console.log('❌ No se pudo agregar elemento');
        return;
    }
    
    // Paso 2: Esperar un poco y hacer clic
    setTimeout(() => {
        const clicked = clickElement();
        
        if (clicked) {
            // Paso 3: Verificar selección
            setTimeout(() => {
                const selected = checkSelection();
                
                if (selected) {
                    console.log('🎉 ¡Prueba exitosa! El elemento se seleccionó correctamente.');
                } else {
                    console.log('❌ Prueba fallida. El elemento no se seleccionó.');
                }
            }, 500);
        }
    }, 1000);
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
            checkSelection();
        }, 100);
    } else {
        console.log('❌ Función selectElement no encontrada');
    }
}

// Función para limpiar elementos
function clearElements() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🧹 Limpiando elementos...');
    
    if (component.currentScreen) {
        component.currentScreen.elements = [];
        console.log('✅ Elementos eliminados');
    }
}

// Exportar funciones
window.runSimpleTest = runSimpleTest;
window.addTestElement = addTestElement;
window.clickElement = clickElement;
window.checkSelection = checkSelection;
window.forceSelection = forceSelection;
window.clearElements = clearElements;

console.log('📋 Funciones disponibles:');
console.log('- runSimpleTest(): Ejecutar prueba completa');
console.log('- addTestElement(): Agregar elemento de prueba');
console.log('- clickElement(): Hacer clic en elemento');
console.log('- checkSelection(): Verificar selección');
console.log('- forceSelection(): Forzar selección');
console.log('- clearElements(): Limpiar elementos');

console.log('💡 Para ejecutar la prueba, usa: runSimpleTest()'); 