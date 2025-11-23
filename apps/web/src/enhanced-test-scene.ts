// Enhanced Test Scene with Visual Polish
import { Application, Graphics, Container, filters } from 'pixi.js';
import { addEntity } from 'bitecs';
import { Position, Velocity, Health, Team, Sprite } from '@rts-arena/core';
import { GameWorld } from '@rts-arena/core';
import { ParticleEmitter, ParticleType } from './particles';
import { ScreenEffects } from './screen-effects';
import { StatsPanel } from './ui/stats-panel';
import { Minimap } from './ui/minimap';
import { AbilityBar } from './ui/ability-bar';

// Unit types
enum UnitType {
  AGGRESSIVE = 0,  // Triangle
  TANK = 1,        // Square
  BALANCED = 2,    // Circle
}

// Enhanced unit visual
class UnitVisual extends Container {
  private body: Graphics;
  private outline: Graphics;
  private shadow: Graphics;
  private healthBar: Graphics;
  private selectionRing: Graphics;

  public teamId: number;
  public unitType: UnitType;
  public maxHealth: number = 100;
  public currentHealth: number = 100;
  public isSelected: boolean = false;

  constructor(teamId: number, unitType: UnitType) {
    super();

    this.teamId = teamId;
    this.unitType = unitType;

    // Create shadow (bottom layer)
    this.shadow = new Graphics();
    this.drawShadow();
    this.shadow.alpha = 0.3;
    this.shadow.position.y = 3;

    // Create selection ring
    this.selectionRing = new Graphics();
    this.selectionRing.circle(0, 0, 25);
    this.selectionRing.stroke({ color: 0xffff00, width: 2, alpha: 0.8 });
    this.selectionRing.visible = false;

    // Create main body
    this.body = new Graphics();
    this.drawBody();

    // Create outline
    this.outline = new Graphics();
    this.drawOutline();

    // Create health bar
    this.healthBar = new Graphics();
    this.healthBar.position.y = -30;
    this.updateHealthBar();

    // Add all components in order
    this.addChild(this.shadow);
    this.addChild(this.selectionRing);
    this.addChild(this.body);
    this.addChild(this.outline);
    this.addChild(this.healthBar);
  }

  private drawShadow() {
    this.shadow.clear();
    this.shadow.ellipse(0, 0, 22, 10);
    this.shadow.fill({ color: 0x000000 });
  }

  private drawBody() {
    this.body.clear();
    const color = this.teamId === 0 ? 0x4488ff : 0xff4444;

    switch (this.unitType) {
      case UnitType.AGGRESSIVE:
        // Triangle
        this.body.moveTo(0, -20);
        this.body.lineTo(-17, 15);
        this.body.lineTo(17, 15);
        this.body.closePath();
        break;

      case UnitType.TANK:
        // Square
        this.body.rect(-18, -18, 36, 36);
        break;

      case UnitType.BALANCED:
        // Circle
        this.body.circle(0, 0, 20);
        break;
    }

    this.body.fill({ color, alpha: 0.9 });
  }

  private drawOutline() {
    this.outline.clear();
    const color = this.teamId === 0 ? 0x6699ff : 0xff6666;

    switch (this.unitType) {
      case UnitType.AGGRESSIVE:
        this.outline.moveTo(0, -20);
        this.outline.lineTo(-17, 15);
        this.outline.lineTo(17, 15);
        this.outline.closePath();
        break;

      case UnitType.TANK:
        this.outline.rect(-18, -18, 36, 36);
        break;

      case UnitType.BALANCED:
        this.outline.circle(0, 0, 20);
        break;
    }

    this.outline.stroke({ color, width: 3 });
  }

  public updateHealthBar() {
    this.healthBar.clear();

    // Don't show health bar if at full health
    if (this.currentHealth >= this.maxHealth) {
      this.healthBar.visible = false;
      return;
    }

    this.healthBar.visible = true;

    // Background
    this.healthBar.rect(-20, 0, 40, 4);
    this.healthBar.fill({ color: 0x000000, alpha: 0.5 });

    // Health fill
    const healthPercent = this.currentHealth / this.maxHealth;
    const healthWidth = 40 * healthPercent;
    const healthColor = healthPercent > 0.5 ? 0x00ff00 :
                        healthPercent > 0.25 ? 0xffaa00 : 0xff0000;

    this.healthBar.rect(-20, 0, healthWidth, 4);
    this.healthBar.fill({ color: healthColor });
  }

