import { WIDTH, HEIGHT, DEPTH } from './constants.js';

export class Grid {
  constructor() {
    this.width = WIDTH;
    this.height = HEIGHT;
    this.depth = DEPTH;
    this.cells = new Uint8Array(WIDTH * HEIGHT * DEPTH);
    this.totalCells = WIDTH * HEIGHT * DEPTH;
  }

  idx(x, y, z) {
    return x + z * WIDTH + y * WIDTH * DEPTH;
  }

  inBounds(x, y, z) {
    return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && z >= 0 && z < DEPTH;
  }

  isOccupied(x, y, z) {
    return !this.inBounds(x, y, z) || this.cells[this.idx(x, y, z)] !== 0;
  }

  isValid(cells) {
    return cells.every((c) => this.inBounds(c.x, c.y, c.z) && this.cells[this.idx(c.x, c.y, c.z)] === 0);
  }

  lock(cells, typeId) {
    cells.forEach((c) => {
      this.cells[this.idx(c.x, c.y, c.z)] = typeId;
    });
  }

  isLayerFull(y) {
    for (let z = 0; z < DEPTH; z++) {
      for (let x = 0; x < WIDTH; x++) {
        if (this.cells[this.idx(x, y, z)] === 0) return false;
      }
    }
    return true;
  }

  clearFullLayers() {
    const cleared = [];
    for (let y = 0; y < this.height; y++) {
      if (this.isLayerFull(y)) cleared.push(y);
    }

    if (cleared.length === 0) return cleared;

    cleared.forEach((y) => {
      for (let z = 0; z < DEPTH; z++) {
        for (let x = 0; x < WIDTH; x++) {
          this.cells[this.idx(x, y, z)] = 0;
        }
      }
    });

    for (let z = 0; z < DEPTH; z++) {
      for (let x = 0; x < WIDTH; x++) {
        let writeY = 0;
        for (let y = 0; y < HEIGHT; y++) {
          const val = this.cells[this.idx(x, y, z)];
          if (val !== 0) {
            if (writeY !== y) {
              this.cells[this.idx(x, writeY, z)] = val;
              this.cells[this.idx(x, y, z)] = 0;
            }
            writeY++;
          }
        }
      }
    }

    return cleared;
  }

  getOccupiedCells() {
    const result = [];
    for (let y = 0; y < HEIGHT; y++) {
      for (let z = 0; z < DEPTH; z++) {
        for (let x = 0; x < WIDTH; x++) {
          const type = this.cells[this.idx(x, y, z)];
          if (type !== 0) result.push({ x, y, z, type });
        }
      }
    }
    return result;
  }

  clear() {
    this.cells.fill(0);
  }
}
