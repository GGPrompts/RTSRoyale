// Selection State Management
import { GameWorld } from '@rts-arena/core';
import { Position, Selected, Target, Team } from '@rts-arena/core';
import { defineQuery, addComponent, removeComponent, hasComponent } from 'bitecs';
import { Graphics, Application } from 'pixi.js';

export class SelectionManager {
  private world: GameWorld;
  private selectedUnits: Set<number> = new Set();
  private controlGroups: Map<number, Set<number>> = new Map();
  private currentControlGroup: number | null = null;
  private selectableQuery = defineQuery([Position, Team]);
  private selectedQuery = defineQuery([Selected]);
  private app: Application;
  private moveIndicator: Graphics | null = null;
  private selectionIndicators: Map<number, Graphics> = new Map();

  constructor(world: GameWorld, app: Application) {
    this.world = world;
    this.app = app;

    // Initialize control groups (1-9)
    for (let i = 1; i <= 9; i++) {
      this.controlGroups.set(i, new Set());
    }
  }

  // Single unit selection
  public selectUnit(entityId: number): void {
    this.clearSelection();
    this.addToSelection(entityId);
  }

  // Add unit to current selection
  public addToSelection(entityId: number): void {
    if (!hasComponent(this.world, entityId, Selected)) {
      addComponent(this.world, entityId, Selected);
    }
    Selected.value[entityId] = 1;
    this.selectedUnits.add(entityId);
    this.createSelectionIndicator(entityId);
  }

  // Remove unit from selection
  public removeFromSelection(entityId: number): void {
    if (hasComponent(this.world, entityId, Selected)) {
      Selected.value[entityId] = 0;
      removeComponent(this.world, entityId, Selected);
    }
    this.selectedUnits.delete(entityId);
    this.removeSelectionIndicator(entityId);
  }

  // Clear all selections
  public clearSelection(): void {
    const selected = this.selectedQuery(this.world);
    for (const eid of selected) {
      Selected.value[eid] = 0;
      removeComponent(this.world, eid, Selected);
      this.removeSelectionIndicator(eid);
    }
    this.selectedUnits.clear();
  }

  // Box selection
  public handleBoxSelection(units: number[], addToExisting: boolean): void {
    if (!addToExisting) {
      this.clearSelection();
    }

    for (const eid of units) {
      this.addToSelection(eid);
    }
  }

  // Control group management
  public assignControlGroup(groupNumber: number): void {
    if (groupNumber < 1 || groupNumber > 9) return;

    const group = new Set(this.selectedUnits);
    this.controlGroups.set(groupNumber, group);
    this.currentControlGroup = groupNumber;

    // Visual feedback - flash selection
    this.flashSelection();
  }

  public recallControlGroup(groupNumber: number): void {
    if (groupNumber < 1 || groupNumber > 9) return;

    const group = this.controlGroups.get(groupNumber);
    if (!group || group.size === 0) return;

    this.clearSelection();

    // Filter out dead/removed entities
    const validUnits: number[] = [];
    for (const eid of group) {
      if (hasComponent(this.world, eid, Position)) {
        validUnits.push(eid);
      }
    }

    // Update the control group with valid units only
    if (validUnits.length > 0) {
      this.controlGroups.set(groupNumber, new Set(validUnits));
      for (const eid of validUnits) {
        this.addToSelection(eid);
      }
      this.currentControlGroup = groupNumber;
    } else {
      // Clear empty group
      this.controlGroups.set(groupNumber, new Set());
    }
  }

  public getActiveControlGroups(): number[] {
    const active: number[] = [];
    for (let i = 1; i <= 9; i++) {
      const group = this.controlGroups.get(i);
      if (group && group.size > 0) {
        active.push(i);
      }
    }
    return active;
  }

  public getCurrentControlGroup(): number | null {
    return this.currentControlGroup;
  }

  // Movement orders
  public issueMoveOrder(targetX: number, targetY: number): void {
    if (this.selectedUnits.size === 0) return;

    // Show move indicator
    this.showMoveIndicator(targetX, targetY);

    // Formation calculation - simple grid formation
    const units = Array.from(this.selectedUnits);
    const squadSize = Math.ceil(Math.sqrt(units.length));
    const spacing = 40; // Units between units in formation

    units.forEach((eid, index) => {
      if (!hasComponent(this.world, eid, Target)) {
        addComponent(this.world, eid, Target);
      }

      // Calculate formation position
      const row = Math.floor(index / squadSize);
      const col = index % squadSize;

      const offsetX = (col - squadSize / 2) * spacing;
      const offsetY = (row - squadSize / 2) * spacing;

      Target.x[eid] = targetX + offsetX;
      Target.y[eid] = targetY + offsetY;
      Target.reached[eid] = 0;
    });
  }

