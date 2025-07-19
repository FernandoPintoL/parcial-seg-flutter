// Script de prueba para funcionalidades en JavaScript puro
// Basado en el ejemplo proporcionado

console.log('🧪 Probando funcionalidades en JavaScript puro...');

// Función para verificar el sistema de arrastre
function testPureJavaScriptDrag() {
    console.log('🖱️ Probando sistema de arrastre en JavaScript puro...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('❌ No hay elementos para probar');
        return;
    }
    
    const element = elements[0];
    const elementId = element.dataset.elementId;
    
    console.log('🎯 Elemento seleccionado para prueba:', elementId);
    
    // Verificar que el elemento tiene los event listeners correctos
    const hasMouseDown = element.onmousedown !== null || 
                        element.getAttribute('data-has-mousedown') === 'true';
    
    console.log('📊 Event listeners verificados:');
    console.log(`   - MouseDown: ${hasMouseDown ? '✅' : '❌'}`);
    
    // Simular mousedown
    const rect = element.getBoundingClientRect();
    const startX = rect.left + 50;
    const startY = rect.top + 25;
    
    console.log('📍 Posición inicial:', { x: rect.left, y: rect.top });
    
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
            console.log('✅ Sistema de arrastre funcionando correctamente');
            
            // Simular mousemove
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
                
                // Simular mouseup
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
                    
                    // Verificar persistencia
                    setTimeout(() => {
                        const persistentRect = element.getBoundingClientRect();
                        const persisted = persistentRect.left === finalRect.left && persistentRect.top === finalRect.top;
                        console.log(`✅ Posición ${persisted ? 'persistió' : 'NO persistió'}`);
                        
                        if (persisted) {
                            console.log('🎉 ÉXITO: Sistema de arrastre en JavaScript puro funciona correctamente');
                        } else {
                            console.log('❌ PROBLEMA: El elemento volvió a su posición original');
                        }
                    }, 1000);
                }, 100);
            }, 100);
        } else {
            console.log('❌ PROBLEMA: El elemento no entró en estado de arrastre');
        }
    }, 100);
}

// Función para probar la creación de widgets
function testWidgetCreation() {
    console.log('🆕 Probando creación de widgets...');
    
    // Simular evento de creación de widget
    const createWidgetEvent = new CustomEvent('create-widget', {
        detail: {
            widgetType: 'ElevatedButton',
            x: 100,
            y: 100
        }
    });
    
    document.dispatchEvent(createWidgetEvent);
    
    console.log('✅ Evento de creación de widget enviado');
    
    // Verificar si se creó el widget después de un delay
    setTimeout(() => {
        const newElements = document.querySelectorAll('.unified-widget-element');
        console.log(`📊 Elementos después de crear widget: ${newElements.length}`);
        
        // Buscar el widget recién creado
        const newWidget = Array.from(newElements).find(el => {
            const rect = el.getBoundingClientRect();
            return Math.abs(rect.left - 100) < 10 && Math.abs(rect.top - 100) < 10;
        });
        
        if (newWidget) {
            console.log('✅ Widget creado correctamente en la posición especificada');
        } else {
            console.log('❌ No se encontró el widget creado en la posición especificada');
        }
    }, 1000);
}

// Función para probar el panel de propiedades
function testPropertyPanel() {
    console.log('🔧 Probando panel de propiedades...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('❌ No hay elementos para probar');
        return;
    }
    
    const element = elements[0];
    
    // Simular clic para seleccionar el elemento
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    
    element.dispatchEvent(clickEvent);
    
    // Verificar si se muestra el panel de propiedades
    setTimeout(() => {
        const propertyPanel = document.querySelector('.property-panel');
        if (propertyPanel) {
            const isHidden = propertyPanel.classList.contains('hidden');
            console.log(`📊 Panel de propiedades: ${isHidden ? 'oculto' : 'visible'}`);
            
            if (!isHidden) {
                console.log('✅ Panel de propiedades se muestra correctamente');
                
                // Probar actualización de propiedades
                const textInput = propertyPanel.querySelector('input[data-property="text"]');
                if (textInput) {
                    textInput.value = 'Texto de prueba';
                    textInput.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('✅ Propiedad de texto actualizada');
                }
            } else {
                console.log('❌ Panel de propiedades no se muestra');
            }
        } else {
            console.log('❌ No se encontró el panel de propiedades');
        }
    }, 200);
}

