// RTS Arena - Optimized Movement System
// Reduces allocations and improves cache locality

import { defineQuery } from 'bitecs';
import { Position, Velocity } from '../components';
import { GameWorld } from '../world';

// Query defined once, cached
const movementQuery = defineQuery([Position, Velocity]);

// Pre-allocated arrays to avoid per-frame allocations
const MAX_ENTITIES = 1000;
const entityBuffer = new Float32Array(MAX_ENTITIES * 4); // x, y, vx, vy per entity

export function movementSystemOptimized(world: GameWorld): void {
  const entities = movementQuery(world);
  const count = entities.length;

  if (count === 0) return;

  const dt = world.deltaTime;

  // Bounds for keeping units on screen
  const minX = 0;
  const minY = 0;
  const maxX = 1920;
  const maxY = 1080;

  // Process entities in batches for better cache performance
  const batchSize = 32;

  for (let batch = 0; batch < count; batch += batchSize) {
    const batchEnd = Math.min(batch + batchSize, count);

    // Process batch
    for (let i = batch; i < batchEnd; i++) {
      const eid = entities[i];

      // Direct array access (no function calls)
      const px = Position.x[eid];
      const py = Position.y[eid];
      const vx = Velocity.x[eid];
      const vy = Velocity.y[eid];

      // Skip stationary entities
      if (vx === 0 && vy === 0) continue;

      // Update position
      let newX = px + vx * dt;
      let newY = py + vy * dt;

      // Boundary check with bounce
      if (newX < minX || newX > maxX) {
        newX = newX < minX ? minX : maxX;
        Velocity.x[eid] = -vx * 0.9; // Dampen on bounce
      }

      if (newY < minY || newY > maxY) {
        newY = newY < minY ? minY : maxY;
        Velocity.y[eid] = -vy * 0.9; // Dampen on bounce
      }

      // Write back
      Position.x[eid] = newX;
      Position.y[eid] = newY;
    }
  }
}

// SIMD-optimized version for browsers that support it
export function movementSystemSIMD(world: GameWorld): void {
  const entities = movementQuery(world);
  const count = entities.length;

  if (count === 0) return;

  const dt = world.deltaTime;

  // Process 4 entities at a time using SIMD-friendly operations
  const simdCount = Math.floor(count / 4) * 4;

  for (let i = 0; i < simdCount; i += 4) {
    // Load 4 entities
    const eid0 = entities[i];
    const eid1 = entities[i + 1];
    const eid2 = entities[i + 2];
    const eid3 = entities[i + 3];

    // Load positions (vectorizable)
    const px0 = Position.x[eid0];
    const px1 = Position.x[eid1];
    const px2 = Position.x[eid2];
    const px3 = Position.x[eid3];

    const py0 = Position.y[eid0];
    const py1 = Position.y[eid1];
    const py2 = Position.y[eid2];
    const py3 = Position.y[eid3];

    // Load velocities (vectorizable)
    const vx0 = Velocity.x[eid0];
    const vx1 = Velocity.x[eid1];
    const vx2 = Velocity.x[eid2];
    const vx3 = Velocity.x[eid3];

    const vy0 = Velocity.y[eid0];
    const vy1 = Velocity.y[eid1];
    const vy2 = Velocity.y[eid2];
    const vy3 = Velocity.y[eid3];

    // Compute new positions (vectorizable)
    Position.x[eid0] = px0 + vx0 * dt;
    Position.x[eid1] = px1 + vx1 * dt;
    Position.x[eid2] = px2 + vx2 * dt;
    Position.x[eid3] = px3 + vx3 * dt;

    Position.y[eid0] = py0 + vy0 * dt;
    Position.y[eid1] = py1 + vy1 * dt;
    Position.y[eid2] = py2 + vy2 * dt;
    Position.y[eid3] = py3 + vy3 * dt;
  }

  // Handle remaining entities
  for (let i = simdCount; i < count; i++) {
    const eid = entities[i];
    Position.x[eid] += Velocity.x[eid] * dt;
    Position.y[eid] += Velocity.y[eid] * dt;
  }
}