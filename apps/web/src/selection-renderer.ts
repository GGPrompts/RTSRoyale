// Selection Renderer - Visual feedback for selected units
import { Application, Graphics, Container } from 'pixi.js';
import { defineQuery, hasComponent } from 'bitecs';
import { GameWorld } from '@rts-arena/core';
import { Position, Selected, ControlGroup } from '@rts-arena/core';

const selectedQuery = defineQuery([Position, Selected]);
const controlGroupQuery = defineQuery([Position, ControlGroup]);

export class SelectionRenderer {
  private app: Application;
  private world: GameWorld;
  private container: Container;
  private selectionCircles: Map<number, Graphics>;

  constructor(app: Application, world: GameWorld) {
    this.app = app;
    this.world = world;
    this.container = new Container();
    this.selectionCircles = new Map();

    // Add container to stage (below units)
    app.stage.addChildAt(this.container, 0);
  }

  public update(): void {
    const selectedEntities = selectedQuery(this.world);

    // Clear old selection circles
    this.selectionCircles.forEach((circle, eid) => {
      if (!selectedEntities.includes(eid)) {
        this.container.removeChild(circle);
        this.selectionCircles.delete(eid);
      }
    });

    // Create/update selection circles for selected units
    for (let i = 0; i < selectedEntities.length; i++) {
      const eid = selectedEntities[i];

      if (!this.selectionCircles.has(eid)) {
        // Create new selection circle
        const circle = new Graphics();
        this.container.addChild(circle);
        this.selectionCircles.set(eid, circle);
      }

      const circle = this.selectionCircles.get(eid)!;
      const x = Position.x[eid];
      const y = Position.y[eid];

      // Draw selection circle
      circle.clear();
      circle.circle(0, 0, 25);
      circle.stroke({ color: 0x00ff00, width: 2, alpha: 0.8 });

      // Add inner glow effect
      circle.circle(0, 0, 22);
      circle.stroke({ color: 0x00ff00, width: 1, alpha: 0.4 });

      // Show control group number if assigned
      if (hasComponent(this.world, ControlGroup, eid)) {
        const groupId = ControlGroup.groupId[eid];
        if (groupId > 0) {
          // Draw group number indicator
          circle.circle(15, -15, 8);
          circle.fill({ color: 0x00ff00, alpha: 0.9 });

          // Add text (would need Text object in real implementation)
          // For now, just show a different colored indicator
          circle.circle(15, -15, 6);
          circle.fill({ color: 0x002200 });
        }
      }

      // Update position
      circle.position.set(x, y);

      // Animate selection circle (pulsing effect)
      const time = performance.now() / 1000;
      const pulse = 1 + Math.sin(time * 3) * 0.05;
      circle.scale.set(pulse);
    }
  }

  public destroy(): void {
    this.selectionCircles.forEach(circle => {
      this.container.removeChild(circle);
    });
    this.selectionCircles.clear();
    this.app.stage.removeChild(this.container);
  }
}