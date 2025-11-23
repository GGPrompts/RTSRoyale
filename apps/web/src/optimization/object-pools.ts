// RTS Arena - Object Pooling System
// Prevents GC pressure by reusing objects instead of creating/destroying them

export interface Poolable {
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;
  private expandSize: number;

  // Statistics
  private stats = {
    created: 0,
    acquired: 0,
    released: 0,
    expanded: 0,
    maxInUse: 0
  };

  constructor(
    createFn: () => T,
    initialSize: number = 10,
    maxSize: number = 1000,
    expandSize: number = 10,
    resetFn?: (obj: T) => void
  ) {
    this.createFn = createFn;
    this.maxSize = maxSize;
    this.expandSize = expandSize;
    this.resetFn = resetFn;

    // Pre-allocate initial objects
    this.expand(initialSize);
  }

  private expand(count: number): void {
    const toCreate = Math.min(count, this.maxSize - this.available.length - this.inUse.size);

    for (let i = 0; i < toCreate; i++) {
      const obj = this.createFn();
      this.available.push(obj);
      this.stats.created++;
    }

    this.stats.expanded++;

    if (toCreate < count) {
      console.warn(`Object pool reached max size (${this.maxSize}). Cannot expand further.`);
    }
  }

  public acquire(): T | null {
    // Expand pool if empty
    if (this.available.length === 0) {
      if (this.available.length + this.inUse.size < this.maxSize) {
        this.expand(this.expandSize);
      } else {
        console.warn('Object pool exhausted. Consider increasing maxSize.');
        return null;
      }
    }

    const obj = this.available.pop();
    if (obj) {
      this.inUse.add(obj);
      this.stats.acquired++;
      this.stats.maxInUse = Math.max(this.stats.maxInUse, this.inUse.size);
      return obj;
    }

    return null;
  }

  public release(obj: T): void {
    if (!this.inUse.has(obj)) {
      console.warn('Attempting to release object not from this pool');
      return;
    }

    // Reset the object
    if (this.resetFn) {
      this.resetFn(obj);
    } else {
      obj.reset();
    }

    this.inUse.delete(obj);
    this.available.push(obj);
    this.stats.released++;
  }

  public releaseAll(): void {
    this.inUse.forEach(obj => {
      if (this.resetFn) {
        this.resetFn(obj);
      } else {
        obj.reset();
      }
      this.available.push(obj);
    });
    this.stats.released += this.inUse.size;
    this.inUse.clear();
  }

  public getStats() {
    return {
      ...this.stats,
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      utilization: (this.inUse.size / (this.available.length + this.inUse.size)) * 100
    };
  }

  public clear(): void {
    this.available = [];
    this.inUse.clear();
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      expanded: 0,
      maxInUse: 0
    };
  }
}

// Specialized pools for common game objects

import { Graphics, Sprite, Container, ParticleContainer, Text } from 'pixi.js';

// Graphics pool
export class GraphicsPool {
  private pool: ObjectPool<Graphics>;

  constructor(initialSize = 50, maxSize = 500) {
    this.pool = new ObjectPool(
      () => {
        const g = new Graphics();
        (g as any).reset = () => {
          g.clear();
          g.position.set(0, 0);
          g.scale.set(1, 1);
          g.rotation = 0;
          g.alpha = 1;
          g.visible = true;
          g.tint = 0xffffff;
        };
        return g as Graphics & Poolable;
      },
      initialSize,
      maxSize,
      10
    );
  }

  acquire(): Graphics | null {
    return this.pool.acquire();
  }

  release(graphics: Graphics): void {
    // Remove from parent if attached
    if (graphics.parent) {
      graphics.parent.removeChild(graphics);
    }
    this.pool.release(graphics as Graphics & Poolable);
  }

  getStats() {
    return this.pool.getStats();
  }
}

// Sprite pool
export class SpritePool {
  private pool: ObjectPool<Sprite>;

