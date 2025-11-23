// Input handling for abilities and controls
import { setAbilityKeyState } from '@rts-arena/core';
import { hasComponent, defineQuery } from 'bitecs';
import {
  Selected,
  AbilitySlot1,
  AbilitySlot2,
  AbilitySlot3
} from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';

// Store reference to game world for input handling
let gameWorld: GameWorld | null = null;

// UI elements for cooldown display
let cooldownUI: HTMLDivElement | null = null;

export function initInputSystem(world: GameWorld) {
  gameWorld = world;

  // Create cooldown UI
  createCooldownUI();

  // Set up keyboard listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  console.log('Input system initialized - Press Q (Dash), W (Shield), E (Ranged Attack)');
}

export function cleanupInputSystem() {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);

  if (cooldownUI && cooldownUI.parentNode) {
    cooldownUI.parentNode.removeChild(cooldownUI);
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!gameWorld) return;

  // Prevent default for ability keys
  if (['q', 'w', 'e'].includes(event.key.toLowerCase())) {
    event.preventDefault();
  }

  // Set ability key states
  setAbilityKeyState(event.key, true);

  // Log ability usage
  switch (event.key.toLowerCase()) {
    case 'q':
      console.log('Q pressed - Dash ability');
      break;
    case 'w':
      console.log('W pressed - Shield ability');
      break;
    case 'e':
      console.log('E pressed - Ranged Attack ability');
      break;
  }
}

function handleKeyUp(event: KeyboardEvent) {
  if (!gameWorld) return;

  // Set ability key states
  setAbilityKeyState(event.key, false);
}

function createCooldownUI() {
  // Create container for cooldown display
  cooldownUI = document.createElement('div');
  cooldownUI.id = 'ability-cooldowns';
  cooldownUI.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    background: rgba(0, 0, 0, 0.7);
    padding: 15px;
    border-radius: 10px;
    font-family: monospace;
    color: white;
    font-size: 14px;
    z-index: 1000;
  `;

  // Create ability slots
  const abilities = [
    { key: 'Q', name: 'Dash', cooldown: 10 },
    { key: 'W', name: 'Shield', cooldown: 15 },
    { key: 'E', name: 'Ranged', cooldown: 12 }
  ];

  abilities.forEach((ability, index) => {
    const slot = document.createElement('div');
    slot.className = `ability-slot-${index + 1}`;
    slot.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
      position: relative;
    `;

    // Key indicator
    const keyDiv = document.createElement('div');
    keyDiv.style.cssText = `
      width: 50px;
      height: 50px;
      border: 2px solid #44ff44;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      background: rgba(0, 0, 0, 0.5);
      position: relative;
    `;
    keyDiv.textContent = ability.key;

    // Cooldown overlay
    const cooldownOverlay = document.createElement('div');
    cooldownOverlay.className = `cooldown-overlay-${index + 1}`;
    cooldownOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.6);
      border-radius: 3px;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    `;

    keyDiv.appendChild(cooldownOverlay);

    // Ability name
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = `
      margin-top: 5px;
      font-size: 12px;
      color: #aaaaaa;
    `;
    nameDiv.textContent = ability.name;

    slot.appendChild(keyDiv);
    slot.appendChild(nameDiv);
    cooldownUI.appendChild(slot);
  });

  document.body.appendChild(cooldownUI);
}

export function updateCooldownUI(world: GameWorld) {
  if (!cooldownUI || !gameWorld) return;

  // Use a query to find selected units
  const selectedQuery = defineQuery([Selected, AbilitySlot1, AbilitySlot2, AbilitySlot3]);
  const selectedUnits = selectedQuery(world);

  if (selectedUnits.length === 0) return;

  // Get the first selected unit
  const selectedUnit = selectedUnits[0];

  // Update each ability slot
  updateAbilitySlot(world, selectedUnit, 1, AbilitySlot1.cooldown[selectedUnit]);
  updateAbilitySlot(world, selectedUnit, 2, AbilitySlot2.cooldown[selectedUnit]);
  updateAbilitySlot(world, selectedUnit, 3, AbilitySlot3.cooldown[selectedUnit]);
}

function updateAbilitySlot(world: GameWorld, unitId: number, slotNum: number, cooldown: number) {
  const overlay = document.querySelector(`.cooldown-overlay-${slotNum}`) as HTMLDivElement;
  if (!overlay) return;

  if (cooldown > 0) {
    overlay.style.display = 'flex';
    overlay.textContent = Math.ceil(cooldown).toString();
  } else {
    overlay.style.display = 'none';
  }
}