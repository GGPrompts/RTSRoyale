// Particle system with object pooling for RTS Arena effects
import { ParticleContainer, Sprite, Container, Texture } from 'pixi.js';
import { TextureAssets } from '../assets/textures';

export interface ParticleOptions {
  texture?: Texture;
  lifetime: number;
  velocity: { x: number; y: number };
  acceleration?: { x: number; y: number };
  startScale?: number;
  endScale?: number;
  startAlpha?: number;
  endAlpha?: number;
  startRotation?: number;
  rotationSpeed?: number;
  tint?: number;
}

class Particle {
  sprite: Sprite;
  lifetime: number;
  maxLifetime: number;
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  startScale: number;
  endScale: number;
  startAlpha: number;
  endAlpha: number;
  rotationSpeed: number;
  active: boolean = false;

  constructor() {
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5);
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.lifetime = 0;
    this.maxLifetime = 1;
    this.startScale = 1;
    this.endScale = 0;
    this.startAlpha = 1;
    this.endAlpha = 0;
    this.rotationSpeed = 0;
  }

  init(x: number, y: number, options: ParticleOptions) {
    this.sprite.x = x;
    this.sprite.y = y;
    this.velocity.x = options.velocity.x;
    this.velocity.y = options.velocity.y;
    this.acceleration.x = options.acceleration?.x || 0;
    this.acceleration.y = options.acceleration?.y || 0;
    this.lifetime = options.lifetime;
    this.maxLifetime = options.lifetime;
    this.startScale = options.startScale || 1;
    this.endScale = options.endScale || 0;
    this.startAlpha = options.startAlpha || 1;
    this.endAlpha = options.endAlpha || 0;
    this.sprite.rotation = options.startRotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
    this.sprite.tint = options.tint || 0xffffff;

    if (options.texture) {
      this.sprite.texture = options.texture;
    }

    this.sprite.visible = true;
    this.active = true;
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    this.lifetime -= deltaTime;

    if (this.lifetime <= 0) {
      this.active = false;
      this.sprite.visible = false;
      return false;
    }

    // Update position
    this.sprite.x += this.velocity.x * deltaTime;
    this.sprite.y += this.velocity.y * deltaTime;

    // Apply acceleration
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;

    // Update rotation
    this.sprite.rotation += this.rotationSpeed * deltaTime;

    // Interpolate scale and alpha based on lifetime
    const progress = 1.0 - (this.lifetime / this.maxLifetime);
    this.sprite.scale.set(this.startScale + (this.endScale - this.startScale) * progress);
    this.sprite.alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * progress;

    return true;
  }

  reset() {
    this.active = false;
    this.sprite.visible = false;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }
}

export class ParticleSystem {
  private container: ParticleContainer;
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private textures: TextureAssets;
  private maxParticles = 1000;
  private activeParticles = 0;

  constructor(parent: Container, textures: TextureAssets) {
    this.textures = textures;

    // Create ParticleContainer for performance
    this.container = new ParticleContainer(this.maxParticles, {
      scale: true,
      position: true,
      rotation: true,
      alpha: true,
      tint: true,
    });
    parent.addChild(this.container);

    // Initialize particle pool
    this.initializePool();
  }

  private initializePool() {
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = new Particle();
      particle.sprite.texture = this.textures.particle;
      this.container.addChild(particle.sprite);
      this.particles.push(particle);
      this.particlePool.push(particle);
    }
  }

  private getParticle(): Particle | null {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop()!;
    }
    return null;
  }

  private returnParticle(particle: Particle) {
    particle.reset();
    this.particlePool.push(particle);
  }

  update(deltaTime: number) {
    let activeCount = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle.active) {
        if (!particle.update(deltaTime)) {
          this.returnParticle(particle);
        } else {
          activeCount++;
        }
      }
    }
    this.activeParticles = activeCount;
  }

  // Emit a burst of particles
  emit(x: number, y: number, count: number, options: Partial<ParticleOptions> = {}) {
    const defaults: ParticleOptions = {
      texture: this.textures.particle,
      lifetime: 1.0,
      velocity: { x: 0, y: 0 },
      startScale: 1.0,
      endScale: 0,
      startAlpha: 1.0,
      endAlpha: 0,
      tint: 0xffffff,
    };

    const finalOptions = { ...defaults, ...options };

    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      // Add some randomness to each particle
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;

      const particleOptions: ParticleOptions = {
        ...finalOptions,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
      };

      particle.init(x, y, particleOptions);
    }
  }

  // Create specific effects
  createDashEffect(startX: number, startY: number, endX: number, endY: number) {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Create trail particles along the dash path
    const particleCount = Math.floor(distance / 10);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const x = startX + dx * t;
      const y = startY + dy * t;

      const particle = this.getParticle();
      if (!particle) break;

      particle.init(x, y, {
        texture: this.textures.dashTrail,
        lifetime: 0.3,
        velocity: {
          x: Math.random() * 20 - 10,
          y: Math.random() * 20 - 10,
        },
        startScale: 1.0,
        endScale: 0.2,
        startAlpha: 0.8,
        endAlpha: 0,
        startRotation: angle,
        tint: 0x00ffff,
      });
    }
  }

  createShieldEffect(x: number, y: number) {
    // Pulsing shield particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const particle = this.getParticle();
      if (!particle) break;

      particle.init(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30, {
        texture: this.textures.particle,
        lifetime: 1.0,
        velocity: {
          x: Math.cos(angle) * 10,
          y: Math.sin(angle) * 10,
        },
        startScale: 0.5,
        endScale: 1.5,
        startAlpha: 0.8,
        endAlpha: 0,
        tint: 0x00aaff,
      });
    }
  }

  createProjectileTrail(x: number, y: number, angle: number) {
    const particle = this.getParticle();
    if (!particle) return;

    particle.init(x, y, {
      texture: this.textures.particle,
      lifetime: 0.5,
      velocity: {
        x: -Math.cos(angle) * 30,
        y: -Math.sin(angle) * 30,
      },
      startScale: 0.8,
      endScale: 0,
      startAlpha: 0.7,
      endAlpha: 0,
      tint: 0xffaa00,
    });
  }

  createDeathExplosion(x: number, y: number, teamColor: number) {
    // Blood/explosion particles
    this.emit(x, y, 20, {
      lifetime: 0.8,
      velocity: { x: 0, y: -50 },
      acceleration: { x: 0, y: 200 },
      startScale: 1.2,
      endScale: 0.3,
      startAlpha: 0.9,
      endAlpha: 0,
      tint: teamColor,
    });

    // Debris particles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 100 + Math.random() * 50;
      const particle = this.getParticle();
      if (!particle) break;

      particle.init(x, y, {
        texture: this.textures.particle,
        lifetime: 1.0,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 20,
        },
        acceleration: { x: 0, y: 150 },
        startScale: 0.8,
        endScale: 0.2,
        startAlpha: 1.0,
        endAlpha: 0,
        rotationSpeed: Math.random() * 10 - 5,
        tint: 0x666666,
      });
    }
  }

  createHitEffect(x: number, y: number) {
    // Impact particles
    this.emit(x, y, 8, {
      lifetime: 0.3,
      velocity: { x: 0, y: 0 },
      startScale: 0.3,
      endScale: 1.0,
      startAlpha: 0.8,
      endAlpha: 0,
      tint: 0xffff00,
    });
  }

  getActiveParticleCount(): number {
    return this.activeParticles;
  }

  destroy() {
    this.particles.forEach(p => p.sprite.destroy());
    this.particles = [];
    this.particlePool = [];
    this.container.destroy();
  }
}