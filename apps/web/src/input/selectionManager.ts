import { addComponent, removeComponent, hasComponent, defineQuery } from 'bitecs';
import { Position, Selected, MoveTarget, Team } from '@rts-arena/core';

const selectableQuery = defineQuery([Position, Team]);

export class SelectionManager {
  private world: any;
  private selectedEntities: Set<number> = new Set();
  private controlGroups: Map<number, Set<number>> = new Map();
  private onMoveTargetCallback?: (x: number, y: number) => void;

  constructor(world: any) {
    this.world = world;
    this.setupKeyboardListeners();
  }

  setMoveTargetCallback(callback: (x: number, y: number) => void) {
    this.onMoveTargetCallback = callback;
  }

  getSelectedEntities(): Set<number> {
    return this.selectedEntities;
  }

  selectAtPoint(x: number, y: number) {
    const entities = selectableQuery(this.world);
    const clickRadius = 20; // Click tolerance

    console.log(`[Selection] Click at (${x.toFixed(0)}, ${y.toFixed(0)}), checking ${entities.length} entities`);

    // Clear previous selection
    this.clearSelection();

    // Find closest entity to click point
    let closestEntity = -1;
    let closestDist = clickRadius;

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Only select blue team (Team 0) for now
      if (Team.id[eid] !== 0) continue;

      const dx = Position.x[eid] - x;
      const dy = Position.y[eid] - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      console.log(`[Selection] Entity ${eid} at (${Position.x[eid].toFixed(0)}, ${Position.y[eid].toFixed(0)}), dist=${dist.toFixed(1)}`);

      if (dist < closestDist) {
        closestEntity = eid;
        closestDist = dist;
      }
    }

    console.log(`[Selection] Closest entity: ${closestEntity}, dist: ${closestDist.toFixed(1)}`);

    if (closestEntity !== -1) {
      this.addToSelection(closestEntity);
    }
  }

  selectInBox(minX: number, minY: number, maxX: number, maxY: number) {
    const entities = selectableQuery(this.world);

    // Clear previous selection
    this.clearSelection();

    // Select all entities in box
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Only select blue team (Team 0)
      if (Team.id[eid] !== 0) continue;

      const x = Position.x[eid];
      const y = Position.y[eid];

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        this.addToSelection(eid);
      }
    }
  }

  private addToSelection(eid: number) {
    this.selectedEntities.add(eid);

    if (!hasComponent(this.world, Selected, eid)) {
      addComponent(this.world, Selected, eid);
    }
    Selected.isSelected[eid] = 1;
  }

  private clearSelection() {
    for (const eid of this.selectedEntities) {
      if (hasComponent(this.world, Selected, eid)) {
        Selected.isSelected[eid] = 0;
        removeComponent(this.world, Selected, eid);
      }
    }
    this.selectedEntities.clear();
  }

  setMoveTarget(x: number, y: number) {
    for (const eid of this.selectedEntities) {
      if (!hasComponent(this.world, MoveTarget, eid)) {
        addComponent(this.world, MoveTarget, eid);
      }

      MoveTarget.x[eid] = x;
      MoveTarget.y[eid] = y;
      MoveTarget.active[eid] = 1;
    }

    console.log(`Move command: ${this.selectedEntities.size} units to (${x.toFixed(0)}, ${y.toFixed(0)})`);

    // Trigger visual feedback
    if (this.onMoveTargetCallback && this.selectedEntities.size > 0) {
      this.onMoveTargetCallback(x, y);
    }
  }

  private setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Ctrl + Number: Save control group
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        const groupNum = parseInt(e.key);
        this.saveControlGroup(groupNum);
        e.preventDefault();
      }
      // Number: Recall control group
      else if (e.key >= '1' && e.key <= '9' && !e.ctrlKey) {
        const groupNum = parseInt(e.key);
        this.recallControlGroup(groupNum);
        e.preventDefault();
      }
    });
  }

  private saveControlGroup(groupNum: number) {
    if (this.selectedEntities.size > 0) {
      this.controlGroups.set(groupNum, new Set(this.selectedEntities));
      console.log(`Saved ${this.selectedEntities.size} units to group ${groupNum}`);
    }
  }

  private recallControlGroup(groupNum: number) {
    const group = this.controlGroups.get(groupNum);
    if (group) {
      this.clearSelection();
      for (const eid of group) {
        // Check if entity still exists
        if (hasComponent(this.world, Position, eid)) {
          this.addToSelection(eid);
        }
      }
      console.log(`Recalled group ${groupNum}: ${this.selectedEntities.size} units`);
    }
  }
}
