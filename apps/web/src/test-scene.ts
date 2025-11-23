// Test scene setup - spawn units for prototyping
import { Application, Graphics } from 'pixi.js';
import { addEntity } from 'bitecs';
import { Position, Velocity, Health, Team, Sprite, Damage, MoveTarget, Dead } from '@rts-arena/core';
import { hasComponent } from 'bitecs';
import { GameWorld } from '@rts-arena/core';
import { HealthBarRenderer } from './rendering/healthBars';
import { SelectionManager } from './input/selectionManager';
import { MouseInputHandler } from './input/mouseInput';
import { SelectionRenderer } from './rendering/selectionBox';
import { AbilityInputHandler } from './input/abilityInput';
import { AbilityEffectsRenderer } from './effects/abilityEffects';

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

    // Add damage component for combat
    Damage.amount[eid] = 25;
    Damage.range[eid] = 60.0; // Increased range for testing (3 units is too small for our 20px radius units)
    Damage.attackSpeed[eid] = 1.0; // 1 attack per second
    Damage.cooldown[eid] = 0;

    // Set move target toward center-right (for combat testing)
    MoveTarget.x[eid] = 960;
    MoveTarget.y[eid] = 540;
    MoveTarget.active[eid] = 1;

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

    // Add damage component for combat
    Damage.amount[eid] = 25;
    Damage.range[eid] = 60.0; // Increased range for testing (3 units is too small for our 20px radius units)
    Damage.attackSpeed[eid] = 1.0; // 1 attack per second
    Damage.cooldown[eid] = 0;

    // Set move target toward center-left (for combat testing)
    MoveTarget.x[eid] = 960;
    MoveTarget.y[eid] = 540;
    MoveTarget.active[eid] = 1;

    // Create visual
    const visual = createUnitGraphic(1);
    visual.x = Position.x[eid];
    visual.y = Position.y[eid];
    app.stage.addChild(visual);
    unitSprites.set(eid, visual);
  }

  // Update entity count
  document.getElementById('entity-count')!.textContent = unitSprites.size.toString();

  // Create health bar renderer
  const healthBarRenderer = new HealthBarRenderer();
  app.stage.addChild(healthBarRenderer.getContainer());

  // Create selection system
  const selectionManager = new SelectionManager(world);
  const mouseInputHandler = new MouseInputHandler(app, selectionManager);
  const selectionRenderer = new SelectionRenderer();
  app.stage.addChild(selectionRenderer.getContainer());

  // Set up move target visual feedback
  selectionManager.setMoveTargetCallback((x, y) => {
    selectionRenderer.showMoveTarget(x, y);
  });

  // Create ability system
  const abilityInputHandler = new AbilityInputHandler(world);
  const abilityEffectsRenderer = new AbilityEffectsRenderer();
  abilityEffectsRenderer.setWorld(world);
  app.stage.addChild(abilityEffectsRenderer.getContainer());

  // Store references for other systems to access
  (world as any).selectionManager = selectionManager;
  (world as any).abilityInputHandler = abilityInputHandler;
  (world as any).abilityEffectsRenderer = abilityEffectsRenderer;

  // Simple render update (hook into game loop later)
  app.ticker.add(() => {
    // Update visuals based on ECS positions
    unitSprites.forEach((visual, eid) => {
      // Remove visuals for dead entities
      if (hasComponent(world, Dead, eid)) {
        app.stage.removeChild(visual);
        visual.destroy();
        unitSprites.delete(eid);
        // Update entity count
        document.getElementById('entity-count')!.textContent = unitSprites.size.toString();
      } else {
        visual.x = Position.x[eid];
        visual.y = Position.y[eid];
      }
    });

    // Update health bars
    healthBarRenderer.update(world);

    // Update selection visuals
    selectionRenderer.updateDragBox(mouseInputHandler.getDragBox());
    selectionRenderer.updateSelectionHighlights(world);

    // Update ability effects
    abilityEffectsRenderer.update(world);

    // Sync ability input with selection
    abilityInputHandler.updateSelection(selectionManager.getSelectedEntities());
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
