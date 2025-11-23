import { PerformanceMonitor } from '../profiling/performanceMonitor';

export class PerformanceDashboard {
  private monitor: PerformanceMonitor;
  private container: HTMLDivElement;
  private fpsElement: HTMLDivElement;
  private frameTimeElement: HTMLDivElement;
  private entityCountElement: HTMLDivElement;
  private systemTimingsElement: HTMLDivElement;
  private fpsGraphCanvas: HTMLCanvasElement;
  private fpsGraphCtx: CanvasRenderingContext2D;
  private fpsHistory: number[] = [];
  private updateInterval: number;

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
    this.container = this.createDashboard();
    document.body.appendChild(this.container);

    this.fpsElement = document.getElementById('perf-fps') as HTMLDivElement;
    this.frameTimeElement = document.getElementById('perf-frametime') as HTMLDivElement;
    this.entityCountElement = document.getElementById('perf-entities') as HTMLDivElement;
    this.systemTimingsElement = document.getElementById('perf-systems') as HTMLDivElement;

    this.fpsGraphCanvas = document.getElementById('perf-graph') as HTMLCanvasElement;
    this.fpsGraphCtx = this.fpsGraphCanvas.getContext('2d')!;

    // Update every 100ms
    this.updateInterval = window.setInterval(() => this.update(), 100);
  }

  private createDashboard(): HTMLDivElement {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '10px';
    div.style.right = '10px';
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    div.style.color = 'white';
    div.style.padding = '10px';
    div.style.fontFamily = 'monospace';
    div.style.fontSize = '12px';
    div.style.borderRadius = '5px';
    div.style.minWidth = '250px';
    div.style.zIndex = '10000';

    div.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Performance Monitor</div>
      <canvas id="perf-graph" width="250" height="60" style="background: #111; display: block; margin: 5px 0;"></canvas>
      <div id="perf-fps"></div>
      <div id="perf-frametime"></div>
      <div id="perf-entities"></div>
      <div style="margin-top: 10px; font-weight: bold;">System Timings:</div>
      <div id="perf-systems" style="max-height: 200px; overflow-y: auto;"></div>
    `;

    return div;
  }

  private update() {
    const metrics = this.monitor.getMetrics();

    // Update FPS
    this.fpsElement.textContent = `FPS: ${metrics.fps.current.toFixed(1)} (min: ${metrics.fps.min.toFixed(1)}, max: ${metrics.fps.max.toFixed(1)})`;
    this.fpsElement.style.color = metrics.fps.current < 55 ? '#ff4444' : (metrics.fps.current < 58 ? '#ffaa44' : '#44ff44');

    // Update frame time
    this.frameTimeElement.textContent = `Frame: ${metrics.frameTime.current.toFixed(2)}ms (avg: ${metrics.frameTime.avg.toFixed(2)}ms)`;
    this.frameTimeElement.style.color = metrics.frameTime.current > 16.6 ? '#ff4444' : '#44ff44';

    // Update entity count
    this.entityCountElement.textContent = `Entities: ${metrics.entityCount}`;

    // Update system timings
    let systemsHTML = '';
    for (const timing of metrics.systemTimings.slice(0, 10)) {
      const color = timing.duration > 5 ? '#ff4444' : (timing.duration > 2 ? '#ffaa44' : '#44ff44');
      systemsHTML += `<div style="color: ${color};">${timing.name}: ${timing.duration.toFixed(2)}ms</div>`;
    }
    this.systemTimingsElement.innerHTML = systemsHTML;

    // Update FPS graph
    this.fpsHistory.push(metrics.fps.current);
    if (this.fpsHistory.length > 100) {
      this.fpsHistory.shift();
    }
    this.drawFPSGraph();
  }

  private drawFPSGraph() {
    const ctx = this.fpsGraphCtx;
    const width = this.fpsGraphCanvas.width;
    const height = this.fpsGraphCanvas.height;

    // Clear
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    // Draw 60 FPS line
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(0, height - (60 / 70) * height);
    ctx.lineTo(width, height - (60 / 70) * height);
    ctx.stroke();

    // Draw FPS curve
    ctx.strokeStyle = '#44ff44';
    ctx.beginPath();

    for (let i = 0; i < this.fpsHistory.length; i++) {
      const x = (i / 100) * width;
      const y = height - (this.fpsHistory[i] / 70) * height; // Scale to 0-70 FPS

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  toggle() {
    this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none';
  }

  destroy() {
    clearInterval(this.updateInterval);
    this.container.remove();
  }
}
