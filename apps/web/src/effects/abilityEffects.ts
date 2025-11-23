import { Graphics, Container } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Position, Dash, Shield, RangedAttack } from '@rts-arena/core';

const dashQuery = defineQuery([Position, Dash]);
const shieldQuery = defineQuery([Position, Shield]);
const rangedQuery = defineQuery([Position, RangedAttack]);

export class AbilityEffectsRenderer {
  private container: Container;
  private dashEffects: Map<number, Graphics[]> = new Map();
  private shieldEffects: Map<number, Graphics> = new Map();
  private projectiles: Map<number, Graphics> = new Map();
  private world: any | null = null;

  constructor() {
    this.container = new Container();
    this.container.label = 'AbilityEffects';
  }

  getContainer(): Container {
    return this.container;
  }

  setWorld(world: any) {
    this.world = world;
  }

  update(world?: any) {
    const w = world || this.world;
    if (!w) {
      console.warn('AbilityEffectsRenderer: No world set');
      return;
    }

    this.updateDashEffects(w);
    this.updateShieldEffects(w);
    this.updateProjectiles(w);
  }

  private updateDashEffects(world: any) {
    const entities = dashQuery(world);
    const processedEntities = new Set<number>();

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      processedEntities.add(eid);

      if (Dash.active[eid] > 0) {
        // Create speed lines effect
        if (!this.dashEffects.has(eid)) {
          const lines: Graphics[] = [];
          for (let j = 0; j < 5; j++) {
            const line = new Graphics();
            line.label = `DashLine_${eid}_${j}`;
            this.container.addChild(line);
            lines.push(line);
          }
          this.dashEffects.set(eid, lines);
        }

        const lines = this.dashEffects.get(eid)!;
        const alpha = Dash.active[eid] / 0.5; // Fade out as dash ends

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          line.clear();

          // Create speed lines behind the unit
          const offsetX = Position.x[eid] - j * 15;
          const offsetY = Position.y[eid] + (Math.random() - 0.5) * 10;

          line.moveTo(offsetX, offsetY);
          line.lineTo(offsetX - 30, offsetY);
          line.stroke({
            width: 3 - j * 0.5,
            color: 0xffff00,
            alpha: alpha * (0.8 - j * 0.15),
          });

          // Add glow effect
          line.moveTo(offsetX, offsetY);
          line.lineTo(offsetX - 30, offsetY);
          line.stroke({
            width: 6 - j,
            color: 0xffffaa,
            alpha: alpha * (0.3 - j * 0.05),
          });
        }
      } else {
        // Remove dash effects when not active
        this.removeDashEffect(eid);
      }
    }

    // Clean up effects for entities that no longer have Dash component
    this.dashEffects.forEach((_, eid) => {
      if (!processedEntities.has(eid)) {
        this.removeDashEffect(eid);
      }
    });
  }

  private removeDashEffect(eid: number) {
    if (this.dashEffects.has(eid)) {
      const lines = this.dashEffects.get(eid)!;
      lines.forEach(line => {
        this.container.removeChild(line);
        line.destroy();
      });
      this.dashEffects.delete(eid);
    }
  }

  private updateShieldEffects(world: any) {
    const entities = shieldQuery(world);
    const processedEntities = new Set<number>();

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      processedEntities.add(eid);

      if (Shield.active[eid] > 0) {
        if (!this.shieldEffects.has(eid)) {
          const shield = new Graphics();
          shield.label = `Shield_${eid}`;
          this.container.addChild(shield);
          this.shieldEffects.set(eid, shield);
        }

        const shield = this.shieldEffects.get(eid)!;
        shield.clear();

        // Pulsing effect based on remaining duration
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
        const alpha = Math.min(1, Shield.active[eid]); // Fade out near end

        // Outer ring
        shield.circle(Position.x[eid], Position.y[eid], 25 * pulse);
        shield.stroke({
          width: 3,
          color: 0x4488ff,
          alpha: alpha * 0.8,
        });

        // Inner filled circle
        shield.circle(Position.x[eid], Position.y[eid], 23 * pulse);
        shield.fill({
          color: 0x4488ff,
          alpha: alpha * 0.15,
        });

        // Energy particles
        const particleCount = 6;
        for (let j = 0; j < particleCount; j++) {
          const angle = (j / particleCount) * Math.PI * 2 + Date.now() * 0.002;
          const radius = 20 + Math.sin(Date.now() * 0.003 + j) * 5;
          const px = Position.x[eid] + Math.cos(angle) * radius;
          const py = Position.y[eid] + Math.sin(angle) * radius;

          shield.circle(px, py, 2);
          shield.fill({
            color: 0x88aaff,
            alpha: alpha * 0.6,
          });
        }
      } else {
        // Remove shield effect when not active
        this.removeShieldEffect(eid);
      }
    }

    // Clean up effects for entities that no longer have Shield component
    this.shieldEffects.forEach((_, eid) => {
      if (!processedEntities.has(eid)) {
        this.removeShieldEffect(eid);
      }
    });
  }

  private removeShieldEffect(eid: number) {
    if (this.shieldEffects.has(eid)) {
      const shield = this.shieldEffects.get(eid)!;
      this.container.removeChild(shield);
      shield.destroy();
      this.shieldEffects.delete(eid);
    }
  }

  private updateProjectiles(world: any) {
    const entities = rangedQuery(world);
    const processedEntities = new Set<number>();

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      processedEntities.add(eid);

      if (RangedAttack.active[eid] > 0) {
        if (!this.projectiles.has(eid)) {
          const projectile = new Graphics();
          projectile.label = `Projectile_${eid}`;
          this.container.addChild(projectile);
          this.projectiles.set(eid, projectile);
        }

        const projectile = this.projectiles.get(eid)!;
        projectile.clear();

        const x = RangedAttack.projectileX[eid];
        const y = RangedAttack.projectileY[eid];
        const vx = RangedAttack.projectileVX[eid];
        const vy = RangedAttack.projectileVY[eid];

        // Main projectile body
        projectile.circle(x, y, 5);
        projectile.fill({ color: 0xff6600 });

        // Glowing core
        projectile.circle(x, y, 3);
        projectile.fill({ color: 0xffaa00 });

        // Trail effect
        const trailLength = 5;
        for (let j = 1; j <= trailLength; j++) {
          const trailX = x - (vx * 0.002 * j);
          const trailY = y - (vy * 0.002 * j);
          const trailAlpha = 0.5 - (j * 0.08);
          const trailSize = 4 - (j * 0.5);

          projectile.circle(trailX, trailY, trailSize);
          projectile.fill({
            color: 0xff4400,
            alpha: trailAlpha,
          });
        }

        // Add energy sparks
        const sparkCount = 3;
        for (let j = 0; j < sparkCount; j++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkDist = Math.random() * 8 + 2;
          const sparkX = x + Math.cos(sparkAngle) * sparkDist;
          const sparkY = y + Math.sin(sparkAngle) * sparkDist;

          projectile.circle(sparkX, sparkY, 1);
          projectile.fill({
            color: 0xffff00,
            alpha: 0.8,
          });
        }
      } else {
        // Remove projectile when not active
        this.removeProjectile(eid);
      }
    }

    // Clean up projectiles for entities that no longer have active projectiles
    this.projectiles.forEach((_, eid) => {
      if (!processedEntities.has(eid)) {
        this.removeProjectile(eid);
      }
    });
  }

  private removeProjectile(eid: number) {
    if (this.projectiles.has(eid)) {
      const projectile = this.projectiles.get(eid)!;
      this.container.removeChild(projectile);
      projectile.destroy();
      this.projectiles.delete(eid);
    }
  }

  destroy() {
    // Cleanup all effects
    this.dashEffects.forEach((lines, eid) => {
      lines.forEach(line => line.destroy());
    });
    this.dashEffects.clear();

    this.shieldEffects.forEach((shield, eid) => {
      shield.destroy();
    });
    this.shieldEffects.clear();

    this.projectiles.forEach((proj, eid) => {
      proj.destroy();
    });
    this.projectiles.clear();

    this.container.destroy({ children: true });
  }
}