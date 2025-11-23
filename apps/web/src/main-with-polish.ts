// RTS Arena - Main Entry Point with Visual Polish
import { Application } from 'pixi.js';
import { createWorld } from '@rts-arena/core';
import {
  movementSystem,
  pathfindingSystem,
  combatSystem,
  selectionSystem,
  finalShowdownSystem,
  initShowdownTimer,
  getShowdownPhase,
  GameTimer,
  ShowdownState
} from '@rts-arena/core';
import { defineQuery } from 'bitecs';
import { initTestScene } from './test-scene';
import { InputManager } from './input-manager';
import { SelectionRenderer } from './selection-renderer';
import { ShowdownEffects } from './showdown-effects';
import { VisualPolishIntegration } from './visual-polish-integration';

async function main() {
  console.log('🎮 RTS Arena - Initializing with Visual Polish...');

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

  // Initialize Final Showdown timer
  initShowdownTimer(world);
  console.log('✅ Final Showdown timer initialized');

  // Initialize input and selection systems
  const inputManager = new InputManager(app, world);
  const selectionRenderer = new SelectionRenderer(app, world);
  console.log('✅ Input and selection systems initialized');

  // Initialize showdown visual effects
  const showdownEffects = new ShowdownEffects(app, world);
  console.log('✅ Showdown effects initialized');

  // Initialize Visual Polish Integration
  const visualPolish = new VisualPolishIntegration(app, world);
  console.log('✨ Visual Polish systems integrated');

  // Add test hotkey for visual effects demo
  window.addEventListener('keydown', (event) => {
    if (event.key === 'T' || event.key === 't') {
      console.log('Testing visual effects...');
      visualPolish.testEffects();
    }
  });

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
    finalShowdownSystem(world);  // Run showdown system first to handle phase transitions
    pathfindingSystem(world);
    movementSystem(world);
    combatSystem(world);  // Run combat after movement

    // Update selection visuals
    selectionRenderer.update();

    // Update showdown visual effects
    showdownEffects.update(deltaTime);

    // Update visual polish systems
    visualPolish.update(world, deltaTime);

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
  console.log('💡 Press T to test visual effects');
}

function updateUI(world: any, deltaTime: number) {
  // Get timer entity to read actual game time
  const timerQuery = defineQuery([GameTimer, ShowdownState]);
  const timerEntities = timerQuery(world);
  let gameTime = 0;

  if (timerEntities.length > 0) {
    const timerEntity = timerEntities[0];
    gameTime = GameTimer.totalTime[timerEntity];
  }

  // Update timer display
  const timeRemaining = Math.max(0, 150 - gameTime); // 2:30 match
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  document.getElementById('timer')!.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Get actual showdown phase
  const currentPhase = getShowdownPhase(world);
  const phaseNames = ['normal', 'warning', 'collapse', 'showdown', 'ended'];
  const phaseName = phaseNames[currentPhase];

  document.getElementById('phase')!.textContent = phaseName;

  // Phase warnings are now handled by ShowdownEffects and Visual Polish
  const warning = document.getElementById('phase-warning')!;
  if (warning.style.display === 'block' && currentPhase >= 3) {
    // Hide warning after showdown starts
    setTimeout(() => {
      warning.style.display = 'none';
    }, 3000);
  }
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