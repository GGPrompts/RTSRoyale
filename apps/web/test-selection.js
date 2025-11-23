// Test script to verify selection system is working
// Run this in browser console after loading the game

console.log('=== Testing RTS Input System ===');

// Test 1: Check if input manager is initialized
if (window.inputManager) {
  console.log('✅ Input Manager is initialized');
} else {
  console.log('❌ Input Manager not found - check if it's exported to window');
}

// Test 2: Check if selection renderer is working
if (window.selectionRenderer) {
  console.log('✅ Selection Renderer is initialized');
} else {
  console.log('❌ Selection Renderer not found');
}

// Test 3: Check if units are selectable
const checkSelectable = () => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    console.log('✅ Canvas found - try clicking on blue units');
    console.log('Instructions:');
    console.log('  1. Left-click on a blue unit to select it');
    console.log('  2. Drag to box-select multiple units');
    console.log('  3. Right-click to move selected units');
    console.log('  4. Press Ctrl+1-9 to assign control groups');
    console.log('  5. Press 1-9 to recall control groups');
    console.log('  6. Press Escape to deselect all');
  } else {
    console.log('❌ Canvas not found');
  }
};

checkSelectable();

// Test 4: Monitor selection events
console.log('\n=== Monitoring Selection Events ===');
console.log('Click on units and watch the console for selection feedback...');

// Add event listener to verify input is working
document.addEventListener('mousedown', (e) => {
  if (e.target.tagName === 'CANVAS') {
    console.log(`Mouse ${e.button === 0 ? 'LEFT' : 'RIGHT'} click at:`, e.clientX, e.clientY);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '9') {
    if (e.ctrlKey) {
      console.log(`Assigning control group ${e.key}`);
    } else {
      console.log(`Selecting control group ${e.key}`);
    }
  }
});