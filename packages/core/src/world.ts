// World setup and management
import { createWorld as createECSWorld, IWorld } from 'bitecs';
import { ALL_COMPONENTS } from './components';

export interface GameWorld extends IWorld {
  time: number;
  deltaTime: number;
  phase: 'normal' | 'warning' | 'collapse' | 'showdown' | 'ended';
  damageEvents?: Array<{ entityId: number; damage: number; x: number; y: number }>;
  deadEntities?: number[];
  // Final showdown properties
  gamePhase?: 'normal' | 'warning' | 'collapse' | 'showdown' | 'ended';
  autoAttackMode?: boolean;
  phaseMessage?: string;
  phaseMessageDuration?: number;
  screenEffect?: string;
  showCountdown?: boolean;
  forceAutoAttack?: boolean;
  gameOver?: boolean;
  winner?: number;
  victoryState?: any;
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
