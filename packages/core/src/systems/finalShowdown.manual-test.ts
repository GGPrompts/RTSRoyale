// Manual test for Final Showdown System
import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Team, Health, Dead } from '../components';
import {
  finalShowdownSystem,
  GamePhase,
  getCurrentPhase,
  getTimeRemaining,
  getPhaseWarning,
  getVictor,
  formatTime,
  FinalShowdownWorld
} from './finalShowdown';

console.log('=================================');
console.log('🎮 FINAL SHOWDOWN SYSTEM TEST 🎮');
console.log('=================================\n');

// Test 1: Phase transitions
console.log('📍 TEST 1: Phase Transitions');
console.log('-----------------------------');
const testWorld = createWorld() as FinalShowdownWorld;
testWorld.time = { delta: 0, elapsed: 0 };

const phases = [
  { time: 0, expected: 'NORMAL', description: 'Game Start' },
  { time: 60, expected: 'NORMAL', description: '1:00 into game' },
  { time: 120, expected: 'WARNING', description: '2:00 - Warning Phase' },
  { time: 130, expected: 'WARNING', description: 'Still in Warning' },
  { time: 145, expected: 'COLLAPSE', description: '2:25 - Collapse Phase' },
  { time: 150, expected: 'SHOWDOWN', description: '2:30 - Final Showdown!' },
];

phases.forEach(({ time, expected, description }) => {
  testWorld.time.delta = time - (testWorld.showdown?.elapsedTime || 0);
  finalShowdownSystem(testWorld);
  const currentPhase = getCurrentPhase(testWorld);
  const timeRemaining = getTimeRemaining(testWorld);
  const warning = getPhaseWarning(testWorld);
  const formattedTime = formatTime(timeRemaining);

  console.log(`⏱️  ${description} (${time}s elapsed)`);
  console.log(`   Phase: ${currentPhase} | Timer: ${formattedTime} | Warning: "${warning}"`);

  if (currentPhase === expected) {
    console.log(`   ✅ Phase transition correct\n`);
  } else {
    console.log(`   ❌ FAILED: Expected ${expected} but got ${currentPhase}\n`);
  }
});

// Test 2: Unit teleportation
console.log('\n📍 TEST 2: Unit Teleportation');
console.log('-----------------------------');
const teleportWorld = createWorld() as FinalShowdownWorld;
teleportWorld.time = { delta: 0, elapsed: 0 };

// Create units at corners of the arena
const units = [
  { x: 100, y: 100, team: 0, name: 'Unit A (Blue, Top-Left)' },
  { x: 1820, y: 100, team: 0, name: 'Unit B (Blue, Top-Right)' },
  { x: 100, y: 980, team: 1, name: 'Unit C (Red, Bottom-Left)' },
  { x: 1820, y: 980, team: 1, name: 'Unit D (Red, Bottom-Right)' },
];

const unitEntities: number[] = [];
units.forEach(({ x, y, team, name }) => {
  const unit = addEntity(teleportWorld);
  addComponent(teleportWorld, Position, unit);
  Position.x[unit] = x;
  Position.y[unit] = y;
  addComponent(teleportWorld, Health, unit);
  Health.current[unit] = 100;
  Health.max[unit] = 100;
  addComponent(teleportWorld, Team, unit);
  Team.id[unit] = team;
  unitEntities.push(unit);
  console.log(`Created ${name} at (${x}, ${y})`);
});

// Trigger showdown
console.log('\n🔥 Triggering Final Showdown at T=150s...');
teleportWorld.time.delta = 150;
finalShowdownSystem(teleportWorld);

console.log('\n📡 Unit positions after teleport:');
unitEntities.forEach((unit, index) => {
  const x = Position.x[unit];
  const y = Position.y[unit];
  const distanceFromCenter = Math.sqrt((x - 960) ** 2 + (y - 540) ** 2);
  console.log(`   ${units[index].name}: (${x.toFixed(1)}, ${y.toFixed(1)}) - Distance from center: ${distanceFromCenter.toFixed(1)}px`);

  if (distanceFromCenter <= 100) {
    console.log(`   ✅ Successfully teleported to center`);
  } else {
    console.log(`   ❌ FAILED: Too far from center!`);
  }
});

// Test 3: Victory detection
console.log('\n📍 TEST 3: Victory Detection');
console.log('-----------------------------');
const victoryWorld = createWorld() as FinalShowdownWorld;
victoryWorld.time = { delta: 150, elapsed: 0 };

// Create scenario with only Team 0 units alive
const team0Unit1 = addEntity(victoryWorld);
addComponent(victoryWorld, Position, team0Unit1);
Position.x[team0Unit1] = 960;
Position.y[team0Unit1] = 540;
addComponent(victoryWorld, Health, team0Unit1);
Health.current[team0Unit1] = 50;
addComponent(victoryWorld, Team, team0Unit1);
Team.id[team0Unit1] = 0;

