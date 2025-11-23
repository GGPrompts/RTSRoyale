// Visual effects for abilities in RTS Arena
import { Container, Sprite, Graphics, BlurFilter } from 'pixi.js';
import { TextureAssets } from '../assets/textures';
import { ParticleSystem } from '../rendering/particles';

interface ActiveEffect {
  type: 'dash' | 'shield' | 'projectile';
  sprite?: Sprite;
  graphics?: Graphics;
  startTime: number;
  duration: number;
  entityId?: number;
  startPos?: { x: number; y: number };
  endPos?: { x: number; y: number };
  update: (deltaTime: number, currentTime: number) => boolean;
}

export class AbilityEffects {
  private container: Container;
  private textures: TextureAssets;
  private particleSystem: ParticleSystem;
  private activeEffects: ActiveEffect[] = [];
  private effectPool: Map<string, (Sprite | Graphics)[]> = new Map();

  constructor(parent: Container, textures: TextureAssets, particleSystem: ParticleSystem) {
    this.container = new Container();
    parent.addChild(this.container);
    this.textures = textures;
    this.particleSystem = particleSystem;

    // Initialize effect pools
    this.initializePools();
  }

  private initializePools() {
    // Pool for dash afterimages
    const dashPool: Sprite[] = [];
    for (let i = 0; i < 20; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      dashPool.push(sprite);
    }
    this.effectPool.set('dash', dashPool);

    // Pool for projectiles
    const projectilePool: Sprite[] = [];
    for (let i = 0; i < 50; i++) {
      const sprite = new Sprite(this.textures.projectile);
      sprite.anchor.set(0.5, 0.5);
      sprite.visible = false;
      projectilePool.push(sprite);
    }
    this.effectPool.set('projectile', projectilePool);

    // Pool for shields
    const shieldPool: Sprite[] = [];
    for (let i = 0; i < 20; i++) {
      const sprite = new Sprite(this.textures.shieldBubble);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      shieldPool.push(sprite);
    }
    this.effectPool.set('shield', shieldPool);
  }

  update(deltaTime: number) {
    const currentTime = Date.now() / 1000;

    // Update all active effects
    this.activeEffects = this.activeEffects.filter(effect => {
      const shouldContinue = effect.update(deltaTime, currentTime);

      if (!shouldContinue) {
        // Return to pool
        if (effect.sprite) {
          effect.sprite.visible = false;
          const pool = this.effectPool.get(effect.type);
          if (pool) {
            pool.push(effect.sprite);
          }
        }
        if (effect.graphics) {
          this.container.removeChild(effect.graphics);
          effect.graphics.destroy();
        }
      }

      return shouldContinue;
    });
  }

  // Create dash effect with afterimages and speed lines
  createDashEffect(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    unitTexture: Texture,
    teamColor: number
  ) {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Create particle trail
    this.particleSystem.createDashEffect(startX, startY, endX, endY);

    // Create afterimages
    const afterimageCount = 5;
    for (let i = 0; i < afterimageCount; i++) {
      const pool = this.effectPool.get('dash') as Sprite[];
      const sprite = pool.pop();
      if (!sprite) break;

      const t = i / afterimageCount;
      sprite.texture = unitTexture;
      sprite.x = startX + dx * t;
      sprite.y = startY + dy * t;
      sprite.rotation = angle + Math.PI / 2;
      sprite.alpha = 0.6 * (1 - t);
      sprite.scale.set(1.0 - t * 0.3);
      sprite.tint = teamColor;
      sprite.visible = true;

      this.container.addChild(sprite);

      const effect: ActiveEffect = {
        type: 'dash',
        sprite,
        startTime: Date.now() / 1000,
        duration: 0.4,
        update: (deltaTime, currentTime) => {
          const elapsed = currentTime - effect.startTime;
          const progress = elapsed / effect.duration;

          if (progress >= 1) {
            this.container.removeChild(sprite);
            return false;
          }

          sprite.alpha = 0.6 * (1 - progress);
          return true;
        },
      };

      this.activeEffects.push(effect);
    }

    // Create speed lines
    const speedLines = new Graphics();
    speedLines.alpha = 0.6;

    for (let i = 0; i < 8; i++) {
      const lineLength = distance + Math.random() * 50;
      const lineOffset = (Math.random() - 0.5) * 40;

      const perpAngle = angle + Math.PI / 2;
      const lineStartX = startX + Math.cos(perpAngle) * lineOffset;
      const lineStartY = startY + Math.sin(perpAngle) * lineOffset;
      const lineEndX = lineStartX + Math.cos(angle) * lineLength;
      const lineEndY = lineStartY + Math.sin(angle) * lineLength;

      speedLines.moveTo(lineStartX, lineStartY);
      speedLines.lineTo(lineEndX, lineEndY);
      speedLines.stroke({ color: 0x00ffff, width: 2 - i * 0.2, alpha: 0.8 - i * 0.1 });
    }

    this.container.addChild(speedLines);

    const speedLineEffect: ActiveEffect = {
      type: 'dash',
      graphics: speedLines,
      startTime: Date.now() / 1000,
      duration: 0.3,
      update: (deltaTime, currentTime) => {
        const elapsed = currentTime - speedLineEffect.startTime;
        const progress = elapsed / speedLineEffect.duration;

        if (progress >= 1) {
          return false;
        }

        speedLines.alpha = 0.6 * (1 - progress);
        return true;
      },
    };

    this.activeEffects.push(speedLineEffect);
  }

