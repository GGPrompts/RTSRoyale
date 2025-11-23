// Visual effects for abilities
import { Application, Graphics, Container } from 'pixi.js';
import { defineQuery, hasComponent } from 'bitecs';
import {
  Position,
  DashVelocity,
  ShieldActive,
  Projectile,
  Team
} from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';

// Queries
const dashingUnitsQuery = defineQuery([Position, DashVelocity]);
const shieldedUnitsQuery = defineQuery([Position, ShieldActive]);
const projectileQuery = defineQuery([Position, Projectile]);

// Visual effects storage
const dashTrails = new Map<number, Graphics[]>();
const shieldEffects = new Map<number, Graphics>();
const projectileVisuals = new Map<number, Graphics>();

// Container for all effects
let effectsContainer: Container | null = null;

export function initAbilityEffects(app: Application) {
  // Create a container for all ability effects
  effectsContainer = new Container();
  app.stage.addChild(effectsContainer);
}

export function updateAbilityEffects(world: GameWorld, app: Application) {
  if (!effectsContainer) return;

  const dt = world.deltaTime;

  // Update dash trails
  updateDashTrails(world, app);

  // Update shield effects
  updateShieldEffects(world, app);

  // Update projectile visuals
  updateProjectileVisuals(world, app);
}

function updateDashTrails(world: GameWorld, app: Application) {
  const dashingUnits = dashingUnitsQuery(world);

  for (let i = 0; i < dashingUnits.length; i++) {
    const eid = dashingUnits[i];

    // Create trail effect when dashing
    if (DashVelocity.duration[eid] > 0) {
      // Create or get trail array for this unit
      if (!dashTrails.has(eid)) {
        dashTrails.set(eid, []);
      }

      const trails = dashTrails.get(eid)!;

      // Create new trail segment
      const trail = new Graphics();
      const teamColor = hasComponent(world, Team, eid) && Team.id[eid] === 0 ? 0x4444ff : 0xff4444;

      trail.circle(Position.x[eid], Position.y[eid], 15);
      trail.fill({ color: teamColor, alpha: 0.5 });

      effectsContainer!.addChild(trail);
      trails.push(trail);

      // Limit trail length
      if (trails.length > 10) {
        const oldTrail = trails.shift();
        if (oldTrail) {
          effectsContainer!.removeChild(oldTrail);
          oldTrail.destroy();
        }
      }
    }
  }

  // Fade out all trails
  dashTrails.forEach((trails, eid) => {
    trails.forEach((trail, index) => {
      trail.alpha -= 0.05;
      if (trail.alpha <= 0) {
        effectsContainer!.removeChild(trail);
        trail.destroy();
        trails.splice(index, 1);
      }
    });

    // Clean up empty trail arrays
    if (trails.length === 0) {
      dashTrails.delete(eid);
    }
  });
}

function updateShieldEffects(world: GameWorld, app: Application) {
  const shieldedUnits = shieldedUnitsQuery(world);

  for (let i = 0; i < shieldedUnits.length; i++) {
    const eid = shieldedUnits[i];

    if (ShieldActive.remainingDuration[eid] > 0) {
      // Create shield effect if not exists
      if (!shieldEffects.has(eid)) {
        const shield = new Graphics();
        effectsContainer!.addChild(shield);
        shieldEffects.set(eid, shield);
      }

      const shield = shieldEffects.get(eid)!;
      shield.clear();

      // Draw pulsing shield effect
      const pulse = 1.0 + Math.sin(Date.now() * 0.01) * 0.2;
      const radius = 30 * pulse;

      // Outer glow
      shield.circle(Position.x[eid], Position.y[eid], radius);
      shield.stroke({ color: 0x00aaff, width: 3, alpha: 0.3 });

      // Inner shield
      shield.circle(Position.x[eid], Position.y[eid], radius - 5);
      shield.fill({ color: 0x00aaff, alpha: 0.1 });

      // Add sparkle effects
      const numSparkles = 5;
      for (let j = 0; j < numSparkles; j++) {
        const angle = (Date.now() * 0.002 + j * (Math.PI * 2 / numSparkles)) % (Math.PI * 2);
        const sparkleX = Position.x[eid] + Math.cos(angle) * radius;
        const sparkleY = Position.y[eid] + Math.sin(angle) * radius;

        shield.circle(sparkleX, sparkleY, 2);
        shield.fill({ color: 0xffffff, alpha: 0.8 });
      }
    } else if (shieldEffects.has(eid)) {
      // Remove shield effect
      const shield = shieldEffects.get(eid)!;
      effectsContainer!.removeChild(shield);
      shield.destroy();
      shieldEffects.delete(eid);
    }
  }
}