  public setHealth(current: number, max: number) {
    this.currentHealth = current;
    this.maxHealth = max;
    this.updateHealthBar();
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.selectionRing.visible = selected;
  }

  public pulse() {
    // Quick scale animation for hit feedback
    this.scale.set(1.2);
    const ticker = setInterval(() => {
      this.scale.x = Math.max(1, this.scale.x - 0.05);
      this.scale.y = Math.max(1, this.scale.y - 0.05);
      if (this.scale.x <= 1) {
        clearInterval(ticker);
      }
    }, 16);
  }
}

// Enhanced test scene
export class EnhancedTestScene {
  private app: Application;
  private world: GameWorld;
  private unitVisuals: Map<number, UnitVisual> = new Map();

  // Visual systems
  private particleEmitter: ParticleEmitter;
  private screenEffects: ScreenEffects;
  private statsPanel: StatsPanel;
  private minimap: Minimap;
  private abilityBar: AbilityBar;

  // Layers
  private gameLayer: Container;
  private uiLayer: Container;

  // Demo state
  private lastHealthValues: Map<number, number> = new Map();
  private selectedUnit: number | null = null;

  constructor(world: GameWorld, app: Application) {
    this.world = world;
    this.app = app;

    // Create layers
    this.gameLayer = new Container();
    this.gameLayer.sortableChildren = true;
    this.uiLayer = new Container();
    this.uiLayer.sortableChildren = true;

    app.stage.addChild(this.gameLayer);
    app.stage.addChild(this.uiLayer);

    // Initialize visual systems
    this.particleEmitter = new ParticleEmitter(app);
    this.screenEffects = new ScreenEffects(app);
    this.statsPanel = new StatsPanel(app);
    this.minimap = new Minimap(app);
    this.abilityBar = new AbilityBar(app);

    // Setup minimap camera pan
    this.minimap.setOnClickCallback((worldX, worldY) => {
      // Center camera on clicked position
      const centerX = app.screen.width / 2;
      const centerY = app.screen.height / 2;
      this.gameLayer.position.x = centerX - worldX;
      this.gameLayer.position.y = centerY - worldY;
    });

    // Initialize units
    this.initializeUnits();

    // Setup keyboard controls
    this.setupKeyboardControls();

    // Start update loop
    app.ticker.add((ticker) => {
      const deltaTime = ticker.deltaTime / 60; // Convert to seconds
      this.update(deltaTime);
    });

    console.log('✨ Enhanced test scene initialized with visual polish!');
  }

  private initializeUnits() {
    console.log('🎬 Spawning enhanced units...');

    // Spawn blue team units
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(this.world);

      Position.x[eid] = 200 + i * 50;
      Position.y[eid] = 300;

      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      Health.current[eid] = 100;
      Health.max[eid] = 100;

      Team.id[eid] = 0; // Blue team

      Sprite.textureId[eid] = 0;
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = 0;

      // Create enhanced visual
      const unitType = i % 3 as UnitType;
      const visual = new UnitVisual(0, unitType);
      visual.x = Position.x[eid];
      visual.y = Position.y[eid];
      visual.zIndex = visual.y; // Depth sorting
      this.gameLayer.addChild(visual);
      this.unitVisuals.set(eid, visual);

      // Store initial health
      this.lastHealthValues.set(eid, 100);

      // Spawn effect
      this.particleEmitter.emit(ParticleType.SHIELD, visual.x, visual.y, 0x4488ff);
    }

    // Spawn red team units
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(this.world);

      Position.x[eid] = 1720 - i * 50;
      Position.y[eid] = 780;

      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      Health.current[eid] = 100;
      Health.max[eid] = 100;

      Team.id[eid] = 1; // Red team

      Sprite.textureId[eid] = 1;
      Sprite.scaleX[eid] = 1.0;
      Sprite.scaleY[eid] = 1.0;
      Sprite.rotation[eid] = 0;

      // Create enhanced visual
      const unitType = i % 3 as UnitType;
      const visual = new UnitVisual(1, unitType);
      visual.x = Position.x[eid];
      visual.y = Position.y[eid];
      visual.zIndex = visual.y;
      this.gameLayer.addChild(visual);
      this.unitVisuals.set(eid, visual);

      // Store initial health
      this.lastHealthValues.set(eid, 100);

