// bitECS Component Definitions
import { defineComponent, Types } from 'bitecs';

// Position & Movement
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Target = defineComponent({
  x: Types.f32,
  y: Types.f32,
  reached: Types.ui8, // Boolean (0 or 1)
});

// Combat
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
});

export const Damage = defineComponent({
  amount: Types.f32,
  range: Types.f32,
  attackSpeed: Types.f32,
  cooldown: Types.f32,
});

export const Team = defineComponent({
  id: Types.ui8, // 0 or 1
});

// Abilities
export const Dash = defineComponent({
  cooldown: Types.f32,
  maxCooldown: Types.f32,
  distance: Types.f32,
  damage: Types.f32,
});

export const Shield = defineComponent({
  cooldown: Types.f32,
  maxCooldown: Types.f32,
  duration: Types.f32,
  active: Types.ui8, // Boolean
});

export const RangedAttack = defineComponent({
  cooldown: Types.f32,
  maxCooldown: Types.f32,
  range: Types.f32,
  damage: Types.f32,
});

// Rendering
export const Sprite = defineComponent({
  textureId: Types.ui8,
  scaleX: Types.f32,
  scaleY: Types.f32,
  rotation: Types.f32,
});

export const Selected = defineComponent({
  value: Types.ui8, // Boolean
});

// Tags (empty components)
export const Dead = defineComponent();

export const Teleporting = defineComponent({
  startTime: Types.f32,
  endTime: Types.f32,
});

// Register all components helper
export const ALL_COMPONENTS = [
  Position,
  Velocity,
  Target,
  Health,
  Damage,
  Team,
  Dash,
  Shield,
  RangedAttack,
  Sprite,
  Selected,
  Dead,
  Teleporting,
];
