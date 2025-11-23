// Combat System for RTS Arena
import { defineQuery, hasComponent, addComponent, removeEntity } from 'bitecs';
import { Position, Damage, Health, Team, Dead } from '../components';
import type { GameWorld } from '../world';

// Query for all combat-capable entities
const combatQuery = defineQuery([Position, Damage, Health, Team]);
const deadQuery = defineQuery([Dead]);

/**
 * Combat System - Handles unit attacks and damage calculation
 * Features:
 * - Range-based targeting
 * - Attack speed cooldowns
 * - Team-based filtering
 * - Death marking when health depleted
 */
export function combatSystem(world: GameWorld): GameWorld {
  const entities = combatQuery(world);
  const deltaTime = world.deltaTime;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Skip dead entities
    if (hasComponent(world, Dead, eid)) continue;

    // Update attack cooldown
    Damage.cooldown[eid] -= deltaTime;
    if (Damage.cooldown[eid] > 0) continue; // Still on cooldown

    // Get attacker properties
    const myTeam = Team.id[eid];
    const myX = Position.x[eid];
    const myY = Position.y[eid];
    const attackRange = Damage.range[eid];

    // Find nearest enemy in range
    let nearestEnemy = -1;
    let nearestDist = Infinity;

    for (let j = 0; j < entities.length; j++) {
      const target = entities[j];

      // Skip self
      if (target === eid) continue;

      // Skip dead targets
      if (hasComponent(world, Dead, target)) continue;

      // Skip same team
      if (Team.id[target] === myTeam) continue;

      // Calculate distance
      const dx = Position.x[target] - myX;
      const dy = Position.y[target] - myY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if in range and closer than previous target
      if (dist <= attackRange && dist < nearestDist) {
        nearestEnemy = target;
        nearestDist = dist;
      }
    }

    // Attack the nearest enemy if found
    if (nearestEnemy !== -1) {
      // Apply damage
      Health.current[nearestEnemy] -= Damage.amount[eid];

      // Reset attack cooldown based on attack speed
      // attackSpeed is attacks per second, so cooldown is 1/attackSpeed
      Damage.cooldown[eid] = 1.0 / Damage.attackSpeed[eid];

      // Mark as dead if health depleted
      if (Health.current[nearestEnemy] <= 0) {
        Health.current[nearestEnemy] = 0; // Clamp to 0
        addComponent(world, Dead, nearestEnemy);

        // Log for debugging
        console.log(`Entity ${nearestEnemy} killed by Entity ${eid}`);
      }
    }
  }

  return world;
}

/**
 * Cleanup System - Removes dead entities from the world
 * This should run after combat system to clean up killed units
 */
export function cleanupSystem(world: GameWorld): GameWorld {
  const deadEntities = deadQuery(world);

  for (let i = 0; i < deadEntities.length; i++) {
    const eid = deadEntities[i];

    // You can add death effects here (handled by Agent 6 - visual effects)
    // For now, log the removal
    console.log(`Removing dead entity: ${eid}`);

    // Remove the entity from the world
    removeEntity(world, eid);
  }

  return world;
}