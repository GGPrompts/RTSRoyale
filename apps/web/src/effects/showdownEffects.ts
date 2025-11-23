import { Graphics, Container, Text, TextStyle } from 'pixi.js';
import { GamePhase, FinalShowdownWorld, getCurrentPhase, getVictor } from '@rts-arena/core';

export class ShowdownEffectsRenderer {
  private container: Container;
  private vignette: Graphics | null = null;
  private flashEffect: Graphics | null = null;
  private phaseText: Text | null = null;
  private pulseTimer: number = 0;
  private flashTimer: number = 0;

  constructor() {
    this.container = new Container();
    this.container.name = 'ShowdownEffects';
    // Set high z-index to render on top
    this.container.zIndex = 1000;
  }

  getContainer(): Container {
    return this.container;
  }

  update(world: FinalShowdownWorld, deltaTime: number) {
    const phase = getCurrentPhase(world);
    const elapsedTime = world.showdown?.elapsedTime || 0;

    // Update timers
    this.pulseTimer += deltaTime;
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
    }

    switch (phase) {
      case GamePhase.NORMAL:
        this.clearEffects();
        break;

      case GamePhase.WARNING:
        this.showWarningEffects();
        break;

      case GamePhase.COLLAPSE:
        this.showCollapseEffects(elapsedTime);
        break;

      case GamePhase.SHOWDOWN:
        // Show teleport flash only once
        if (!this.flashEffect && this.flashTimer <= 0) {
          this.showTeleportFlash();
          this.flashTimer = 1.0; // Prevent multiple flashes
        }
        this.showShowdownEffects();
        break;

      case GamePhase.VICTORY:
        this.showVictoryEffects(getVictor(world));
        break;
    }
  }

  private showWarningEffects() {
    // Create or update vignette with subtle yellow glow
    if (!this.vignette) {
      this.vignette = new Graphics();
      this.container.addChild(this.vignette);
    }

    this.vignette.clear();

    // Draw vignette effect (darker at edges)
    const gradient = this.vignette;

    // Draw outer glow
    gradient.rect(0, 0, 1920, 1080);
    gradient.fill({ color: 0x000000, alpha: 0.0 });

    // Top edge glow
    gradient.rect(0, 0, 1920, 100);
    gradient.fill({ color: 0xffff00, alpha: 0.08 });

    // Bottom edge glow
    gradient.rect(0, 980, 1920, 100);
    gradient.fill({ color: 0xffff00, alpha: 0.08 });

    // Left edge glow
    gradient.rect(0, 0, 100, 1080);
    gradient.fill({ color: 0xffff00, alpha: 0.08 });

    // Right edge glow
    gradient.rect(1820, 0, 100, 1080);
    gradient.fill({ color: 0xffff00, alpha: 0.08 });

    // Add warning text if not already present
    if (!this.phaseText) {
      const style = new TextStyle({
        fontSize: 48,
        fill: 0xffff00,
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          angle: Math.PI / 4,
          blur: 4,
          distance: 5,
          color: 0x000000,
          alpha: 0.8
        },
        fontWeight: 'bold',
        align: 'center'
      });

      this.phaseText = new Text({
        text: 'WARNING: ARENA COLLAPSE IMMINENT',
        style
      });
      this.phaseText.anchor.set(0.5, 0.5);
      this.phaseText.x = 960;
      this.phaseText.y = 150;
      this.container.addChild(this.phaseText);
    }
  }

  private showCollapseEffects(elapsedTime: number) {
    // Intense pulsing red vignette
    if (!this.vignette) {
      this.vignette = new Graphics();
      this.container.addChild(this.vignette);
    }

    // Faster pulse during collapse phase
    const pulse = Math.sin(this.pulseTimer * 8) * 0.5 + 0.5; // Rapid pulsing
    const alpha = 0.15 + pulse * 0.25; // 0.15 to 0.4 alpha

    this.vignette.clear();

    // Draw pulsing red edges
    const intensity = 150 + (pulse * 50); // Vary edge width

    // Top edge
    this.vignette.rect(0, 0, 1920, intensity);
    this.vignette.fill({ color: 0xff0000, alpha });

    // Bottom edge
    this.vignette.rect(0, 1080 - intensity, 1920, intensity);
    this.vignette.fill({ color: 0xff0000, alpha });

    // Left edge
    this.vignette.rect(0, 0, intensity, 1080);
    this.vignette.fill({ color: 0xff0000, alpha });

    // Right edge
    this.vignette.rect(1920 - intensity, 0, intensity, 1080);
    this.vignette.fill({ color: 0xff0000, alpha });

    // Update warning text
    if (this.phaseText) {
      this.phaseText.text = 'FINAL SHOWDOWN IMMINENT!';
      this.phaseText.style.fill = 0xff0000;
      // Make text pulse too
      this.phaseText.scale.set(1 + pulse * 0.1);
    }
  }

  private showTeleportFlash() {
    // Bright white flash effect for teleport
    this.flashEffect = new Graphics();
    this.flashEffect.rect(0, 0, 1920, 1080);
    this.flashEffect.fill({ color: 0xffffff, alpha: 0.9 });
    this.container.addChild(this.flashEffect);

    // Fade out the flash over 500ms
    const fadeInterval = setInterval(() => {
      if (this.flashEffect && this.flashEffect.alpha > 0) {
        this.flashEffect.alpha -= 0.05;
        if (this.flashEffect.alpha <= 0) {
          this.container.removeChild(this.flashEffect);
          this.flashEffect.destroy();
          this.flashEffect = null;
          clearInterval(fadeInterval);
        }
      } else {
        clearInterval(fadeInterval);
      }
    }, 25);
  }

  private showShowdownEffects() {
    // Intense red vignette during final showdown
    if (!this.vignette) {
      this.vignette = new Graphics();
      this.container.addChild(this.vignette);
    }

    // Create dramatic vignette effect
    this.vignette.clear();

    // Draw heavy red vignette
    const edgeSize = 200;

    // Top edge with gradient effect
    for (let i = 0; i < edgeSize; i += 10) {
      const alpha = (1 - i / edgeSize) * 0.3;
      this.vignette.rect(0, i, 1920, 10);
      this.vignette.fill({ color: 0xff0000, alpha });
    }

    // Bottom edge with gradient
    for (let i = 0; i < edgeSize; i += 10) {
      const alpha = (1 - i / edgeSize) * 0.3;
      this.vignette.rect(0, 1080 - i - 10, 1920, 10);
      this.vignette.fill({ color: 0xff0000, alpha });
    }

    // Left edge with gradient
    for (let i = 0; i < edgeSize; i += 10) {
      const alpha = (1 - i / edgeSize) * 0.3;
      this.vignette.rect(i, 0, 10, 1080);
      this.vignette.fill({ color: 0xff0000, alpha });
    }

    // Right edge with gradient
    for (let i = 0; i < edgeSize; i += 10) {
      const alpha = (1 - i / edgeSize) * 0.3;
      this.vignette.rect(1920 - i - 10, 0, 10, 1080);
      this.vignette.fill({ color: 0xff0000, alpha });
    }

    // Update text
    if (this.phaseText) {
      this.phaseText.text = 'FINAL SHOWDOWN!';
      this.phaseText.style.fill = 0xff0000;
      this.phaseText.style.fontSize = 64;
      // Subtle animation
      this.phaseText.rotation = Math.sin(this.pulseTimer * 2) * 0.02;
    }
  }

  private showVictoryEffects(victor: number | null) {
    // Clear previous effects
    this.clearVignetteOnly();

    // Create victory overlay
    if (!this.vignette) {
      this.vignette = new Graphics();
      this.container.addChild(this.vignette);
    }

    // Semi-transparent overlay
    this.vignette.clear();
    this.vignette.rect(0, 0, 1920, 1080);
    this.vignette.fill({ color: 0x000000, alpha: 0.5 });

    // Victory text
    if (!this.phaseText) {
      const style = new TextStyle({
        fontSize: 96,
        fill: 0xffd700, // Gold color
        stroke: { color: 0x000000, width: 6 },
        dropShadow: {
          angle: Math.PI / 4,
          blur: 8,
          distance: 10,
          color: 0x000000,
          alpha: 0.8
        },
        fontWeight: 'bold',
        align: 'center'
      });

      this.phaseText = new Text({ style });
      this.phaseText.anchor.set(0.5, 0.5);
      this.phaseText.x = 960;
      this.phaseText.y = 400;
      this.container.addChild(this.phaseText);
    }

    // Set victory text
    if (victor === -1) {
      this.phaseText.text = 'DRAW!';
      this.phaseText.style.fill = 0xc0c0c0; // Silver for draw
    } else if (victor !== null) {
      this.phaseText.text = `TEAM ${victor} WINS!`;
      this.phaseText.style.fill = victor === 0 ? 0x4169e1 : 0xdc143c; // Blue or Red
    }

    // Victory animation
    const scale = 1 + Math.sin(this.pulseTimer * 3) * 0.05;
    this.phaseText.scale.set(scale);
  }

  private clearVignetteOnly() {
    if (this.vignette) {
      this.container.removeChild(this.vignette);
      this.vignette.destroy();
      this.vignette = null;
    }
  }

  private clearEffects() {
    if (this.vignette) {
      this.container.removeChild(this.vignette);
      this.vignette.destroy();
      this.vignette = null;
    }
    if (this.flashEffect) {
      this.container.removeChild(this.flashEffect);
      this.flashEffect.destroy();
      this.flashEffect = null;
    }
    if (this.phaseText) {
      this.container.removeChild(this.phaseText);
      this.phaseText.destroy();
      this.phaseText = null;
    }
  }

  destroy() {
    this.clearEffects();
    this.container.destroy();
  }

  // Helper to check if effects should be active
  isActive(): boolean {
    const hasEffects = this.vignette !== null ||
                      this.flashEffect !== null ||
                      this.phaseText !== null;
    return hasEffects;
  }
}