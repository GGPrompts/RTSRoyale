import { defineQuery, addComponent, hasComponent } from 'bitecs';
import { Position, Velocity, Dash, Shield, RangedAttack, Health, Team } from '../components';

const dashQuery = defineQuery([Position, Velocity, Dash]);
const shieldQuery = defineQuery([Shield]);
const rangedQuery = defineQuery([Position, RangedAttack, Team]);

export function dashSystem(world: any) {
  const entities = dashQuery(world);
  const deltaTime = world.deltaTime || 0.016; // Default to ~60fps if not set

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Update cooldown
    if (Dash.cooldown[eid] > 0) {
      Dash.cooldown[eid] -= deltaTime;
    }

    // Check if dash is active
    if (Dash.active[eid] > 0) {
      Dash.active[eid] -= deltaTime;

      // Apply dash velocity (move 5 units forward over 0.5 seconds = 10 units/second)
      const angle = Math.atan2(Velocity.y[eid], Velocity.x[eid]);
      const dashSpeed = 200; // Fast movement
      Velocity.x[eid] = Math.cos(angle) * dashSpeed;
      Velocity.y[eid] = Math.sin(angle) * dashSpeed;

      // Check for collisions with enemies (deal damage)
      const allEntities = defineQuery([Position, Health, Team])(world);
      for (let j = 0; j < allEntities.length; j++) {
        const target = allEntities[j];
        if (target === eid) continue;
        if (Team.id[target] === Team.id[eid]) continue;

        const dx = Position.x[target] - Position.x[eid];
        const dy = Position.y[target] - Position.y[eid];
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20.0) { // Collision range (in pixels)
          if (!hasComponent(world, Health, target)) {
            addComponent(world, Health, target);
            Health.current[target] = 100;
            Health.max[target] = 100;
          }
          Health.current[target] -= 30; // Dash damage
        }
      }

      // Reset velocity when dash ends
      if (Dash.active[eid] <= 0) {
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
      }
    }
  }

  return world;
}

export function shieldSystem(world: any) {
  const entities = shieldQuery(world);
  const deltaTime = world.deltaTime || 0.016;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Update cooldown
    if (Shield.cooldown[eid] > 0) {
      Shield.cooldown[eid] -= deltaTime;
    }

    // Update active duration
    if (Shield.active[eid] > 0) {
      Shield.active[eid] -= deltaTime;
      // The actual damage reduction should be applied in the combat system
      // by checking if Shield.active[eid] > 0
    }
  }

  return world;
}

export function rangedAttackSystem(world: any) {
  const entities = rangedQuery(world);
  const deltaTime = world.deltaTime || 0.016;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Update cooldown
    if (RangedAttack.cooldown[eid] > 0) {
      RangedAttack.cooldown[eid] -= deltaTime;
    }

    // Process active projectiles
    if (RangedAttack.active[eid] > 0) {
      RangedAttack.active[eid] -= deltaTime;

      // Update projectile position
      RangedAttack.projectileX[eid] += RangedAttack.projectileVX[eid] * deltaTime;
      RangedAttack.projectileY[eid] += RangedAttack.projectileVY[eid] * deltaTime;

      // Check for hits
      const allEntities = defineQuery([Position, Health, Team])(world);
      for (let j = 0; j < allEntities.length; j++) {
        const target = allEntities[j];
        if (target === eid) continue;
        if (Team.id[target] === Team.id[eid]) continue;

        const dx = Position.x[target] - RangedAttack.projectileX[eid];
        const dy = Position.y[target] - RangedAttack.projectileY[eid];
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15.0) { // Hit range (in pixels)
          if (!hasComponent(world, Health, target)) {
            addComponent(world, Health, target);
            Health.current[target] = 100;
            Health.max[target] = 100;
          }
          Health.current[target] -= 40; // Ranged damage
          RangedAttack.active[eid] = 0; // Destroy projectile
          break;
        }
      }

      // Destroy projectile if it goes out of range (10 units = ~300 pixels)
      const startDx = RangedAttack.projectileX[eid] - Position.x[eid];
      const startDy = RangedAttack.projectileY[eid] - Position.y[eid];
      const travelDist = Math.sqrt(startDx * startDx + startDy * startDy);
      if (travelDist > 300) {
        RangedAttack.active[eid] = 0;
      }
    }
  }

  return world;
}