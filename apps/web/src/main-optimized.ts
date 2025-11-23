// RTS Arena - Optimized Main Entry Point with Performance Monitoring
import { Application } from 'pixi.js';
import { createWorld } from '@rts-arena/core';
import { movementSystemOptimized, pathfindingSystemOptimized } from '@rts-arena/core';
import { OptimizedTestScene } from './test-scene-optimized';
import { profiler } from './profiling/profiler';
import { dashboard } from './profiling/performance-dashboard';
import { pools } from './optimization/object-pools';
import { spatialHash } from './optimization/spatial-hash';

// Make profiler globally accessible for debugging
(window as any).profiler = profiler;
(window as any).pools = pools;
(window as any).spatialHash = spatialHash;

async function main() {
  console.log('🎮 RTS Arena - Optimized Version Initializing...');
  console.log('⚡ Performance optimizations enabled');

  // Create Pixi.js application with performance settings
  const app = new Application();
  await app.init({
    width: 1920,
    height: 1080,
    preference: 'webgpu', // Try WebGPU first, fallback to WebGL
    backgroundColor: 0x0a0a0a,
    antialias: false, // Disable for better performance
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    powerPreference: 'high-performance', // Request high-performance GPU
    hello: true // Show renderer info
  });

  // Add canvas to DOM
  const container = document.getElementById('game-container');
  if (!container) throw new Error('Game container not found');
  container.appendChild(app.canvas);

  // Resize canvas to fill container
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    app.renderer.resize(width, height);
  }
  resize();
  window.addEventListener('resize', resize);

  console.log(`✅ Renderer: ${app.renderer.type === 'webgpu' ? '⚡ WebGPU' : '🎨 WebGL'}`);

  // Log renderer capabilities
  const gl = (app.renderer as any).gl;
  if (gl) {
    console.log('📊 WebGL Capabilities:');
    console.log('  Max Texture Size:', gl.getParameter(gl.MAX_TEXTURE_SIZE));
    console.log('  Max Vertex Attributes:', gl.getParameter(gl.MAX_VERTEX_ATTRIBS));
    console.log('  Max Texture Units:', gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
  }

  // Create ECS world with optimizations
  const world = createWorld();
  console.log('✅ ECS World created');

  // Initialize optimized test scene
  const testScene = new OptimizedTestScene(world, app);
  console.log('✅ Optimized test scene initialized');

  // Performance monitoring setup
  let frameCount = 0;
  let lastFpsUpdate = 0;
  let instantFps = 0;

  // Initialize with some units for testing
  testScene.spawnUnits(50);

  // Optimized game loop
  let lastTime = performance.now();

  app.ticker.add(() => {
    // Frame timing
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Skip frames if too much time has passed (tab switching, etc)
    if (deltaTime > 0.1) {
      return;
    }

    // Start profiling frame
    profiler.beginFrame();

    // Update world time
    world.deltaTime = deltaTime;
    world.time += deltaTime;

    // Run ECS systems with profiling
    profiler.beginSystem('pathfinding');
    pathfindingSystemOptimized(world);
    profiler.endSystem('pathfinding');

    profiler.beginSystem('movement');
    movementSystemOptimized(world);
    profiler.endSystem('movement');

    // Update test scene (includes rendering)
    testScene.update();

    // Update UI
    profiler.beginSystem('ui-update');
    updateUI(world, deltaTime);
    profiler.endSystem('ui-update');

    // End frame profiling
    const entityCount = parseInt(document.getElementById('entity-count')?.textContent || '0');
    profiler.endFrame(deltaTime, entityCount);

    // Update FPS counter (optimized to update less frequently)
    frameCount++;
    if (currentTime - lastFpsUpdate >= 250) { // Update 4 times per second
      instantFps = (frameCount * 1000) / (currentTime - lastFpsUpdate);
      document.getElementById('fps')!.textContent = Math.round(instantFps).toString();
      frameCount = 0;
      lastFpsUpdate = currentTime;
    }
  });

  // Set up garbage collection monitoring (if available)
  if ((performance as any).memory) {
    setInterval(() => {
      const memory = (performance as any).memory;
      const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(1);
      const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(1);

      // Check for potential memory leaks
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        console.warn('⚠️ Memory usage approaching limit:', usedMB, 'MB /', totalMB, 'MB');
      }
    }, 10000); // Check every 10 seconds
  }

  console.log('✅ Optimized game loop started');
  console.log('📊 Press F3 or ~ to toggle performance dashboard');
  console.log('🧪 Press T to run performance tests');
  console.log('📋 Press P to print performance report');

  // Log initial performance baseline
  setTimeout(() => {
    console.log('📈 Initial Performance Baseline:');
    const metrics = profiler.getMetrics();
    console.log(`  FPS: ${metrics.fps.current.toFixed(1)}`);
    console.log(`  Frame Time: ${metrics.frameTime.current.toFixed(2)}ms`);
    console.log(`  Entities: ${entityCount}`);
  }, 2000);
}

function updateUI(world: any, deltaTime: number) {
  // Update timer
  const timeRemaining = Math.max(0, 150 - world.time); // 2:30 match
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  document.getElementById('timer')!.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Update phase
  let phase = 'normal';
  if (world.time >= 150) phase = 'showdown';
  else if (world.time >= 145) phase = 'collapse';
  else if (world.time >= 120) phase = 'warning';

  const phaseElement = document.getElementById('phase')!;
  if (phaseElement.textContent !== phase) {
    phaseElement.textContent = phase;

    // Show phase warnings
    const warning = document.getElementById('phase-warning')!;
    if (phase === 'warning' && world.phase !== 'warning') {
      warning.textContent = 'ARENA COLLAPSE IN 30 SECONDS';
      warning.style.display = 'block';
      setTimeout(() => (warning.style.display = 'none'), 3000);
    } else if (phase === 'collapse' && world.phase !== 'collapse') {
      warning.textContent = 'PREPARE FOR FINAL SHOWDOWN';
      warning.style.display = 'block';
    } else if (phase === 'showdown' && world.phase !== 'showdown') {
      warning.textContent = 'FINAL SHOWDOWN!';
      warning.style.display = 'block';
    }

    world.phase = phase;
  }
}

// Error handling
window.addEventListener('error', (e) => {
  console.error('❌ Runtime error:', e.error);

  // Log performance state at time of error
  const metrics = profiler.getMetrics();
  console.error('Performance state at error:');
  console.error('  FPS:', metrics.fps.current.toFixed(1));
  console.error('  Frame Time:', metrics.frameTime.current.toFixed(2), 'ms');
  console.error('  Memory:', metrics.memory.heapUsed.toFixed(1), 'MB');
});

// Performance monitoring on visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('🔴 Tab hidden - pausing performance monitoring');
  } else {
    console.log('🟢 Tab visible - resuming performance monitoring');
    profiler.reset(); // Reset metrics after tab switch
  }
});

// Start the optimized game
main().catch((error) => {
  console.error('Failed to initialize game:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: #ff4444;">
      <h1>Failed to initialize game</h1>
      <pre>${error.message}</pre>
      <p>Check console for performance diagnostics.</p>
    </div>
  `;
});