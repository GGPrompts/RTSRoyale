# RTS Arena - Development Setup

**Status**: Prototype scaffolding complete - Ready for parallel development

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser to http://localhost:3000
```

## Project Structure

```
rts-arena/
├── packages/
│   ├── types/          # Shared TypeScript interfaces
│   ├── core/           # Game logic (ECS components & systems)
│   ├── client/         # Client-specific rendering
│   └── server/         # Server implementation (Phase 3+)
├── apps/
│   └── web/            # Browser client (Vite + Pixi.js)
├── docs/
│   ├── BattleRoyalePlan.md          # Master plan (all phases)
│   ├── PIXIJS-V8-REFERENCE.md       # Pixi.js v8 API reference
│   ├── BITECS-REFERENCE.md          # bitECS patterns & examples
│   ├── WEBTRANSPORT-REFERENCE.md    # WebTransport guide
│   └── RTS-ECS-SKILL.md             # ECS patterns for RTS games
└── README.md           # This file
```

## Current Status

### ✅ Complete
- [x] Monorepo structure with npm workspaces
- [x] TypeScript configuration
- [x] Vite dev server setup
- [x] bitECS components defined (Position, Velocity, Health, etc.)
- [x] Basic systems (movement, pathfinding)
- [x] Pixi.js application initialized (WebGPU + WebGL fallback)
- [x] Test scene with 20 units (10 blue, 10 red)
- [x] UI overlay (timer, stats, debug info)

### 🚧 Ready to Build (Phase 1 Goals)
- [ ] Unit selection (click, box select, control groups)
- [ ] Combat system (range, damage, attack speed)
- [ ] 3 basic abilities (Dash, Shield, Ranged Attack)
- [ ] Final Showdown system (timer → teleport → auto-battle)
- [ ] Input handling (mouse, keyboard)
- [ ] Health bars and damage numbers
- [ ] Unit death and cleanup

## Tech Stack

- **Rendering**: Pixi.js v8 (WebGPU with WebGL fallback)
- **ECS**: bitECS (data-oriented, 10k+ entities)
- **Build**: Vite (fast HMR, ES modules)
- **Language**: TypeScript (strict mode)

## Development Workflow

### Running the Prototype

```bash
# Terminal 1: Start dev server
cd apps/web
npm run dev

# Opens at http://localhost:3000
# Hot reload enabled
```

### Current Controls (Minimal)
- **Click**: Select unit (TODO)
- **Right-click**: Move unit (TODO)
- **Drag**: Box select (TODO)
- **Q/W/E**: Abilities (TODO)

### Performance Targets (Phase 1)
- 60 FPS with 50 units on screen
- <16ms frame time
- Smooth movement (no stuttering)

## Documentation Quick Links

### Core References
- **Master Plan**: [BattleRoyalePlan.md](./BattleRoyalePlan.md) - Complete development roadmap
- **Pixi.js v8**: [PIXIJS-V8-REFERENCE.md](./docs/PIXIJS-V8-REFERENCE.md) - WebGPU, rendering patterns
- **bitECS**: [BITECS-REFERENCE.md](./docs/BITECS-REFERENCE.md) - Component/system patterns
- **ECS Patterns**: [RTS-ECS-SKILL.md](./docs/RTS-ECS-SKILL.md) - RTS-specific implementations

### External Docs
- [Pixi.js v8 Full Docs](https://pixijs.com/llms-full.txt)
- [bitECS GitHub](https://github.com/NateTheGreatt/bitECS)
- [WebTransport API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API)

## Parallel Development Strategy

This setup supports **multiple Claude web sessions** working on different features simultaneously:

### Suggested Parallel Tracks

**Track 1: Combat System**
- Implement damage, range, attack speed
- Add health bars
- Unit death and cleanup

**Track 2: Abilities**
- Dash: Move + damage in line
- Shield: Temporary damage reduction
- Ranged Attack: Projectile + AOE

**Track 3: Final Showdown**
- Timer system with phases
- Warning at 2:00, collapse at 2:25
- Teleport all units to center at 2:30
- Auto-battle logic

**Track 4: Input & Selection**
- Mouse click selection
- Box select (drag)
- Control groups (1-9)
- Move orders

**Track 5: Visual Polish**
- Sprite sheets (replace Graphics)
- Particle effects for abilities
- Screen shake, camera effects
- UI improvements

## Testing Checklist

Before moving to Phase 2:

- [ ] 60 FPS with 50 units
- [ ] Final Showdown feels exciting
- [ ] Abilities are responsive (<50ms)
- [ ] 2:30 round length is appropriate
- [ ] No memory leaks over 10 minutes

## Next Steps

1. **Choose a track** from parallel development suggestions
2. **Read relevant docs** in /docs folder
3. **Implement feature** following ECS patterns
4. **Test performance** against Phase 1 targets
5. **Iterate** based on testing results

## Notes

- This is **Phase 1** of an 8-phase plan (see BattleRoyalePlan.md)
- Focus on **fun core loop** before adding complexity
- Use **RTS-ECS-SKILL.md** for implementation patterns
- Performance is critical - profile early and often
