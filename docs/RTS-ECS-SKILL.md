---
name: rts-ecs-patterns
description: "Patterns and best practices for building RTS games with ECS architecture, Pixi.js rendering, and real-time multiplayer. Use for: (1) Setting up bitECS systems, (2) Implementing unit movement/pathfinding, (3) Combat and abilities, (4) Pixi.js rendering optimization, (5) Final Showdown mechanic"
version: 1.0.0
---

# RTS Arena ECS Development Patterns

## Core Architecture

### ECS System Organization

```typescript
// System execution order matters!
const systems = [
  inputSystem,          // Process player input
  pathfindingSystem,    // Calculate paths
  movementSystem,       // Update positions
  combatSystem,         // Process attacks
  abilitySystem,        // Handle abilities
  finalShowdownSystem,  // Manage timer & teleport
  renderSystem,         // Update Pixi.js visuals
];

function gameLoop(deltaTime: number) {
  for (const system of systems) {
    system(world, deltaTime);
  }
}
```

### Component Definitions

```typescript
// Position & Movement
const Position = { x: 0, y: 0 };
const Velocity = { x: 0, y: 0 };
const Target = { x: 0, y: 0, reached: 0 }; // 0 = false, 1 = true

// Combat
const Health = { current: 100, max: 100 };
const Damage = { amount: 25, range: 2.0, attackSpeed: 1.0, cooldown: 0 };
const Team = { id: 0 }; // 0 or 1

// Abilities
const Dash = { cooldown: 0, maxCooldown: 10, distance: 5, damage: 30 };
const Shield = { cooldown: 0, maxCooldown: 15, duration: 3, active: 0 };
const RangedAttack = { cooldown: 0, maxCooldown: 8, range: 10, damage: 40 };

// Rendering
const Sprite = { textureId: 0, scaleX: 1.0, scaleY: 1.0, rotation: 0 };
const Selected = { value: 0 }; // Boolean

// Game State
const Dead = {}; // Tag component
const Teleporting = { startTime: 0, endTime: 0 };
```

## Core Systems

### 1. Movement System (Simple)

```typescript
function movementSystem(world: World, deltaTime: number) {
  const query = defineQuery([Position, Velocity]);
  const entities = query(world);

  for (const eid of entities) {
    const pos = Position(world, eid);
    const vel = Velocity(world, eid);

    pos.x += vel.x * deltaTime;
    pos.y += vel.y * deltaTime;
  }
}
```

### 2. Combat System

```typescript
function combatSystem(world: World, deltaTime: number) {
  const combatQuery = defineQuery([Position, Damage, Team]);
  const entities = combatQuery(world);

  for (const attacker of entities) {
    const atkPos = Position(world, attacker);
    const atkDmg = Damage(world, attacker);
    const atkTeam = Team(world, attacker);

    // Update cooldown
    atkDmg.cooldown = Math.max(0, atkDmg.cooldown - deltaTime);
    if (atkDmg.cooldown > 0) continue;

    // Find targets in range
    for (const target of entities) {
      if (hasComponent(world, target, Dead)) continue;
      const tgtTeam = Team(world, target);
      if (tgtTeam.id === atkTeam.id) continue; // Same team

      const tgtPos = Position(world, target);
      const distance = Math.hypot(
        tgtPos.x - atkPos.x,
        tgtPos.y - atkPos.y
      );

      if (distance <= atkDmg.range) {
        // Deal damage
        const health = Health(world, target);
        health.current -= atkDmg.amount;

        // Reset cooldown
        atkDmg.cooldown = atkDmg.maxCooldown / atkDmg.attackSpeed;

        // Check death
        if (health.current <= 0) {
          addComponent(world, target, Dead);
          // Will be cleaned up by cleanup system
        }

        break; // One target per attack
      }
    }
  }
}
```

### 3. Final Showdown System

