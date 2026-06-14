import { WIDTH, HEIGHT, DEPTH, PIECE_TYPES, COLORS } from './constants.js';
import { PIECES, rotateCells } from './pieces.js';

export class Piece {
  constructor(type) {
    if (!PIECES[type]) throw new Error(`Unknown piece type: ${type}`);

    this.type = type;
    this.color = COLORS[type];
    this.x = Math.floor(WIDTH / 2) - 1;
    this.y = HEIGHT - 1;
    this.z = Math.floor(DEPTH / 2) - 1;
    this.cells = PIECES[type].cells.map((c) => ({ ...c }));
    this.typeId = PIECE_TYPES.indexOf(type) + 1;
  }

  getCells() {
    return this.cells.map((c) => ({ x: c.x + this.x, y: c.y + this.y, z: c.z + this.z }));
  }

  tryMove(dx, dz, grid) {
    this.x += dx;
    this.z += dz;

    if (grid.isValid(this.getCells())) return true;

    this.x -= dx;
    this.z -= dz;
    return false;
  }

  tryRotate(axis, dir, grid) {
    const oldCells = this.cells.map((c) => ({ ...c }));
    const oldX = this.x;
    const oldZ = this.z;

    this.cells = rotateCells(this.cells, axis, dir);
    if (grid.isValid(this.getCells())) return true;

    const kicks = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
    for (const [kx, kz] of kicks) {
      this.x += kx;
      this.z += kz;
      if (grid.isValid(this.getCells())) return true;
      this.x -= kx;
      this.z -= kz;
    }

    this.cells = oldCells;
    this.x = oldX;
    this.z = oldZ;
    return false;
  }

  tryDescend(grid) {
    this.y -= 1;

    if (grid.isValid(this.getCells())) return true;

    this.y += 1;
    return false;
  }

  getGhostY(grid) {
    let ghostY = this.y;

    while (true) {
      ghostY--;
      const cells = this.cells.map((c) => ({ x: c.x + this.x, y: c.y + ghostY, z: c.z + this.z }));
      if (!grid.isValid(cells)) return ghostY + 1;
    }
  }

  getGhostCells(grid) {
    const ghostY = this.getGhostY(grid);
    return this.cells.map((c) => ({ x: c.x + this.x, y: c.y + ghostY, z: c.z + this.z }));
  }
}