      // Spawn effect
      this.particleEmitter.emit(ParticleType.SHIELD, visual.x, visual.y, 0xff4444);
    }

    console.log(`✅ Spawned ${this.unitVisuals.size} enhanced units`);
  }

  private setupKeyboardControls() {
    window.addEventListener('keydown', (event) => {
      // Handle ability keys
      if (this.abilityBar.handleKeyPress(event.key)) {
        // Ability was used, trigger effects
        this.handleAbilityUse(event.key);
        return;
      }

      // Other controls
      switch (event.key) {
        case '1':
          // Test hit effect
          this.testHitEffect();
          break;
        case '2':
          // Test death effect
          this.testDeathEffect();
          break;
        case '3':
          // Test final showdown
          this.screenEffects.showdownZoom();
          break;
        case ' ':
          // Pause/resume
          this.app.ticker.stop();
          setTimeout(() => this.app.ticker.start(), 1000);
          break;
      }
    });
  }

  private handleAbilityUse(key: string) {
    const keyLower = key.toLowerCase();

    if (this.selectedUnit !== null && this.unitVisuals.has(this.selectedUnit)) {
      const visual = this.unitVisuals.get(this.selectedUnit)!;

      switch (keyLower) {
        case 'q':
          // Dash ability
          this.particleEmitter.emitDirectional(
            ParticleType.DASH,
            visual.x,
            visual.y,
            Math.random() * Math.PI * 2
          );
          this.screenEffects.abilityActivated('dash');
          break;

        case 'w':
          // Shield ability
          this.particleEmitter.emit(ParticleType.SHIELD, visual.x, visual.y);
          this.screenEffects.abilityActivated('shield');
          visual.pulse();
          break;

        case 'e':
          // Power ability
          this.particleEmitter.emit(ParticleType.EXPLOSION, visual.x, visual.y);
          this.screenEffects.abilityActivated('ultimate');
          break;
      }
    }
  }

  private testHitEffect() {
    // Test hit on random unit
    const units = Array.from(this.unitVisuals.values());
    if (units.length > 0) {
      const unit = units[Math.floor(Math.random() * units.length)];
      this.particleEmitter.emit(ParticleType.HIT, unit.x, unit.y);
      this.screenEffects.unitHit();
      unit.pulse();

      // Simulate damage
      unit.setHealth(unit.currentHealth - 20, unit.maxHealth);
    }
  }

  private testDeathEffect() {
    // Test death on random unit
    const units = Array.from(this.unitVisuals.values());
    if (units.length > 0) {
      const unit = units[Math.floor(Math.random() * units.length)];
      this.particleEmitter.emit(ParticleType.DEATH, unit.x, unit.y);
      this.screenEffects.unitDeath();

      // Remove unit visual
      this.gameLayer.removeChild(unit);
    }
  }

  private update(deltaTime: number) {
    // Update unit positions and check for changes
    this.unitVisuals.forEach((visual, eid) => {
      // Update position
      visual.x = Position.x[eid];
      visual.y = Position.y[eid];
      visual.zIndex = visual.y; // Update depth sorting

      // Check health changes
      const currentHealth = Health.current[eid];
      const lastHealth = this.lastHealthValues.get(eid) || currentHealth;

      if (currentHealth < lastHealth) {
        // Unit took damage
        this.particleEmitter.emit(ParticleType.HIT, visual.x, visual.y);
        visual.pulse();

        // Small screen shake on hit
        if (Math.random() > 0.7) {
          this.screenEffects.hitShake();
        }
      }

      if (currentHealth <= 0 && lastHealth > 0) {
        // Unit died
        this.particleEmitter.emit(ParticleType.DEATH, visual.x, visual.y);
        this.screenEffects.unitDeath();

        // Remove visual
        this.gameLayer.removeChild(visual);
        this.unitVisuals.delete(eid);
      } else {
        // Update health bar
        visual.setHealth(currentHealth, Health.max[eid]);
      }

      this.lastHealthValues.set(eid, currentHealth);
    });

    // Update visual systems
    this.particleEmitter.update(deltaTime);
    this.screenEffects.update(deltaTime);
    this.statsPanel.update(this.world);
    this.minimap.update(this.world);
    this.abilityBar.update(deltaTime);
  }

  public destroy() {
    this.unitVisuals.forEach(visual => visual.destroy());
    this.unitVisuals.clear();
    this.particleEmitter.clear();
    this.screenEffects.reset();
    this.statsPanel.destroy();
    this.minimap.destroy();
    this.abilityBar.destroy();
    this.gameLayer.destroy({ children: true });
    this.uiLayer.destroy({ children: true });
  }
}