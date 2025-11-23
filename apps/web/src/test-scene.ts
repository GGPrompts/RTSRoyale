// Test scene setup - spawn units for prototyping
import { Application, Graphics } from 'pixi.js';
import { addEntity } from 'bitecs';
import { Position, Velocity, Health, Team, Sprite } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';

export function initTestScene(world: GameWorld, app: Application) {
  console.log('🎬 Initializing test scene...');

  // Create visual representations
  const unitSprites = new Map<number, Graphics>();

  // Spawn test units for Team 0 (Blue)
  for (let i = 0; i < 10; i++) {
    const eid = addEntity(world);

    Position.x[eid] = 200 + i * 50;
    Position.y[eid] = 300;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    Health.current[eid] = 100;
    Health.max[eid] = 100;

    Team.id[eid] = 0; // Team 0 (Blue)

    Sprite.textureId[eid] = 0;
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = 0;

    // Create visual (using Graphics for now, replace with actual sprites later)
    const visual = createUnitGraphic(0);
    visual.x = Position.x[eid];
    visual.y = Position.y[eid];
    app.stage.addChild(visual);
    unitSprites.set(eid, visual);
  }

  // Spawn test units for Team 1 (Red)
  for (let i = 0; i < 10; i++) {
    const eid = addEntity(world);

    Position.x[eid] = 1720 - i * 50;
    Position.y[eid] = 780;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    Health.current[eid] = 100;
    Health.max[eid] = 100;

    Team.id[eid] = 1; // Team 1 (Red)

    Sprite.textureId[eid] = 1;
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = 0;

    // Create visual
    const visual = createUnitGraphic(1);
    visual.x = Position.x[eid];
    visual.y = Position.y[eid];
    app.stage.addChild(visual);
    unitSprites.set(eid, visual);
  }

  // Update entity count
  document.getElementById('entity-count')!.textContent = unitSprites.size.toString();

  // Simple render update (hook into game loop later)
  app.ticker.add(() => {
    // Update visuals based on ECS positions
    unitSprites.forEach((visual, eid) => {
      visual.x = Position.x[eid];
      visual.y = Position.y[eid];
    });
  });

  console.log(`✅ Spawned ${unitSprites.size} units`);
}

function createUnitGraphic(teamId: number): Graphics {
  const color = teamId === 0 ? 0x4444ff : 0xff4444;

  const graphic = new Graphics();

  // Draw circle for unit
  graphic.circle(0, 0, 20);
  graphic.fill({ color, alpha: 0.8 });

  // Draw border
  graphic.circle(0, 0, 20);
  graphic.stroke({ color: 0xffffff, width: 2 });

  return graphic;
}
