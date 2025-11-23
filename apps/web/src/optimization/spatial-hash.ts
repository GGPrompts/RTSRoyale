// RTS Arena - Spatial Hash Grid
// Efficient spatial partitioning for collision detection and range queries
// Converts O(n²) collision checks to nearly O(n)

export interface SpatialEntity {
  id: number;
  x: number;
  y: number;
  radius?: number; // Optional bounding radius
}

export class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, Set<number>>;
  private entities: Map<number, SpatialEntity>;
  private worldWidth: number;
  private worldHeight: number;

  // Statistics
  private stats = {
    entities: 0,
    cells: 0,
    queries: 0,
    comparisons: 0,
    avgEntitiesPerCell: 0
  };

  constructor(
    cellSize: number = 100,
    worldWidth: number = 2000,
    worldHeight: number = 1200
  ) {
    this.cellSize = cellSize;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.grid = new Map();
    this.entities = new Map();
  }

  // Hash function to get cell key from position
  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  // Get all cell keys that an entity occupies (considering radius)
  private getCellKeys(entity: SpatialEntity): string[] {
    const keys: string[] = [];
    const radius = entity.radius || 0;

    const minX = Math.floor((entity.x - radius) / this.cellSize);
    const maxX = Math.floor((entity.x + radius) / this.cellSize);
    const minY = Math.floor((entity.y - radius) / this.cellSize);
    const maxY = Math.floor((entity.y + radius) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        keys.push(`${x},${y}`);
      }
    }

    return keys;
  }

  // Insert an entity into the spatial hash
  public insert(entity: SpatialEntity): void {
    // Remove if already exists (for updates)
    if (this.entities.has(entity.id)) {
      this.remove(entity.id);
    }

    // Store entity reference
    this.entities.set(entity.id, entity);

    // Add to all relevant cells
    const keys = this.getCellKeys(entity);
    keys.forEach(key => {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(entity.id);
    });

    this.updateStats();
  }

  // Update an entity's position
  public update(id: number, x: number, y: number): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    // Get old cell keys
    const oldKeys = this.getCellKeys(entity);

    // Update position
    entity.x = x;
    entity.y = y;

    // Get new cell keys
    const newKeys = this.getCellKeys(entity);

    // If keys haven't changed, we're done
    if (this.arraysEqual(oldKeys, newKeys)) return;

    // Remove from old cells
    oldKeys.forEach(key => {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(id);
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
    });

    // Add to new cells
    newKeys.forEach(key => {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(id);
    });

    this.updateStats();
  }

  // Remove an entity from the spatial hash
  public remove(id: number): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    // Remove from all cells
    const keys = this.getCellKeys(entity);
    keys.forEach(key => {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(id);
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
    });

    // Remove entity reference
    this.entities.delete(id);
    this.updateStats();
  }

  // Query entities within a radius of a point
  public queryRadius(x: number, y: number, radius: number): number[] {
    const results: Set<number> = new Set();
    this.stats.queries++;

    // Calculate which cells to check
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    // Check each cell
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);

        if (cell) {
          // Check each entity in the cell
          cell.forEach(id => {
            const entity = this.entities.get(id);
            if (!entity) return;

            this.stats.comparisons++;

            // Actual distance check
            const dx = entity.x - x;
            const dy = entity.y - y;
            const distSq = dx * dx + dy * dy;
            const checkRadius = radius + (entity.radius || 0);

            if (distSq <= checkRadius * checkRadius) {
              results.add(id);
            }
          });
        }
      }
    }

    return Array.from(results);
  }

  // Query entities within a rectangle
  public queryRect(x: number, y: number, width: number, height: number): number[] {
    const results: Set<number> = new Set();
    this.stats.queries++;

    const minX = Math.floor(x / this.cellSize);
    const maxX = Math.floor((x + width) / this.cellSize);
    const minY = Math.floor(y / this.cellSize);
    const maxY = Math.floor((y + height) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);

        if (cell) {
          cell.forEach(id => {
            const entity = this.entities.get(id);
            if (!entity) return;

            this.stats.comparisons++;

            // Check if entity is within rectangle (considering radius)
            const radius = entity.radius || 0;
            if (entity.x + radius >= x &&
                entity.x - radius <= x + width &&
                entity.y + radius >= y &&
                entity.y - radius <= y + height) {
              results.add(id);
            }
          });
        }
      }
    }

    return Array.from(results);
  }

  // Get potential collisions for an entity
  public getPotentialCollisions(id: number): number[] {
    const entity = this.entities.get(id);
    if (!entity) return [];

    const results: Set<number> = new Set();
    const keys = this.getCellKeys(entity);

    keys.forEach(key => {
      const cell = this.grid.get(key);
      if (cell) {
        cell.forEach(otherId => {
          if (otherId !== id) {
            results.add(otherId);
          }
        });
      }
    });

    return Array.from(results);
  }

  // Get all entities in view frustum (for culling)
  public queryViewFrustum(
    viewX: number,
    viewY: number,
    viewWidth: number,
    viewHeight: number
  ): number[] {
    return this.queryRect(viewX, viewY, viewWidth, viewHeight);
  }

  // Clear all entities
  public clear(): void {
    this.grid.clear();
    this.entities.clear();
    this.updateStats();
  }

  // Utility: Check if two arrays are equal
  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = a.sort();
    const sortedB = b.sort();
    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
  }

  // Update statistics
  private updateStats(): void {
    this.stats.entities = this.entities.size;
    this.stats.cells = this.grid.size;

    // Calculate average entities per cell
    if (this.grid.size > 0) {
      let total = 0;
      this.grid.forEach(cell => {
        total += cell.size;
      });
      this.stats.avgEntitiesPerCell = total / this.grid.size;
    } else {
      this.stats.avgEntitiesPerCell = 0;
    }
  }

  // Get statistics
  public getStats() {
    return { ...this.stats };
  }

  // Debug: Visualize grid (returns cell bounds for rendering)
  public getGridVisualization(): Array<{ x: number; y: number; width: number; height: number; count: number }> {
    const cells: Array<{ x: number; y: number; width: number; height: number; count: number }> = [];

    this.grid.forEach((entityIds, key) => {
      const [x, y] = key.split(',').map(Number);
      cells.push({
        x: x * this.cellSize,
        y: y * this.cellSize,
        width: this.cellSize,
        height: this.cellSize,
        count: entityIds.size
      });
    });

    return cells;
  }

  // Optimize cell size based on entity density
  public optimizeCellSize(): number {
    if (this.entities.size === 0) return this.cellSize;

    // Calculate average entity size/radius
    let totalRadius = 0;
    let count = 0;
    this.entities.forEach(entity => {
      totalRadius += entity.radius || 20; // Default radius
      count++;
    });
    const avgRadius = totalRadius / count;

    // Optimal cell size is typically 2-4x the average entity size
    const optimalSize = avgRadius * 3;

    // Round to nearest 50 for cleaner numbers
    return Math.round(optimalSize / 50) * 50;
  }

  // Rebuild grid with new cell size
  public rebuild(newCellSize?: number): void {
    if (newCellSize) {
      this.cellSize = newCellSize;
    }

    // Store current entities
    const currentEntities = Array.from(this.entities.values());

    // Clear grid
    this.grid.clear();

    // Re-insert all entities
    currentEntities.forEach(entity => {
      const keys = this.getCellKeys(entity);
      keys.forEach(key => {
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key)!.add(entity.id);
      });
    });

    this.updateStats();
  }
}

