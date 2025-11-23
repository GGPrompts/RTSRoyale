// Box Selection System
import { Graphics, Application } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { Position, Team } from '@rts-arena/core';
import { defineQuery, hasComponent } from 'bitecs';

export class BoxSelect {
  private app: Application;
  private boxGraphics: Graphics | null = null;
  private startX: number = 0;
  private startY: number = 0;
  private endX: number = 0;
  private endY: number = 0;
  private isSelecting: boolean = false;
  private unitQuery = defineQuery([Position, Team]);

  constructor(app: Application) {
    this.app = app;
  }

  public startSelection(x: number, y: number): void {
    this.startX = x;
    this.startY = y;
    this.endX = x;
    this.endY = y;
    this.isSelecting = true;

    // Create box graphics if it doesn't exist
    if (!this.boxGraphics) {
      this.boxGraphics = new Graphics();
      this.app.stage.addChild(this.boxGraphics);
    }

    this.drawBox();
  }

  public updateSelection(x: number, y: number): void {
    if (!this.isSelecting) return;

    this.endX = x;
    this.endY = y;
    this.drawBox();
  }

  public endSelection(world: GameWorld, playerTeamId: number): number[] {
    if (!this.isSelecting) return [];

    this.isSelecting = false;

    // Get box bounds
    const minX = Math.min(this.startX, this.endX);
    const maxX = Math.max(this.startX, this.endX);
    const minY = Math.min(this.startY, this.endY);
    const maxY = Math.max(this.startY, this.endY);

    // Find units in box
    const selectedUnits: number[] = [];
    const units = this.unitQuery(world);

    for (const eid of units) {
      // Only select units from player's team
      if (Team.id[eid] !== playerTeamId) continue;

      const unitX = Position.x[eid];
      const unitY = Position.y[eid];

      // Check if unit is within box bounds
      if (unitX >= minX && unitX <= maxX && unitY >= minY && unitY <= maxY) {
        selectedUnits.push(eid);
      }
    }

    // Clear box graphics
    this.clearBox();

    return selectedUnits;
  }

  public cancelSelection(): void {
    this.isSelecting = false;
    this.clearBox();
  }

  private drawBox(): void {
    if (!this.boxGraphics) return;

    this.boxGraphics.clear();

    const minX = Math.min(this.startX, this.endX);
    const maxX = Math.max(this.startX, this.endX);
    const minY = Math.min(this.startY, this.endY);
    const maxY = Math.max(this.startY, this.endY);

    const width = maxX - minX;
    const height = maxY - minY;

    // Draw dashed rectangle
    this.drawDashedRectangle(minX, minY, width, height);

    // Semi-transparent fill
    this.boxGraphics.rect(minX, minY, width, height);
    this.boxGraphics.fill({ color: 0x00ff00, alpha: 0.1 });
  }

  private drawDashedRectangle(x: number, y: number, width: number, height: number): void {
    if (!this.boxGraphics) return;

    const dashLength = 10;
    const gapLength = 5;
    const totalLength = dashLength + gapLength;
    const color = 0x00ff00;
    const lineWidth = 2;

    // Configure line style
    this.boxGraphics.stroke({ color, width: lineWidth, alpha: 0.8 });

    // Top edge
    let currentX = x;
    while (currentX < x + width) {
      const endX = Math.min(currentX + dashLength, x + width);
      this.boxGraphics.moveTo(currentX, y);
      this.boxGraphics.lineTo(endX, y);
      currentX += totalLength;
    }

    // Right edge
    let currentY = y;
    while (currentY < y + height) {
      const endY = Math.min(currentY + dashLength, y + height);
      this.boxGraphics.moveTo(x + width, currentY);
      this.boxGraphics.lineTo(x + width, endY);
      currentY += totalLength;
    }

    // Bottom edge
    currentX = x + width;
    while (currentX > x) {
      const endX = Math.max(currentX - dashLength, x);
      this.boxGraphics.moveTo(currentX, y + height);
      this.boxGraphics.lineTo(endX, y + height);
      currentX -= totalLength;
    }

    // Left edge
    currentY = y + height;
    while (currentY > y) {
      const endY = Math.max(currentY - dashLength, y);
      this.boxGraphics.moveTo(x, currentY);
      this.boxGraphics.lineTo(x, endY);
      currentY -= totalLength;
    }

    // Corner highlights
    const cornerSize = 5;
    this.boxGraphics.stroke({ color: 0xffffff, width: lineWidth + 1, alpha: 1 });

    // Top-left corner
    this.boxGraphics.moveTo(x, y);
    this.boxGraphics.lineTo(x + cornerSize, y);
    this.boxGraphics.moveTo(x, y);
    this.boxGraphics.lineTo(x, y + cornerSize);

    // Top-right corner
    this.boxGraphics.moveTo(x + width - cornerSize, y);
    this.boxGraphics.lineTo(x + width, y);
    this.boxGraphics.moveTo(x + width, y);
    this.boxGraphics.lineTo(x + width, y + cornerSize);

    // Bottom-left corner
    this.boxGraphics.moveTo(x, y + height - cornerSize);
    this.boxGraphics.lineTo(x, y + height);
    this.boxGraphics.moveTo(x, y + height);
    this.boxGraphics.lineTo(x + cornerSize, y + height);

    // Bottom-right corner
    this.boxGraphics.moveTo(x + width - cornerSize, y + height);
    this.boxGraphics.lineTo(x + width, y + height);
    this.boxGraphics.moveTo(x + width, y + height - cornerSize);
    this.boxGraphics.lineTo(x + width, y + height);
  }

  private clearBox(): void {
    if (this.boxGraphics) {
      this.boxGraphics.clear();
      this.app.stage.removeChild(this.boxGraphics);
      this.boxGraphics.destroy();
      this.boxGraphics = null;
    }
  }

  public isActive(): boolean {
    return this.isSelecting;
  }

  public dispose(): void {
    this.clearBox();
  }
}