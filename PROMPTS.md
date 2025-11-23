# Template Prompts for Parallel Development

Copy-paste these into separate Claude web sessions to build different features in parallel.

---

## Prompt 1: Combat System Implementation

```
I'm building an RTS game called RTS Arena using Pixi.js v8 and bitECS. The project scaffolding is complete.

PROJECT CONTEXT:
- Monorepo at /home/matt/projects/RTSRoyale
- ECS components already defined in packages/core/src/components.ts
- Basic movement and pathfinding systems exist
- Test scene has 20 units spawned (10 blue, 10 red)

YOUR TASK:
Implement the combat system with these features:
1. Range-based auto-attacking
2. Damage application with attack speed cooldowns
3. Health bars rendered above units
4. Unit death detection and cleanup
5. Damage numbers that float up on hit

TECHNICAL REQUIREMENTS:
- Use bitECS defineQuery for efficient entity filtering
- Combat system should check distance between units
- Only attack enemies (different Team.id)
- Respect attack cooldowns (Damage.cooldown field)
- Update Health.current, mark Dead when health <= 0

REFERENCES:
- Read docs/BITECS-REFERENCE.md for query patterns
- Read docs/RTS-ECS-SKILL.md section "Combat System" for example implementation
- Read docs/PIXIJS-V8-REFERENCE.md for health bar rendering

FILES TO MODIFY:
- packages/core/src/systems/combat.ts (create)
- packages/core/src/systems/index.ts (add export)
- apps/web/src/main.ts (add combatSystem to game loop)
- apps/web/src/test-scene.ts (add Damage component to units)

DELIVERABLES:
- Working combat system with all units auto-attacking nearby enemies
- Health bars visible above each unit
- Units die when health reaches 0
- No performance degradation (maintain 60 FPS)

TESTING:
- Spawn units close together and verify they attack
- Check health bars update correctly
- Verify units are removed when dead
- Test with 50 units to ensure performance

START BY:
1. Reading the reference docs mentioned above
2. Looking at existing movement system for patterns
3. Implementing the combat system step by step
4. Testing with the existing test scene

Use ultrathink mode for planning the implementation before coding.
```

---

## Prompt 2: Abilities System (Dash, Shield, Ranged)

```
I'm building an RTS game called RTS Arena using Pixi.js v8 and bitECS. The project scaffolding is complete.

PROJECT CONTEXT:
- Monorepo at /home/matt/projects/RTSRoyale
- ECS components for abilities already defined: Dash, Shield, RangedAttack
- Basic systems exist (movement, pathfinding)
- Test scene has 20 units spawned

YOUR TASK:
Implement 3 basic abilities with clear telegraphs and effects:

1. **Dash** (Q key)
   - Instantly move 5 units in target direction
   - Deal 30 damage to enemies in path
   - 10 second cooldown
   - Visual: streak effect

2. **Shield** (W key)
   - Grant 50% damage reduction for 3 seconds
   - 15 second cooldown
   - Visual: blue glow around unit

3. **Ranged Attack** (E key)
   - Shoot projectile dealing 40 damage
   - Range: 10 units
   - 8 second cooldown
   - Visual: projectile animation

TECHNICAL REQUIREMENTS:
- Create abilitySystem that processes cooldowns
- Add keyboard input handling (Q/W/E keys)
- Only trigger abilities for selected units
- Add visual effects using Pixi.js Graphics or Particles
- Show cooldown UI indicators

REFERENCES:
- Read docs/RTS-ECS-SKILL.md section "Ability Casting"
- Read docs/PIXIJS-V8-REFERENCE.md for particle effects
- Read docs/BITECS-REFERENCE.md for component patterns

FILES TO CREATE/MODIFY:
- packages/core/src/systems/abilities.ts (create)
- apps/web/src/input.ts (create input handler)
- apps/web/src/effects.ts (create visual effects)
- apps/web/src/main.ts (add ability system and input)

DELIVERABLES:
- All 3 abilities working with keyboard controls
- Clear visual feedback for each ability
- Cooldown indicators visible to player
- Smooth animations/effects

TESTING:
- Press Q/W/E and verify abilities trigger
- Check cooldowns prevent spam
- Verify damage is applied correctly
- Test visual effects render properly

Use ultrathink mode to design the ability system architecture first.
```

---

## Prompt 3: Final Showdown Mechanic

