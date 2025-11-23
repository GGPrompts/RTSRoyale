// World setup and management
import { createWorld as createECSWorld, IWorld } from 'bitecs';
import { ALL_COMPONENTS } from './components';

export interface GameWorld extends IWorld {
  time: number;
  deltaTime: number;
  phase: 'normal' | 'warning' | 'collapse' | 'showdown' | 'ended';
}

export function createWorld(): GameWorld {
  const world = createECSWorld() as GameWorld;

  // Initialize custom properties
  world.time = 0;
  world.deltaTime = 0;
  world.phase = 'normal';

  return world;
}

export function resetWorld(world: GameWorld): void {
  world.time = 0;
  world.deltaTime = 0;
  world.phase = 'normal';
}
