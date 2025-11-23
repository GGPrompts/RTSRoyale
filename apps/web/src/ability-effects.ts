// Visual Effects System for Abilities
import { Application, Graphics, Container, ParticleContainer, Sprite, Texture, Filter, BlurFilter } from 'pixi.js';
import { defineQuery, removeEntity } from 'bitecs';
import { Position, VisualEffect, Projectile, AbilityState, Facing } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';

// Store effect graphics by entity ID
const effectGraphics = new Map<number, Graphics | Container>();
const projectileSprites = new Map<number, Graphics>();

// Containers for different effect layers
let dashContainer: Container;
let shieldContainer: Container;
let projectileContainer: Container;
let explosionContainer: Container;

// Define queries
const effectQuery = defineQuery([Position, VisualEffect]);
const projectileQuery = defineQuery([Position, Projectile, VisualEffect]);
const shieldQuery = defineQuery([Position, AbilityState]);

export function initAbilityEffects(app: Application): void {
  console.log('🎨 Initializing ability visual effects...');

  // Create effect containers with proper layering
  dashContainer = new Container();
  shieldContainer = new Container();
  projectileContainer = new Container();
  explosionContainer = new Container();

  // Add containers to stage in order (bottom to top)
  app.stage.addChild(dashContainer);
  app.stage.addChild(projectileContainer);
  app.stage.addChild(shieldContainer);
  app.stage.addChild(explosionContainer);

  console.log('✅ Ability visual effects initialized');
}

export function renderAbilityEffects(world: GameWorld, app: Application): void {
  const deltaTime = world.deltaTime;

  // Update all visual effects
  const effects = effectQuery(world);

  for (let i = 0; i < effects.length; i++) {
    const eid = effects[i];

    // Update effect duration
    VisualEffect.duration[eid] -= deltaTime;

    // Remove expired effects
    if (VisualEffect.duration[eid] <= 0) {
      removeEffect(eid);
      removeEntity(world, eid);
      continue;
    }

    const effectType = VisualEffect.type[eid];
    const x = Position.x[eid];
    const y = Position.y[eid];
    const alpha = VisualEffect.alpha[eid];
    const progress = 1 - (VisualEffect.duration[eid] / VisualEffect.maxDuration[eid]);

    // Get or create graphics for this effect
    let graphics = effectGraphics.get(eid);

    switch (effectType) {
      case 0: // Dash trail
        if (!graphics) {
          graphics = createDashEffect(x, y);
          dashContainer.addChild(graphics);
          effectGraphics.set(eid, graphics);
        }
        updateDashEffect(graphics as Graphics, progress);
        break;

      case 1: // Shield bubble
        if (!graphics) {
          graphics = createShieldEffect(x, y);
          shieldContainer.addChild(graphics);
          effectGraphics.set(eid, graphics);
        }
        updateShieldEffect(graphics as Graphics, x, y, progress);
        break;

      case 2: // Projectile trail
        // Handled separately in renderProjectiles
        break;

      case 3: // Explosion
        if (!graphics) {
          graphics = createExplosionEffect(x, y);
          explosionContainer.addChild(graphics);
          effectGraphics.set(eid, graphics);
        }
        updateExplosionEffect(graphics as Graphics, progress);
        break;
    }

    // Update position if graphics exist
    if (graphics && effectType !== 1) { // Shield follows unit
      graphics.x = x;
      graphics.y = y;
    }
  }

  // Render projectiles
  renderProjectiles(world);

  // Render active shields on units
  renderActiveShields(world);
}

// DASH EFFECT - Motion blur and afterimage trail
function createDashEffect(x: number, y: number): Graphics {
  const graphics = new Graphics();

  // Create multiple afterimage lines for trail effect
  for (let i = 0; i < 5; i++) {
    const offset = i * 10;
    graphics.moveTo(-offset, 0);
    graphics.lineTo(-offset - 20, 0);
    graphics.stroke({
      color: 0x00ffff,
      width: 3 - i * 0.5,
      alpha: 1 - i * 0.2,
    });
  }

  // Add glow effect
  const blurFilter = new BlurFilter();
  blurFilter.blur = 8;
  graphics.filters = [blurFilter];

  return graphics;
}

function updateDashEffect(graphics: Graphics, progress: number): void {
  // Fade out over time
  graphics.alpha = 1 - progress;

  // Scale down
  graphics.scale.x = 1 + progress * 0.5;
}

// SHIELD EFFECT - Glowing bubble with pulsing
function createShieldEffect(x: number, y: number): Graphics {
  const graphics = new Graphics();
  return graphics;
}

function updateShieldEffect(graphics: Graphics, x: number, y: number, progress: number): void {
  graphics.clear();

  // Pulsing effect
  const pulse = Math.sin(progress * Math.PI * 6) * 0.1 + 1;
  const radius = 30 * pulse;

  // Draw outer glow
  graphics.circle(0, 0, radius + 5);
  graphics.fill({ color: 0x4444ff, alpha: 0.2 });

  // Draw main shield bubble
  graphics.circle(0, 0, radius);
  graphics.stroke({
    color: 0x44aaff,
    width: 2,
    alpha: 0.8,
  });

  // Inner glow
  graphics.circle(0, 0, radius - 2);
  graphics.fill({ color: 0x88ccff, alpha: 0.1 });

  // Hex pattern overlay (simplified)
  const hexRadius = 10;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i + progress * 2;
    const hx = Math.cos(angle) * (radius - hexRadius);
    const hy = Math.sin(angle) * (radius - hexRadius);

    graphics.regularPoly(hx, hy, hexRadius, 6, 0);
    graphics.stroke({
      color: 0x88ddff,
      width: 1,
      alpha: 0.3,
    });
  }

  graphics.x = x;
  graphics.y = y;
}

