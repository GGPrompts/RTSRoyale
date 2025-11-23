// Ability System - Handles Q/W/E abilities
import { defineQuery, addEntity, addComponent } from 'bitecs';
import {
  Position,
  Velocity,
  Health,
  Team,
  Selected,
  Dash,
  Shield,
  RangedAttack,
  AbilityState,
  Facing,
  Projectile,
  VisualEffect,
  Dead,
} from '../components';
import { GameWorld } from '../world';

// Define queries
const selectedQuery = defineQuery([Selected, Position, AbilityState]);
const dashQuery = defineQuery([Selected, Position, AbilityState, Dash, Facing]);
const shieldQuery = defineQuery([Selected, AbilityState, Shield]);
const rangedQuery = defineQuery([Selected, Position, AbilityState, RangedAttack, Facing, Team]);
const enemyQuery = defineQuery([Position, Health, Team]);

// Ability cooldowns (in seconds)
const DASH_COOLDOWN = 10;
const SHIELD_COOLDOWN = 15;
const RANGED_COOLDOWN = 8;

// Ability parameters
const DASH_DISTANCE = 5;
const DASH_DAMAGE = 30;
const SHIELD_DURATION = 3;
const SHIELD_REDUCTION = 0.5; // 50% damage reduction
const RANGED_DAMAGE = 40;
const RANGED_SPEED = 8;
const RANGED_RANGE = 10;

export interface AbilityInput {
  qPressed: boolean; // Dash
  wPressed: boolean; // Shield
  ePressed: boolean; // Ranged Attack
  mouseX: number;
  mouseY: number;
}

export function abilitySystem(world: GameWorld, input: AbilityInput): void {
  const currentTime = world.time;

  // Update shield durations for all units
  updateShields(world, currentTime);

  // Check if any ability keys were pressed
  if (input.qPressed) {
    executeDash(world, currentTime, input.mouseX, input.mouseY);
  }

  if (input.wPressed) {
    executeShield(world, currentTime);
  }

  if (input.ePressed) {
    executeRangedAttack(world, currentTime, input.mouseX, input.mouseY);
  }
}

// DASH ABILITY (Q) - Instant movement with damage
function executeDash(world: GameWorld, currentTime: number, targetX: number, targetY: number): void {
  const entities = dashQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Only process selected units
    if (Selected.value[eid] !== 1) continue;

    const abilityState = AbilityState.lastDashTime[eid];

    // Check cooldown
    if (currentTime - abilityState < DASH_COOLDOWN) {
      continue; // Still on cooldown
    }

    const posX = Position.x[eid];
    const posY = Position.y[eid];

    // Calculate dash direction
    const dx = targetX - posX;
    const dy = targetY - posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) continue; // Too close to dash

    // Normalize and apply dash distance
    const dashX = (dx / distance) * DASH_DISTANCE;
    const dashY = (dy / distance) * DASH_DISTANCE;

    // Store original position for damage checking
    const startX = posX;
    const startY = posY;

    // Move unit instantly
    Position.x[eid] = posX + dashX;
    Position.y[eid] = posY + dashY;

    // Update facing direction
    Facing.angle[eid] = Math.atan2(dy, dx);

    // Check for enemies in the dash path
    const unitTeam = Team.id[eid];
    const enemies = enemyQuery(world);

    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];

      // Skip if same team or dead
      if (Team.id[enemy] === unitTeam) continue;
      if (Dead[enemy] !== undefined) continue;

      const enemyX = Position.x[enemy];
      const enemyY = Position.y[enemy];

      // Check if enemy is in the dash path (simplified line-circle intersection)
      const lineLength = Math.sqrt(dashX * dashX + dashY * dashY);
      const t = Math.max(0, Math.min(1,
        ((enemyX - startX) * dashX + (enemyY - startY) * dashY) / (lineLength * lineLength)
      ));

      const closestX = startX + t * dashX;
      const closestY = startY + t * dashY;

      const distToEnemy = Math.sqrt(
        (enemyX - closestX) * (enemyX - closestX) +
        (enemyY - closestY) * (enemyY - closestY)
      );

      // If enemy is close enough to the dash path, deal damage
      if (distToEnemy < 1.5) { // Unit radius threshold
        Health.current[enemy] = Math.max(0, Health.current[enemy] - DASH_DAMAGE);

        // Check if killed
        if (Health.current[enemy] <= 0) {
          addComponent(world, enemy, Dead);
        }
      }
    }

    // Update cooldown
    AbilityState.lastDashTime[eid] = currentTime;

    // Create visual effect entity
    const effectEid = addEntity(world);
    addComponent(world, effectEid, Position);
    addComponent(world, effectEid, VisualEffect);

    Position.x[effectEid] = startX;
    Position.y[effectEid] = startY;
    VisualEffect.type[effectEid] = 0; // Dash trail
    VisualEffect.duration[effectEid] = 0.5;
    VisualEffect.maxDuration[effectEid] = 0.5;
    VisualEffect.alpha[effectEid] = 1.0;

    console.log(`Unit ${eid} dashed to (${Position.x[eid]}, ${Position.y[eid]})`);
  }
}

