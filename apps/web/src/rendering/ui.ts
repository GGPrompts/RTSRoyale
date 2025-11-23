// Enhanced UI rendering for RTS Arena
import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { Health, Shield, Dash, RangedAttack, Selected, Position } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';
import { defineQuery, hasComponent } from 'bitecs';
import { TextureAssets } from '../assets/textures';

interface UIElement {
  healthBar?: Graphics;
  healthBarBg?: Graphics;
  cooldownBar?: Graphics;
  damageText?: Text;
  entityId: number;
  lastHealth: number;
  damageTextTimer?: number;
}

export class UISystem {
  private container: Container;
  private textures: TextureAssets;
  private uiElements: Map<number, UIElement> = new Map();
  private minimap?: Minimap;
  private damageTextStyle: TextStyle;
  private abilityIcons: Container;

  constructor(parent: Container, textures: TextureAssets) {
    this.container = new Container();
    parent.addChild(this.container);
    this.textures = textures;

    // Create damage text style
    this.damageTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: ['#ffff00', '#ff8800'],
      stroke: '#000000',
      strokeThickness: 3,
      dropShadow: true,
      dropShadowDistance: 2,
      dropShadowAngle: Math.PI / 4,
      dropShadowBlur: 2,
    });

    // Create ability icon container
    this.abilityIcons = new Container();
    this.container.addChild(this.abilityIcons);

    // Initialize minimap
    this.initMinimap();
  }

  private initMinimap() {
    this.minimap = new Minimap(200, 150);
    this.minimap.graphics.x = 1720; // Top-right corner
    this.minimap.graphics.y = 10;
    this.container.addChild(this.minimap.graphics);
  }

  update(world: GameWorld, deltaTime: number) {
    // Query for all entities with health
    const healthQuery = defineQuery([Position, Health]);
    const entities = healthQuery(world);

    for (const eid of entities) {
      let element = this.uiElements.get(eid);

      if (!element) {
        element = this.createUIElement(eid);
        this.uiElements.set(eid, element);
      }

      // Update health bar
      this.updateHealthBar(world, eid, element);

      // Update cooldowns if entity has abilities
      this.updateCooldowns(world, eid, element);

      // Update damage text animation
      if (element.damageText && element.damageTextTimer !== undefined) {
        element.damageTextTimer -= deltaTime;

        if (element.damageTextTimer <= 0) {
          this.container.removeChild(element.damageText);
          element.damageText.destroy();
          element.damageText = undefined;
          element.damageTextTimer = undefined;
        } else {
          // Float up and fade
          element.damageText.y -= deltaTime * 50;
          element.damageText.alpha = element.damageTextTimer / 1.0;
        }
      }
    }

    // Update minimap
    if (this.minimap) {
      this.minimap.update(world, entities);
    }

    // Clean up UI elements for removed entities
    const entitiesToRemove: number[] = [];
    this.uiElements.forEach((element, eid) => {
      if (!entities.includes(eid)) {
        entitiesToRemove.push(eid);
      }
    });

    entitiesToRemove.forEach(eid => this.removeUIElement(eid));
  }

  private createUIElement(entityId: number): UIElement {
    const element: UIElement = {
      entityId,
      lastHealth: 100,
    };

    // Create health bar background
    element.healthBarBg = new Graphics();
    element.healthBarBg.roundRect(0, 0, 60, 8, 2);
    element.healthBarBg.fill({ color: 0x333333, alpha: 0.7 });
    this.container.addChild(element.healthBarBg);

    // Create health bar
    element.healthBar = new Graphics();
    this.container.addChild(element.healthBar);

    return element;
  }

  private updateHealthBar(world: GameWorld, eid: number, element: UIElement) {
    const x = Position.x[eid];
    const y = Position.y[eid];
    const currentHealth = Health.current[eid];
    const maxHealth = Health.max[eid];
    const healthPercent = currentHealth / maxHealth;

    // Position health bar above unit
    if (element.healthBarBg) {
      element.healthBarBg.x = x - 30;
      element.healthBarBg.y = y - 40;
    }

    if (element.healthBar) {
      element.healthBar.clear();

      // Smooth health transition
      const targetHealth = healthPercent;
      const currentBar = element.lastHealth / maxHealth;
      const smoothHealth = currentBar + (targetHealth - currentBar) * 0.2;

      // Color based on health
      let color = 0x44ff44;
      if (smoothHealth < 0.3) color = 0xff4444;
      else if (smoothHealth < 0.6) color = 0xffaa00;

      // Draw health bar with gradient
      const barWidth = 60 * smoothHealth;
      element.healthBar.roundRect(x - 30, y - 40, barWidth, 8, 2);
      element.healthBar.fill({ color, alpha: 0.9 });

      // Add shine effect
      element.healthBar.roundRect(x - 30, y - 40, barWidth, 3, 1);
      element.healthBar.fill({ color: 0xffffff, alpha: 0.3 });

      element.lastHealth = currentHealth;

      // Show damage numbers if health decreased
      if (currentHealth < element.lastHealth - 1) {
        this.showDamageNumber(x, y, Math.floor(element.lastHealth - currentHealth));
      }
    }
  }

  private updateCooldowns(world: GameWorld, eid: number, element: UIElement) {
    let yOffset = 0;

    // Check each ability and draw cooldown indicators
    if (hasComponent(world, eid, Dash)) {
      const cooldown = Dash.cooldown[eid];
      const maxCooldown = Dash.maxCooldown[eid];
      if (cooldown > 0) {
        this.drawCooldownIndicator(
          Position.x[eid] - 35,
          Position.y[eid] + 30 + yOffset,
          cooldown / maxCooldown,
          'D'
        );
        yOffset += 20;
      }
    }

    if (hasComponent(world, eid, Shield)) {
      const cooldown = Shield.cooldown[eid];
      const maxCooldown = Shield.maxCooldown[eid];
      if (cooldown > 0) {
        this.drawCooldownIndicator(
          Position.x[eid] - 35,
          Position.y[eid] + 30 + yOffset,
          cooldown / maxCooldown,
          'S'
        );
        yOffset += 20;
      }
    }

    if (hasComponent(world, eid, RangedAttack)) {
      const cooldown = RangedAttack.cooldown[eid];
      const maxCooldown = RangedAttack.maxCooldown[eid];
      if (cooldown > 0) {
        this.drawCooldownIndicator(
          Position.x[eid] - 35,
          Position.y[eid] + 30 + yOffset,
          cooldown / maxCooldown,
          'R'
        );
        yOffset += 20;
      }
    }
  }

  private drawCooldownIndicator(x: number, y: number, progress: number, label: string) {
    const graphics = new Graphics();

    // Background circle
    graphics.circle(x, y, 8);
    graphics.fill({ color: 0x222222, alpha: 0.7 });

    // Draw pie chart style cooldown
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (1 - progress) * Math.PI * 2;

    graphics.moveTo(x, y);
    graphics.arc(x, y, 8, startAngle, endAngle);
    graphics.lineTo(x, y);
    graphics.fill({ color: 0x00ff00, alpha: 0.8 });

    // Border
    graphics.circle(x, y, 8);
    graphics.stroke({ color: 0xffffff, width: 1, alpha: 0.5 });

    this.container.addChild(graphics);

    // Add ability label
    const text = new Text(label, {
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    this.container.addChild(text);

    // Schedule removal
    setTimeout(() => {
      this.container.removeChild(graphics);
      this.container.removeChild(text);
      graphics.destroy();
      text.destroy();
    }, 16); // Remove next frame
  }

  showDamageNumber(x: number, y: number, damage: number) {
    const text = new Text(`-${damage}`, this.damageTextStyle);
    text.anchor.set(0.5);
    text.x = x + (Math.random() - 0.5) * 20;
    text.y = y - 20;

    this.container.addChild(text);

    // Find or create UI element for damage text
    let element = this.uiElements.get(-1); // Use -1 as a special ID for floating texts
    if (!element) {
      element = { entityId: -1, lastHealth: 0 };
      this.uiElements.set(-1, element);
    }

    element.damageText = text;
    element.damageTextTimer = 1.0;
  }

  private removeUIElement(eid: number) {
    const element = this.uiElements.get(eid);
    if (element) {
      if (element.healthBar) {
        this.container.removeChild(element.healthBar);
        element.healthBar.destroy();
      }
      if (element.healthBarBg) {
        this.container.removeChild(element.healthBarBg);
        element.healthBarBg.destroy();
      }
      if (element.damageText) {
        this.container.removeChild(element.damageText);
        element.damageText.destroy();
      }
      this.uiElements.delete(eid);
    }
  }

  destroy() {
    this.uiElements.forEach(element => {
      if (element.healthBar) element.healthBar.destroy();
      if (element.healthBarBg) element.healthBarBg.destroy();
      if (element.damageText) element.damageText.destroy();
    });
    this.uiElements.clear();
    this.container.destroy();
  }
}

// Minimap implementation
class Minimap {
  graphics: Graphics;
  width: number;
  height: number;
  scale: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.scale = 0.1; // Scale from world to minimap
    this.graphics = new Graphics();

    // Draw minimap background
    this.graphics.roundRect(0, 0, width, height, 5);
    this.graphics.fill({ color: 0x111111, alpha: 0.8 });
    this.graphics.stroke({ color: 0x444444, width: 2 });
  }

  update(world: GameWorld, entities: number[]) {
    // Clear previous dots (keep background)
    this.graphics.removeChildren();

    // Redraw background
    const bg = new Graphics();
    bg.roundRect(0, 0, this.width, this.height, 5);
    bg.fill({ color: 0x111111, alpha: 0.8 });
    bg.stroke({ color: 0x444444, width: 2 });
    this.graphics.addChild(bg);

    // Draw units on minimap
    for (const eid of entities) {
      const x = Position.x[eid] * this.scale;
      const y = Position.y[eid] * this.scale;

      // Clamp to minimap bounds
      const dotX = Math.min(Math.max(x, 5), this.width - 5);
      const dotY = Math.min(Math.max(y, 5), this.height - 5);

      const dot = new Graphics();
      dot.circle(dotX, dotY, 2);

      // Color based on team or selection
      let color = 0xffffff;
      if (hasComponent(world, eid, Selected) && Selected.value[eid] > 0) {
        color = 0x00ff00;
      } else if (hasComponent(world, eid, Team)) {
        color = Team.id[eid] === 0 ? 0x4488ff : 0xff4444;
      }

      dot.fill({ color, alpha: 0.9 });
      this.graphics.addChild(dot);
    }
  }
}