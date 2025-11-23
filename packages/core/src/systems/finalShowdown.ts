// Final Showdown System - The signature mechanic of RTS Arena
import { defineQuery, hasComponent } from 'bitecs';
import { GameWorld } from '../world';
import { Position, Team, Health, Dead, Teleporting, Velocity, Target } from '../components';

// Phase timing constants (in seconds)
const MATCH_DURATION = 150;      // 2:30 total match time
const WARNING_TIME = 120;        // 2:00 - Warning phase starts
const GLOW_TIME = 135;          // 2:15 - Screen edges glow red
const COUNTDOWN_TIME = 140;      // 2:20 - Countdown timer appears
const PREPARE_TIME = 145;        // 2:25 - Prepare for showdown
const SHOWDOWN_TIME = 150;       // 2:30 - TELEPORT & FINAL SHOWDOWN

// Arena center position
const ARENA_CENTER_X = 400;
const ARENA_CENTER_Y = 300;
const TELEPORT_RADIUS = 100;    // Spread units within this radius to avoid stacking

// Phase state type
export type GamePhase = 'normal' | 'warning' | 'glow' | 'countdown' | 'prepare' | 'showdown';

// Phase transition tracking
let currentPhase: GamePhase = 'normal';
let phaseTransitions = {
  warning: false,
  glow: false,
  countdown: false,
  prepare: false,
  showdown: false
};

// Victory detection state
let victoryState: 'ongoing' | 'team0' | 'team1' | 'draw' = 'ongoing';
let showdownStarted = false;
let autoAttackEnabled = false;

export function finalShowdownSystem(world: GameWorld): void {
  const gameTime = world.time || 0;

  // Phase state machine
  const newPhase = determinePhase(gameTime);

  // Handle phase transitions
  if (newPhase !== currentPhase) {
    handlePhaseTransition(world, currentPhase, newPhase, gameTime);
    currentPhase = newPhase;
  }

  // Handle showdown-specific logic
  if (currentPhase === 'showdown' && !showdownStarted) {
    initiateShowdown(world);
    showdownStarted = true;
  }

  // Auto-attack logic during showdown
  if (autoAttackEnabled) {
    performAutoAttack(world);
  }

  // Victory detection
  if (showdownStarted) {
    checkVictoryCondition(world);
  }

  // Store phase in world for UI updates
  world.gamePhase = currentPhase;
  world.victoryState = victoryState;
}

function determinePhase(gameTime: number): GamePhase {
  if (gameTime >= SHOWDOWN_TIME) return 'showdown';
  if (gameTime >= PREPARE_TIME) return 'prepare';
  if (gameTime >= COUNTDOWN_TIME) return 'countdown';
  if (gameTime >= GLOW_TIME) return 'glow';
  if (gameTime >= WARNING_TIME) return 'warning';
  return 'normal';
}

function handlePhaseTransition(
  world: GameWorld,
  oldPhase: GamePhase,
  newPhase: GamePhase,
  gameTime: number
): void {
  console.log(`🎮 Phase transition: ${oldPhase} -> ${newPhase} at ${gameTime.toFixed(1)}s`);

  // Trigger phase-specific events
  switch (newPhase) {
    case 'warning':
      if (!phaseTransitions.warning) {
        console.log('⚠️ ARENA COLLAPSE IN 30 SECONDS');
        world.phaseMessage = 'ARENA COLLAPSE IN 30 SECONDS';
        world.phaseMessageDuration = 3000; // Show for 3 seconds
        phaseTransitions.warning = true;
      }
      break;

    case 'glow':
      if (!phaseTransitions.glow) {
        console.log('🔴 Screen edges glowing red, music intensifies');
        world.phaseMessage = '';
        world.screenEffect = 'glow';
        phaseTransitions.glow = true;
      }
      break;

    case 'countdown':
      if (!phaseTransitions.countdown) {
        console.log('⏱️ Countdown timer appears');
        world.showCountdown = true;
        phaseTransitions.countdown = true;
      }
      break;

    case 'prepare':
      if (!phaseTransitions.prepare) {
        console.log('⚔️ PREPARE FOR FINAL SHOWDOWN');
        world.phaseMessage = 'PREPARE FOR FINAL SHOWDOWN';
        world.phaseMessageDuration = -1; // Keep showing
        world.screenEffect = 'intense-glow';
        phaseTransitions.prepare = true;
      }
      break;

    case 'showdown':
      if (!phaseTransitions.showdown) {
        console.log('💥 FINAL SHOWDOWN!');
        world.phaseMessage = 'FINAL SHOWDOWN!';
        world.phaseMessageDuration = 2000;
        world.screenEffect = 'flash';
        phaseTransitions.showdown = true;
      }
      break;
  }
}

