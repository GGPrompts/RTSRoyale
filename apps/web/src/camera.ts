// Camera Control System
import { Application, Container } from 'pixi.js';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  smoothing: number;
}

export interface ShakeOptions {
  magnitude: number;
  duration: number;
  frequency?: number;
}

export class Camera {
  private app: Application;
  private viewport: Container;
  private state: CameraState;
  private bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZoom: number;
    maxZoom: number;
  };
  private edgeScrollEnabled: boolean = true;
  private edgeScrollSpeed: number = 15;
  private edgeScrollMargin: number = 50;
  private isMiddleMouseDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragStartCameraX: number = 0;
  private dragStartCameraY: number = 0;

  // Camera shake properties
  private shakeActive: boolean = false;
  private shakeOptions: ShakeOptions = { magnitude: 0, duration: 0 };
  private shakeTimer: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  constructor(app: Application, viewport: Container) {
    this.app = app;
    this.viewport = viewport;

    this.state = {
      x: 0,
      y: 0,
      zoom: 1,
      targetX: 0,
      targetY: 0,
      targetZoom: 1,
      smoothing: 0.1,
    };

    // Set world bounds
    this.bounds = {
      minX: -500,
      maxX: 2420, // 1920 + 500
      minY: -500,
      maxY: 1580, // 1080 + 500
      minZoom: 0.5,
      maxZoom: 2.0,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse wheel for zoom
    this.app.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    // Middle mouse drag
    this.app.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    // Prevent context menu on right-click
    this.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.state.targetZoom * delta;

    // Get mouse position relative to canvas
    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate world position under mouse before zoom
    const worldXBefore = (mouseX - this.app.screen.width / 2) / this.state.zoom + this.state.x;
    const worldYBefore = (mouseY - this.app.screen.height / 2) / this.state.zoom + this.state.y;

    // Apply zoom
    this.setZoom(newZoom);

    // Calculate world position under mouse after zoom
    const worldXAfter = (mouseX - this.app.screen.width / 2) / this.state.targetZoom + this.state.targetX;
    const worldYAfter = (mouseY - this.app.screen.height / 2) / this.state.targetZoom + this.state.targetY;

    // Adjust camera to keep mouse position stable
    this.state.targetX += worldXBefore - worldXAfter;
    this.state.targetY += worldYBefore - worldYAfter;

    // Clamp to bounds
    this.clampToBounds();
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 1) {
      // Middle mouse button
      event.preventDefault();
      this.isMiddleMouseDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.dragStartCameraX = this.state.x;
      this.dragStartCameraY = this.state.y;

      // Change cursor
      this.app.canvas.style.cursor = 'grabbing';
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button === 1) {
      this.isMiddleMouseDragging = false;
      this.app.canvas.style.cursor = 'default';
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isMiddleMouseDragging) {
      const deltaX = (event.clientX - this.dragStartX) / this.state.zoom;
      const deltaY = (event.clientY - this.dragStartY) / this.state.zoom;

      this.state.targetX = this.dragStartCameraX - deltaX;
      this.state.targetY = this.dragStartCameraY - deltaY;

      this.clampToBounds();
    }
  }

  public pan(deltaX: number, deltaY: number): void {
    this.state.targetX += deltaX;
    this.state.targetY += deltaY;
    this.clampToBounds();
  }

  public setPosition(x: number, y: number): void {
    this.state.targetX = x;
    this.state.targetY = y;
    this.clampToBounds();
  }

  public centerOn(x: number, y: number, immediate: boolean = false): void {
    this.state.targetX = x;
    this.state.targetY = y;
    this.clampToBounds();

    if (immediate) {
      this.state.x = this.state.targetX;
      this.state.y = this.state.targetY;
    }
  }

  public setZoom(zoom: number): void {
    this.state.targetZoom = Math.max(this.bounds.minZoom, Math.min(this.bounds.maxZoom, zoom));
  }

  private clampToBounds(): void {
    const screenWidth = this.app.screen.width / this.state.targetZoom;
    const screenHeight = this.app.screen.height / this.state.targetZoom;

    this.state.targetX = Math.max(
      this.bounds.minX + screenWidth / 2,
      Math.min(this.bounds.maxX - screenWidth / 2, this.state.targetX)
    );

    this.state.targetY = Math.max(
      this.bounds.minY + screenHeight / 2,
      Math.min(this.bounds.maxY - screenHeight / 2, this.state.targetY)
    );
  }

  public shake(options: Partial<ShakeOptions> = {}): void {
    const defaults: ShakeOptions = {
      magnitude: 5,
      duration: 0.5,
      frequency: 30,
    };

    this.shakeOptions = { ...defaults, ...options };
    this.shakeTimer = this.shakeOptions.duration;
    this.shakeActive = true;
  }

  private updateShake(deltaTime: number): void {
    if (!this.shakeActive) return;

    this.shakeTimer -= deltaTime;

    if (this.shakeTimer <= 0) {
      this.shakeActive = false;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      return;
    }

    // Calculate shake offset
    const progress = this.shakeTimer / this.shakeOptions.duration;
    const magnitude = this.shakeOptions.magnitude * progress;
    const frequency = this.shakeOptions.frequency || 30;

    // Random shake with damping
    const oscillation = Math.sin(this.shakeTimer * frequency) * 0.5 + 0.5;
    this.shakeOffsetX = (Math.random() - 0.5) * 2 * magnitude * oscillation;
    this.shakeOffsetY = (Math.random() - 0.5) * 2 * magnitude * oscillation;
  }

  public update(mouseX: number, mouseY: number, deltaTime: number = 0.016): void {
    // Update shake effect
    this.updateShake(deltaTime);

    // Smooth camera movement
    this.state.x += (this.state.targetX - this.state.x) * this.state.smoothing;
    this.state.y += (this.state.targetY - this.state.y) * this.state.smoothing;
    this.state.zoom += (this.state.targetZoom - this.state.zoom) * this.state.smoothing;

    // Edge scrolling
    if (this.edgeScrollEnabled && !this.isMiddleMouseDragging) {
      const rect = this.app.canvas.getBoundingClientRect();
      const relativeX = mouseX - rect.left;
      const relativeY = mouseY - rect.top;

      // Check edges
      if (relativeX < this.edgeScrollMargin) {
        this.pan(-this.edgeScrollSpeed, 0);
      } else if (relativeX > rect.width - this.edgeScrollMargin) {
        this.pan(this.edgeScrollSpeed, 0);
      }

      if (relativeY < this.edgeScrollMargin) {
        this.pan(0, -this.edgeScrollSpeed);
      } else if (relativeY > rect.height - this.edgeScrollMargin) {
        this.pan(0, this.edgeScrollSpeed);
      }
    }

    // Apply transform to viewport (including shake offset)
    this.viewport.scale.set(this.state.zoom);
    this.viewport.position.set(
      this.app.screen.width / 2 - (this.state.x + this.shakeOffsetX) * this.state.zoom,
      this.app.screen.height / 2 - (this.state.y + this.shakeOffsetY) * this.state.zoom
    );
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.app.canvas.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;

    return {
      x: (relativeX - this.app.screen.width / 2) / this.state.zoom + this.state.x,
      y: (relativeY - this.app.screen.height / 2) / this.state.zoom + this.state.y,
    };
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const rect = this.app.canvas.getBoundingClientRect();
    return {
      x: (worldX - this.state.x) * this.state.zoom + this.app.screen.width / 2 + rect.left,
      y: (worldY - this.state.y) * this.state.zoom + this.app.screen.height / 2 + rect.top,
    };
  }

  public setEdgeScrollEnabled(enabled: boolean): void {
    this.edgeScrollEnabled = enabled;
  }

  public getState(): Readonly<CameraState> {
    return { ...this.state };
  }

  public setBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.bounds.minX = minX;
    this.bounds.maxX = maxX;
    this.bounds.minY = minY;
    this.bounds.maxY = maxY;
    this.clampToBounds();
  }

  public dispose(): void {
    this.app.canvas.removeEventListener('wheel', this.onWheel.bind(this));
    this.app.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }
}