```typescript
const MATCH_DURATION = 150; // 2:30 in seconds
const WARNING_TIME = 120;   // 2:00
const COLLAPSE_TIME = 145;  // 2:25
const SHOWDOWN_TIME = 150;  // 2:30

function finalShowdownSystem(world: World, gameTime: number) {
  // Warning phase
  if (gameTime >= WARNING_TIME && gameTime < WARNING_TIME + 0.1) {
    showWarning("ARENA COLLAPSE IN 30 SECONDS");
    playSound('warning');
  }

  // Collapse phase
  if (gameTime >= COLLAPSE_TIME && gameTime < COLLAPSE_TIME + 0.1) {
    showWarning("PREPARE FOR FINAL SHOWDOWN");
    playSound('countdown');
    // Visual effects: screen glow, etc.
  }

  // Showdown trigger
  if (gameTime >= SHOWDOWN_TIME) {
    const allUnits = defineQuery([Position, Team])(world);
    const centerX = ARENA_WIDTH / 2;
    const centerY = ARENA_HEIGHT / 2;

    for (const eid of allUnits) {
      if (hasComponent(world, eid, Dead)) continue;

      // Teleport to center
      const pos = Position(world, eid);
      addComponent(world, eid, Teleporting);

      // Slight offset to prevent perfect stacking
      const angle = Math.random() * Math.PI * 2;
      const offset = Math.random() * 3;
      pos.x = centerX + Math.cos(angle) * offset;
      pos.y = centerY + Math.sin(angle) * offset;

      // Force auto-attack mode
      // (implementation depends on your attack targeting)
    }

    playSound('showdown');
    showWarning("FINAL SHOWDOWN!");
  }
}
```

## Pixi.js Integration

### Render System

```typescript
import { Container, Sprite, Graphics } from 'pixi.js';

// Map entity IDs to Pixi sprites
const spriteMap = new Map<number, Sprite>();

function renderSystem(world: World, app: Application) {
  const renderQuery = defineQuery([Position, Sprite]);
  const entities = renderQuery(world);

  for (const eid of entities) {
    const pos = Position(world, eid);
    const spriteComp = Sprite(world, eid);

    // Get or create Pixi sprite
    let pixiSprite = spriteMap.get(eid);
    if (!pixiSprite) {
      pixiSprite = new Sprite(textures[spriteComp.textureId]);
      app.stage.addChild(pixiSprite);
      spriteMap.set(eid, pixiSprite);
    }

    // Update transform
    pixiSprite.x = pos.x;
    pixiSprite.y = pos.y;
    pixiSprite.scale.set(spriteComp.scaleX, spriteComp.scaleY);
    pixiSprite.rotation = spriteComp.rotation;

    // Highlight selected units
    if (hasComponent(world, eid, Selected)) {
      pixiSprite.tint = 0x00ff00;
    } else {
      pixiSprite.tint = 0xffffff;
    }

    // Health bars
    if (hasComponent(world, eid, Health)) {
      const health = Health(world, eid);
      const healthPercent = health.current / health.max;
      // Draw health bar above unit
      // (use Graphics or pre-rendered sprites)
    }
  }

  // Cleanup dead entities
  const deadQuery = defineQuery([Dead])(world);
  for (const eid of deadQuery) {
    const sprite = spriteMap.get(eid);
    if (sprite) {
      app.stage.removeChild(sprite);
      sprite.destroy();
      spriteMap.delete(eid);
    }
    removeEntity(world, eid);
  }
}
```

### Performance Tips

1. **Use sprite sheets**: Pack all units into single texture atlas
2. **ParticleContainer**: For ability effects (limited features, huge performance)
3. **Culling**: Don't render off-screen entities
4. **Object pooling**: Reuse entities instead of destroy/create

```typescript
// Example: Particle container for ability effects
import { ParticleContainer } from 'pixi.js';

const particleContainer = new ParticleContainer(1000, {
  scale: true,
  position: true,
  rotation: true,
  alpha: true,
});
app.stage.addChild(particleContainer);
```

## Pathfinding (Simple Grid-based)

