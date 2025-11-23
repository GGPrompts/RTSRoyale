# Performance Optimization Guide

## Performance Targets

- **60 FPS minimum** with 50 units
- **60 FPS stretch goal** with 100 units
- **Frame time < 16.6ms** (60 FPS)
- **No memory leaks** over 10 minutes
- **System execution times** tracked and optimized

## ECS Best Practices

### Cache Queries
```typescript
// ❌ BAD: Creating query every frame
function movementSystem(world: World) {
  const entities = defineQuery([Position, Velocity])(world);
  // ...
}

// ✅ GOOD: Cache query outside system
const movableQuery = defineQuery([Position, Velocity]);
function movementSystem(world: World) {
  const entities = movableQuery(world);
  // ...
}
```

### Use Typed Array Iteration
```typescript
// ❌ BAD: Using forEach or for..of
entities.forEach(eid => {
  Position.x[eid] += Velocity.x[eid];
});

// ✅ GOOD: Traditional for loop for performance
for (let i = 0; i < entities.length; i++) {
  const eid = entities[i];
  Position.x[eid] += Velocity.x[eid];
}
```

### Avoid Allocations in Hot Loops
```typescript
// ❌ BAD: Creating objects in loop
for (const eid of entities) {
  const pos = { x: Position.x[eid], y: Position.y[eid] };
  // ...
}

// ✅ GOOD: Work directly with components
for (let i = 0; i < entities.length; i++) {
  const eid = entities[i];
  const x = Position.x[eid];
  const y = Position.y[eid];
  // ...
}
```

### Batch Operations
```typescript
// ❌ BAD: Multiple queries
const attackers = defineQuery([Attack])(world);
const defenders = defineQuery([Defense])(world);

// ✅ GOOD: Single query with conditional logic
const combatQuery = defineQuery([Health, Team]);
const combatants = combatQuery(world);
for (let i = 0; i < combatants.length; i++) {
  // Process combat
}
```

## Rendering Optimizations

### Sprite Batching
```typescript
// Group sprites by texture to enable batching
const unitsByTexture = new Map<number, Graphics[]>();

// Pixi.js will automatically batch same-texture sprites
```

### Object Pooling
```typescript
// ✅ Pool particles and projectiles
class ParticlePool {
  private pool: Graphics[] = [];

  acquire(): Graphics {
    return this.pool.pop() || new Graphics();
  }

  release(particle: Graphics) {
    particle.clear();
    this.pool.push(particle);
  }
}
```

### Culling
```typescript
// Don't render off-screen entities
function shouldRender(x: number, y: number, viewBounds: Rectangle): boolean {
  return x >= viewBounds.left && x <= viewBounds.right &&
         y >= viewBounds.top && y <= viewBounds.bottom;
}
```

### Reuse Graphics
```typescript
// ❌ BAD: Destroy and recreate
graphic.destroy();
graphic = new Graphics();

// ✅ GOOD: Clear and redraw
graphic.clear();
graphic.circle(0, 0, radius);
graphic.fill(color);
```

## Common Bottlenecks

### 1. Spatial Queries
**Problem:** Finding nearby entities is O(n²)

**Solution:** Use spatial partitioning (grid or quadtree)
```typescript
class SpatialGrid {
  private cellSize = 100;
  private grid = new Map<string, number[]>();

  insert(eid: number, x: number, y: number) {
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key)!.push(eid);
  }

  getNearby(x: number, y: number, radius: number): number[] {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const nearby: number[] = [];

    // Check surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        if (this.grid.has(key)) {
          nearby.push(...this.grid.get(key)!);
        }
      }
    }

    return nearby;
  }
}
```

### 2. Particle Systems
**Problem:** Too many active particles

**Solution:** Limit and pool
```typescript
const MAX_PARTICLES = 500;
if (activeParticles.length >= MAX_PARTICLES) {
  // Recycle oldest particle
  recycleParticle(activeParticles[0]);
}
```

