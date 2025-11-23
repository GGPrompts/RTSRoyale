// Test scene setup - spawn units for prototyping with combat
import { Application, Graphics, Text } from 'pixi.js';
import { addEntity, defineQuery, addComponent } from 'bitecs';
import {
  Position,
  Velocity,
  Health,
  Team,
  Sprite,
  Damage,
  CombatTarget,
  Selectable,
  Selected,
  AbilitySlot1,
  AbilitySlot2,
  AbilitySlot3,
  Rotation,
  ShieldActive,
  DashVelocity,
  Projectile
} from '@rts-arena/core';
import { GameWorld, AbilityType } from '@rts-arena/core';

// Track all visual elements per entity
interface UnitVisuals {
  sprite: Graphics;
  healthBar: Graphics;
  healthBarBg: Graphics;
  damageTexts: Text[];
}

const unitVisuals = new Map<number, UnitVisuals>();
const aliveUnitsQuery = defineQuery([Position, Health]);

export function initTestScene(world: GameWorld, app: Application) {
  console.log('🎬 Initializing test scene with combat...');

  // Spawn test units for Team 0 (Blue) - place them closer to center for combat
  for (let i = 0; i < 10; i++) {
    const eid = addEntity(world);

    // Position units in a formation closer to center
    Position.x[eid] = 700 + (i % 5) * 60;
    Position.y[eid] = 400 + Math.floor(i / 5) * 60;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    Health.current[eid] = 100;
    Health.max[eid] = 100;

    Team.id[eid] = 0; // Team 0 (Blue)

    // Make unit selectable by the player (team 0)
    addComponent(world, Selectable, eid);
    Selectable.teamId[eid] = 0;

    // Select first unit by default
    if (i === 0) {
      addComponent(world, Selected, eid);
      Selected.value[eid] = 1;
    }

    // Add combat stats
    Damage.amount[eid] = 15;
    Damage.range[eid] = 80; // Attack range
    Damage.attackSpeed[eid] = 1.5; // Attacks per second
    Damage.cooldown[eid] = 0;

    CombatTarget.entity[eid] = 0; // No target initially

    // Add abilities
    addComponent(world, AbilitySlot1, eid);
    AbilitySlot1.abilityType[eid] = AbilityType.DASH;
    AbilitySlot1.cooldown[eid] = 0;

    addComponent(world, AbilitySlot2, eid);
    AbilitySlot2.abilityType[eid] = AbilityType.SHIELD;
    AbilitySlot2.cooldown[eid] = 0;

    addComponent(world, AbilitySlot3, eid);
    AbilitySlot3.abilityType[eid] = AbilityType.RANGED_ATTACK;
    AbilitySlot3.cooldown[eid] = 0;

    // Add rotation component for dash direction
    addComponent(world, Rotation, eid);
    Rotation.angle[eid] = 0;

    // Initialize dash velocity component
    addComponent(world, DashVelocity, eid);
    DashVelocity.x[eid] = 0;
    DashVelocity.y[eid] = 0;
    DashVelocity.duration[eid] = 0;

    // Initialize shield component
    addComponent(world, ShieldActive, eid);
    ShieldActive.damageReduction[eid] = 0;
    ShieldActive.remainingDuration[eid] = 0;

    Sprite.textureId[eid] = 0;
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = 0;

    // Create visual elements
    createUnitVisuals(eid, 0, app);
  }

  // Spawn test units for Team 1 (Red) - place them closer to center for combat
  for (let i = 0; i < 10; i++) {
    const eid = addEntity(world);

    // Position units in a formation closer to center
    Position.x[eid] = 1000 + (i % 5) * 60;
    Position.y[eid] = 400 + Math.floor(i / 5) * 60;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    Health.current[eid] = 100;
    Health.max[eid] = 100;

    Team.id[eid] = 1; // Team 1 (Red)

    // Make unit selectable (but only by team 1, not the player)
    addComponent(world, Selectable, eid);
    Selectable.teamId[eid] = 1;

    // Add combat stats
    Damage.amount[eid] = 15;
    Damage.range[eid] = 80; // Attack range
    Damage.attackSpeed[eid] = 1.5; // Attacks per second
    Damage.cooldown[eid] = 0;

    CombatTarget.entity[eid] = 0; // No target initially

    // Add abilities (for testing - red team won't use them unless controlled)
    addComponent(world, AbilitySlot1, eid);
    AbilitySlot1.abilityType[eid] = AbilityType.DASH;
    AbilitySlot1.cooldown[eid] = 0;

    addComponent(world, AbilitySlot2, eid);
    AbilitySlot2.abilityType[eid] = AbilityType.SHIELD;
    AbilitySlot2.cooldown[eid] = 0;

    addComponent(world, AbilitySlot3, eid);
    AbilitySlot3.abilityType[eid] = AbilityType.RANGED_ATTACK;
    AbilitySlot3.cooldown[eid] = 0;

    // Add rotation component for dash direction
    addComponent(world, Rotation, eid);
    Rotation.angle[eid] = Math.PI; // Facing left

    // Initialize dash velocity component
    addComponent(world, DashVelocity, eid);
    DashVelocity.x[eid] = 0;
    DashVelocity.y[eid] = 0;
    DashVelocity.duration[eid] = 0;

    // Initialize shield component
    addComponent(world, ShieldActive, eid);
    ShieldActive.damageReduction[eid] = 0;
    ShieldActive.remainingDuration[eid] = 0;

    Sprite.textureId[eid] = 1;
    Sprite.scaleX[eid] = 1.0;
    Sprite.scaleY[eid] = 1.0;
    Sprite.rotation[eid] = 0;

    // Create visual elements
    createUnitVisuals(eid, 1, app);
  }

  // Update entity count
  document.getElementById('entity-count')!.textContent = unitVisuals.size.toString();

  // Visual update system - runs at 60 FPS
  let lastDamageCheck = new Map<number, number>();

  app.ticker.add(() => {
    const units = aliveUnitsQuery(world);

    // Update all unit visuals
    for (let i = 0; i < units.length; i++) {
      const eid = units[i];
      const visuals = unitVisuals.get(eid);

      if (!visuals) continue;

      // Update position
      visuals.sprite.x = Position.x[eid];
      visuals.sprite.y = Position.y[eid];
      visuals.healthBar.x = Position.x[eid] - 25;
      visuals.healthBar.y = Position.y[eid] - 40;
      visuals.healthBarBg.x = Position.x[eid] - 25;
      visuals.healthBarBg.y = Position.y[eid] - 40;

      // Update health bar
      const healthPercent = Math.max(0, Health.current[eid] / Health.max[eid]);
      visuals.healthBar.clear();
      if (healthPercent > 0) {
        const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        visuals.healthBar.rect(0, 0, 50 * healthPercent, 6);
        visuals.healthBar.fill({ color });
      }

      // Check for damage taken (create floating damage numbers)
      const lastHealth = lastDamageCheck.get(eid) || Health.max[eid];
      const currentHealth = Health.current[eid];

      if (currentHealth < lastHealth && currentHealth > 0) {
        const damage = Math.floor(lastHealth - currentHealth);
        createDamageNumber(eid, damage, app);
      }

      lastDamageCheck.set(eid, currentHealth);

      // Update damage number animations
      visuals.damageTexts = visuals.damageTexts.filter(text => {
        text.y -= 1; // Float upward
        text.alpha -= 0.02; // Fade out

        if (text.alpha <= 0) {
          app.stage.removeChild(text);
          return false;
        }
        return true;
      });

      // Handle unit death animation
      if (Health.current[eid] <= 0) {
        // Fade out effect
        visuals.sprite.alpha -= 0.05;
        visuals.healthBar.alpha = visuals.sprite.alpha;
        visuals.healthBarBg.alpha = visuals.sprite.alpha;

        // Remove visuals when fully faded
        if (visuals.sprite.alpha <= 0) {
          app.stage.removeChild(visuals.sprite);
          app.stage.removeChild(visuals.healthBar);
          app.stage.removeChild(visuals.healthBarBg);
          visuals.damageTexts.forEach(text => app.stage.removeChild(text));
          unitVisuals.delete(eid);

          // Update entity count
          document.getElementById('entity-count')!.textContent = unitVisuals.size.toString();
        }
      }

      // Visual indicator for units in combat (optional glow or attack animation)
      if (CombatTarget.entity[eid] > 0) {
        // Add a subtle pulsing effect when attacking
        const pulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
        visuals.sprite.scale.set(pulse);
      } else {
        visuals.sprite.scale.set(1.0);
      }
    }
  });

  console.log(`✅ Spawned ${unitVisuals.size} combat-ready units`);
}

