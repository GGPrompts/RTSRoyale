import { Container, Graphics } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Position, Team, Velocity } from '@rts-arena/core';

const unitQuery = defineQuery([Position, Team]);

export class SpriteRenderer {
  private container: Container;
  private sprites: Map<number, Graphics> = new Map();

  constructor() {
    this.container = new Container();
  }

  getContainer() {
    return this.container;
  }

  update(world: any) {
    const entities = unitQuery(world);
    const activeEntities = new Set<number>();

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      activeEntities.add(eid);

      let sprite = this.sprites.get(eid);
      if (!sprite) {
        sprite = this.createUnitSprite(Team.id[eid]);
        this.sprites.set(eid, sprite);
        this.container.addChild(sprite);
      }

      // Update position
      sprite.x = Position.x[eid];
      sprite.y = Position.y[eid];

      // Rotate toward movement direction
      if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
        sprite.rotation = Math.atan2(Velocity.y[eid], Velocity.x[eid]);
      }
    }

    // Remove sprites for dead entities
    for (const [eid, sprite] of this.sprites) {
      if (!activeEntities.has(eid)) {
        this.container.removeChild(sprite);
        sprite.destroy();
        this.sprites.delete(eid);
      }
    }
  }

  private createUnitSprite(teamId: number): Graphics {
    const sprite = new Graphics();

    // Team colors
    const color = teamId === 0 ? 0x4444ff : 0xff4444;

    // Draw triangle pointing right (0 rotation)
    sprite.moveTo(10, 0);
    sprite.lineTo(-8, -6);
    sprite.lineTo(-8, 6);
    sprite.lineTo(10, 0);
    sprite.fill({ color });

    // Add outline
    sprite.moveTo(10, 0);
    sprite.lineTo(-8, -6);
    sprite.lineTo(-8, 6);
    sprite.lineTo(10, 0);
    sprite.stroke({ width: 1, color: 0xffffff, alpha: 0.5 });

    return sprite;
  }

  destroy() {
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }
    this.sprites.clear();
    this.container.destroy();
  }
}
