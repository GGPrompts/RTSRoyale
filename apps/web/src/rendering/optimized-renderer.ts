// RTS Arena - Optimized Rendering System
// Features: Frustum culling, sprite batching, object pooling

import { Application, Container, Graphics, Sprite, Texture, ParticleContainer } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Position, Sprite as SpriteComponent, Health, Team, Selected } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';
import { pools } from '../optimization/object-pools';
import { spatialHash } from '../optimization/spatial-hash';
import { profiler } from '../profiling/profiler';

// Queries - defined once, cached
const renderQuery = defineQuery([Position, SpriteComponent]);
const healthBarQuery = defineQuery([Position, Health]);
const selectedQuery = defineQuery([Position, Selected]);

export class OptimizedRenderer {
  private app: Application;
  private world: GameWorld;

  // Render layers
  private groundLayer: Container;
  private unitLayer: Container;
  private effectLayer: ParticleContainer;
  private uiLayer: Container;

  // View frustum
  private viewX = 0;
  private viewY = 0;
  private viewWidth = 1920;
  private viewHeight = 1080;

  // Sprite management
  private entitySprites = new Map<number, Sprite>();
  private healthBars = new Map<number, Graphics>();
  private selectionCircles = new Map<number, Graphics>();

  // Batching
  private spriteBatches = new Map<number, Container>(); // Group by texture ID

  // Statistics
  private stats = {
    visibleEntities: 0,
    culledEntities: 0,
    drawCalls: 0,
    sprites: 0,
    graphics: 0
  };

  constructor(app: Application, world: GameWorld) {
    this.app = app;
    this.world = world;

    // Initialize render layers
    this.groundLayer = new Container();
    this.unitLayer = new Container();
    this.effectLayer = new ParticleContainer(1000, {
      scale: true,
      position: true,
      rotation: true,
      alpha: true
    });
    this.uiLayer = new Container();

    // Add layers to stage in order
    app.stage.addChild(this.groundLayer);
    app.stage.addChild(this.unitLayer);
    app.stage.addChild(this.effectLayer);
    app.stage.addChild(this.uiLayer);

    // Set up view following (camera)
    this.setupCamera();

    // Update spatial hash with all entities
    this.updateSpatialHash();
  }

  private setupCamera(): void {
    // Simple camera following center of action
    // In a real game, this would follow selected units or mouse position
    this.app.ticker.add(() => {
      // Update view bounds
      this.viewX = this.app.stage.position.x * -1;
      this.viewY = this.app.stage.position.y * -1;
      this.viewWidth = this.app.renderer.width;
      this.viewHeight = this.app.renderer.height;
    });
  }

  private updateSpatialHash(): void {
    const entities = renderQuery(this.world);

    entities.forEach(eid => {
      spatialHash.insert({
        id: eid,
        x: Position.x[eid],
        y: Position.y[eid],
        radius: 20 // Default unit radius
      });
    });
  }

  public render(): void {
    profiler.beginSystem('rendering');

    // Reset stats
    this.stats.visibleEntities = 0;
    this.stats.culledEntities = 0;
    this.stats.sprites = 0;
    this.stats.graphics = 0;

    // Query visible entities using spatial hash
    const visibleEntities = spatialHash.queryViewFrustum(
      this.viewX,
      this.viewY,
      this.viewWidth,
      this.viewHeight
    );

    // Get all entities for culling stats
    const allEntities = renderQuery(this.world);
    this.stats.culledEntities = allEntities.length - visibleEntities.length;
    this.stats.visibleEntities = visibleEntities.length;

    // Clear previous frame's sprites
    this.clearBatches();

    // Render visible entities
    visibleEntities.forEach(eid => {
      this.renderEntity(eid);
    });

    // Update health bars for visible entities
    this.updateHealthBars(visibleEntities);

    // Update selection indicators
    this.updateSelections();

    // Update draw call estimate
    this.stats.drawCalls = this.unitLayer.children.length + this.uiLayer.children.length;

    profiler.endSystem('rendering');
  }

  private renderEntity(eid: number): void {
    // Get or create sprite from pool
    let sprite = this.entitySprites.get(eid);

    if (!sprite) {
      sprite = pools.sprites.acquire();
      if (!sprite) return; // Pool exhausted

      // Set texture based on team
      const textureId = SpriteComponent.textureId[eid];
      sprite.texture = this.getTexture(textureId);

      this.entitySprites.set(eid, sprite);
    }

    // Update sprite properties
    sprite.x = Position.x[eid];
    sprite.y = Position.y[eid];
    sprite.scale.x = SpriteComponent.scaleX[eid];
    sprite.scale.y = SpriteComponent.scaleY[eid];
    sprite.rotation = SpriteComponent.rotation[eid];

    // Add to appropriate batch container
    const textureId = SpriteComponent.textureId[eid];
    let batch = this.spriteBatches.get(textureId);

    if (!batch) {
      batch = new Container();
      this.spriteBatches.set(textureId, batch);
      this.unitLayer.addChild(batch);
    }

    if (sprite.parent !== batch) {
      batch.addChild(sprite);
    }

    this.stats.sprites++;
  }

