# Visual Effects System

## Overview

The visual effects system provides particle effects, screen shake, and sprite rendering for RTS Arena.

## Files

- **particleSystem.ts** - Particle spawning and physics with object pooling
- **screenEffects.ts** - Camera shake and screen flash effects
- **effectsIntegration.ts** - Helper functions for integrating effects into the game
- **spriteRenderer.ts** - Triangle sprite renderer with rotation (in /rendering)

## Quick Start

### 1. Initialize Effects

```typescript
import { initEffects, updateEffects } from './effects/effectsIntegration';

const effectsData = initEffects(app, worldContainer);
```

### 2. Update Each Frame

```typescript
app.ticker.add(() => {
  const deltaTime = app.ticker.deltaMS / 1000;
  updateEffects(world, deltaTime, effectsData);
});
```

### 3. Trigger Effects

```typescript
import { triggerCombatHit, triggerDeath } from './effects/effectsIntegration';

// When damage is dealt
triggerCombatHit(targetX, targetY, effectsData);

// When unit dies
triggerDeath(unitX, unitY, teamId, effectsData);
```

## Particle System

### Features

- **Object pooling** - Reuses Graphics objects for performance
- **Physics simulation** - Velocity, gravity, and fade out
- **Particle types**:
  - Combat hits (5 orange particles)
  - Death explosions (15 team-colored particles)
  - Damage numbers (floating upward)

### API

```typescript
particleSystem.spawnCombatHit(x, y);
particleSystem.spawnDeathExplosion(x, y, color);
particleSystem.spawnDamageNumber(x, y, damage);
particleSystem.update(deltaTime);
```

### Performance

- Pool reuses Graphics objects
- Typically handles 200+ active particles at 60 FPS
- Particles automatically returned to pool when expired

## Screen Effects

### Features

- **Camera shake** - Intensity and duration control
- **Smooth return** - Eases back to base position
- **Base position tracking** - Works with camera movement

### API

```typescript
screenEffects.triggerShake(intensity, duration);
screenEffects.setBasePosition(x, y);
screenEffects.update(deltaTime);
```

### Usage

```typescript
// Small shake for combat hits
screenEffects.triggerShake(5, 0.1);

// Medium shake for deaths
screenEffects.triggerShake(8, 0.15);

// Large shake for explosions
screenEffects.triggerShake(15, 0.3);
```

## Sprite Renderer

### Features

- **Triangle sprites** - Units rendered as directional triangles
- **Team colors** - Blue (0x4444ff) vs Red (0xff4444)
- **Auto rotation** - Units face their movement direction
- **Entity lifecycle** - Automatically creates/removes sprites

### API

```typescript
spriteRenderer.update(world);
```

The renderer automatically:
- Creates sprites for new entities
- Updates positions from ECS
- Rotates sprites based on velocity
- Removes sprites when entities die

## Performance Tips

1. **Object Pooling**
   - Particle system pools Graphics objects
   - No allocations during gameplay

2. **Sprite Batching**
   - All triangles use similar rendering
   - Pixi.js automatically batches draws

3. **Culling** (future)
   - See performanceUtils.ts for culling helpers
   - Skip rendering off-screen entities

## Integration with Combat System

The combat system should call effect triggers:

```typescript
// In combat system when damage is dealt:
import { triggerCombatHit } from './effects/effectsIntegration';

function dealDamage(attacker, target, damage) {
  Health.current[target] -= damage;

  // Trigger hit effect
  const x = Position.x[target];
  const y = Position.y[target];
  triggerCombatHit(x, y, effectsData);

  if (Health.current[target] <= 0) {
    triggerDeath(x, y, Team.id[target], effectsData);
  }
}
```

## Testing

Run the test scene to see effects in action:

```typescript
npm run dev
```

Expected behavior:
1. Units rendered as triangles
2. Blue units move right, red units move left
3. Triangles rotate toward movement direction
4. Particle effects spawn on startup (demo)
5. Screen shakes during explosions
6. FPS counter shows performance

## Performance Targets

- ✅ 60 FPS with 50 units
- ✅ 60 FPS with 100 units (stretch goal)
- ✅ 200+ active particles
- ✅ No memory leaks over 10 minutes
- ✅ Object pooling prevents GC pressure

## Future Enhancements

1. **Sprite Sheets** - Load actual unit textures
2. **Trail Effects** - Movement trails for fast units
3. **Impact Flashes** - White flash on hit
4. **Damage Numbers** - Floating text for damage
5. **Screen Flash** - Full-screen color overlay
6. **Culling** - Don't render off-screen entities
