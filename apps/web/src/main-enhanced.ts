// RTS Arena - Enhanced Main Entry Point with Visual Polish
import { Application, Container } from 'pixi.js';
import { createWorld } from '@rts-arena/core';
import {
  movementSystem,
  pathfindingSystem,
  combatSystem,
  finalShowdownSystem,
  abilitySystem,
  projectileSystem,
  renderSystem,
  RenderContext,
} from '@rts-arena/core';
import { Camera } from './camera';
import { preloadTextures, TextureAssets } from './assets/textures';
import { SpriteSystem } from './rendering/sprites';
import { ParticleSystem } from './rendering/particles';
import { AbilityEffects } from './effects/ability-effects';
import { UISystem } from './rendering/ui';
import { ScreenEffects } from './effects/screen-effects';
import { initTestScene } from './test-scene-enhanced';

// Global mouse position tracking for camera edge scrolling
declare global {
  interface Window {
    mouseX: number;
    mouseY: number;
  }
}

async function main() {
  console.log('🎮 RTS Arena Enhanced - Initializing...');

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

  // Create world container for camera manipulation
  const worldContainer = new Container();
  worldContainer.sortableChildren = true;
  app.stage.addChild(worldContainer);

  // Layer containers for proper z-ordering
  const groundLayer = new Container();
  groundLayer.zIndex = 0;
  const unitsLayer = new Container();
  unitsLayer.zIndex = 1;
  const effectsLayer = new Container();
  effectsLayer.zIndex = 2;
  const uiLayer = new Container();
  uiLayer.zIndex = 3;

  worldContainer.addChild(groundLayer);
  worldContainer.addChild(unitsLayer);
  worldContainer.addChild(effectsLayer);
  worldContainer.addChild(uiLayer);

  // Preload all textures
  console.log('📦 Loading assets...');
  const textures = await preloadTextures(app.renderer);

  // Create ECS world
  const world = createWorld();
  world.time = 0;
  world.deltaTime = 0;
  world.lastPhase = 'normal';
  console.log('✅ ECS World created');

  // Initialize visual systems
  const spriteSystem = new SpriteSystem(unitsLayer, textures);
  const particleSystem = new ParticleSystem(effectsLayer, textures);
  const abilityEffects = new AbilityEffects(effectsLayer, textures, particleSystem);
  const uiSystem = new UISystem(uiLayer, textures);
  const screenEffects = new ScreenEffects(app);
  const camera = new Camera(app, worldContainer);

  console.log('✅ Visual systems initialized');

  // Create render context
  const renderContext: RenderContext = {
    spriteSystem,
    particleSystem,
    abilityEffects,
    uiSystem,
    screenEffects,
    camera,
    deltaTime: 0,
  };

  // Track mouse position for camera
  window.addEventListener('mousemove', (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
  });

  // Initialize test scene with enhanced visuals
  await initTestScene(world, app, textures, spriteSystem);

  // Performance monitoring
  const stats = {
    fps: 0,
    frameTime: 0,
    particleCount: 0,
    entityCount: 0,
    drawCalls: 0,
  };

  // Game loop
  let lastTime = performance.now();
  let fpsCounter = 0;
  let fpsTime = 0;

  app.ticker.add(() => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update world time
    world.deltaTime = deltaTime;
    world.time += deltaTime;
    renderContext.deltaTime = deltaTime;

    // Run ECS systems in correct order
    pathfindingSystem(world);
    movementSystem(world);
    combatSystem(world);
    abilitySystem(world);
    projectileSystem(world);
    finalShowdownSystem(world);

    // Run render system (handles all visual updates)
    renderSystem(world, renderContext);

    // Update performance stats
    fpsCounter++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      stats.fps = fpsCounter;
      stats.frameTime = 1000 / fpsCounter;
      stats.particleCount = particleSystem.getActiveParticleCount();
      stats.entityCount = world.entityCount || 0;
      stats.drawCalls = app.renderer.renderingContext?.drawCalls || 0;

      // Update UI
      updateUI(world, stats);

      fpsCounter = 0;
      fpsTime = 0;
    }

    // Phase-based effects
    handlePhaseEffects(world, screenEffects);
  });

  console.log('✅ Game loop started');
  console.log('🎮 RTS Arena Enhanced - Ready to play!');

  // Add debug controls
  setupDebugControls(world, screenEffects, camera, spriteSystem, particleSystem);
}

