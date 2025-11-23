// Screen Effects for RTS Arena
import { Application, Graphics, Container } from 'pixi.js';

export class ScreenEffects {
  private app: Application;
  private flashOverlay: Graphics;
  private originalStagePosition: { x: number; y: number };
  private originalStageScale: { x: number; y: number };

  // Shake parameters
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTime: number = 0;

  // Flash parameters
  private flashAlpha: number = 0;
  private flashDuration: number = 0;
  private flashTime: number = 0;
  private flashColor: number = 0xffffff;

  // Zoom parameters
  private zoomScale: number = 1;
  private zoomTargetScale: number = 1;
  private zoomDuration: number = 0;
  private zoomTime: number = 0;
  private zoomEasing: 'linear' | 'elastic' | 'bounce' = 'elastic';

  constructor(app: Application) {
    this.app = app;

    // Store original stage position and scale
    this.originalStagePosition = {
      x: app.stage.position.x,
      y: app.stage.position.y,
    };
    this.originalStageScale = {
      x: app.stage.scale.x,
      y: app.stage.scale.y,
    };

    // Create flash overlay
    this.flashOverlay = new Graphics();
    this.flashOverlay.visible = false;
    this.flashOverlay.zIndex = 10000; // Ensure it's on top
    app.stage.addChild(this.flashOverlay);
  }

  // Camera shake effect
  shake(intensity: number = 10, duration: number = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
  }

  // Small shake for hits
  hitShake() {
    this.shake(5, 0.15);
  }

  // Medium shake for explosions
  explosionShake() {
    this.shake(15, 0.4);
  }

  // Large shake for big events
  bigShake() {
    this.shake(25, 0.6);
  }

  // Flash effect
  flash(color: number = 0xffffff, intensity: number = 0.8, duration: number = 0.2) {
    this.flashColor = color;
    this.flashAlpha = intensity;
    this.flashDuration = duration;
    this.flashTime = 0;
    this.updateFlashOverlay();
    this.flashOverlay.visible = true;
  }

  // White flash for impacts
  impactFlash() {
    this.flash(0xffffff, 0.6, 0.15);
  }

  // Red flash for damage
  damageFlash() {
    this.flash(0xff0000, 0.4, 0.2);
  }

  // Yellow flash for power-ups
  powerUpFlash() {
    this.flash(0xffff00, 0.5, 0.25);
  }

  // Zoom pulse effect
  zoomPulse(scale: number = 1.1, duration: number = 0.5, easing: 'linear' | 'elastic' | 'bounce' = 'elastic') {
    this.zoomTargetScale = scale;
    this.zoomDuration = duration;
    this.zoomTime = 0;
    this.zoomEasing = easing;
  }

  // Zoom in for focus
  zoomIn(scale: number = 1.2, duration: number = 0.3) {
    this.zoomPulse(scale, duration, 'linear');
  }

  // Zoom out for overview
  zoomOut(scale: number = 0.9, duration: number = 0.3) {
    this.zoomPulse(scale, duration, 'linear');
  }

  // Final showdown zoom
  showdownZoom() {
    this.zoomPulse(1.15, 1.0, 'elastic');
    this.flash(0xff8800, 0.3, 0.5);
    this.bigShake();
  }

  // Update all effects
  update(deltaTime: number) {
    this.updateShake(deltaTime);
    this.updateFlash(deltaTime);
    this.updateZoom(deltaTime);
  }

  private updateShake(deltaTime: number) {
    if (this.shakeDuration <= 0) {
      // Reset to original position if not shaking
      if (this.app.stage.position.x !== this.originalStagePosition.x ||
          this.app.stage.position.y !== this.originalStagePosition.y) {
        this.app.stage.position.x = this.originalStagePosition.x;
        this.app.stage.position.y = this.originalStagePosition.y;
      }
      return;
    }

    this.shakeTime += deltaTime;

    if (this.shakeTime >= this.shakeDuration) {
      this.shakeDuration = 0;
      this.shakeTime = 0;
      this.app.stage.position.x = this.originalStagePosition.x;
      this.app.stage.position.y = this.originalStagePosition.y;
    } else {
      // Calculate shake offset with decay
      const progress = this.shakeTime / this.shakeDuration;
      const decay = 1 - progress; // Reduce intensity over time
      const currentIntensity = this.shakeIntensity * decay;

      // Random shake offset
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;

      this.app.stage.position.x = this.originalStagePosition.x + offsetX;
      this.app.stage.position.y = this.originalStagePosition.y + offsetY;
    }
  }

