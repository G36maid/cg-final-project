import test from 'node:test';
import assert from 'node:assert/strict';

import { WIDTH, HEIGHT, DEPTH } from '../src/core/constants.js';
import { Grid } from '../src/core/Grid.js';

function fillLayer(grid, y, typeId = 1, skip = null) {
  for (let z = 0; z < DEPTH; z++) {
    for (let x = 0; x < WIDTH; x++) {
      if (skip && skip.x === x && skip.z === z) continue;
      grid.lock([{ x, y, z }], typeId);
    }
  }
}

test('Grid constructor creates correct-sized array', () => {
  const grid = new Grid();
  assert.equal(grid.width, WIDTH);
  assert.equal(grid.height, HEIGHT);
  assert.equal(grid.depth, DEPTH);
  assert.equal(grid.totalCells, WIDTH * HEIGHT * DEPTH);
  assert.equal(grid.cells.length, WIDTH * HEIGHT * DEPTH);
});

test('inBounds accepts valid corners and rejects out-of-range cells', () => {
  const grid = new Grid();
  assert.equal(grid.inBounds(0, 0, 0), true);
  assert.equal(grid.inBounds(WIDTH - 1, HEIGHT - 1, DEPTH - 1), true);
  assert.equal(grid.inBounds(-1, 0, 0), false);
  assert.equal(grid.inBounds(WIDTH, 0, 0), false);
  assert.equal(grid.inBounds(0, HEIGHT, 0), false);
  assert.equal(grid.inBounds(0, 0, DEPTH), false);
});

test('isOccupied is false for empty cells and true after lock', () => {
  const grid = new Grid();
  assert.equal(grid.isOccupied(1, 2, 3), false);
  grid.lock([{ x: 1, y: 2, z: 3 }], 4);
  assert.equal(grid.isOccupied(1, 2, 3), true);
  assert.equal(grid.isOccupied(-1, 2, 3), true);
});

test('isValid accepts empty space and rejects collisions or out-of-bounds cells', () => {
  const grid = new Grid();
  const cells = [{ x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }];
  assert.equal(grid.isValid(cells), true);
  grid.lock([{ x: 2, y: 1, z: 1 }], 1);
  assert.equal(grid.isValid(cells), false);
  assert.equal(grid.isValid([{ x: WIDTH, y: 1, z: 1 }]), false);
});

test('lock stores cells with the correct type id', () => {
  const grid = new Grid();
  grid.lock([{ x: 3, y: 4, z: 5 }, { x: 4, y: 4, z: 5 }], 6);
  assert.equal(grid.cells[grid.idx(3, 4, 5)], 6);
  assert.equal(grid.cells[grid.idx(4, 4, 5)], 6);
});

test('isLayerFull detects empty, partial, and full layers', () => {
  const grid = new Grid();
  assert.equal(grid.isLayerFull(0), false);
  fillLayer(grid, 0, 1, { x: 9, z: 9 });
  assert.equal(grid.isLayerFull(0), false);
  grid.lock([{ x: 9, y: 0, z: 9 }], 1);
  assert.equal(grid.isLayerFull(0), true);
});

test('clearFullLayers clears a single layer and compacts cells downward', () => {
  const grid = new Grid();
  fillLayer(grid, 0, 1);
  grid.lock([{ x: 4, y: 2, z: 4 }], 7);

  assert.deepEqual(grid.clearFullLayers(), [0]);
  assert.equal(grid.isLayerFull(0), false);
  assert.equal(grid.cells[grid.idx(4, 0, 4)], 7);
  assert.equal(grid.cells[grid.idx(4, 2, 4)], 0);
});

test('clearFullLayers clears multiple layers and compacts remaining cells', () => {
  const grid = new Grid();
  fillLayer(grid, 0, 1);
  fillLayer(grid, 2, 2);
  grid.lock([{ x: 5, y: 4, z: 5 }], 3);

  assert.deepEqual(grid.clearFullLayers(), [0, 2]);
  assert.equal(grid.cells[grid.idx(5, 0, 5)], 3);
  assert.equal(grid.cells[grid.idx(5, 4, 5)], 0);
});

test('clearFullLayers returns no layers when none are full', () => {
  const grid = new Grid();
  grid.lock([{ x: 0, y: 0, z: 0 }], 1);
  assert.deepEqual(grid.clearFullLayers(), []);
  assert.equal(grid.cells[grid.idx(0, 0, 0)], 1);
});

test('getOccupiedCells returns occupied cells with their type', () => {
  const grid = new Grid();
  grid.lock([{ x: 1, y: 2, z: 3 }], 4);
  grid.lock([{ x: 2, y: 2, z: 3 }], 5);
  assert.deepEqual(grid.getOccupiedCells(), [
    { x: 1, y: 2, z: 3, type: 4 },
    { x: 2, y: 2, z: 3, type: 5 },
  ]);
});
