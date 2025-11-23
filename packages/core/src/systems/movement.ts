// Movement System
import { defineQuery, hasComponent } from 'bitecs';
import { Position, Velocity, MoveTarget } from '../components';
import { GameWorld } from '../world';

const movementQuery = defineQuery([Position, Velocity]);
const moveTargetQuery = defineQuery([Position, Velocity, MoveTarget]);

export function movementSystem(world: GameWorld): void {
  const dt = world.deltaTime;

  // Process entities with MoveTarget
  const targetEntities = moveTargetQuery(world);

  if (targetEntities.length > 0) {
    console.log(`[Movement] Processing ${targetEntities.length} entities with MoveTarget, dt=${dt.toFixed(3)}`);
  }

  for (let i = 0; i < targetEntities.length; i++) {
    const eid = targetEntities[i];

    if (MoveTarget.active[eid] === 1) {
      // Calculate direction to target
      const dx = MoveTarget.x[eid] - Position.x[eid];
      const dy = MoveTarget.y[eid] - Position.y[eid];
      const distance = Math.sqrt(dx * dx + dy * dy);

      console.log(`[Movement] Entity ${eid} moving to (${MoveTarget.x[eid].toFixed(0)}, ${MoveTarget.y[eid].toFixed(0)}), dist=${distance.toFixed(1)}`);

      if (distance < 5) {
        // Reached target
        MoveTarget.active[eid] = 0;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
      } else {
        // Move toward target
        const speed = 100; // units per second
        Velocity.x[eid] = (dx / distance) * speed;
        Velocity.y[eid] = (dy / distance) * speed;
      }
    } else {
      // No active move target, stop movement
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
    }
  }

  // Update positions for all entities with velocity
  const entities = movementQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    Position.x[eid] += Velocity.x[eid] * dt;
    Position.y[eid] += Velocity.y[eid] * dt;
  }
}
