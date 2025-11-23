// Combat System Test
import { createWorld } from '../world';
import { combatSystem, cleanupSystem } from './combat';
import { Position, Health, Damage, Team, Dead } from '../components';
import { addEntity, hasComponent } from 'bitecs';

// Simple test to verify combat logic
export function testCombatSystem() {
  console.log('🧪 Testing Combat System...');

  const world = createWorld();
  world.deltaTime = 0.016; // 60 FPS

  // Create two units from different teams
  const unit1 = addEntity(world);
  Position.x[unit1] = 0;
  Position.y[unit1] = 0;
  Health.current[unit1] = 100;
  Health.max[unit1] = 100;
  Team.id[unit1] = 0; // Blue team
  Damage.amount[unit1] = 25;
  Damage.range[unit1] = 50; // 50 unit range
  Damage.attackSpeed[unit1] = 1.0; // 1 attack per second
  Damage.cooldown[unit1] = 0; // Ready to attack

  const unit2 = addEntity(world);
  Position.x[unit2] = 30; // Within range (30 < 50)
  Position.y[unit2] = 0;
  Health.current[unit2] = 100;
  Health.max[unit2] = 100;
  Team.id[unit2] = 1; // Red team
  Damage.amount[unit2] = 25;
  Damage.range[unit2] = 50;
  Damage.attackSpeed[unit2] = 1.0;
  Damage.cooldown[unit2] = 0;

  console.log('Initial state:');
  console.log(`Unit 1 (Blue): HP=${Health.current[unit1]}, Pos=(${Position.x[unit1]}, ${Position.y[unit1]})`);
  console.log(`Unit 2 (Red): HP=${Health.current[unit2]}, Pos=(${Position.x[unit2]}, ${Position.y[unit2]})`);

  // Run combat for one frame
  combatSystem(world);

  console.log('\nAfter first combat tick:');
  console.log(`Unit 1 (Blue): HP=${Health.current[unit1]}, Cooldown=${Damage.cooldown[unit1]}`);
  console.log(`Unit 2 (Red): HP=${Health.current[unit2]}, Cooldown=${Damage.cooldown[unit2]}`);

  // Both units should have attacked each other
  if (Health.current[unit1] === 75 && Health.current[unit2] === 75) {
    console.log('✅ Both units successfully attacked each other');
  } else {
    console.log('❌ Combat damage not applied correctly');
  }

  // Simulate multiple frames (4 attacks to kill)
  for (let i = 0; i < 200; i++) {
    world.deltaTime = 0.016;
    combatSystem(world);

    if (hasComponent(world, Dead, unit1) || hasComponent(world, Dead, unit2)) {
      console.log(`\n💀 Unit died after ${i + 2} frames`);
      break;
    }
  }

  console.log('\nFinal state:');
  console.log(`Unit 1 (Blue): HP=${Health.current[unit1]}, Dead=${hasComponent(world, Dead, unit1)}`);
  console.log(`Unit 2 (Red): HP=${Health.current[unit2]}, Dead=${hasComponent(world, Dead, unit2)}`);

  // Run cleanup
  cleanupSystem(world);

  console.log('\n✅ Combat System test complete');
}

// Run test if executed directly
if (typeof window === 'undefined') {
  testCombatSystem();
}