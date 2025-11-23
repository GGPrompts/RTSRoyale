// Effects integration - coordinator will merge this with test-scene.ts
import { Application, Container } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { SpriteRenderer } from '../rendering/spriteRenderer';
import { ParticleSystem } from './particleSystem';
import { ScreenEffects } from './screenEffects';

export interface EffectsData {
  spriteRenderer: SpriteRenderer;
  particleSystem: ParticleSystem;
  screenEffects: ScreenEffects;
  worldContainer: Container;
}

/**
 * Initialize visual effects systems
 * This should be called from initTestScene()
 */
export function initEffects(app: Application, worldContainer?: Container): EffectsData {
  console.log('✨ Initializing visual effects...');

  // Create or use provided world container for camera effects
  const container = worldContainer || new Container();
  if (!worldContainer) {
    app.stage.addChild(container);
  }

  // Initialize rendering systems
  const spriteRenderer = new SpriteRenderer();
  const particleSystem = new ParticleSystem();
  const screenEffects = new ScreenEffects(container);

  // Add containers to world (particles should be on top)
  container.addChild(spriteRenderer.getContainer());
  container.addChild(particleSystem.getContainer());

  console.log('✅ Visual effects initialized');

  return {
    spriteRenderer,
    particleSystem,
    screenEffects,
    worldContainer: container,
  };
}

/**
 * Update effects systems each frame
 * Call this from the main ticker
 */
export function updateEffects(
  world: GameWorld,
  deltaTime: number,
  effectsData: EffectsData
): void {
  effectsData.spriteRenderer.update(world);
  effectsData.particleSystem.update(deltaTime);
  effectsData.screenEffects.update(deltaTime);
}

/**
 * Trigger combat hit particles
 * Combat system should call this when damage is dealt
 */
export function triggerCombatHit(
  x: number,
  y: number,
  effectsData: EffectsData
): void {
  effectsData.particleSystem.spawnCombatHit(x, y);
}

/**
 * Trigger death explosion and screen shake
 * Combat system should call this when a unit dies
 */
export function triggerDeath(
  x: number,
  y: number,
  teamId: number,
  effectsData: EffectsData
): void {
  const color = teamId === 0 ? 0x4444ff : 0xff4444;
  effectsData.particleSystem.spawnDeathExplosion(x, y, color);
  effectsData.screenEffects.triggerShake(8, 0.15);
}

/**
 * Get performance metrics
 */
export function getEffectsMetrics(effectsData: EffectsData) {
  return {
    activeParticles: effectsData.particleSystem.getActiveParticleCount(),
    pooledParticles: effectsData.particleSystem.getPoolSize(),
    isShaking: effectsData.screenEffects.isShaking(),
  };
}
