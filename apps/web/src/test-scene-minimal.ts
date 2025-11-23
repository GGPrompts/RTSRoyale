// Minimal test scene - just 2 units for clear combat testing
import { Application, Graphics } from 'pixi.js';
import { addEntity } from 'bitecs';
import { Position, Velocity, Health, Team, Sprite, Damage } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';

export function initMinimalTestScene(world: GameWorld, app: Application) {
  console.log('🎬 Initializing minimal test scene (2 units)...');

  const unitSprites = new Map<number, Graphics>();

  // Spawn 1 unit for Team 0 (Blue)
  const blueUnit = addEntity(world);
  Position.x[blueUnit] = 500;
  Position.y[blueUnit] = 500;
  Velocity.x[blueUnit] = 0;
  Velocity.y[blueUnit] = 0;
  Health.current[blueUnit] = 100;
  Health.max[blueUnit] = 100;
  Team.id[blueUnit] = 0;
  Damage.amount[blueUnit] = 10;
  Damage.range[blueUnit] = 200;
  Damage.attackSpeed[blueUnit] = 1.0;
  Damage.cooldown[blueUnit] = 0;

  // Create visual for blue unit
  const blueVisual = new Graphics();
  blueVisual.circle(0, 0, 20);
  blueVisual.fill({ color: 0x4444ff, alpha: 0.8 });
  blueVisual.circle(0, 0, 20);
  blueVisual.stroke({ color: 0xffffff, width: 2 });
  blueVisual.x = Position.x[blueUnit];
  blueVisual.y = Position.y[blueUnit];
  app.stage.addChild(blueVisual);
  unitSprites.set(blueUnit, blueVisual);

  // Spawn 1 unit for Team 1 (Red)
  const redUnit = addEntity(world);
  Position.x[redUnit] = 600; // 100 pixels away - within range
  Position.y[redUnit] = 500;
  Velocity.x[redUnit] = 0;
  Velocity.y[redUnit] = 0;
  Health.current[redUnit] = 100;
  Health.max[redUnit] = 100;
  Team.id[redUnit] = 1;
  Damage.amount[redUnit] = 10;
  Damage.range[redUnit] = 200;
  Damage.attackSpeed[redUnit] = 1.0;
  Damage.cooldown[redUnit] = 0;

  // Create visual for red unit
  const redVisual = new Graphics();
  redVisual.circle(0, 0, 20);
  redVisual.fill({ color: 0xff4444, alpha: 0.8 });
  redVisual.circle(0, 0, 20);
  redVisual.stroke({ color: 0xffffff, width: 2 });
  redVisual.x = Position.x[redUnit];
  redVisual.y = Position.y[redUnit];
  app.stage.addChild(redVisual);
  unitSprites.set(redUnit, redVisual);

  console.log(`✅ Spawned 2 units for combat testing`);
  console.log(`Blue unit at (${Position.x[blueUnit]}, ${Position.y[blueUnit]})`);
  console.log(`Red unit at (${Position.x[redUnit]}, ${Position.y[redUnit]})`);
  console.log(`Distance: 100 pixels, Attack range: 200 pixels`);
  console.log(`They should immediately start attacking each other!`);

  // Simple render update
  app.ticker.add(() => {
    unitSprites.forEach((visual, eid) => {
      // Only update if entity still has health
      if (Health.current[eid] > 0) {
        visual.x = Position.x[eid];
        visual.y = Position.y[eid];
        visual.alpha = 1;
      } else {
        // Hide dead units
        visual.alpha = 0;
      }
    });
  });
}