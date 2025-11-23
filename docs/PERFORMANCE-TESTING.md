# Performance Testing Guide

## Overview

This document describes how to test and verify the performance monitoring system for RTS Arena.

## Performance Targets

### Minimum Requirements (MUST MEET)
- **60 FPS** with 50 units
- **Frame time < 16.6ms** average
- **No memory leaks** (< 5MB growth per 10 seconds)
- **All system timings < 5ms**

### Stretch Goals
- **60 FPS** with 100 units
- **Frame time < 10ms** average
- **All system timings < 3ms**

## How to Test

### 1. Start the Development Server

```bash
cd /home/user/RTSRoyale/apps/web
pnpm run dev
```

Open your browser to the local development URL (usually http://localhost:5173)

### 2. Enable Performance Dashboard

Press **F3** to toggle the performance dashboard. You should see:
- FPS graph showing last 100 frames
- Current/min/max FPS
- Current/average frame time
- Entity count
- System timing breakdown

### 3. Test with 50 Units (Minimum Requirement)

The game starts with 50 units by default (25 per team).

**Expected Results:**
- ✅ FPS should be > 58 (green)
- ✅ Frame time should be < 16.6ms
- ✅ All systems should be < 5ms

**If Performance is Poor:**
1. Check which system is taking the most time
2. Review the optimization guide at `/apps/web/src/profiling/README.md`
3. Look for:
   - Unoptimized queries
   - Allocations in hot loops
   - Missing spatial partitioning

### 4. Test with 100 Units (Stretch Goal)

Press **U** key to spawn 20 more units (10 per team). Repeat until you have 100+ units.

**Expected Results:**
- 🎯 FPS should ideally stay > 55
- 🎯 Frame time should be < 18ms
- ⚠️ Some performance degradation is acceptable

**Monitor for:**
- Slow frames (console warnings)
- System timings exceeding 5ms
- Memory growth

### 5. Memory Leak Test (10 Minutes)

Let the game run for 10 minutes and monitor console output.

**Expected Results:**
- Memory growth < 50MB total over 10 minutes
- No repeated "Potential memory leak" warnings
- Stable performance throughout

**Check console for:**
```
[PERF] Memory: 150.42MB (total growth: +12.34MB)
```

**Warning signs:**
```
[PERF] Potential memory leak: +8.42MB in 10s
```

If you see memory leak warnings, investigate:
1. Event listeners not being removed
2. Sprites not being destroyed
3. Query results being stored
4. Closures capturing large objects

## Performance Dashboard Reference

### FPS Indicator Colors
- 🟢 **Green** (> 58 FPS): Good performance
- 🟡 **Yellow** (55-58 FPS): Warning zone
- 🔴 **Red** (< 55 FPS): Performance issue

### Frame Time Colors
- 🟢 **Green** (< 16.6ms): Target met
- 🔴 **Red** (> 16.6ms): Missing 60 FPS target

### System Timing Colors
- 🟢 **Green** (< 2ms): Excellent
- 🟡 **Yellow** (2-5ms): Acceptable
- 🔴 **Red** (> 5ms): Bottleneck

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **F3** | Toggle performance dashboard |
| **U** | Spawn 20 more units (10 per team) |

## Troubleshooting

### Issue: FPS < 60 with 50 units

**Diagnosis Steps:**
1. Press F3 to open performance dashboard
2. Identify which system is taking the most time
3. Look at console for "Slow frame" warnings

**Common Causes:**
- **pathfinding > 5ms**: Too many pathfinding calculations
  - Solution: Cache paths, use cheaper heuristics
- **combat > 5ms**: Too many collision checks
  - Solution: Implement spatial partitioning
- **rendering > 5ms**: Too many draw calls
  - Solution: Enable sprite batching, implement culling
- **ui > 5ms**: Too many UI updates
  - Solution: Only update when values change

### Issue: Memory keeps growing

**Diagnosis Steps:**
1. Watch console for memory warnings
2. Check Chrome DevTools Memory tab
3. Take heap snapshots before/after spawning units

**Common Causes:**
- Event listeners not removed
- Sprites not destroyed when entities die
- Storing references to dead entities
- Closures in loops

**Solutions:**
- Always clean up event listeners
- Call `sprite.destroy()` when entity dies
- Don't store query results
- Avoid closures in hot loops

### Issue: Inconsistent frame times

**Symptoms:**
- FPS graph shows spikes
- Some frames take 30-40ms

**Common Causes:**
- Garbage collection pauses
- Too many allocations per frame
- Heavy operations on main thread
- Browser tab not focused

**Solutions:**
- Reduce allocations in game loop
- Use object pooling
- Defer heavy operations
- Test in focused tab

## Chrome DevTools Performance Analysis

For deep performance analysis:

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click **Record** (red circle)
4. Play game for 10-30 seconds
5. Click **Stop**

**Look for:**
- **Long tasks** (yellow/red bars) - should be < 16.6ms
- **Scripting time** vs **Rendering time** ratio
- **Memory allocation** patterns
- **Layout thrashing** (frequent style recalculations)

## Continuous Monitoring

### During Development

Always keep the performance dashboard open (F3) when:
- Adding new systems
- Implementing new features
- Changing core algorithms
- Optimizing performance

### Before Committing

Run the full performance test suite:
1. ✅ 50 units at 60 FPS
2. ✅ 100 units at 55+ FPS (stretch)
3. ✅ 10-minute stability test
4. ✅ No memory leaks
5. ✅ All systems < 5ms

## Automated Performance Testing (Future)

### Planned Features
- Automated FPS benchmarks
- Performance regression detection
- CI/CD integration
- Performance budgets

### Example Test
```typescript
describe('Performance', () => {
  it('should maintain 60 FPS with 50 units', async () => {
    const metrics = await runPerformanceTest({
      units: 50,
      duration: 60, // seconds
    });

    expect(metrics.avgFPS).toBeGreaterThan(58);
    expect(metrics.maxFrameTime).toBeLessThan(20);
  });
});
```

## Performance Regression Prevention

### Before Merging PRs

1. Run performance tests locally
2. Check performance dashboard
3. Compare FPS before/after changes
4. Document any performance impacts

### Red Flags
- ❌ FPS drops below 55 with 50 units
- ❌ Any system > 5ms consistently
- ❌ Memory growth > 5MB per 10 seconds
- ❌ Frame time variance > 10ms

## Optimization Workflow

When you find a performance issue:

1. **Measure**: Use performance dashboard to identify bottleneck
2. **Analyze**: Use Chrome DevTools to understand why
3. **Optimize**: Apply optimizations from README.md
4. **Verify**: Re-test to confirm improvement
5. **Document**: Note what worked in commit message

## Contact

If you need help with performance issues:
- Check `/apps/web/src/profiling/README.md` for optimization tips
- Look at Chrome DevTools Performance tab
- Review bitECS best practices
- Ask for help in team chat

## Appendix: Performance Metrics Glossary

- **FPS**: Frames per second (target: 60)
- **Frame Time**: Time to render one frame in milliseconds (target: < 16.6ms)
- **System Timing**: Time spent in each ECS system per frame
- **Entity Count**: Total number of active entities
- **Memory Growth**: Change in heap size over time
- **Slow Frame**: Any frame that takes > 16.6ms to render
