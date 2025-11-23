// Abilities System
import { defineQuery, addEntity, removeEntity, hasComponent } from 'bitecs';
import {
  Position,
  Velocity,
  Health,
  Team,
  Rotation,
  AbilitySlot1,
  AbilitySlot2,
  AbilitySlot3,
  DashVelocity,
  ShieldActive,
  Projectile,
  Selected,
} from '../components';
import { GameWorld } from '../world';

// Queries
const dashQuery = defineQuery([Position, DashVelocity]);
const shieldQuery = defineQuery([ShieldActive]);
const projectileQuery = defineQuery([Position, Velocity, Projectile]);
const selectedQuery = defineQuery([Selected, Position, AbilitySlot1, AbilitySlot2, AbilitySlot3]);
const unitsQuery = defineQuery([Position, Health, Team]);

// Ability Types
export enum AbilityType {
  NONE = 0,
  DASH = 1,
  SHIELD = 2,
  RANGED_ATTACK = 3,
}

// Ability constants
const DASH_DISTANCE = 200;
const DASH_DAMAGE = 30;
const DASH_COOLDOWN = 10;
const DASH_DURATION = 0.2;

const SHIELD_DURATION = 3;
const SHIELD_COOLDOWN = 15;
const SHIELD_DAMAGE_REDUCTION = 0.5;

const RANGED_RANGE = 300;
const RANGED_DAMAGE = 40;
const RANGED_COOLDOWN = 12;
const RANGED_AOE_RADIUS = 100;
const PROJECTILE_SPEED = 500;

// Ability activation tracking
let qPressed = false;
let wPressed = false;
let ePressed = false;

// Set key states (will be called from input system)
export function setAbilityKeyState(key: string, pressed: boolean) {
  switch (key.toLowerCase()) {
    case 'q':
      qPressed = pressed;
      break;
    case 'w':
      wPressed = pressed;
      break;
    case 'e':
      ePressed = pressed;
      break;
  }
}

// Main abilities system
export function abilitiesSystem(world: GameWorld): void {
  const dt = world.deltaTime;

  // Update cooldowns for all selected units
  const selectedUnits = selectedQuery(world);
  for (let i = 0; i < selectedUnits.length; i++) {
    const eid = selectedUnits[i];

    // Update ability cooldowns
    if (AbilitySlot1.cooldown[eid] > 0) {
      AbilitySlot1.cooldown[eid] -= dt;
    }
    if (AbilitySlot2.cooldown[eid] > 0) {
      AbilitySlot2.cooldown[eid] -= dt;
    }
    if (AbilitySlot3.cooldown[eid] > 0) {
      AbilitySlot3.cooldown[eid] -= dt;
    }

    // Handle ability activation
    if (qPressed && AbilitySlot1.abilityType[eid] === AbilityType.DASH && AbilitySlot1.cooldown[eid] <= 0) {
      activateDash(world, eid);
      AbilitySlot1.cooldown[eid] = DASH_COOLDOWN;
    }

    if (wPressed && AbilitySlot2.abilityType[eid] === AbilityType.SHIELD && AbilitySlot2.cooldown[eid] <= 0) {
      activateShield(world, eid);
      AbilitySlot2.cooldown[eid] = SHIELD_COOLDOWN;
    }

    if (ePressed && AbilitySlot3.abilityType[eid] === AbilityType.RANGED_ATTACK && AbilitySlot3.cooldown[eid] <= 0) {
      activateRangedAttack(world, eid);
      AbilitySlot3.cooldown[eid] = RANGED_COOLDOWN;
    }
  }

  // Update dash movements
  updateDashes(world, dt);

  // Update shields
  updateShields(world, dt);

  // Update projectiles
  updateProjectiles(world, dt);
}

function activateDash(world: GameWorld, eid: number) {
  // Get unit's facing direction (use rotation if available, otherwise calculate from velocity)
  let angle = 0;
  if (hasComponent(world, Rotation, eid)) {
    angle = Rotation.angle[eid];
  } else if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
    angle = Math.atan2(Velocity.y[eid], Velocity.x[eid]);
  }

  // Calculate dash velocity
  const dashSpeed = DASH_DISTANCE / DASH_DURATION;
  DashVelocity.x[eid] = Math.cos(angle) * dashSpeed;
  DashVelocity.y[eid] = Math.sin(angle) * dashSpeed;
  DashVelocity.duration[eid] = DASH_DURATION;

  console.log(`Unit ${eid} activated DASH ability!`);
}

function activateShield(world: GameWorld, eid: number) {
  ShieldActive.damageReduction[eid] = SHIELD_DAMAGE_REDUCTION;
  ShieldActive.remainingDuration[eid] = SHIELD_DURATION;

  console.log(`Unit ${eid} activated SHIELD ability!`);
}

