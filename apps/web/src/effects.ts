// Screen Effects for Final Showdown
import { Application, Graphics, Filter, BlurFilter, ColorMatrixFilter } from 'pixi.js';

// Screen effect overlays
let glowOverlay: Graphics | null = null;
let vignetteOverlay: Graphics | null = null;
let flashOverlay: Graphics | null = null;
let countdownText: any | null = null;

// Track active effects
let activeEffects: Set<string> = new Set();

export function initScreenEffects(app: Application): void {
  // Create overlay container at the top of display hierarchy
  const overlayContainer = app.stage.addChild(new Graphics());
  overlayContainer.zIndex = 9999;
  overlayContainer.eventMode = 'none'; // Don't capture mouse events
}

// Glow effect for screen edges (Phase: glow)
export function applyGlowEffect(app: Application, intensity: number = 1.0): void {
  if (activeEffects.has('glow')) return;
  activeEffects.add('glow');

  if (!glowOverlay) {
    glowOverlay = new Graphics();
    app.stage.addChild(glowOverlay);
    glowOverlay.zIndex = 9990;
    glowOverlay.eventMode = 'none';
  }

  // Clear and redraw
  glowOverlay.clear();

  const width = app.screen.width;
  const height = app.screen.height;
  const glowSize = 150 * intensity;

  // Create red glow gradient on edges
  glowOverlay.rect(0, 0, width, height);
  glowOverlay.stroke({
    color: 0xff0000,
    width: glowSize,
    alpha: 0.3 * intensity
  });

  // Add pulsing animation
  animatePulse(glowOverlay, 0.3, 0.6, 2000);
}

// Intense glow effect (Phase: prepare)
export function applyIntenseGlowEffect(app: Application): void {
  applyGlowEffect(app, 1.5);

  // Add additional red filter
  const colorMatrix = new ColorMatrixFilter();
  colorMatrix.brightness(1.2, false);
  colorMatrix.tint(0xff0000, false);

  if (!app.stage.filters) {
    app.stage.filters = [];
  }
  app.stage.filters = [...app.stage.filters, colorMatrix];

  // Store filter reference for removal
  app.stage.filters['redTint'] = colorMatrix;
}

// Vignette effect for dramatic focus
export function applyVignetteEffect(app: Application, intensity: number = 1.0): void {
  if (activeEffects.has('vignette')) return;
  activeEffects.add('vignette');

  if (!vignetteOverlay) {
    vignetteOverlay = new Graphics();
    app.stage.addChild(vignetteOverlay);
    vignetteOverlay.zIndex = 9991;
    vignetteOverlay.eventMode = 'none';
  }

  vignetteOverlay.clear();

  const width = app.screen.width;
  const height = app.screen.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(width, height) * 0.7;

  // Create radial gradient vignette
  for (let i = 10; i >= 0; i--) {
    const alpha = (1 - i / 10) * 0.8 * intensity;
    const currentRadius = radius * (1 + i * 0.1);

    vignetteOverlay.circle(centerX, centerY, currentRadius);
    vignetteOverlay.fill({ color: 0x000000, alpha: alpha * 0.5 });
  }
}

// Flash effect for showdown start
export function applyFlashEffect(app: Application, duration: number = 500): void {
  if (!flashOverlay) {
    flashOverlay = new Graphics();
    app.stage.addChild(flashOverlay);
    flashOverlay.zIndex = 10000; // Highest priority
    flashOverlay.eventMode = 'none';
  }

  // White flash
  flashOverlay.clear();
  flashOverlay.rect(0, 0, app.screen.width, app.screen.height);
  flashOverlay.fill({ color: 0xffffff, alpha: 1.0 });

  // Fade out animation
  let startTime = Date.now();
  const fadeOut = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    flashOverlay.alpha = 1 - progress;

    if (progress < 1) {
      requestAnimationFrame(fadeOut);
    } else {
      flashOverlay.clear();
      activeEffects.delete('flash');
    }
  };

  activeEffects.add('flash');
  requestAnimationFrame(fadeOut);
}

// Screen shake effect
export function applyScreenShake(app: Application, intensity: number = 10, duration: number = 500): void {
  const originalX = app.stage.x;
  const originalY = app.stage.y;

  let startTime = Date.now();
  const shake = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress < 1) {
      const currentIntensity = intensity * (1 - progress);
      app.stage.x = originalX + (Math.random() - 0.5) * currentIntensity;
      app.stage.y = originalY + (Math.random() - 0.5) * currentIntensity;
      requestAnimationFrame(shake);
    } else {
      app.stage.x = originalX;
      app.stage.y = originalY;
    }
  };

  requestAnimationFrame(shake);
}

