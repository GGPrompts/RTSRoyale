// Combat System - handles targeting, attacking, and damage
import { defineQuery, removeEntity, entityExists } from 'bitecs';
import { Position, Health, Damage, Team, CombatTarget, Dead } from '../components';
import { GameWorld } from '../world';

// Queries for different unit states
const aliveUnitsQuery = defineQuery([Position, Health, Team, Damage]);
const targetingUnitsQuery = defineQuery([Position, CombatTarget, Damage, Team]);
const deadUnitsQuery = defineQuery([Dead]);

// Combat constants
const DEFAULT_ATTACK_RANGE = 50;
const DEFAULT_ATTACK_DAMAGE = 10;
const DEFAULT_ATTACK_SPEED = 1.0; // attacks per second

export function combatSystem(world: GameWorld): void {
  const dt = world.deltaTime;

  // First, clean up dead entities
  cleanupDeadUnits(world);

  // Then handle targeting
  updateTargeting(world);

  // Finally, apply damage to targets
  applyDamage(world, dt);
}

function cleanupDeadUnits(world: GameWorld): void {
  const deadEntities = deadUnitsQuery(world);

  for (let i = 0; i < deadEntities.length; i++) {
    const eid = deadEntities[i];
    removeEntity(world, eid);
  }
}

function updateTargeting(world: GameWorld): void {
  const units = aliveUnitsQuery(world);

  for (let i = 0; i < units.length; i++) {
    const eid = units[i];
    const myTeam = Team.id[eid];
    const myX = Position.x[eid];
    const myY = Position.y[eid];

    // Get attack range (use default if not set)
    const attackRange = Damage.range[eid] || DEFAULT_ATTACK_RANGE;

    // Check if we already have a valid target
    if (CombatTarget.entity[eid] > 0) {
      const targetId = CombatTarget.entity[eid];

      // Validate target still exists and is in range
      if (entityExists(world, targetId) && !Dead[targetId]) {
        const targetX = Position.x[targetId];
        const targetY = Position.y[targetId];
        const dx = targetX - myX;
        const dy = targetY - myY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= attackRange) {
          continue; // Keep current target
        }
      }

      // Clear invalid target
      CombatTarget.entity[eid] = 0;
    }

    // Find new target
    let closestEnemy = 0;
    let closestDistance = Infinity;

    for (let j = 0; j < units.length; j++) {
      const otherId = units[j];

      // Skip self and same team
      if (otherId === eid || Team.id[otherId] === myTeam) {
        continue;
      }

      // Check if enemy is alive
      if (Health.current[otherId] <= 0) {
        continue;
      }

      // Calculate distance
      const enemyX = Position.x[otherId];
      const enemyY = Position.y[otherId];
      const dx = enemyX - myX;
      const dy = enemyY - myY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if in range and closer than current closest
      if (distance <= attackRange && distance < closestDistance) {
        closestEnemy = otherId;
        closestDistance = distance;
      }
    }

    // Set new target
    if (closestEnemy > 0) {
      CombatTarget.entity[eid] = closestEnemy;
    }
  }
}

function applyDamage(world: GameWorld, dt: number): void {
  const attackers = targetingUnitsQuery(world);

  for (let i = 0; i < attackers.length; i++) {
    const eid = attackers[i];
    const targetId = CombatTarget.entity[eid];

    // Skip if no target
    if (targetId === 0 || !entityExists(world, targetId)) {
      continue;
    }

    // Skip if target is dead
    if (Health.current[targetId] <= 0 || Dead[targetId]) {
      CombatTarget.entity[eid] = 0;
      continue;
    }

    // Update attack cooldown
    if (Damage.cooldown[eid] > 0) {
      Damage.cooldown[eid] -= dt;
      continue; // Still on cooldown
    }

    // Get combat stats
    const attackDamage = Damage.amount[eid] || DEFAULT_ATTACK_DAMAGE;
    const attackSpeed = Damage.attackSpeed[eid] || DEFAULT_ATTACK_SPEED;
    const attackRange = Damage.range[eid] || DEFAULT_ATTACK_RANGE;

    // Verify target is still in range
    const myX = Position.x[eid];
    const myY = Position.y[eid];
    const targetX = Position.x[targetId];
    const targetY = Position.y[targetId];
    const dx = targetX - myX;
    const dy = targetY - myY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > attackRange) {
      // Target moved out of range, clear it
      CombatTarget.entity[eid] = 0;
      continue;
    }

    // Apply damage
    Health.current[targetId] -= attackDamage;

    // Set cooldown for next attack
    Damage.cooldown[eid] = 1.0 / attackSpeed;

    // Check if target died
    if (Health.current[targetId] <= 0) {
      Health.current[targetId] = 0;
      // Mark as dead (will be removed in next cleanup)
      Dead[targetId] = 1;
      // Clear our target
      CombatTarget.entity[eid] = 0;
    }
  }
}