  // Create shield bubble effect
  createShieldEffect(x: number, y: number, entityId: number): ActiveEffect {
    const pool = this.effectPool.get('shield') as Sprite[];
    const sprite = pool.pop();

    if (!sprite) {
      console.warn('Shield effect pool exhausted');
      return null as any;
    }

    sprite.x = x;
    sprite.y = y;
    sprite.alpha = 0;
    sprite.scale.set(0.5);
    sprite.visible = true;
    sprite.tint = 0x00aaff;

    // Add blur filter for glow effect
    const blurFilter = new BlurFilter();
    blurFilter.blur = 2;
    sprite.filters = [blurFilter];

    this.container.addChild(sprite);

    // Create pulsing particles
    this.particleSystem.createShieldEffect(x, y);

    const effect: ActiveEffect = {
      type: 'shield',
      sprite,
      entityId,
      startTime: Date.now() / 1000,
      duration: 3.0, // Shield duration
      update: (deltaTime, currentTime) => {
        const elapsed = currentTime - effect.startTime;
        const progress = elapsed / effect.duration;

        if (progress >= 1) {
          this.container.removeChild(sprite);
          sprite.filters = [];
          return false;
        }

        // Fade in/out
        if (progress < 0.1) {
          sprite.alpha = progress * 10;
          sprite.scale.set(0.5 + progress * 5);
        } else if (progress > 0.8) {
          sprite.alpha = (1 - progress) * 5;
        } else {
          sprite.alpha = 0.7;
          sprite.scale.set(1.0);
        }

        // Pulsing effect
        const pulse = Math.sin(elapsed * 5) * 0.1 + 1.0;
        sprite.scale.set(sprite.scale.x * pulse);

        // Rotation
        sprite.rotation += deltaTime * 0.5;

        // Emit occasional particles
        if (Math.random() < 0.1) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 35 + Math.random() * 10;
          this.particleSystem.emit(
            x + Math.cos(angle) * dist,
            y + Math.sin(angle) * dist,
            1,
            {
              lifetime: 0.5,
              velocity: { x: 0, y: -20 },
              startScale: 0.3,
              endScale: 0,
              tint: 0x00ffff,
            }
          );
        }

        return true;
      },
    };

    this.activeEffects.push(effect);
    return effect;
  }

  // Create projectile with trail
  createProjectile(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    speed: number = 500
  ) {
    const pool = this.effectPool.get('projectile') as Sprite[];
    const sprite = pool.pop();

    if (!sprite) {
      console.warn('Projectile pool exhausted');
      return;
    }

    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    sprite.x = startX;
    sprite.y = startY;
    sprite.rotation = angle;
    sprite.visible = true;
    sprite.scale.set(1);
    sprite.alpha = 1;

    this.container.addChild(sprite);

    const effect: ActiveEffect = {
      type: 'projectile',
      sprite,
      startTime: Date.now() / 1000,
      duration: distance / speed,
      startPos: { x: startX, y: startY },
      endPos: { x: endX, y: endY },
      update: (deltaTime, currentTime) => {
        const elapsed = currentTime - effect.startTime;
        const progress = Math.min(elapsed / effect.duration, 1);

        if (progress >= 1) {
          // Create impact effect
          this.particleSystem.createHitEffect(endX, endY);
          this.container.removeChild(sprite);
          return false;
        }

        // Update position
        sprite.x = startX + dx * progress;
        sprite.y = startY + dy * progress;

        // Create trail particle
        if (Math.random() < 0.3) {
          this.particleSystem.createProjectileTrail(sprite.x, sprite.y, angle);
        }

        // Slight wobble
        sprite.rotation = angle + Math.sin(elapsed * 20) * 0.1;

        return true;
      },
    };

    this.activeEffects.push(effect);
  }

  // Update shield position for moving entities
  updateShieldPosition(entityId: number, x: number, y: number) {
    const shieldEffect = this.activeEffects.find(
      e => e.type === 'shield' && e.entityId === entityId
    );

    if (shieldEffect && shieldEffect.sprite) {
      shieldEffect.sprite.x = x;
      shieldEffect.sprite.y = y;
    }
  }

  // Remove shield effect for an entity
  removeShieldEffect(entityId: number) {
    const index = this.activeEffects.findIndex(
      e => e.type === 'shield' && e.entityId === entityId
    );

    if (index !== -1) {
      const effect = this.activeEffects[index];
      if (effect.sprite) {
        this.container.removeChild(effect.sprite);
        effect.sprite.visible = false;
        const pool = this.effectPool.get('shield');
        if (pool) {
          pool.push(effect.sprite);
        }
      }
      this.activeEffects.splice(index, 1);
    }
  }

  destroy() {
    this.activeEffects.forEach(effect => {
      if (effect.sprite) {
        effect.sprite.destroy();
      }
      if (effect.graphics) {
        effect.graphics.destroy();
      }
    });

    this.effectPool.forEach(pool => {
      pool.forEach((item: any) => item.destroy());
    });

    this.container.destroy();
  }
}