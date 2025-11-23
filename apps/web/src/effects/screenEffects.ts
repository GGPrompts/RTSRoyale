import { Container } from 'pixi.js';

export class ScreenEffects {
  private worldContainer: Container;
  private shakeAmount = 0;
  private shakeDuration = 0;
  private baseX = 0;
  private baseY = 0;

  constructor(worldContainer: Container) {
    this.worldContainer = worldContainer;
    this.baseX = worldContainer.x;
    this.baseY = worldContainer.y;
  }

  triggerShake(intensity: number = 10, duration: number = 0.2) {
    this.shakeAmount = intensity;
    this.shakeDuration = duration;
  }

  update(deltaTime: number) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime;

      // Random shake offset
      const offsetX = (Math.random() - 0.5) * this.shakeAmount;
      const offsetY = (Math.random() - 0.5) * this.shakeAmount;

      this.worldContainer.x = this.baseX + offsetX;
      this.worldContainer.y = this.baseY + offsetY;

      if (this.shakeDuration <= 0) {
        // Reset to base position
        this.worldContainer.x = this.baseX;
        this.worldContainer.y = this.baseY;
      }
    }
  }

  setBasePosition(x: number, y: number) {
    this.baseX = x;
    this.baseY = y;
    if (this.shakeDuration <= 0) {
      this.worldContainer.x = x;
      this.worldContainer.y = y;
    }
  }

  isShaking(): boolean {
    return this.shakeDuration > 0;
  }
}
