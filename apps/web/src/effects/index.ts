// Export all effects systems
export { ParticleSystem } from './particleSystem';
export { ScreenEffects } from './screenEffects';
export {
  initEffects,
  updateEffects,
  triggerCombatHit,
  triggerDeath,
  getEffectsMetrics,
  type EffectsData,
} from './effectsIntegration';
export { runVisualDemo, runPerformanceStressTest } from './visualDemo';