```
I'm building an RTS game called RTS Arena. The signature feature is the "Final Showdown" mechanic.

PROJECT CONTEXT:
- Monorepo at /home/matt/projects/RTSRoyale
- bitECS for game logic, Pixi.js for rendering
- Basic systems exist (movement, pathfinding)
- Matches last 2:30 (150 seconds)

YOUR TASK:
Implement the Final Showdown system that makes every match exciting:

TIMELINE:
- 0:00-2:00: Normal gameplay
- 2:00: Warning "ARENA COLLAPSE IN 30 SECONDS"
- 2:15: Screen edges glow red, music intensifies
- 2:20: Countdown timer appears
- 2:25: "PREPARE FOR FINAL SHOWDOWN"
- 2:30: **TELEPORT ALL UNITS TO CENTER**
  - Units automatically attack nearest enemy
  - Winner = last team standing
  - No draws possible

TECHNICAL REQUIREMENTS:
- Track game time in world.time
- Trigger phase transitions at specific times
- Teleport all living units to arena center
- Force auto-attack mode (nearest enemy)
- Visual effects for each phase (screen glow, warnings)
- Sound triggers (if time permits)

REFERENCES:
- Read docs/RTS-ECS-SKILL.md section "Final Showdown System"
- Read BattleRoyalePlan.md lines 59-73 for original design
- Read docs/PIXIJS-V8-REFERENCE.md for screen effects

FILES TO CREATE/MODIFY:
- packages/core/src/systems/finalShowdown.ts (create)
- apps/web/src/effects.ts (screen effects)
- apps/web/src/main.ts (add to game loop)
- apps/web/index.html (update phase-warning div)

DELIVERABLES:
- Working phase transitions at correct times
- Teleport mechanic at 2:30
- Visual warnings and screen effects
- Auto-attack logic during showdown
- Victory detection (one team eliminated)

TESTING:
- Fast-forward time to test each phase
- Verify teleport positions units correctly
- Check auto-attack targets nearest enemy
- Test with 0, 10, 50 units
- Ensure no draw outcomes

This is the SIGNATURE FEATURE - make it feel epic!

Use ultrathink mode to plan the phase transition logic.
```

---

## Prompt 4: Input & Selection System

```
I'm building an RTS game called RTS Arena. I need professional RTS-style input controls.

PROJECT CONTEXT:
- Monorepo at /home/matt/projects/RTSRoyale
- bitECS + Pixi.js v8
- Units already render on screen
- Selected component exists but unused

YOUR TASK:
Implement RTS input controls:

1. **Click Selection**
   - Left-click: Select single unit
   - Highlight selected units (green tint)

2. **Box Selection**
   - Click + drag: Draw selection box
   - Select all units in box on release
   - Visual: dashed rectangle

3. **Control Groups**
   - Ctrl + 1-9: Assign selection to group
   - 1-9: Recall group
   - Visual indicator for group assignment

4. **Move Orders**
   - Right-click: Move selected units to position
   - Show move target indicator
   - Units pathfind to target

5. **Camera Controls** (bonus)
   - WASD or arrow keys: Pan camera
   - Mouse wheel: Zoom in/out
   - Middle-click drag: Pan camera

TECHNICAL REQUIREMENTS:
- Use Pixi.js events for mouse input
- Set Selected.value = 1 for selected entities
- Update Target component for move orders
- Store control groups in client state (not ECS)
- Handle multi-select (shift-click to add)

REFERENCES:
- Read docs/RTS-ECS-SKILL.md section "Box Selection"
- Read docs/PIXIJS-V8-REFERENCE.md for event handling
- Read docs/BITECS-REFERENCE.md for component updates

FILES TO CREATE/MODIFY:
- apps/web/src/input.ts (create main input handler)
- apps/web/src/selection.ts (selection logic)
- apps/web/src/camera.ts (camera controls)
- apps/web/src/main.ts (wire up input)

DELIVERABLES:
- Click to select individual units
- Box select multiple units
- Control groups 1-9 work
- Right-click move orders
- Visual feedback for all actions

TESTING:
- Select units and verify highlight
- Box select 10+ units
- Assign and recall control groups
- Move units with right-click
- Test shift-click to add to selection

Use ultrathink mode to design the event handling architecture.
```

---

## Prompt 5: Visual Polish & Effects

```
I'm building an RTS game called RTS Arena. The core mechanics work but need visual polish.

PROJECT CONTEXT:
- Monorepo at /home/matt/projects/RTSRoyale
- Currently using Pixi.js Graphics (circles) for units
- Need professional sprite-based rendering
- Abilities and combat need VFX

YOUR TASK:
Transform the prototype into a visually compelling experience:

1. **Unit Sprites**
   - Replace Graphics circles with actual sprites
   - Create simple sprite sheet (or use placeholders)
   - Add team colors (blue/red)
   - Smooth rotation toward movement direction

2. **Ability Effects**
   - Dash: Speed lines, afterimage trail
   - Shield: Animated bubble/glow
   - Ranged Attack: Projectile with trail
   - Use ParticleContainer for performance

3. **Combat Feedback**
   - Damage numbers float up and fade
   - Hit flash (white tint on impact)
   - Death animation (fade out, scale down)
   - Blood/explosion particles

4. **UI Improvements**
   - Health bars with smooth transitions
   - Ability cooldown indicators (circular fill)
   - Unit selection rings
   - Minimap (if time permits)

5. **Screen Effects**
   - Camera shake on big hits
   - Screen flash for Final Showdown
   - Vignette during collapse phase
   - Smooth camera follow

TECHNICAL REQUIREMENTS:
- Use Pixi.js ParticleContainer for VFX (1000+ particles)
- Implement object pooling for particles
- Sprite sheet with TexturePacker or similar
- Maintain 60 FPS with all effects active

REFERENCES:
- Read docs/PIXIJS-V8-REFERENCE.md section "Performance Tips"
- Read docs/RTS-ECS-SKILL.md section "Pixi.js Integration"

FILES TO CREATE/MODIFY:
- apps/web/src/rendering/ (create directory)
  - sprites.ts (sprite management)
  - particles.ts (particle effects)
  - ui.ts (health bars, cooldowns)
- apps/web/src/camera.ts (camera effects)
- apps/web/src/assets/ (sprite sheets)

DELIVERABLES:
- Units rendered with sprites (not circles)
- All abilities have visual effects
- Combat has satisfying feedback
- UI is clean and readable
- 60 FPS maintained with 50+ units

TESTING:
- Spawn 50 units and check FPS
- Trigger all abilities and verify effects
- Check particles don't leak (object pooling)
- Test on lower-end GPU

Use ultrathink mode to plan the rendering architecture and optimization strategy.
```

