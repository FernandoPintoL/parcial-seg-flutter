// Script de prueba para verificar persistencia del arrastre
// Ejecutar en la consola del navegador

console.log('🧪 Probando persistencia del arrastre...');

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

// Función para verificar posición de un elemento
function checkElementPosition(element) {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    const inlineStyle = element.style;
    
    console.log('📍 Posición del elemento:', element.dataset.elementId);
    console.log(`   - Bounding rect: x=${rect.left}, y=${rect.top}`);
    console.log(`   - Computed style: left=${computedStyle.left}, top=${computedStyle.top}`);
    console.log(`   - Inline style: left=${inlineStyle.left}, top=${inlineStyle.top}`);
    console.log(`   - Z-index: ${computedStyle.zIndex}`);
    
    return {
        bounding: { x: rect.left, y: rect.top },
        computed: { left: computedStyle.left, top: computedStyle.top },
        inline: { left: inlineStyle.left, top: inlineStyle.top }
    };
}

// Función para probar arrastre y verificar persistencia
function testDragPersistence(element) {
    console.log('🖱️ Probando arrastre y persistencia:', element.dataset.elementId);
    
    // Verificar posición inicial
    console.log('📊 Posición inicial:');
    const initialPosition = checkElementPosition(element);
    
    const startX = initialPosition.bounding.x + 50;
    const startY = initialPosition.bounding.y + 25;
    
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
                console.log('📊 Posición durante arrastre:');
                const dragPosition = checkElementPosition(element);
                
                const moved = dragPosition.bounding.x !== initialPosition.bounding.x || 
                             dragPosition.bounding.y !== initialPosition.bounding.y;
                console.log(`✅ Elemento ${moved ? 'se movió' : 'NO se movió'}`);
                
                // Mouseup
                const mouseupEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                document.dispatchEvent(mouseupEvent);
                
                // Verificar posición final inmediatamente
                setTimeout(() => {
                    console.log('📊 Posición final inmediata:');
                    const finalPosition = checkElementPosition(element);
                    
                    const finalMoved = finalPosition.bounding.x !== initialPosition.bounding.x || 
                                     finalPosition.bounding.y !== initialPosition.bounding.y;
                    console.log(`✅ Elemento ${finalMoved ? 'se movió finalmente' : 'NO se movió finalmente'}`);
                    
                    // Verificar estado final
                    const finalDragging = element.classList.contains('is-dragging');
                    console.log(`   - Estado final: ${finalDragging ? 'arrastrando' : 'no arrastrando'}`);
                    
                    // Verificar persistencia después de un delay
                    setTimeout(() => {
                        console.log('📊 Posición después de delay (verificar persistencia):');
                        const persistentPosition = checkElementPosition(element);
                        
                        const persisted = persistentPosition.bounding.x === finalPosition.bounding.x && 
                                        persistentPosition.bounding.y === finalPosition.bounding.y;
                        console.log(`✅ Posición ${persisted ? 'persistió' : 'NO persistió'}`);
                        
                        if (!persisted) {
                            console.log('❌ PROBLEMA: El elemento volvió a su posición original');
                            console.log('   - Posición final:', finalPosition.bounding);
                            console.log('   - Posición persistente:', persistentPosition.bounding);
                        } else {
                            console.log('✅ ÉXITO: El elemento mantuvo su nueva posición');
                        }
                    }, 1000);
                }, 100);
            }, 100);
        }, 100);
    }, 100);
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

// Función para forzar actualización del estado
function forceStateUpdate() {
    const component = checkVueState();
    if (!component) return;
    
    console.log('🔧 Forzando actualización del estado...');
    
    // Forzar re-render
    if (component.$forceUpdate) {
        component.$forceUpdate();
        console.log('✅ $forceUpdate ejecutado');
    }
    
    // Verificar si hay métodos de actualización
    if (component.updateElements) {
        component.updateElements();
        console.log('✅ updateElements ejecutado');
    }
}

// Función principal de prueba
function runDragPersistenceTest() {
    console.log('🚀 Ejecutando prueba de persistencia del arrastre...');
    
    const elements = findElements();
    if (elements.length === 0) return;
    
    // Paso 1: Verificar estado inicial
    console.log('\n📋 Paso 1: Estado inicial');
    checkVueState();
    
    // Paso 2: Probar arrastre del primer elemento
    console.log('\n📋 Paso 2: Probando arrastre y persistencia');
    const firstElement = elements[0];
    testDragPersistence(firstElement);
    
    // Paso 3: Verificar estado después del arrastre
    setTimeout(() => {
        console.log('\n📋 Paso 3: Estado después del arrastre');
        checkVueState();
        
        // Paso 4: Forzar actualización si es necesario
        setTimeout(() => {
            console.log('\n📋 Paso 4: Verificando persistencia final');
            const finalPosition = checkElementPosition(firstElement);
            console.log('📍 Posición final verificada:', finalPosition.bounding);
            
            console.log('\n✅ Prueba de persistencia completada');
        }, 2000);
    }, 3000);
}

// Función para probar un elemento específico
function testSpecificElementPersistence(elementId) {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) {
        console.error('❌ Elemento no encontrado:', elementId);
        return;
    }
    
    console.log('🎯 Probando persistencia de elemento específico:', elementId);
    testDragPersistence(element);
}

// Exportar funciones
window.runDragPersistenceTest = runDragPersistenceTest;
window.testSpecificElementPersistence = testSpecificElementPersistence;
window.findElements = findElements;
window.checkElementPosition = checkElementPosition;
window.testDragPersistence = testDragPersistence;
window.checkVueState = checkVueState;
window.forceStateUpdate = forceStateUpdate;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runDragPersistenceTest(): Prueba completa de persistencia');
console.log('- testSpecificElementPersistence("id"): Probar elemento específico');
console.log('- findElements(): Encontrar elementos');
console.log('- checkElementPosition(element): Verificar posición de elemento');
console.log('- testDragPersistence(element): Probar arrastre y persistencia');
console.log('- checkVueState(): Verificar estado del componente Vue');
console.log('- forceStateUpdate(): Forzar actualización del estado');

console.log('💡 Para ejecutar la prueba de persistencia, usa: runDragPersistenceTest()'); 