// Sprite management and pooling system for RTS Arena
import { Sprite, Container, Texture } from 'pixi.js';
import { Position, Velocity, Team, Health, Sprite as SpriteComponent, Selected, Dead } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';
import { defineQuery, hasComponent, removeEntity } from 'bitecs';
import { TextureAssets } from '../assets/textures';

export class SpriteSystem {
  private container: Container;
  private textures: TextureAssets;
  private entitySprites: Map<number, UnitSprite>;
  private spritePool: Sprite[];
  private maxPoolSize = 200;

  constructor(container: Container, textures: TextureAssets) {
    this.container = container;
    this.textures = textures;
    this.entitySprites = new Map();
    this.spritePool = [];

    // Pre-populate sprite pool
    this.initializeSpritePool();
  }

  private initializeSpritePool() {
    for (let i = 0; i < this.maxPoolSize; i++) {
      const sprite = new Sprite();
      sprite.visible = false;
      sprite.anchor.set(0.5);
      this.spritePool.push(sprite);
    }
  }

  private getPooledSprite(): Sprite | null {
    const sprite = this.spritePool.pop();
    if (sprite) {
      sprite.visible = true;
      return sprite;
    }
    // If pool is empty, create a new sprite
    if (this.entitySprites.size < this.maxPoolSize * 2) {
      const newSprite = new Sprite();
      newSprite.anchor.set(0.5);
      return newSprite;
    }
    return null;
  }

  private returnToPool(sprite: Sprite) {
    sprite.visible = false;
    sprite.tint = 0xffffff;
    sprite.alpha = 1.0;
    sprite.scale.set(1.0);
    sprite.rotation = 0;
    if (this.spritePool.length < this.maxPoolSize) {
      this.spritePool.push(sprite);
    } else {
      sprite.destroy();
    }
  }

  update(world: GameWorld, deltaTime: number) {
    // Query for all entities with sprites
    const spriteQuery = defineQuery([Position, SpriteComponent, Team]);
    const entities = spriteQuery(world);

    // Update existing sprites and create new ones
    for (const eid of entities) {
      let unitSprite = this.entitySprites.get(eid);

      // Create sprite if it doesn't exist
      if (!unitSprite) {
        const sprite = this.getPooledSprite();
        if (!sprite) continue;

        // Get texture based on team
        const teamId = Team.id[eid];
        const texture = teamId === 0 ? this.textures.unitBlue : this.textures.unitRed;
        sprite.texture = texture;

        unitSprite = new UnitSprite(sprite, eid);
        this.container.addChild(sprite);
        this.entitySprites.set(eid, unitSprite);
      }

      // Update sprite position
      const x = Position.x[eid];
      const y = Position.y[eid];
      unitSprite.sprite.x = x;
      unitSprite.sprite.y = y;

      // Update rotation based on velocity (face movement direction)
      if (hasComponent(world, eid, Velocity)) {
        const vx = Velocity.x[eid];
        const vy = Velocity.y[eid];
        const speed = Math.sqrt(vx * vx + vy * vy);

        if (speed > 0.1) {
          const targetRotation = Math.atan2(vy, vx) + Math.PI / 2;
          // Smooth rotation lerp
          const currentRotation = unitSprite.sprite.rotation;
          const diff = targetRotation - currentRotation;
          const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
          unitSprite.sprite.rotation += normalizedDiff * 0.15;
        }
      }

      // Update scale based on sprite component
      unitSprite.sprite.scale.set(
        SpriteComponent.scaleX[eid],
        SpriteComponent.scaleY[eid]
      );

      // Handle selection tint
      if (hasComponent(world, eid, Selected)) {
        const isSelected = Selected.value[eid] > 0;
        if (isSelected && !unitSprite.selected) {
          unitSprite.selected = true;
          // Add selection ring
          this.addSelectionRing(unitSprite);
        } else if (!isSelected && unitSprite.selected) {
          unitSprite.selected = false;
          this.removeSelectionRing(unitSprite);
        }
      }

      // Handle health-based scaling (wounded units slightly smaller)
      if (hasComponent(world, eid, Health)) {
        const healthPercent = Health.current[eid] / Health.max[eid];
        if (healthPercent < 0.3) {
          const scaleFactor = 0.85 + healthPercent * 0.15;
          unitSprite.sprite.scale.set(
            SpriteComponent.scaleX[eid] * scaleFactor,
            SpriteComponent.scaleY[eid] * scaleFactor
          );
        }
      }

      // Update hit flash animation
      unitSprite.updateHitFlash(deltaTime);

      // Handle death state
      if (hasComponent(world, eid, Dead)) {
        if (!unitSprite.dying) {
          unitSprite.dying = true;
          unitSprite.deathTimer = 0.5;
        }
      }

      // Update death animation
      if (unitSprite.dying) {
        unitSprite.deathTimer -= deltaTime;
        const progress = 1.0 - unitSprite.deathTimer / 0.5;

        // Fade out and scale down
        unitSprite.sprite.alpha = 1.0 - progress;
        unitSprite.sprite.scale.set(
          SpriteComponent.scaleX[eid] * (1.0 - progress * 0.3),
          SpriteComponent.scaleY[eid] * (1.0 - progress * 0.3)
        );

        // Rotate during death
        unitSprite.sprite.rotation += deltaTime * 3;

        // Remove when animation completes
        if (unitSprite.deathTimer <= 0) {
          this.removeSprite(eid);
          removeEntity(world, eid);
        }
      }
    }

    // Clean up sprites for entities that no longer exist
    const entitiesToRemove: number[] = [];
    this.entitySprites.forEach((sprite, eid) => {
      if (!entities.includes(eid) && !sprite.dying) {
        entitiesToRemove.push(eid);
      }
    });

    entitiesToRemove.forEach(eid => this.removeSprite(eid));
  }

