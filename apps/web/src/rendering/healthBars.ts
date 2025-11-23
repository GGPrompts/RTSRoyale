import { Graphics, Container } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Position, Health } from '@rts-arena/core';

const healthQuery = defineQuery([Position, Health]);

export class HealthBarRenderer {
  private container: Container;
  private bars: Map<number, Graphics>;

  constructor() {
    this.container = new Container();
    this.bars = new Map();
  }

  getContainer() {
    return this.container;
  }

  update(world: any) {
    const entities = healthQuery(world);

    // Track which entities we've seen
    const activeEntities = new Set<number>();

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      activeEntities.add(eid);

      let bar = this.bars.get(eid);
      if (!bar) {
        bar = new Graphics();
        this.bars.set(eid, bar);
        this.container.addChild(bar);
      }

      // Calculate health percentage
      const healthPct = Health.current[eid] / Health.max[eid];

      // Position above unit
      const x = Position.x[eid];
      const y = Position.y[eid] - 25; // 25 pixels above unit

      // Draw health bar
      bar.clear();

      // Background (dark red)
      bar.rect(x - 20, y, 40, 5);
      bar.fill({ color: 0x330000 });

      // Health bar with color gradient
      let color;
      if (healthPct > 0.5) {
        // Green to yellow (100% → 50%)
        const t = (healthPct - 0.5) * 2;
        color = interpolateColor(0xffff00, 0x00ff00, t);
      } else {
        // Yellow to red (50% → 0%)
        const t = healthPct * 2;
        color = interpolateColor(0xff0000, 0xffff00, t);
      }

      const width = 40 * healthPct;
      bar.rect(x - 20, y, width, 5);
      bar.fill({ color });
    }

    // Remove bars for dead entities
    for (const [eid, bar] of this.bars) {
      if (!activeEntities.has(eid)) {
        this.container.removeChild(bar);
        bar.destroy();
        this.bars.delete(eid);
      }
    }
  }

  destroy() {
    for (const bar of this.bars.values()) {
      bar.destroy();
    }
    this.bars.clear();
    this.container.destroy();
  }
}

function interpolateColor(c1: number, c2: number, t: number): number {
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return (r << 16) | (g << 8) | b;
}