function createUnitVisuals(eid: number, teamId: number, app: Application) {
  const color = teamId === 0 ? 0x4444ff : 0xff4444;

  // Create unit sprite
  const sprite = new Graphics();
  sprite.circle(0, 0, 20);
  sprite.fill({ color, alpha: 0.8 });
  sprite.circle(0, 0, 20);
  sprite.stroke({ color: 0xffffff, width: 2 });

  // Set initial position
  sprite.x = Position.x[eid];
  sprite.y = Position.y[eid];

  // Create health bar background
  const healthBarBg = new Graphics();
  healthBarBg.rect(0, 0, 50, 6);
  healthBarBg.fill({ color: 0x333333 });
  healthBarBg.x = Position.x[eid] - 25;
  healthBarBg.y = Position.y[eid] - 40;

  // Create health bar
  const healthBar = new Graphics();
  healthBar.rect(0, 0, 50, 6);
  healthBar.fill({ color: 0x00ff00 });
  healthBar.x = Position.x[eid] - 25;
  healthBar.y = Position.y[eid] - 40;

  // Add to stage in correct order
  app.stage.addChild(sprite);
  app.stage.addChild(healthBarBg);
  app.stage.addChild(healthBar);

  // Store visuals
  unitVisuals.set(eid, {
    sprite,
    healthBar,
    healthBarBg,
    damageTexts: []
  });
}

function createDamageNumber(eid: number, damage: number, app: Application) {
  const visuals = unitVisuals.get(eid);
  if (!visuals) return;

  // Create damage text
  const text = new Text({
    text: `-${damage}`,
    style: {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xff4444,
      stroke: { color: 0x000000, width: 2 }
    }
  });

  // Position above unit with some random offset
  text.x = Position.x[eid] + (Math.random() - 0.5) * 20;
  text.y = Position.y[eid] - 50;
  text.anchor.set(0.5);

  app.stage.addChild(text);
  visuals.damageTexts.push(text);
}