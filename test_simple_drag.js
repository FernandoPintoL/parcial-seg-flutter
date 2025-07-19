// Script de prueba basado en el ejemplo proporcionado
// Ejecutar en la consola del navegador

console.log('🧪 Probando sistema de arrastre simplificado...');

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
        console.log(`     * Cursor: ${window.getComputedStyle(element).cursor}`);
    });
    
    return selectedElements;
}

// Función para probar selección (como en el ejemplo)
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
            const resizeHandle = element.querySelector('.resize-handle');
            console.log(`   - Handle de redimensionar: ${resizeHandle ? 'visible' : 'NO visible'}`);
            
            if (resizeHandle) {
                const handleStyle = window.getComputedStyle(resizeHandle);
                console.log(`   - Handle z-index: ${handleStyle.zIndex}`);
                console.log(`   - Handle cursor: ${handleStyle.cursor}`);
            }
        }
    }, 100);
}

// Función para probar arrastre (como en el ejemplo)
function testDrag(element) {
    console.log('🖱️ Probando arrastre de elemento:', element.dataset.elementId);
    
    const rect = element.getBoundingClientRect();
    const startX = rect.left + 50;
    const startY = rect.top + 25;
    
    console.log('📍 Posición inicial:', { x: rect.left, y: rect.top });
    console.log('🎯 Punto de inicio:', { x: startX, y: startY });
    
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
                    
                    // Verificar estado final
                    const finalDragging = element.classList.contains('is-dragging');
                    console.log(`   - Estado final: ${finalDragging ? 'arrastrando' : 'no arrastrando'}`);
                }, 100);
            }, 100);
        }, 100);
    }, 100);
}

// Función para probar redimensionar
function testResize(element) {
    console.log('📏 Probando redimensionar elemento:', element.dataset.elementId);
    
    const resizeHandle = element.querySelector('.resize-handle');
    if (!resizeHandle) {
        console.log('❌ No se encontró handle de redimensionar');
        return;
    }
    
    const rect = element.getBoundingClientRect();
    const handleRect = resizeHandle.getBoundingClientRect();
    
    console.log('📍 Tamaño inicial:', { width: rect.width, height: rect.height });
    console.log('📍 Posición del handle:', { x: handleRect.left, y: handleRect.top });
    
    // Mousedown en el handle
    const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: handleRect.left + 5,
        clientY: handleRect.top + 5
    });
    
    resizeHandle.dispatchEvent(mousedownEvent);
    
    // Mousemove para redimensionar
    setTimeout(() => {
        const mousemoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: handleRect.left + 50,
            clientY: handleRect.top + 30
        });
        
        document.dispatchEvent(mousemoveEvent);
        
        // Verificar tamaño después del mousemove
        setTimeout(() => {
            const newRect = element.getBoundingClientRect();
            console.log('📍 Tamaño durante redimensionar:', { width: newRect.width, height: newRect.height });
            
            const resized = newRect.width !== rect.width || newRect.height !== rect.height;
            console.log(`✅ Elemento ${resized ? 'se redimensionó' : 'NO se redimensionó'}`);
            
            // Mouseup
            const mouseupEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            document.dispatchEvent(mouseupEvent);
            
            // Verificar tamaño final
            setTimeout(() => {
                const finalRect = element.getBoundingClientRect();
                console.log('📍 Tamaño final:', { width: finalRect.width, height: finalRect.height });
                
                const finalResized = finalRect.width !== rect.width || finalRect.height !== rect.height;
                console.log(`✅ Elemento ${finalResized ? 'se redimensionó finalmente' : 'NO se redimensionó finalmente'}`);
            }, 100);
        }, 100);
    }, 100);
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
function runSimpleDragTest() {
    console.log('🚀 Ejecutando prueba de arrastre simplificado...');
    
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
        
        // Paso 4: Probar arrastre
        console.log('\n📋 Paso 4: Probando arrastre');
        testDrag(firstElement);
        
        // Paso 5: Probar redimensionar
        setTimeout(() => {
            console.log('\n📋 Paso 5: Probando redimensionar');
            testResize(firstElement);
            
            // Paso 6: Verificar estado final
            setTimeout(() => {
                console.log('\n📋 Paso 6: Estado final');
                checkSelectionState();
                checkOverlaps();
                
                console.log('\n✅ Prueba completada');
            }, 500);
        }, 1000);
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
        
        // Probar redimensionar
        setTimeout(() => {
            testResize(element);
        }, 1000);
    }, 1000);
}

// Exportar funciones
window.runSimpleDragTest = runSimpleDragTest;
window.testSpecificElement = testSpecificElement;
window.findElements = findElements;
window.checkSelectionState = checkSelectionState;
window.testSelection = testSelection;
window.testDrag = testDrag;
window.testResize = testResize;
window.checkOverlaps = checkOverlaps;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runSimpleDragTest(): Prueba completa de arrastre simplificado');
console.log('- testSpecificElement("id"): Probar elemento específico');
console.log('- findElements(): Encontrar elementos');
console.log('- checkSelectionState(): Verificar estado de selección');
console.log('- testSelection(element): Probar selección');
console.log('- testDrag(element): Probar arrastre');
console.log('- testResize(element): Probar redimensionar');
console.log('- checkOverlaps(): Verificar superposiciones');

console.log('💡 Para ejecutar la prueba completa, usa: runSimpleDragTest()'); 