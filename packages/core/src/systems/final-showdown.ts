// Final Showdown System
import { defineQuery, addComponent, removeComponent, hasComponent, entityExists } from 'bitecs';
import { Position, Velocity, Health, Team, Dead, MoveTarget, CombatTarget } from '../components';
import { GameTimer, ShowdownState, AutoBattle, OriginalAI } from '../components/showdown';
import { GameWorld } from '../world';

// Showdown phase constants
const PHASE_WARNING_TIME = 120; // 2:00 - Warning phase
const PHASE_COLLAPSE_TIME = 135; // 2:15 - Collapse phase
const PHASE_SHOWDOWN_TIME = 150; // 2:30 - Final showdown
const MATCH_END_TIME = 180; // 3:00 - Match ends

// Showdown states
enum ShowdownPhase {
  NORMAL = 0,
  WARNING = 1,
  COLLAPSE = 2,
  SHOWDOWN = 3,
  ENDED = 4
}

// Center of the arena for final showdown
const ARENA_CENTER_X = 960; // 1920 / 2
const ARENA_CENTER_Y = 540; // 1080 / 2
const SPAWN_RADIUS = 200; // Radius around center to spawn units

// Queries
const aliveUnitsQuery = defineQuery([Position, Health, Team]);
const autoBattleQuery = defineQuery([AutoBattle, Position, Health, Team]);
const timerQuery = defineQuery([GameTimer, ShowdownState]);

// Initialize the timer entity (should be called once at game start)
export function initShowdownTimer(world: GameWorld): number {
  // Check if timer already exists
  const existingTimers = timerQuery(world);
  if (existingTimers.length > 0) {
    return existingTimers[0];
  }

  // Create timer entity
  const timerEntity = world.addEntity();
  addComponent(world, GameTimer, timerEntity);
  addComponent(world, ShowdownState, timerEntity);

  // Initialize timer values
  GameTimer.totalTime[timerEntity] = 0;
  GameTimer.matchDuration[timerEntity] = PHASE_SHOWDOWN_TIME;

  // Initialize showdown state
  ShowdownState.state[timerEntity] = ShowdownPhase.NORMAL;
  ShowdownState.lastState[timerEntity] = ShowdownPhase.NORMAL;
  ShowdownState.transitionTime[timerEntity] = 0;

  return timerEntity;
}

export function finalShowdownSystem(world: GameWorld): void {
  const dt = world.deltaTime;

  // Get or create timer entity
  let timerEntities = timerQuery(world);
  let timerEntity: number;

  if (timerEntities.length === 0) {
    timerEntity = initShowdownTimer(world);
  } else {
    timerEntity = timerEntities[0];
  }

  // Update game time
  const currentTime = GameTimer.totalTime[timerEntity];
  const newTime = currentTime + dt;
  GameTimer.totalTime[timerEntity] = newTime;

  // Get current phase
  const currentPhase = ShowdownState.state[timerEntity];
  const lastPhase = ShowdownState.lastState[timerEntity];

  // Determine new phase based on time
  let newPhase = currentPhase;

  if (newTime >= MATCH_END_TIME && currentPhase !== ShowdownPhase.ENDED) {
    newPhase = ShowdownPhase.ENDED;
  } else if (newTime >= PHASE_SHOWDOWN_TIME && currentPhase < ShowdownPhase.SHOWDOWN) {
    newPhase = ShowdownPhase.SHOWDOWN;
  } else if (newTime >= PHASE_COLLAPSE_TIME && currentPhase < ShowdownPhase.COLLAPSE) {
    newPhase = ShowdownPhase.COLLAPSE;
  } else if (newTime >= PHASE_WARNING_TIME && currentPhase < ShowdownPhase.WARNING) {
    newPhase = ShowdownPhase.WARNING;
  }

  // Handle phase transitions
  if (newPhase !== currentPhase) {
    ShowdownState.lastState[timerEntity] = currentPhase;
    ShowdownState.state[timerEntity] = newPhase;
    ShowdownState.transitionTime[timerEntity] = newTime;

    // Handle specific phase transitions
    switch (newPhase) {
      case ShowdownPhase.WARNING:
        console.log('⚠️ ARENA COLLAPSE IN 30 SECONDS!');
        break;

      case ShowdownPhase.COLLAPSE:
        console.log('🔴 PREPARE FOR FINAL SHOWDOWN!');
        break;

      case ShowdownPhase.SHOWDOWN:
        console.log('⚔️ FINAL SHOWDOWN!');
        activateFinalShowdown(world);
        break;

      case ShowdownPhase.ENDED:
        console.log('🏁 MATCH ENDED!');
        determineWinner(world);
        break;
    }
  }

  // Update auto-battle units during showdown
  if (currentPhase === ShowdownPhase.SHOWDOWN) {
    updateAutoBattle(world, dt);
  }

  // Update world phase for UI
  const phaseNames = ['normal', 'warning', 'collapse', 'showdown', 'ended'] as const;
  world.phase = phaseNames[newPhase];
}

