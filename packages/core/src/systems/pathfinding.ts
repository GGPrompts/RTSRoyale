// Pathfinding System
import { defineQuery } from 'bitecs';
import { Position, Target, Velocity } from '../components';
import { GameWorld } from '../world';

const pathfindingQuery = defineQuery([Position, Target, Velocity]);

const MOVEMENT_SPEED = 5.0; // units per second
const ARRIVAL_THRESHOLD = 0.5; // distance to consider "reached"

export function pathfindingSystem(world: GameWorld): void {
  const entities = pathfindingQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Skip if already reached target
    if (Target.reached[eid]) {
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      continue;
    }

    const dx = Target.x[eid] - Position.x[eid];
    const dy = Target.y[eid] - Position.y[eid];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ARRIVAL_THRESHOLD) {
      // Reached target
      Target.reached[eid] = 1;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
    } else {
      // Move towards target
      Velocity.x[eid] = (dx / distance) * MOVEMENT_SPEED;
      Velocity.y[eid] = (dy / distance) * MOVEMENT_SPEED;
    }
  }
}
