// Selection System - Handles unit selection logic
import { defineQuery, removeComponent, addComponent, hasComponent } from 'bitecs';
import { Position, Selected, Selectable, Team, MoveTarget, Target, ControlGroup } from '../components';
import { GameWorld } from '../world';

const selectableQuery = defineQuery([Position, Selectable, Team]);
const selectedQuery = defineQuery([Selected]);
const moveableQuery = defineQuery([Selected, Position]);

// Player team (for now, hardcoded to team 0 - blue team)
const PLAYER_TEAM = 0;

export interface SelectionRequest {
  type: 'click' | 'box' | 'control-group' | 'clear';
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  groupId?: number;
  addToSelection?: boolean;
}

export interface MoveCommand {
  x: number;
  y: number;
}

export function selectionSystem(world: GameWorld, request?: SelectionRequest): void {
  if (!request) return;

  const entities = selectableQuery(world);

  switch (request.type) {
    case 'click':
      handleClickSelection(world, entities, request.x!, request.y!, request.addToSelection);
      break;
    case 'box':
      handleBoxSelection(world, entities, request.x!, request.y!, request.x2!, request.y2!);
      break;
    case 'control-group':
      handleControlGroupSelection(world, request.groupId!);
      break;
    case 'clear':
      clearSelection(world);
      break;
  }
}

function handleClickSelection(
  world: GameWorld,
  entities: number[],
  x: number,
  y: number,
  addToSelection?: boolean
): void {
  const CLICK_RADIUS = 30; // Pixels
  let closestEntity = -1;
  let closestDistance = Infinity;

  // Find the closest selectable entity to the click point
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Only select units from the player's team
    if (Team.id[eid] !== PLAYER_TEAM) continue;

    const dx = Position.x[eid] - x;
    const dy = Position.y[eid] - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < CLICK_RADIUS && distance < closestDistance) {
      closestEntity = eid;
      closestDistance = distance;
    }
  }

  // Clear existing selection unless adding to selection
  if (!addToSelection) {
    clearSelection(world);
  }

  // Select the clicked entity
  if (closestEntity !== -1) {
    if (!hasComponent(world, Selected, closestEntity)) {
      addComponent(world, Selected, closestEntity);
    }
    Selected.value[closestEntity] = 1;
  }
}

function handleBoxSelection(
  world: GameWorld,
  entities: number[],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  // Calculate box bounds
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  // Clear existing selection
  clearSelection(world);

  // Select all player units within the box
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Only select units from the player's team
    if (Team.id[eid] !== PLAYER_TEAM) continue;

    const x = Position.x[eid];
    const y = Position.y[eid];

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      if (!hasComponent(world, Selected, eid)) {
        addComponent(world, Selected, eid);
      }
      Selected.value[eid] = 1;
    }
  }
}

function handleControlGroupSelection(world: GameWorld, groupId: number): void {
  // Clear existing selection
  clearSelection(world);

  // Select all units in the control group
  const controlGroupQuery = defineQuery([ControlGroup, Position, Selectable]);
  const entities = controlGroupQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    if (ControlGroup.groupId[eid] === groupId) {
      if (!hasComponent(world, Selected, eid)) {
        addComponent(world, Selected, eid);
      }
      Selected.value[eid] = 1;
    }
  }
}

export function assignControlGroup(world: GameWorld, groupId: number): void {
  const selectedEntities = selectedQuery(world);

  // First, clear any existing units in this control group
  const controlGroupQuery = defineQuery([ControlGroup]);
  const allWithGroups = controlGroupQuery(world);

  for (let i = 0; i < allWithGroups.length; i++) {
    const eid = allWithGroups[i];
    if (ControlGroup.groupId[eid] === groupId) {
      ControlGroup.groupId[eid] = 0; // Clear group assignment
    }
  }

  // Assign selected units to the control group
  for (let i = 0; i < selectedEntities.length; i++) {
    const eid = selectedEntities[i];
    if (!hasComponent(world, ControlGroup, eid)) {
      addComponent(world, ControlGroup, eid);
    }
    ControlGroup.groupId[eid] = groupId;
  }
}

function clearSelection(world: GameWorld): void {
  const selected = selectedQuery(world);

  for (let i = 0; i < selected.length; i++) {
    const eid = selected[i];
    Selected.value[eid] = 0;
    removeComponent(world, Selected, eid);
  }
}

export function issueMoveCommand(world: GameWorld, command: MoveCommand): void {
  const selectedEntities = moveableQuery(world);

  for (let i = 0; i < selectedEntities.length; i++) {
    const eid = selectedEntities[i];

    // Add MoveTarget component if not present
    if (!hasComponent(world, MoveTarget, eid)) {
      addComponent(world, MoveTarget, eid);
    }

    // Set the move target
    MoveTarget.x[eid] = command.x;
    MoveTarget.y[eid] = command.y;
    MoveTarget.active[eid] = 1;

    // Also update the Target component for pathfinding
    if (!hasComponent(world, Target, eid)) {
      addComponent(world, Target, eid);
    }
    Target.x[eid] = command.x;
    Target.y[eid] = command.y;
    Target.reached[eid] = 0;
  }
}