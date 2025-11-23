// Movement System
import { defineQuery } from 'bitecs';
import { Position, Velocity } from '../components';
import { GameWorld } from '../world';

const movementQuery = defineQuery([Position, Velocity]);

export function movementSystem(world: GameWorld): void {
  const entities = movementQuery(world);
  const dt = world.deltaTime;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    Position.x[eid] += Velocity.x[eid] * dt;
    Position.y[eid] += Velocity.y[eid] * dt;
  }
}
