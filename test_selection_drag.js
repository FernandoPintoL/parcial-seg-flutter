// Script de prueba para selección y arrastre
// Ejecutar en la consola del navegador

console.log('🧪 Probando selección y arrastre...');

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
            const dragHandle = element.querySelector('.drag-handle');
            console.log(`   - Handle de arrastre: ${dragHandle ? 'visible' : 'NO visible'}`);
            
            if (dragHandle) {
                const handleStyle = window.getComputedStyle(dragHandle);
                console.log(`   - Handle z-index: ${handleStyle.zIndex}`);
                console.log(`   - Handle display: ${handleStyle.display}`);
            }
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
                
                // Verificar z-index después del arrastre
                const finalZIndex = window.getComputedStyle(element).zIndex;
                console.log(`📊 Z-index después del arrastre: ${finalZIndex}`);
            }, 100);
        }, 100);
    }, 100);
}

// Función para probar clic sin arrastre
function testClickOnly(element) {
    console.log('👆 Probando clic sin arrastre:', element.dataset.elementId);
    
    const rect = element.getBoundingClientRect();
    const clickX = rect.left + 50;
    const clickY = rect.top + 25;
    
    // Mousedown
    const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clickX,
        clientY: clickY
    });
    
    element.dispatchEvent(mousedownEvent);
    
    // Mouseup inmediatamente (sin mousemove)
    setTimeout(() => {
        const mouseupEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        document.dispatchEvent(mouseupEvent);
        
        // Verificar que se seleccionó
        setTimeout(() => {
            const isSelected = element.classList.contains('selected-widget');
            console.log(`✅ Elemento ${isSelected ? 'se seleccionó' : 'NO se seleccionó'} después del clic`);
            
            if (isSelected) {
                const dragHandle = element.querySelector('.drag-handle');
                console.log(`✅ Handle de arrastre ${dragHandle ? 'visible' : 'NO visible'}`);
            }
        }, 100);
    }, 50);
}

// Función para verificar superposiciones
function checkOverlaps() {
    console.log('🔍 Verificando superposiciones...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    const overlaps = [];
    
    elements.forEach((element1, i) => {
        const rect1 = element1.getBoundingClientRect();
        const zIndex1 = parseInt(window.getComputedStyle(element1).zIndex) || 0;
        
        elements.forEach((element2, j) => {
            if (i === j) return;
            
            const rect2 = element2.getBoundingClientRect();
            const zIndex2 = parseInt(window.getComputedStyle(element2).zIndex) || 0;
            
            // Verificar si hay superposición
            const overlapX = rect1.left < rect2.right && rect1.right > rect2.left;
            const overlapY = rect1.top < rect2.bottom && rect1.bottom > rect2.top;
            
            if (overlapX && overlapY) {
                overlaps.push({
                    element1: element1.dataset.elementId,
                    element2: element2.dataset.elementId,
                    zIndex1,
                    zIndex2,
                    overlap: true
                });
            }
        });
    });
    
    if (overlaps.length > 0) {
        console.log('⚠️ Superposiciones detectadas:');
        overlaps.forEach(overlap => {
            console.log(`   - ${overlap.element1} (z: ${overlap.zIndex1}) y ${overlap.element2} (z: ${overlap.zIndex2})`);
        });
    } else {
        console.log('✅ No hay superposiciones detectadas');
    }
    
    return overlaps;
}

// Función principal de prueba
function runSelectionDragTest() {
    console.log('🚀 Ejecutando prueba de selección y arrastre...');
    
    const elements = findElements();
    if (elements.length === 0) return;
    
    // Paso 1: Verificar estado inicial
    console.log('\n📋 Paso 1: Estado inicial');
    checkSelectionState();
    checkOverlaps();
    
    // Paso 2: Probar selección del primer elemento
    console.log('\n📋 Paso 2: Probando selección');
    const firstElement = elements[0];
    testSelection(firstElement);
    
    // Paso 3: Verificar selección
    setTimeout(() => {
        console.log('\n📋 Paso 3: Verificando selección');
        checkSelectionState();
        
        // Paso 4: Probar clic sin arrastre
        console.log('\n📋 Paso 4: Probando clic sin arrastre');
        testClickOnly(firstElement);
        
        // Paso 5: Probar arrastre
        setTimeout(() => {
            console.log('\n📋 Paso 5: Probando arrastre');
            testDrag(firstElement);
            
            // Paso 6: Verificar estado final
            setTimeout(() => {
                console.log('\n📋 Paso 6: Estado final');
                checkSelectionState();
                checkOverlaps();
                
                console.log('\n✅ Prueba completada');
            }, 500);
        }, 500);
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
    }, 1000);
}

// Exportar funciones
window.runSelectionDragTest = runSelectionDragTest;
window.testSpecificElement = testSpecificElement;
window.findElements = findElements;
window.checkSelectionState = checkSelectionState;
window.testSelection = testSelection;
window.testDrag = testDrag;
window.testClickOnly = testClickOnly;
window.checkOverlaps = checkOverlaps;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runSelectionDragTest(): Prueba completa de selección y arrastre');
console.log('- testSpecificElement("id"): Probar elemento específico');
console.log('- findElements(): Encontrar elementos');
console.log('- checkSelectionState(): Verificar estado de selección');
console.log('- testSelection(element): Probar selección');
console.log('- testDrag(element): Probar arrastre');
console.log('- testClickOnly(element): Probar clic sin arrastre');
console.log('- checkOverlaps(): Verificar superposiciones');

console.log('💡 Para ejecutar la prueba completa, usa: runSelectionDragTest()'); 