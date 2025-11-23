// Programmatically generated sprite textures for RTS Arena
import { Graphics, RenderTexture, Texture, Renderer } from 'pixi.js';

export interface TextureAssets {
  unitBlue: Texture;
  unitRed: Texture;
  unitNeutral: Texture;
  particle: Texture;
  projectile: Texture;
  shieldBubble: Texture;
  selectionRing: Texture;
  healthBarFull: Texture;
  healthBarEmpty: Texture;
  abilityIcon: Texture;
  dashTrail: Texture;
}

/**
 * Generate sprite textures programmatically
 * These can be replaced with actual image assets later
 */
export async function createTextures(renderer: Renderer): Promise<TextureAssets> {
  const textures: Partial<TextureAssets> = {};

  // Create unit sprite texture (hexagon shape)
  textures.unitBlue = createUnitTexture(renderer, 0x4488ff);
  textures.unitRed = createUnitTexture(renderer, 0xff4444);
  textures.unitNeutral = createUnitTexture(renderer, 0x888888);

  // Create particle texture (small circle with gradient)
  textures.particle = createParticleTexture(renderer);

  // Create projectile texture (arrow/bullet shape)
  textures.projectile = createProjectileTexture(renderer);

  // Create shield bubble texture
  textures.shieldBubble = createShieldTexture(renderer);

  // Create selection ring texture
  textures.selectionRing = createSelectionRingTexture(renderer);

  // Create health bar textures
  textures.healthBarFull = createHealthBarTexture(renderer, 0x44ff44);
  textures.healthBarEmpty = createHealthBarTexture(renderer, 0x333333);

  // Create ability icon texture
  textures.abilityIcon = createAbilityIconTexture(renderer);

  // Create dash trail texture
  textures.dashTrail = createDashTrailTexture(renderer);

  return textures as TextureAssets;
}

function createUnitTexture(renderer: Renderer, color: number): Texture {
  const size = 64;
  const graphics = new Graphics();

  // Draw hexagon shape
  const sides = 6;
  const radius = size / 2 - 4;
  graphics.poly([]);

  const points: number[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    points.push(
      Math.cos(angle) * radius + size / 2,
      Math.sin(angle) * radius + size / 2
    );
  }

  // Fill and stroke
  graphics.poly(points);
  graphics.fill({ color, alpha: 0.9 });

  graphics.poly(points);
  graphics.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });

  // Add inner detail (small circle)
  graphics.circle(size / 2, size / 2, 8);
  graphics.fill({ color: 0xffffff, alpha: 0.5 });

  // Add directional indicator (front triangle)
  const trianglePoints = [
    size / 2, size / 2 - radius + 8,
    size / 2 - 6, size / 2 - radius + 18,
    size / 2 + 6, size / 2 - radius + 18,
  ];
  graphics.poly(trianglePoints);
  graphics.fill({ color: 0xffffff, alpha: 0.7 });

  // Render to texture
  const renderTexture = RenderTexture.create({ width: size, height: size });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

