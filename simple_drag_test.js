// Script de prueba simple para arrastre
// Ejecutar en la consola del navegador

console.log('🧪 Prueba simple de arrastre...');

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

// Función para seleccionar un elemento
function selectElement(element) {
    console.log('🎯 Seleccionando elemento:', element.dataset.elementId);
    
    // Simular clic para seleccionar
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    
    element.dispatchEvent(clickEvent);
    
    // Verificar si se seleccionó
    setTimeout(() => {
        const isSelected = element.classList.contains('selected-widget');
        console.log(`✅ Elemento ${isSelected ? 'seleccionado' : 'NO seleccionado'}`);
        
        if (isSelected) {
            const dragHandle = element.querySelector('.drag-handle');
            console.log(`✅ Handle de arrastre ${dragHandle ? 'visible' : 'NO visible'}`);
        }
    }, 100);
}

// Función para probar arrastre directo
function testDirectDrag(element) {
    console.log('🖱️ Probando arrastre directo...');
    
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
    
    // Mousemove
    setTimeout(() => {
        const mousemoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: startX + 100,
            clientY: startY + 50
        });
        
        document.dispatchEvent(mousemoveEvent);
        
        // Verificar posición después del mousemove
        setTimeout(() => {
            const newRect = element.getBoundingClientRect();
            console.log('📍 Posición después del mousemove:', { x: newRect.left, y: newRect.top });
            
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
            }, 100);
        }, 100);
    }, 100);
}

// Función para probar arrastre con handle
function testHandleDrag(element) {
    console.log('🎯 Probando arrastre con handle...');
    
    const dragHandle = element.querySelector('.drag-handle');
    if (!dragHandle) {
        console.log('❌ No se encontró handle de arrastre');
        return;
    }
    
    const rect = element.getBoundingClientRect();
    const handleRect = dragHandle.getBoundingClientRect();
    
    console.log('📍 Posición inicial del elemento:', { x: rect.left, y: rect.top });
    console.log('📍 Posición del handle:', { x: handleRect.left, y: handleRect.top });
    
    // Mousedown en el handle
    const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: handleRect.left + 10,
        clientY: handleRect.top + 10
    });
    
    dragHandle.dispatchEvent(mousedownEvent);
    
    // Mousemove
    setTimeout(() => {
        const mousemoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: handleRect.left + 110,
            clientY: handleRect.top + 60
        });
        
        document.dispatchEvent(mousemoveEvent);
        
        // Verificar posición después del mousemove
        setTimeout(() => {
            const newRect = element.getBoundingClientRect();
            console.log('📍 Posición después del mousemove:', { x: newRect.left, y: newRect.top });
            
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
            }, 100);
        }, 100);
    }, 100);
}

// Función principal de prueba
function runSimpleDragTest() {
    console.log('🚀 Ejecutando prueba simple de arrastre...');
    
    const elements = findElements();
    if (elements.length === 0) return;
    
    const firstElement = elements[0];
    console.log('🎯 Probando con el primer elemento:', firstElement.dataset.elementId);
    
    // Paso 1: Seleccionar elemento
    selectElement(firstElement);
    
    // Paso 2: Esperar a que se seleccione
    setTimeout(() => {
        // Paso 3: Probar arrastre directo
        testDirectDrag(firstElement);
        
        // Paso 4: Probar arrastre con handle
        setTimeout(() => {
            testHandleDrag(firstElement);
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
    
    // Seleccionar
    selectElement(element);
    
    // Probar arrastre
    setTimeout(() => {
        testDirectDrag(element);
        
        setTimeout(() => {
            testHandleDrag(element);
        }, 1000);
    }, 500);
}

// Exportar funciones
window.runSimpleDragTest = runSimpleDragTest;
window.testSpecificElement = testSpecificElement;
window.findElements = findElements;
window.selectElement = selectElement;
window.testDirectDrag = testDirectDrag;
window.testHandleDrag = testHandleDrag;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runSimpleDragTest(): Prueba simple de arrastre');
console.log('- testSpecificElement("id"): Probar elemento específico');
console.log('- findElements(): Encontrar elementos');
console.log('- selectElement(element): Seleccionar elemento');
console.log('- testDirectDrag(element): Probar arrastre directo');
console.log('- testHandleDrag(element): Probar arrastre con handle');

console.log('💡 Para ejecutar la prueba simple, usa: runSimpleDragTest()'); 