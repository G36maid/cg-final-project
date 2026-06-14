import test from 'node:test';
import assert from 'node:assert/strict';

import { COLORS, PIECE_TYPES } from '../src/core/constants.js';
import { Grid } from '../src/core/Grid.js';
import { Piece } from '../src/core/Piece.js';

test('Constructor sets type, color, spawn position, and type id', () => {
  const piece = new Piece('T');
  assert.equal(piece.type, 'T');
  assert.equal(piece.color, COLORS.T);
  assert.equal(piece.x, 4);
  assert.equal(piece.y, 19);
  assert.equal(piece.z, 4);
  assert.equal(piece.typeId, 3);
});

test('getCells returns absolute positions', () => {
  const piece = new Piece('O');
  assert.deepEqual(piece.getCells(), [
    { x: 4, y: 19, z: 4 },
    { x: 5, y: 19, z: 4 },
    { x: 4, y: 19, z: 5 },
    { x: 5, y: 19, z: 5 },
  ]);
});

test('tryMove succeeds in empty space', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  assert.equal(piece.tryMove(1, -1, grid), true);
  assert.equal(piece.x, 5);
  assert.equal(piece.z, 3);
});

test('tryMove is blocked by wall and reverts', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  piece.x = 8;
  assert.equal(piece.tryMove(1, 0, grid), false);
  assert.equal(piece.x, 8);
});

test('tryMove is blocked by occupied cell and reverts', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  grid.lock([{ x: 5, y: 19, z: 4 }], 1);
  assert.equal(piece.tryMove(1, 0, grid), false);
  assert.equal(piece.x, 4);
});

test('tryRotate rotates around Y clockwise and counter-clockwise', () => {
  const grid = new Grid();
  const piece = new Piece('T');
  assert.equal(piece.tryRotate('y', 1, grid), true);
  assert.deepEqual(piece.cells, [
    { x: 0, y: 0, z: -0 },
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 0, z: -2 },
    { x: 1, y: 0, z: -1 },
  ]);
  assert.equal(piece.tryRotate('y', -1, grid), true);
  assert.deepEqual(piece.cells, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
  ]);
});

test('tryRotate rotates around X clockwise and counter-clockwise', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  piece.y = 10;
  assert.equal(piece.tryRotate('x', 1, grid), true);
  assert.deepEqual(piece.cells, [
    { x: 0, y: -0, z: 0 },
    { x: 1, y: -0, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 1, y: -1, z: 0 },
  ]);
  assert.equal(piece.tryRotate('x', -1, grid), true);
  assert.deepEqual(piece.cells, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
  ]);
});

test('tryRotate rotates around Z clockwise and counter-clockwise', () => {
  const grid = new Grid();
  const piece = new Piece('I');
  piece.y = 10;
  assert.equal(piece.tryRotate('z', 1, grid), true);
  assert.deepEqual(piece.cells, [
    { x: -0, y: 0, z: 0 },
    { x: -0, y: 1, z: 0 },
    { x: -0, y: 2, z: 0 },
    { x: -0, y: 3, z: 0 },
  ]);
  assert.equal(piece.tryRotate('z', -1, grid), true);
  assert.deepEqual(piece.cells, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  ]);
});

test('tryRotate uses wall kicks when rotation initially hits a wall', () => {
  const grid = new Grid();
  const piece = new Piece('T');
  piece.z = 0;
  assert.equal(piece.tryRotate('y', 1, grid), true);
  assert.equal(piece.z, 2);
});

test('tryRotate reverts cells when rotation remains blocked', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  piece.y = 0;
  const before = piece.cells.map((cell) => ({ ...cell }));
  assert.equal(piece.tryRotate('x', 1, grid), false);
  assert.deepEqual(piece.cells, before);
});

test('tryDescend succeeds in empty space and is blocked at bottom', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  assert.equal(piece.tryDescend(grid), true);
  assert.equal(piece.y, 18);
  piece.y = 0;
  assert.equal(piece.tryDescend(grid), false);
  assert.equal(piece.y, 0);
});

test('getGhostY returns bottom position on an empty grid', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  assert.equal(piece.getGhostY(grid), 0);
  assert.deepEqual(piece.getGhostCells(grid), [
    { x: 4, y: 0, z: 4 },
    { x: 5, y: 0, z: 4 },
    { x: 4, y: 0, z: 5 },
    { x: 5, y: 0, z: 5 },
  ]);
});

test('getGhostY stops above blocks below the piece', () => {
  const grid = new Grid();
  const piece = new Piece('O');
  grid.lock([{ x: 4, y: 7, z: 4 }], 1);
  assert.equal(piece.getGhostY(grid), 8);
});

test('All 7 pieces can be created and their spawn cells are valid', () => {
  const grid = new Grid();
  for (const type of PIECE_TYPES) {
    const piece = new Piece(type);
    assert.equal(piece.type, type);
    assert.equal(piece.cells.length, 4);
    assert.equal(grid.isValid(piece.getCells()), true);
  }
});
