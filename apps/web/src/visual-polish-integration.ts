// Visual Polish Integration for existing RTS Arena
import { Application } from 'pixi.js';
import { ParticleEmitter, ParticleType } from './particles';
import { ScreenEffects } from './screen-effects';
import { StatsPanel } from './ui/stats-panel';
import { Minimap } from './ui/minimap';
import { AbilityBar } from './ui/ability-bar';
import { GameWorld } from '@rts-arena/core';
import { defineQuery } from 'bitecs';
import { Health, Position, Team, DashVelocity, ShieldActive, Projectile } from '@rts-arena/core';

export class VisualPolishIntegration {
  private particleEmitter: ParticleEmitter;
  private screenEffects: ScreenEffects;
  private statsPanel: StatsPanel;
  private minimap: Minimap;
  private abilityBar: AbilityBar;

  // Track states for effects
  private lastHealthValues: Map<number, number> = new Map();
  private dashingUnits: Set<number> = new Set();
  private shieldedUnits: Set<number> = new Set();

  // Queries for ECS entities
  private aliveUnitsQuery = defineQuery([Position, Health, Team]);
  private dashingQuery = defineQuery([Position, DashVelocity]);
  private shieldQuery = defineQuery([Position, ShieldActive]);
  private projectileQuery = defineQuery([Position, Projectile]);

  constructor(app: Application, world: GameWorld) {
    console.log('✨ Initializing Visual Polish Systems...');

    // Initialize all visual systems
    this.particleEmitter = new ParticleEmitter(app);
    this.screenEffects = new ScreenEffects(app);
    this.statsPanel = new StatsPanel(app);
    this.minimap = new Minimap(app);
    this.abilityBar = new AbilityBar(app);

    // Setup minimap camera pan (optional)
    this.minimap.setOnClickCallback((worldX, worldY) => {
      // Could integrate with camera system if available
      console.log(`Minimap clicked at world position: ${worldX}, ${worldY}`);
    });

    // Setup keyboard input for abilities
    this.setupKeyboardHandling();

    console.log('✅ Visual Polish Systems initialized');
  }

  private setupKeyboardHandling() {
    window.addEventListener('keydown', (event) => {
      // Let ability bar handle Q/W/E keys
      if (this.abilityBar.handleKeyPress(event.key)) {
        // Trigger visual effects based on ability use
        this.handleAbilityVisualEffects(event.key.toLowerCase());
      }
    });
  }

  private handleAbilityVisualEffects(key: string) {
    // Trigger visual feedback when abilities are used
    switch (key) {
      case 'q':
        // Dash effect handled in update when detecting dashing units
        this.screenEffects.abilityActivated('dash');
        break;
      case 'w':
        // Shield effect handled in update when detecting shielded units
        this.screenEffects.abilityActivated('shield');
        break;
      case 'e':
        // Ultimate/Power attack
        this.screenEffects.abilityActivated('ultimate');
        break;
    }
  }

  public update(world: GameWorld, deltaTime: number) {
    // Update UI components
    this.statsPanel.update(world);
    this.minimap.update(world);
    this.abilityBar.update(deltaTime);

    // Update particle system
    this.particleEmitter.update(deltaTime);

    // Update screen effects
    this.screenEffects.update(deltaTime);

    // Check for damage and death effects
    this.checkHealthChanges(world);

    // Check for ability effects
    this.checkAbilityEffects(world);

    // Check for projectile impacts
    this.checkProjectileEffects(world);

    // Check for Final Showdown trigger
    this.checkShowdownTrigger(world);
  }

