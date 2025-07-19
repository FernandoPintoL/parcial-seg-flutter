// Script de prueba para verificar el layout móvil y selección de elementos
// Ejecutar en la consola del navegador después de cargar la pizarra

console.log('🧪 Iniciando pruebas de layout móvil y selección...');

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

// Función para verificar el layout móvil
function checkMobileLayout() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('📱 Verificando layout móvil...');
    
    // Verificar que esté en modo Flutter
    const framework = component.selectedFramework;
    console.log(`🎯 Framework actual: ${framework}`);
    
    if (framework !== 'flutter') {
        console.warn('⚠️ Cambiando a Flutter para pruebas móviles...');
        if (component.switchFramework) {
            component.switchFramework('flutter');
        }
    }
    
    // Verificar elementos existentes
    const elements = component.currentScreen?.elements || [];
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para verificar');
        return;
    }
    
    // Verificar que los elementos ocupen el ancho completo
    let isFullWidth = true;
    elements.forEach((element, index) => {
        if (element.position && element.size) {
            console.log(`📍 Elemento ${index + 1} (${element.type}):`);
            console.log(`   - Posición: x=${element.position.x}, y=${element.position.y}`);
            console.log(`   - Tamaño: width=${element.size.width}, height=${element.size.height}`);
            
            // Verificar que esté en la posición correcta (margen izquierdo)
            if (element.position.x !== 20) {
                console.warn(`⚠️ Elemento ${index + 1} no está en la posición correcta (esperado: 20, actual: ${element.position.x})`);
                isFullWidth = false;
            }
            
            // Verificar que tenga el ancho correcto (260px para elementos de formulario)
            const expectedWidth = 260; // 300px - 40px de márgenes
            if (element.size.width !== expectedWidth) {
                console.warn(`⚠️ Elemento ${index + 1} no tiene el ancho correcto (esperado: ${expectedWidth}, actual: ${element.size.width})`);
                isFullWidth = false;
            }
        }
    });
    
    if (isFullWidth) {
        console.log('✅ Layout móvil correcto - elementos ocupan ancho completo');
    } else {
        console.log('❌ Layout móvil incorrecto - elementos no ocupan ancho completo');
    }
    
    return isFullWidth;
}

// Función para probar selección de elementos
function testElementSelection() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('🎯 Probando selección de elementos...');
    
    const elements = component.currentScreen?.elements || [];
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para seleccionar');
        return;
    }
    
    // Seleccionar el primer elemento
    const firstElement = elements[0];
    console.log(`🎯 Seleccionando elemento: ${firstElement.type} (${firstElement.id})`);
    
    if (component.selectElement) {
        component.selectElement(firstElement);
        
        // Verificar que se seleccionó
        setTimeout(() => {
            const selectedElement = component.selectedElement;
            if (selectedElement && selectedElement.id === firstElement.id) {
                console.log('✅ Elemento seleccionado correctamente');
                
                // Verificar que el panel de propiedades esté visible
                const propertiesPanel = document.querySelector('.properties-panel');
                if (propertiesPanel) {
                    console.log('✅ Panel de propiedades visible');
                } else {
                    console.warn('⚠️ Panel de propiedades no visible');
                }
            } else {
                console.warn('⚠️ Elemento no se seleccionó correctamente');
            }
        }, 100);
    }
}

// Función para agregar elementos de prueba
function addTestElements() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('🔧 Agregando elementos de prueba...');
    
    // Lista de widgets de Flutter para probar
    const testWidgets = [
        'TextField',
        'ElevatedButton', 
        'Text',
        'Label'
    ];
    
    testWidgets.forEach((widgetType, index) => {
        console.log(`📱 Agregando ${widgetType} (${index + 1}/${testWidgets.length})`);
        
        if (component.addWidget) {
            component.addWidget(widgetType);
        }
        
        // Esperar un poco entre cada widget
        setTimeout(() => {
            console.log(`✅ ${widgetType} agregado`);
        }, 500 * (index + 1));
    });
}

// Función para limpiar elementos
function clearElements() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('🧹 Limpiando elementos...');
    
    if (component.currentScreen) {
        component.currentScreen.elements = [];
        console.log('✅ Elementos eliminados');
    }
}

// Función para verificar propiedades del elemento seleccionado
function checkSelectedElementProperties() {
    const component = findPizarraComponent();
    if (!component) return;
    
    const selectedElement = component.selectedElement;
    if (!selectedElement) {
        console.log('ℹ️ No hay elemento seleccionado');
        return;
    }
    
    console.log('🔍 Propiedades del elemento seleccionado:');
    console.log(`   - Tipo: ${selectedElement.type}`);
    console.log(`   - Framework: ${selectedElement.framework}`);
    console.log(`   - ID: ${selectedElement.id}`);
    console.log(`   - Posición: x=${selectedElement.position?.x}, y=${selectedElement.position?.y}`);
    console.log(`   - Tamaño: width=${selectedElement.size?.width}, height=${selectedElement.size?.height}`);
    console.log(`   - Z-Index: ${selectedElement.zIndex}`);
    console.log(`   - Propiedades:`, selectedElement.props);
}

// Función principal para ejecutar todas las pruebas
function runMobileLayoutTests() {
    console.log('🚀 Ejecutando pruebas de layout móvil y selección...');
    
    // Limpiar elementos existentes
    clearElements();
    
    // Esperar un poco y agregar elementos de prueba
    setTimeout(() => {
        addTestElements();
        
        // Verificar layout después de agregar elementos
        setTimeout(() => {
            const layoutResult = checkMobileLayout();
            
            // Probar selección de elementos
            setTimeout(() => {
                testElementSelection();
                
                // Verificar propiedades del elemento seleccionado
                setTimeout(() => {
                    checkSelectedElementProperties();
                    
                    if (layoutResult) {
                        console.log('🎉 ¡Todas las pruebas pasaron! El layout móvil y la selección funcionan correctamente.');
                    } else {
                        console.log('💥 Algunas pruebas fallaron. Revisar el layout móvil.');
                    }
                }, 1000);
            }, 1000);
        }, 3000);
    }, 1000);
}

// Exportar funciones para uso en consola
window.runMobileLayoutTests = runMobileLayoutTests;
window.checkMobileLayout = checkMobileLayout;
window.testElementSelection = testElementSelection;
window.clearElements = clearElements;
window.checkSelectedElementProperties = checkSelectedElementProperties;

console.log('📋 Funciones disponibles:');
console.log('- runMobileLayoutTests(): Ejecutar todas las pruebas');
console.log('- checkMobileLayout(): Verificar layout móvil');
console.log('- testElementSelection(): Probar selección de elementos');
console.log('- clearElements(): Limpiar elementos');
console.log('- checkSelectedElementProperties(): Verificar propiedades del elemento seleccionado');

console.log('💡 Para ejecutar las pruebas, usa: runMobileLayoutTests()'); 