  private updateFlash(deltaTime: number) {
    if (!this.flashOverlay.visible || this.flashDuration <= 0) return;

    this.flashTime += deltaTime;

    if (this.flashTime >= this.flashDuration) {
      this.flashOverlay.visible = false;
      this.flashDuration = 0;
      this.flashTime = 0;
    } else {
      // Fade out the flash
      const progress = this.flashTime / this.flashDuration;
      const currentAlpha = this.flashAlpha * (1 - progress);
      this.flashOverlay.alpha = currentAlpha;
    }
  }

  private updateZoom(deltaTime: number) {
    if (this.zoomDuration <= 0) {
      // Reset to original scale if not zooming
      if (this.zoomScale !== 1) {
        this.zoomScale = 1;
        this.app.stage.scale.set(
          this.originalStageScale.x * this.zoomScale,
          this.originalStageScale.y * this.zoomScale
        );
      }
      return;
    }

    this.zoomTime += deltaTime;

    if (this.zoomTime >= this.zoomDuration) {
      // Complete zoom and start returning to normal
      this.zoomDuration = 0.3; // Return duration
      this.zoomTime = 0;
      this.zoomTargetScale = 1;
      this.zoomEasing = 'linear';
    } else {
      // Calculate current zoom based on easing
      const progress = this.zoomTime / this.zoomDuration;
      let easedProgress = progress;

      switch (this.zoomEasing) {
        case 'elastic':
          easedProgress = this.elasticEasing(progress);
          break;
        case 'bounce':
          easedProgress = this.bounceEasing(progress);
          break;
        case 'linear':
        default:
          easedProgress = progress;
          break;
      }

      // Interpolate between current and target scale
      this.zoomScale = 1 + (this.zoomTargetScale - 1) * easedProgress;

      // Apply zoom from center
      const centerX = this.app.screen.width / 2;
      const centerY = this.app.screen.height / 2;

      this.app.stage.scale.set(
        this.originalStageScale.x * this.zoomScale,
        this.originalStageScale.y * this.zoomScale
      );

      // Adjust position to keep center point fixed
      this.app.stage.position.x = centerX - centerX * this.zoomScale;
      this.app.stage.position.y = centerY - centerY * this.zoomScale;
    }
  }

  private updateFlashOverlay() {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, width, height);
    this.flashOverlay.fill({ color: this.flashColor, alpha: 1 });
  }

  private elasticEasing(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const a = 1;
    const s = p / 4;
    return a * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  }

  private bounceEasing(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  }

  // Combined effects for common scenarios
  unitHit() {
    this.hitShake();
    this.damageFlash();
  }

  unitDeath() {
    this.explosionShake();
    this.impactFlash();
  }

  abilityActivated(type: 'dash' | 'shield' | 'ultimate' = 'dash') {
    switch (type) {
      case 'dash':
        this.shake(3, 0.1);
        break;
      case 'shield':
        this.flash(0x00ff00, 0.2, 0.2);
        break;
      case 'ultimate':
        this.showdownZoom();
        break;
    }
  }

  reset() {
    this.shakeDuration = 0;
    this.flashDuration = 0;
    this.zoomDuration = 0;
    this.flashOverlay.visible = false;
    this.app.stage.position.x = this.originalStagePosition.x;
    this.app.stage.position.y = this.originalStagePosition.y;
    this.app.stage.scale.set(this.originalStageScale.x, this.originalStageScale.y);
  }
}