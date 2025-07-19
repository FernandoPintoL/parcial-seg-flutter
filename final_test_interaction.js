// Script de prueba final para verificar interacciones
// Ejecutar en la consola del navegador

console.log('🧪 Prueba final de interacciones...');

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
    const testElements = ['TextField', 'ElevatedButton', 'Checkbox'];
    
    testElements.forEach((widgetType, index) => {
        setTimeout(() => {
            if (component.addWidget) {
                component.addWidget(widgetType);
                console.log(`✅ ${widgetType} agregado`);
            }
        }, index * 800);
    });
}

// Función para verificar elementos
function checkElements() {
    console.log('🔍 Verificando elementos...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    elements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        console.log(`📍 Elemento ${index + 1}:`);
        console.log(`   - Tipo: ${element.dataset.elementType}`);
        console.log(`   - Pointer events: ${computedStyle.pointerEvents}`);
        console.log(`   - Cursor: ${computedStyle.cursor}`);
        console.log(`   - Visible: ${element.offsetWidth > 0 && element.offsetHeight > 0}`);
    });
}

// Función para probar clic
function testClick() {
    console.log('🎯 Probando clic...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para hacer clic');
        return;
    }
    
    const element = elements[0];
    console.log('🎯 Haciendo clic en:', element.dataset.elementType);
    
    // Hacer clic
    element.click();
    
    // Verificar selección después de un tiempo
    setTimeout(() => {
        const component = findMainComponent();
        if (component) {
            console.log('📋 Estado después del clic:');
            console.log(`   - selectedElement:`, component.selectedElement);
            console.log(`   - showPropertiesPanel:`, component.showPropertiesPanel);
        }
        
        // Verificar si tiene la clase selected-widget
        const hasSelectedClass = element.classList.contains('selected-widget');
        console.log(`   - Tiene clase selected-widget: ${hasSelectedClass}`);
        
        // Verificar si el header es visible
        const header = element.querySelector('.widget-header');
        console.log(`   - Header visible: ${header !== null}`);
        
        // Verificar panel de propiedades
        const propertiesPanel = document.querySelector('.properties-panel');
        console.log(`   - Panel de propiedades: ${propertiesPanel !== null}`);
    }, 500);
}

// Función para probar eliminación
function testDeletion() {
    console.log('🗑️ Probando eliminación...');
    
    const selectedElements = document.querySelectorAll('.selected-widget');
    if (selectedElements.length === 0) {
        console.log('ℹ️ No hay elementos seleccionados para eliminar');
        return;
    }
    
    const selectedElement = selectedElements[0];
    const removeBtn = selectedElement.querySelector('.widget-remove-btn');
    
    if (removeBtn) {
        console.log('🎯 Haciendo clic en botón eliminar');
        removeBtn.click();
        
        setTimeout(() => {
            const component = findMainComponent();
            if (component) {
                const elements = component.currentScreen?.elements || [];
                console.log(`📊 Elementos restantes: ${elements.length}`);
            }
        }, 500);
    } else {
        console.log('❌ No se encontró botón de eliminar');
    }
}

// Función para probar arrastre
function testDrag() {
    console.log('🖱️ Probando arrastre...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para arrastrar');
        return;
    }
    
    const element = elements[0];
    console.log('🎯 Probando arrastre en:', element.dataset.elementType);
    
    // Simular mousedown
    const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: 100,
        clientY: 100
    });
    element.dispatchEvent(mousedownEvent);
    
    // Simular mousemove
    setTimeout(() => {
        const mousemoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: 150,
            clientY: 150
        });
        document.dispatchEvent(mousemoveEvent);
        
        // Simular mouseup
        setTimeout(() => {
            const mouseupEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            document.dispatchEvent(mouseupEvent);
            
            console.log('✅ Arrastre simulado completado');
        }, 100);
    }, 100);
}

// Función para verificar funciones del componente
function checkComponentFunctions() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🔍 Verificando funciones del componente...');
    
    const requiredFunctions = ['selectElement', 'addWidget', 'removeElement', 'updateElementProperty'];
    let allFunctionsAvailable = true;
    
    requiredFunctions.forEach(funcName => {
        if (typeof component[funcName] === 'function') {
            console.log(`   ✅ ${funcName}: disponible`);
        } else {
            console.log(`   ❌ ${funcName}: NO disponible`);
            allFunctionsAvailable = false;
        }
    });
    
    return allFunctionsAvailable;
}

// Función principal de prueba
function runFinalTest() {
    console.log('🚀 Ejecutando prueba final completa...');
    
    // Paso 1: Verificar funciones
    const functionsOk = checkComponentFunctions();
    
    // Paso 2: Agregar elementos
    addTestElements();
    
    // Paso 3: Verificar elementos
    setTimeout(() => {
        checkElements();
        
        // Paso 4: Probar clic
        setTimeout(() => {
            testClick();
            
            // Paso 5: Probar eliminación
            setTimeout(() => {
                testDeletion();
                
                // Paso 6: Probar arrastre
                setTimeout(() => {
                    testDrag();
                    
                    // Resumen final
                    setTimeout(() => {
                        console.log('\n📋 RESUMEN FINAL:');
                        const component = findMainComponent();
                        if (component) {
                            const elements = component.currentScreen?.elements || [];
                            console.log(`✅ Elementos en pantalla: ${elements.length}`);
                            console.log(`✅ Elemento seleccionado: ${component.selectedElement ? 'SÍ' : 'NO'}`);
                            console.log(`✅ Panel de propiedades: ${component.showPropertiesPanel ? 'VISIBLE' : 'OCULTO'}`);
                        }
                        
                        const selectedElements = document.querySelectorAll('.selected-widget');
                        console.log(`✅ Elementos seleccionados: ${selectedElements.length}`);
                        
                        const mobileWidgets = document.querySelectorAll('.mobile-widget');
                        console.log(`✅ Elementos con estilo móvil: ${mobileWidgets.length}`);
                        
                        console.log('\n🎯 RESULTADO:');
                        if (functionsOk && elements.length > 0) {
                            console.log('✅ ¡Sistema funcionando correctamente!');
                            console.log('💡 Ahora puedes:');
                            console.log('   - Hacer clic en elementos para seleccionarlos');
                            console.log('   - Usar el botón × para eliminar elementos');
                            console.log('   - Arrastrar elementos para moverlos');
                            console.log('   - Editar propiedades en el panel lateral');
                        } else {
                            console.log('❌ Hay problemas que necesitan ser corregidos');
                        }
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 2000);
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
window.runFinalTest = runFinalTest;
window.addTestElements = addTestElements;
window.checkElements = checkElements;
window.testClick = testClick;
window.testDeletion = testDeletion;
window.testDrag = testDrag;
window.checkComponentFunctions = checkComponentFunctions;
window.clearElements = clearElements;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runFinalTest(): Prueba final completa');
console.log('- addTestElements(): Agregar elementos de prueba');
console.log('- checkElements(): Verificar elementos');
console.log('- testClick(): Probar clic');
console.log('- testDeletion(): Probar eliminación');
console.log('- testDrag(): Probar arrastre');
console.log('- checkComponentFunctions(): Verificar funciones');
console.log('- clearElements(): Limpiar elementos');

console.log('💡 Para ejecutar la prueba final, usa: runFinalTest()'); 