// Función para probar la deselección al hacer clic en el canvas
function testCanvasDeselection() {
    console.log('🎯 Probando deselección al hacer clic en el canvas...');
    
    // Primero seleccionar un elemento
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('❌ No hay elementos para probar');
        return;
    }
    
    const element = elements[0];
    
    // Seleccionar el elemento
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    
    element.dispatchEvent(clickEvent);
    
    // Verificar que está seleccionado
    setTimeout(() => {
        const isSelected = element.classList.contains('selected-widget');
        console.log(`📊 Elemento seleccionado: ${isSelected ? 'sí' : 'no'}`);
        
        if (isSelected) {
            // Simular clic en el canvas
            const canvas = document.querySelector('.unified-canvas') || 
                           document.querySelector('.canvas-container') ||
                           document.querySelector('.phone-content-area');
            
            if (canvas) {
                const canvasClickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                canvas.dispatchEvent(canvasClickEvent);
                
                // Verificar deselección
                setTimeout(() => {
                    const stillSelected = element.classList.contains('selected-widget');
                    console.log(`📊 Elemento después del clic en canvas: ${stillSelected ? 'seleccionado' : 'deseleccionado'}`);
                    
                    if (!stillSelected) {
                        console.log('✅ Deselección al hacer clic en canvas funciona correctamente');
                    } else {
                        console.log('❌ PROBLEMA: El elemento no se deseleccionó');
                    }
                }, 100);
            } else {
                console.log('❌ No se encontró el canvas');
            }
        } else {
            console.log('❌ PROBLEMA: El elemento no se seleccionó inicialmente');
        }
    }, 200);
}

// Función principal de prueba
function runPureJavaScriptTest() {
    console.log('🚀 Ejecutando prueba de funcionalidades en JavaScript puro...');
    
    // Paso 1: Probar sistema de arrastre
    console.log('\n📋 Paso 1: Sistema de arrastre');
    testPureJavaScriptDrag();
    
    // Paso 2: Probar creación de widgets
    setTimeout(() => {
        console.log('\n📋 Paso 2: Creación de widgets');
        testWidgetCreation();
        
        // Paso 3: Probar panel de propiedades
        setTimeout(() => {
            console.log('\n📋 Paso 3: Panel de propiedades');
            testPropertyPanel();
            
            // Paso 4: Probar deselección
            setTimeout(() => {
                console.log('\n📋 Paso 4: Deselección en canvas');
                testCanvasDeselection();
                
                console.log('\n✅ Prueba de funcionalidades en JavaScript puro finalizada');
            }, 2000);
        }, 2000);
    }, 3000);
}

// Función para verificar la implementación
function checkImplementation() {
    console.log('🔍 Verificando implementación...');
    
    // Verificar que no se usa vue-draggable
    const scripts = document.querySelectorAll('script');
    let usesVueDraggable = false;
    
    scripts.forEach(script => {
        if (script.src && script.src.includes('vue-draggable')) {
            usesVueDraggable = true;
        }
    });
    
    console.log(`📊 Uso de vue-draggable: ${usesVueDraggable ? 'sí' : 'no'}`);
    
    if (!usesVueDraggable) {
        console.log('✅ Implementación usa JavaScript puro');
    } else {
        console.log('⚠️ Aún se detecta vue-draggable');
    }
    
    // Verificar event listeners nativos
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length > 0) {
        const element = elements[0];
        console.log('📊 Event listeners del primer elemento:');
        console.log(`   - onmousedown: ${element.onmousedown ? 'presente' : 'ausente'}`);
        console.log(`   - onmousemove: ${element.onmousemove ? 'presente' : 'ausente'}`);
        console.log(`   - onmouseup: ${element.onmouseup ? 'presente' : 'ausente'}`);
    }
}

// Exportar funciones
window.runPureJavaScriptTest = runPureJavaScriptTest;
window.testPureJavaScriptDrag = testPureJavaScriptDrag;
window.testWidgetCreation = testWidgetCreation;
window.testPropertyPanel = testPropertyPanel;
window.testCanvasDeselection = testCanvasDeselection;
window.checkImplementation = checkImplementation;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runPureJavaScriptTest(): Prueba completa de funcionalidades en JS puro');
console.log('- testPureJavaScriptDrag(): Probar sistema de arrastre');
console.log('- testWidgetCreation(): Probar creación de widgets');
console.log('- testPropertyPanel(): Probar panel de propiedades');
console.log('- testCanvasDeselection(): Probar deselección en canvas');
console.log('- checkImplementation(): Verificar implementación');

console.log('💡 Para ejecutar la prueba completa, usa: runPureJavaScriptTest()'); 