// Mouse Input Handler
import { Application } from 'pixi.js';
import { FederatedPointerEvent } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { Position, Team, Selected } from '@rts-arena/core';
import { addComponent, hasComponent, defineQuery } from 'bitecs';
import { SelectionManager } from '../selection/selection';
import { BoxSelect } from '../selection/box-select';

// Mouse state
export interface MouseState {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  leftDown: boolean;
  rightDown: boolean;
  dragStart: { x: number; y: number } | null;
  isDragging: boolean;
}

export class MouseInput {
  private app: Application;
  private world: GameWorld;
  private state: MouseState;
  private selectionManager: SelectionManager;
  private boxSelect: BoxSelect;
  private playerTeamId: number = 0; // Player controls team 0
  private unitQuery = defineQuery([Position, Team]);

  constructor(
    app: Application,
    world: GameWorld,
    selectionManager: SelectionManager,
    boxSelect: BoxSelect
  ) {
    this.app = app;
    this.world = world;
    this.selectionManager = selectionManager;
    this.boxSelect = boxSelect;

    this.state = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      leftDown: false,
      rightDown: false,
      dragStart: null,
      isDragging: false,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Make stage interactive
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.renderer.screen;

    // Mouse move
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));

    // Mouse down
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));

    // Mouse up
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));

    // Mouse leave (cleanup)
    this.app.stage.on('pointerleave', this.onPointerLeave.bind(this));
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    // Update mouse position
    this.state.x = event.clientX;
    this.state.y = event.clientY;

    // Convert to world coordinates (for now, 1:1 mapping, will add camera transform later)
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    this.state.worldX = worldPos.x;
    this.state.worldY = worldPos.y;

    // Handle drag
    if (this.state.leftDown && this.state.dragStart) {
      const dragDistance = Math.hypot(
        event.clientX - this.state.dragStart.x,
        event.clientY - this.state.dragStart.y
      );

      if (dragDistance > 5 && !this.state.isDragging) {
        // Start drag selection
        this.state.isDragging = true;
        this.boxSelect.startSelection(this.state.dragStart.x, this.state.dragStart.y);
      }

      if (this.state.isDragging) {
        // Update box selection
        this.boxSelect.updateSelection(event.clientX, event.clientY);
      }
    }
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    if (event.button === 0) {
      // Left click
      this.state.leftDown = true;
      this.state.dragStart = { x: event.clientX, y: event.clientY };
    } else if (event.button === 2) {
      // Right click
      this.state.rightDown = true;
      this.handleRightClick(event);
    }
  }

  private onPointerUp(event: FederatedPointerEvent): void {
    if (event.button === 0) {
      // Left click release
      if (this.state.isDragging) {
        // End box selection
        const selectedUnits = this.boxSelect.endSelection(this.world, this.playerTeamId);
        this.selectionManager.handleBoxSelection(selectedUnits, event.shiftKey);
      } else {
        // Single click selection
        this.handleLeftClick(event);
      }

      this.state.leftDown = false;
      this.state.dragStart = null;
      this.state.isDragging = false;
    } else if (event.button === 2) {
      // Right click release
      this.state.rightDown = false;
    }
  }

  private onPointerLeave(event: FederatedPointerEvent): void {
    // Cleanup when mouse leaves the canvas
    if (this.state.isDragging) {
      this.boxSelect.cancelSelection();
    }
    this.state.leftDown = false;
    this.state.rightDown = false;
    this.state.dragStart = null;
    this.state.isDragging = false;
  }

  private handleLeftClick(event: FederatedPointerEvent): void {
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    const clickedUnit = this.getUnitAtPosition(worldPos.x, worldPos.y);

    if (clickedUnit !== null) {
      // Check if it's our team
      if (Team.id[clickedUnit] === this.playerTeamId) {
        if (event.shiftKey) {
          // Add to selection
          this.selectionManager.addToSelection(clickedUnit);
        } else {
          // Single selection
          this.selectionManager.selectUnit(clickedUnit);
        }
      }
    } else {
      // Clicked empty space - deselect all unless shift is held
      if (!event.shiftKey) {
        this.selectionManager.clearSelection();
      }
    }
  }

  private handleRightClick(event: FederatedPointerEvent): void {
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    const clickedUnit = this.getUnitAtPosition(worldPos.x, worldPos.y);

    if (clickedUnit !== null && Team.id[clickedUnit] !== this.playerTeamId) {
      // Right-clicked enemy unit - attack move
      this.selectionManager.issueAttackOrder(clickedUnit);
    } else {
      // Right-clicked ground - move order
      this.selectionManager.issueMoveOrder(worldPos.x, worldPos.y);
    }
  }

  private getUnitAtPosition(x: number, y: number): number | null {
    const units = this.unitQuery(this.world);
    const UNIT_RADIUS = 20; // Match the visual radius from test-scene

    for (const eid of units) {
      const distance = Math.hypot(Position.x[eid] - x, Position.y[eid] - y);
      if (distance <= UNIT_RADIUS) {
        return eid;
      }
    }

    return null;
  }

  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    // For now, simple 1:1 mapping
    // Will be updated when camera system is implemented
    const rect = this.app.canvas.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top,
    };
  }

  public getState(): Readonly<MouseState> {
    return this.state;
  }

  public dispose(): void {
    this.app.stage.off('pointermove');
    this.app.stage.off('pointerdown');
    this.app.stage.off('pointerup');
    this.app.stage.off('pointerleave');
  }
}