  private addSelectionRing(unitSprite: UnitSprite) {
    if (!unitSprite.selectionRing) {
      const ring = new Sprite(this.textures.selectionRing);
      ring.anchor.set(0.5);
      ring.alpha = 0.7;
      this.container.addChild(ring);
      unitSprite.selectionRing = ring;
    }
  }

  private removeSelectionRing(unitSprite: UnitSprite) {
    if (unitSprite.selectionRing) {
      this.container.removeChild(unitSprite.selectionRing);
      unitSprite.selectionRing.destroy();
      unitSprite.selectionRing = null;
    }
  }

  private removeSprite(eid: number) {
    const unitSprite = this.entitySprites.get(eid);
    if (unitSprite) {
      this.removeSelectionRing(unitSprite);
      this.container.removeChild(unitSprite.sprite);
      this.returnToPool(unitSprite.sprite);
      this.entitySprites.delete(eid);
    }
  }

  // Apply hit flash effect
  applyHitFlash(eid: number) {
    const unitSprite = this.entitySprites.get(eid);
    if (unitSprite) {
      unitSprite.startHitFlash();
    }
  }

  // Get sprite for external effects
  getSpritePosition(eid: number): { x: number; y: number } | null {
    const unitSprite = this.entitySprites.get(eid);
    if (unitSprite) {
      return { x: unitSprite.sprite.x, y: unitSprite.sprite.y };
    }
    return null;
  }

  destroy() {
    this.entitySprites.forEach(sprite => {
      this.removeSelectionRing(sprite);
      sprite.sprite.destroy();
    });
    this.entitySprites.clear();
    this.spritePool.forEach(sprite => sprite.destroy());
    this.spritePool = [];
  }
}

// Unit sprite wrapper class
class UnitSprite {
  sprite: Sprite;
  entityId: number;
  selected: boolean = false;
  selectionRing: Sprite | null = null;
  hitFlashTimer: number = 0;
  originalTint: number = 0xffffff;
  dying: boolean = false;
  deathTimer: number = 0;

  constructor(sprite: Sprite, entityId: number) {
    this.sprite = sprite;
    this.entityId = entityId;
  }

  startHitFlash() {
    this.hitFlashTimer = 0.15; // Flash duration
    this.originalTint = this.sprite.tint;
  }

  updateHitFlash(deltaTime: number) {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;

      // Flash white
      if (this.hitFlashTimer > 0.05) {
        this.sprite.tint = 0xffffff;
      } else {
        this.sprite.tint = this.originalTint;
      }
    }
  }

  updateSelectionRing(deltaTime: number) {
    if (this.selectionRing) {
      // Update selection ring position
      this.selectionRing.x = this.sprite.x;
      this.selectionRing.y = this.sprite.y;

      // Animate rotation
      this.selectionRing.rotation += deltaTime * 2;

      // Pulse effect
      const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
      this.selectionRing.scale.set(pulse);
    }
  }
}