function updateUI(world: any, stats: any) {
  // Update FPS and performance
  const fpsElement = document.getElementById('fps');
  if (fpsElement) {
    fpsElement.textContent = stats.fps.toString();
    fpsElement.style.color = stats.fps >= 55 ? '#44ff44' : stats.fps >= 30 ? '#ffaa00' : '#ff4444';
  }

  const frameTimeElement = document.getElementById('frame-time');
  if (frameTimeElement) {
    frameTimeElement.textContent = `${stats.frameTime.toFixed(1)}ms`;
  }

  const particleElement = document.getElementById('particle-count');
  if (particleElement) {
    particleElement.textContent = `Particles: ${stats.particleCount}`;
  }

  // Update timer
  const timeRemaining = Math.max(0, 150 - world.time); // 2:30 match
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Color based on phase
    if (timeRemaining <= 0) {
      timerElement.style.color = '#ff0000';
    } else if (timeRemaining <= 5) {
      timerElement.style.color = '#ff8800';
    } else if (timeRemaining <= 30) {
      timerElement.style.color = '#ffaa00';
    } else {
      timerElement.style.color = '#ffffff';
    }
  }

  // Update phase
  let phase = 'normal';
  if (world.time >= 150) phase = 'showdown';
  else if (world.time >= 145) phase = 'collapse';
  else if (world.time >= 120) phase = 'warning';

  const phaseElement = document.getElementById('phase');
  if (phaseElement) {
    phaseElement.textContent = phase.toUpperCase();
    phaseElement.className = `phase-${phase}`;
  }

  // Update entity count
  const entityElement = document.getElementById('entity-count');
  if (entityElement) {
    entityElement.textContent = stats.entityCount.toString();
  }
}

function handlePhaseEffects(world: any, screenEffects: ScreenEffects) {
  const phase = world.lastPhase || 'normal';
  const warning = document.getElementById('phase-warning');

  if (phase === 'warning' && world.phase !== 'warning') {
    if (warning) {
      warning.textContent = '⚠️ ARENA COLLAPSE IN 30 SECONDS';
      warning.style.display = 'block';
      warning.className = 'phase-warning warning-pulse';
    }
    setTimeout(() => {
      if (warning) warning.style.display = 'none';
    }, 3000);
  } else if (phase === 'collapse' && world.phase !== 'collapse') {
    if (warning) {
      warning.textContent = '🔥 PREPARE FOR FINAL SHOWDOWN';
      warning.style.display = 'block';
      warning.className = 'phase-warning collapse-pulse';
    }
    // Vignette already handled in render system
  } else if (phase === 'showdown' && world.phase !== 'showdown') {
    if (warning) {
      warning.textContent = '💀 FINAL SHOWDOWN!';
      warning.style.display = 'block';
      warning.className = 'phase-warning showdown-pulse';
    }
    // Effects already handled in render system
  }

  world.phase = phase;
}

function setupDebugControls(
  world: any,
  screenEffects: ScreenEffects,
  camera: Camera,
  spriteSystem: SpriteSystem,
  particleSystem: ParticleSystem
) {
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case '1':
        // Test camera shake
        camera.shake({ magnitude: 5, duration: 0.5 });
        console.log('Camera shake triggered');
        break;
      case '2':
        // Test screen flash
        screenEffects.flash(0xffffff, 0.5);
        console.log('Screen flash triggered');
        break;
      case '3':
        // Test vignette toggle
        const vignetteVisible = !screenEffects.vignetteOverlay?.visible;
        screenEffects.setVignetteVisible(vignetteVisible, 0.5);
        console.log(`Vignette ${vignetteVisible ? 'enabled' : 'disabled'}`);
        break;
      case '4':
        // Test death explosion at center
        particleSystem.createDeathExplosion(960, 540, 0xff4444);
        screenEffects.triggerDeathExplosion();
        console.log('Death explosion triggered');
        break;
      case '5':
        // Test final showdown effects
        screenEffects.triggerFinalShowdown();
        console.log('Final showdown effects triggered');
        break;
      case '6':
        // Toggle bloom effect
        screenEffects.setBloom(true, 1.5);
        console.log('Bloom effect toggled');
        break;
      case '7':
        // Toggle chromatic aberration
        screenEffects.setChromaticAberration(true, 2);
        console.log('Chromatic aberration toggled');
        break;
      case 'p':
        // Pause/unpause
        app.ticker.stop();
        setTimeout(() => app.ticker.start(), 3000);
        console.log('Game paused for 3 seconds');
        break;
      case 'r':
        // Reset camera
        camera.centerOn(960, 540, true);
        camera.setZoom(1.0);
        console.log('Camera reset');
        break;
    }
  });

  console.log('Debug controls enabled:');
  console.log('  1 - Camera shake');
  console.log('  2 - Screen flash');
  console.log('  3 - Toggle vignette');
  console.log('  4 - Death explosion');
  console.log('  5 - Final showdown effects');
  console.log('  6 - Toggle bloom');
  console.log('  7 - Toggle chromatic aberration');
  console.log('  P - Pause for 3 seconds');
  console.log('  R - Reset camera');
}

// Start the game
main().catch((error) => {
  console.error('Failed to initialize game:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: #ff4444;">
      <h1>Failed to initialize RTS Arena Enhanced</h1>
      <pre>${error.message}</pre>
      <p>Please check the console for more details.</p>
    </div>
  `;
});