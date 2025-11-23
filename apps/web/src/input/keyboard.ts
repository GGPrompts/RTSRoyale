// Keyboard Input Handler
import { GameWorld } from '@rts-arena/core';
import { SelectionManager } from '../selection/selection';

export interface KeyboardState {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  keysDown: Set<string>;
}

export class KeyboardInput {
  private world: GameWorld;
  private selectionManager: SelectionManager;
  private state: KeyboardState;
  private camera: any; // Will be typed properly when camera system is created

  constructor(world: GameWorld, selectionManager: SelectionManager, camera?: any) {
    this.world = world;
    this.selectionManager = selectionManager;
    this.camera = camera;

    this.state = {
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      keysDown: new Set(),
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));

    // Track modifier keys separately for reliability
    document.addEventListener('keydown', this.updateModifiers.bind(this));
    document.addEventListener('keyup', this.updateModifiers.bind(this));
    window.addEventListener('blur', this.onWindowBlur.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Prevent default for game keys
    const gameKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (gameKeys.includes(event.key)) {
      event.preventDefault();
    }

    // Track key state
    this.state.keysDown.add(event.key);
    this.updateModifiers(event);

    // Handle control groups (1-9)
    if (event.key >= '1' && event.key <= '9') {
      const groupNumber = parseInt(event.key);

      if (event.ctrlKey) {
        // Assign current selection to group
        this.selectionManager.assignControlGroup(groupNumber);
        console.log(`Assigned selection to control group ${groupNumber}`);
      } else if (!event.shiftKey && !event.altKey) {
        // Recall group
        const wasDoubleClick = this.checkDoubleClick(event.key);
        this.selectionManager.recallControlGroup(groupNumber);

        if (wasDoubleClick && this.camera) {
          // Double-tap: center camera on group
          this.centerCameraOnSelection();
        }
      }
    }

    // Camera controls (WASD and arrow keys)
    if (this.camera) {
      const cameraSpeed = 10;
      switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          this.camera.pan(0, -cameraSpeed);
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          this.camera.pan(0, cameraSpeed);
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          this.camera.pan(-cameraSpeed, 0);
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          this.camera.pan(cameraSpeed, 0);
          break;
      }
    }

    // Additional hotkeys
    switch (event.key) {
      case 'Escape':
        // Clear selection
        this.selectionManager.clearSelection();
        break;
      case 'Tab':
        // Cycle through control groups
        event.preventDefault();
        this.cycleControlGroups(event.shiftKey);
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.state.keysDown.delete(event.key);
    this.updateModifiers(event);
  }

  private updateModifiers(event: KeyboardEvent): void {
    this.state.shiftKey = event.shiftKey;
    this.state.ctrlKey = event.ctrlKey;
    this.state.altKey = event.altKey;
  }

  private onWindowBlur(): void {
    // Clear all key states when window loses focus
    this.state.keysDown.clear();
    this.state.shiftKey = false;
    this.state.ctrlKey = false;
    this.state.altKey = false;
  }

  // Double-click detection
  private lastKeyTime: Map<string, number> = new Map();
  private readonly DOUBLE_CLICK_TIME = 300; // ms

  private checkDoubleClick(key: string): boolean {
    const now = Date.now();
    const lastTime = this.lastKeyTime.get(key) || 0;
    this.lastKeyTime.set(key, now);

    return now - lastTime < this.DOUBLE_CLICK_TIME;
  }

  private centerCameraOnSelection(): void {
    if (!this.camera) return;

    const centerPos = this.selectionManager.getSelectionCenter();
    if (centerPos) {
      this.camera.centerOn(centerPos.x, centerPos.y);
    }
  }

  private cycleControlGroups(reverse: boolean = false): void {
    const groups = this.selectionManager.getActiveControlGroups();
    if (groups.length === 0) return;

    const currentGroup = this.selectionManager.getCurrentControlGroup();
    let nextIndex = 0;

    if (currentGroup !== null) {
      const currentIndex = groups.indexOf(currentGroup);
      if (currentIndex !== -1) {
        if (reverse) {
          nextIndex = (currentIndex - 1 + groups.length) % groups.length;
        } else {
          nextIndex = (currentIndex + 1) % groups.length;
        }
      }
    }

    this.selectionManager.recallControlGroup(groups[nextIndex]);
  }

  public getState(): Readonly<KeyboardState> {
    return this.state;
  }

  public isKeyDown(key: string): boolean {
    return this.state.keysDown.has(key);
  }

  public setCamera(camera: any): void {
    this.camera = camera;
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('keydown', this.updateModifiers.bind(this));
    document.removeEventListener('keyup', this.updateModifiers.bind(this));
    window.removeEventListener('blur', this.onWindowBlur.bind(this));
  }
}