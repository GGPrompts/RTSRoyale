// Ability Bar UI Component
import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js';
import { Application } from 'pixi.js';

interface AbilitySlot {
  container: Container;
  background: Graphics;
  icon: Graphics;
  cooldownOverlay: Graphics;
  keyHint: Text;
  cooldownText: Text;
  key: string;
  name: string;
  cooldown: number;
  currentCooldown: number;
  color: number;
  iconType: 'dash' | 'shield' | 'attack';
}

export class AbilityBar {
  private container: Container;
  private background: Graphics;
  private abilities: AbilitySlot[] = [];
  private slotSize: number = 60;
  private slotSpacing: number = 10;

  constructor(app: Application) {
    this.container = new Container();
    this.container.zIndex = 1000;

    // Create background bar
    const barWidth = (this.slotSize + this.slotSpacing) * 3 + this.slotSpacing;
    const barHeight = this.slotSize + 20;

    this.background = new Graphics();
    this.background.roundRect(0, 0, barWidth, barHeight, 10);
    this.background.fill({ color: 0x000000, alpha: 0.7 });
    this.background.stroke({ color: 0x444444, width: 2 });

    // Position at bottom center
    const x = (app.screen.width - barWidth) / 2;
    const y = app.screen.height - barHeight - 20;
    this.container.position.set(x, y);

    this.container.addChild(this.background);

    // Create ability slots
    this.createAbilitySlot(0, 'Q', 'Dash', 3, 0x00aaff, 'dash');
    this.createAbilitySlot(1, 'W', 'Shield', 5, 0x00ff00, 'shield');
    this.createAbilitySlot(2, 'E', 'Power', 8, 0xff8800, 'attack');

    app.stage.addChild(this.container);
  }

  private createAbilitySlot(
    index: number,
    key: string,
    name: string,
    cooldown: number,
    color: number,
    iconType: 'dash' | 'shield' | 'attack'
  ) {
    const slotContainer = new Container();
    const x = this.slotSpacing + index * (this.slotSize + this.slotSpacing);
    const y = 10;
    slotContainer.position.set(x, y);

    // Slot background
    const background = new Graphics();
    background.roundRect(0, 0, this.slotSize, this.slotSize, 5);
    background.fill({ color: 0x222222 });
    background.stroke({ color: color, width: 2, alpha: 0.5 });

    // Create icon based on type
    const icon = new Graphics();
    this.drawAbilityIcon(icon, iconType, color);
    icon.position.set(this.slotSize / 2, this.slotSize / 2);

    // Cooldown overlay (initially hidden)
    const cooldownOverlay = new Graphics();
    cooldownOverlay.roundRect(0, 0, this.slotSize, this.slotSize, 5);
    cooldownOverlay.fill({ color: 0x000000, alpha: 0.7 });
    cooldownOverlay.visible = false;

    // Key hint (top-left)
    const keyHint = new Text({
      text: key,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
      },
    });
    keyHint.position.set(3, 2);

    // Cooldown text (center, initially hidden)
    const cooldownText = new Text({
      text: '0',
      style: {
        fontSize: 20,
        fill: 0xffffff,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
      },
    });
    cooldownText.anchor.set(0.5);
    cooldownText.position.set(this.slotSize / 2, this.slotSize / 2);
    cooldownText.visible = false;

    // Add all elements to slot container
    slotContainer.addChild(background);
    slotContainer.addChild(icon);
    slotContainer.addChild(cooldownOverlay);
    slotContainer.addChild(keyHint);
    slotContainer.addChild(cooldownText);

    // Add to main container
    this.container.addChild(slotContainer);

    // Store ability data
    const ability: AbilitySlot = {
      container: slotContainer,
      background,
      icon,
      cooldownOverlay,
      keyHint,
      cooldownText,
      key,
      name,
      cooldown,
      currentCooldown: 0,
      color,
      iconType,
    };

