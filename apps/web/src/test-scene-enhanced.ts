// Enhanced test scene setup with sprites and visual effects
import { Application } from 'pixi.js';
import { addEntity } from 'bitecs';
import {
  Position,
  Velocity,
  Health,
  Team,
  Sprite,
  Damage,
  Target,
  Dash,
  Shield,
  RangedAttack,
} from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';
import { TextureAssets } from './assets/textures';
import { SpriteSystem } from './rendering/sprites';

export async function initTestScene(
  world: GameWorld,
  app: Application,
  textures: TextureAssets,
  spriteSystem: SpriteSystem
) {
  console.log('🎬 Initializing enhanced test scene...');

  // Track entity count
  world.entityCount = 0;

  // Spawn units for Team 0 (Blue) - Left side
  const team0Units = 25;
  for (let i = 0; i < team0Units; i++) {
    const eid = addEntity(world);
    world.entityCount++;

    // Formation positioning
    const row = Math.floor(i / 5);
    const col = i % 5;

    Position.x[eid] = 200 + col * 60;
    Position.y[eid] = 200 + row * 60;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    Health.current[eid] = 100;
    Health.max[eid] = 100;

    Team.id[eid] = 0; // Team 0 (Blue)

    // Combat stats
    Damage.amount[eid] = 25;
    Damage.range[eid] = 80; // pixels
    Damage.attackSpeed[eid] = 1.0;
    Damage.cooldown[eid] = 0;

    // Movement target
    Target.x[eid] = Position.x[eid];
    Target.y[eid] = Position.y[eid];
    Target.reached[eid] = 1;

    // Sprite configuration
    Sprite.textureId[eid] = 0; // Blue team texture
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = 0;

    // Give some units abilities
    if (i % 3 === 0) {
      // Dash units
      Dash.cooldown[eid] = 0;
      Dash.maxCooldown[eid] = 10;
      Dash.distance[eid] = 150;
      Dash.damage[eid] = 30;
    } else if (i % 3 === 1) {
      // Shield units
      Shield.cooldown[eid] = 0;
      Shield.maxCooldown[eid] = 15;
      Shield.duration[eid] = 3;
      Shield.active[eid] = 0;
    } else {
      // Ranged units
      RangedAttack.cooldown[eid] = 0;
      RangedAttack.maxCooldown[eid] = 8;
      RangedAttack.range[eid] = 300;
      RangedAttack.damage[eid] = 40;
    }
  }

  // Spawn units for Team 1 (Red) - Right side
  const team1Units = 25;
  for (let i = 0; i < team1Units; i++) {
    const eid = addEntity(world);
    world.entityCount++;

    // Formation positioning
    const row = Math.floor(i / 5);
    const col = i % 5;

    Position.x[eid] = 1520 - col * 60;
    Position.y[eid] = 200 + row * 60;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    Health.current[eid] = 100;
    Health.max[eid] = 100;

    Team.id[eid] = 1; // Team 1 (Red)

    // Combat stats
    Damage.amount[eid] = 25;
    Damage.range[eid] = 80;
    Damage.attackSpeed[eid] = 1.0;
    Damage.cooldown[eid] = 0;

    // Movement target
    Target.x[eid] = Position.x[eid];
    Target.y[eid] = Position.y[eid];
    Target.reached[eid] = 1;

    // Sprite configuration
    Sprite.textureId[eid] = 1; // Red team texture
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = Math.PI; // Face left

    // Give some units abilities
    if (i % 3 === 0) {
      // Dash units
      Dash.cooldown[eid] = 0;
      Dash.maxCooldown[eid] = 10;
      Dash.distance[eid] = 150;
      Dash.damage[eid] = 30;
    } else if (i % 3 === 1) {
      // Shield units
      Shield.cooldown[eid] = 0;
      Shield.maxCooldown[eid] = 15;
      Shield.duration[eid] = 3;
      Shield.active[eid] = 0;
    } else {
      // Ranged units
      RangedAttack.cooldown[eid] = 0;
      RangedAttack.maxCooldown[eid] = 8;
      RangedAttack.range[eid] = 300;
      RangedAttack.damage[eid] = 40;
    }
  }

  // Add some neutral units in the middle for testing
  const neutralUnits = 10;
  for (let i = 0; i < neutralUnits; i++) {
    const eid = addEntity(world);
    world.entityCount++;

    const angle = (Math.PI * 2 * i) / neutralUnits;
    const radius = 150;

    Position.x[eid] = 960 + Math.cos(angle) * radius;
    Position.y[eid] = 540 + Math.sin(angle) * radius;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    Health.current[eid] = 150; // Tougher units
    Health.max[eid] = 150;

    Team.id[eid] = 2; // Neutral team

    // Combat stats
    Damage.amount[eid] = 35;
    Damage.range[eid] = 100;
    Damage.attackSpeed[eid] = 0.8;
    Damage.cooldown[eid] = 0;

    // Sprite configuration
    Sprite.textureId[eid] = 2; // Neutral texture
    Sprite.scaleX[eid] = 1.2; // Slightly larger
    Sprite.scaleY[eid] = 1.2;
    Sprite.rotation[eid] = angle;

    // All neutral units have shields
    Shield.cooldown[eid] = 0;
    Shield.maxCooldown[eid] = 10;
    Shield.duration[eid] = 5;
    Shield.active[eid] = 0;
  }

  console.log(`✅ Spawned ${world.entityCount} units total`);
  console.log(`   - Team Blue: ${team0Units} units`);
  console.log(`   - Team Red: ${team1Units} units`);
  console.log(`   - Neutral: ${neutralUnits} units`);

  // Setup AI behavior (simple aggression after 5 seconds)
  setTimeout(() => {
    console.log('⚔️ Units engaging in combat!');

    // Make units move toward center
    const allUnits = [];
    for (let i = 0; i < world.entityCount; i++) {
      if (Health.current[i] > 0) {
        allUnits.push(i);
      }
    }

    // Set targets for units to move toward center
    allUnits.forEach(eid => {
      if (Team.id[eid] === 0) {
        // Blue team moves right
        Target.x[eid] = 960 + (Math.random() - 0.5) * 200;
        Target.y[eid] = 540 + (Math.random() - 0.5) * 200;
        Target.reached[eid] = 0;

        // Set velocity toward target
        const dx = Target.x[eid] - Position.x[eid];
        const dy = Target.y[eid] - Position.y[eid];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          Velocity.x[eid] = (dx / dist) * 100; // 100 pixels/second
          Velocity.y[eid] = (dy / dist) * 100;
        }
      } else if (Team.id[eid] === 1) {
        // Red team moves left
        Target.x[eid] = 960 + (Math.random() - 0.5) * 200;
        Target.y[eid] = 540 + (Math.random() - 0.5) * 200;
        Target.reached[eid] = 0;

        const dx = Target.x[eid] - Position.x[eid];
        const dy = Target.y[eid] - Position.y[eid];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          Velocity.x[eid] = (dx / dist) * 100;
          Velocity.y[eid] = (dy / dist) * 100;
        }
      }
    });
  }, 5000);

  // Trigger ability usage after 8 seconds
  setTimeout(() => {
    console.log('✨ Units using abilities!');

    // Activate some abilities for testing
    const allUnits = [];
    for (let i = 0; i < world.entityCount; i++) {
      if (Health.current[i] > 0) {
        allUnits.push(i);
      }
    }

    allUnits.forEach(eid => {
      // Random ability usage
      const rand = Math.random();
      if (rand < 0.3 && Dash.maxCooldown[eid] > 0) {
        // Trigger dash
        Dash.cooldown[eid] = Dash.maxCooldown[eid];
        console.log(`Unit ${eid} dashed!`);
      } else if (rand < 0.6 && Shield.maxCooldown[eid] > 0) {
        // Activate shield
        Shield.active[eid] = 1;
        Shield.cooldown[eid] = Shield.maxCooldown[eid];
        console.log(`Unit ${eid} shielded!`);
      } else if (rand < 0.9 && RangedAttack.maxCooldown[eid] > 0) {
        // Fire ranged attack
        RangedAttack.cooldown[eid] = RangedAttack.maxCooldown[eid];
        console.log(`Unit ${eid} fired projectile!`);
      }
    });
  }, 8000);

  // Performance test - spawn more units after 15 seconds
  setTimeout(() => {
    console.log('🔥 Spawning additional units for performance test!');

    for (let i = 0; i < 20; i++) {
      const eid = addEntity(world);
      world.entityCount++;

      Position.x[eid] = 960 + (Math.random() - 0.5) * 800;
      Position.y[eid] = 540 + (Math.random() - 0.5) * 400;

      Velocity.x[eid] = (Math.random() - 0.5) * 200;
      Velocity.y[eid] = (Math.random() - 0.5) * 200;

      Health.current[eid] = 100;
      Health.max[eid] = 100;

      Team.id[eid] = Math.floor(Math.random() * 2);

      Damage.amount[eid] = 30;
      Damage.range[eid] = 100;
      Damage.attackSpeed[eid] = 1.2;
      Damage.cooldown[eid] = 0;

      Sprite.textureId[eid] = Team.id[eid];
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = Math.random() * Math.PI * 2;
    }

    console.log(`Total entities: ${world.entityCount}`);
  }, 15000);

  console.log('✅ Enhanced test scene initialized');
  console.log('⏱️ Combat will begin in 5 seconds...');
  console.log('✨ Abilities will trigger in 8 seconds...');
  console.log('🔥 Performance test in 15 seconds...');
}