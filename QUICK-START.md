# ⚡ Quick Start - Get Running in 2 Minutes

## Step 1: Install Dependencies (30 seconds)

```bash
cd /home/matt/projects/RTSRoyale
npm install
```

## Step 2: Start Dev Server (10 seconds)

```bash
cd apps/web
npm run dev
```

Open: **http://localhost:3000**

You should see:
- 10 blue circles (left side)
- 10 red circles (right side)
- Timer: 2:30
- FPS: 60

✅ **Working? Great! Ready for parallel development.**

## Step 3: Launch Claude Web Sessions

### Copy-Paste Prompts from PROMPTS.md

**Quick Strategy** (45-60 minutes total):

| Session | Feature | Priority | Est. Time |
|---------|---------|----------|-----------|
| 1 | Combat System | 🔥 High | 20 min |
| 2 | Final Showdown | 🔥 High | 15 min |
| 3 | Abilities (Q/W/E) | ⭐ Medium | 25 min |
| 4 | Input & Selection | ⭐ Medium | 25 min |
| 5 | Visual Polish | ✨ Low | 30 min |
| 6 | Performance | ✨ Low | 20 min |

**Run Sessions 1-4 first** (combat + showdown + abilities + input)
**Then Sessions 5-6** (polish + performance)

### Where to Copy Prompts

1. Open **PROMPTS.md** in this directory
2. Find "Prompt 1: Combat System Implementation"
3. Copy entire prompt (from triple backticks to triple backticks)
4. Paste into new Claude web session
5. Repeat for each session

## Step 4: Monitor Progress

Each session will:
1. Read the reference docs
2. Implement the feature
3. Test it works
4. Report completion

You can check progress by refreshing `http://localhost:3000`

## What Each Session Builds

**Session 1: Combat** → Units auto-attack nearby enemies
**Session 2: Final Showdown** → Epic teleport at 2:30
**Session 3: Abilities** → Press Q/W/E to use abilities
**Session 4: Input** → Click to select, right-click to move
**Session 5: Visual** → Sprites, particles, effects
**Session 6: Performance** → 60 FPS with 50+ units

## Files Created/Modified Per Session

### Session 1 (Combat)
```
packages/core/src/systems/combat.ts          (NEW)
packages/core/src/systems/index.ts           (EDIT)
apps/web/src/main.ts                         (EDIT)
apps/web/src/test-scene.ts                   (EDIT)
```

### Session 2 (Final Showdown)
```
packages/core/src/systems/finalShowdown.ts   (NEW)
apps/web/src/effects.ts                      (NEW)
apps/web/src/main.ts                         (EDIT)
```

### Session 3 (Abilities)
```
packages/core/src/systems/abilities.ts       (NEW)
apps/web/src/input.ts                        (NEW)
apps/web/src/effects.ts                      (EDIT)
apps/web/src/main.ts                         (EDIT)
```

### Session 4 (Input & Selection)
```
apps/web/src/input.ts                        (NEW or EDIT)
apps/web/src/selection.ts                    (NEW)
apps/web/src/camera.ts                       (NEW)
apps/web/src/main.ts                         (EDIT)
```

### Session 5 (Visual Polish)
```
apps/web/src/rendering/sprites.ts            (NEW)
apps/web/src/rendering/particles.ts          (NEW)
apps/web/src/rendering/ui.ts                 (NEW)
apps/web/src/camera.ts                       (NEW or EDIT)
```

### Session 6 (Performance)
```
apps/web/src/profiling.ts                    (NEW)
apps/web/src/performance-ui.ts               (NEW)
apps/web/src/main.ts                         (EDIT)
All systems                                  (OPTIMIZE)
```

## Testing Each Feature

### Combat System
```
Expected: Units attack when close to enemies
Test: Spawn units near each other
Verify: Health bars decrease, units die
```

### Final Showdown
```
Expected: Units teleport to center at 2:30
Test: Wait for timer to hit 0:00
Verify: All units in center, auto-attacking
```

### Abilities
```
Expected: Q/W/E trigger abilities
Test: Select unit, press Q
Verify: Dash effect, cooldown starts
```

### Input & Selection
```
Expected: Click selects, right-click moves
Test: Click unit, right-click ground
Verify: Unit highlights, moves to target
```

### Visual Polish
```
Expected: Sprites instead of circles
Test: Reload page
Verify: Units are sprites, effects render
```

### Performance
```
Expected: 60 FPS with 50+ units
Test: Spawn 50 units
Verify: FPS stays at 60
```

## Troubleshooting

### Port 3000 in use?
```bash
# Kill existing process
pkill -f vite

# Or use different port
npm run dev -- --port 3001
```

### TypeScript errors?
```bash
# Rebuild
npm run build
```

### Module not found?
```bash
# Reinstall
rm -rf node_modules
npm install
```

### Pixi.js not rendering?
```
Check console for WebGPU/WebGL errors
May need to enable WebGPU in browser flags
WebGL should work as fallback
```

## Key References

- **PROMPTS.md** - All 6 template prompts
- **SETUP-COMPLETE.md** - Full setup documentation
- **README.md** - Project overview
- **docs/RTS-ECS-SKILL.md** - Implementation patterns
- **BattleRoyalePlan.md** - Original vision

## Success Checklist

After all sessions complete:

- [ ] Combat: Units fight each other ⚔️
- [ ] Final Showdown: Teleport at 2:30 🎯
- [ ] Abilities: Q/W/E working ✨
- [ ] Input: Click + box select 🖱️
- [ ] Visual: Looks polished 🎨
- [ ] Performance: 60 FPS sustained ⚡

## Next Steps After Phase 1

Once all 6 features work:

1. **Playtest** - Get 5-10 people to try it
2. **Iterate** - Fix issues based on feedback
3. **Validate** - Check Phase 1 success criteria
4. **Phase 2** - Add multi-objective system (see BattleRoyalePlan.md)

---

**Ready? Let's build! 🚀**

**Total setup time**: ~2 minutes
**Total build time**: ~45-60 minutes (parallel)
**Total to playable**: <1 hour

You've got this! 💪