// SHIELD ABILITY (W) - Damage reduction buff
function executeShield(world: GameWorld, currentTime: number): void {
  const entities = shieldQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Only process selected units
    if (Selected.value[eid] !== 1) continue;

    const lastShieldTime = AbilityState.lastShieldTime[eid];

    // Check cooldown
    if (currentTime - lastShieldTime < SHIELD_COOLDOWN) {
      continue; // Still on cooldown
    }

    // Apply shield buff
    AbilityState.shieldEndTime[eid] = currentTime + SHIELD_DURATION;
    AbilityState.damageReduction[eid] = SHIELD_REDUCTION;
    AbilityState.lastShieldTime[eid] = currentTime;

    // Create visual effect entity
    const effectEid = addEntity(world);
    addComponent(world, effectEid, Position);
    addComponent(world, effectEid, VisualEffect);

    Position.x[effectEid] = Position.x[eid];
    Position.y[effectEid] = Position.y[eid];
    VisualEffect.type[effectEid] = 1; // Shield bubble
    VisualEffect.duration[effectEid] = SHIELD_DURATION;
    VisualEffect.maxDuration[effectEid] = SHIELD_DURATION;
    VisualEffect.alpha[effectEid] = 0.5;

    console.log(`Unit ${eid} activated shield for ${SHIELD_DURATION} seconds`);
  }
}

// RANGED ATTACK ABILITY (E) - Shoot projectile
function executeRangedAttack(world: GameWorld, currentTime: number, targetX: number, targetY: number): void {
  const entities = rangedQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Only process selected units
    if (Selected.value[eid] !== 1) continue;

    const lastRangedTime = AbilityState.lastRangedTime[eid];

    // Check cooldown
    if (currentTime - lastRangedTime < RANGED_COOLDOWN) {
      continue; // Still on cooldown
    }

    const posX = Position.x[eid];
    const posY = Position.y[eid];

    // Calculate direction to target
    const dx = targetX - posX;
    const dy = targetY - posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > RANGED_RANGE) {
      console.log(`Target out of range for unit ${eid}`);
      continue; // Target out of range
    }

    // Create projectile entity
    const projectileEid = addEntity(world);
    addComponent(world, projectileEid, Position);
    addComponent(world, projectileEid, Velocity);
    addComponent(world, projectileEid, Projectile);
    addComponent(world, projectileEid, VisualEffect);

    // Set projectile position (spawn slightly in front of unit)
    const spawnDistance = 1.0;
    Position.x[projectileEid] = posX + (dx / distance) * spawnDistance;
    Position.y[projectileEid] = posY + (dy / distance) * spawnDistance;

    // Set projectile velocity
    Velocity.x[projectileEid] = (dx / distance) * RANGED_SPEED;
    Velocity.y[projectileEid] = (dy / distance) * RANGED_SPEED;

    // Set projectile properties
    Projectile.damage[projectileEid] = RANGED_DAMAGE;
    Projectile.targetX[projectileEid] = targetX;
    Projectile.targetY[projectileEid] = targetY;
    Projectile.speed[projectileEid] = RANGED_SPEED;
    Projectile.ownerTeam[projectileEid] = Team.id[eid];
    Projectile.lifetime[projectileEid] = 2.0; // Max 2 seconds lifetime

    // Visual effect for projectile
    VisualEffect.type[projectileEid] = 2; // Projectile trail
    VisualEffect.duration[projectileEid] = 2.0;
    VisualEffect.maxDuration[projectileEid] = 2.0;
    VisualEffect.alpha[projectileEid] = 1.0;

    // Update cooldown and facing
    AbilityState.lastRangedTime[eid] = currentTime;
    Facing.angle[eid] = Math.atan2(dy, dx);

    console.log(`Unit ${eid} fired projectile towards (${targetX}, ${targetY})`);
  }
}

// Update shield buffs
function updateShields(world: GameWorld, currentTime: number): void {
  const query = defineQuery([AbilityState]);
  const entities = query(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Check if shield expired
    if (AbilityState.shieldEndTime[eid] > 0 && currentTime > AbilityState.shieldEndTime[eid]) {
      AbilityState.damageReduction[eid] = 0;
      AbilityState.shieldEndTime[eid] = 0;
      console.log(`Shield expired for unit ${eid}`);
    }
  }
}

// Helper function to get cooldown percentages for UI
export function getAbilityCooldowns(world: GameWorld, eid: number): {
  dash: number;
  shield: number;
  ranged: number
} {
  const currentTime = world.time;
  const state = AbilityState;

  // Calculate percentage of cooldown remaining (0 = ready, 1 = just used)
  const dashRemaining = Math.max(0, DASH_COOLDOWN - (currentTime - state.lastDashTime[eid]));
  const shieldRemaining = Math.max(0, SHIELD_COOLDOWN - (currentTime - state.lastShieldTime[eid]));
  const rangedRemaining = Math.max(0, RANGED_COOLDOWN - (currentTime - state.lastRangedTime[eid]));

  return {
    dash: dashRemaining / DASH_COOLDOWN,
    shield: shieldRemaining / SHIELD_COOLDOWN,
    ranged: rangedRemaining / RANGED_COOLDOWN,
  };
}