### 3. Text Rendering
**Problem:** Updating text every frame is slow

**Solution:** Cache static text
```typescript
// ❌ BAD: Update every frame
text.text = `Score: ${score}`;

// ✅ GOOD: Only update when changed
if (score !== lastScore) {
  text.text = `Score: ${score}`;
  lastScore = score;
}
```

### 4. Deep Object Cloning
**Problem:** JSON.parse(JSON.stringify()) is slow

**Solution:** Avoid if possible or use structured clone
```typescript
// ❌ BAD: Deep clone every frame
const stateCopy = JSON.parse(JSON.stringify(state));

// ✅ GOOD: Only clone when needed
const stateCopy = structuredClone(state); // Faster than JSON
```

## Profiling Tips

### Enable Performance Dashboard
Press **F3** to toggle the performance dashboard.

### Interpreting Results
- **FPS < 55**: Critical performance issue
- **FPS 55-58**: Warning zone
- **FPS > 58**: Good performance
- **System > 5ms**: Major bottleneck
- **System > 2ms**: Minor bottleneck
- **Memory growth > 5MB/10s**: Potential leak

### Chrome DevTools Performance Tab
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Play game for 10-30 seconds
5. Stop recording
6. Look for:
   - Long tasks (yellow/red bars)
   - Scripting time vs Rendering time
   - Memory allocation patterns

### Common Fixes by System Timing

**pathfindingSystem > 5ms**
- Limit pathfinding calls per frame
- Use cheaper heuristics (Manhattan vs Euclidean)
- Cache paths
- Use flow fields for groups

**combatSystem > 5ms**
- Use spatial partitioning for range checks
- Batch damage calculations
- Limit collision checks

**renderingSystem > 5ms**
- Enable sprite batching
- Implement frustum culling
- Reduce draw calls
- Use texture atlases

**particleSystem > 5ms**
- Reduce max particles
- Use simpler particle shapes
- Pool and recycle particles

## Memory Leak Detection

### Monitor Console
Watch for repeated warnings:
```
[PERF] Potential memory leak: +8.42MB in 10s
```

### Common Causes
1. **Event listeners not removed**
2. **Sprites not destroyed properly**
3. **Query results stored indefinitely**
4. **Closures capturing large objects**

### Prevention
```typescript
// Always clean up event listeners
window.addEventListener('resize', handleResize);
// Later...
window.removeEventListener('resize', handleResize);

// Destroy Pixi objects
sprite.destroy({ texture: false, baseTexture: false });

// Don't store query results
const movableQuery = defineQuery([Position, Velocity]);
// Don't: const entities = movableQuery(world);
// Do: Call query each frame (bitECS caches internally)
```

## Optimization Checklist

Before submitting performance-critical code:

- [ ] Queries are cached outside systems
- [ ] No allocations in hot loops
- [ ] Traditional for loops used (not forEach)
- [ ] Sprites grouped by texture
- [ ] Object pooling for particles/projectiles
- [ ] Culling implemented for off-screen objects
- [ ] Text updates only when values change
- [ ] Event listeners properly cleaned up
- [ ] Graphics reused with clear() instead of destroy()
- [ ] Spatial partitioning for range queries
- [ ] Profiled with F3 dashboard
- [ ] All systems < 5ms execution time
- [ ] Memory stable over 10 minutes

## Target Metrics

### Minimum Viable Performance
- **50 units**: 60 FPS sustained
- **Frame time**: < 16.6ms average
- **Memory**: < 200MB total
- **System timings**: All < 5ms

### Stretch Goals
- **100 units**: 60 FPS sustained
- **Frame time**: < 10ms average
- **Memory**: < 150MB total
- **System timings**: All < 3ms

## Resources

- [bitECS Performance Guide](https://github.com/NateTheGreatt/bitECS#performance)
- [Pixi.js Performance Tips](https://pixijs.download/dev/docs/guides/performance/index.html)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Performance Working Group](https://www.w3.org/webperf/)