// Global spatial hash instance for the game
export const spatialHash = new SpatialHashGrid(100, 1920, 1080);

// Utility functions for common queries
export const spatialQueries = {
  // Find nearest entity to a point
  findNearest(x: number, y: number, maxRadius: number = 500): SpatialEntity | null {
    const nearby = spatialHash.queryRadius(x, y, maxRadius);
    if (nearby.length === 0) return null;

    let nearest: SpatialEntity | null = null;
    let minDistSq = maxRadius * maxRadius;

    nearby.forEach(id => {
      const entity = spatialHash['entities'].get(id);
      if (!entity) return;

      const dx = entity.x - x;
      const dy = entity.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = entity;
      }
    });

    return nearest;
  },

  // Find all entities within range of another entity
  findInRange(entityId: number, range: number): number[] {
    const entity = spatialHash['entities'].get(entityId);
    if (!entity) return [];

    return spatialHash.queryRadius(entity.x, entity.y, range)
      .filter(id => id !== entityId);
  },

  // Check if two entities are within range
  inRange(id1: number, id2: number, range: number): boolean {
    const e1 = spatialHash['entities'].get(id1);
    const e2 = spatialHash['entities'].get(id2);
    if (!e1 || !e2) return false;

    const dx = e1.x - e2.x;
    const dy = e1.y - e2.y;
    const distSq = dx * dx + dy * dy;
    const checkRange = range + (e1.radius || 0) + (e2.radius || 0);

    return distSq <= checkRange * checkRange;
  }
};