function createParticleTexture(renderer: Renderer): Texture {
  const size = 16;
  const graphics = new Graphics();

  // Create gradient-like effect with multiple circles
  for (let i = 4; i >= 1; i--) {
    const radius = (size / 2) * (i / 4);
    const alpha = 1.0 - (i - 1) / 4;
    graphics.circle(size / 2, size / 2, radius);
    graphics.fill({ color: 0xffffff, alpha });
  }

  const renderTexture = RenderTexture.create({ width: size, height: size });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

function createProjectileTexture(renderer: Renderer): Texture {
  const width = 24;
  const height = 8;
  const graphics = new Graphics();

  // Draw arrow/bullet shape
  const points = [
    0, height / 2,           // Back point
    width * 0.7, 0,          // Top
    width, height / 2,       // Front point
    width * 0.7, height,     // Bottom
  ];

  graphics.poly(points);
  graphics.fill({ color: 0xffaa00, alpha: 0.9 });

  graphics.poly(points);
  graphics.stroke({ color: 0xffff00, width: 1, alpha: 0.8 });

  const renderTexture = RenderTexture.create({ width, height });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

function createShieldTexture(renderer: Renderer): Texture {
  const size = 96;
  const graphics = new Graphics();

  // Create shield bubble with multiple layers
  for (let i = 3; i >= 1; i--) {
    const radius = (size / 2 - 4) * (1.0 - (3 - i) * 0.05);
    graphics.circle(size / 2, size / 2, radius);
    graphics.stroke({
      color: 0x00aaff,
      width: 2,
      alpha: 0.3 * i,
    });
  }

  // Add hexagon pattern inside
  const sides = 6;
  const radius = size / 2 - 8;
  const points: number[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides;
    points.push(
      Math.cos(angle) * radius + size / 2,
      Math.sin(angle) * radius + size / 2
    );
  }

  graphics.poly(points);
  graphics.fill({ color: 0x00aaff, alpha: 0.15 });
  graphics.poly(points);
  graphics.stroke({ color: 0x00ffff, width: 1, alpha: 0.5 });

  const renderTexture = RenderTexture.create({ width: size, height: size });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

function createSelectionRingTexture(renderer: Renderer): Texture {
  const size = 80;
  const graphics = new Graphics();

  // Outer ring
  graphics.circle(size / 2, size / 2, size / 2 - 2);
  graphics.stroke({ color: 0x00ff00, width: 3, alpha: 0.8 });

  // Inner ring (dashed effect using multiple arcs)
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    if (i % 2 === 0) {
      const startAngle = (Math.PI * 2 * i) / segments;
      const endAngle = (Math.PI * 2 * (i + 1)) / segments;
      graphics.arc(size / 2, size / 2, size / 2 - 8, startAngle, endAngle);
      graphics.stroke({ color: 0x00ff00, width: 2, alpha: 0.5 });
    }
  }

  const renderTexture = RenderTexture.create({ width: size, height: size });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

function createHealthBarTexture(renderer: Renderer, color: number): Texture {
  const width = 60;
  const height = 8;
  const graphics = new Graphics();

  // Draw rounded rectangle
  graphics.roundRect(0, 0, width, height, 2);
  graphics.fill({ color });

  const renderTexture = RenderTexture.create({ width, height });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

function createAbilityIconTexture(renderer: Renderer): Texture {
  const size = 48;
  const graphics = new Graphics();

  // Background circle
  graphics.circle(size / 2, size / 2, size / 2 - 2);
  graphics.fill({ color: 0x222222, alpha: 0.8 });
  graphics.stroke({ color: 0x666666, width: 2 });

  // Icon symbol (lightning bolt for abilities)
  const points = [
    size * 0.6, size * 0.2,
    size * 0.4, size * 0.5,
    size * 0.5, size * 0.5,
    size * 0.3, size * 0.8,
    size * 0.5, size * 0.5,
    size * 0.4, size * 0.5,
  ];

  graphics.poly(points);
  graphics.fill({ color: 0xffff00, alpha: 0.9 });

  const renderTexture = RenderTexture.create({ width: size, height: size });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

function createDashTrailTexture(renderer: Renderer): Texture {
  const width = 64;
  const height = 16;
  const graphics = new Graphics();

  // Create trail effect with gradient
  for (let i = 0; i < width; i++) {
    const alpha = 1.0 - i / width;
    const lineHeight = height * (1.0 - i / (width * 2));
    graphics.rect(i, (height - lineHeight) / 2, 1, lineHeight);
    graphics.fill({ color: 0x00ffff, alpha: alpha * 0.6 });
  }

  const renderTexture = RenderTexture.create({ width, height });
  renderer.render({ container: graphics, target: renderTexture });
  graphics.destroy();

  return renderTexture;
}

// Export a function to preload all textures
export async function preloadTextures(renderer: Renderer): Promise<TextureAssets> {
  console.log('📦 Generating sprite textures...');
  const textures = await createTextures(renderer);
  console.log('✅ Textures generated successfully');
  return textures;
}