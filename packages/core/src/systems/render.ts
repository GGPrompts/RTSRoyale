// Render system for RTS Arena - Manages all visual updates
import { defineQuery, hasComponent, removeEntity } from 'bitecs';
import { GameWorld } from '../world';
import {
  Position,
  Velocity,
  Health,
  Team,
  Sprite,
  Selected,
  Dead,
  Shield,
  Dash,
  RangedAttack,
  Damage,
} from '../components';

export interface RenderContext {
  spriteSystem?: any;
  particleSystem?: any;
  abilityEffects?: any;
  uiSystem?: any;
  screenEffects?: any;
  camera?: any;
  deltaTime: number;
}

// Track combat events for visual feedback
const combatEvents: Map<number, { type: string; time: number; data?: any }> = new Map();

export function renderSystem(world: GameWorld, context: RenderContext) {
  if (!context.spriteSystem) return;

  const deltaTime = context.deltaTime || 0.016;

  // Update sprites for all entities
  context.spriteSystem.update(world, deltaTime);

  // Update particles
  if (context.particleSystem) {
    context.particleSystem.update(deltaTime);
  }

  // Update ability effects
  if (context.abilityEffects) {
    context.abilityEffects.update(deltaTime);

    // Update shield positions for moving entities
    const shieldQuery = defineQuery([Position, Shield]);
    const shieldEntities = shieldQuery(world);

    for (const eid of shieldEntities) {
      if (Shield.active[eid] > 0) {
        const x = Position.x[eid];
        const y = Position.y[eid];
        context.abilityEffects.updateShieldPosition(eid, x, y);
      }
    }
  }

  // Update UI elements
  if (context.uiSystem) {
    context.uiSystem.update(world, deltaTime);
  }

  // Update screen effects
  if (context.screenEffects) {
    context.screenEffects.update(deltaTime);
  }

  // Update camera
  if (context.camera) {
    // Get mouse position for edge scrolling
    const mouseX = window.mouseX || 0;
    const mouseY = window.mouseY || 0;
    context.camera.update(mouseX, mouseY, deltaTime);

    // Follow selected units
    const selectedQuery = defineQuery([Position, Selected]);
    const selectedEntities = selectedQuery(world);
    const selectedUnits: { x: number; y: number }[] = [];

    for (const eid of selectedEntities) {
      if (Selected.value[eid] > 0) {
        selectedUnits.push({
          x: Position.x[eid],
          y: Position.y[eid],
        });
      }
    }

    if (selectedUnits.length > 0 && context.screenEffects) {
      context.screenEffects.smoothFollow(selectedUnits, 0.1);
    }
  }

  // Process combat events for visual feedback
  processCombatEvents(world, context);

  // Check for phase transitions
  checkPhaseTransitions(world, context);

  // Clean up dead entities
  const deadQuery = defineQuery([Dead]);
  const deadEntities = deadQuery(world);

  for (const eid of deadEntities) {
    // Trigger death explosion
    if (context.particleSystem && context.spriteSystem) {
      const pos = context.spriteSystem.getSpritePosition(eid);
      if (pos) {
        const teamId = hasComponent(world, eid, Team) ? Team.id[eid] : 0;
        const teamColor = teamId === 0 ? 0x4488ff : 0xff4444;
        context.particleSystem.createDeathExplosion(pos.x, pos.y, teamColor);

        // Screen shake on death
        if (context.screenEffects) {
          context.screenEffects.triggerDeathExplosion();
        }
      }
    }
  }
}

// Process combat events and trigger visual feedback
function processCombatEvents(world: GameWorld, context: RenderContext) {
  const currentTime = Date.now() / 1000;

  // Query for entities that are attacking
  const attackQuery = defineQuery([Position, Damage, Team]);
  const entities = attackQuery(world);

  for (const attacker of entities) {
    // Check if attack cooldown just reset (indicating an attack happened)
    if (Damage.cooldown[attacker] === Damage.attackSpeed[attacker]) {
      // Find nearby enemies that might have been hit
      const attackerPos = { x: Position.x[attacker], y: Position.y[attacker] };
      const attackerTeam = Team.id[attacker];
      const range = Damage.range[attacker];

      for (const target of entities) {
        if (Team.id[target] === attackerTeam) continue;

        const targetPos = { x: Position.x[target], y: Position.y[target] };
        const distance = Math.sqrt(
          Math.pow(targetPos.x - attackerPos.x, 2) +
          Math.pow(targetPos.y - attackerPos.y, 2)
        );

        if (distance <= range) {
          // Hit occurred - trigger effects
          if (context.spriteSystem) {
            context.spriteSystem.applyHitFlash(target);
          }

          if (context.particleSystem) {
            context.particleSystem.createHitEffect(targetPos.x, targetPos.y);
          }

          if (context.screenEffects) {
            context.screenEffects.triggerHitImpact(2);
          }

          if (context.uiSystem) {
            const damage = Damage.amount[attacker];
            context.uiSystem.showDamageNumber(targetPos.x, targetPos.y, damage);
          }

          break; // Only one target per attack
        }
      }
    }
  }

  // Check for ability usage
  checkAbilityUsage(world, context);
}

