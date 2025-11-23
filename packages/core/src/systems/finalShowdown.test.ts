// Test for Final Showdown System
import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Team, Health, Dead } from '../components';
import {
  finalShowdownSystem,
  GamePhase,
  getCurrentPhase,
  getTimeRemaining,
  getPhaseWarning,
  FinalShowdownWorld
} from './finalShowdown';

describe('Final Showdown System', () => {
  let world: FinalShowdownWorld;

  beforeEach(() => {
    world = createWorld() as FinalShowdownWorld;
    world.time = { delta: 0, elapsed: 0 };
  });

  test('should start in NORMAL phase', () => {
    finalShowdownSystem(world);
    expect(getCurrentPhase(world)).toBe(GamePhase.NORMAL);
    expect(getTimeRemaining(world)).toBe(150);
  });

  test('should transition to WARNING phase at 120 seconds', () => {
    world.time.elapsed = 0;
    world.time.delta = 120;
    finalShowdownSystem(world);
    expect(getCurrentPhase(world)).toBe(GamePhase.WARNING);
    expect(getPhaseWarning(world)).toBe('ARENA COLLAPSE IN 30 SECONDS');
  });

  test('should transition to COLLAPSE phase at 145 seconds', () => {
    world.time.elapsed = 0;
    world.time.delta = 145;
    finalShowdownSystem(world);
    expect(getCurrentPhase(world)).toBe(GamePhase.COLLAPSE);
    expect(getPhaseWarning(world)).toBe('PREPARE FOR FINAL SHOWDOWN');
  });

  test('should transition to SHOWDOWN phase at 150 seconds', () => {
    world.time.elapsed = 0;
    world.time.delta = 150;

    // Create test units at different positions
    const unit1 = addEntity(world);
    addComponent(world, Position, unit1);
    Position.x[unit1] = 100;
    Position.y[unit1] = 100;
    addComponent(world, Health, unit1);
    Health.current[unit1] = 100;
    addComponent(world, Team, unit1);
    Team.id[unit1] = 0;

    const unit2 = addEntity(world);
    addComponent(world, Position, unit2);
    Position.x[unit2] = 1800;
    Position.y[unit2] = 900;
    addComponent(world, Health, unit2);
    Health.current[unit2] = 100;
    addComponent(world, Team, unit2);
    Team.id[unit2] = 1;

    finalShowdownSystem(world);

    expect(getCurrentPhase(world)).toBe(GamePhase.SHOWDOWN);
    expect(getPhaseWarning(world)).toBe('FINAL SHOWDOWN!');

    // Check that units were teleported near center (960, 540)
    expect(Math.abs(Position.x[unit1] - 960)).toBeLessThan(100);
    expect(Math.abs(Position.y[unit1] - 540)).toBeLessThan(100);
    expect(Math.abs(Position.x[unit2] - 960)).toBeLessThan(100);
    expect(Math.abs(Position.y[unit2] - 540)).toBeLessThan(100);
  });

  test('should detect victory when only one team remains', () => {
    world.time.elapsed = 150;
    world.time.delta = 0.1;

    // Create units for team 0
    const unit1 = addEntity(world);
    addComponent(world, Position, unit1);
    addComponent(world, Health, unit1);
    Health.current[unit1] = 100;
    addComponent(world, Team, unit1);
    Team.id[unit1] = 0;

    // Run system to trigger showdown
    finalShowdownSystem(world);

    // Run again to check victory
    world.time.delta = 0.1;
    finalShowdownSystem(world);

    expect(getCurrentPhase(world)).toBe(GamePhase.VICTORY);
    expect(world.showdown?.victor).toBe(0);
    expect(getPhaseWarning(world)).toBe('TEAM 0 WINS!');
  });

  test('should detect draw when no units remain', () => {
    world.time.elapsed = 150;
    world.time.delta = 0.1;

    // No units exist
    finalShowdownSystem(world);

    // Run again to check victory
    world.time.delta = 0.1;
    finalShowdownSystem(world);

    expect(getCurrentPhase(world)).toBe(GamePhase.VICTORY);
    expect(world.showdown?.victor).toBe(-1);
    expect(getPhaseWarning(world)).toBe('DRAW!');
  });

  test('should not teleport dead units', () => {
    world.time.elapsed = 0;
    world.time.delta = 150;

    // Create a dead unit
    const deadUnit = addEntity(world);
    addComponent(world, Position, deadUnit);
    Position.x[deadUnit] = 100;
    Position.y[deadUnit] = 100;
    addComponent(world, Health, deadUnit);
    Health.current[deadUnit] = 0;
    addComponent(world, Team, deadUnit);
    addComponent(world, Dead, deadUnit);

    const originalX = Position.x[deadUnit];
    const originalY = Position.y[deadUnit];

    finalShowdownSystem(world);

    // Dead unit should not move
    expect(Position.x[deadUnit]).toBe(originalX);
    expect(Position.y[deadUnit]).toBe(originalY);
  });

  test('should track elapsed time correctly', () => {
    world.time.delta = 1; // 1 second per frame

    for (let i = 0; i < 10; i++) {
      finalShowdownSystem(world);
      expect(world.showdown?.elapsedTime).toBe(i + 1);
    }

    expect(getTimeRemaining(world)).toBe(140);
  });
});

// Manual test output for console
console.log('=== Final Showdown System Test Phases ===');
const testWorld = createWorld() as FinalShowdownWorld;
testWorld.time = { delta: 0, elapsed: 0 };

const phases = [
  { time: 0, expected: 'NORMAL' },
  { time: 60, expected: 'NORMAL' },
  { time: 120, expected: 'WARNING' },
  { time: 130, expected: 'WARNING' },
  { time: 145, expected: 'COLLAPSE' },
  { time: 150, expected: 'SHOWDOWN' },
];

phases.forEach(({ time, expected }) => {
  testWorld.time.delta = time - (testWorld.showdown?.elapsedTime || 0);
  finalShowdownSystem(testWorld);
  const currentPhase = getCurrentPhase(testWorld);
  const timeRemaining = getTimeRemaining(testWorld);
  const warning = getPhaseWarning(testWorld);

  console.log(`Time: ${time}s | Phase: ${currentPhase} | Remaining: ${timeRemaining}s | Warning: "${warning}"`);

  if (currentPhase !== expected) {
    console.error(`❌ Expected ${expected} but got ${currentPhase}`);
  } else {
    console.log(`✅ Phase transition correct`);
  }
});