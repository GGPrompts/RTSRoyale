// Damage Numbers Animation System
import { Text, Container, Application } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';

interface DamageNumber {
  text: Text;
  startY: number;
  lifeTime: number;
  maxLifeTime: number;
}

// Active damage numbers
const damageNumbers: DamageNumber[] = [];

// Container to hold all damage numbers
let damageNumberContainer: Container;

export function initDamageNumbers(app: Application) {
  damageNumberContainer = new Container();
  damageNumberContainer.zIndex = 20; // Render above health bars
  app.stage.addChild(damageNumberContainer);
}

export function updateDamageNumbers(world: GameWorld, deltaTime: number) {
  // Process new damage events
  if (world.damageEvents) {
    for (const event of world.damageEvents) {
      createDamageNumber(event.x, event.y, event.damage);
    }
    // Clear processed events
    world.damageEvents = [];
  }

  // Update existing damage numbers
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const damageNum = damageNumbers[i];
    damageNum.lifeTime += deltaTime;

    // Calculate progress (0 to 1)
    const progress = damageNum.lifeTime / damageNum.maxLifeTime;

    if (progress >= 1) {
      // Remove expired damage number
      damageNumberContainer.removeChild(damageNum.text);
      damageNum.text.destroy();
      damageNumbers.splice(i, 1);
    } else {
      // Animate: float up and fade out
      const floatDistance = 30; // pixels to float up
      damageNum.text.y = damageNum.startY - (floatDistance * progress);
      damageNum.text.alpha = 1 - progress;

      // Scale effect (optional - makes it pop)
      const scaleProgress = Math.min(progress * 2, 1);
      const scale = 0.8 + (0.4 * (1 - Math.abs(scaleProgress - 0.5) * 2));
      damageNum.text.scale.set(scale);
    }
  }
}

function createDamageNumber(x: number, y: number, damage: number) {
  const text = new Text({
    text: `-${Math.round(damage)}`,
    style: {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffcc00, // Yellow/gold color
      stroke: { color: 0x000000, width: 3 },
      align: 'center',
    }
  });

  // Position slightly randomized to prevent overlap
  const offsetX = (Math.random() - 0.5) * 20;
  const offsetY = (Math.random() - 0.5) * 10;
  text.x = x + offsetX;
  text.y = y - 20 + offsetY; // Start above the unit
  text.anchor.set(0.5);

  damageNumberContainer.addChild(text);

  damageNumbers.push({
    text,
    startY: text.y,
    lifeTime: 0,
    maxLifeTime: 1.0, // 1 second lifetime
  });
}

export function cleanupDamageNumbers() {
  damageNumbers.forEach(damageNum => {
    damageNum.text.destroy();
  });
  damageNumbers.length = 0;
  if (damageNumberContainer) {
    damageNumberContainer.destroy();
  }
}