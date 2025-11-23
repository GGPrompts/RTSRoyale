// Abilities UI - Cooldown indicators for Q/W/E abilities
import { Application, Graphics, Text, Container } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Selected, AbilityState } from '@rts-arena/core';
import { GameWorld, getAbilityCooldowns } from '@rts-arena/core';

// UI Container
let abilitiesContainer: Container;
let abilitySlots: AbilitySlot[] = [];

// Ability slot configuration
interface AbilitySlot {
  container: Container;
  background: Graphics;
  icon: Text;
  cooldownOverlay: Graphics;
  cooldownText: Text;
  key: 'q' | 'w' | 'e';
  name: string;
  color: number;
}

// Define query for selected units
const selectedQuery = defineQuery([Selected, AbilityState]);

// UI Configuration
const SLOT_SIZE = 60;
const SLOT_SPACING = 10;
const UI_PADDING = 20;

export function initAbilitiesUI(app: Application): void {
  console.log('🎮 Initializing abilities UI...');

  // Create main container
  abilitiesContainer = new Container();
  abilitiesContainer.x = app.screen.width / 2 - (SLOT_SIZE * 3 + SLOT_SPACING * 2) / 2;
  abilitiesContainer.y = app.screen.height - SLOT_SIZE - UI_PADDING - 40; // Above entity count

  app.stage.addChild(abilitiesContainer);

  // Create ability slots
  const abilities = [
    { key: 'q', name: 'Dash', color: 0x00ffff, icon: 'Q' },
    { key: 'w', name: 'Shield', color: 0x4488ff, icon: 'W' },
    { key: 'e', name: 'Ranged', color: 0xff8800, icon: 'E' },
  ];

  abilities.forEach((ability, index) => {
    const slot = createAbilitySlot(
      index * (SLOT_SIZE + SLOT_SPACING),
      0,
      ability.key as 'q' | 'w' | 'e',
      ability.name,
      ability.color,
      ability.icon
    );
    abilitySlots.push(slot);
    abilitiesContainer.addChild(slot.container);
  });

  console.log('✅ Abilities UI initialized');
}

function createAbilitySlot(x: number, y: number, key: 'q' | 'w' | 'e', name: string, color: number, iconText: string): AbilitySlot {
  const container = new Container();
  container.x = x;
  container.y = y;

  // Background
  const background = new Graphics();
  background.rect(0, 0, SLOT_SIZE, SLOT_SIZE);
  background.fill({ color: 0x222222, alpha: 0.8 });
  background.stroke({ color: color, width: 2 });
  container.addChild(background);

  // Icon (key letter)
  const icon = new Text({
    text: iconText,
    style: {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: color,
    }
  });
  icon.anchor.set(0.5);
  icon.x = SLOT_SIZE / 2;
  icon.y = SLOT_SIZE / 2 - 5;
  container.addChild(icon);

  // Ability name (small text at bottom)
  const nameText = new Text({
    text: name,
    style: {
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xffffff,
    }
  });
  nameText.anchor.set(0.5);
  nameText.x = SLOT_SIZE / 2;
  nameText.y = SLOT_SIZE - 8;
  container.addChild(nameText);

  // Cooldown overlay (dark semi-transparent)
  const cooldownOverlay = new Graphics();
  container.addChild(cooldownOverlay);

  // Cooldown text
  const cooldownText = new Text({
    text: '',
    style: {
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2 },
    }
  });
  cooldownText.anchor.set(0.5);
  cooldownText.x = SLOT_SIZE / 2;
  cooldownText.y = SLOT_SIZE / 2;
  cooldownText.visible = false;
  container.addChild(cooldownText);

  return {
    container,
    background,
    icon,
    cooldownOverlay,
    cooldownText,
    key,
    name,
    color,
  };
}

export function updateAbilitiesUI(world: GameWorld): void {
  // Get first selected unit (for simplicity, show cooldowns for first selected)
  const selected = selectedQuery(world);

  if (selected.length === 0) {
    // No units selected, hide UI or show inactive state
    abilitiesContainer.alpha = 0.5;
    abilitySlots.forEach(slot => {
      slot.cooldownOverlay.clear();
      slot.cooldownText.visible = false;
    });
    return;
  }

  abilitiesContainer.alpha = 1.0;

  // Get cooldowns for first selected unit
  const eid = selected[0];
  const cooldowns = getAbilityCooldowns(world, eid);

  // Update each slot
  updateSlot(abilitySlots[0], cooldowns.dash); // Q
  updateSlot(abilitySlots[1], cooldowns.shield); // W
  updateSlot(abilitySlots[2], cooldowns.ranged); // E
}

function updateSlot(slot: AbilitySlot, cooldownPercent: number): void {
  slot.cooldownOverlay.clear();

  if (cooldownPercent > 0) {
    // Draw cooldown overlay (circular sweep)
    const centerX = SLOT_SIZE / 2;
    const centerY = SLOT_SIZE / 2;
    const radius = SLOT_SIZE / 2;

    // Draw dark overlay
    slot.cooldownOverlay.rect(0, 0, SLOT_SIZE, SLOT_SIZE);
    slot.cooldownOverlay.fill({ color: 0x000000, alpha: 0.6 });

    // Draw circular cooldown indicator
    const startAngle = -Math.PI / 2; // Start from top
    const sweepAngle = (1 - cooldownPercent) * Math.PI * 2;

    if (sweepAngle > 0) {
      // Draw the "ready" portion as a pie slice
      slot.cooldownOverlay.moveTo(centerX, centerY);
      slot.cooldownOverlay.arc(centerX, centerY, radius - 2, startAngle, startAngle + sweepAngle);
      slot.cooldownOverlay.lineTo(centerX, centerY);
      slot.cooldownOverlay.fill({ color: slot.color, alpha: 0.3 });
    }

    // Show cooldown time remaining
    const secondsRemaining = Math.ceil(cooldownPercent * getCooldownDuration(slot.key));
    if (secondsRemaining > 0) {
      slot.cooldownText.text = secondsRemaining.toString();
      slot.cooldownText.visible = true;
    } else {
      slot.cooldownText.visible = false;
    }

    // Dim the icon while on cooldown
    slot.icon.alpha = 0.5;
  } else {
    // Ability ready
    slot.cooldownText.visible = false;
    slot.icon.alpha = 1.0;

    // Add ready glow effect
    slot.background.clear();
    slot.background.rect(0, 0, SLOT_SIZE, SLOT_SIZE);
    slot.background.fill({ color: 0x222222, alpha: 0.8 });
    slot.background.stroke({ color: slot.color, width: 3 });
  }
}

function getCooldownDuration(key: 'q' | 'w' | 'e'): number {
  switch (key) {
    case 'q': return 10; // Dash
    case 'w': return 15; // Shield
    case 'e': return 8;  // Ranged Attack
    default: return 1;
  }
}

// Show ability activation feedback
export function showAbilityActivation(key: 'q' | 'w' | 'e'): void {
  const slotIndex = key === 'q' ? 0 : key === 'w' ? 1 : 2;
  const slot = abilitySlots[slotIndex];

  if (!slot) return;

  // Flash effect on activation
  const originalScale = slot.container.scale.x;
  slot.container.scale.set(1.2);

  // Animate back to normal
  const startTime = Date.now();
  const duration = 200;

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const scale = 1.2 - (1.2 - originalScale) * progress;
    slot.container.scale.set(scale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

// Clean up UI
export function cleanupAbilitiesUI(): void {
  if (abilitiesContainer) {
    abilitiesContainer.destroy({ children: true });
  }
  abilitySlots = [];
}