```typescript
// Grid-based A* pathfinding
function findPath(start: {x: number, y: number}, end: {x: number, y: number}): {x: number, y: number}[] {
  // Simplified A* implementation
  // For prototype, use straight-line movement with obstacle avoidance
  return [end]; // Direct path
}

function pathfindingSystem(world: World, deltaTime: number) {
  const query = defineQuery([Position, Target, Velocity]);
  const entities = query(world);

  for (const eid of entities) {
    const pos = Position(world, eid);
    const target = Target(world, eid);
    const vel = Velocity(world, eid);

    if (target.reached) {
      vel.x = 0;
      vel.y = 0;
      continue;
    }

    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 0.5) {
      target.reached = 1;
      vel.x = 0;
      vel.y = 0;
    } else {
      const speed = 5.0; // units per second
      vel.x = (dx / distance) * speed;
      vel.y = (dy / distance) * speed;
    }
  }
}
```

## Anti-Deathball Mechanics

### Clustering Penalty

```typescript
function clusteringPenaltySystem(world: World) {
  const units = defineQuery([Position, Team])(world);
  const CLUSTER_RADIUS = 2.0;
  const AOE_DAMAGE_MULTIPLIER = 1.5; // 50% more damage when clustered

  for (const eid of units) {
    const pos = Position(world, eid);
    const team = Team(world, eid);

    // Count nearby allies
    let nearbyAllies = 0;
    for (const other of units) {
      if (other === eid) continue;
      const otherTeam = Team(world, other);
      if (otherTeam.id !== team.id) continue;

      const otherPos = Position(world, other);
      const dist = Math.hypot(pos.x - otherPos.x, pos.y - otherPos.y);

      if (dist <= CLUSTER_RADIUS) {
        nearbyAllies++;
      }
    }

    // Apply penalty (store in component for combat system to use)
    if (nearbyAllies > 3) {
      // This unit takes more AOE damage
      // (implementation depends on your damage system)
    }
  }
}
```

## Quick Start Checklist

- [ ] Set up monorepo with @rts-arena/core, @rts-arena/client packages
- [ ] Install dependencies: pixi.js@8, bitecs, msgpackr
- [ ] Create World and register components
- [ ] Implement basic movement system
- [ ] Add Pixi.js renderer with WebGPU preference
- [ ] Implement combat system with range/damage
- [ ] Add 3 basic abilities (Dash, Shield, Ranged)
- [ ] Implement Final Showdown system
- [ ] Test with 50 units @ 60fps target

## Testing Targets (Phase 1)

- 60 FPS with 50 units on screen
- <16ms frame time consistently
- Smooth movement (no stuttering)
- Final Showdown teleport works correctly
- Abilities have clear cooldowns and effects

## Common Patterns

### Box Selection

```typescript
function handleBoxSelect(startX: number, startY: number, endX: number, endY: number, teamId: number) {
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);

  const selectableQuery = defineQuery([Position, Team, Selected]);
  const entities = selectableQuery(world);

  for (const eid of entities) {
    const pos = Position(world, eid);
    const team = Team(world, eid);

    if (team.id !== teamId) continue;

    const inBox = pos.x >= minX && pos.x <= maxX &&
                  pos.y >= minY && pos.y <= maxY;

    Selected(world, eid).value = inBox ? 1 : 0;
  }
}
```

### Ability Casting

```typescript
function castDash(world: World, eid: number, targetX: number, targetY: number) {
  const dash = Dash(world, eid);

  if (dash.cooldown > 0) {
    return false; // On cooldown
  }

  const pos = Position(world, eid);

  // Calculate dash direction
  const dx = targetX - pos.x;
  const dy = targetY - pos.y;
  const dist = Math.hypot(dx, dy);

  // Dash in direction (clamped to max distance)
  const actualDist = Math.min(dist, dash.distance);
  pos.x += (dx / dist) * actualDist;
  pos.y += (dy / dist) * actualDist;

  // Deal damage to enemies in path
  // (implementation varies)

  // Set cooldown
  dash.cooldown = dash.maxCooldown;

  // Trigger animation/effect
  createDashEffect(pos.x, pos.y, Math.atan2(dy, dx));

  return true;
}
```

## Resources

- Pixi.js v8 docs: https://pixijs.com/8.x/guides
- bitECS API: https://github.com/NateTheGreatt/bitECS/blob/master/docs/API.md
- Project plan: /home/matt/projects/RTSRoyale/BattleRoyalePlan.md
- Tech references: /home/matt/projects/RTSRoyale/docs/*.md
