// Test scene setup - spawn units for prototyping with viewport support
import { Application, Graphics, Container } from 'pixi.js';
import { addEntity } from 'bitecs';
import { Position, Velocity, Health, Team, Sprite, Damage, Target } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';

export function initTestScene(world: GameWorld, app: Application, viewport?: Container) {
  console.log('🎬 Initializing test scene...');

  // Use viewport if provided, otherwise use app.stage
  const parent = viewport || app.stage;

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

    // Add damage component for combat
    Damage.amount[eid] = 10;
    Damage.range[eid] = 150; // Attack range
    Damage.attackSpeed[eid] = 1.0;
    Damage.cooldown[eid] = 0;

    // Initialize Target component
    Target.x[eid] = Position.x[eid];
    Target.y[eid] = Position.y[eid];
    Target.reached[eid] = 1; // Start as reached

    Sprite.textureId[eid] = 0;
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = 0;

    // Create visual (using Graphics for now, replace with actual sprites later)
    const visual = createUnitGraphic(0);
    visual.x = Position.x[eid];
    visual.y = Position.y[eid];
    parent.addChild(visual);
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

    // Add damage component for combat
    Damage.amount[eid] = 10;
    Damage.range[eid] = 150; // Attack range
    Damage.attackSpeed[eid] = 1.0;
    Damage.cooldown[eid] = 0;

    // Initialize Target component
    Target.x[eid] = Position.x[eid];
    Target.y[eid] = Position.y[eid];
    Target.reached[eid] = 1; // Start as reached

    Sprite.textureId[eid] = 1;
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = 0;

    // Create visual
    const visual = createUnitGraphic(1);
    visual.x = Position.x[eid];
    visual.y = Position.y[eid];
    parent.addChild(visual);
    unitSprites.set(eid, visual);
  }

  // Spawn additional units for better testing
  // Create a larger formation for Team 0
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const eid = addEntity(world);

      Position.x[eid] = 400 + col * 40;
      Position.y[eid] = 400 + row * 40;

      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      Health.current[eid] = 100;
      Health.max[eid] = 100;

      Team.id[eid] = 0; // Team 0 (Blue)

      Damage.amount[eid] = 10;
      Damage.range[eid] = 150;
      Damage.attackSpeed[eid] = 1.0;
      Damage.cooldown[eid] = 0;

      Target.x[eid] = Position.x[eid];
      Target.y[eid] = Position.y[eid];
      Target.reached[eid] = 1;

      Sprite.textureId[eid] = 0;
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = 0;

      const visual = createUnitGraphic(0);
      visual.x = Position.x[eid];
      visual.y = Position.y[eid];
      parent.addChild(visual);
      unitSprites.set(eid, visual);
    }
  }

  // Create a larger formation for Team 1
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const eid = addEntity(world);

      Position.x[eid] = 1520 - col * 40;
      Position.y[eid] = 680 - row * 40;

      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      Health.current[eid] = 100;
      Health.max[eid] = 100;

      Team.id[eid] = 1; // Team 1 (Red)

      Damage.amount[eid] = 10;
      Damage.range[eid] = 150;
      Damage.attackSpeed[eid] = 1.0;
      Damage.cooldown[eid] = 0;

      Target.x[eid] = Position.x[eid];
      Target.y[eid] = Position.y[eid];
      Target.reached[eid] = 1;

      Sprite.textureId[eid] = 1;
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = 0;

      const visual = createUnitGraphic(1);
      visual.x = Position.x[eid];
      visual.y = Position.y[eid];
      parent.addChild(visual);
      unitSprites.set(eid, visual);
    }
  }

  // Update entity count
  document.getElementById('entity-count')!.textContent = unitSprites.size.toString();

  // Simple render update (hook into game loop later)
  app.ticker.add(() => {
    // Update visuals based on ECS positions
    unitSprites.forEach((visual, eid) => {
      visual.x = Position.x[eid];
      visual.y = Position.y[eid];

      // Update health visualization by changing alpha
      if (Health.current[eid] <= 0) {
        visual.alpha = 0.3;
      }
    });
  });

  console.log(`✅ Spawned ${unitSprites.size} units (50 total for testing)`);
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

  // Add team indicator
  graphic.circle(0, 0, 5);
  graphic.fill({ color: 0xffffff, alpha: 0.9 });

  return graphic;
}