  private checkHealthChanges(world: GameWorld) {
    const entities = this.aliveUnitsQuery(world);

    for (const eid of entities) {
      const currentHealth = Health.current[eid];
      const lastHealth = this.lastHealthValues.get(eid) || currentHealth;

      // Check for damage
      if (currentHealth < lastHealth && currentHealth > 0) {
        const x = Position.x[eid];
        const y = Position.y[eid];

        // Emit hit particles
        this.particleEmitter.emit(ParticleType.HIT, x, y);

        // Small screen shake for hits
        if (Math.random() > 0.8) {
          this.screenEffects.hitShake();
        }
      }

      // Check for death
      if (currentHealth <= 0 && lastHealth > 0) {
        const x = Position.x[eid];
        const y = Position.y[eid];

        // Death explosion
        this.particleEmitter.emit(ParticleType.DEATH, x, y);

        // Screen effects for death
        this.screenEffects.unitDeath();
      }

      this.lastHealthValues.set(eid, currentHealth);
    }
  }

  private checkAbilityEffects(world: GameWorld) {
    // Check for dashing units
    const dashingEntities = this.dashingQuery(world);
    for (const eid of dashingEntities) {
      if (DashVelocity.duration[eid] > 0) {
        if (!this.dashingUnits.has(eid)) {
          // Just started dashing
          this.dashingUnits.add(eid);
        }

        // Emit dash trail particles
        const x = Position.x[eid];
        const y = Position.y[eid];
        this.particleEmitter.emitContinuous(ParticleType.DASH, x, y, 0.016); // ~60fps
      } else if (this.dashingUnits.has(eid)) {
        // Dash ended
        this.dashingUnits.delete(eid);
      }
    }

    // Check for shielded units
    const shieldedEntities = this.shieldQuery(world);
    for (const eid of shieldedEntities) {
      if (ShieldActive.remainingDuration[eid] > 0) {
        if (!this.shieldedUnits.has(eid)) {
          // Just activated shield
          this.shieldedUnits.add(eid);
          const x = Position.x[eid];
          const y = Position.y[eid];
          this.particleEmitter.emit(ParticleType.SHIELD, x, y, 0x00ff00);
        }

        // Continuous shield sparkles (less frequent)
        if (Math.random() > 0.95) {
          const x = Position.x[eid];
          const y = Position.y[eid];
          const offsetX = (Math.random() - 0.5) * 30;
          const offsetY = (Math.random() - 0.5) * 30;
          this.particleEmitter.emit(ParticleType.SHIELD, x + offsetX, y + offsetY, 0x00ff00);
        }
      } else if (this.shieldedUnits.has(eid)) {
        // Shield expired
        this.shieldedUnits.delete(eid);
      }
    }
  }

  private checkProjectileEffects(world: GameWorld) {
    const projectiles = this.projectileQuery(world);

    for (const eid of projectiles) {
      // Check if projectile is active (has remaining lifetime)
      if (Projectile.remainingLifetime && Projectile.remainingLifetime[eid] <= 0) {
        // Projectile impact - create explosion
        const x = Position.x[eid];
        const y = Position.y[eid];
        this.particleEmitter.emit(ParticleType.EXPLOSION, x, y);
        this.screenEffects.impactFlash();
      }
    }
  }

  private checkShowdownTrigger(world: GameWorld) {
    // Check game time for Final Showdown
    if (world.time >= 150 && !this.hasTriggeredShowdown) {
      this.hasTriggeredShowdown = true;
      this.screenEffects.showdownZoom();
      console.log('🎯 FINAL SHOWDOWN TRIGGERED - Visual Effects Active!');
    }
  }

  private hasTriggeredShowdown: boolean = false;

  public destroy() {
    this.particleEmitter.clear();
    this.screenEffects.reset();
    this.statsPanel.destroy();
    this.minimap.destroy();
    this.abilityBar.destroy();
  }

  // Public method to trigger manual effects (for testing)
  public testEffects() {
    console.log('Testing visual effects...');

    // Test various effects
    setTimeout(() => {
      this.particleEmitter.emit(ParticleType.HIT, 960, 540);
      this.screenEffects.hitShake();
    }, 100);

    setTimeout(() => {
      this.particleEmitter.emit(ParticleType.DEATH, 960, 540);
      this.screenEffects.unitDeath();
    }, 1000);

    setTimeout(() => {
      this.particleEmitter.emit(ParticleType.EXPLOSION, 960, 540);
      this.screenEffects.showdownZoom();
    }, 2000);
  }
}