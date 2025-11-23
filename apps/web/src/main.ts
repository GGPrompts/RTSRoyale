// RTS Arena - Main Entry Point
import { Application } from 'pixi.js';
import { createWorld, defineQuery } from '@rts-arena/core';
import {
  movementSystem,
  pathfindingSystem,
  combatSystem,
  cleanupSystem,
  dashSystem,
  shieldSystem,
  rangedAttackSystem,
  finalShowdownSystem,
  getTimeRemaining,
  getCurrentPhase,
  getPhaseWarning,
  getPhaseColor,
  formatTime,
  GamePhase,
  FinalShowdownWorld
} from '@rts-arena/core';
import { Position } from '@rts-arena/core';
import { initTestScene } from './test-scene';
import { PerformanceMonitor } from './profiling/performanceMonitor';
import { PerformanceDashboard } from './ui/performanceDashboard';
import { ShowdownEffectsRenderer } from './effects/showdownEffects';
import { SelectionManager } from './input/selectionManager';
import { MouseInputHandler } from './input/mouseInput';
import { SelectionRenderer } from './rendering/selectionBox';
import { AbilityInputHandler } from './input/abilityInput';

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
  const world = createWorld() as FinalShowdownWorld;
  // Initialize time tracking for Final Showdown
  world.time = {
    delta: 0,
    elapsed: 0
  };
  console.log('✅ ECS World created');

  // Create performance monitor and dashboard
  const perfMonitor = new PerformanceMonitor();
  const perfDashboard = new PerformanceDashboard(perfMonitor);

  // Create showdown effects renderer
  const showdownEffects = new ShowdownEffectsRenderer();
  app.stage.addChild(showdownEffects.getContainer());

  // Toggle performance dashboard with F3 key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F3') {
      perfDashboard.toggle();
      e.preventDefault();
    }
  });

  // Create query for entity counting
  const allEntitiesQuery = defineQuery([Position]);

  // Initialize test scene (spawn some units)
  initTestScene(world, app);

  // Initialize input and selection systems
  const selectionManager = new SelectionManager(world);
  const mouseInputHandler = new MouseInputHandler(app, selectionManager);
  const selectionRenderer = new SelectionRenderer();
  const abilityInputHandler = new AbilityInputHandler(world);

  // Add selection renderer to stage
  app.stage.addChild(selectionRenderer.getContainer());

  // Connect selection manager to ability handler
  selectionManager.setMoveTargetCallback((x, y) => {
    selectionRenderer.showMoveTarget(x, y);
  });

  console.log('✅ Input and selection systems initialized');

  // Game loop
  let lastTime = performance.now();
  let fpsCounter = 0;
  let fpsTime = 0;

  app.ticker.add(() => {
    perfMonitor.startFrame();

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update world time for Final Showdown system
    world.time.delta = deltaTime;
    world.time.elapsed += deltaTime;

    // Count entities
    const allEntities = allEntitiesQuery(world);
    perfMonitor.setEntityCount(allEntities.length);

    // Run systems with performance timing
    let endTiming = perfMonitor.startSystem('pathfinding');
    pathfindingSystem(world);
    endTiming();

    endTiming = perfMonitor.startSystem('movement');
    movementSystem(world);
    endTiming();

    endTiming = perfMonitor.startSystem('combat');
    combatSystem(world);
    endTiming();

    endTiming = perfMonitor.startSystem('abilities');
    dashSystem(world);
    shieldSystem(world);
    rangedAttackSystem(world);
    endTiming();

    endTiming = perfMonitor.startSystem('finalShowdown');
    finalShowdownSystem(world);
    endTiming();

    endTiming = perfMonitor.startSystem('cleanup');
    cleanupSystem(world);
    endTiming();

    endTiming = perfMonitor.startSystem('effects');
    // Update visual effects for Final Showdown
    showdownEffects.update(world, deltaTime);
    // Update selection visuals
    selectionRenderer.updateDragBox(mouseInputHandler.getDragBox());
    selectionRenderer.updateSelectionHighlights(world);
    // Update ability input with current selection
    abilityInputHandler.updateSelection(selectionManager.getSelectedEntities());
    endTiming();

    endTiming = perfMonitor.startSystem('ui');
    // Update UI
    updateUI(world, deltaTime);
    endTiming();

    // FPS counter
    fpsCounter++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      document.getElementById('fps')!.textContent = fpsCounter.toString();
      fpsCounter = 0;
      fpsTime = 0;
    }

    perfMonitor.endFrame();
  });

  console.log('✅ Game loop started');
}

function updateUI(world: FinalShowdownWorld, deltaTime: number) {
  // Update timer with formatted time
  const timeRemaining = getTimeRemaining(world);
  const timerElement = document.getElementById('timer')!;
  timerElement.textContent = formatTime(timeRemaining);

  // Color the timer based on phase
  const phaseColor = getPhaseColor(world);
  timerElement.style.color = phaseColor;

  // Add pulsing effect during final seconds
  if (timeRemaining <= 5 && timeRemaining > 0) {
    timerElement.style.fontSize = `${24 + Math.sin(Date.now() * 0.01) * 4}px`;
  } else {
    timerElement.style.fontSize = '24px';
  }

  // Update phase display
  const phase = getCurrentPhase(world);
  document.getElementById('phase')!.textContent = phase;

  // Show phase warnings with styling
  const warningElement = document.getElementById('phase-warning')!;
  const warningText = getPhaseWarning(world);

  if (warningText) {
    warningElement.textContent = warningText;
    warningElement.style.color = phaseColor;
    warningElement.style.display = 'block';

    // Style based on phase
    if (phase === GamePhase.COLLAPSE) {
      // Pulsing effect during collapse
      warningElement.style.fontSize = `${48 + Math.sin(Date.now() * 0.008) * 8}px`;
      warningElement.style.textShadow = `0 0 ${20 + Math.sin(Date.now() * 0.008) * 10}px ${phaseColor}`;
    } else if (phase === GamePhase.SHOWDOWN) {
      // Intense effect during showdown
      warningElement.style.fontSize = '64px';
      warningElement.style.textShadow = `0 0 30px ${phaseColor}`;
    } else if (phase === GamePhase.VICTORY) {
      // Victory effect
      warningElement.style.fontSize = '72px';
      warningElement.style.textShadow = '0 0 40px #ffd700';
    } else {
      warningElement.style.fontSize = '48px';
      warningElement.style.textShadow = `0 0 20px ${phaseColor}`;
    }
  } else {
    warningElement.style.display = 'none';
  }

  // Update entity count if element exists
  const entityCountElement = document.getElementById('entity-count');
  if (entityCountElement) {
    const allEntities = defineQuery([Position])(world);
    entityCountElement.textContent = allEntities.length.toString();
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
