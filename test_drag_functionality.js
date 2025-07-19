// Script de prueba para funcionalidad de arrastre
// Ejecutar en la consola del navegador

console.log('🧪 Probando funcionalidad de arrastre...');

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
        }, index * 1000);
    });
}

// Función para verificar handles de arrastre
function checkDragHandles() {
    console.log('🔍 Verificando handles de arrastre...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    elements.forEach((element, index) => {
        console.log(`📍 Elemento ${index + 1}:`);
        
        // Verificar si está seleccionado
        const isSelected = element.classList.contains('selected-widget');
        console.log(`   - Seleccionado: ${isSelected}`);
        
        // Verificar si tiene handle de arrastre
        const dragHandle = element.querySelector('.drag-handle');
        console.log(`   - Tiene handle de arrastre: ${dragHandle !== null}`);
        
        if (dragHandle) {
            const computedStyle = window.getComputedStyle(dragHandle);
            console.log(`   - Handle visible: ${computedStyle.display !== 'none'}`);
            console.log(`   - Handle pointer events: ${computedStyle.pointerEvents}`);
            console.log(`   - Handle cursor: ${computedStyle.cursor}`);
        }
        
        // Verificar posición actual
        const rect = element.getBoundingClientRect();
        console.log(`   - Posición actual: x=${rect.left}, y=${rect.top}`);
    });
}

// Función para simular arrastre
function simulateDrag() {
    console.log('🖱️ Simulando arrastre...');
    
    const selectedElements = document.querySelectorAll('.selected-widget');
    if (selectedElements.length === 0) {
        console.log('ℹ️ No hay elementos seleccionados para arrastrar');
        return;
    }
    
    const selectedElement = selectedElements[0];
    const dragHandle = selectedElement.querySelector('.drag-handle');
    
    if (!dragHandle) {
        console.log('❌ No se encontró handle de arrastre');
        return;
    }
    
    console.log('🎯 Simulando arrastre en:', selectedElement.dataset.elementType);
    
    // Obtener posición inicial
    const initialRect = selectedElement.getBoundingClientRect();
    console.log('📍 Posición inicial:', { x: initialRect.left, y: initialRect.top });
    
    // Simular mousedown en el handle
    const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: initialRect.left + 50,
        clientY: initialRect.top - 20
    });
    dragHandle.dispatchEvent(mousedownEvent);
    
    // Simular mousemove
    setTimeout(() => {
        const mousemoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: initialRect.left + 100,
            clientY: initialRect.top + 50
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
            
            // Verificar nueva posición
            setTimeout(() => {
                const finalRect = selectedElement.getBoundingClientRect();
                console.log('📍 Posición final:', { x: finalRect.left, y: finalRect.top });
                
                const moved = finalRect.left !== initialRect.left || finalRect.top !== initialRect.top;
                console.log(`✅ Elemento ${moved ? 'se movió' : 'NO se movió'}`);
            }, 500);
        }, 100);
    }, 100);
}

// Función para verificar estado del arrastre
function checkDragState() {
    console.log('🔍 Verificando estado del arrastre...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        const isDragging = element.classList.contains('is-dragging');
        const isSelected = element.classList.contains('selected-widget');
        
        console.log(`📍 Elemento ${index + 1} (${element.dataset.elementType}):`);
        console.log(`   - Seleccionado: ${isSelected}`);
        console.log(`   - Arrastrando: ${isDragging}`);
        
        if (isDragging) {
            const computedStyle = window.getComputedStyle(element);
            console.log(`   - Cursor durante arrastre: ${computedStyle.cursor}`);
            console.log(`   - Z-index durante arrastre: ${computedStyle.zIndex}`);
        }
    });
}

// Función para verificar contenedor del canvas
function checkCanvasContainer() {
    console.log('🔍 Verificando contenedor del canvas...');
    
    const containers = [
        '.unified-canvas',
        '.canvas-container',
        '.phone-content-area',
        '.browser-content'
    ];
    
    containers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            const rect = container.getBoundingClientRect();
            console.log(`✅ Contenedor ${selector} encontrado:`);
            console.log(`   - Tamaño: ${rect.width}x${rect.height}`);
            console.log(`   - Posición: x=${rect.left}, y=${rect.top}`);
            console.log(`   - Scroll: left=${container.scrollLeft}, top=${container.scrollTop}`);
        } else {
            console.log(`❌ Contenedor ${selector} NO encontrado`);
        }
    });
}

// Función para probar arrastre manual
function testManualDrag() {
    console.log('🎯 Instrucciones para prueba manual de arrastre:');
    console.log('1. Haz clic en un elemento para seleccionarlo');
    console.log('2. Verifica que aparezca el handle "Mover" azul');
    console.log('3. Haz clic y arrastra el handle "Mover"');
    console.log('4. Verifica que el elemento se mueva suavemente');
    console.log('5. Suelta el mouse para finalizar el arrastre');
    
    // Verificar elementos disponibles
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('⚠️ No hay elementos para arrastrar. Agrega elementos primero.');
        return;
    }
    
    console.log(`📊 Elementos disponibles para arrastrar: ${elements.length}`);
    elements.forEach((element, index) => {
        console.log(`   - Elemento ${index + 1}: ${element.dataset.elementType}`);
    });
}

// Función principal de prueba
function runDragTest() {
    console.log('🚀 Ejecutando prueba de arrastre...');
    
    // Paso 1: Verificar contenedor del canvas
    checkCanvasContainer();
    
    // Paso 2: Agregar elementos de prueba
    addTestElements();
    
    // Paso 3: Verificar handles
    setTimeout(() => {
        checkDragHandles();
        
        // Paso 4: Probar arrastre automático
        setTimeout(() => {
            simulateDrag();
            
            // Paso 5: Verificar estado
            setTimeout(() => {
                checkDragState();
                
                // Paso 6: Instrucciones para prueba manual
                setTimeout(() => {
                    testManualDrag();
                    
                    console.log('\n📋 RESUMEN DE LA PRUEBA:');
                    const elements = document.querySelectorAll('.unified-widget-element');
                    const selectedElements = document.querySelectorAll('.selected-widget');
                    const dragHandles = document.querySelectorAll('.drag-handle');
                    
                    console.log(`✅ Elementos totales: ${elements.length}`);
                    console.log(`✅ Elementos seleccionados: ${selectedElements.length}`);
                    console.log(`✅ Handles de arrastre: ${dragHandles.length}`);
                    
                    console.log('\n💡 Para probar manualmente:');
                    console.log('- Selecciona un elemento haciendo clic');
                    console.log('- Usa el handle "Mover" azul para arrastrar');
                    console.log('- Verifica que el elemento se mueva suavemente');
                }, 1000);
            }, 1000);
        }, 2000);
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
window.runDragTest = runDragTest;
window.addTestElements = addTestElements;
window.checkDragHandles = checkDragHandles;
window.simulateDrag = simulateDrag;
window.checkDragState = checkDragState;
window.checkCanvasContainer = checkCanvasContainer;
window.testManualDrag = testManualDrag;
window.clearElements = clearElements;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runDragTest(): Prueba completa de arrastre');
console.log('- addTestElements(): Agregar elementos de prueba');
console.log('- checkDragHandles(): Verificar handles de arrastre');
console.log('- simulateDrag(): Simular arrastre automático');
console.log('- checkDragState(): Verificar estado del arrastre');
console.log('- checkCanvasContainer(): Verificar contenedor del canvas');
console.log('- testManualDrag(): Instrucciones para prueba manual');
console.log('- clearElements(): Limpiar elementos');

console.log('💡 Para ejecutar la prueba de arrastre, usa: runDragTest()'); 