// PROJECTILE RENDERING
function renderProjectiles(world: GameWorld): void {
  const projectiles = projectileQuery(world);

  for (let i = 0; i < projectiles.length; i++) {
    const eid = projectiles[i];

    let sprite = projectileSprites.get(eid);

    if (!sprite) {
      sprite = createProjectileSprite();
      projectileContainer.addChild(sprite);
      projectileSprites.set(eid, sprite);
    }

    // Update position
    sprite.x = Position.x[eid];
    sprite.y = Position.y[eid];

    // Calculate rotation based on velocity
    const vx = Projectile.targetX[eid] - Position.x[eid];
    const vy = Projectile.targetY[eid] - Position.y[eid];
    sprite.rotation = Math.atan2(vy, vx);

    // Fade based on lifetime
    const lifetime = Projectile.lifetime[eid];
    sprite.alpha = Math.min(1, lifetime * 2);
  }

  // Clean up destroyed projectiles
  projectileSprites.forEach((sprite, eid) => {
    const exists = projectiles.includes(eid);
    if (!exists) {
      projectileContainer.removeChild(sprite);
      sprite.destroy();
      projectileSprites.delete(eid);
    }
  });
}

function createProjectileSprite(): Graphics {
  const graphics = new Graphics();

  // Projectile body (energy orb)
  graphics.circle(0, 0, 5);
  graphics.fill({ color: 0xffaa00, alpha: 1 });

  // Outer glow
  graphics.circle(0, 0, 8);
  graphics.fill({ color: 0xff8800, alpha: 0.5 });

  // Trail effect (simple lines)
  for (let i = 1; i <= 3; i++) {
    graphics.moveTo(-i * 5, 0);
    graphics.lineTo(-i * 5 - 10, 0);
    graphics.stroke({
      color: 0xffaa00,
      width: 3 - i * 0.8,
      alpha: 1 - i * 0.3,
    });
  }

  return graphics;
}

// EXPLOSION EFFECT
function createExplosionEffect(x: number, y: number): Graphics {
  const graphics = new Graphics();
  return graphics;
}

function updateExplosionEffect(graphics: Graphics, progress: number): void {
  graphics.clear();

  const maxRadius = 40;
  const radius = maxRadius * (0.2 + progress * 0.8);
  const alpha = 1 - progress;

  // Outer ring
  graphics.circle(0, 0, radius);
  graphics.stroke({
    color: 0xff6600,
    width: 3,
    alpha: alpha * 0.8,
  });

  // Inner burst
  graphics.circle(0, 0, radius * 0.6);
  graphics.fill({
    color: 0xffaa00,
    alpha: alpha * 0.4,
  });

  // Core flash
  if (progress < 0.3) {
    graphics.circle(0, 0, radius * 0.3);
    graphics.fill({
      color: 0xffffff,
      alpha: (1 - progress * 3) * 0.8,
    });
  }

  // Particle bursts
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const dist = radius * 0.7;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    graphics.circle(px, py, 3);
    graphics.fill({
      color: 0xff8800,
      alpha: alpha * 0.6,
    });
  }

  graphics.alpha = alpha;
}

// ACTIVE SHIELD RENDERING (for units with shield buff active)
function renderActiveShields(world: GameWorld): void {
  const units = shieldQuery(world);

  for (let i = 0; i < units.length; i++) {
    const eid = units[i];

    // Check if unit has active shield
    if (AbilityState.damageReduction[eid] > 0) {
      const x = Position.x[eid];
      const y = Position.y[eid];

      // Get or create shield graphics
      let shieldGraphics = effectGraphics.get(eid + 10000); // Offset to avoid collision

      if (!shieldGraphics) {
        shieldGraphics = new Graphics();
        shieldContainer.addChild(shieldGraphics);
        effectGraphics.set(eid + 10000, shieldGraphics);
      }

      // Update shield visuals
      const graphics = shieldGraphics as Graphics;
      graphics.clear();

      // Simple pulsing shield bubble
      const time = Date.now() / 1000;
      const pulse = Math.sin(time * 3) * 0.05 + 1;

      graphics.circle(0, 0, 25 * pulse);
      graphics.stroke({
        color: 0x44aaff,
        width: 2,
        alpha: 0.6,
      });

      graphics.circle(0, 0, 23 * pulse);
      graphics.fill({
        color: 0x4488ff,
        alpha: 0.15,
      });

      graphics.x = x;
      graphics.y = y;
    } else {
      // Remove shield graphics if no longer active
      const shieldGraphics = effectGraphics.get(eid + 10000);
      if (shieldGraphics) {
        shieldContainer.removeChild(shieldGraphics);
        shieldGraphics.destroy();
        effectGraphics.delete(eid + 10000);
      }
    }
  }
}

// Clean up effect graphics
function removeEffect(eid: number): void {
  const graphics = effectGraphics.get(eid);
  if (graphics) {
    graphics.parent?.removeChild(graphics);
    graphics.destroy();
    effectGraphics.delete(eid);
  }
}

// Clean up all effects (for scene reset)
export function cleanupAbilityEffects(): void {
  effectGraphics.forEach((graphics) => {
    graphics.parent?.removeChild(graphics);
    graphics.destroy();
  });
  effectGraphics.clear();

  projectileSprites.forEach((sprite) => {
    sprite.parent?.removeChild(sprite);
    sprite.destroy();
  });
  projectileSprites.clear();
}