// Check for ability usage and trigger effects
function checkAbilityUsage(world: GameWorld, context: RenderContext) {
  const dashQuery = defineQuery([Position, Dash, Team]);
  const dashEntities = dashQuery(world);

  for (const eid of dashEntities) {
    // Check if dash was just used (cooldown just set to max)
    if (Dash.cooldown[eid] === Dash.maxCooldown[eid]) {
      const pos = { x: Position.x[eid], y: Position.y[eid] };

      // Calculate dash end position (simplified)
      const velocity = hasComponent(world, eid, Velocity)
        ? { x: Velocity.x[eid], y: Velocity.y[eid] }
        : { x: 1, y: 0 };

      const length = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      const normalized = length > 0
        ? { x: velocity.x / length, y: velocity.y / length }
        : { x: 1, y: 0 };

      const dashDistance = Dash.distance[eid];
      const endPos = {
        x: pos.x + normalized.x * dashDistance * 20, // Convert to pixels
        y: pos.y + normalized.y * dashDistance * 20,
      };

      if (context.abilityEffects && context.spriteSystem) {
        const teamId = Team.id[eid];
        const unitTexture = context.spriteSystem.getUnitTexture?.(teamId);
        const teamColor = teamId === 0 ? 0x4488ff : 0xff4444;

        context.abilityEffects.createDashEffect(
          pos.x,
          pos.y,
          endPos.x,
          endPos.y,
          unitTexture,
          teamColor
        );
      }
    }
  }

  // Check for shield activation
  const shieldQuery = defineQuery([Position, Shield]);
  const shieldEntities = shieldQuery(world);

  for (const eid of shieldEntities) {
    if (Shield.active[eid] === 1 && Shield.cooldown[eid] === Shield.maxCooldown[eid]) {
      const pos = { x: Position.x[eid], y: Position.y[eid] };

      if (context.abilityEffects) {
        context.abilityEffects.createShieldEffect(pos.x, pos.y, eid);
      }
    }
  }

  // Check for ranged attacks
  const rangedQuery = defineQuery([Position, RangedAttack, Team]);
  const rangedEntities = rangedQuery(world);

  for (const eid of rangedEntities) {
    if (RangedAttack.cooldown[eid] === RangedAttack.maxCooldown[eid]) {
      const pos = { x: Position.x[eid], y: Position.y[eid] };

      // Find target (simplified - shoot at nearest enemy)
      let nearestEnemy = null;
      let minDistance = RangedAttack.range[eid] * 20; // Convert to pixels

      for (const target of rangedEntities) {
        if (Team.id[target] === Team.id[eid]) continue;

        const targetPos = { x: Position.x[target], y: Position.y[target] };
        const distance = Math.sqrt(
          Math.pow(targetPos.x - pos.x, 2) +
          Math.pow(targetPos.y - pos.y, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = targetPos;
        }
      }

      if (nearestEnemy && context.abilityEffects) {
        context.abilityEffects.createProjectile(
          pos.x,
          pos.y,
          nearestEnemy.x,
          nearestEnemy.y,
          500
        );
      }
    }
  }
}

// Check for game phase transitions and trigger effects
function checkPhaseTransitions(world: GameWorld, context: RenderContext) {
  const gameTime = world.time || 0;
  const lastPhase = world.lastPhase || 'normal';
  let currentPhase = 'normal';

  if (gameTime >= 150) {
    currentPhase = 'showdown';
  } else if (gameTime >= 145) {
    currentPhase = 'collapse';
  } else if (gameTime >= 120) {
    currentPhase = 'warning';
  }

  // Trigger effects on phase change
  if (currentPhase !== lastPhase && context.screenEffects) {
    switch (currentPhase) {
      case 'warning':
        context.screenEffects.triggerCollapseWarning();
        break;
      case 'collapse':
        context.screenEffects.setVignetteVisible(true, 0.3);
        context.screenEffects.flash(0xff8800, 0.5);
        break;
      case 'showdown':
        context.screenEffects.triggerFinalShowdown();
        break;
    }
  }

  world.lastPhase = currentPhase;
}

// Helper function to trigger specific visual effects
export function triggerVisualEffect(
  effectType: string,
  world: GameWorld,
  context: RenderContext,
  data: any = {}
) {
  switch (effectType) {
    case 'hit':
      if (context.spriteSystem && data.entityId) {
        context.spriteSystem.applyHitFlash(data.entityId);
      }
      if (context.particleSystem && data.position) {
        context.particleSystem.createHitEffect(data.position.x, data.position.y);
      }
      break;

    case 'death':
      if (context.particleSystem && data.position) {
        context.particleSystem.createDeathExplosion(
          data.position.x,
          data.position.y,
          data.teamColor || 0xffffff
        );
      }
      if (context.screenEffects) {
        context.screenEffects.triggerDeathExplosion();
      }
      break;

    case 'dash':
      if (context.abilityEffects && data.start && data.end) {
        context.abilityEffects.createDashEffect(
          data.start.x,
          data.start.y,
          data.end.x,
          data.end.y,
          data.texture,
          data.teamColor || 0xffffff
        );
      }
      break;

    case 'projectile':
      if (context.abilityEffects && data.start && data.end) {
        context.abilityEffects.createProjectile(
          data.start.x,
          data.start.y,
          data.end.x,
          data.end.y,
          data.speed || 500
        );
      }
      break;
  }
}