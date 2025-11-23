// Visual effects demo - shows all effects in action
import { Application } from 'pixi.js';
import { ParticleSystem } from './particleSystem';
import { ScreenEffects } from './screenEffects';

/**
 * Standalone demo of particle effects and screen shake
 * Use this to test effects without running the full game
 */
export function runVisualDemo(app: Application) {
  console.log('🎨 Starting visual effects demo...');

  const particleSystem = new ParticleSystem();
  const screenEffects = new ScreenEffects(app.stage);

  app.stage.addChild(particleSystem.getContainer());

  // Demo sequence
  const demos = [
    {
      time: 0,
      name: 'Combat Hit (Center)',
      action: () => {
        particleSystem.spawnCombatHit(960, 540);
      },
    },
    {
      time: 1000,
      name: 'Blue Death Explosion (Left)',
      action: () => {
        particleSystem.spawnDeathExplosion(400, 540, 0x4444ff);
        screenEffects.triggerShake(10, 0.2);
      },
    },
    {
      time: 2000,
      name: 'Red Death Explosion (Right)',
      action: () => {
        particleSystem.spawnDeathExplosion(1520, 540, 0xff4444);
        screenEffects.triggerShake(10, 0.2);
      },
    },
    {
      time: 3000,
      name: 'Rapid Combat Hits',
      action: () => {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            const x = 800 + Math.random() * 320;
            const y = 440 + Math.random() * 200;
            particleSystem.spawnCombatHit(x, y);
          }, i * 50);
        }
      },
    },
    {
      time: 4500,
      name: 'Massive Explosion',
      action: () => {
        particleSystem.spawnDeathExplosion(960, 540, 0xffffff);
        particleSystem.spawnDeathExplosion(960, 540, 0xffaa00);
        screenEffects.triggerShake(20, 0.4);
      },
    },
    {
      time: 6000,
      name: 'Damage Numbers Demo',
      action: () => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const x = 960 + (i - 2) * 100;
            const y = 540;
            particleSystem.spawnDamageNumber(x, y, 25 * (i + 1));
          }, i * 200);
        }
      },
    },
    {
      time: 8000,
      name: 'Particle Storm',
      action: () => {
        for (let i = 0; i < 50; i++) {
          setTimeout(() => {
            const x = Math.random() * 1920;
            const y = Math.random() * 1080;
            const colors = [0x4444ff, 0xff4444, 0xffaa00, 0x44ff44];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particleSystem.spawnDeathExplosion(x, y, color);
          }, i * 50);
        }
        screenEffects.triggerShake(15, 1.0);
      },
    },
  ];

  // Schedule all demos
  demos.forEach((demo) => {
    setTimeout(() => {
      console.log(`▶️ ${demo.name}`);
      demo.action();
    }, demo.time);
  });

  // Loop the demo
  const totalDuration = 10000;
  setInterval(() => {
    console.log('🔄 Restarting demo...');
    demos.forEach((demo) => {
      setTimeout(() => {
        console.log(`▶️ ${demo.name}`);
        demo.action();
      }, demo.time);
    });
  }, totalDuration);

  // Update loop
  let lastTime = performance.now();
  app.ticker.add(() => {
    const now = performance.now();
    const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    particleSystem.update(deltaTime);
    screenEffects.update(deltaTime);

    // Display stats
    const particles = particleSystem.getActiveParticleCount();
    const fps = Math.round(app.ticker.FPS);
    const statsDiv = document.getElementById('entity-count');
    if (statsDiv) {
      statsDiv.textContent = `Visual Demo | ${particles} particles | ${fps} FPS`;
    }
  });

  console.log('✅ Visual demo running (loops every 10s)');
  console.log('📊 Watch for particle counts and FPS');
}

/**
 * Performance stress test
 * Spawns particles continuously to test pooling and performance
 */
export function runPerformanceStressTest(app: Application) {
  console.log('⚡ Starting performance stress test...');

  const particleSystem = new ParticleSystem();
  const screenEffects = new ScreenEffects(app.stage);

  app.stage.addChild(particleSystem.getContainer());

  // Spawn particles continuously
  setInterval(() => {
    // Random combat hits
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * 1920;
      const y = Math.random() * 1080;
      particleSystem.spawnCombatHit(x, y);
    }

    // Random explosions
    if (Math.random() > 0.7) {
      const x = Math.random() * 1920;
      const y = Math.random() * 1080;
      const colors = [0x4444ff, 0xff4444];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particleSystem.spawnDeathExplosion(x, y, color);

      if (Math.random() > 0.8) {
        screenEffects.triggerShake(8, 0.15);
      }
    }
  }, 100); // Every 100ms

  // Update loop
  let lastTime = performance.now();
  let minFps = 60;
  let maxFps = 60;

  app.ticker.add(() => {
    const now = performance.now();
    const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    particleSystem.update(deltaTime);
    screenEffects.update(deltaTime);

    // Track FPS
    const fps = Math.round(app.ticker.FPS);
    minFps = Math.min(minFps, fps);
    maxFps = Math.max(maxFps, fps);

    // Display stats
    const particles = particleSystem.getActiveParticleCount();
    const poolSize = particleSystem.getPoolSize();
    const statsDiv = document.getElementById('entity-count');
    if (statsDiv) {
      statsDiv.textContent = `Stress Test | ${particles} active | ${poolSize} pooled | ${fps} FPS (min: ${minFps}, max: ${maxFps})`;
    }
  });

  console.log('✅ Stress test running');
  console.log('⚠️ Expect high particle counts');
  console.log('🎯 Target: 60 FPS with 200+ particles');
}
