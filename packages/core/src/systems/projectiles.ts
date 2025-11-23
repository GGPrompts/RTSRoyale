// Projectile System - Handles projectile movement and collision
import { defineQuery, removeEntity, addEntity, addComponent } from 'bitecs';
import {
  Position,
  Velocity,
  Health,
  Team,
  Projectile,
  VisualEffect,
  Dead,
  AbilityState,
} from '../components';
import { GameWorld } from '../world';

// Define queries
const projectileQuery = defineQuery([Position, Velocity, Projectile]);
const targetQuery = defineQuery([Position, Health, Team]);

// Constants
const COLLISION_RADIUS = 1.0; // Unit collision radius
const EXPLOSION_DURATION = 0.3;

export function projectileSystem(world: GameWorld): void {
  const projectiles = projectileQuery(world);
  const deltaTime = world.deltaTime;

  for (let i = 0; i < projectiles.length; i++) {
    const projectileEid = projectiles[i];

    // Update lifetime
    Projectile.lifetime[projectileEid] -= deltaTime;

    // Remove if expired
    if (Projectile.lifetime[projectileEid] <= 0) {
      removeProjectile(world, projectileEid);
      continue;
    }

    // Move projectile (movement already handled by movement system via Velocity)
    // Just need to check for collisions

    const projX = Position.x[projectileEid];
    const projY = Position.y[projectileEid];
    const projTeam = Projectile.ownerTeam[projectileEid];
    const projDamage = Projectile.damage[projectileEid];

    // Check if projectile reached its target position
    const targetX = Projectile.targetX[projectileEid];
    const targetY = Projectile.targetY[projectileEid];
    const distToTarget = Math.sqrt(
      (projX - targetX) * (projX - targetX) +
      (projY - targetY) * (projY - targetY)
    );

    if (distToTarget < 0.5) {
      // Reached target position, explode
      createExplosion(world, projX, projY);
      removeProjectile(world, projectileEid);
      continue;
    }

    // Check collision with enemy units
    const targets = targetQuery(world);
    let hitTarget = false;

    for (let j = 0; j < targets.length; j++) {
      const targetEid = targets[j];

      // Skip if same team
      if (Team.id[targetEid] === projTeam) continue;

      // Skip if already dead
      if (Dead[targetEid] !== undefined) continue;

      const targetX = Position.x[targetEid];
      const targetY = Position.y[targetEid];

      // Calculate distance to target
      const distance = Math.sqrt(
        (projX - targetX) * (projX - targetX) +
        (projY - targetY) * (projY - targetY)
      );

      // Check collision
      if (distance < COLLISION_RADIUS) {
        // Apply damage (considering shield reduction if active)
        let damage = projDamage;

        // Check if target has shield active
        if (AbilityState.damageReduction && AbilityState.damageReduction[targetEid] > 0) {
          damage *= (1 - AbilityState.damageReduction[targetEid]);
          console.log(`Damage reduced by shield: ${projDamage} -> ${damage}`);
        }

        Health.current[targetEid] = Math.max(0, Health.current[targetEid] - damage);

        // Check if killed
        if (Health.current[targetEid] <= 0) {
          addComponent(world, targetEid, Dead);
          console.log(`Unit ${targetEid} killed by projectile`);
        } else {
          console.log(`Unit ${targetEid} hit for ${damage} damage (${Health.current[targetEid]} HP remaining)`);
        }

        // Create explosion effect
        createExplosion(world, projX, projY);

        // Remove projectile
        removeProjectile(world, projectileEid);
        hitTarget = true;
        break;
      }
    }

    if (hitTarget) continue;

    // Check if projectile is out of bounds (arena limits)
    if (projX < 0 || projX > 1920 || projY < 0 || projY > 1080) {
      removeProjectile(world, projectileEid);
    }
  }
}

// Helper function to remove projectile and clean up
function removeProjectile(world: GameWorld, projectileEid: number): void {
  removeEntity(world, projectileEid);
}

// Create explosion visual effect
function createExplosion(world: GameWorld, x: number, y: number): void {
  const effectEid = addEntity(world);
  addComponent(world, effectEid, Position);
  addComponent(world, effectEid, VisualEffect);

  Position.x[effectEid] = x;
  Position.y[effectEid] = y;
  VisualEffect.type[effectEid] = 3; // Explosion
  VisualEffect.duration[effectEid] = EXPLOSION_DURATION;
  VisualEffect.maxDuration[effectEid] = EXPLOSION_DURATION;
  VisualEffect.alpha[effectEid] = 1.0;
}