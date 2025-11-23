// Performance optimization utilities
import { defineQuery } from 'bitecs';
import { Position } from '@rts-arena/core';

const positionQuery = defineQuery([Position]);

export interface CullingBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Calculate which entities are visible on screen
 * Use this to skip rendering off-screen entities
 */
export function getCullingBounds(
  cameraX: number,
  cameraY: number,
  screenWidth: number,
  screenHeight: number,
  margin: number = 100
): CullingBounds {
  return {
    minX: cameraX - margin,
    maxX: cameraX + screenWidth + margin,
    minY: cameraY - margin,
    maxY: cameraY + screenHeight + margin,
  };
}

/**
 * Check if an entity is within culling bounds
 */
export function isEntityVisible(
  eid: number,
  bounds: CullingBounds
): boolean {
  const x = Position.x[eid];
  const y = Position.y[eid];

  return (
    x >= bounds.minX &&
    x <= bounds.maxX &&
    y >= bounds.minY &&
    y <= bounds.maxY
  );
}

/**
 * Get count of on-screen vs off-screen entities
 */
export function getCullingStats(
  world: any,
  bounds: CullingBounds
): { visible: number; culled: number } {
  const entities = positionQuery(world);
  let visible = 0;
  let culled = 0;

  for (let i = 0; i < entities.length; i++) {
    if (isEntityVisible(entities[i], bounds)) {
      visible++;
    } else {
      culled++;
    }
  }

  return { visible, culled };
}

/**
 * Frame time tracker for performance monitoring
 */
export class PerformanceTracker {
  private frameTimes: number[] = [];
  private maxSamples = 60;
  private lastTime = performance.now();

  update(): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 60;

    const avgFrameTime =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }

  getMinFPS(): number {
    if (this.frameTimes.length === 0) return 60;

    const maxFrameTime = Math.max(...this.frameTimes);
    return Math.round(1000 / maxFrameTime);
  }

  getMaxFPS(): number {
    if (this.frameTimes.length === 0) return 60;

    const minFrameTime = Math.min(...this.frameTimes);
    return Math.round(1000 / minFrameTime);
  }

  getStats() {
    return {
      avg: this.getAverageFPS(),
      min: this.getMinFPS(),
      max: this.getMaxFPS(),
      samples: this.frameTimes.length,
    };
  }
}
