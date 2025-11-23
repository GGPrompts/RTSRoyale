// Combat System
import { defineQuery, hasComponent, addComponent, removeEntity } from 'bitecs';
import { Position, Health, Damage, Team, Dead } from '../components';
import { GameWorld } from '../world';

// Query for units that can attack (have position, damage, team, health)
const combatQuery = defineQuery([Position, Damage, Team, Health]);

// Query for potential targets (alive units with position, health, team)
const targetQuery = defineQuery([Position, Health, Team]);

// Query for dead entities to clean up
const deadQuery = defineQuery([Dead]);

export function combatSystem(world: GameWorld): void {
  const attackers = combatQuery(world);
  const dt = world.deltaTime;

  // During showdown, increase attack range to ensure units can reach each other
  const showdownActive = world.gamePhase === 'showdown' || world.autoAttackMode;
  const rangeMultiplier = showdownActive ? 50.0 : 1.0; // Massively increase range during showdown

  // Process attackers
  for (let i = 0; i < attackers.length; i++) {
    const attackerEid = attackers[i];

    // Skip dead attackers
    if (hasComponent(world, attackerEid, Dead)) continue;

    // Update cooldown
    if (Damage.cooldown[attackerEid] > 0) {
      Damage.cooldown[attackerEid] = Math.max(0, Damage.cooldown[attackerEid] - dt);
      continue; // Still on cooldown
    }

    const attackerX = Position.x[attackerEid];
    const attackerY = Position.y[attackerEid];
    const attackerTeam = Team.id[attackerEid];
    const attackRange = Damage.range[attackerEid] * rangeMultiplier;
    const damageAmount = Damage.amount[attackerEid];
    const attackSpeed = Damage.attackSpeed[attackerEid];

    // Find nearest enemy target
    const targets = targetQuery(world);
    let nearestTarget = -1;
    let nearestDistance = Infinity;

    for (let j = 0; j < targets.length; j++) {
      const targetEid = targets[j];

      // Skip self
      if (targetEid === attackerEid) continue;

      // Skip dead targets
      if (hasComponent(world, targetEid, Dead)) continue;

      // Skip same team
      if (Team.id[targetEid] === attackerTeam) continue;

      // Calculate distance
      const targetX = Position.x[targetEid];
      const targetY = Position.y[targetEid];
      const dx = targetX - attackerX;
      const dy = targetY - attackerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if in range and closer than previous targets
      if (distance <= attackRange && distance < nearestDistance) {
        nearestTarget = targetEid;
        nearestDistance = distance;
      }
    }

    // Attack the nearest target if found
    if (nearestTarget !== -1) {
      // Apply damage
      Health.current[nearestTarget] -= damageAmount;

      // Trigger damage number event (will be handled by rendering system)
      // Store damage info for the rendering system to pick up
      if (!world.damageEvents) {
        world.damageEvents = [];
      }
      world.damageEvents.push({
        entityId: nearestTarget,
        damage: damageAmount,
        x: Position.x[nearestTarget],
        y: Position.y[nearestTarget],
      });

      // Set attack cooldown (1 attack per attackSpeed seconds)
      Damage.cooldown[attackerEid] = 1.0 / attackSpeed;

      // Check if target died
      if (Health.current[nearestTarget] <= 0) {
        // Mark as dead
        addComponent(world, nearestTarget, Dead);
        console.log(`Unit ${nearestTarget} killed by unit ${attackerEid}`);
      }
    }
  }

  // Clean up dead entities
  const deadEntities = deadQuery(world);
  for (let i = 0; i < deadEntities.length; i++) {
    const deadEid = deadEntities[i];

    // Notify rendering system to clean up visuals
    if (!world.deadEntities) {
      world.deadEntities = [];
    }
    world.deadEntities.push(deadEid);

    // Remove from ECS world
    removeEntity(world, deadEid);
  }
}