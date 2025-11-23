// RTS Arena - COMPLETE INTEGRATED BUILD
// Combines: Combat + Final Showdown + Abilities + Input + Visual Polish + Performance
import { Application, Container } from 'pixi.js';
import { createWorld } from '@rts-arena/core';
import {
  movementSystem,
  pathfindingSystem,
  combatSystem,
  finalShowdownSystem,
  abilitySystem,
  projectileSystem,
} from '@rts-arena/core';

// Rendering systems
import { initHealthBars, updateHealthBars } from './rendering/healthbars';
import { initDamageNumbers, updateDamageNumbers } from './rendering/damage-numbers';
import { initSprites, updateSprites, cleanupDeadSprites } from './rendering/sprites';
import { initParticles, updateParticles } from './rendering/particles';
import { initSelectionIndicators, updateSelectionIndicators } from './rendering/selection-indicators';

// Effects
import { initScreenEffects, updatePhaseEffects, showWarningMessage } from './effects';
import { initAbilityEffects, renderAbilityEffects } from './ability-effects';

// Input & Selection
import { MouseHandler } from './input/mouse';
import { KeyboardHandler } from './input/keyboard';
import { SelectionManager } from './selection/selection';
import { BoxSelectRenderer } from './selection/box-select';

// Camera
import { CameraController } from './camera';

// UI
import { initAbilitiesUI, updateAbilitiesUI } from './ui/abilities-ui';

// Performance monitoring
import { Profiler } from './profiling/profiler';
import { PerformanceDashboard } from './profiling/performance-dashboard';

// Test scene
import { initTestScene } from './test-scene-enhanced';

