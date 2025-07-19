// Script de prueba completa para selección, arrastre y eliminación
// Ejecutar en la consola del navegador

console.log('🧪 Probando funcionalidad completa...');

// Función para encontrar elementos
function findElements() {
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    if (elements.length === 0) {
        console.log('❌ No hay elementos para probar');
        return [];
    }
    
    return Array.from(elements);
}

// Función para verificar estado de selección
function checkSelectionState() {
    const selectedElements = document.querySelectorAll('.selected-widget');
    const allElements = document.querySelectorAll('.unified-widget-element');
    
    console.log('📊 Estado de selección:');
    console.log(`   - Elementos totales: ${allElements.length}`);
    console.log(`   - Elementos seleccionados: ${selectedElements.length}`);
    
    selectedElements.forEach((element, index) => {
        console.log(`   - Elemento seleccionado ${index + 1}: ${element.dataset.elementId}`);
        console.log(`     * Tipo: ${element.dataset.elementType}`);
        console.log(`     * Z-index: ${window.getComputedStyle(element).zIndex}`);
        console.log(`     * Tiene botón eliminar: ${element.querySelector('.widget-remove-btn') !== null}`);
    });
    
    return selectedElements;
}

// Función para probar selección
function testSelection(element) {
    console.log('🎯 Probando selección de elemento:', element.dataset.elementId);
    
    // Verificar estado inicial
    const wasSelected = element.classList.contains('selected-widget');
    console.log(`   - Estado inicial: ${wasSelected ? 'seleccionado' : 'no seleccionado'}`);
    
    // Simular clic
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    
    element.dispatchEvent(clickEvent);
    
    // Verificar estado después del clic
    setTimeout(() => {
        const isSelected = element.classList.contains('selected-widget');
        console.log(`   - Estado después del clic: ${isSelected ? 'seleccionado' : 'no seleccionado'}`);
        
        if (isSelected) {
            const removeBtn = element.querySelector('.widget-remove-btn');
            const resizeHandle = element.querySelector('.resize-handle');
            console.log(`   - Botón eliminar: ${removeBtn ? 'visible' : 'NO visible'}`);
            console.log(`   - Handle de redimensionar: ${resizeHandle ? 'visible' : 'NO visible'}`);
        }
    }, 100);
}

// Función para probar arrastre
function testDrag(element) {
    console.log('🖱️ Probando arrastre de elemento:', element.dataset.elementId);
    
    const rect = element.getBoundingClientRect();
    const startX = rect.left + 50;
    const startY = rect.top + 25;
    
    console.log('📍 Posición inicial:', { x: rect.left, y: rect.top });
    
    // Mousedown
    const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: startX,
        clientY: startY
    });
    
    element.dispatchEvent(mousedownEvent);
    
    // Verificar estado después del mousedown
    setTimeout(() => {
        const isDragging = element.classList.contains('is-dragging');
        console.log(`   - Estado después del mousedown: ${isDragging ? 'arrastrando' : 'no arrastrando'}`);
        
        if (isDragging) {
            const style = window.getComputedStyle(element);
            console.log(`   - Cursor durante arrastre: ${style.cursor}`);
            console.log(`   - Z-index durante arrastre: ${style.zIndex}`);
        }
        
        // Mousemove (arrastrar)
        setTimeout(() => {
            const mousemoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: startX + 100,
                clientY: startY + 50
            });
            
            document.dispatchEvent(mousemoveEvent);
            
            // Verificar posición durante el arrastre
            setTimeout(() => {
                const newRect = element.getBoundingClientRect();
                console.log('📍 Posición durante arrastre:', { x: newRect.left, y: newRect.top });
                
                const moved = newRect.left !== rect.left || newRect.top !== rect.top;
                console.log(`✅ Elemento ${moved ? 'se movió' : 'NO se movió'}`);
                
                // Mouseup
                const mouseupEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                document.dispatchEvent(mouseupEvent);
                
                // Verificar posición final
                setTimeout(() => {
                    const finalRect = element.getBoundingClientRect();
                    console.log('📍 Posición final:', { x: finalRect.left, y: finalRect.top });
                    
                    const finalMoved = finalRect.left !== rect.left || finalRect.top !== rect.top;
                    console.log(`✅ Elemento ${finalMoved ? 'se movió finalmente' : 'NO se movió finalmente'}`);
                    
                    // Verificar persistencia después de un delay
                    setTimeout(() => {
                        const persistentRect = element.getBoundingClientRect();
                        const persisted = persistentRect.left === finalRect.left && persistentRect.top === finalRect.top;
                        console.log(`✅ Posición ${persisted ? 'persistió' : 'NO persistió'}`);
                        
                        if (!persisted) {
                            console.log('❌ PROBLEMA: El elemento volvió a su posición original');
                        } else {
                            console.log('✅ ÉXITO: El elemento mantuvo su nueva posición');
                        }
                    }, 1000);
                }, 100);
            }, 100);
        }, 100);
    }, 100);
}

