import { hasComponent, addComponent } from 'bitecs';
import { Dash, Shield, RangedAttack, Position, Velocity, Selected } from '@rts-arena/core';

export class AbilityInputHandler {
  private world: any;
  private selectedEntities: Set<number> = new Set();
  private enabled: boolean = true;

  constructor(world: any) {
    this.world = world;
    this.setupKeyboardListeners();
  }

  updateSelection(selectedEntities: Set<number>) {
    this.selectedEntities = selectedEntities;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      // Prevent ability triggers when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'q') {
        e.preventDefault();
        this.triggerDash();
      } else if (key === 'w') {
        e.preventDefault();
        this.triggerShield();
      } else if (key === 'e') {
        e.preventDefault();
        this.triggerRangedAttack();
      }
    });
  }

  private triggerDash() {
    for (const eid of this.selectedEntities) {
      // Add Dash component if it doesn't exist
      if (!hasComponent(this.world, Dash, eid)) {
        addComponent(this.world, Dash, eid);
        Dash.cooldown[eid] = 0;
        Dash.active[eid] = 0;
      }

      // Check if ability is ready
      if (Dash.cooldown[eid] <= 0) {
        // Make sure entity has velocity component
        if (!hasComponent(this.world, Velocity, eid)) {
          addComponent(this.world, Velocity, eid);
          Velocity.x[eid] = 1; // Default forward direction
          Velocity.y[eid] = 0;
        }

        // If velocity is zero, use a default direction
        if (Velocity.x[eid] === 0 && Velocity.y[eid] === 0) {
          Velocity.x[eid] = 1;
          Velocity.y[eid] = 0;
        }

        Dash.active[eid] = 0.5; // 0.5s dash duration
        Dash.cooldown[eid] = 10.0; // 10s cooldown
        console.log(`Unit ${eid} dashing!`);
      } else {
        console.log(`Dash on cooldown: ${Dash.cooldown[eid].toFixed(1)}s remaining`);
      }
    }
  }

  private triggerShield() {
    for (const eid of this.selectedEntities) {
      // Add Shield component if it doesn't exist
      if (!hasComponent(this.world, Shield, eid)) {
        addComponent(this.world, Shield, eid);
        Shield.cooldown[eid] = 0;
        Shield.active[eid] = 0;
      }

      // Check if ability is ready
      if (Shield.cooldown[eid] <= 0) {
        Shield.active[eid] = 3.0; // 3s shield duration
        Shield.cooldown[eid] = 15.0; // 15s cooldown
        console.log(`Unit ${eid} shielding!`);
      } else {
        console.log(`Shield on cooldown: ${Shield.cooldown[eid].toFixed(1)}s remaining`);
      }
    }
  }

  private triggerRangedAttack() {
    for (const eid of this.selectedEntities) {
      // Add RangedAttack component if it doesn't exist
      if (!hasComponent(this.world, RangedAttack, eid)) {
        addComponent(this.world, RangedAttack, eid);
        RangedAttack.cooldown[eid] = 0;
        RangedAttack.active[eid] = 0;
        RangedAttack.projectileX[eid] = 0;
        RangedAttack.projectileY[eid] = 0;
        RangedAttack.projectileVX[eid] = 0;
        RangedAttack.projectileVY[eid] = 0;
      }

      // Check if ability is ready
      if (RangedAttack.cooldown[eid] <= 0) {
        // Make sure entity has position and velocity
        if (!hasComponent(this.world, Position, eid)) {
          console.warn(`Entity ${eid} has no Position component`);
          continue;
        }

        if (!hasComponent(this.world, Velocity, eid)) {
          addComponent(this.world, Velocity, eid);
          Velocity.x[eid] = 1;
          Velocity.y[eid] = 0;
        }

        // Set projectile starting position
        RangedAttack.projectileX[eid] = Position.x[eid];
        RangedAttack.projectileY[eid] = Position.y[eid];

        // Calculate projectile velocity
        // If unit has velocity, shoot in movement direction
        // Otherwise shoot to the right
        let vx = Velocity.x[eid];
        let vy = Velocity.y[eid];

        if (vx === 0 && vy === 0) {
          vx = 1;
          vy = 0;
        }

        // Normalize and apply projectile speed
        const mag = Math.sqrt(vx * vx + vy * vy);
        const speed = 300; // pixels per second
        RangedAttack.projectileVX[eid] = (vx / mag) * speed;
        RangedAttack.projectileVY[eid] = (vy / mag) * speed;

        RangedAttack.active[eid] = 2.0; // 2s projectile lifetime
        RangedAttack.cooldown[eid] = 8.0; // 8s cooldown
        console.log(`Unit ${eid} firing ranged attack!`);
      } else {
        console.log(`Ranged attack on cooldown: ${RangedAttack.cooldown[eid].toFixed(1)}s remaining`);
      }
    }
  }

  // Method to trigger abilities programmatically (for AI or testing)
  triggerAbility(abilityKey: 'q' | 'w' | 'e', entityIds?: number[]) {
    const previousSelection = this.selectedEntities;

    if (entityIds) {
      this.selectedEntities = new Set(entityIds);
    }

    switch (abilityKey) {
      case 'q':
        this.triggerDash();
        break;
      case 'w':
        this.triggerShield();
        break;
      case 'e':
        this.triggerRangedAttack();
        break;
    }

    if (entityIds) {
      this.selectedEntities = previousSelection;
    }
  }

  destroy() {
    // Remove event listeners if needed
    // In this implementation, we're using document-level listeners
    // which will be cleaned up when the page unloads
  }
}