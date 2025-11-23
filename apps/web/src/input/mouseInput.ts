import { Application, FederatedPointerEvent } from 'pixi.js';
import { SelectionManager } from './selectionManager';

export class MouseInputHandler {
  private app: Application;
  private selectionManager: SelectionManager;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragEndX = 0;
  private dragEndY = 0;

  constructor(app: Application, selectionManager: SelectionManager) {
    this.app = app;
    this.selectionManager = selectionManager;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const stage = this.app.stage;

    // Make stage interactive
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    // Mouse down - start selection or click
    stage.on('pointerdown', (e: FederatedPointerEvent) => {
      if (e.button === 0) { // Left click
        this.isDragging = true;
        this.dragStartX = e.globalX;
        this.dragStartY = e.globalY;
        this.dragEndX = e.globalX;
        this.dragEndY = e.globalY;
      } else if (e.button === 2) { // Right click
        this.handleMoveCommand(e.globalX, e.globalY);
      }
    });

    // Mouse move - update drag box
    stage.on('pointermove', (e: FederatedPointerEvent) => {
      if (this.isDragging) {
        this.dragEndX = e.globalX;
        this.dragEndY = e.globalY;
      }
    });

    // Mouse up - finish selection
    stage.on('pointerup', (e: FederatedPointerEvent) => {
      if (e.button === 0 && this.isDragging) {
        this.isDragging = false;
        this.handleSelection();
      }
    });

    // Prevent right-click context menu
    this.app.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private handleSelection() {
    const minX = Math.min(this.dragStartX, this.dragEndX);
    const maxX = Math.max(this.dragStartX, this.dragEndX);
    const minY = Math.min(this.dragStartY, this.dragEndY);
    const maxY = Math.max(this.dragStartY, this.dragEndY);

    // Check if it was a click (small drag distance)
    const isClick = Math.abs(maxX - minX) < 5 && Math.abs(maxY - minY) < 5;

    if (isClick) {
      this.selectionManager.selectAtPoint(this.dragStartX, this.dragStartY);
    } else {
      this.selectionManager.selectInBox(minX, minY, maxX, maxY);
    }
  }

  private handleMoveCommand(x: number, y: number) {
    this.selectionManager.setMoveTarget(x, y);
  }

  getDragBox(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    if (!this.isDragging) return null;

    return {
      minX: Math.min(this.dragStartX, this.dragEndX),
      maxX: Math.max(this.dragStartX, this.dragEndX),
      minY: Math.min(this.dragStartY, this.dragEndY),
      maxY: Math.max(this.dragStartY, this.dragEndY)
    };
  }
}
