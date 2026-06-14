import test from 'node:test';
import assert from 'node:assert/strict';

import { Score } from '../src/core/Score.js';

test('Initial state starts at zero score, zero lines, and level 1', () => {
  const score = new Score();
  assert.equal(score.score, 0);
  assert.equal(score.lines, 0);
  assert.equal(score.level, 1);
});

test('dropInterval decreases by level and respects the floor', () => {
  const score = new Score();
  assert.equal(score.dropInterval, 1000);
  score.level = 2;
  assert.equal(score.dropInterval, 950);
  score.level = 17;
  assert.equal(score.dropInterval, 200);
  score.level = 20;
  assert.equal(score.dropInterval, 200);
});

test('addClear(1) at level 1 scores 100 points', () => {
  const score = new Score();
  score.addClear(1);
  assert.equal(score.score, 100);
  assert.equal(score.lines, 1);
});

test('addClear(4) at level 1 scores 800 points', () => {
  const score = new Score();
  score.addClear(4);
  assert.equal(score.score, 800);
  assert.equal(score.lines, 4);
});

test('addClear(2) at level 3 scores 900 points', () => {
  const score = new Score();
  score.level = 3;
  score.addClear(2);
  assert.equal(score.score, 900);
  assert.equal(score.lines, 2);
});

test('level increases after every 10 cleared layers', () => {
  const score = new Score();
  score.addClear(4);
  score.addClear(4);
  assert.equal(score.level, 1);
  score.addClear(2);
  assert.equal(score.lines, 10);
  assert.equal(score.level, 2);
});

test('addHardDrop awards 2 points per cell', () => {
  const score = new Score();
  score.addHardDrop(10);
  assert.equal(score.score, 20);
});

test('addSoftDrop awards 1 point per cell', () => {
  const score = new Score();
  score.addSoftDrop(10);
  assert.equal(score.score, 10);
});

test('reset clears score, lines, and level', () => {
  const score = new Score();
  score.addClear(4);
  score.addHardDrop(10);
  score.reset();
  assert.equal(score.score, 0);
  assert.equal(score.lines, 0);
  assert.equal(score.level, 1);
});
