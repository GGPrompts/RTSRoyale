import { Container, Graphics } from 'pixi.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  graphic: Graphics;
}

export class ParticleSystem {
  private container: Container;
  private particles: Particle[] = [];
  private particlePool: Graphics[] = [];

  constructor() {
    this.container = new Container();
  }

  getContainer() {
    return this.container;
  }

  spawnCombatHit(x: number, y: number) {
    // Small burst of particles on hit
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 50;

      this.spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        color: 0xffaa00,
        size: 2 + Math.random() * 2,
      });
    }
  }

  spawnDeathExplosion(x: number, y: number, color: number) {
    // Large explosion on death
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;

      this.spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  spawnDamageNumber(x: number, y: number, damage: number) {
    // Floating damage numbers handled separately
    // For now, just spawn particles
    this.spawnParticle({
      x,
      y,
      vx: 0,
      vy: -50, // Float upward
      life: 1.0,
      color: 0xff0000,
      size: 8,
    });
  }

  private spawnParticle(config: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: number;
    size: number;
  }) {
    let graphic = this.particlePool.pop();
    if (!graphic) {
      graphic = new Graphics();
      this.container.addChild(graphic);
    }

    const particle: Particle = {
      x: config.x,
      y: config.y,
      vx: config.vx,
      vy: config.vy,
      life: config.life,
      maxLife: config.life,
      color: config.color,
      size: config.size,
      graphic,
    };

    this.particles.push(particle);
  }

  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update physics
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;

      // Apply gravity
      p.vy += 200 * deltaTime;

      if (p.life <= 0) {
        // Return to pool
        p.graphic.clear();
        this.particlePool.push(p.graphic);
        this.particles.splice(i, 1);
      } else {
        // Render particle
        const alpha = p.life / p.maxLife;
        p.graphic.clear();
        p.graphic.circle(p.x, p.y, p.size);
        p.graphic.fill({ color: p.color, alpha });
      }
    }
  }

  getActiveParticleCount(): number {
    return this.particles.length;
  }

  getPoolSize(): number {
    return this.particlePool.length;
  }

  destroy() {
    for (const p of this.particles) {
      p.graphic.destroy();
    }
    for (const g of this.particlePool) {
      g.destroy();
    }
    this.particles = [];
    this.particlePool = [];
    this.container.destroy();
  }
}
