// Screen effects for dramatic moments in RTS Arena
import { Container, Graphics, ColorMatrixFilter, Application } from 'pixi.js';

export interface ScreenShakeOptions {
  magnitude: number;
  duration: number;
  frequency?: number;
}

export class ScreenEffects {
  private app: Application;
  private overlayContainer: Container;
  private flashOverlay: Graphics;
  private vignetteOverlay: Graphics;
  private shakeActive: boolean = false;
  private shakeOptions: ScreenShakeOptions = { magnitude: 0, duration: 0 };
  private shakeTimer: number = 0;
  private originalPosition: { x: number; y: number } = { x: 0, y: 0 };
  private flashActive: boolean = false;
  private flashTimer: number = 0;
  private flashDuration: number = 0;
  private postProcessingFilters: any[] = [];

  constructor(app: Application) {
    this.app = app;
    this.overlayContainer = new Container();
    this.overlayContainer.zIndex = 9999; // Ensure it's on top

    // Create flash overlay
    this.flashOverlay = new Graphics();
    this.flashOverlay.rect(0, 0, 1920, 1080);
    this.flashOverlay.fill({ color: 0xffffff, alpha: 0 });
    this.flashOverlay.visible = false;
    this.overlayContainer.addChild(this.flashOverlay);

    // Create vignette overlay
    this.vignetteOverlay = this.createVignette();
    this.vignetteOverlay.visible = false;
    this.overlayContainer.addChild(this.vignetteOverlay);

    // Add overlay container to stage
    app.stage.addChild(this.overlayContainer);

    // Setup post-processing filters if WebGPU is available
    if (app.renderer.type === 'webgpu') {
      this.setupPostProcessing();
    }
  }

  private createVignette(): Graphics {
    const graphics = new Graphics();
    const width = 1920;
    const height = 1080;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create radial gradient effect using multiple circles
    const steps = 10;
    for (let i = steps; i >= 0; i--) {
      const radius = Math.max(width, height) * (1.0 + i / steps);
      const alpha = i / steps * 0.8;

      graphics.circle(centerX, centerY, radius);

      if (i === steps) {
        // Outer rectangle to ensure full coverage
        graphics.rect(0, 0, width, height);
        graphics.fill({ color: 0x000000, alpha: alpha });
      }

      // Cut out inner circle to create ring
      if (i < steps) {
        graphics.circle(centerX, centerY, radius * 0.5);
        graphics.cut();
      }

      graphics.fill({ color: 0x000000, alpha: alpha * 0.5 });
    }

    return graphics;
  }

  private setupPostProcessing() {
    // Color matrix for various effects
    const colorMatrix = new ColorMatrixFilter();

    // Store reference for later manipulation
    this.postProcessingFilters = [colorMatrix];
  }

  update(deltaTime: number) {
    // Update camera shake
    if (this.shakeActive) {
      this.updateShake(deltaTime);
    }

    // Update flash effect
    if (this.flashActive) {
      this.updateFlash(deltaTime);
    }

    // Update overlay positions to match viewport
    this.overlayContainer.x = -this.app.stage.x;
    this.overlayContainer.y = -this.app.stage.y;

    // Scale overlays to match viewport scale
    const scale = this.app.stage.scale.x;
    this.overlayContainer.scale.set(1 / scale);
  }

  private updateShake(deltaTime: number) {
    this.shakeTimer -= deltaTime;

    if (this.shakeTimer <= 0) {
      // Reset position
      this.app.stage.x = this.originalPosition.x;
      this.app.stage.y = this.originalPosition.y;
      this.shakeActive = false;
      return;
    }

    // Calculate shake offset
    const progress = this.shakeTimer / this.shakeOptions.duration;
    const magnitude = this.shakeOptions.magnitude * progress;
    const frequency = this.shakeOptions.frequency || 30;

    const offsetX = (Math.random() - 0.5) * 2 * magnitude;
    const offsetY = (Math.random() - 0.5) * 2 * magnitude;

    // Apply damping oscillation
    const oscillation = Math.sin(this.shakeTimer * frequency) * 0.5 + 0.5;
    this.app.stage.x = this.originalPosition.x + offsetX * oscillation;
    this.app.stage.y = this.originalPosition.y + offsetY * oscillation;
  }