  constructor(initialSize = 100, maxSize = 1000) {
    this.pool = new ObjectPool(
      () => {
        const s = new Sprite();
        (s as any).reset = () => {
          s.texture = null as any;
          s.position.set(0, 0);
          s.scale.set(1, 1);
          s.rotation = 0;
          s.alpha = 1;
          s.visible = true;
          s.tint = 0xffffff;
          s.anchor.set(0.5);
        };
        return s as Sprite & Poolable;
      },
      initialSize,
      maxSize,
      20
    );
  }

  acquire(): Sprite | null {
    return this.pool.acquire();
  }

  release(sprite: Sprite): void {
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }
    this.pool.release(sprite as Sprite & Poolable);
  }

  releaseAll(): void {
    this.pool.releaseAll();
  }

  getStats() {
    return this.pool.getStats();
  }
}

// Container pool
export class ContainerPool {
  private pool: ObjectPool<Container>;

  constructor(initialSize = 20, maxSize = 200) {
    this.pool = new ObjectPool(
      () => {
        const c = new Container();
        (c as any).reset = () => {
          c.removeChildren();
          c.position.set(0, 0);
          c.scale.set(1, 1);
          c.rotation = 0;
          c.alpha = 1;
          c.visible = true;
        };
        return c as Container & Poolable;
      },
      initialSize,
      maxSize,
      5
    );
  }

  acquire(): Container | null {
    return this.pool.acquire();
  }

  release(container: Container): void {
    if (container.parent) {
      container.parent.removeChild(container);
    }
    this.pool.release(container as Container & Poolable);
  }

  getStats() {
    return this.pool.getStats();
  }
}

// Particle data pool (for particle effects)
export interface ParticleData extends Poolable {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export class ParticleDataPool {
  private pool: ObjectPool<ParticleData>;

  constructor(initialSize = 200, maxSize = 1000) {
    this.pool = new ObjectPool(
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        color: 0xffffff,
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0,
        reset() {
          this.x = 0;
          this.y = 0;
          this.vx = 0;
          this.vy = 0;
          this.life = 0;
          this.maxLife = 1;
          this.size = 1;
          this.color = 0xffffff;
          this.alpha = 1;
          this.rotation = 0;
          this.rotationSpeed = 0;
        }
      }),
      initialSize,
      maxSize,
      50
    );
  }

  acquire(): ParticleData | null {
    return this.pool.acquire();
  }

  release(particle: ParticleData): void {
    this.pool.release(particle);
  }

  releaseAll(): void {
    this.pool.releaseAll();
  }

  getStats() {
    return this.pool.getStats();
  }
}

// Global pool manager
export class PoolManager {
  private static instance: PoolManager;

  public graphics: GraphicsPool;
  public sprites: SpritePool;
  public containers: ContainerPool;
  public particles: ParticleDataPool;

  private constructor() {
    this.graphics = new GraphicsPool(50, 500);
    this.sprites = new SpritePool(100, 1000);
    this.containers = new ContainerPool(20, 200);
    this.particles = new ParticleDataPool(200, 1000);
  }

  public static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  public getStats() {
    return {
      graphics: this.graphics.getStats(),
      sprites: this.sprites.getStats(),
      containers: this.containers.getStats(),
      particles: this.particles.getStats()
    };
  }

  public logStats(): void {
    const stats = this.getStats();
    console.group('🏊 Object Pool Statistics');
    console.table({
      Graphics: {
        'In Use': stats.graphics.inUse,
        Available: stats.graphics.available,
        Total: stats.graphics.total,
        'Utilization %': stats.graphics.utilization.toFixed(1)
      },
      Sprites: {
        'In Use': stats.sprites.inUse,
        Available: stats.sprites.available,
        Total: stats.sprites.total,
        'Utilization %': stats.sprites.utilization.toFixed(1)
      },
      Containers: {
        'In Use': stats.containers.inUse,
        Available: stats.containers.available,
        Total: stats.containers.total,
        'Utilization %': stats.containers.utilization.toFixed(1)
      },
      Particles: {
        'In Use': stats.particles.inUse,
        Available: stats.particles.available,
        Total: stats.particles.total,
        'Utilization %': stats.particles.utilization.toFixed(1)
      }
    });
    console.groupEnd();
  }
}

// Export singleton instance
export const pools = PoolManager.getInstance();