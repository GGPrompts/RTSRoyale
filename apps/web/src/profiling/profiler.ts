// RTS Arena - Performance Profiler
import { GameWorld } from '@rts-arena/core';

export interface FrameMetrics {
  fps: number;
  frameTime: number;
  deltaTime: number;
  entityCount: number;
  timestamp: number;
}

export interface SystemMetrics {
  name: string;
  time: number;
  calls: number;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  timestamp: number;
}

export class Profiler {
  private frameMetrics: FrameMetrics[] = [];
  private systemMetrics: Map<string, SystemMetrics> = new Map();
  private memoryMetrics: MemoryMetrics[] = [];

  // FPS tracking
  private frameCount = 0;
  private fpsAccumulator = 0;
  private minFps = Infinity;
  private maxFps = 0;
  private avgFps = 0;
  private lastFpsUpdate = 0;

  // Frame time tracking
  private frameTimeAccumulator = 0;
  private minFrameTime = Infinity;
  private maxFrameTime = 0;
  private avgFrameTime = 0;
  private frameTimeBuffer: number[] = [];

  // Performance marks
  private marks = new Map<string, number>();

  // Configuration
  private readonly maxMetricsHistory = 600; // 10 seconds at 60 FPS
  private readonly fpsUpdateInterval = 1000; // Update FPS every second
  private readonly frameTimeBufferSize = 60; // 1 second rolling average

  // Warnings
  private frameTimeWarnings = 0;
  private consecutiveSlowFrames = 0;

  constructor() {
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  // Frame tracking
  public beginFrame(): void {
    performance.mark('frame-start');
  }

  public endFrame(deltaTime: number, entityCount: number): void {
    performance.mark('frame-end');
    const measure = performance.measure('frame', 'frame-start', 'frame-end');
    const frameTime = measure.duration;

    // Update frame time buffer for rolling average
    this.frameTimeBuffer.push(frameTime);
    if (this.frameTimeBuffer.length > this.frameTimeBufferSize) {
      this.frameTimeBuffer.shift();
    }

    // Track frame metrics
    this.frameCount++;
    this.frameTimeAccumulator += frameTime;
    this.minFrameTime = Math.min(this.minFrameTime, frameTime);
    this.maxFrameTime = Math.max(this.maxFrameTime, frameTime);

    // Calculate rolling average frame time
    const avgFrameTime = this.frameTimeBuffer.reduce((a, b) => a + b, 0) / this.frameTimeBuffer.length;
    this.avgFrameTime = avgFrameTime;

    // Track FPS
    const instantFps = 1000 / frameTime;
    this.fpsAccumulator += instantFps;
    this.minFps = Math.min(this.minFps, instantFps);
    this.maxFps = Math.max(this.maxFps, instantFps);

    // Check for performance warnings
    if (frameTime > 16.67) { // Slower than 60 FPS
      this.frameTimeWarnings++;
      this.consecutiveSlowFrames++;

      if (this.consecutiveSlowFrames > 10) {
        console.warn(`⚠️ Performance Warning: ${this.consecutiveSlowFrames} consecutive slow frames (>${Math.round(frameTime)}ms)`);
      }
    } else {
      this.consecutiveSlowFrames = 0;
    }

    // Store metrics
    const metrics: FrameMetrics = {
      fps: instantFps,
      frameTime,
      deltaTime,
      entityCount,
      timestamp: performance.now()
    };

    this.frameMetrics.push(metrics);
    if (this.frameMetrics.length > this.maxMetricsHistory) {
      this.frameMetrics.shift();
    }

    // Update FPS display every second
    const now = performance.now();
    if (now - this.lastFpsUpdate > this.fpsUpdateInterval) {
      this.avgFps = this.fpsAccumulator / this.frameCount;
      this.lastFpsUpdate = now;

      // Reset accumulators
      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }

    // Clean up performance entries
    performance.clearMarks('frame-start');
    performance.clearMarks('frame-end');
    performance.clearMeasures('frame');
  }

  // System profiling
  public beginSystem(name: string): void {
    performance.mark(`${name}-start`);
  }

  public endSystem(name: string): void {
    performance.mark(`${name}-end`);
    const measure = performance.measure(name, `${name}-start`, `${name}-end`);

    // Update system metrics
    if (!this.systemMetrics.has(name)) {
      this.systemMetrics.set(name, {
        name,
        time: 0,
        calls: 0
      });
    }

    const metrics = this.systemMetrics.get(name)!;
    metrics.time = measure.duration;
    metrics.calls++;

    // Clean up
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }

  // Memory monitoring
  private startMemoryMonitoring(): void {
    // Check memory every 5 seconds
    setInterval(() => {
      if (performance.memory) {
        const memory: MemoryMetrics = {
          heapUsed: (performance as any).memory.usedJSHeapSize / 1048576, // Convert to MB
          heapTotal: (performance as any).memory.totalJSHeapSize / 1048576,
          external: (performance as any).memory.jsHeapSizeLimit / 1048576,
          timestamp: performance.now()
        };

        this.memoryMetrics.push(memory);
        if (this.memoryMetrics.length > 120) { // Keep 10 minutes of data
          this.memoryMetrics.shift();
        }

        // Check for memory leaks
        if (this.memoryMetrics.length > 10) {
          const oldMemory = this.memoryMetrics[0].heapUsed;
          const newMemory = memory.heapUsed;
          const growth = newMemory - oldMemory;

          if (growth > 50) { // More than 50MB growth
            console.warn(`⚠️ Possible memory leak detected: ${growth.toFixed(2)}MB growth over ${((memory.timestamp - this.memoryMetrics[0].timestamp) / 60000).toFixed(1)} minutes`);
          }
        }
      }
    }, 5000);
  }

  // Custom marks for specific operations
  public mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  public measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(startMark);
    return duration;
  }