---

## Prompt 6: Performance Optimization & Profiling

```
I'm building an RTS game called RTS Arena. Need to optimize for 60 FPS with 50+ units.

PROJECT CONTEXT:
- Monorepo at /home/matt/projects/RTSRoyale
- Pixi.js v8 (WebGPU + WebGL)
- bitECS for game logic
- Target: 60 FPS with 50 units minimum

YOUR TASK:
Profile and optimize the game for maximum performance:

1. **Profiling Setup**
   - Add Chrome DevTools performance markers
   - Implement FPS counter with min/max/avg
   - Track entity counts
   - Measure system execution times
   - Memory leak detection

2. **ECS Optimizations**
   - Verify queries are cached correctly
   - Batch component updates
   - Avoid unnecessary queries
   - Use typed arrays efficiently
   - Remove dead entities promptly

3. **Rendering Optimizations**
   - Use sprite batching (same texture)
   - Implement view frustum culling
   - ParticleContainer for effects
   - Reduce draw calls
   - Object pooling for graphics

4. **General Optimizations**
   - Avoid allocations in hot paths
   - Use object pools
   - Optimize pathfinding (grid-based A*)
   - Spatial hashing for collision
   - Delta compression for network (Phase 3+)

5. **Performance Dashboard**
   - Real-time FPS graph
   - Frame time breakdown (per system)
   - Memory usage tracking
   - Entity count monitoring
   - GPU/CPU metrics

TECHNICAL REQUIREMENTS:
- Maintain 60 FPS (16.6ms frame budget)
- <16ms frame time 95th percentile
- No memory leaks over 10 minutes
- Smooth rendering (no stuttering)

REFERENCES:
- Read docs/PIXIJS-V8-REFERENCE.md section "Performance Tips"
- Read docs/BITECS-REFERENCE.md section "Best Practices"
- Read BattleRoyalePlan.md lines 367-383 for KPIs

FILES TO CREATE/MODIFY:
- apps/web/src/profiling.ts (create profiler)
- apps/web/src/performance-ui.ts (dashboard)
- apps/web/src/main.ts (add profiling)
- Optimize all systems for performance

DELIVERABLES:
- Performance dashboard showing key metrics
- 60 FPS with 50 units sustained
- <16ms frame time consistently
- No memory leaks
- Optimization report with before/after metrics

TESTING:
- Spawn 50, 100, 200 units and measure FPS
- Run for 10 minutes checking for leaks
- Profile hot paths with DevTools
- Test on low-end hardware
- Compare WebGPU vs WebGL performance

Use ultrathink mode to analyze bottlenecks and plan optimizations.
```

---

## How to Use These Prompts

1. **Install dependencies first**: Run `npm install` in the project root
2. **Open multiple Claude web sessions**: One per prompt
3. **Copy-paste entire prompt**: Include all context and requirements
4. **Enable ultrathink**: For complex planning/architecture decisions
5. **Let each session run independently**: They can work in parallel
6. **Merge results**: Integrate completed features back into main codebase

## Recommended Order

If running sequentially (not parallel):
1. Input & Selection (Prompt 4) - Makes testing easier
2. Combat System (Prompt 1) - Core gameplay
3. Abilities (Prompt 2) - Adds depth
4. Final Showdown (Prompt 3) - Signature feature
5. Visual Polish (Prompt 5) - Makes it feel good
6. Performance (Prompt 6) - Ensure it scales

If running in parallel:
- Run all 6 simultaneously in separate Claude web sessions
- They can work independently since they modify different files
- Merge results after 30-45 minutes

## Tips for Best Results

- **Include documentation**: Each prompt references the docs/ folder
- **Be specific**: Prompts include exact file paths and requirements
- **Set clear deliverables**: Each prompt has testing criteria
- **Use ultrathink**: Complex architectural decisions benefit from extended thinking
- **Iterate**: If a session gets stuck, provide specific error messages