const team0Unit2 = addEntity(victoryWorld);
addComponent(victoryWorld, Position, team0Unit2);
Position.x[team0Unit2] = 970;
Position.y[team0Unit2] = 550;
addComponent(victoryWorld, Health, team0Unit2);
Health.current[team0Unit2] = 75;
addComponent(victoryWorld, Team, team0Unit2);
Team.id[team0Unit2] = 0;

console.log('Created 2 units for Team 0, no units for Team 1');

// First update to trigger showdown
finalShowdownSystem(victoryWorld);
console.log(`Phase after first update: ${getCurrentPhase(victoryWorld)}`);

// Second update should detect victory
victoryWorld.time.delta = 0.1;
finalShowdownSystem(victoryWorld);

const victor = getVictor(victoryWorld);
const victoryPhase = getCurrentPhase(victoryWorld);
const victoryWarning = getPhaseWarning(victoryWorld);

console.log(`\n🏆 Victory Detection Results:`);
console.log(`   Phase: ${victoryPhase}`);
console.log(`   Victor: ${victor === null ? 'None' : victor === -1 ? 'Draw' : `Team ${victor}`}`);
console.log(`   Message: "${victoryWarning}"`);

if (victoryPhase === GamePhase.VICTORY && victor === 0) {
  console.log(`   ✅ Victory correctly detected for Team 0`);
} else {
  console.log(`   ❌ FAILED: Victory not detected properly`);
}

// Test 4: Draw scenario
console.log('\n📍 TEST 4: Draw Detection');
console.log('-----------------------------');
const drawWorld = createWorld() as FinalShowdownWorld;
drawWorld.time = { delta: 150, elapsed: 0 };

console.log('No units created (empty battlefield)');

// Trigger showdown with no units
finalShowdownSystem(drawWorld);
drawWorld.time.delta = 0.1;
finalShowdownSystem(drawWorld);

const drawVictor = getVictor(drawWorld);
const drawPhase = getCurrentPhase(drawWorld);
const drawWarning = getPhaseWarning(drawWorld);

console.log(`\n⚔️  Draw Detection Results:`);
console.log(`   Phase: ${drawPhase}`);
console.log(`   Victor: ${drawVictor === null ? 'None' : drawVictor === -1 ? 'Draw' : `Team ${drawVictor}`}`);
console.log(`   Message: "${drawWarning}"`);

if (drawPhase === GamePhase.VICTORY && drawVictor === -1) {
  console.log(`   ✅ Draw correctly detected`);
} else {
  console.log(`   ❌ FAILED: Draw not detected properly`);
}

// Test 5: Dead units should not be teleported
console.log('\n📍 TEST 5: Dead Units Not Teleported');
console.log('--------------------------------------');
const deadTestWorld = createWorld() as FinalShowdownWorld;
deadTestWorld.time = { delta: 0, elapsed: 0 };

const aliveUnit = addEntity(deadTestWorld);
addComponent(deadTestWorld, Position, aliveUnit);
Position.x[aliveUnit] = 100;
Position.y[aliveUnit] = 100;
addComponent(deadTestWorld, Health, aliveUnit);
Health.current[aliveUnit] = 100;
addComponent(deadTestWorld, Team, aliveUnit);
Team.id[aliveUnit] = 0;

const deadUnit = addEntity(deadTestWorld);
addComponent(deadTestWorld, Position, deadUnit);
Position.x[deadUnit] = 200;
Position.y[deadUnit] = 200;
addComponent(deadTestWorld, Health, deadUnit);
Health.current[deadUnit] = 0;
addComponent(deadTestWorld, Team, deadUnit);
Team.id[deadUnit] = 1;
addComponent(deadTestWorld, Dead, deadUnit);

console.log(`Alive unit at: (${Position.x[aliveUnit]}, ${Position.y[aliveUnit]})`);
console.log(`Dead unit at: (${Position.x[deadUnit]}, ${Position.y[deadUnit]})`);

// Trigger showdown
deadTestWorld.time.delta = 150;
finalShowdownSystem(deadTestWorld);

console.log('\nAfter teleport:');
console.log(`Alive unit at: (${Position.x[aliveUnit].toFixed(1)}, ${Position.y[aliveUnit].toFixed(1)})`);
console.log(`Dead unit at: (${Position.x[deadUnit].toFixed(1)}, ${Position.y[deadUnit].toFixed(1)})`);

const aliveDistance = Math.sqrt((Position.x[aliveUnit] - 960) ** 2 + (Position.y[aliveUnit] - 540) ** 2);
const deadDistance = Math.sqrt((Position.x[deadUnit] - 960) ** 2 + (Position.y[deadUnit] - 540) ** 2);

if (aliveDistance <= 100 && Position.x[deadUnit] === 200 && Position.y[deadUnit] === 200) {
  console.log(`✅ Alive unit teleported, dead unit stayed in place`);
} else {
  console.log(`❌ FAILED: Teleportation not working as expected`);
}

console.log('\n=================================');
console.log('✨ ALL TESTS COMPLETE ✨');
console.log('=================================');