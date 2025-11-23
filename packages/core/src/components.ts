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

// Combat targeting
export const CombatTarget = defineComponent({
  entity: Types.eid, // Entity ID of target
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

// Ability Slots (Q, W, E)
export const AbilitySlot1 = defineComponent({
  abilityType: Types.ui8, // 1 = Dash
  cooldown: Types.f32,
});

export const AbilitySlot2 = defineComponent({
  abilityType: Types.ui8, // 2 = Shield
  cooldown: Types.f32,
});

export const AbilitySlot3 = defineComponent({
  abilityType: Types.ui8, // 3 = RangedAttack
  cooldown: Types.f32,
});

// Dash specific
export const DashVelocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
  duration: Types.f32,
});

// Shield specific
export const ShieldActive = defineComponent({
  damageReduction: Types.f32, // 0.5 = 50% reduction
  remainingDuration: Types.f32,
});

// Projectile components
export const Projectile = defineComponent({
  owner: Types.eid,
  targetX: Types.f32,
  targetY: Types.f32,
  speed: Types.f32,
  damage: Types.f32,
  aoeRadius: Types.f32,
});

// Facing direction for units
export const Rotation = defineComponent({
  angle: Types.f32, // in radians
});

// Rendering
export const Sprite = defineComponent({
  textureId: Types.ui8,
  scaleX: Types.f32,
  scaleY: Types.f32,
  rotation: Types.f32,
});

// Selection & Control
export const Selected = defineComponent({
  value: Types.ui8, // Boolean
});

export const Selectable = defineComponent({
  teamId: Types.ui8, // Which team can select this unit
});

export const MoveTarget = defineComponent({
  x: Types.f32,
  y: Types.f32,
  active: Types.ui8, // Boolean - whether unit has an active move order
});

export const ControlGroup = defineComponent({
  groupId: Types.ui8, // 0-9, 0 means no group
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
  CombatTarget,
  Dash,
  Shield,
  RangedAttack,
  AbilitySlot1,
  AbilitySlot2,
  AbilitySlot3,
  DashVelocity,
  ShieldActive,
  Projectile,
  Rotation,
  Sprite,
  Selected,
  Selectable,
  MoveTarget,
  ControlGroup,
  Dead,
  Teleporting,
];