async function main() {
  console.log('🎮 RTS Arena - COMPLETE BUILD - Initializing...');

  // Create Pixi.js application
  const app = new Application();
  await app.init({
    width: 1920,
    height: 1080,
    preference: 'webgpu',
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

  // Create viewport container for camera
  const viewport = new Container();
  app.stage.addChild(viewport);

  // Create ECS world
  const world = createWorld();
  console.log('✅ ECS World created');

  // Initialize performance profiler
  const profiler = new Profiler();
  const perfDashboard = new PerformanceDashboard(app);
  profiler.start();

  // Initialize camera
  const camera = new CameraController(viewport, {
    worldWidth: 1920,
    worldHeight: 1080,
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
  });

  // Initialize test scene (spawn units)
  initTestScene(world, viewport);
  console.log('✅ Test scene initialized');

  // Initialize input systems
  const mouseHandler = new MouseHandler(app.canvas as HTMLCanvasElement, world, camera);
  const keyboardHandler = new KeyboardHandler();
  const selectionManager = new SelectionManager(world);
  const boxSelectRenderer = new BoxSelectRenderer(viewport);

  // Wire up input systems
  mouseHandler.onLeftClick = (worldX, worldY, isShiftHeld) => {
    const unit = mouseHandler['getUnitAtPosition'](worldX, worldY);
    if (unit !== null) {
      selectionManager.selectUnits([unit], isShiftHeld);
    } else {
      if (!isShiftHeld) selectionManager.clearSelection();
    }
  };

  mouseHandler.onRightClick = (worldX, worldY) => {
    selectionManager.issueMoveOrder(worldX, worldY);
  };

  mouseHandler.onBoxSelect = (minX, minY, maxX, maxY, isShiftHeld) => {
    const units = mouseHandler['getUnitsInBox'](minX, minY, maxX, maxY);
    selectionManager.selectUnits(units, isShiftHeld);
  };

  mouseHandler.onDragStart = (startX, startY) => {
    boxSelectRenderer.startBoxSelection(startX, startY);
  };

  mouseHandler.onDragUpdate = (startX, startY, currentX, currentY) => {
    boxSelectRenderer.updateBoxSelection(startX, startY, currentX, currentY);
  };

  mouseHandler.onDragEnd = () => {
    boxSelectRenderer.endBoxSelection();
  };

  // Connect keyboard to selection for control groups
  keyboardHandler.onControlGroupAssign = (groupNumber) => {
    selectionManager.assignControlGroup(groupNumber);
  };

  keyboardHandler.onControlGroupRecall = (groupNumber) => {
    selectionManager.recallControlGroup(groupNumber);
  };

  keyboardHandler.onCameraPan = (dx, dy) => {
    camera.pan(dx, dy);
  };

  // Initialize rendering systems
  initSprites(viewport);
  initParticles(viewport);
  initHealthBars(viewport);
  initDamageNumbers(viewport);
  initSelectionIndicators(viewport);
  initScreenEffects(app);
  initAbilityEffects(viewport);
  initAbilitiesUI(app);

  console.log('✅ All systems initialized');

  // Game loop
  let lastTime = performance.now();
  let fpsCounter = 0;
  let fpsTime = 0;

  // Time control for testing Final Showdown (press 0-5, R)
  let timeMultiplier = 1.0;
  window.addEventListener('keydown', (e) => {
    if (e.key === '0') timeMultiplier = 1.0;
    else if (e.key === '1') timeMultiplier = 10.0;
    else if (e.key === '2') timeMultiplier = 25.0;
    else if (e.key === '3') timeMultiplier = 50.0;
    else if (e.key === '4') timeMultiplier = 100.0;
    else if (e.key === '5') {
      // Jump to next phase
      if (world.time < 119) world.time = 119;
      else if (world.time < 134) world.time = 134;
      else if (world.time < 139) world.time = 139;
      else if (world.time < 144) world.time = 144;
      else if (world.time < 149) world.time = 149;
    } else if (e.key === 'r' || e.key === 'R') {
      location.reload();
    } else if (e.key === 'F3' || e.key === '`') {
      perfDashboard.toggle();
    }

    if (e.key >= '0' && e.key <= '4') {
      console.log(`⏱️ Time multiplier: ${timeMultiplier}x`);
    }
  });

  // Main game loop
  app.ticker.add(() => {
    const currentTime = performance.now();
    const rawDelta = (currentTime - lastTime) / 1000;
    const deltaTime = Math.min(rawDelta, 0.1); // Cap at 100ms
    lastTime = currentTime;

    // Update FPS counter
    fpsCounter++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      const fps = fpsCounter / fpsTime;
      const fpsElement = document.getElementById('fps');
      if (fpsElement) {
        fpsElement.textContent = `${Math.round(fps)} FPS`;
        fpsElement.style.color = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffaa00' : '#ff0000';
      }
      fpsCounter = 0;
      fpsTime = 0;
    }

    // Update game time
    world.time = (world.time || 0) + deltaTime * timeMultiplier;

    // Update timer display
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      const remaining = Math.max(0, 150 - world.time);
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // === PROFILER MARKS ===
    profiler.mark('frame-start');

    // Update input
    profiler.mark('input-start');
    keyboardHandler.update(deltaTime);
    mouseHandler.update(deltaTime);
    profiler.measure('input', 'input-start');

    // Camera updates
    profiler.mark('camera-start');
    camera.updateEdgeScrolling(mouseHandler['mouseScreenX'], mouseHandler['mouseScreenY']);
    camera.update(deltaTime);
    profiler.measure('camera', 'camera-start');

    // === ECS SYSTEMS ===
    profiler.mark('ecs-start');

    // Get ability input
    const abilityInput = {
      qPressed: keyboardHandler['keys'].has('q') || keyboardHandler['keys'].has('Q'),
      wPressed: keyboardHandler['keys'].has('w') || keyboardHandler['keys'].has('W'),
      ePressed: keyboardHandler['keys'].has('e') || keyboardHandler['keys'].has('E'),
      mouseWorldX: camera.screenToWorldX(mouseHandler['mouseScreenX']),
      mouseWorldY: camera.screenToWorldY(mouseHandler['mouseScreenY']),
    };

    profiler.mark('systems-start');
    pathfindingSystem(world);
    movementSystem(world);
    abilitySystem(world, abilityInput);
    projectileSystem(world);
    combatSystem(world);
    finalShowdownSystem(world, deltaTime);
    profiler.measure('systems', 'systems-start');
    profiler.measure('ecs', 'ecs-start');

    // === RENDERING ===
    profiler.mark('render-start');

    updateSprites(world, deltaTime);
    cleanupDeadSprites(world);
    updateParticles(world, deltaTime);
    updateHealthBars(world);
    updateDamageNumbers(world, deltaTime);
    updateSelectionIndicators(world, deltaTime);
    renderAbilityEffects(world, viewport);
    updatePhaseEffects(world);
    updateAbilitiesUI(world);

    profiler.measure('render', 'render-start');

    // Update performance dashboard
    profiler.mark('profiler-update');
    const frameTime = performance.now() - currentTime;
    profiler.recordFrame(frameTime);
    perfDashboard.update(profiler.getStats());
    profiler.measure('profiler', 'profiler-update');

    profiler.measure('frame-total', 'frame-start');
  });

  console.log('🎮 RTS Arena - READY TO PLAY!');
  console.log('');
  console.log('CONTROLS:');
  console.log('  Left-click: Select unit');
  console.log('  Shift + Left-click: Add to selection');
  console.log('  Drag: Box select');
  console.log('  Right-click: Move units');
  console.log('  Ctrl + 1-9: Assign control group');
  console.log('  1-9: Recall control group');
  console.log('  Q/W/E: Abilities (Dash/Shield/Ranged)');
  console.log('  WASD or Arrows: Pan camera');
  console.log('  Mouse wheel: Zoom');
  console.log('');
  console.log('DEBUG:');
  console.log('  0-4: Time speed (1x to 100x)');
  console.log('  5: Jump to next Final Showdown phase');
  console.log('  R: Restart');
  console.log('  F3 or `: Toggle performance dashboard');
}

main().catch(console.error);
