// Visual effects for Final Showdown
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { getShowdownPhase, getTimeUntilNextPhase } from '@rts-arena/core';

export class ShowdownEffects {
  private app: Application;
  private world: GameWorld;
  private container: Container;

  private edgeGlow: Graphics;
  private countdownText: Text;
  private warningText: Text;
  private flashOverlay: Graphics;

  private lastPhase: number = 0;
  private pulseTime: number = 0;

  constructor(app: Application, world: GameWorld) {
    this.app = app;
    this.world = world;
    this.container = new Container();
    this.app.stage.addChild(this.container);

    // Create edge glow effect
    this.edgeGlow = new Graphics();
    this.container.addChild(this.edgeGlow);

    // Create countdown text
    const countdownStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 120,
      fontWeight: 'bold',
      fill: '#ff4444',
      stroke: '#000000',
      strokeThickness: 6,
      dropShadow: true,
      dropShadowColor: '#ff0000',
      dropShadowBlur: 10,
      dropShadowDistance: 0,
    });
    this.countdownText = new Text('', countdownStyle);
    this.countdownText.anchor.set(0.5);
    this.countdownText.visible = false;
    this.container.addChild(this.countdownText);

    // Create warning text
    const warningStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 64,
      fontWeight: 'bold',
      fill: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#ff6600',
      dropShadowBlur: 8,
      dropShadowDistance: 0,
    });
    this.warningText = new Text('', warningStyle);
    this.warningText.anchor.set(0.5);
    this.warningText.visible = false;
    this.container.addChild(this.warningText);

    // Create flash overlay
    this.flashOverlay = new Graphics();
    this.flashOverlay.alpha = 0;
    this.container.addChild(this.flashOverlay);

    // Position elements
    this.updatePositions();
  }

  updatePositions(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Center countdown and warning texts
    this.countdownText.x = width / 2;
    this.countdownText.y = height / 2 - 100;

    this.warningText.x = width / 2;
    this.warningText.y = height / 2;
  }

  update(deltaTime: number): void {
    const currentPhase = getShowdownPhase(this.world);
    const timeUntilNext = getTimeUntilNextPhase(this.world);

    // Update positions on resize
    this.updatePositions();

    // Update pulse time for animations
    this.pulseTime += deltaTime;

    // Handle phase transitions
    if (currentPhase !== this.lastPhase) {
      this.onPhaseChange(this.lastPhase, currentPhase);
      this.lastPhase = currentPhase;
    }

    // Update effects based on current phase
    switch (currentPhase) {
      case 0: // NORMAL
        this.updateNormalPhase();
        break;
      case 1: // WARNING
        this.updateWarningPhase(timeUntilNext);
        break;
      case 2: // COLLAPSE
        this.updateCollapsePhase(timeUntilNext);
        break;
      case 3: // SHOWDOWN
        this.updateShowdownPhase();
        break;
      case 4: // ENDED
        this.updateEndedPhase();
        break;
    }

    // Update flash effect
    if (this.flashOverlay.alpha > 0) {
      this.flashOverlay.alpha -= deltaTime * 2; // Fade out over 0.5 seconds
    }
  }

  private onPhaseChange(oldPhase: number, newPhase: number): void {
    // Clear previous effects
    this.edgeGlow.clear();
    this.countdownText.visible = false;
    this.warningText.visible = false;

    // Handle specific transitions
    if (newPhase === 1) { // WARNING
      this.showWarning('ARENA COLLAPSE IN 30 SECONDS!');
    } else if (newPhase === 2) { // COLLAPSE
      this.showWarning('PREPARE FOR FINAL SHOWDOWN!');
      this.startEdgeGlow();
    } else if (newPhase === 3) { // SHOWDOWN
      this.triggerShowdownFlash();
      this.showWarning('FINAL SHOWDOWN!');
    } else if (newPhase === 4) { // ENDED
      this.showEndScreen();
    }
  }

  private updateNormalPhase(): void {
    // No special effects during normal phase
  }

  private updateWarningPhase(timeUntilNext: number): void {
    // Pulse warning text
    if (this.warningText.visible) {
      this.warningText.alpha = 0.7 + Math.sin(this.pulseTime * 4) * 0.3;
    }
  }

  private updateCollapsePhase(timeUntilNext: number): void {
    // Update edge glow
    this.updateEdgeGlow();

    // Show countdown for last 10 seconds
    if (timeUntilNext <= 10) {
      this.countdownText.visible = true;
      this.countdownText.text = Math.ceil(timeUntilNext).toString();
      this.countdownText.scale.set(1 + Math.sin(this.pulseTime * 10) * 0.1);
    }
  }

  private updateShowdownPhase(): void {
    // Keep edge glow active
    this.updateEdgeGlow();

    // Pulse effect during showdown
    if (this.edgeGlow.alpha > 0) {
      this.edgeGlow.alpha = 0.3 + Math.sin(this.pulseTime * 2) * 0.2;
    }
  }

  private updateEndedPhase(): void {
    // Fade out all effects
    if (this.edgeGlow.alpha > 0) {
      this.edgeGlow.alpha -= 0.01;
    }
  }

  private startEdgeGlow(): void {
    this.drawEdgeGlow();
  }

  private drawEdgeGlow(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const thickness = 50;

    this.edgeGlow.clear();

    // Create gradient effect (simplified)
    for (let i = 0; i < thickness; i++) {
      const alpha = (1 - i / thickness) * 0.5;
      const color = 0xff0000;

      this.edgeGlow.lineStyle(2, color, alpha);

      // Top edge
      this.edgeGlow.moveTo(0, i);
      this.edgeGlow.lineTo(width, i);

      // Bottom edge
      this.edgeGlow.moveTo(0, height - i);
      this.edgeGlow.lineTo(width, height - i);

      // Left edge
      this.edgeGlow.moveTo(i, 0);
      this.edgeGlow.lineTo(i, height);

      // Right edge
      this.edgeGlow.moveTo(width - i, 0);
      this.edgeGlow.lineTo(width - i, height);
    }
  }

  private updateEdgeGlow(): void {
    const pulseAlpha = 0.3 + Math.sin(this.pulseTime * 3) * 0.2;
    this.edgeGlow.alpha = pulseAlpha;
  }

  private showWarning(text: string): void {
    this.warningText.text = text;
    this.warningText.visible = true;
    this.warningText.alpha = 1;

    // Auto-hide after 3 seconds for warning phase
    if (text.includes('30 SECONDS')) {
      setTimeout(() => {
        this.warningText.visible = false;
      }, 3000);
    }
  }

  private triggerShowdownFlash(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Create white flash
    this.flashOverlay.clear();
    this.flashOverlay.beginFill(0xffffff);
    this.flashOverlay.drawRect(0, 0, width, height);
    this.flashOverlay.endFill();
    this.flashOverlay.alpha = 0.8;
  }

  private showEndScreen(): void {
    this.warningText.text = 'MATCH ENDED';
    this.warningText.visible = true;
    this.warningText.style.fill = '#00ff00';
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}