function activateRangedAttack(world: GameWorld, eid: number) {
  // Find nearest enemy
  const units = unitsQuery(world);
  const myTeam = Team.id[eid];
  const myX = Position.x[eid];
  const myY = Position.y[eid];

  let nearestEnemy = -1;
  let nearestDistance = RANGED_RANGE;

  for (let i = 0; i < units.length; i++) {
    const targetId = units[i];
    if (targetId === eid || Team.id[targetId] === myTeam) continue;

    const dx = Position.x[targetId] - myX;
    const dy = Position.y[targetId] - myY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestEnemy = targetId;
    }
  }

  if (nearestEnemy !== -1) {
    // Create projectile
    const projectile = addEntity(world);

    Position.x[projectile] = myX;
    Position.y[projectile] = myY;

    Projectile.owner[projectile] = eid;
    Projectile.targetX[projectile] = Position.x[nearestEnemy];
    Projectile.targetY[projectile] = Position.y[nearestEnemy];
    Projectile.damage[projectile] = RANGED_DAMAGE;
    Projectile.aoeRadius[projectile] = RANGED_AOE_RADIUS;
    Projectile.speed[projectile] = PROJECTILE_SPEED;

    // Calculate velocity towards target
    const dx = Projectile.targetX[projectile] - myX;
    const dy = Projectile.targetY[projectile] - myY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    Velocity.x[projectile] = (dx / distance) * PROJECTILE_SPEED;
    Velocity.y[projectile] = (dy / distance) * PROJECTILE_SPEED;

    console.log(`Unit ${eid} fired RANGED ATTACK at enemy ${nearestEnemy}!`);
  }
}

function updateDashes(world: GameWorld, dt: number) {
  const dashingUnits = dashQuery(world);

  for (let i = 0; i < dashingUnits.length; i++) {
    const eid = dashingUnits[i];

    if (DashVelocity.duration[eid] > 0) {
      // Apply dash movement
      Position.x[eid] += DashVelocity.x[eid] * dt;
      Position.y[eid] += DashVelocity.y[eid] * dt;

      // Check for collisions with enemies
      const units = unitsQuery(world);
      const myTeam = Team.id[eid];
      const myX = Position.x[eid];
      const myY = Position.y[eid];

      for (let j = 0; j < units.length; j++) {
        const targetId = units[j];
        if (targetId === eid || Team.id[targetId] === myTeam) continue;

        const dx = Position.x[targetId] - myX;
        const dy = Position.y[targetId] - myY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 40) { // Hit radius
          // Apply dash damage
          Health.current[targetId] -= DASH_DAMAGE;
          console.log(`Dash hit! Unit ${targetId} took ${DASH_DAMAGE} damage`);
        }
      }

      // Update duration
      DashVelocity.duration[eid] -= dt;

      if (DashVelocity.duration[eid] <= 0) {
        // End dash
        DashVelocity.x[eid] = 0;
        DashVelocity.y[eid] = 0;
        DashVelocity.duration[eid] = 0;
      }
    }
  }
}

function updateShields(world: GameWorld, dt: number) {
  const shieldedUnits = shieldQuery(world);

  for (let i = 0; i < shieldedUnits.length; i++) {
    const eid = shieldedUnits[i];

    if (ShieldActive.remainingDuration[eid] > 0) {
      ShieldActive.remainingDuration[eid] -= dt;

      if (ShieldActive.remainingDuration[eid] <= 0) {
        // Deactivate shield
        ShieldActive.damageReduction[eid] = 0;
        ShieldActive.remainingDuration[eid] = 0;
        console.log(`Unit ${eid} shield expired`);
      }
    }
  }
}

function updateProjectiles(world: GameWorld, dt: number) {
  const projectiles = projectileQuery(world);

  for (let i = 0; i < projectiles.length; i++) {
    const eid = projectiles[i];

    // Move projectile
    Position.x[eid] += Velocity.x[eid] * dt;
    Position.y[eid] += Velocity.y[eid] * dt;

    // Check if reached target
    const dx = Projectile.targetX[eid] - Position.x[eid];
    const dy = Projectile.targetY[eid] - Position.y[eid];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) { // Reached target
      // Apply AOE damage
      const units = unitsQuery(world);
      const ownerTeam = Team.id[Projectile.owner[eid]];
      const impactX = Position.x[eid];
      const impactY = Position.y[eid];
      const aoeRadius = Projectile.aoeRadius[eid];
      const damage = Projectile.damage[eid];

      for (let j = 0; j < units.length; j++) {
        const targetId = units[j];
        if (Team.id[targetId] === ownerTeam) continue;

        const tdx = Position.x[targetId] - impactX;
        const tdy = Position.y[targetId] - impactY;
        const targetDistance = Math.sqrt(tdx * tdx + tdy * tdy);

        if (targetDistance <= aoeRadius) {
          // Apply damage (with shield reduction if active)
          let finalDamage = damage;
          if (hasComponent(world, ShieldActive, targetId) && ShieldActive.remainingDuration[targetId] > 0) {
            finalDamage *= (1 - ShieldActive.damageReduction[targetId]);
          }

          Health.current[targetId] -= finalDamage;
          console.log(`Projectile hit! Unit ${targetId} took ${finalDamage} damage`);
        }
      }

      // Remove projectile
      removeEntity(world, eid);
    }
  }
}

// Export ability types for use in other systems (exported inline above)