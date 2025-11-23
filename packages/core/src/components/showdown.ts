// Final Showdown System Components
import { defineComponent, Types } from 'bitecs';

// Final Showdown Components
export const GameTimer = defineComponent({
  totalTime: Types.f32,
  matchDuration: Types.f32, // Total match duration (150s for 2:30)
});

export const ShowdownState = defineComponent({
  state: Types.ui8, // 0: normal, 1: warning, 2: collapse, 3: showdown, 4: ended
  lastState: Types.ui8,
  transitionTime: Types.f32,
});

export const AutoBattle = defineComponent({
  enabled: Types.ui8, // Boolean (0 or 1)
  targetEntity: Types.eid, // Entity ID of current target
  attackCooldown: Types.f32,
});

export const OriginalAI = defineComponent({
  savedBehavior: Types.ui8, // Store original AI type
  savedTargetX: Types.f32,
  savedTargetY: Types.f32,
});

// Export all showdown components
export const SHOWDOWN_COMPONENTS = [
  GameTimer,
  ShowdownState,
  AutoBattle,
  OriginalAI,
];