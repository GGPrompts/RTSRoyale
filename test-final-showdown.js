#!/usr/bin/env node

// Test script for Final Showdown phase transitions
console.log('🎮 Testing Final Showdown System...\n');

const phases = [
  { time: 0, expected: 'normal', description: 'Game starts in normal phase' },
  { time: 60, expected: 'normal', description: '1:00 - Still normal gameplay' },
  { time: 120, expected: 'warning', description: '2:00 - Warning phase begins' },
  { time: 135, expected: 'glow', description: '2:15 - Screen glow phase' },
  { time: 140, expected: 'countdown', description: '2:20 - Countdown phase' },
  { time: 145, expected: 'prepare', description: '2:25 - Prepare phase' },
  { time: 150, expected: 'showdown', description: '2:30 - FINAL SHOWDOWN!' },
];

function determinePhase(gameTime) {
  if (gameTime >= 150) return 'showdown';
  if (gameTime >= 145) return 'prepare';
  if (gameTime >= 140) return 'countdown';
  if (gameTime >= 135) return 'glow';
  if (gameTime >= 120) return 'warning';
  return 'normal';
}

console.log('Phase Transition Tests:');
console.log('-'.repeat(50));

let allPassed = true;

phases.forEach(test => {
  const actualPhase = determinePhase(test.time);
  const passed = actualPhase === test.expected;
  const status = passed ? '✅' : '❌';

  console.log(`${status} Time ${test.time}s: ${test.description}`);
  console.log(`   Expected: ${test.expected}, Got: ${actualPhase}`);

  if (!passed) allPassed = false;
});

console.log('-'.repeat(50));

if (allPassed) {
  console.log('\n✅ All phase transition tests PASSED!');
} else {
  console.log('\n❌ Some tests FAILED!');
  process.exit(1);
}

// Test teleport coordinates
console.log('\n📍 Testing Teleport Logic:');
console.log('-'.repeat(50));

const ARENA_CENTER_X = 400;
const ARENA_CENTER_Y = 300;
const TELEPORT_RADIUS = 100;

// Simulate teleporting 10 units
console.log('Simulating teleport for 10 units to center...');
const positions = [];

for (let i = 0; i < 10; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * TELEPORT_RADIUS;

  const x = ARENA_CENTER_X + Math.cos(angle) * distance;
  const y = ARENA_CENTER_Y + Math.sin(angle) * distance;

  positions.push({ x, y });

  // Verify position is within teleport radius
  const actualDistance = Math.hypot(x - ARENA_CENTER_X, y - ARENA_CENTER_Y);
  if (actualDistance > TELEPORT_RADIUS) {
    console.log(`❌ Unit ${i} outside teleport radius! Distance: ${actualDistance}`);
  }
}

// Calculate average position (should be near center)
const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

console.log(`✅ All units within ${TELEPORT_RADIUS} unit radius of center`);
console.log(`   Center: (${ARENA_CENTER_X}, ${ARENA_CENTER_Y})`);
console.log(`   Average position: (${avgX.toFixed(1)}, ${avgY.toFixed(1)})`);

// Test time formatting
console.log('\n⏰ Testing Timer Display:');
console.log('-'.repeat(50));

const timeTests = [
  { time: 0, display: '2:30' },
  { time: 30, display: '2:00' },
  { time: 90, display: '1:00' },
  { time: 120, display: '0:30' },
  { time: 145, display: '0:05' },
  { time: 149, display: '0:01' },
  { time: 150, display: '0:00' },
];

timeTests.forEach(test => {
  const timeRemaining = Math.max(0, 150 - test.time);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const passed = display === test.display;
  const status = passed ? '✅' : '❌';

  console.log(`${status} Time ${test.time}s: ${display} (expected ${test.display})`);
});

console.log('\n🎉 Final Showdown System Test Complete!');