// RTS Arena - Main Entry Point with Input Controls
import { Application, Container } from 'pixi.js';
import { createWorld } from '@rts-arena/core';
import { movementSystem, pathfindingSystem, combatSystem, finalShowdownSystem } from '@rts-arena/core';
import { initTestScene } from './test-scene';
import { initHealthBars, updateHealthBars, initDamageNumbers, updateDamageNumbers } from './rendering';
import { initScreenEffects, updatePhaseEffects, showWarningMessage } from './effects';

// Input systems
import { MouseInput } from './input/mouse';
import { KeyboardInput } from './input/keyboard';
import { SelectionManager } from './selection/selection';
import { BoxSelect } from './selection/box-select';
import { Camera } from './camera';
import { SelectionIndicators } from './rendering/selection-indicators';

async function main() {
  console.log('🎮 RTS Arena - Initializing with Input Controls...');

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

  // Create viewport container for camera
  const viewport = new Container();
  app.stage.addChild(viewport);

  // Initialize test scene (spawn some units)
  initTestScene(world, app, viewport);

  // Initialize rendering systems
  initHealthBars(app);
  initDamageNumbers(app);

  // Initialize screen effects for Final Showdown
  initScreenEffects(app);

  // Initialize input systems
  const camera = new Camera(app, viewport);
  const selectionManager = new SelectionManager(world, app);
  const boxSelect = new BoxSelect(app);
  const mouseInput = new MouseInput(app, world, selectionManager, boxSelect);
  const keyboardInput = new KeyboardInput(world, selectionManager, camera);
  const selectionIndicators = new SelectionIndicators(app, world);

  console.log('✅ Input systems initialized');
  console.log('');
  console.log('📝 RTS CONTROLS:');
  console.log('  SELECTION:');
  console.log('    • Left-click: Select single unit');
  console.log('    • Shift + Left-click: Add to selection');
  console.log('    • Click + Drag: Box select multiple units');
  console.log('    • Shift + Box select: Add to selection');
  console.log('');
  console.log('  CONTROL GROUPS:');
  console.log('    • Ctrl + 1-9: Assign selection to group');
  console.log('    • 1-9: Recall control group');
  console.log('    • Double-tap 1-9: Jump camera to group');
  console.log('');
  console.log('  ORDERS:');
  console.log('    • Right-click ground: Move units');
  console.log('    • Right-click enemy: Attack move');
  console.log('');
  console.log('  CAMERA:');
  console.log('    • WASD/Arrow keys: Pan camera');
  console.log('    • Mouse wheel: Zoom in/out');
  console.log('    • Middle-click drag: Pan camera');
  console.log('    • Edge scrolling: Move mouse to edge');
  console.log('');
  console.log('  DEBUG (existing):');
  console.log('    • 0: Normal speed');
  console.log('    • 1-4: Speed up time (10x, 25x, 50x, 100x)');
  console.log('    • 5: Jump to next phase');
  console.log('    • R: Reset game');

  // Center camera on the arena
  camera.centerOn(960, 540, true); // Center of 1920x1080

  // Game loop
  let lastTime = performance.now();
  let fpsCounter = 0;
  let fpsTime = 0;
  let mouseX = 0;
  let mouseY = 0;

  // Track mouse position for edge scrolling
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Time control for testing (preserve existing functionality)
  let timeMultiplier = 1.0;
  window.addEventListener('keydown', (e) => {
    // Prevent control group keys from affecting time control
    if (!e.ctrlKey && e.key >= '1' && e.key <= '9') {
      // Control group recall - handled by KeyboardInput
      return;
    }

    if (e.key === '0') timeMultiplier = 1.0;
    else if (!e.ctrlKey && e.key === '1') timeMultiplier = 10.0;  // 10x speed
    else if (!e.ctrlKey && e.key === '2') timeMultiplier = 25.0;  // 25x speed
    else if (!e.ctrlKey && e.key === '3') timeMultiplier = 50.0;  // 50x speed
    else if (!e.ctrlKey && e.key === '4') timeMultiplier = 100.0; // 100x speed
    else if (e.key === '5') {
      // Jump to specific phase for testing
      if (world.time < 119) world.time = 119;      // Jump to warning
      else if (world.time < 134) world.time = 134;  // Jump to glow
      else if (world.time < 139) world.time = 139;  // Jump to countdown
      else if (world.time < 144) world.time = 144;  // Jump to prepare
      else if (world.time < 149) world.time = 149;  // Jump to showdown
    }
    else if (e.key === 'r' || e.key === 'R') {
      // Reset game
      world.time = 0;
      location.reload();
    }

    if (e.key >= '0' && e.key <= '4' && !e.ctrlKey) {
      console.log(`⏱️ Time multiplier set to ${timeMultiplier}x`);
    }
  });

  app.ticker.add(() => {
    const currentTime = performance.now();
    const rawDeltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Apply time multiplier for testing
    const deltaTime = rawDeltaTime * timeMultiplier;

    world.deltaTime = deltaTime;
    world.time += deltaTime;

    // Update camera
    camera.update(mouseX, mouseY);

    // Update selection manager
    selectionManager.update();

    // Run systems
    finalShowdownSystem(world); // Check phase transitions first
    pathfindingSystem(world);
    movementSystem(world);
    combatSystem(world); // Combat after movement

    // Update rendering
    updateHealthBars(world);
    updateDamageNumbers(world, deltaTime);

    // Clear event arrays after processing
    if (world.deadEntities) {
      world.deadEntities = [];
    }

    // Update UI with selection info
    updateUI(world, deltaTime, app, selectionManager);

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

function updateUI(world: any, deltaTime: number, app: Application, selectionManager?: SelectionManager) {
  // Update timer
  const timeRemaining = Math.max(0, 150 - world.time); // 2:30 match
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  document.getElementById('timer')!.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Get phase from finalShowdownSystem
  const phase = world.gamePhase || 'normal';
  document.getElementById('phase')!.textContent = phase;

  // Apply screen effects based on phase
  updatePhaseEffects(app, phase, timeRemaining);

  // Handle phase messages from finalShowdownSystem
  if (world.phaseMessage && world.phaseMessage !== world.lastPhaseMessage) {
    const duration = world.phaseMessageDuration || 3000;
    showWarningMessage(app, world.phaseMessage, duration);
    world.lastPhaseMessage = world.phaseMessage;
  }

  // Clear phase message after displaying
  if (world.phaseMessageDuration > 0) {
    world.phaseMessage = '';
  }

  // Update selection count if selection manager is available
  if (selectionManager) {
    const selectionCount = selectionManager.getSelectionCount();
    const entityCountElem = document.getElementById('entity-count');
    if (entityCountElem) {
      entityCountElem.textContent = `Selected: ${selectionCount}`;
    }
  }

  // Check for victory
  if (world.gameOver) {
    const winnerText = world.winner === 0 ? 'BLUE TEAM WINS!' :
                       world.winner === 1 ? 'RED TEAM WINS!' :
                       'DRAW!';
    const warning = document.getElementById('phase-warning')!;
    warning.textContent = winnerText;
    warning.style.display = 'block';
    warning.style.fontSize = '72px';
    warning.style.color = world.winner === 0 ? '#4444ff' : '#ff4444';
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