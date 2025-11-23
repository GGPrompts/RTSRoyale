// Stats Panel UI Component
import { Container, Graphics, Text } from 'pixi.js';
import { Application } from 'pixi.js';
import { GameWorld } from '@rts-arena/core';
import { Health, Team } from '@rts-arena/core';

export class StatsPanel {
  private container: Container;
  private background: Graphics;
  private blueTeamText: Text;
  private redTeamText: Text;
  private blueStatsText: Text;
  private redStatsText: Text;
  private phaseText: Text;

  constructor(app: Application) {
    this.container = new Container();
    this.container.position.set(10, 10);
    this.container.zIndex = 1000;

    // Create background
    this.background = new Graphics();
    this.background.roundRect(0, 0, 250, 120, 10);
    this.background.fill({ color: 0x000000, alpha: 0.7 });
    this.background.stroke({ color: 0x444444, width: 2 });

    // Team headers
    this.blueTeamText = new Text({
      text: 'BLUE TEAM',
      style: {
        fontSize: 16,
        fill: 0x4488ff,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
      },
    });
    this.blueTeamText.position.set(10, 10);

    this.redTeamText = new Text({
      text: 'RED TEAM',
      style: {
        fontSize: 16,
        fill: 0xff4444,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
      },
    });
    this.redTeamText.position.set(130, 10);

    // Stats text
    this.blueStatsText = new Text({
      text: '0 units\n0 HP',
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
      },
    });
    this.blueStatsText.position.set(10, 35);

    this.redStatsText = new Text({
      text: '0 units\n0 HP',
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
      },
    });
    this.redStatsText.position.set(130, 35);

    // Phase indicator
    this.phaseText = new Text({
      text: 'Phase: Normal',
      style: {
        fontSize: 14,
        fill: 0xffaa00,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
      },
    });
    this.phaseText.position.set(10, 85);

    // Add all elements to container
    this.container.addChild(this.background);
    this.container.addChild(this.blueTeamText);
    this.container.addChild(this.redTeamText);
    this.container.addChild(this.blueStatsText);
    this.container.addChild(this.redStatsText);
    this.container.addChild(this.phaseText);

    app.stage.addChild(this.container);
  }

  update(world: GameWorld) {
    // Calculate team stats
    let blueUnits = 0;
    let blueTotalHP = 0;
    let redUnits = 0;
    let redTotalHP = 0;

    // Iterate through all entities with Team and Health components
    const entities = world.entities;
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Check if entity has Team and Health components
      if (Team.id[eid] !== undefined && Health.current[eid] !== undefined) {
        if (Health.current[eid] > 0) { // Only count alive units
          if (Team.id[eid] === 0) {
            blueUnits++;
            blueTotalHP += Health.current[eid];
          } else if (Team.id[eid] === 1) {
            redUnits++;
            redTotalHP += Health.current[eid];
          }
        }
      }
    }

    // Update text
    this.blueStatsText.text = `${blueUnits} units\n${Math.floor(blueTotalHP)} HP`;
    this.redStatsText.text = `${redUnits} units\n${Math.floor(redTotalHP)} HP`;

    // Update phase
    let phaseText = 'Phase: Normal';
    let phaseColor = 0xffaa00;

    if (world.time >= 150) {
      phaseText = 'FINAL SHOWDOWN!';
      phaseColor = 0xff0000;
    } else if (world.time >= 145) {
      phaseText = 'Arena Collapsing';
      phaseColor = 0xff8800;
    } else if (world.time >= 120) {
      phaseText = 'Warning: 30s left';
      phaseColor = 0xffff00;
    }

    this.phaseText.text = phaseText;
    this.phaseText.style.fill = phaseColor;
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}