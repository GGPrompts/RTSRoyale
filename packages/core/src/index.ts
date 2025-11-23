// Core game logic exports
export * from './components';
export * from './world';
export * from './systems';

// Re-export commonly used bitECS functions
export {
  defineQuery,
  addComponent,
  removeComponent,
  hasComponent,
  addEntity,
  removeEntity,
  Types,
  defineComponent,
  type World
} from 'bitecs';