function activateFinalShowdown(world: GameWorld): void {
  const aliveUnits = aliveUnitsQuery(world);

  // Calculate spawn positions in a circle around center
  const unitCount = aliveUnits.length;

  for (let i = 0; i < unitCount; i++) {
    const eid = aliveUnits[i];

    // Skip dead units
    if (hasComponent(world, Dead, eid)) continue;

    // Save original AI state
    if (!hasComponent(world, OriginalAI, eid)) {
      addComponent(world, OriginalAI, eid);
      OriginalAI.savedBehavior[eid] = 0; // Default behavior

      // Save current target if exists
      if (hasComponent(world, MoveTarget, eid)) {
        OriginalAI.savedTargetX[eid] = MoveTarget.x[eid];
        OriginalAI.savedTargetY[eid] = MoveTarget.y[eid];
      }
    }

    // Teleport units to center in a circle formation
    const angle = (i / unitCount) * Math.PI * 2;
    const teamOffset = Team.id[eid] === 0 ? 0 : Math.PI; // Opposite sides for teams
    const finalAngle = angle + teamOffset;

    Position.x[eid] = ARENA_CENTER_X + Math.cos(finalAngle) * SPAWN_RADIUS;
    Position.y[eid] = ARENA_CENTER_Y + Math.sin(finalAngle) * SPAWN_RADIUS;

    // Reset velocity
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    // Clear any movement targets
    if (hasComponent(world, MoveTarget, eid)) {
      MoveTarget.active[eid] = 0;
    }

    // Enable auto-battle
    if (!hasComponent(world, AutoBattle, eid)) {
      addComponent(world, AutoBattle, eid);
    }
    AutoBattle.enabled[eid] = 1;
    AutoBattle.targetEntity[eid] = 0;
    AutoBattle.attackCooldown[eid] = 0;
  }

  console.log(`Teleported ${unitCount} units to final showdown!`);
}

function updateAutoBattle(world: GameWorld, dt: number): void {
  const autoBattlers = autoBattleQuery(world);
  const allUnits = aliveUnitsQuery(world);

  for (let i = 0; i < autoBattlers.length; i++) {
    const eid = autoBattlers[i];

    // Skip if not enabled or dead
    if (!AutoBattle.enabled[eid] || hasComponent(world, Dead, eid)) continue;

    const myTeam = Team.id[eid];
    const myX = Position.x[eid];
    const myY = Position.y[eid];

    // Find nearest enemy
    let nearestEnemy = 0;
    let nearestDistance = Infinity;

    for (let j = 0; j < allUnits.length; j++) {
      const targetEid = allUnits[j];

      // Skip self, allies, and dead units
      if (targetEid === eid || Team.id[targetEid] === myTeam || hasComponent(world, Dead, targetEid)) {
        continue;
      }

      // Check if target still has health
      if (Health.current[targetEid] <= 0) {
        continue;
      }

      const dx = Position.x[targetEid] - myX;
      const dy = Position.y[targetEid] - myY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = targetEid;
      }
    }

    // If we have a target
    if (nearestEnemy > 0 && entityExists(world, nearestEnemy)) {
      AutoBattle.targetEntity[eid] = nearestEnemy;

      const targetX = Position.x[nearestEnemy];
      const targetY = Position.y[nearestEnemy];
      const dx = targetX - myX;
      const dy = targetY - myY;

      // Set combat target
      if (hasComponent(world, CombatTarget, eid)) {
        CombatTarget.entity[eid] = nearestEnemy;
      } else {
        addComponent(world, CombatTarget, eid);
        CombatTarget.entity[eid] = nearestEnemy;
      }

      // Move towards target if too far (attack range ~100)
      const attackRange = 100;
      if (nearestDistance > attackRange) {
        // Set movement target
        if (hasComponent(world, MoveTarget, eid)) {
          MoveTarget.x[eid] = targetX;
          MoveTarget.y[eid] = targetY;
          MoveTarget.active[eid] = 1;
        } else {
          addComponent(world, MoveTarget, eid);
          MoveTarget.x[eid] = targetX;
          MoveTarget.y[eid] = targetY;
          MoveTarget.active[eid] = 1;
        }

        // Simple movement towards target
        const moveSpeed = 150; // units per second
        const moveDistance = moveSpeed * dt;
        const normalizedDx = dx / nearestDistance;
        const normalizedDy = dy / nearestDistance;

        Velocity.x[eid] = normalizedDx * moveSpeed;
        Velocity.y[eid] = normalizedDy * moveSpeed;
      } else {
        // In range, stop moving and attack
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;

        if (hasComponent(world, MoveTarget, eid)) {
          MoveTarget.active[eid] = 0;
        }

        // Simple attack logic
        if (AutoBattle.attackCooldown[eid] <= 0) {
          // Deal damage
          const damage = 10; // Base damage
          Health.current[nearestEnemy] -= damage;

          // Check if target died
          if (Health.current[nearestEnemy] <= 0) {
            if (!hasComponent(world, Dead, nearestEnemy)) {
              addComponent(world, Dead, nearestEnemy);
            }
            console.log(`Unit ${eid} killed unit ${nearestEnemy}!`);
          }

          // Reset attack cooldown
          AutoBattle.attackCooldown[eid] = 1.0; // 1 second between attacks
        }
      }

      // Update attack cooldown
      if (AutoBattle.attackCooldown[eid] > 0) {
        AutoBattle.attackCooldown[eid] -= dt;
      }
    } else {
      // No enemies found, clear target
      AutoBattle.targetEntity[eid] = 0;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      if (hasComponent(world, MoveTarget, eid)) {
        MoveTarget.active[eid] = 0;
      }

      if (hasComponent(world, CombatTarget, eid)) {
        removeComponent(world, CombatTarget, eid);
      }
    }
  }
}