    this.abilities.push(ability);
  }

  private drawAbilityIcon(graphics: Graphics, type: 'dash' | 'shield' | 'attack', color: number) {
    graphics.clear();

    switch (type) {
      case 'dash':
        // Draw arrow icon for dash
        graphics.moveTo(-10, 0);
        graphics.lineTo(5, 0);
        graphics.lineTo(0, -5);
        graphics.moveTo(5, 0);
        graphics.lineTo(0, 5);
        graphics.stroke({ color, width: 3 });

        // Add motion lines
        graphics.moveTo(-15, -3);
        graphics.lineTo(-10, -3);
        graphics.moveTo(-15, 0);
        graphics.lineTo(-10, 0);
        graphics.moveTo(-15, 3);
        graphics.lineTo(-10, 3);
        graphics.stroke({ color, width: 2, alpha: 0.5 });
        break;

      case 'shield':
        // Draw shield icon
        graphics.moveTo(0, -12);
        graphics.lineTo(-8, -5);
        graphics.lineTo(-8, 5);
        graphics.lineTo(0, 12);
        graphics.lineTo(8, 5);
        graphics.lineTo(8, -5);
        graphics.closePath();
        graphics.fill({ color, alpha: 0.3 });
        graphics.stroke({ color, width: 2 });
        break;

      case 'attack':
        // Draw explosion/burst icon
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const innerRadius = 5;
          const outerRadius = 12;

          graphics.moveTo(
            Math.cos(angle) * innerRadius,
            Math.sin(angle) * innerRadius
          );
          graphics.lineTo(
            Math.cos(angle) * outerRadius,
            Math.sin(angle) * outerRadius
          );
        }
        graphics.stroke({ color, width: 2 });

        // Center dot
        graphics.circle(0, 0, 3);
        graphics.fill({ color });
        break;
    }
  }

  // Trigger ability cooldown
  useAbility(index: number) {
    if (index < 0 || index >= this.abilities.length) return;

    const ability = this.abilities[index];
    if (ability.currentCooldown > 0) return; // Still on cooldown

    // Start cooldown
    ability.currentCooldown = ability.cooldown;
    this.updateAbilityDisplay(ability);

    // Flash effect
    this.flashAbility(ability);
  }

  private flashAbility(ability: AbilitySlot) {
    const flash = new Graphics();
    flash.roundRect(0, 0, this.slotSize, this.slotSize, 5);
    flash.fill({ color: ability.color, alpha: 0.5 });
    ability.container.addChild(flash);

    // Fade out
    let alpha = 0.5;
    const ticker = setInterval(() => {
      alpha -= 0.05;
      if (alpha <= 0) {
        clearInterval(ticker);
        ability.container.removeChild(flash);
        flash.destroy();
      } else {
        flash.alpha = alpha;
      }
    }, 30);
  }

  update(deltaTime: number) {
    for (const ability of this.abilities) {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown = Math.max(0, ability.currentCooldown - deltaTime);
        this.updateAbilityDisplay(ability);
      }
    }
  }

  private updateAbilityDisplay(ability: AbilitySlot) {
    const onCooldown = ability.currentCooldown > 0;

    // Show/hide cooldown overlay
    ability.cooldownOverlay.visible = onCooldown;
    ability.cooldownText.visible = onCooldown;

    if (onCooldown) {
      // Update cooldown text
      ability.cooldownText.text = Math.ceil(ability.currentCooldown).toString();

      // Update cooldown overlay height (sweep effect)
      const progress = ability.currentCooldown / ability.cooldown;
      ability.cooldownOverlay.clear();
      ability.cooldownOverlay.roundRect(
        0,
        this.slotSize * (1 - progress),
        this.slotSize,
        this.slotSize * progress,
        5
      );
      ability.cooldownOverlay.fill({ color: 0x000000, alpha: 0.7 });
    }

    // Dim icon when on cooldown
    ability.icon.alpha = onCooldown ? 0.3 : 1;
  }

  // Handle keyboard input
  handleKeyPress(key: string) {
    const keyMap: { [key: string]: number } = {
      'q': 0,
      'Q': 0,
      'w': 1,
      'W': 1,
      'e': 2,
      'E': 2,
    };

    const index = keyMap[key];
    if (index !== undefined) {
      this.useAbility(index);
      return true;
    }
    return false;
  }

  updatePosition(app: Application) {
    // Update position when screen resizes
    const barWidth = (this.slotSize + this.slotSpacing) * 3 + this.slotSpacing;
    const barHeight = this.slotSize + 20;
    const x = (app.screen.width - barWidth) / 2;
    const y = app.screen.height - barHeight - 20;
    this.container.position.set(x, y);
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  destroy() {
    this.container.destroy({ children: true });
  }

  // Get ability cooldown info
  getAbilityCooldowns() {
    return this.abilities.map(a => ({
      key: a.key,
      name: a.name,
      cooldown: a.cooldown,
      currentCooldown: a.currentCooldown,
      ready: a.currentCooldown <= 0,
    }));
  }
}