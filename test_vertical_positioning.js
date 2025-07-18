/**
 * Test script for verifying vertical positioning of elements
 *
 * This script provides functions to test that elements are positioned
 * vertically (one below the other) when added to the whiteboard.
 */

console.log('=== Vertical Positioning Test ===');

// Function to test adding multiple widgets and checking their positions
function testVerticalPositioning() {
    console.log('\n--- Testing Vertical Positioning of Elements ---');

    // Get the current screen elements
    const getCurrentElements = () => {
        if (!window.app) {
            console.error('❌ App instance not found. Make sure you run this in the browser console.');
            return [];
        }

        const pizarraComponent = findVueComponent('PizarraUnificada');
        if (!pizarraComponent) {
            console.error('❌ PizarraUnificada component not found');
            return [];
        }

        const currentScreen = pizarraComponent.currentScreen;
        if (!currentScreen || !currentScreen.elements) {
            console.error('❌ Current screen or elements not found');
            return [];
        }

        return currentScreen.elements;
    };

    // Add a test widget
    const addTestWidget = (type) => {
        const pizarraComponent = findVueComponent('PizarraUnificada');
        if (!pizarraComponent) {
            console.error('❌ PizarraUnificada component not found');
            return null;
        }

        // Call the addWidget method
        pizarraComponent.addWidget(type);

        // Return the newly added element (should be the last one)
        const elements = getCurrentElements();
        return elements[elements.length - 1];
    };

    // Test adding multiple widgets and check their positions
    const testWidgets = ['Container', 'Button', 'Text', 'TextField'];
    const addedElements = [];

    console.log('Adding test widgets...');

    // Add each test widget
    testWidgets.forEach(type => {
        const element = addTestWidget(type);
        if (element) {
            addedElements.push(element);
            console.log(`Added ${type} at position:`, element.position);
        }
    });

    // Check if elements are positioned vertically (one below the other)
    if (addedElements.length < 2) {
        console.error('❌ Not enough elements added to test vertical positioning');
        return false;
    }

    let isVertical = true;
    for (let i = 1; i < addedElements.length; i++) {
        const prevElement = addedElements[i-1];
        const currElement = addedElements[i];

        if (!prevElement.position || !currElement.position) {
            console.error('❌ Element position not defined');
            continue;
        }

        // Check if current element is below the previous one
        if (currElement.position.y <= prevElement.position.y) {
            console.error(`❌ Element ${i} (${currElement.type}) is not below element ${i-1} (${prevElement.type})`);
            isVertical = false;
        } else {
            console.log(`✅ Element ${i} (${currElement.type}) is correctly positioned below element ${i-1} (${prevElement.type})`);
        }
    }

    return isVertical;
}

// Function to test vertical positioning in Angular framework
function testAngularVerticalPositioning() {
    console.log('\n--- Testing Angular Framework Vertical Positioning ---');

    // Switch to Angular framework
    const pizarraComponent = findVueComponent('PizarraUnificada');
    if (!pizarraComponent) {
        console.error('❌ PizarraUnificada component not found');
        return false;
    }

    // Save current framework
    const originalFramework = pizarraComponent.selectedFramework;

    // Switch to Angular
    pizarraComponent.switchFramework('angular');
    console.log('Switched to Angular framework');

    // Test vertical positioning
    const result = testVerticalPositioning();

    // Switch back to original framework
    pizarraComponent.switchFramework(originalFramework);
    console.log(`Switched back to ${originalFramework} framework`);

    return result;
}

// Function to test vertical positioning in Flutter framework
function testFlutterVerticalPositioning() {
    console.log('\n--- Testing Flutter Framework Vertical Positioning ---');

    // Switch to Flutter framework
    const pizarraComponent = findVueComponent('PizarraUnificada');
    if (!pizarraComponent) {
        console.error('❌ PizarraUnificada component not found');
        return false;
    }

    // Save current framework
    const originalFramework = pizarraComponent.selectedFramework;

    // Switch to Flutter
    pizarraComponent.switchFramework('flutter');
    console.log('Switched to Flutter framework');

    // Test vertical positioning
    const result = testVerticalPositioning();

    // Switch back to original framework
    pizarraComponent.switchFramework(originalFramework);
    console.log(`Switched back to ${originalFramework} framework`);

    return result;
}

// Helper function to find Vue component
function findVueComponent(componentName) {
    if (!window.app) {
        console.error('❌ Vue app instance not found');
        return null;
    }

    // Try to find the component in the Vue component tree
    let component = null;

    // Function to traverse the component tree
    function traverse(vm) {
        if (vm.$options && vm.$options.__file && vm.$options.__file.includes(componentName)) {
            component = vm;
            return true;
        }

        if (vm.$children) {
            for (const child of vm.$children) {
                if (traverse(child)) {
                    return true;
                }
            }
        }

        return false;
    }

    traverse(window.app);
    return component;
}

// Run all tests
function runAllTests() {
    console.log('\n=== Running All Tests ===');

    const flutterResult = testFlutterVerticalPositioning();
    const angularResult = testAngularVerticalPositioning();

    console.log('\n=== Test Results ===');
    console.log(`Flutter Vertical Positioning: ${flutterResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Angular Vertical Positioning: ${angularResult ? '✅ PASS' : '❌ FAIL'}`);

    return flutterResult && angularResult;
}

// Make functions available in the global scope for browser console testing
window.testVerticalPositioning = testVerticalPositioning;
window.testFlutterVerticalPositioning = testFlutterVerticalPositioning;
window.testAngularVerticalPositioning = testAngularVerticalPositioning;
window.runAllTests = runAllTests;

console.log('\n=== Test Script Loaded ===');
console.log('Run window.runAllTests() in the browser console to start testing');
console.log('Or run individual tests:');
console.log('- window.testVerticalPositioning()');
console.log('- window.testFlutterVerticalPositioning()');
console.log('- window.testAngularVerticalPositioning()');