// Countdown overlay for final seconds
export function showCountdown(app: Application, seconds: number): void {
  // Import Text from pixi.js
  import('pixi.js').then(({ Text }) => {
    if (!countdownText) {
      countdownText = new Text({
        text: seconds.toString(),
        style: {
          fontFamily: 'Arial Black',
          fontSize: 120,
          fontWeight: 'bold',
          fill: 0xff0000,
          stroke: { color: 0x000000, width: 8 },
          dropShadow: {
            alpha: 0.8,
            angle: Math.PI / 4,
            blur: 4,
            color: 0x000000,
            distance: 10,
          },
        }
      });

      countdownText.anchor.set(0.5);
      countdownText.x = app.screen.width / 2;
      countdownText.y = app.screen.height / 2 - 100;
      countdownText.zIndex = 9995;

      app.stage.addChild(countdownText);
    }

    countdownText.text = seconds.toString();
    countdownText.scale.set(1.5);

    // Animate scale down
    const startScale = 1.5;
    const endScale = 1.0;
    const startTime = Date.now();
    const animDuration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animDuration, 1);

      const scale = startScale + (endScale - startScale) * progress;
      countdownText.scale.set(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  });
}

// Warning message overlay
export function showWarningMessage(app: Application, message: string, duration: number = 3000): void {
  const element = document.getElementById('phase-warning');
  if (!element) return;

  element.textContent = message;
  element.style.display = 'block';
  element.style.animation = 'none';

  // Trigger reflow to restart animation
  element.offsetHeight;

  // Add epic animation
  element.style.animation = 'warningPulse 0.5s ease-out';

  if (duration > 0) {
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }
}

// Utility function for pulsing animation
function animatePulse(
  graphic: Graphics,
  minAlpha: number,
  maxAlpha: number,
  duration: number
): void {
  let startTime = Date.now();

  const pulse = () => {
    const elapsed = Date.now() - startTime;
    const progress = (elapsed % duration) / duration;
    const alpha = minAlpha + (maxAlpha - minAlpha) * Math.abs(Math.sin(progress * Math.PI));

    graphic.alpha = alpha;

    if (activeEffects.has('glow')) {
      requestAnimationFrame(pulse);
    }
  };

  requestAnimationFrame(pulse);
}

// Clear all effects
export function clearAllEffects(app: Application): void {
  activeEffects.clear();

  if (glowOverlay) {
    glowOverlay.clear();
    glowOverlay.destroy();
    glowOverlay = null;
  }

  if (vignetteOverlay) {
    vignetteOverlay.clear();
    vignetteOverlay.destroy();
    vignetteOverlay = null;
  }

  if (flashOverlay) {
    flashOverlay.clear();
    flashOverlay.destroy();
    flashOverlay = null;
  }

  if (countdownText) {
    countdownText.destroy();
    countdownText = null;
  }

  // Clear filters
  if (app.stage.filters) {
    app.stage.filters = [];
  }
}

// Apply effects based on game phase
export function updatePhaseEffects(app: Application, phase: string, timeRemaining: number): void {
  switch (phase) {
    case 'normal':
      clearAllEffects(app);
      break;

    case 'warning':
      showWarningMessage(app, 'ARENA COLLAPSE IN 30 SECONDS', 3000);
      break;

    case 'glow':
      applyGlowEffect(app, 1.0);
      applyVignetteEffect(app, 0.5);
      break;

    case 'countdown':
      applyGlowEffect(app, 1.2);
      applyVignetteEffect(app, 0.7);
      if (timeRemaining <= 10 && timeRemaining > 0) {
        showCountdown(app, Math.ceil(timeRemaining));
      }
      break;

    case 'prepare':
      applyIntenseGlowEffect(app);
      applyVignetteEffect(app, 1.0);
      showWarningMessage(app, 'PREPARE FOR FINAL SHOWDOWN', -1);
      if (timeRemaining <= 5 && timeRemaining > 0) {
        showCountdown(app, Math.ceil(timeRemaining));
      }
      break;

    case 'showdown':
      applyFlashEffect(app, 500);
      applyScreenShake(app, 15, 750);
      showWarningMessage(app, 'FINAL SHOWDOWN!', 2000);
      clearGlowEffect();
      applyVignetteEffect(app, 1.2); // Keep intense vignette during battle
      break;
  }
}

function clearGlowEffect(): void {
  activeEffects.delete('glow');
  if (glowOverlay) {
    glowOverlay.clear();
  }
}

// CSS animations for the warning element
const style = document.createElement('style');
style.textContent = `
  @keyframes warningPulse {
    0% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.0);
      opacity: 1;
    }
  }

  #phase-warning {
    animation: warningPulse 0.5s ease-out;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
`;
document.head.appendChild(style);