  // Attack order (simplified - targets a specific unit)
  public issueAttackOrder(targetEntity: number): void {
    if (this.selectedUnits.size === 0) return;
    if (!hasComponent(this.world, targetEntity, Position)) return;

    const targetPos = {
      x: Position.x[targetEntity],
      y: Position.y[targetEntity],
    };

    // For now, just move towards the target
    // Full combat system would handle actual attacking
    this.issueMoveOrder(targetPos.x, targetPos.y);

    // Show attack indicator (red move indicator)
    this.showMoveIndicator(targetPos.x, targetPos.y, 0xff0000);
  }

  // Get center of selection for camera
  public getSelectionCenter(): { x: number; y: number } | null {
    if (this.selectedUnits.size === 0) return null;

    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (const eid of this.selectedUnits) {
      if (hasComponent(this.world, eid, Position)) {
        sumX += Position.x[eid];
        sumY += Position.y[eid];
        count++;
      }
    }

    if (count === 0) return null;

    return {
      x: sumX / count,
      y: sumY / count,
    };
  }

  // Visual feedback
  private createSelectionIndicator(entityId: number): void {
    if (this.selectionIndicators.has(entityId)) return;

    const indicator = new Graphics();

    // Draw selection circle
    indicator.circle(0, 0, 25);
    indicator.stroke({ color: 0x00ff00, width: 2, alpha: 0.8 });

    // Add pulsing inner circle
    indicator.circle(0, 0, 22);
    indicator.stroke({ color: 0x00ff00, width: 1, alpha: 0.4 });

    this.app.stage.addChild(indicator);
    this.selectionIndicators.set(entityId, indicator);

    // Position it under the unit
    indicator.zIndex = -1;
  }

  private removeSelectionIndicator(entityId: number): void {
    const indicator = this.selectionIndicators.get(entityId);
    if (indicator) {
      this.app.stage.removeChild(indicator);
      indicator.destroy();
      this.selectionIndicators.delete(entityId);
    }
  }

  private showMoveIndicator(x: number, y: number, color: number = 0x00ff00): void {
    // Remove existing indicator
    if (this.moveIndicator) {
      this.app.stage.removeChild(this.moveIndicator);
      this.moveIndicator.destroy();
    }

    // Create new move indicator
    this.moveIndicator = new Graphics();

    // Outer ring
    this.moveIndicator.circle(x, y, 15);
    this.moveIndicator.stroke({ color, width: 3, alpha: 1 });

    // Inner circle
    this.moveIndicator.circle(x, y, 5);
    this.moveIndicator.fill({ color, alpha: 0.5 });

    // Add crosshair
    this.moveIndicator.moveTo(x - 20, y);
    this.moveIndicator.lineTo(x + 20, y);
    this.moveIndicator.moveTo(x, y - 20);
    this.moveIndicator.lineTo(x, y + 20);
    this.moveIndicator.stroke({ color, width: 1, alpha: 0.7 });

    this.app.stage.addChild(this.moveIndicator);

    // Fade out after 2 seconds
    setTimeout(() => {
      if (this.moveIndicator) {
        this.app.stage.removeChild(this.moveIndicator);
        this.moveIndicator.destroy();
        this.moveIndicator = null;
      }
    }, 2000);
  }

  private flashSelection(): void {
    // Flash effect for control group assignment
    for (const indicator of this.selectionIndicators.values()) {
      const originalAlpha = indicator.alpha;
      indicator.alpha = 1;
      indicator.tint = 0xffff00; // Yellow flash

      setTimeout(() => {
        indicator.alpha = originalAlpha;
        indicator.tint = 0xffffff;
      }, 200);
    }
  }

  // Update selection indicators position
  public update(): void {
    for (const [eid, indicator] of this.selectionIndicators) {
      if (hasComponent(this.world, eid, Position)) {
        indicator.x = Position.x[eid];
        indicator.y = Position.y[eid];
      }
    }
  }

  public getSelectedUnits(): number[] {
    return Array.from(this.selectedUnits);
  }

  public getSelectionCount(): number {
    return this.selectedUnits.size;
  }

  public dispose(): void {
    this.clearSelection();
    for (const indicator of this.selectionIndicators.values()) {
      indicator.destroy();
    }
    if (this.moveIndicator) {
      this.moveIndicator.destroy();
    }
  }
}