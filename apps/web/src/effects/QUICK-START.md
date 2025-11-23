# Visual Effects - Quick Start

## 🚀 60 Second Integration

### Step 1: Initialize (in test-scene.ts or main.ts)

```typescript
import { initEffects, updateEffects } from './effects/effectsIntegration';

// During scene setup
const effectsData = initEffects(app, worldContainer);
```

### Step 2: Update Each Frame

```typescript
// In your ticker/update loop
app.ticker.add(() => {
  const deltaTime = app.ticker.deltaMS / 1000;
  updateEffects(world, deltaTime, effectsData);
});
```

### Step 3: Trigger Effects (in combat system)

```typescript
import { triggerCombatHit, triggerDeath } from './effects/effectsIntegration';

// When damage is dealt
triggerCombatHit(Position.x[target], Position.y[target], effectsData);

// When unit dies
triggerDeath(Position.x[eid], Position.y[eid], Team.id[eid], effectsData);
```

## ✅ That's It!

You now have:
- ✨ Triangle sprites with team colors
- 💥 Combat hit particles
- 🎆 Death explosions
- 📳 Camera shake
- 🚀 Object pooling for performance

## 🧪 Test It

```typescript
// Run the visual demo
import { runVisualDemo } from './effects/visualDemo';
runVisualDemo(app);
```

## 📊 Performance

Expected performance:
- 60 FPS with 50-100 units
- 200+ active particles
- Object pooling prevents GC pressure

## 📖 Full Documentation

See [README.md](./README.md) for complete API documentation.

## 🎨 What You Get

**Before**: Circles that don't rotate
**After**: Triangles that point toward movement

**Before**: No combat feedback
**After**: Orange particle bursts on hit

**Before**: Units just disappear
**After**: Colorful explosions + screen shake

**Before**: Static camera
**After**: Camera shake on big events

---

Made by Agent 6 🎨
