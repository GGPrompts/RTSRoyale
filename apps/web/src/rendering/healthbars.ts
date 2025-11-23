// Health Bar Rendering System
import { Graphics, Container, Application } from 'pixi.js';
import { defineQuery, hasComponent } from 'bitecs';
import { Position, Health, Dead } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';

// Query for entities with health and position
const healthQuery = defineQuery([Position, Health]);

// Map to store health bar graphics for each entity
const healthBars = new Map<number, Graphics>();

// Container to hold all health bars
let healthBarContainer: Container;

export function initHealthBars(app: Application) {
  healthBarContainer = new Container();
  healthBarContainer.zIndex = 10; // Render above units
  app.stage.addChild(healthBarContainer);
}

export function updateHealthBars(world: GameWorld) {
  const entities = healthQuery(world);

  // Update health bars for living entities
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Skip dead entities
    if (hasComponent(world, eid, Dead)) continue;

    const x = Position.x[eid];
    const y = Position.y[eid];
    const currentHealth = Health.current[eid];
    const maxHealth = Health.max[eid];

    // Get or create health bar for this entity
    let healthBar = healthBars.get(eid);
    if (!healthBar) {
      healthBar = new Graphics();
      healthBarContainer.addChild(healthBar);
      healthBars.set(eid, healthBar);
    }

    // Clear previous graphics
    healthBar.clear();

    // Position health bar above unit
    healthBar.x = x - 25;
    healthBar.y = y - 35;

    // Calculate health percentage
    const healthPercent = currentHealth / maxHealth;

    // Skip rendering if full health (optional - for cleaner visuals)
    // if (healthPercent >= 1.0) continue;

    // Background (dark gray)
    healthBar.rect(0, 0, 50, 6);
    healthBar.fill({ color: 0x333333, alpha: 0.8 });

    // Health bar color based on percentage
    let barColor = 0x00ff00; // Green
    if (healthPercent <= 0.33) {
      barColor = 0xff0000; // Red
    } else if (healthPercent <= 0.66) {
      barColor = 0xffaa00; // Yellow/Orange
    }

    // Health bar fill
    if (healthPercent > 0) {
      healthBar.rect(1, 1, 48 * healthPercent, 4);
      healthBar.fill({ color: barColor, alpha: 0.9 });
    }

    // Border
    healthBar.rect(0, 0, 50, 6);
    healthBar.stroke({ color: 0x000000, width: 1, alpha: 0.5 });
  }

  // Clean up health bars for dead entities
  if (world.deadEntities) {
    for (const deadEid of world.deadEntities) {
      const healthBar = healthBars.get(deadEid);
      if (healthBar) {
        healthBarContainer.removeChild(healthBar);
        healthBar.destroy();
        healthBars.delete(deadEid);
      }
    }
  }
}

export function cleanupHealthBars() {
  healthBars.forEach(healthBar => {
    healthBar.destroy();
  });
  healthBars.clear();
  if (healthBarContainer) {
    healthBarContainer.destroy();
  }
}