  // Get current metrics
  public getMetrics() {
    return {
      fps: {
        current: this.avgFps,
        min: this.minFps === Infinity ? 0 : this.minFps,
        max: this.maxFps,
        avg: this.avgFps
      },
      frameTime: {
        current: this.avgFrameTime,
        min: this.minFrameTime === Infinity ? 0 : this.minFrameTime,
        max: this.maxFrameTime,
        avg: this.avgFrameTime,
        warnings: this.frameTimeWarnings
      },
      systems: Array.from(this.systemMetrics.values()),
      memory: this.memoryMetrics[this.memoryMetrics.length - 1] || {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        timestamp: 0
      },
      history: {
        frames: this.frameMetrics,
        memory: this.memoryMetrics
      }
    };
  }

  // Calculate 95th percentile frame time
  public get95thPercentileFrameTime(): number {
    if (this.frameMetrics.length === 0) return 0;

    const frameTimes = this.frameMetrics.map(m => m.frameTime).sort((a, b) => a - b);
    const index = Math.floor(frameTimes.length * 0.95);
    return frameTimes[index];
  }

  // Reset metrics
  public reset(): void {
    this.frameMetrics = [];
    this.systemMetrics.clear();
    this.frameCount = 0;
    this.fpsAccumulator = 0;
    this.minFps = Infinity;
    this.maxFps = 0;
    this.avgFps = 0;
    this.frameTimeAccumulator = 0;
    this.minFrameTime = Infinity;
    this.maxFrameTime = 0;
    this.avgFrameTime = 0;
    this.frameTimeBuffer = [];
    this.frameTimeWarnings = 0;
    this.consecutiveSlowFrames = 0;
    this.marks.clear();
  }

  // Export metrics for analysis
  public exportMetrics(): string {
    const metrics = this.getMetrics();
    const p95 = this.get95thPercentileFrameTime();

    return JSON.stringify({
      summary: {
        fps: metrics.fps,
        frameTime: metrics.frameTime,
        p95FrameTime: p95,
        systems: metrics.systems,
        memory: metrics.memory
      },
      history: metrics.history
    }, null, 2);
  }
}

// Global profiler instance
export const profiler = new Profiler();