  private updateHealthBars(visibleEntities: number[]): void {
    // Clear old health bars
    this.healthBars.forEach((bar, eid) => {
      if (!visibleEntities.includes(eid)) {
        if (bar.parent) {
          bar.parent.removeChild(bar);
        }
        pools.graphics.release(bar);
        this.healthBars.delete(eid);
      }
    });

    // Update visible health bars
    visibleEntities.forEach(eid => {
      if (Health.current[eid] === undefined) return;

      let healthBar = this.healthBars.get(eid);

      if (!healthBar) {
        healthBar = pools.graphics.acquire();
        if (!healthBar) return;

        this.healthBars.set(eid, healthBar);
        this.uiLayer.addChild(healthBar);
      }

      // Draw health bar
      healthBar.clear();

      const x = Position.x[eid] - 25;
      const y = Position.y[eid] - 35;
      const width = 50;
      const height = 4;
      const healthPercent = Health.current[eid] / Health.max[eid];

      // Background
      healthBar.rect(x, y, width, height);
      healthBar.fill({ color: 0x333333, alpha: 0.8 });

      // Health fill
      const healthColor = healthPercent > 0.5 ? 0x00ff00 :
                          healthPercent > 0.25 ? 0xffaa00 : 0xff0000;
      healthBar.rect(x, y, width * healthPercent, height);
      healthBar.fill({ color: healthColor });

      // Border
      healthBar.rect(x, y, width, height);
      healthBar.stroke({ color: 0x000000, width: 1 });

      this.stats.graphics++;
    });
  }

  private updateSelections(): void {
    const selectedEntities = selectedQuery(this.world);

    // Clear old selection circles
    this.selectionCircles.forEach((circle, eid) => {
      if (!selectedEntities.includes(eid) || !Selected.value[eid]) {
        if (circle.parent) {
          circle.parent.removeChild(circle);
        }
        pools.graphics.release(circle);
        this.selectionCircles.delete(eid);
      }
    });

    // Draw selection circles for selected units
    selectedEntities.forEach(eid => {
      if (!Selected.value[eid]) return;

      let circle = this.selectionCircles.get(eid);

      if (!circle) {
        circle = pools.graphics.acquire();
        if (!circle) return;

        this.selectionCircles.set(eid, circle);
        this.uiLayer.addChild(circle);
      }

      // Draw selection circle
      circle.clear();
      circle.circle(Position.x[eid], Position.y[eid], 25);
      circle.stroke({ color: 0x00ff00, width: 2, alpha: 0.8 });

      // Add pulsing effect
      const pulse = Math.sin(performance.now() * 0.005) * 0.2 + 0.8;
      circle.alpha = pulse;

      this.stats.graphics++;
    });
  }

  private clearBatches(): void {
    // Remove sprites from batches but keep them pooled
    this.entitySprites.forEach((sprite, eid) => {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
    });
  }

  private getTexture(textureId: number): Texture {
    // In a real implementation, this would return actual loaded textures
    // For now, return a colored square texture based on team
    return Texture.WHITE;
  }

  public cleanup(): void {
    // Release all pooled objects
    this.entitySprites.forEach(sprite => {
      pools.sprites.release(sprite);
    });
    this.entitySprites.clear();

    this.healthBars.forEach(bar => {
      pools.graphics.release(bar);
    });
    this.healthBars.clear();

    this.selectionCircles.forEach(circle => {
      pools.graphics.release(circle);
    });
    this.selectionCircles.clear();

    // Clear batches
    this.spriteBatches.clear();

    // Clear layers
    this.groundLayer.removeChildren();
    this.unitLayer.removeChildren();
    this.effectLayer.removeChildren();
    this.uiLayer.removeChildren();
  }

  public getStats() {
    return this.stats;
  }

  // Update entity position in spatial hash (call after movement)
  public updateEntityPosition(eid: number): void {
    spatialHash.update(eid, Position.x[eid], Position.y[eid]);
  }

  // Remove entity from rendering
  public removeEntity(eid: number): void {
    // Remove from spatial hash
    spatialHash.remove(eid);

    // Release sprite
    const sprite = this.entitySprites.get(eid);
    if (sprite) {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
      pools.sprites.release(sprite);
      this.entitySprites.delete(eid);
    }

    // Release health bar
    const healthBar = this.healthBars.get(eid);
    if (healthBar) {
      if (healthBar.parent) {
        healthBar.parent.removeChild(healthBar);
      }
      pools.graphics.release(healthBar);
      this.healthBars.delete(eid);
    }

    // Release selection circle
    const circle = this.selectionCircles.get(eid);
    if (circle) {
      if (circle.parent) {
        circle.parent.removeChild(circle);
      }
      pools.graphics.release(circle);
      this.selectionCircles.delete(eid);
    }
  }

  // Batch update positions (more efficient than individual updates)
  public batchUpdatePositions(entities: number[]): void {
    entities.forEach(eid => {
      spatialHash.update(eid, Position.x[eid], Position.y[eid]);
    });
  }
}