function initiateShowdown(world: GameWorld): void {
  console.log('🚀 Initiating Final Showdown - Teleporting all units to center!');

  // Query all living units
  const unitQuery = defineQuery([Position, Team, Health]);
  const allUnits = unitQuery(world);

  let teleportedCount = 0;
  const teamCounts = { 0: 0, 1: 0 };

  for (const eid of allUnits) {
    // Skip dead units
    if (hasComponent(world, Dead, eid)) continue;

    const health = Health.current[eid];
    if (health <= 0) continue;

    // Add teleporting component
    Teleporting.startTime[eid] = world.time;
    Teleporting.endTime[eid] = world.time + 0.5; // 0.5 second teleport animation

    // Calculate new position with slight offset to prevent perfect stacking
    const angle = (Math.random() * Math.PI * 2);
    const distance = Math.random() * TELEPORT_RADIUS;

    Position.x[eid] = ARENA_CENTER_X + Math.cos(angle) * distance;
    Position.y[eid] = ARENA_CENTER_Y + Math.sin(angle) * distance;

    // Reset velocity and target
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    if (hasComponent(world, Target, eid)) {
      Target.reached[eid] = 1; // Mark target as reached
    }

    // Count teams
    const teamId = Team.id[eid];
    teamCounts[teamId]++;
    teleportedCount++;
  }

  console.log(`✅ Teleported ${teleportedCount} units to center`);
  console.log(`   Team 0 (Blue): ${teamCounts[0]} units`);
  console.log(`   Team 1 (Red): ${teamCounts[1]} units`);

  // Enable auto-attack mode
  autoAttackEnabled = true;
  world.autoAttackMode = true;
}

function performAutoAttack(world: GameWorld): void {
  // This will be handled by the combat system
  // We just set a flag here that the combat system can check
  world.forceAutoAttack = true;
}

function checkVictoryCondition(world: GameWorld): void {
  const unitQuery = defineQuery([Team, Health]);
  const allUnits = unitQuery(world);

  const aliveCounts = { 0: 0, 1: 0 };

  for (const eid of allUnits) {
    if (hasComponent(world, Dead, eid)) continue;

    const health = Health.current[eid];
    if (health <= 0) continue;

    const teamId = Team.id[eid];
    aliveCounts[teamId]++;
  }

  // Check victory conditions
  if (aliveCounts[0] === 0 && aliveCounts[1] === 0) {
    // Extremely rare - both teams eliminated simultaneously
    if (victoryState === 'ongoing') {
      victoryState = 'draw';
      console.log('🤝 DRAW - Both teams eliminated!');
      world.gameOver = true;
    }
  } else if (aliveCounts[0] === 0) {
    // Team 1 (Red) wins
    if (victoryState === 'ongoing') {
      victoryState = 'team1';
      console.log('🔴 TEAM 1 (RED) WINS!');
      world.winner = 1;
      world.gameOver = true;
    }
  } else if (aliveCounts[1] === 0) {
    // Team 0 (Blue) wins
    if (victoryState === 'ongoing') {
      victoryState = 'team0';
      console.log('🔵 TEAM 0 (BLUE) WINS!');
      world.winner = 0;
      world.gameOver = true;
    }
  }

  // Continue battle if both teams have units
  // No draws allowed - battle continues until one team is eliminated
}

// Reset function for new matches
export function resetFinalShowdown(): void {
  currentPhase = 'normal';
  phaseTransitions = {
    warning: false,
    glow: false,
    countdown: false,
    prepare: false,
    showdown: false
  };
  victoryState = 'ongoing';
  showdownStarted = false;
  autoAttackEnabled = false;
}

// Export phase timing for UI use
export const PHASE_TIMINGS = {
  MATCH_DURATION,
  WARNING_TIME,
  GLOW_TIME,
  COUNTDOWN_TIME,
  PREPARE_TIME,
  SHOWDOWN_TIME
};