function determineWinner(world: GameWorld): void {
  const aliveUnits = aliveUnitsQuery(world);

  let team0Count = 0;
  let team1Count = 0;
  let team0Health = 0;
  let team1Health = 0;

  for (let i = 0; i < aliveUnits.length; i++) {
    const eid = aliveUnits[i];

    // Skip dead units
    if (hasComponent(world, Dead, eid) || Health.current[eid] <= 0) continue;

    if (Team.id[eid] === 0) {
      team0Count++;
      team0Health += Health.current[eid];
    } else {
      team1Count++;
      team1Health += Health.current[eid];
    }
  }

  console.log(`=== MATCH RESULTS ===`);
  console.log(`Team 0 (Blue): ${team0Count} units, ${team0Health.toFixed(0)} total health`);
  console.log(`Team 1 (Red): ${team1Count} units, ${team1Health.toFixed(0)} total health`);

  if (team0Count > team1Count) {
    console.log(`🏆 TEAM 0 (BLUE) WINS!`);
  } else if (team1Count > team0Count) {
    console.log(`🏆 TEAM 1 (RED) WINS!`);
  } else if (team0Health > team1Health) {
    console.log(`🏆 TEAM 0 (BLUE) WINS BY HEALTH!`);
  } else if (team1Health > team0Health) {
    console.log(`🏆 TEAM 1 (RED) WINS BY HEALTH!`);
  } else {
    console.log(`🤝 DRAW!`);
  }
}

// Helper to get current showdown phase
export function getShowdownPhase(world: GameWorld): ShowdownPhase {
  const timerEntities = timerQuery(world);
  if (timerEntities.length > 0) {
    return ShowdownState.state[timerEntities[0]];
  }
  return ShowdownPhase.NORMAL;
}

// Helper to get time until next phase
export function getTimeUntilNextPhase(world: GameWorld): number {
  const timerEntities = timerQuery(world);
  if (timerEntities.length === 0) return Infinity;

  const timerEntity = timerEntities[0];
  const currentTime = GameTimer.totalTime[timerEntity];
  const currentPhase = ShowdownState.state[timerEntity];

  switch (currentPhase) {
    case ShowdownPhase.NORMAL:
      return PHASE_WARNING_TIME - currentTime;
    case ShowdownPhase.WARNING:
      return PHASE_COLLAPSE_TIME - currentTime;
    case ShowdownPhase.COLLAPSE:
      return PHASE_SHOWDOWN_TIME - currentTime;
    case ShowdownPhase.SHOWDOWN:
      return MATCH_END_TIME - currentTime;
    default:
      return 0;
  }
}