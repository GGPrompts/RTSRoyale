// Core game types for RTS Arena

export interface Vector2 {
  x: number;
  y: number;
}

export interface Unit {
  id: number;
  teamId: 0 | 1;
  position: Vector2;
  health: number;
  maxHealth: number;
}

export interface GameState {
  time: number;
  phase: 'normal' | 'warning' | 'collapse' | 'showdown' | 'ended';
  winner?: 0 | 1;
}

export interface InputCommand {
  type: 'move' | 'attack' | 'ability';
  entityIds: number[];
  target?: Vector2;
  abilityId?: string;
}

export interface MatchConfig {
  duration: number; // seconds
  mapId: string;
  unitPool: string[];
}

// Component type definitions
export interface Components {
  Position: { x: number; y: number };
  Velocity: { x: number; y: number };
  Target: { x: number; y: number; reached: number };
  Health: { current: number; max: number };
  Damage: { amount: number; range: number; attackSpeed: number; cooldown: number };
  Team: { id: 0 | 1 };
  Selected: { value: number };
  Sprite: { textureId: number; scaleX: number; scaleY: number; rotation: number };

  // Abilities
  Dash: { cooldown: number; maxCooldown: number; distance: number; damage: number };
  Shield: { cooldown: number; maxCooldown: number; duration: number; active: number };
  RangedAttack: { cooldown: number; maxCooldown: number; range: number; damage: number };

  // Tags
  Dead: {};
  Teleporting: { startTime: number; endTime: number };
}