// Función para probar eliminación
function testDelete(element) {
    console.log('🗑️ Probando eliminación de elemento:', element.dataset.elementId);
    
    // Primero seleccionar el elemento
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    
    element.dispatchEvent(clickEvent);
    
    // Esperar a que se seleccione
    setTimeout(() => {
        const removeBtn = element.querySelector('.widget-remove-btn');
        if (!removeBtn) {
            console.log('❌ No se encontró botón de eliminar');
            return;
        }
        
        console.log('✅ Botón de eliminar encontrado');
        
        // Simular clic en el botón eliminar
        const deleteClickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        removeBtn.dispatchEvent(deleteClickEvent);
        
        // Verificar si el elemento se eliminó
        setTimeout(() => {
            const elementStillExists = document.querySelector(`[data-element-id="${element.dataset.elementId}"]`);
            console.log(`✅ Elemento ${elementStillExists ? 'NO se eliminó' : 'se eliminó correctamente'}`);
        }, 500);
    }, 200);
}

// Función para verificar el estado del componente Vue
function checkVueState() {
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
    
    console.log('📊 Estado del componente Vue:');
    
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

// Función principal de prueba
function runCompleteTest() {
    console.log('🚀 Ejecutando prueba completa...');
    
    const elements = findElements();
    if (elements.length === 0) return;
    
    // Paso 1: Verificar estado inicial
    console.log('\n📋 Paso 1: Estado inicial');
    checkVueState();
    checkSelectionState();
    
    // Paso 2: Probar selección del primer elemento
    console.log('\n📋 Paso 2: Probando selección');
    const firstElement = elements[0];
    testSelection(firstElement);
    
    // Paso 3: Verificar selección
    setTimeout(() => {
        console.log('\n📋 Paso 3: Verificando selección');
        checkSelectionState();
        
        // Paso 4: Probar arrastre
        console.log('\n📋 Paso 4: Probando arrastre');
        testDrag(firstElement);
        
        // Paso 5: Probar eliminación (solo si hay más de un elemento)
        setTimeout(() => {
            if (elements.length > 1) {
                console.log('\n📋 Paso 5: Probando eliminación');
                const secondElement = elements[1];
                testDelete(secondElement);
            }
            
            // Paso 6: Verificar estado final
            setTimeout(() => {
                console.log('\n📋 Paso 6: Estado final');
                checkVueState();
                checkSelectionState();
                
                console.log('\n✅ Prueba completa finalizada');
            }, 2000);
        }, 3000);
    }, 500);
}

// Función para probar un elemento específico
function testSpecificElement(elementId) {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) {
        console.error('❌ Elemento no encontrado:', elementId);
        return;
    }
    
    console.log('🎯 Probando elemento específico:', elementId);
    
    // Probar selección
    testSelection(element);
    
    // Probar arrastre
    setTimeout(() => {
        testDrag(element);
        
        // Probar eliminación
        setTimeout(() => {
            testDelete(element);
        }, 3000);
    }, 1000);
}

// Exportar funciones
window.runCompleteTest = runCompleteTest;
window.testSpecificElement = testSpecificElement;
window.findElements = findElements;
window.checkSelectionState = checkSelectionState;
window.testSelection = testSelection;
window.testDrag = testDrag;
window.testDelete = testDelete;
window.checkVueState = checkVueState;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runCompleteTest(): Prueba completa de funcionalidad');
console.log('- testSpecificElement("id"): Probar elemento específico');
console.log('- findElements(): Encontrar elementos');
console.log('- checkSelectionState(): Verificar estado de selección');
console.log('- testSelection(element): Probar selección');
console.log('- testDrag(element): Probar arrastre');
console.log('- testDelete(element): Probar eliminación');
console.log('- checkVueState(): Verificar estado del componente Vue');

console.log('💡 Para ejecutar la prueba completa, usa: runCompleteTest()'); 