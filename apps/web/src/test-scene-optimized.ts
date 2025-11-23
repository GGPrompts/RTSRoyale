// RTS Arena - Optimized Test Scene with Performance Testing
import { Application } from 'pixi.js';
import { addEntity, removeEntity } from 'bitecs';
import { Position, Velocity, Health, Team, Sprite, Target, Selected } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';
import { OptimizedRenderer } from './rendering/optimized-renderer';
import { spatialHash } from './optimization/spatial-hash';
import { pools } from './optimization/object-pools';

export class OptimizedTestScene {
  private world: GameWorld;
  private app: Application;
  private renderer: OptimizedRenderer;
  private entities: Set<number> = new Set();

  // Performance testing
  private testMode = false;
  private unitCounts = [10, 25, 50, 100, 200, 500];
  private currentTestIndex = 0;

  constructor(world: GameWorld, app: Application) {
    this.world = world;
    this.app = app;
    this.renderer = new OptimizedRenderer(app, world);

    // Set up keyboard controls
    this.setupControls();
  }

  private setupControls(): void {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case '1':
          this.spawnUnits(10);
          break;
        case '2':
          this.spawnUnits(25);
          break;
        case '3':
          this.spawnUnits(50);
          break;
        case '4':
          this.spawnUnits(100);
          break;
        case '5':
          this.spawnUnits(200);
          break;
        case '6':
          this.spawnUnits(500);
          break;
        case 'c':
        case 'C':
          this.clearAllUnits();
          break;
        case 't':
        case 'T':
          this.runPerformanceTest();
          break;
        case 'r':
        case 'R':
          this.spawnRandomMovingUnits(50);
          break;
        case 's':
        case 'S':
          this.makeUnitsStationary();
          break;
        case 'm':
        case 'M':
          this.makeUnitsMove();
          break;
        case 'p':
        case 'P':
          console.log('📊 Performance Report:');
          this.logPerformanceReport();
          break;
      }
    });

    // Display controls
    this.displayControls();
  }

  private displayControls(): void {
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'test-controls';
    controlsDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      max-width: 300px;
      border: 1px solid #333;
    `;

    controlsDiv.innerHTML = `
      <div style="color: #0f9; margin-bottom: 10px; font-weight: bold;">⚡ Performance Test Controls</div>
      <div style="line-height: 1.6;">
        <div><kbd>1-6</kbd> - Spawn 10/25/50/100/200/500 units</div>
        <div><kbd>C</kbd> - Clear all units</div>
        <div><kbd>R</kbd> - Spawn 50 randomly moving units</div>
        <div><kbd>S</kbd> - Make units stationary</div>
        <div><kbd>M</kbd> - Make units move</div>
        <div><kbd>T</kbd> - Run full performance test</div>
        <div><kbd>P</kbd> - Print performance report</div>
        <div><kbd>F3/~</kbd> - Toggle performance dashboard</div>
      </div>
    `;

    document.body.appendChild(controlsDiv);
  }

  public spawnUnits(count: number): void {
    console.log(`🎮 Spawning ${count} units...`);

    // Clear existing units first
    this.clearAllUnits();

    const startTime = performance.now();

    // Calculate grid layout
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const spacing = 50;
    const startX = (this.app.renderer.width - (cols - 1) * spacing) / 2;
    const startY = (this.app.renderer.height - (rows - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const eid = addEntity(this.world);
      this.entities.add(eid);

      // Position in grid
      const col = i % cols;
      const row = Math.floor(i / cols);

      Position.x[eid] = startX + col * spacing;
      Position.y[eid] = startY + row * spacing;

      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      Health.current[eid] = 100;
      Health.max[eid] = 100;

      // Alternate teams
      Team.id[eid] = i % 2;

      Sprite.textureId[eid] = Team.id[eid];
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = 0;

      // Add to spatial hash
      spatialHash.insert({
        id: eid,
        x: Position.x[eid],
        y: Position.y[eid],
        radius: 20
      });
    }

    const spawnTime = performance.now() - startTime;

    // Update UI
    document.getElementById('entity-count')!.textContent = count.toString();

    console.log(`✅ Spawned ${count} units in ${spawnTime.toFixed(2)}ms`);
  }

  public spawnRandomMovingUnits(count: number): void {
    console.log(`🎮 Spawning ${count} randomly moving units...`);

    this.clearAllUnits();

    for (let i = 0; i < count; i++) {
      const eid = addEntity(this.world);
      this.entities.add(eid);

      // Random position
      Position.x[eid] = Math.random() * this.app.renderer.width;
      Position.y[eid] = Math.random() * this.app.renderer.height;

      // Random velocity
      const speed = 50 + Math.random() * 100; // 50-150 units/s
      const angle = Math.random() * Math.PI * 2;
      Velocity.x[eid] = Math.cos(angle) * speed;
      Velocity.y[eid] = Math.sin(angle) * speed;

      // Random target
      Target.x[eid] = Math.random() * this.app.renderer.width;
      Target.y[eid] = Math.random() * this.app.renderer.height;
      Target.reached[eid] = 0;

      Health.current[eid] = 100;
      Health.max[eid] = 100;

      Team.id[eid] = i % 2;

      Sprite.textureId[eid] = Team.id[eid];
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = 0;

      // Add to spatial hash
      spatialHash.insert({
        id: eid,
        x: Position.x[eid],
        y: Position.y[eid],
        radius: 20
      });
    }

    document.getElementById('entity-count')!.textContent = count.toString();
    console.log(`✅ Spawned ${count} moving units`);
  }

  public clearAllUnits(): void {
    console.log('🧹 Clearing all units...');

    this.entities.forEach(eid => {
      this.renderer.removeEntity(eid);
      removeEntity(this.world, eid);
    });

    this.entities.clear();
    spatialHash.clear();

    document.getElementById('entity-count')!.textContent = '0';
    console.log('✅ All units cleared');
  }

  public makeUnitsStationary(): void {
    this.entities.forEach(eid => {
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      Target.reached[eid] = 1;
    });
    console.log('⏸️ Units made stationary');
  }

  public makeUnitsMove(): void {
    this.entities.forEach(eid => {
      // Random velocity
      const speed = 50 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      Velocity.x[eid] = Math.cos(angle) * speed;
      Velocity.y[eid] = Math.sin(angle) * speed;

      // New random target
      Target.x[eid] = Math.random() * this.app.renderer.width;
      Target.y[eid] = Math.random() * this.app.renderer.height;
      Target.reached[eid] = 0;
    });
    console.log('▶️ Units set in motion');
  }

  public async runPerformanceTest(): Promise<void> {
    console.log('🧪 Starting performance test suite...');

    const results: any[] = [];

    for (const count of this.unitCounts) {
      console.log(`\n📊 Testing with ${count} units...`);

      // Spawn units
      this.spawnUnits(count);

      // Let it stabilize for 1 second
      await this.wait(1000);

      // Make units move for dynamic test
      this.makeUnitsMove();

      // Collect metrics for 5 seconds
      const metrics = await this.collectMetrics(5000);

      results.push({
        unitCount: count,
        ...metrics
      });

      // Clear for next test
      this.clearAllUnits();
      await this.wait(500);
    }

    // Generate report
    this.generatePerformanceReport(results);
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async collectMetrics(duration: number): Promise<any> {
    const startTime = performance.now();
    const samples: any[] = [];

    while (performance.now() - startTime < duration) {
      await this.wait(100); // Sample every 100ms

      const metrics = (window as any).profiler?.getMetrics();
      if (metrics) {
        samples.push({
          fps: metrics.fps.current,
          frameTime: metrics.frameTime.current,
          memory: metrics.memory.heapUsed
        });
      }
    }

    // Calculate averages
    const avgFps = samples.reduce((sum, s) => sum + s.fps, 0) / samples.length;
    const avgFrameTime = samples.reduce((sum, s) => sum + s.frameTime, 0) / samples.length;
    const avgMemory = samples.reduce((sum, s) => sum + s.memory, 0) / samples.length;

    // Calculate 95th percentile
    const frameTimes = samples.map(s => s.frameTime).sort((a, b) => a - b);
    const p95Index = Math.floor(frameTimes.length * 0.95);
    const p95FrameTime = frameTimes[p95Index];

    return {
      avgFps: avgFps.toFixed(1),
      minFps: Math.min(...samples.map(s => s.fps)).toFixed(1),
      maxFps: Math.max(...samples.map(s => s.fps)).toFixed(1),
      avgFrameTime: avgFrameTime.toFixed(2),
      p95FrameTime: p95FrameTime.toFixed(2),
      avgMemory: avgMemory.toFixed(1),
      samples: samples.length
    };
  }

  private generatePerformanceReport(results: any[]): void {
    console.group('📊 PERFORMANCE TEST REPORT');
    console.log('=' .repeat(60));

    console.table(results.map(r => ({
      'Units': r.unitCount,
      'Avg FPS': r.avgFps,
      'Min FPS': r.minFps,
      'Frame Time (ms)': r.avgFrameTime,
      '95% Frame (ms)': r.p95FrameTime,
      'Memory (MB)': r.avgMemory
    })));

    // Performance goals check
    console.log('\n🎯 Performance Goals:');

    results.forEach(r => {
      const meets60fps = parseFloat(r.avgFps) >= 58;
      const meetsFrameTime = parseFloat(r.p95FrameTime) <= 16.67;

      console.log(`${r.unitCount} units: ${
        meets60fps && meetsFrameTime ? '✅ PASS' : '❌ FAIL'
      } (${r.avgFps} FPS, ${r.p95FrameTime}ms 95th percentile)`);
    });

    // Find max units at 60 FPS
    const maxUnitsAt60 = results
      .filter(r => parseFloat(r.avgFps) >= 58)
      .map(r => r.unitCount)
      .reduce((max, n) => Math.max(max, n), 0);

    console.log(`\n🏆 Maximum units at 60 FPS: ${maxUnitsAt60}`);

    // Pool statistics
    console.log('\n🏊 Object Pool Usage:');
    pools.logStats();

    // Spatial hash statistics
    console.log('\n#️⃣ Spatial Hash Stats:');
    console.table(spatialHash.getStats());

    console.log('=' .repeat(60));
    console.groupEnd();

    // Save to window for export
    (window as any).performanceReport = results;
    console.log('💾 Report saved to window.performanceReport');
  }

  private logPerformanceReport(): void {
    const profiler = (window as any).profiler;
    if (!profiler) {
      console.error('Profiler not initialized');
      return;
    }

    const metrics = profiler.getMetrics();
    const p95 = profiler.get95thPercentileFrameTime();

    console.group('📊 Current Performance Metrics');

    console.log('FPS:', {
      current: metrics.fps.current.toFixed(1),
      min: metrics.fps.min.toFixed(1),
      max: metrics.fps.max.toFixed(1),
      avg: metrics.fps.avg.toFixed(1)
    });

    console.log('Frame Time (ms):', {
      current: metrics.frameTime.current.toFixed(2),
      min: metrics.frameTime.min.toFixed(2),
      max: metrics.frameTime.max.toFixed(2),
      avg: metrics.frameTime.avg.toFixed(2),
      '95th percentile': p95.toFixed(2),
      warnings: metrics.frameTime.warnings
    });

    console.log('Systems (ms):', metrics.systems);

    console.log('Memory (MB):', {
      used: metrics.memory.heapUsed.toFixed(1),
      total: metrics.memory.heapTotal.toFixed(1)
    });

    console.log('Entities:', document.getElementById('entity-count')?.textContent || '0');

    console.log('Renderer:', this.renderer.getStats());

    console.log('Spatial Hash:', spatialHash.getStats());

    console.log('Object Pools:', pools.getStats());

    console.groupEnd();
  }

  public update(): void {
    // Update renderer
    this.renderer.render();

    // Batch update spatial hash positions after movement
    const movedEntities = Array.from(this.entities).filter(eid =>
      Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0
    );

    if (movedEntities.length > 0) {
      this.renderer.batchUpdatePositions(movedEntities);
    }
  }

  public cleanup(): void {
    this.clearAllUnits();
    this.renderer.cleanup();
  }
}