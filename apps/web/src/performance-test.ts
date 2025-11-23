// Performance testing and optimization utilities for RTS Arena
import { Application } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { addEntity } from 'bitecs';
import {
  Position,
  Velocity,
  Health,
  Team,
  Sprite,
  Damage,
  Target,
} from '@rts-arena/core';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  minFps: number;
  maxFps: number;
  avgFps: number;
  entityCount: number;
  particleCount: number;
  drawCalls: number;
  memoryUsage?: number;
  gcCount: number;
  droppedFrames: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameHistory: number[] = [];
  private maxHistorySize = 120; // 2 seconds at 60fps
  private lastGCCount = 0;
  private startTime = 0;
  private frameCount = 0;

  constructor() {
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      minFps: 60,
      maxFps: 60,
      avgFps: 60,
      entityCount: 0,
      particleCount: 0,
      drawCalls: 0,
      gcCount: 0,
      droppedFrames: 0,
    };

    this.startTime = performance.now();

    // Monitor memory if available
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memoryUsage = (performance.memory as any).usedJSHeapSize / 1048576; // MB
      }, 1000);
    }
  }

  update(deltaTime: number, entityCount: number, particleCount: number, drawCalls: number = 0) {
    this.frameCount++;

    const fps = 1 / deltaTime;
    this.frameHistory.push(fps);

    if (this.frameHistory.length > this.maxHistorySize) {
      this.frameHistory.shift();
    }

    // Calculate metrics
    this.metrics.fps = Math.round(fps);
    this.metrics.frameTime = deltaTime * 1000;
    this.metrics.entityCount = entityCount;
    this.metrics.particleCount = particleCount;
    this.metrics.drawCalls = drawCalls;

    // Track dropped frames (below 55 fps)
    if (fps < 55) {
      this.metrics.droppedFrames++;
    }

    // Calculate min/max/avg
    if (this.frameHistory.length > 0) {
      this.metrics.minFps = Math.round(Math.min(...this.frameHistory));
      this.metrics.maxFps = Math.round(Math.max(...this.frameHistory));
      this.metrics.avgFps = Math.round(
        this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length
      );
    }

    // Detect GC pauses (frame time spike > 50ms)
    if (deltaTime > 0.05) {
      this.metrics.gcCount++;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getReport(): string {
    const runtime = (performance.now() - this.startTime) / 1000;
    const droppedPercent = (this.metrics.droppedFrames / this.frameCount) * 100;

    return `
Performance Report (${runtime.toFixed(1)}s runtime)
================================================
FPS:        ${this.metrics.fps} (min: ${this.metrics.minFps}, max: ${this.metrics.maxFps}, avg: ${this.metrics.avgFps})
Frame Time: ${this.metrics.frameTime.toFixed(2)}ms
Entities:   ${this.metrics.entityCount}
Particles:  ${this.metrics.particleCount}
Draw Calls: ${this.metrics.drawCalls}
Memory:     ${this.metrics.memoryUsage?.toFixed(2) || 'N/A'} MB
GC Pauses:  ${this.metrics.gcCount}
Dropped:    ${this.metrics.droppedFrames} frames (${droppedPercent.toFixed(1)}%)

Performance Grade: ${this.getPerformanceGrade()}
    `.trim();
  }

  private getPerformanceGrade(): string {
    if (this.metrics.avgFps >= 58 && this.metrics.minFps >= 50) return '✅ EXCELLENT';
    if (this.metrics.avgFps >= 50 && this.metrics.minFps >= 40) return '🟡 GOOD';
    if (this.metrics.avgFps >= 30 && this.metrics.minFps >= 25) return '🟠 ACCEPTABLE';
    return '🔴 POOR';
  }
}

// Performance stress test scenarios
export class PerformanceTest {
  private world: GameWorld;
  private monitor: PerformanceMonitor;

  constructor(world: GameWorld, monitor: PerformanceMonitor) {
    this.world = world;
    this.monitor = monitor;
  }

  // Test 1: Spawn waves of units
  async spawnWaveTest(waveSize: number = 10, waveCount: number = 5, delayMs: number = 1000) {
    console.log(`🔥 Starting spawn wave test: ${waveCount} waves of ${waveSize} units`);

    for (let wave = 0; wave < waveCount; wave++) {
      await this.spawnUnits(waveSize, wave);
      await this.delay(delayMs);
      console.log(`Wave ${wave + 1}/${waveCount} spawned. FPS: ${this.monitor.getMetrics().fps}`);
    }

    console.log('✅ Spawn wave test complete');
    console.log(this.monitor.getReport());
  }

  // Test 2: Combat stress test (all units fight)
  async combatStressTest(unitCount: number = 100) {
    console.log(`⚔️ Starting combat stress test with ${unitCount} units`);

    // Spawn units in a tight formation for maximum combat
    const gridSize = Math.ceil(Math.sqrt(unitCount / 2));

    // Team 0 on left
    for (let i = 0; i < unitCount / 2; i++) {
      const eid = addEntity(this.world);
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      Position.x[eid] = 400 + col * 30;
      Position.y[eid] = 300 + row * 30;
      Velocity.x[eid] = 50;
      Velocity.y[eid] = 0;
      Health.current[eid] = 100;
      Health.max[eid] = 100;
      Team.id[eid] = 0;
      Damage.amount[eid] = 25;
      Damage.range[eid] = 50;
      Damage.attackSpeed[eid] = 2.0;
      Damage.cooldown[eid] = 0;
      Sprite.textureId[eid] = 0;
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
    }

    // Team 1 on right
    for (let i = 0; i < unitCount / 2; i++) {
      const eid = addEntity(this.world);
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      Position.x[eid] = 1520 - col * 30;
      Position.y[eid] = 300 + row * 30;
      Velocity.x[eid] = -50;
      Velocity.y[eid] = 0;
      Health.current[eid] = 100;
      Health.max[eid] = 100;
      Team.id[eid] = 1;
      Damage.amount[eid] = 25;
      Damage.range[eid] = 50;
      Damage.attackSpeed[eid] = 2.0;
      Damage.cooldown[eid] = 0;
      Sprite.textureId[eid] = 1;
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
    }

    this.world.entityCount = (this.world.entityCount || 0) + unitCount;

    console.log('Units spawned, combat will commence in 2 seconds...');
    await this.delay(2000);

    // Move units toward each other
    for (let i = 0; i < unitCount; i++) {
      if (Team.id[i] === 0) {
        Target.x[i] = 960;
        Target.y[i] = 540;
      } else {
        Target.x[i] = 960;
        Target.y[i] = 540;
      }
      Target.reached[i] = 0;
    }

    // Monitor for 10 seconds
    const testDuration = 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < testDuration) {
      await this.delay(100);
      const metrics = this.monitor.getMetrics();
      if (metrics.fps < 30) {
        console.warn(`⚠️ FPS dropped below 30: ${metrics.fps}`);
      }
    }

    console.log('✅ Combat stress test complete');
    console.log(this.monitor.getReport());
  }

  // Test 3: Particle storm (max particles)
  async particleStormTest(emissionRate: number = 100, duration: number = 5000) {
    console.log(`💥 Starting particle storm test: ${emissionRate} particles/sec for ${duration}ms`);

    const startTime = Date.now();
    const emissionInterval = 1000 / emissionRate;
    let lastEmission = 0;

    while (Date.now() - startTime < duration) {
      const now = Date.now();
      if (now - lastEmission >= emissionInterval) {
        // Trigger particle emission (this would call your particle system)
        // For testing, we'll just track the attempt
        lastEmission = now;
      }
      await this.delay(16); // ~60fps update
    }

    console.log('✅ Particle storm test complete');
    console.log(this.monitor.getReport());
  }

  // Test 4: Rapid movement test
  async movementStressTest(unitCount: number = 150) {
    console.log(`🏃 Starting movement stress test with ${unitCount} units`);

    // Spawn units with random positions and velocities
    for (let i = 0; i < unitCount; i++) {
      const eid = addEntity(this.world);

      Position.x[eid] = Math.random() * 1920;
      Position.y[eid] = Math.random() * 1080;
      Velocity.x[eid] = (Math.random() - 0.5) * 300;
      Velocity.y[eid] = (Math.random() - 0.5) * 300;
      Health.current[eid] = 100;
      Health.max[eid] = 100;
      Team.id[eid] = Math.floor(Math.random() * 2);
      Sprite.textureId[eid] = Team.id[eid];
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = Math.random() * Math.PI * 2;

      // Random targets
      Target.x[eid] = Math.random() * 1920;
      Target.y[eid] = Math.random() * 1080;
      Target.reached[eid] = 0;
    }

    this.world.entityCount = (this.world.entityCount || 0) + unitCount;

    // Monitor for 10 seconds
    console.log('Monitoring movement performance for 10 seconds...');
    await this.delay(10000);

    console.log('✅ Movement stress test complete');
    console.log(this.monitor.getReport());
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting comprehensive performance test suite');
    console.log('================================================');

    await this.spawnWaveTest(20, 3, 1000);
    await this.delay(2000);

    await this.movementStressTest(100);
    await this.delay(2000);

    await this.combatStressTest(80);
    await this.delay(2000);

    await this.particleStormTest(50, 3000);

    console.log('================================================');
    console.log('📊 FINAL PERFORMANCE REPORT');
    console.log(this.monitor.getReport());

    // Performance recommendations
    this.generateRecommendations();
  }

  private generateRecommendations() {
    const metrics = this.monitor.getMetrics();
    const recommendations: string[] = [];

    if (metrics.avgFps < 55) {
      recommendations.push('• Consider reducing particle emission rates');
      recommendations.push('• Enable object pooling for all visual elements');
      recommendations.push('• Reduce unit count or implement LOD system');
    }

    if (metrics.gcCount > 10) {
      recommendations.push('• Excessive garbage collection detected');
      recommendations.push('• Review object creation/destruction patterns');
      recommendations.push('• Increase object pool sizes');
    }

    if (metrics.drawCalls > 100) {
      recommendations.push('• High draw call count detected');
      recommendations.push('• Batch sprites with same textures');
      recommendations.push('• Use sprite sheets and texture atlases');
    }

    if ((metrics.memoryUsage || 0) > 200) {
      recommendations.push('• High memory usage detected');
      recommendations.push('• Review texture sizes and formats');
      recommendations.push('• Implement texture compression');
    }

    if (recommendations.length > 0) {
      console.log('\n📝 PERFORMANCE RECOMMENDATIONS:');
      recommendations.forEach(rec => console.log(rec));
    } else {
      console.log('\n✅ Performance is optimal! No recommendations.');
    }
  }

  private async spawnUnits(count: number, wave: number) {
    for (let i = 0; i < count; i++) {
      const eid = addEntity(this.world);

      const angle = (Math.PI * 2 * i) / count + wave * 0.5;
      const radius = 200 + wave * 50;

      Position.x[eid] = 960 + Math.cos(angle) * radius;
      Position.y[eid] = 540 + Math.sin(angle) * radius;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      Health.current[eid] = 100;
      Health.max[eid] = 100;
      Team.id[eid] = wave % 2;
      Sprite.textureId[eid] = Team.id[eid];
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
    }

    this.world.entityCount = (this.world.entityCount || 0) + count;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Optimization utilities
export class RenderOptimizer {
  static cullOffscreenSprites(sprites: any[], camera: any): any[] {
    const bounds = camera.getVisibleBounds();
    return sprites.filter((sprite: any) => {
      return (
        sprite.x >= bounds.minX - 100 &&
        sprite.x <= bounds.maxX + 100 &&
        sprite.y >= bounds.minY - 100 &&
        sprite.y <= bounds.maxY + 100
      );
    });
  }

  static batchByTexture(sprites: any[]): Map<number, any[]> {
    const batches = new Map<number, any[]>();
    sprites.forEach((sprite: any) => {
      const textureId = sprite.textureId || 0;
      if (!batches.has(textureId)) {
        batches.set(textureId, []);
      }
      batches.get(textureId)!.push(sprite);
    });
    return batches;
  }

  static throttleParticles(emissionRate: number, currentFPS: number): number {
    if (currentFPS >= 55) return emissionRate;
    if (currentFPS >= 45) return emissionRate * 0.75;
    if (currentFPS >= 30) return emissionRate * 0.5;
    return emissionRate * 0.25;
  }
}