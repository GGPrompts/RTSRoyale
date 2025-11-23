# bitECS Reference

## Documentation Source
- GitHub API: https://github.com/NateTheGreatt/bitECS/blob/master/docs/API.md
- npm: https://www.npmjs.com/package/bitecs

## Core API for RTS Arena

### World Setup
```typescript
import { createWorld, registerComponent, addEntity } from 'bitecs';

const world = createWorld();
```

### Component Definition
```typescript
const Position = { x: 0, y: 0 };
const Velocity = { x: 0, y: 0 };
const Health = { current: 100, max: 100 };
const Team = { id: 0 }; // 0 or 1 for player 1/2

registerComponent(world, Position);
registerComponent(world, Velocity);
registerComponent(world, Health);
registerComponent(world, Team);
```

### Entity Management
```typescript
// Create unit
const eid = addEntity(world);
addComponent(world, eid, Position);
setComponent(world, eid, Position, { x: 100, y: 100 });
setComponent(world, eid, Health, { current: 100, max: 100 });

// Check component
if (hasComponent(world, eid, Position)) {
  // Unit has position
}

// Remove component
removeComponent(world, eid, Velocity);

// Remove entity
removeEntity(world, eid);
```

### Queries (for Systems)
```typescript
// Query all entities with Position and Velocity
const movableQuery = query(world, [Position, Velocity]);

// In movement system
function movementSystem(world: World, deltaTime: number) {
  const entities = movableQuery(world);

  for (const eid of entities) {
    const pos = getComponent(world, eid, Position);
    const vel = getComponent(world, eid, Velocity);

    pos.x += vel.x * deltaTime;
    pos.y += vel.y * deltaTime;
  }
}
```

### Best Practices for RTS
- Register all components at startup
- Use queries for systems (movement, combat, etc.)
- Batch component operations
- Use resetWorld() between matches
- Clean up with deleteWorld() when done

### Performance
- Handles 10,000+ entities efficiently
- Data-oriented design (cache-friendly)
- Perfect for unit-heavy RTS games
