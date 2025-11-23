export interface SystemTiming {
  name: string;
  duration: number;
  calls: number;
}

export class PerformanceMonitor {
  private frameStart = 0;
  private frameTimes: number[] = [];
  private systemTimings: Map<string, SystemTiming> = new Map();
  private entityCount = 0;
  private currentFrame = 0;
  private initialMemory = 0;
  private lastMemoryCheck = 0;

  startFrame() {
    this.frameStart = performance.now();
  }

  endFrame() {
    const frameTime = performance.now() - this.frameStart;
    this.frameTimes.push(frameTime);

    // Keep last 100 frames
    if (this.frameTimes.length > 100) {
      this.frameTimes.shift();
    }

    this.currentFrame++;

    // Log slow frames
    if (frameTime > 16.6) {
      console.warn(`[PERF] Slow frame ${this.currentFrame}: ${frameTime.toFixed(2)}ms`);

      // Log which systems were slow
      for (const [name, timing] of this.systemTimings) {
        if (timing.duration > 5) {
          console.warn(`  - ${name}: ${timing.duration.toFixed(2)}ms`);
        }
      }
    }

    // Check memory usage
    this.checkMemory();
  }

  startSystem(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      let timing = this.systemTimings.get(name);
      if (!timing) {
        timing = { name, duration: 0, calls: 0 };
        this.systemTimings.set(name, timing);
      }

      timing.duration = duration;
      timing.calls++;
    };
  }

  setEntityCount(count: number) {
    this.entityCount = count;
  }

  getMetrics() {
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const minFrameTime = Math.min(...this.frameTimes);
    const maxFrameTime = Math.max(...this.frameTimes);
    const fps = 1000 / avgFrameTime;

    return {
      fps: {
        current: fps,
        min: 1000 / maxFrameTime,
        max: 1000 / minFrameTime,
        avg: fps
      },
      frameTime: {
        current: this.frameTimes[this.frameTimes.length - 1] || 0,
        min: minFrameTime,
        max: maxFrameTime,
        avg: avgFrameTime
      },
      entityCount: this.entityCount,
      systemTimings: Array.from(this.systemTimings.values()).sort((a, b) => b.duration - a.duration)
    };
  }

  resetSystemTimings() {
    for (const timing of this.systemTimings.values()) {
      timing.calls = 0;
    }
  }

  private checkMemory() {
    // @ts-ignore - performance.memory is available in Chrome/Edge
    if (performance.memory) {
      // @ts-ignore
      const currentMemory = performance.memory.usedJSHeapSize;

      if (this.initialMemory === 0) {
        this.initialMemory = currentMemory;
        this.lastMemoryCheck = currentMemory;
      }

      // Check every 10 seconds (assuming 60fps = 600 frames)
      if (this.currentFrame % 600 === 0) {
        const growth = currentMemory - this.lastMemoryCheck;
        const totalGrowth = currentMemory - this.initialMemory;

        if (growth > 5_000_000) { // 5MB growth in 10 seconds
          console.warn(`[PERF] Potential memory leak: +${(growth / 1_000_000).toFixed(2)}MB in 10s`);
        }

        console.log(`[PERF] Memory: ${(currentMemory / 1_000_000).toFixed(2)}MB (total growth: +${(totalGrowth / 1_000_000).toFixed(2)}MB)`);

        this.lastMemoryCheck = currentMemory;
      }
    }
  }
}
