// RTS Arena - Main Entry Point
import { Application } from 'pixi.js';
import { createWorld } from '@rts-arena/core';
import { movementSystem, pathfindingSystem } from '@rts-arena/core';
import { initTestScene } from './test-scene';

async function main() {
  console.log('🎮 RTS Arena - Initializing...');

  // Create Pixi.js application
  const app = new Application();
  await app.init({
    width: 1920,
    height: 1080,
    preference: 'webgpu', // Try WebGPU first, fallback to WebGL
    backgroundColor: 0x0a0a0a,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
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

  console.log(`✅ Renderer: ${app.renderer.type === 'webgpu' ? 'WebGPU' : 'WebGL'}`);

  // Create ECS world
  const world = createWorld();
  console.log('✅ ECS World created');

  // Initialize test scene (spawn some units)
  initTestScene(world, app);

  // Game loop
  let lastTime = performance.now();
  let fpsCounter = 0;
  let fpsTime = 0;

  app.ticker.add(() => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    world.deltaTime = deltaTime;
    world.time += deltaTime;

    // Run systems
    pathfindingSystem(world);
    movementSystem(world);

    // Update UI
    updateUI(world, deltaTime);

    // FPS counter
    fpsCounter++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      document.getElementById('fps')!.textContent = fpsCounter.toString();
      fpsCounter = 0;
      fpsTime = 0;
    }
  });

  console.log('✅ Game loop started');
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

  document.getElementById('phase')!.textContent = phase;

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

// Start the game
main().catch((error) => {
  console.error('Failed to initialize game:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: #ff4444;">
      <h1>Failed to initialize game</h1>
      <pre>${error.message}</pre>
    </div>
  `;
});
