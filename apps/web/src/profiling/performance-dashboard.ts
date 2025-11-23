// RTS Arena - Performance Dashboard UI
import { profiler } from './profiler';

export class PerformanceDashboard {
  private container: HTMLDivElement;
  private visible = false;
  private updateInterval: number | null = null;

  // Canvas for FPS graph
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Graph settings
  private readonly graphWidth = 300;
  private readonly graphHeight = 100;
  private readonly graphHistory = 120; // 2 seconds at 60 FPS

  constructor() {
    this.container = this.createDashboard();
    this.canvas = this.container.querySelector('#perf-graph') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    // Set up keyboard toggle
    this.setupKeyboardToggle();
  }

  private createDashboard(): HTMLDivElement {
    const dashboard = document.createElement('div');
    dashboard.id = 'performance-dashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 350px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 15px;
      display: none;
      z-index: 10000;
      backdrop-filter: blur(10px);
    `;

    dashboard.innerHTML = `
      <style>
        #performance-dashboard h3 {
          margin: 0 0 10px 0;
          color: #0f9;
          font-size: 14px;
          border-bottom: 1px solid #333;
          padding-bottom: 5px;
        }

        #performance-dashboard .metric-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          padding: 3px 0;
        }

        #performance-dashboard .metric-label {
          color: #888;
        }

        #performance-dashboard .metric-value {
          color: #fff;
          font-weight: bold;
        }

        #performance-dashboard .warning {
          color: #ff9900;
        }

        #performance-dashboard .error {
          color: #ff3333;
        }

        #performance-dashboard .good {
          color: #00ff88;
        }

        #performance-dashboard .section {
          margin: 15px 0;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
        }

        #performance-dashboard .system-timing {
          margin: 3px 0;
          padding: 2px 5px;
          background: rgba(255, 255, 255, 0.05);
          border-left: 2px solid #0f9;
        }

        #performance-dashboard .bar {
          height: 4px;
          background: linear-gradient(90deg, #0f9 0%, #ff9900 80%, #ff3333 100%);
          margin: 2px 0;
        }

        #performance-dashboard canvas {
          border: 1px solid #333;
          margin: 10px 0;
        }

        #performance-dashboard .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          cursor: pointer;
          color: #666;
        }

        #performance-dashboard .close-btn:hover {
          color: #fff;
        }
      </style>

      <span class="close-btn" id="close-dashboard">✕</span>
      <h3>🎮 Performance Monitor</h3>

      <div class="section">
        <div class="metric-row">
          <span class="metric-label">FPS:</span>
          <span class="metric-value" id="perf-fps">--</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Min/Max:</span>
          <span class="metric-value" id="perf-fps-range">--/--</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Frame Time:</span>
          <span class="metric-value" id="perf-frame-time">-- ms</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">95th %ile:</span>
          <span class="metric-value" id="perf-p95">-- ms</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Entities:</span>
          <span class="metric-value" id="perf-entities">0</span>
        </div>
      </div>

      <canvas id="perf-graph" width="${this.graphWidth}" height="${this.graphHeight}"></canvas>

      <div class="section">
        <h3 style="font-size: 12px; margin: 0 0 5px 0;">System Timings (ms)</h3>
        <div id="system-timings"></div>
      </div>

      <div class="section">
        <h3 style="font-size: 12px; margin: 0 0 5px 0;">Memory</h3>
        <div class="metric-row">
          <span class="metric-label">Heap Used:</span>
          <span class="metric-value" id="perf-memory">-- MB</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Heap Total:</span>
          <span class="metric-value" id="perf-memory-total">-- MB</span>
        </div>
      </div>

      <div class="section" style="background: rgba(255, 100, 100, 0.1);">
        <div class="metric-row">
          <span class="metric-label">Frame Warnings:</span>
          <span class="metric-value warning" id="perf-warnings">0</span>
        </div>
      </div>

      <div style="margin-top: 10px; color: #666; font-size: 10px;">
        Press F3 or ~ to toggle
      </div>
    `;

    document.body.appendChild(dashboard);

    // Set up close button
    const closeBtn = dashboard.querySelector('#close-dashboard');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggle());
    }

    return dashboard;
  }

  private setupKeyboardToggle(): void {
    document.addEventListener('keydown', (e) => {
      // F3 or backtick
      if (e.key === 'F3' || e.key === '`') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  public toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';

    if (this.visible) {
      this.startUpdating();
    } else {
      this.stopUpdating();
    }
  }

  private startUpdating(): void {
    if (this.updateInterval) return;

    // Update dashboard every 100ms (10 times per second)
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 100);

    // Initial update
    this.update();
  }

  private stopUpdating(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private update(): void {
    const metrics = profiler.getMetrics();
    const p95 = profiler.get95thPercentileFrameTime();

    // Update FPS
    const fpsElement = document.getElementById('perf-fps')!;
    const fps = Math.round(metrics.fps.current);
    fpsElement.textContent = fps.toString();
    fpsElement.className = 'metric-value ' + (fps >= 55 ? 'good' : fps >= 30 ? 'warning' : 'error');

    // Update FPS range
    document.getElementById('perf-fps-range')!.textContent =
      `${Math.round(metrics.fps.min)}/${Math.round(metrics.fps.max)}`;

    // Update frame time
    const frameTimeElement = document.getElementById('perf-frame-time')!;
    const frameTime = metrics.frameTime.current;
    frameTimeElement.textContent = frameTime.toFixed(2);
    frameTimeElement.className = 'metric-value ' + (frameTime <= 16.67 ? 'good' : frameTime <= 33.33 ? 'warning' : 'error');

    // Update 95th percentile
    const p95Element = document.getElementById('perf-p95')!;
    p95Element.textContent = p95.toFixed(2);
    p95Element.className = 'metric-value ' + (p95 <= 16.67 ? 'good' : p95 <= 33.33 ? 'warning' : 'error');

    // Update entity count
    const entityCount = document.getElementById('entity-count')?.textContent || '0';
    document.getElementById('perf-entities')!.textContent = entityCount;

    // Update system timings
    const systemsDiv = document.getElementById('system-timings')!;
    systemsDiv.innerHTML = '';

    const sortedSystems = metrics.systems.sort((a, b) => b.time - a.time);
    sortedSystems.forEach(system => {
      const div = document.createElement('div');
      div.className = 'system-timing';

      const timeClass = system.time <= 2 ? 'good' : system.time <= 5 ? 'warning' : 'error';
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <span>${system.name}:</span>
          <span class="${timeClass}">${system.time.toFixed(2)}ms</span>
        </div>
        <div class="bar" style="width: ${Math.min(100, (system.time / 16.67) * 100)}%"></div>
      `;
      systemsDiv.appendChild(div);
    });

    // Update memory
    if (metrics.memory) {
      document.getElementById('perf-memory')!.textContent = metrics.memory.heapUsed.toFixed(1);
      document.getElementById('perf-memory-total')!.textContent = metrics.memory.heapTotal.toFixed(1);
    }

    // Update warnings
    document.getElementById('perf-warnings')!.textContent = metrics.frameTime.warnings.toString();

    // Draw FPS graph
    this.drawGraph(metrics.history.frames);
  }

  private drawGraph(frames: any[]): void {
    const ctx = this.ctx;
    const width = this.graphWidth;
    const height = this.graphHeight;

    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    if (frames.length < 2) return;

    // Get recent frames
    const recentFrames = frames.slice(-this.graphHistory);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    // Horizontal lines (60 FPS, 30 FPS)
    const y60fps = height - (60 / 100) * height;
    const y30fps = height - (30 / 100) * height;

    ctx.beginPath();
    ctx.moveTo(0, y60fps);
    ctx.lineTo(width, y60fps);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y30fps);
    ctx.lineTo(width, y30fps);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw FPS line
    ctx.strokeStyle = '#0f9';
    ctx.lineWidth = 2;
    ctx.beginPath();

    recentFrames.forEach((frame, i) => {
      const x = (i / (this.graphHistory - 1)) * width;
      const fps = Math.min(100, frame.fps);
      const y = height - (fps / 100) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText('60', 5, y60fps - 2);
    ctx.fillText('30', 5, y30fps - 2);
    ctx.fillText('0', 5, height - 2);
    ctx.fillText('100', 5, 12);
  }

  public show(): void {
    if (!this.visible) {
      this.toggle();
    }
  }

  public hide(): void {
    if (this.visible) {
      this.toggle();
    }
  }

  public destroy(): void {
    this.stopUpdating();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Global dashboard instance
export const dashboard = new PerformanceDashboard();