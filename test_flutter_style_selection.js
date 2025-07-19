// Script de prueba para la nueva implementación con estilo Flutter
// Ejecutar en la consola del navegador después de cargar la pizarra

console.log('🧪 Probando nueva implementación con estilo Flutter...');

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

// Función para agregar elementos de prueba con estilo Flutter
function addFlutterElements() {
    const component = findMainComponent();
    if (!component) return;
    
    console.log('🔧 Agregando elementos de Flutter...');
    
    // Limpiar elementos existentes
    if (component.currentScreen) {
        component.currentScreen.elements = [];
    }
    
    // Agregar elementos de prueba
    const testElements = [
        'TextField',
        'DropdownButton',
        'ElevatedButton',
        'Checkbox',
        'Card'
    ];
    
    testElements.forEach((widgetType, index) => {
        setTimeout(() => {
            if (component.addWidget) {
                component.addWidget(widgetType);
                console.log(`✅ ${widgetType} agregado`);
            }
        }, index * 500);
    });
}

// Función para verificar elementos en el DOM
function checkFlutterElements() {
    console.log('🔍 Verificando elementos de Flutter en el DOM...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    console.log(`📊 Elementos encontrados: ${elements.length}`);
    
    elements.forEach((element, index) => {
        console.log(`📍 Elemento ${index + 1}:`);
        console.log(`   - Clases: ${element.className}`);
        console.log(`   - Tipo: ${element.dataset.elementType}`);
        console.log(`   - ID: ${element.dataset.elementId}`);
        
        // Verificar si tiene la clase mobile-widget
        const hasMobileWidgetClass = element.classList.contains('mobile-widget');
        console.log(`   - Tiene clase mobile-widget: ${hasMobileWidgetClass}`);
        
        // Verificar si tiene header
        const header = element.querySelector('.widget-header');
        console.log(`   - Tiene header: ${header !== null}`);
        
        // Verificar si tiene botón de eliminar
        const removeBtn = element.querySelector('.widget-remove-btn');
        console.log(`   - Tiene botón eliminar: ${removeBtn !== null}`);
    });
}

// Función para probar selección
function testSelection() {
    console.log('🎯 Probando selección de elementos...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    if (elements.length === 0) {
        console.log('ℹ️ No hay elementos para seleccionar');
        return;
    }
    
    const firstElement = elements[0];
    console.log('🎯 Haciendo clic en el primer elemento:', firstElement);
    
    // Hacer clic en el elemento
    firstElement.click();
    
    // Verificar selección después de un tiempo
    setTimeout(() => {
        const component = findMainComponent();
        if (component) {
            console.log('📋 Estado después del clic:');
            console.log(`   - selectedElement:`, component.selectedElement);
            console.log(`   - showPropertiesPanel:`, component.showPropertiesPanel);
        }
        
        // Verificar si tiene la clase selected-widget
        const hasSelectedClass = firstElement.classList.contains('selected-widget');
        console.log(`   - Tiene clase selected-widget: ${hasSelectedClass}`);
        
        // Verificar si el header es visible
        const header = firstElement.querySelector('.widget-header');
        const headerVisible = header && header.style.display !== 'none';
        console.log(`   - Header visible: ${headerVisible}`);
        
        // Verificar panel de propiedades
        const propertiesPanel = document.querySelector('.properties-panel');
        console.log(`   - Panel de propiedades visible: ${propertiesPanel !== null}`);
    }, 500);
}

// Función para probar eliminación
function testDeletion() {
    console.log('🗑️ Probando eliminación de elementos...');
    
    const selectedElements = document.querySelectorAll('.unified-widget-element.selected-widget');
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

// Función para verificar estilos visuales
function checkVisualStyles() {
    console.log('🎨 Verificando estilos visuales...');
    
    const elements = document.querySelectorAll('.unified-widget-element');
    elements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        
        console.log(`📍 Elemento ${index + 1} - Estilos:`);
        console.log(`   - Border radius: ${computedStyle.borderRadius}`);
        console.log(`   - Box shadow: ${computedStyle.boxShadow}`);
        console.log(`   - Background: ${computedStyle.backgroundColor}`);
        console.log(`   - Border: ${computedStyle.border}`);
        
        // Verificar si tiene el estilo de PizarraFlutter
        const hasFlutterStyle = computedStyle.borderRadius === '8px' && 
                               computedStyle.boxShadow !== 'none';
        console.log(`   - Tiene estilo Flutter: ${hasFlutterStyle}`);
    });
}

// Función principal de prueba
function runFlutterStyleTest() {
    console.log('🚀 Ejecutando prueba completa de estilo Flutter...');
    
    // Paso 1: Agregar elementos
    addFlutterElements();
    
    // Paso 2: Verificar elementos
    setTimeout(() => {
        checkFlutterElements();
        checkVisualStyles();
        
        // Paso 3: Probar selección
        setTimeout(() => {
            testSelection();
            
            // Paso 4: Probar eliminación
            setTimeout(() => {
                testDeletion();
                
                // Resumen final
                setTimeout(() => {
                    console.log('\n📋 RESUMEN DE LA PRUEBA:');
                    const component = findMainComponent();
                    if (component) {
                        const elements = component.currentScreen?.elements || [];
                        console.log(`✅ Elementos en pantalla: ${elements.length}`);
                        console.log(`✅ Elemento seleccionado: ${component.selectedElement ? 'SÍ' : 'NO'}`);
                        console.log(`✅ Panel de propiedades: ${component.showPropertiesPanel ? 'VISIBLE' : 'OCULTO'}`);
                    }
                    
                    const selectedElements = document.querySelectorAll('.selected-widget');
                    console.log(`✅ Elementos con estilo seleccionado: ${selectedElements.length}`);
                    
                    const mobileWidgets = document.querySelectorAll('.mobile-widget');
                    console.log(`✅ Elementos con estilo móvil: ${mobileWidgets.length}`);
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
window.runFlutterStyleTest = runFlutterStyleTest;
window.addFlutterElements = addFlutterElements;
window.checkFlutterElements = checkFlutterElements;
window.testSelection = testSelection;
window.testDeletion = testDeletion;
window.checkVisualStyles = checkVisualStyles;
window.clearElements = clearElements;

console.log('📋 Funciones de prueba disponibles:');
console.log('- runFlutterStyleTest(): Prueba completa');
console.log('- addFlutterElements(): Agregar elementos Flutter');
console.log('- checkFlutterElements(): Verificar elementos');
console.log('- testSelection(): Probar selección');
console.log('- testDeletion(): Probar eliminación');
console.log('- checkVisualStyles(): Verificar estilos');
console.log('- clearElements(): Limpiar elementos');

console.log('💡 Para ejecutar la prueba completa, usa: runFlutterStyleTest()'); 