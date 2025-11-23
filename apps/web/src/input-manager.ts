// Input Manager - Handles mouse and keyboard input for RTS controls
import { Application, Graphics, Text } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import {
  selectionSystem,
  issueMoveCommand,
  assignControlGroup,
  type SelectionRequest,
} from '@rts-arena/core';

export class InputManager {
  private app: Application;
  private world: GameWorld;

  // Mouse state
  private mouseDown = false;
  private dragStart = { x: 0, y: 0 };
  private currentMouse = { x: 0, y: 0 };
  private isDragging = false;

  // Visual elements
  private selectionBox: Graphics;
  private moveIndicator: Graphics;
  private controlGroupUI: Text;

  // Control groups (1-9)
  private controlGroups = new Map<number, Set<number>>();

  // Keyboard state
  private keysPressed = new Set<string>();

  constructor(app: Application, world: GameWorld) {
    this.app = app;
    this.world = world;

    // Create visual elements
    this.selectionBox = new Graphics();
    this.moveIndicator = new Graphics();
    this.controlGroupUI = new Text({
      text: '',
      style: {
        fontSize: 14,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      }
    });

    // Add to stage but hidden initially
    this.selectionBox.visible = false;
    this.moveIndicator.visible = false;
    this.controlGroupUI.position.set(10, 100);

    app.stage.addChild(this.selectionBox);
    app.stage.addChild(this.moveIndicator);
    app.stage.addChild(this.controlGroupUI);

    this.setupEventListeners();
    this.updateControlGroupUI();
  }

  private setupEventListeners(): void {
    const canvas = this.app.canvas;

    // Mouse events
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleMouseDown(event: MouseEvent): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (event.button === 0) { // Left click
      this.mouseDown = true;
      this.dragStart = { x, y };
      this.currentMouse = { x, y };
      this.isDragging = false;
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.currentMouse = { x, y };

    if (this.mouseDown) {
      const dragDistance = Math.sqrt(
        Math.pow(x - this.dragStart.x, 2) +
        Math.pow(y - this.dragStart.y, 2)
      );

      if (dragDistance > 5) { // Minimum drag distance
        this.isDragging = true;
        this.updateSelectionBox();
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (event.button === 0 && this.mouseDown) { // Left click release
      if (this.isDragging) {
        // Box selection
        const request: SelectionRequest = {
          type: 'box',
          x: this.dragStart.x,
          y: this.dragStart.y,
          x2: x,
          y2: y,
        };
        selectionSystem(this.world, request);

        this.selectionBox.visible = false;
      } else {
        // Click selection
        const addToSelection = this.keysPressed.has('Shift');
        const request: SelectionRequest = {
          type: 'click',
          x,
          y,
          addToSelection,
        };
        selectionSystem(this.world, request);
      }

      this.mouseDown = false;
      this.isDragging = false;
    } else if (event.button === 2) { // Right click
      // Issue move command
      issueMoveCommand(this.world, { x, y });
      this.showMoveIndicator(x, y);
    }
  }

  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault(); // Prevent context menu
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keysPressed.add(event.key);

    // Control groups
    if (event.key >= '1' && event.key <= '9') {
      const groupId = parseInt(event.key);

      if (event.ctrlKey) {
        // Assign control group
        assignControlGroup(this.world, groupId);
        this.updateControlGroupUI();
      } else {
        // Select control group
        const request: SelectionRequest = {
          type: 'control-group',
          groupId,
        };
        selectionSystem(this.world, request);
      }
    }

    // Escape to deselect
    if (event.key === 'Escape') {
      const request: SelectionRequest = { type: 'clear' };
      selectionSystem(this.world, request);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key);
  }

  private updateSelectionBox(): void {
    this.selectionBox.clear();
    this.selectionBox.visible = true;

    const minX = Math.min(this.dragStart.x, this.currentMouse.x);
    const minY = Math.min(this.dragStart.y, this.currentMouse.y);
    const width = Math.abs(this.currentMouse.x - this.dragStart.x);
    const height = Math.abs(this.currentMouse.y - this.dragStart.y);

    // Draw selection box
    this.selectionBox.rect(minX, minY, width, height);
    this.selectionBox.fill({ color: 0x00ff00, alpha: 0.1 });
    this.selectionBox.rect(minX, minY, width, height);
    this.selectionBox.stroke({ color: 0x00ff00, width: 2, alpha: 0.8 });
  }

  private showMoveIndicator(x: number, y: number): void {
    this.moveIndicator.clear();
    this.moveIndicator.visible = true;

    // Draw move indicator (animated ring)
    const radius = 20;
    this.moveIndicator.circle(x, y, radius);
    this.moveIndicator.stroke({ color: 0x00ff00, width: 3, alpha: 0.8 });

    // Animate and fade out
    let alpha = 0.8;
    let scale = 1;
    const animate = () => {
      if (alpha <= 0) {
        this.moveIndicator.visible = false;
        return;
      }

      this.moveIndicator.clear();
      this.moveIndicator.circle(x, y, radius * scale);
      this.moveIndicator.stroke({ color: 0x00ff00, width: 3, alpha });

      alpha -= 0.02;
      scale += 0.03;

      requestAnimationFrame(animate);
    };
    animate();
  }

  private updateControlGroupUI(): void {
    // Check which control groups have units
    const activeGroups: number[] = [];

    // This is a simplified version - in production, you'd query the ECS world
    // to check which control groups have units assigned
    for (let i = 1; i <= 9; i++) {
      // You can query the world here to check if group i has units
      // For now, we'll just show the UI structure
    }

    // Update UI text
    const groupText = Array.from({ length: 9 }, (_, i) => {
      const num = i + 1;
      return `[${num}]`;
    }).join(' ');

    this.controlGroupUI.text = `Control Groups: ${groupText}`;
  }

  public destroy(): void {
    // Clean up event listeners
    const canvas = this.app.canvas;
    canvas.removeEventListener('mousedown', this.handleMouseDown);
    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('mouseup', this.handleMouseUp);
    canvas.removeEventListener('contextmenu', this.handleContextMenu);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}