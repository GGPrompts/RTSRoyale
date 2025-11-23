import { Graphics, Container } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Position, Selected } from '@rts-arena/core';

const selectedQuery = defineQuery([Position, Selected]);

export class SelectionRenderer {
  private container: Container;
  private selectionBoxGraphic: Graphics;
  private highlights: Map<number, Graphics> = new Map();
  private moveTargetGraphic: Graphics;

  constructor() {
    this.container = new Container();

    // Drag selection box
    this.selectionBoxGraphic = new Graphics();
    this.container.addChild(this.selectionBoxGraphic);

    // Move target indicator
    this.moveTargetGraphic = new Graphics();
    this.container.addChild(this.moveTargetGraphic);
  }

  getContainer() {
    return this.container;
  }

  updateDragBox(dragBox: { minX: number; minY: number; maxX: number; maxY: number } | null) {
    this.selectionBoxGraphic.clear();

    if (dragBox) {
      const { minX, minY, maxX, maxY } = dragBox;

      // Draw dashed rectangle
      this.selectionBoxGraphic.rect(minX, minY, maxX - minX, maxY - minY);
      this.selectionBoxGraphic.stroke({
        width: 2,
        color: 0x00ff00,
        alpha: 0.8
      });
      this.selectionBoxGraphic.rect(minX, minY, maxX - minX, maxY - minY);
      this.selectionBoxGraphic.fill({
        color: 0x00ff00,
        alpha: 0.1
      });
    }
  }

  updateSelectionHighlights(world: any) {
    const entities = selectedQuery(world);
    const activeEntities = new Set<number>();

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      if (Selected.isSelected[eid] !== 1) continue;

      activeEntities.add(eid);

      let highlight = this.highlights.get(eid);
      if (!highlight) {
        highlight = new Graphics();
        this.highlights.set(eid, highlight);
        this.container.addChild(highlight);
      }

      // Draw circle highlight
      highlight.clear();
      highlight.circle(Position.x[eid], Position.y[eid], 12);
      highlight.stroke({ width: 2, color: 0x00ff00, alpha: 0.8 });
    }

    // Remove highlights for unselected entities
    for (const [eid, highlight] of this.highlights) {
      if (!activeEntities.has(eid)) {
        this.container.removeChild(highlight);
        highlight.destroy();
        this.highlights.delete(eid);
      }
    }
  }

  showMoveTarget(x: number, y: number, duration: number = 1.0) {
    this.moveTargetGraphic.clear();

    // Draw X marker
    const size = 10;
    this.moveTargetGraphic.moveTo(x - size, y - size);
    this.moveTargetGraphic.lineTo(x + size, y + size);
    this.moveTargetGraphic.moveTo(x + size, y - size);
    this.moveTargetGraphic.lineTo(x - size, y + size);
    this.moveTargetGraphic.stroke({ width: 2, color: 0x00ff00 });

    // Draw circle
    this.moveTargetGraphic.circle(x, y, 15);
    this.moveTargetGraphic.stroke({ width: 2, color: 0x00ff00 });

    // Fade out after duration
    setTimeout(() => {
      this.moveTargetGraphic.clear();
    }, duration * 1000);
  }

  destroy() {
    for (const highlight of this.highlights.values()) {
      highlight.destroy();
    }
    this.highlights.clear();
    this.selectionBoxGraphic.destroy();
    this.moveTargetGraphic.destroy();
    this.container.destroy();
  }
}
