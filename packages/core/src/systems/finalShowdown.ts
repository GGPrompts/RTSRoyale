import { defineQuery, hasComponent, addComponent, IWorld } from 'bitecs';
import { Position, Team, Health, Dead, Teleporting } from '../components';

export enum GamePhase {
  NORMAL = 'normal',
  WARNING = 'warning',
  COLLAPSE = 'collapse',
  SHOWDOWN = 'showdown',
  VICTORY = 'victory'
}

export interface ShowdownState {
  phase: GamePhase;
  elapsedTime: number;
  victor: number | null; // Team ID of winner
  teleportTriggered: boolean;
  warningShown: boolean;
  collapseShown: boolean;
}

export interface FinalShowdownWorld extends IWorld {
  time: {
    delta: number;
    elapsed: number;
  };
  showdown?: ShowdownState;
}

const livingQuery = defineQuery([Position, Health, Team]);

export function finalShowdownSystem(world: FinalShowdownWorld): FinalShowdownWorld {
  // Initialize showdown state if not exists
  if (!world.showdown) {
    world.showdown = {
      phase: GamePhase.NORMAL,
      elapsedTime: 0,
      victor: null,
      teleportTriggered: false,
      warningShown: false,
      collapseShown: false
    } as ShowdownState;
  }

  // Initialize time if not exists
  if (!world.time) {
    world.time = {
      delta: 0,
      elapsed: 0
    };
  }

  const state = world.showdown as ShowdownState;
  const deltaTime = world.time.delta;

  // Update elapsed time
  state.elapsedTime += deltaTime;

  // Phase transitions based on time (in seconds)
  // Game timeline: 2:30 total (150 seconds)
  // 2:00 (120s) - Warning
  // 2:25 (145s) - Collapse
  // 2:30 (150s) - Showdown

  if (state.phase === GamePhase.NORMAL && state.elapsedTime >= 120) {
    state.phase = GamePhase.WARNING;
    if (!state.warningShown) {
      console.log('[FINAL SHOWDOWN] WARNING PHASE - 30 seconds until collapse!');
      state.warningShown = true;
    }
  }

  if (state.phase === GamePhase.WARNING && state.elapsedTime >= 145) {
    state.phase = GamePhase.COLLAPSE;
    if (!state.collapseShown) {
      console.log('[FINAL SHOWDOWN] COLLAPSE PHASE - 5 seconds until teleport!');
      state.collapseShown = true;
    }
  }

  if (state.phase === GamePhase.COLLAPSE && state.elapsedTime >= 150) {
    state.phase = GamePhase.SHOWDOWN;
    if (!state.teleportTriggered) {
      console.log('[FINAL SHOWDOWN] TELEPORTING ALL UNITS TO CENTER!');
      teleportAllUnits(world);
      state.teleportTriggered = true;
    }
  }

  // Victory detection - check after showdown phase starts
  if (state.phase === GamePhase.SHOWDOWN && state.victor === null) {
    const teamCounts = countLivingTeams(world);

    if (teamCounts.size === 1) {
      const [victorTeam] = teamCounts.keys();
      state.victor = victorTeam;
      state.phase = GamePhase.VICTORY;
      console.log(`[FINAL SHOWDOWN] VICTORY! Team ${victorTeam} wins!`);
    } else if (teamCounts.size === 0) {
      state.phase = GamePhase.VICTORY;
      state.victor = -1; // Draw
      console.log('[FINAL SHOWDOWN] DRAW - All units eliminated!');
    }
  }

  return world;
}

function teleportAllUnits(world: FinalShowdownWorld) {
  const entities = livingQuery(world);
  const centerX = 960;  // Arena center X
  const centerY = 540;  // Arena center Y
  let teleportedCount = 0;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Skip dead entities
    if (hasComponent(world, Dead, eid)) continue;

    // Add teleporting component for visual effect
    addComponent(world, Teleporting, eid);
    Teleporting.startTime[eid] = world.showdown!.elapsedTime;
    Teleporting.endTime[eid] = world.showdown!.elapsedTime + 0.5; // 0.5 second teleport effect

    // Teleport to center with random offset to prevent stacking
    const offsetX = (Math.random() - 0.5) * 100; // ±50 pixels
    const offsetY = (Math.random() - 0.5) * 100; // ±50 pixels

    Position.x[eid] = centerX + offsetX;
    Position.y[eid] = centerY + offsetY;

    teleportedCount++;
  }

  console.log(`[FINAL SHOWDOWN] Teleported ${teleportedCount} units to center`);
}

function countLivingTeams(world: FinalShowdownWorld): Map<number, number> {
  const entities = livingQuery(world);
  const teamCounts = new Map<number, number>();

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Skip dead entities
    if (hasComponent(world, Dead, eid)) continue;

    // Check if unit has health > 0
    if (Health.current[eid] <= 0) continue;

    const teamId = Team.id[eid];
    teamCounts.set(teamId, (teamCounts.get(teamId) || 0) + 1);
  }

  return teamCounts;
}

// Helper functions for UI and rendering
export function getTimeRemaining(world: FinalShowdownWorld): number {
  if (!world.showdown) return 150;
  return Math.max(0, 150 - world.showdown.elapsedTime);
}

export function getCurrentPhase(world: FinalShowdownWorld): GamePhase {
  if (!world.showdown) return GamePhase.NORMAL;
  return world.showdown.phase;
}

export function getVictor(world: FinalShowdownWorld): number | null {
  if (!world.showdown) return null;
  return world.showdown.victor;
}

export function isShowdownActive(world: FinalShowdownWorld): boolean {
  if (!world.showdown) return false;
  return world.showdown.phase === GamePhase.SHOWDOWN;
}

// Format time for display (MM:SS)
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Get warning message for current phase
export function getPhaseWarning(world: FinalShowdownWorld): string {
  const phase = getCurrentPhase(world);

  switch (phase) {
    case GamePhase.WARNING:
      return 'ARENA COLLAPSE IN 30 SECONDS';
    case GamePhase.COLLAPSE:
      return 'PREPARE FOR FINAL SHOWDOWN';
    case GamePhase.SHOWDOWN:
      return 'FINAL SHOWDOWN!';
    case GamePhase.VICTORY:
      const victor = getVictor(world);
      if (victor === -1) return 'DRAW!';
      if (victor !== null) return `TEAM ${victor} WINS!`;
      return '';
    default:
      return '';
  }
}

// Get phase color for UI styling
export function getPhaseColor(world: FinalShowdownWorld): string {
  const phase = getCurrentPhase(world);

  switch (phase) {
    case GamePhase.WARNING:
      return '#ffff00'; // Yellow
    case GamePhase.COLLAPSE:
      return '#ff8800'; // Orange
    case GamePhase.SHOWDOWN:
      return '#ff0000'; // Red
    case GamePhase.VICTORY:
      return '#ffd700'; // Gold
    default:
      return '#ffffff'; // White
  }
}