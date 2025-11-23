// Selection Indicators Rendering
import { Graphics, Container, Application, Ticker } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { Position, Selected, Health, Team } from '@rts-arena/core';
import { defineQuery, hasComponent } from 'bitecs';

export class SelectionIndicators {
  private app: Application;
  private world: GameWorld;
  private container: Container;
  private indicators: Map<number, Graphics> = new Map();
  private healthBars: Map<number, Graphics> = new Map();
  private pulseTime: number = 0;
  private selectedQuery = defineQuery([Position, Selected]);
  private healthQuery = defineQuery([Position, Health, Team]);

  constructor(app: Application, world: GameWorld) {
    this.app = app;
    this.world = world;

    // Create a container for all selection indicators
    this.container = new Container();
    this.container.zIndex = -1; // Place behind units
    this.app.stage.addChild(this.container);

    // Start update ticker
    this.app.ticker.add(this.update, this);
  }

  private update = (ticker: Ticker): void => {
    this.pulseTime += ticker.deltaTime * 0.1;

    // Update selection indicators
    const selectedUnits = this.selectedQuery(this.world);
    const currentSelected = new Set(selectedUnits);

    // Remove indicators for deselected units
    for (const [eid, indicator] of this.indicators) {
      if (!currentSelected.has(eid)) {
        this.container.removeChild(indicator);
        indicator.destroy();
        this.indicators.delete(eid);
      }
    }

    // Add/update indicators for selected units
    for (const eid of selectedUnits) {
      if (!hasComponent(this.world, eid, Position)) continue;

      let indicator = this.indicators.get(eid);
      if (!indicator) {
        indicator = this.createSelectionIndicator(eid);
        this.indicators.set(eid, indicator);
        this.container.addChild(indicator);
      }

      // Update position
      indicator.x = Position.x[eid];
      indicator.y = Position.y[eid];

      // Pulse effect
      const pulseScale = 1 + Math.sin(this.pulseTime) * 0.05;
      indicator.scale.set(pulseScale);
    }

    // Update health bars for all units
    this.updateHealthBars();
  };

  private createSelectionIndicator(entityId: number): Graphics {
    const graphics = new Graphics();

    // Determine team color
    const teamId = hasComponent(this.world, entityId, Team) ? Team.id[entityId] : 0;
    const color = teamId === 0 ? 0x00ff00 : 0xffff00; // Green for team 0, yellow for team 1

    // Outer circle
    graphics.circle(0, 0, 28);
    graphics.stroke({ color, width: 3, alpha: 0.9 });

    // Inner circle (pulsing)
    graphics.circle(0, 0, 24);
    graphics.stroke({ color, width: 1, alpha: 0.5 });

    // Selection corners
    const cornerSize = 8;
    const cornerOffset = 20;

    // Top-left corner
    graphics.moveTo(-cornerOffset, -cornerOffset);
    graphics.lineTo(-cornerOffset + cornerSize, -cornerOffset);
    graphics.moveTo(-cornerOffset, -cornerOffset);
    graphics.lineTo(-cornerOffset, -cornerOffset + cornerSize);

    // Top-right corner
    graphics.moveTo(cornerOffset - cornerSize, -cornerOffset);
    graphics.lineTo(cornerOffset, -cornerOffset);
    graphics.moveTo(cornerOffset, -cornerOffset);
    graphics.lineTo(cornerOffset, -cornerOffset + cornerSize);

    // Bottom-left corner
    graphics.moveTo(-cornerOffset, cornerOffset - cornerSize);
    graphics.lineTo(-cornerOffset, cornerOffset);
    graphics.moveTo(-cornerOffset, cornerOffset);
    graphics.lineTo(-cornerOffset + cornerSize, cornerOffset);

    // Bottom-right corner
    graphics.moveTo(cornerOffset - cornerSize, cornerOffset);
    graphics.lineTo(cornerOffset, cornerOffset);
    graphics.moveTo(cornerOffset, cornerOffset - cornerSize);
    graphics.lineTo(cornerOffset, cornerOffset);

    graphics.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });

    return graphics;
  }

  private updateHealthBars(): void {
    const units = this.healthQuery(this.world);

    for (const eid of units) {
      const health = Health.current[eid] / Health.max[eid];

      // Only show health bar if unit is damaged or selected
      if (health >= 1 && !hasComponent(this.world, eid, Selected)) {
        // Remove health bar if it exists
        const healthBar = this.healthBars.get(eid);
        if (healthBar) {
          this.container.removeChild(healthBar);
          healthBar.destroy();
          this.healthBars.delete(eid);
        }
        continue;
      }

      let healthBar = this.healthBars.get(eid);
      if (!healthBar) {
        healthBar = new Graphics();
        this.healthBars.set(eid, healthBar);
        this.container.addChild(healthBar);
      }

      // Update health bar
      healthBar.clear();

      const barWidth = 40;
      const barHeight = 4;
      const x = Position.x[eid] - barWidth / 2;
      const y = Position.y[eid] - 35; // Above the unit

      // Background
      healthBar.rect(x, y, barWidth, barHeight);
      healthBar.fill({ color: 0x000000, alpha: 0.5 });

      // Health fill
      const healthColor = health > 0.5 ? 0x00ff00 : health > 0.25 ? 0xffff00 : 0xff0000;
      healthBar.rect(x, y, barWidth * health, barHeight);
      healthBar.fill({ color: healthColor, alpha: 0.9 });

      // Border
      healthBar.rect(x, y, barWidth, barHeight);
      healthBar.stroke({ color: 0xffffff, width: 1, alpha: 0.8 });

      healthBar.x = 0;
      healthBar.y = 0;
    }

    // Clean up health bars for removed entities
    for (const [eid, healthBar] of this.healthBars) {
      if (!hasComponent(this.world, eid, Health)) {
        this.container.removeChild(healthBar);
        healthBar.destroy();
        this.healthBars.delete(eid);
      }
    }
  }

  public showGroupAssignmentFeedback(groupNumber: number): void {
    // Create a temporary text display
    const feedbackGraphics = new Graphics();

    // Background
    feedbackGraphics.rect(this.app.screen.width / 2 - 100, 50, 200, 40);
    feedbackGraphics.fill({ color: 0x000000, alpha: 0.8 });

    // Border
    feedbackGraphics.rect(this.app.screen.width / 2 - 100, 50, 200, 40);
    feedbackGraphics.stroke({ color: 0x00ff00, width: 2 });

    this.app.stage.addChild(feedbackGraphics);

    // Fade out after 1 second
    let alpha = 1;
    const fadeInterval = setInterval(() => {
      alpha -= 0.05;
      feedbackGraphics.alpha = alpha;
      if (alpha <= 0) {
        clearInterval(fadeInterval);
        this.app.stage.removeChild(feedbackGraphics);
        feedbackGraphics.destroy();
      }
    }, 50);
  }

  public dispose(): void {
    this.app.ticker.remove(this.update, this);

    for (const indicator of this.indicators.values()) {
      indicator.destroy();
    }
    this.indicators.clear();

    for (const healthBar of this.healthBars.values()) {
      healthBar.destroy();
    }
    this.healthBars.clear();

    this.container.destroy();
  }
}