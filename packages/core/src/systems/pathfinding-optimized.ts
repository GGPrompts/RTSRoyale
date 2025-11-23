// RTS Arena - Optimized Pathfinding System
// Uses cached paths, spatial optimization, and reduced allocations

import { defineQuery } from 'bitecs';
import { Position, Target, Velocity } from '../components';
import { GameWorld } from '../world';

// Query defined once, cached
const pathfindingQuery = defineQuery([Position, Target, Velocity]);

// Constants
const MOVEMENT_SPEED = 100.0; // units per second
const ARRIVAL_THRESHOLD = 5.0; // distance to consider "reached"
const ARRIVAL_THRESHOLD_SQ = ARRIVAL_THRESHOLD * ARRIVAL_THRESHOLD;

// Pre-allocated for math operations
const tempVector = { x: 0, y: 0 };

// Path cache for common destinations
const pathCache = new Map<string, { vx: number; vy: number }>();
const CACHE_GRID_SIZE = 50; // Grid size for cache keys

function getCacheKey(fromX: number, fromY: number, toX: number, toY: number): string {
  const fx = Math.floor(fromX / CACHE_GRID_SIZE);
  const fy = Math.floor(fromY / CACHE_GRID_SIZE);
  const tx = Math.floor(toX / CACHE_GRID_SIZE);
  const ty = Math.floor(toY / CACHE_GRID_SIZE);
  return `${fx},${fy}-${tx},${ty}`;
}

export function pathfindingSystemOptimized(world: GameWorld): void {
  const entities = pathfindingQuery(world);
  const count = entities.length;

  if (count === 0) return;

  // Process in batches for better cache performance
  const batchSize = 32;

  for (let batch = 0; batch < count; batch += batchSize) {
    const batchEnd = Math.min(batch + batchSize, count);

    for (let i = batch; i < batchEnd; i++) {
      const eid = entities[i];

      // Skip if already reached target
      if (Target.reached[eid]) {
        // Ensure velocity is zero
        if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
          Velocity.x[eid] = 0;
          Velocity.y[eid] = 0;
        }
        continue;
      }

      // Get positions
      const px = Position.x[eid];
      const py = Position.y[eid];
      const tx = Target.x[eid];
      const ty = Target.y[eid];

      // Calculate vector to target
      const dx = tx - px;
      const dy = ty - py;

      // Check arrival (using squared distance to avoid sqrt)
      const distSq = dx * dx + dy * dy;

      if (distSq < ARRIVAL_THRESHOLD_SQ) {
        // Reached target
        Target.reached[eid] = 1;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        continue;
      }

      // Check path cache
      const cacheKey = getCacheKey(px, py, tx, ty);
      let velocity = pathCache.get(cacheKey);

      if (!velocity) {
        // Calculate normalized direction (only when not cached)
        const dist = Math.sqrt(distSq);
        const invDist = 1.0 / dist;
        velocity = {
          vx: (dx * invDist) * MOVEMENT_SPEED,
          vy: (dy * invDist) * MOVEMENT_SPEED
        };

        // Cache the result
        if (pathCache.size < 1000) { // Limit cache size
          pathCache.set(cacheKey, velocity);
        }
      }

      // Set velocity
      Velocity.x[eid] = velocity.vx;
      Velocity.y[eid] = velocity.vy;
    }
  }

  // Clean up cache periodically (every 1000 frames)
  if (world.time % 16.67 < world.deltaTime) { // Roughly every second
    if (pathCache.size > 500) {
      pathCache.clear();
    }
  }
}

// Advanced pathfinding with obstacle avoidance
export function pathfindingSystemAdvanced(world: GameWorld): void {
  const entities = pathfindingQuery(world);
  const count = entities.length;

  if (count === 0) return;

  // Group entities by similar targets for flocking behavior
  const targetGroups = new Map<string, number[]>();

  for (let i = 0; i < count; i++) {
    const eid = entities[i];

    if (Target.reached[eid]) {
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      continue;
    }

    // Group by target grid cell
    const tx = Math.floor(Target.x[eid] / 100);
    const ty = Math.floor(Target.y[eid] / 100);
    const key = `${tx},${ty}`;

    if (!targetGroups.has(key)) {
      targetGroups.set(key, []);
    }
    targetGroups.get(key)!.push(eid);
  }

  // Process each group with local avoidance
  targetGroups.forEach((group) => {
    const groupSize = group.length;

    for (let i = 0; i < groupSize; i++) {
      const eid = group[i];

      const px = Position.x[eid];
      const py = Position.y[eid];
      const tx = Target.x[eid];
      const ty = Target.y[eid];

      // Basic direction to target
      let dx = tx - px;
      let dy = ty - py;
      const distSq = dx * dx + dy * dy;

      if (distSq < ARRIVAL_THRESHOLD_SQ) {
        Target.reached[eid] = 1;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        continue;
      }

      // Normalize
      const dist = Math.sqrt(distSq);
      dx /= dist;
      dy /= dist;

      // Simple separation from nearby units in same group
      let sepX = 0;
      let sepY = 0;
      const SEPARATION_RADIUS = 30;
      const SEPARATION_RADIUS_SQ = SEPARATION_RADIUS * SEPARATION_RADIUS;

      for (let j = 0; j < groupSize; j++) {
        if (i === j) continue;

        const otherId = group[j];
        const ox = Position.x[otherId];
        const oy = Position.y[otherId];

        const sdx = px - ox;
        const sdy = py - oy;
        const sdistSq = sdx * sdx + sdy * sdy;

        if (sdistSq < SEPARATION_RADIUS_SQ && sdistSq > 0.01) {
          const sdist = Math.sqrt(sdistSq);
          sepX += (sdx / sdist) * (1.0 - sdist / SEPARATION_RADIUS);
          sepY += (sdy / sdist) * (1.0 - sdist / SEPARATION_RADIUS);
        }
      }

      // Combine direction with separation
      const finalVx = (dx + sepX * 0.3) * MOVEMENT_SPEED;
      const finalVy = (dy + sepY * 0.3) * MOVEMENT_SPEED;

      Velocity.x[eid] = finalVx;
      Velocity.y[eid] = finalVy;
    }
  });
}