function updateProjectileVisuals(world: GameWorld, app: Application) {
  const projectiles = projectileQuery(world);

  for (let i = 0; i < projectiles.length; i++) {
    const eid = projectiles[i];

    // Create projectile visual if not exists
    if (!projectileVisuals.has(eid)) {
      const projectile = new Graphics();

      // Draw projectile as a glowing orb
      projectile.circle(0, 0, 8);
      projectile.fill({ color: 0xffaa00, alpha: 0.9 });

      projectile.circle(0, 0, 12);
      projectile.fill({ color: 0xff8800, alpha: 0.4 });

      effectsContainer!.addChild(projectile);
      projectileVisuals.set(eid, projectile);
    }

    const visual = projectileVisuals.get(eid)!;
    visual.x = Position.x[eid];
    visual.y = Position.y[eid];

    // Add particle trail
    const trail = new Graphics();
    trail.circle(Position.x[eid], Position.y[eid], 4);
    trail.fill({ color: 0xff6600, alpha: 0.3 });
    effectsContainer!.addChild(trail);

    // Fade trail
    setTimeout(() => {
      trail.alpha -= 0.1;
      if (trail.alpha <= 0) {
        effectsContainer!.removeChild(trail);
        trail.destroy();
      }
    }, 100);

    // Check if projectile reached target (will be removed by abilities system)
    const dx = Projectile.targetX[eid] - Position.x[eid];
    const dy = Projectile.targetY[eid] - Position.y[eid];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      // Create explosion effect
      createExplosion(Position.x[eid], Position.y[eid], Projectile.aoeRadius[eid]);

      // Remove projectile visual
      effectsContainer!.removeChild(visual);
      visual.destroy();
      projectileVisuals.delete(eid);
    }
  }

  // Clean up visuals for removed projectiles
  projectileVisuals.forEach((visual, eid) => {
    // Check if entity still exists
    const stillExists = projectiles.includes(eid);
    if (!stillExists) {
      effectsContainer!.removeChild(visual);
      visual.destroy();
      projectileVisuals.delete(eid);
    }
  });
}

function createExplosion(x: number, y: number, radius: number) {
  if (!effectsContainer) return;

  // Create multiple explosion rings
  for (let i = 0; i < 3; i++) {
    const explosion = new Graphics();

    const delay = i * 50;
    setTimeout(() => {
      let currentRadius = 0;
      const maxRadius = radius + i * 20;
      const expandSpeed = 5;

      const animate = () => {
        explosion.clear();

        if (currentRadius < maxRadius) {
          const alpha = 1 - (currentRadius / maxRadius);

          explosion.circle(x, y, currentRadius);
          explosion.stroke({ color: 0xff4400, width: 3, alpha: alpha * 0.7 });

          explosion.circle(x, y, currentRadius * 0.7);
          explosion.fill({ color: 0xffaa00, alpha: alpha * 0.3 });

          currentRadius += expandSpeed;
          requestAnimationFrame(animate);
        } else {
          effectsContainer!.removeChild(explosion);
          explosion.destroy();
        }
      };

      effectsContainer!.addChild(explosion);
      animate();
    }, delay);
  }

  // Create particle burst
  const numParticles = 12;
  for (let i = 0; i < numParticles; i++) {
    const particle = new Graphics();
    const angle = (i / numParticles) * Math.PI * 2;
    const speed = 3 + Math.random() * 3;

    particle.circle(0, 0, 3);
    particle.fill({ color: 0xffff00 });

    particle.x = x;
    particle.y = y;

    effectsContainer!.addChild(particle);

    let particleLife = 1.0;
    const animateParticle = () => {
      particle.x += Math.cos(angle) * speed;
      particle.y += Math.sin(angle) * speed;
      particle.alpha = particleLife;
      particleLife -= 0.02;

      if (particleLife > 0) {
        requestAnimationFrame(animateParticle);
      } else {
        effectsContainer!.removeChild(particle);
        particle.destroy();
      }
    };

    animateParticle();
  }
}

export function cleanupAbilityEffects() {
  // Clean up all effects
  dashTrails.forEach(trails => {
    trails.forEach(trail => {
      if (effectsContainer) {
        effectsContainer.removeChild(trail);
      }
      trail.destroy();
    });
  });
  dashTrails.clear();

  shieldEffects.forEach(shield => {
    if (effectsContainer) {
      effectsContainer.removeChild(shield);
    }
    shield.destroy();
  });
  shieldEffects.clear();

  projectileVisuals.forEach(projectile => {
    if (effectsContainer) {
      effectsContainer.removeChild(projectile);
    }
    projectile.destroy();
  });
  projectileVisuals.clear();

  if (effectsContainer) {
    effectsContainer.destroy({ children: true });
    effectsContainer = null;
  }
}