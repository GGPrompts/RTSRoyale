# Pixi.js v8 Reference

## Documentation Sources
- Full API: https://pixijs.com/llms-full.txt
- Medium (compressed): https://pixijs.com/llms-medium.txt
- Index: https://pixijs.com/llms.txt
- Main docs: https://pixijs.com/8.x/guides

## Key Features for RTS Arena

### WebGPU Support
Pixi.js v8 introduces WebGPU rendering with automatic fallback to WebGL. This provides:
- 233-350% performance gains (as noted in plan)
- Better handling of large sprite batches
- More efficient particle systems

### Getting Started
```typescript
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  width: 1920,
  height: 1080,
  preference: 'webgpu', // Try WebGPU first
  backgroundColor: 0x1a1a1a,
});

document.body.appendChild(app.canvas);
```

### Performance Tips
- Use sprite sheets for unit graphics
- Batch sprites with same texture
- Use ParticleContainer for ability effects
- Leverage GPU instancing for repeated units

## Updated Daily
These docs are automatically generated and updated daily from TypeScript definitions.
