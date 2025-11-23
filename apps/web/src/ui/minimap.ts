// Minimap UI Component
import { Container, Graphics, Text } from 'pixi.js';
import { Application } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { Position, Team, Health } from '@rts-arena/core';

export class Minimap {
  private container: Container;
  private background: Graphics;
  private unitDots: Graphics;
  private borderGraphics: Graphics;
  private viewportRect: Graphics;
  private titleText: Text;

  private mapWidth: number = 180;
  private mapHeight: number = 100;
  private worldWidth: number = 1920;
  private worldHeight: number = 1080;
  private scaleX: number;
  private scaleY: number;

  private onClickCallback?: (worldX: number, worldY: number) => void;

  constructor(app: Application) {
    this.container = new Container();

    // Position in bottom-right corner
    const x = app.screen.width - this.mapWidth - 20;
    const y = app.screen.height - this.mapHeight - 20;
    this.container.position.set(x, y);
    this.container.zIndex = 1000;

    // Calculate scale factors
    this.scaleX = this.mapWidth / this.worldWidth;
    this.scaleY = this.mapHeight / this.worldHeight;

    // Create background
    this.background = new Graphics();
    this.background.rect(0, 0, this.mapWidth, this.mapHeight);
    this.background.fill({ color: 0x000000, alpha: 0.8 });

    // Create border
    this.borderGraphics = new Graphics();
    this.borderGraphics.rect(0, 0, this.mapWidth, this.mapHeight);
    this.borderGraphics.stroke({ color: 0x444444, width: 2 });

    // Create viewport indicator
    this.viewportRect = new Graphics();
    this.viewportRect.rect(0, 0, this.mapWidth, this.mapHeight);
    this.viewportRect.stroke({ color: 0xffffff, width: 1, alpha: 0.5 });

    // Title text
    this.titleText = new Text({
      text: 'MINIMAP',
      style: {
        fontSize: 10,
        fill: 0x888888,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
      },
    });
    this.titleText.position.set(5, 2);

    // Unit dots layer
    this.unitDots = new Graphics();

    // Add all elements to container
    this.container.addChild(this.background);
    this.container.addChild(this.unitDots);
    this.container.addChild(this.viewportRect);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.titleText);

    // Make interactive for click-to-pan
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.container.on('pointerdown', (event) => {
      const localPos = event.data.getLocalPosition(this.container);
      const worldX = localPos.x / this.scaleX;
      const worldY = localPos.y / this.scaleY;

      if (this.onClickCallback) {
        this.onClickCallback(worldX, worldY);
      }
    });

    app.stage.addChild(this.container);
  }

  update(world: GameWorld, viewportX: number = 0, viewportY: number = 0, viewportWidth: number = 1920, viewportHeight: number = 1080) {
    // Clear previous dots
    this.unitDots.clear();

    // Draw units
    const entities = world.entities;
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Check if entity has Position, Team, and Health components
      if (Position.x[eid] !== undefined &&
          Team.id[eid] !== undefined &&
          Health.current[eid] !== undefined) {

        if (Health.current[eid] > 0) { // Only show alive units
          const x = Position.x[eid] * this.scaleX;
          const y = Position.y[eid] * this.scaleY;

          // Determine color based on team
          const color = Team.id[eid] === 0 ? 0x4488ff : 0xff4444;
          const size = 2;

          // Draw unit dot
          this.unitDots.circle(x, y, size);
          this.unitDots.fill({ color, alpha: 0.9 });
        }
      }
    }

    // Update viewport rectangle
    this.viewportRect.clear();
    const vpX = viewportX * this.scaleX;
    const vpY = viewportY * this.scaleY;
    const vpWidth = viewportWidth * this.scaleX;
    const vpHeight = viewportHeight * this.scaleY;

    this.viewportRect.rect(vpX, vpY, vpWidth, vpHeight);
    this.viewportRect.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
  }

  setOnClickCallback(callback: (worldX: number, worldY: number) => void) {
    this.onClickCallback = callback;
  }

  updatePosition(app: Application) {
    // Update position when screen resizes
    const x = app.screen.width - this.mapWidth - 20;
    const y = app.screen.height - this.mapHeight - 20;
    this.container.position.set(x, y);
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  destroy() {
    this.container.destroy({ children: true });
  }

  // Draw a ping/marker on the minimap
  ping(worldX: number, worldY: number, color: number = 0xffff00) {
    const x = worldX * this.scaleX;
    const y = worldY * this.scaleY;

    // Create ping effect
    const pingGraphics = new Graphics();
    pingGraphics.circle(x, y, 5);
    pingGraphics.stroke({ color, width: 2, alpha: 1 });
    this.container.addChild(pingGraphics);

    // Animate and remove
    let scale = 1;
    let alpha = 1;
    const ticker = setInterval(() => {
      scale += 0.1;
      alpha -= 0.05;

      if (alpha <= 0) {
        clearInterval(ticker);
        this.container.removeChild(pingGraphics);
        pingGraphics.destroy();
      } else {
        pingGraphics.scale.set(scale);
        pingGraphics.alpha = alpha;
      }
    }, 50);
  }
}