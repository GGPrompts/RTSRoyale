// Particle System for RTS Arena
import { Container, Graphics, ParticleContainer, Sprite, Texture } from 'pixi.js';
import { Application } from 'pixi.js';

// Particle types
export enum ParticleType {
  HIT = 'hit',
  DEATH = 'death',
  DASH = 'dash',
  SHIELD = 'shield',
  EXPLOSION = 'explosion',
}

// Particle configuration
interface ParticleConfig {
  count: number;
  lifeTime: number;
  speed: number;
  spread: number;
  gravity: number;
  color: number;
  size: number;
  fadeOut: boolean;
  scaleDown: boolean;
}

// Individual particle
class Particle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  life: number = 0;
  maxLife: number = 1;
  size: number = 4;
  color: number = 0xffffff;
  alpha: number = 1;
  active: boolean = false;
  graphic: Graphics;

  constructor() {
    this.graphic = new Graphics();
  }

  reset(x: number, y: number, config: ParticleConfig) {
    this.x = x;
    this.y = y;

    // Random velocity based on spread
    const angle = Math.random() * Math.PI * 2;
    const speed = config.speed * (0.5 + Math.random() * 0.5);
    this.vx = Math.cos(angle) * speed * config.spread;
    this.vy = Math.sin(angle) * speed * config.spread;

    this.life = 0;
    this.maxLife = config.lifeTime;
    this.size = config.size * (0.8 + Math.random() * 0.4);
    this.color = config.color;
    this.alpha = 1;
    this.active = true;

    this.updateGraphic();
  }

  update(deltaTime: number, config: ParticleConfig) {
    if (!this.active) return;

    this.life += deltaTime;

    if (this.life >= this.maxLife) {
      this.active = false;
      this.graphic.visible = false;
      return;
    }

    // Apply physics
    this.vy += config.gravity * deltaTime;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Apply effects
    const lifeRatio = this.life / this.maxLife;

    if (config.fadeOut) {
      this.alpha = 1 - lifeRatio;
    }

    if (config.scaleDown) {
      const currentSize = this.size * (1 - lifeRatio * 0.5);
      this.graphic.scale.set(currentSize / this.size);
    }

    // Update graphic position and alpha
    this.graphic.position.set(this.x, this.y);
    this.graphic.alpha = this.alpha;
  }

  updateGraphic() {
    this.graphic.clear();
    this.graphic.circle(0, 0, this.size);
    this.graphic.fill({ color: this.color, alpha: 1 });
    this.graphic.visible = true;
  }
}

// Particle emitter
export class ParticleEmitter {
  private particles: Particle[] = [];
  private container: Container;
  private poolSize: number = 200;
  private particleIndex: number = 0;

  private configs: Map<ParticleType, ParticleConfig> = new Map([
    [ParticleType.HIT, {
      count: 8,
      lifeTime: 0.3,
      speed: 200,
      spread: 1,
      gravity: 0,
      color: 0xff4444,
      size: 3,
      fadeOut: true,
      scaleDown: true,
    }],
    [ParticleType.DEATH, {
      count: 20,
      lifeTime: 0.8,
      speed: 300,
      spread: 1.5,
      gravity: 200,
      color: 0xffaa00,
      size: 5,
      fadeOut: true,
      scaleDown: true,
    }],
    [ParticleType.DASH, {
      count: 5,
      lifeTime: 0.4,
      speed: 50,
      spread: 0.3,
      gravity: 0,
      color: 0x00aaff,
      size: 4,
      fadeOut: true,
      scaleDown: false,
    }],
    [ParticleType.SHIELD, {
      count: 10,
      lifeTime: 0.6,
      speed: 100,
      spread: 2,
      gravity: -50,
      color: 0x00ff00,
      size: 2,
      fadeOut: true,
      scaleDown: false,
    }],
    [ParticleType.EXPLOSION, {
      count: 25,
      lifeTime: 1.0,
      speed: 400,
      spread: 2,
      gravity: 300,
      color: 0xff8800,
      size: 6,
      fadeOut: true,
      scaleDown: true,
    }],
  ]);

  constructor(app: Application) {
    this.container = new Container();
    app.stage.addChild(this.container);

    // Pre-allocate particle pool
    for (let i = 0; i < this.poolSize; i++) {
      const particle = new Particle();
      particle.graphic.visible = false;
      this.particles.push(particle);
      this.container.addChild(particle.graphic);
    }
  }

  emit(type: ParticleType, x: number, y: number, customColor?: number) {
    const config = this.configs.get(type);
    if (!config) return;

    // Override color if provided
    const finalConfig = customColor ? { ...config, color: customColor } : config;

    for (let i = 0; i < finalConfig.count; i++) {
      const particle = this.particles[this.particleIndex];
      particle.reset(x, y, finalConfig);

      this.particleIndex = (this.particleIndex + 1) % this.poolSize;
    }
  }

  emitContinuous(type: ParticleType, x: number, y: number, deltaTime: number) {
    const config = this.configs.get(type);
    if (!config) return;

    // Emit particles at a rate based on deltaTime
    const particlesPerSecond = config.count * 3; // Continuous emission rate
    const particlesToEmit = Math.floor(particlesPerSecond * deltaTime);

    for (let i = 0; i < particlesToEmit; i++) {
      const particle = this.particles[this.particleIndex];
      particle.reset(x, y, config);

      this.particleIndex = (this.particleIndex + 1) % this.poolSize;
    }
  }

  update(deltaTime: number) {
    for (const particle of this.particles) {
      if (particle.active) {
        const config = this.getConfigForParticle(particle);
        particle.update(deltaTime, config);
      }
    }
  }

  private getConfigForParticle(particle: Particle): ParticleConfig {
    // Default config - can be enhanced to track particle type
    return {
      count: 0,
      lifeTime: particle.maxLife,
      speed: 0,
      spread: 1,
      gravity: 200,
      color: particle.color,
      size: particle.size,
      fadeOut: true,
      scaleDown: true,
    };
  }

  // Emit particles in a specific direction
  emitDirectional(type: ParticleType, x: number, y: number, direction: number, spread: number = 0.5) {
    const config = this.configs.get(type);
    if (!config) return;

    for (let i = 0; i < config.count; i++) {
      const particle = this.particles[this.particleIndex];
      particle.reset(x, y, config);

      // Override velocity with directional
      const angleSpread = (Math.random() - 0.5) * spread;
      const finalAngle = direction + angleSpread;
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      particle.vx = Math.cos(finalAngle) * speed;
      particle.vy = Math.sin(finalAngle) * speed;

      this.particleIndex = (this.particleIndex + 1) % this.poolSize;
    }
  }

  clear() {
    for (const particle of this.particles) {
      particle.active = false;
      particle.graphic.visible = false;
    }
  }
}