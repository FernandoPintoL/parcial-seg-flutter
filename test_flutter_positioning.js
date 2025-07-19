// Script de prueba para verificar el posicionamiento de Flutter
// Ejecutar en la consola del navegador después de cargar la pizarra

console.log('🧪 Iniciando pruebas de posicionamiento Flutter...');

// Función para encontrar el componente Vue de la pizarra
function findPizarraComponent() {
    // Buscar en el DOM por elementos específicos de la pizarra
    const canvas = document.querySelector('.unified-canvas');
    if (!canvas) {
        console.error('❌ No se encontró el canvas de la pizarra');
        return null;
    }
    
    // Buscar el componente Vue más cercano
    const vueComponent = canvas.__vueParentComponent || canvas.__vue__;
    if (!vueComponent) {
        console.error('❌ No se encontró el componente Vue');
        return null;
    }
    
    return vueComponent;
}

// Función para agregar widgets de prueba
function addTestWidgets() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('🔧 Agregando widgets de prueba...');
    
    // Lista de widgets de Flutter para probar
    const testWidgets = [
        'TextField',
        'ElevatedButton', 
        'Text',
        'Container',
        'Label'
    ];
    
    testWidgets.forEach((widgetType, index) => {
        console.log(`📱 Agregando ${widgetType} (${index + 1}/${testWidgets.length})`);
        
        // Simular clic en el widget de la paleta
        const widgetButton = document.querySelector(`[data-widget-type="${widgetType}"]`);
        if (widgetButton) {
            widgetButton.click();
        } else {
            console.warn(`⚠️ No se encontró el botón para ${widgetType}`);
        }
        
        // Esperar un poco entre cada widget
        setTimeout(() => {
            console.log(`✅ ${widgetType} agregado`);
        }, 500 * (index + 1));
    });
}

// Función para verificar posicionamiento
function checkPositioning() {
    const component = findPizarraComponent();
    if (!component) return;
    
    console.log('🔍 Verificando posicionamiento...');
    
    // Obtener elementos actuales
    const elements = component.currentScreen?.elements || [];
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para verificar');
        return;
    }
    
    // Verificar que los elementos estén posicionados verticalmente
    let isVerticalLayout = true;
    let lastY = 0;
    
    elements.forEach((element, index) => {
        if (element.position) {
            console.log(`📍 Elemento ${index + 1} (${element.type}): x=${element.position.x}, y=${element.position.y}`);
            
            // Verificar que Y sea mayor que el elemento anterior (posicionamiento vertical)
            if (element.position.y < lastY && index > 0) {
                console.warn(`⚠️ Elemento ${index + 1} está por encima del anterior (no es vertical)`);
                isVerticalLayout = false;
            }
            
            lastY = element.position.y;
        } else {
            console.warn(`⚠️ Elemento ${index + 1} no tiene posición definida`);
            isVerticalLayout = false;
        }
    });
    
    if (isVerticalLayout) {
        console.log('✅ Posicionamiento vertical correcto');
    } else {
        console.log('❌ Posicionamiento vertical incorrecto');
    }
    
    return isVerticalLayout;
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

// Función principal para ejecutar todas las pruebas
function runFlutterPositioningTests() {
    console.log('🚀 Ejecutando pruebas de posicionamiento Flutter...');
    
    // Limpiar elementos existentes
    clearElements();
    
    // Esperar un poco y agregar widgets de prueba
    setTimeout(() => {
        addTestWidgets();
        
        // Verificar posicionamiento después de agregar todos los widgets
        setTimeout(() => {
            const result = checkPositioning();
            
            if (result) {
                console.log('🎉 ¡Todas las pruebas pasaron! El posicionamiento vertical funciona correctamente.');
            } else {
                console.log('💥 Algunas pruebas fallaron. Revisar el posicionamiento.');
            }
        }, 3000);
    }, 1000);
}

// Función para verificar el framework actual
function checkCurrentFramework() {
    const component = findPizarraComponent();
    if (!component) return;
    
    const framework = component.selectedFramework;
    console.log(`🎯 Framework actual: ${framework}`);
    
    if (framework !== 'flutter') {
        console.warn('⚠️ El framework actual no es Flutter. Cambiando a Flutter...');
        
        // Cambiar a Flutter
        if (component.switchFramework) {
            component.switchFramework('flutter');
        }
    }
}

// Exportar funciones para uso en consola
window.runFlutterPositioningTests = runFlutterPositioningTests;
window.checkFlutterPositioning = checkPositioning;
window.clearFlutterElements = clearElements;
window.checkFlutterFramework = checkCurrentFramework;

console.log('📋 Funciones disponibles:');
console.log('- runFlutterPositioningTests(): Ejecutar todas las pruebas');
console.log('- checkFlutterPositioning(): Verificar posicionamiento actual');
console.log('- clearFlutterElements(): Limpiar elementos');
console.log('- checkFlutterFramework(): Verificar framework actual');

console.log('💡 Para ejecutar las pruebas, usa: runFlutterPositioningTests()'); 