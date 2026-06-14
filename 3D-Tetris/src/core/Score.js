import {
  LINE_SCORES,
  INITIAL_DROP_INTERVAL,
  DROP_INTERVAL_STEP,
  MIN_DROP_INTERVAL,
  LINES_PER_LEVEL,
} from './constants.js';

export class Score {
  constructor() {
    this.score = 0;
    this.lines = 0;
    this.level = 1;
  }

  get dropInterval() {
    return Math.max(MIN_DROP_INTERVAL, INITIAL_DROP_INTERVAL - DROP_INTERVAL_STEP * (this.level - 1));
  }

  addClear(layerCount) {
    const baseScore = LINE_SCORES[Math.min(layerCount, 4)] || LINE_SCORES[4];
    this.score += baseScore * this.level;
    this.lines += layerCount;
    this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
  }

  addHardDrop(cells) {
    this.score += cells * 2;
  }

  addSoftDrop(cells) {
    this.score += cells;
  }

  reset() {
    this.score = 0;
    this.lines = 0;
    this.level = 1;
  }
}