  private updateFlash(deltaTime: number) {
    this.flashTimer -= deltaTime;

    if (this.flashTimer <= 0) {
      this.flashOverlay.visible = false;
      this.flashActive = false;
      return;
    }

    // Update flash alpha
    const progress = this.flashTimer / this.flashDuration;
    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, 1920, 1080);
    this.flashOverlay.fill({ color: 0xffffff, alpha: progress * 0.8 });
  }

  // Trigger camera shake
  shake(options: Partial<ScreenShakeOptions> = {}) {
    const defaults: ScreenShakeOptions = {
      magnitude: 5,
      duration: 0.5,
      frequency: 30,
    };

    this.shakeOptions = { ...defaults, ...options };
    this.shakeTimer = this.shakeOptions.duration;
    this.shakeActive = true;

    // Store original position if not shaking
    if (!this.shakeActive) {
      this.originalPosition.x = this.app.stage.x;
      this.originalPosition.y = this.app.stage.y;
    }
  }

  // Trigger screen flash
  flash(color: number = 0xffffff, duration: number = 0.5) {
    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, 1920, 1080);
    this.flashOverlay.fill({ color, alpha: 0.8 });
    this.flashOverlay.visible = true;

    this.flashActive = true;
    this.flashTimer = duration;
    this.flashDuration = duration;
  }

  // Show/hide vignette
  setVignetteVisible(visible: boolean, intensity: number = 0.5) {
    this.vignetteOverlay.visible = visible;
    if (visible) {
      this.vignetteOverlay.alpha = intensity;
    }
  }

  // Trigger dramatic effect for final showdown
  triggerFinalShowdown() {
    // Big flash
    this.flash(0xffff00, 1.0);

    // Strong shake
    this.shake({
      magnitude: 10,
      duration: 1.5,
      frequency: 40,
    });

    // Enable vignette
    this.setVignetteVisible(true, 0.3);

    // Apply color grading if available
    if (this.postProcessingFilters.length > 0) {
      const colorMatrix = this.postProcessingFilters[0] as ColorMatrixFilter;
      colorMatrix.contrast(1.2, false);
      colorMatrix.saturate(1.3, true);
      this.app.stage.filters = this.postProcessingFilters;
    }

    // Gradually increase vignette intensity
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= 5) {
        clearInterval(interval);
        return;
      }

      const intensity = 0.3 + elapsed * 0.1;
      this.setVignetteVisible(true, Math.min(intensity, 0.8));
    }, 100);
  }

  // Trigger collapse warning effect
  triggerCollapseWarning() {
    // Orange flash
    this.flash(0xff8800, 0.3);

    // Mild shake
    this.shake({
      magnitude: 3,
      duration: 0.3,
      frequency: 25,
    });

    // Start vignette
    this.setVignetteVisible(true, 0.2);
  }

  // Hit impact effect
  triggerHitImpact(magnitude: number = 2) {
    this.shake({
      magnitude,
      duration: 0.1,
      frequency: 60,
    });
  }

  // Death explosion effect
  triggerDeathExplosion() {
    // Quick red flash
    this.flash(0xff0000, 0.2);

    // Small shake
    this.shake({
      magnitude: 3,
      duration: 0.2,
      frequency: 50,
    });
  }

  // Smooth camera follow
  smoothFollow(targets: { x: number; y: number }[], lerpFactor: number = 0.1) {
    if (targets.length === 0) return;

    // Calculate average position of targets
    let avgX = 0;
    let avgY = 0;
    targets.forEach(target => {
      avgX += target.x;
      avgY += target.y;
    });
    avgX /= targets.length;
    avgY /= targets.length;

    // Center camera on average position
    const targetX = -avgX + this.app.screen.width / 2;
    const targetY = -avgY + this.app.screen.height / 2;

    // Smooth lerp to target position if not shaking
    if (!this.shakeActive) {
      this.app.stage.x += (targetX - this.app.stage.x) * lerpFactor;
      this.app.stage.y += (targetY - this.app.stage.y) * lerpFactor;
    }
  }

  // Zoom with smooth transition
  smoothZoom(targetZoom: number, lerpFactor: number = 0.1) {
    const currentZoom = this.app.stage.scale.x;
    const newZoom = currentZoom + (targetZoom - currentZoom) * lerpFactor;
    this.app.stage.scale.set(newZoom);
  }

  // Apply chromatic aberration effect (WebGPU only)
  setChromaticAberration(enabled: boolean, strength: number = 2) {
    if (this.app.renderer.type !== 'webgpu') return;

    // This would require a custom shader filter
    // For now, we'll use color matrix to simulate
    if (this.postProcessingFilters.length > 0) {
      const colorMatrix = this.postProcessingFilters[0] as ColorMatrixFilter;
      if (enabled) {
        colorMatrix.matrix[1] = strength * 0.01; // Red channel offset
        colorMatrix.matrix[7] = -strength * 0.01; // Green channel offset
      } else {
        colorMatrix.reset();
      }
    }
  }

  // Apply bloom effect simulation
  setBloom(enabled: boolean, strength: number = 1.5) {
    if (this.app.renderer.type !== 'webgpu') return;

    if (this.postProcessingFilters.length > 0) {
      const colorMatrix = this.postProcessingFilters[0] as ColorMatrixFilter;
      if (enabled) {
        colorMatrix.brightness(1 + strength * 0.1, false);
      } else {
        colorMatrix.reset();
      }
    }
  }

  destroy() {
    this.flashOverlay.destroy();
    this.vignetteOverlay.destroy();
    this.overlayContainer.destroy();
    this.postProcessingFilters.forEach(filter => filter.destroy());
  }
}