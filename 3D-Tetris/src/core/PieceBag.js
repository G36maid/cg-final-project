import { PIECE_TYPES } from './constants.js';

export class PieceBag {
  constructor() {
    this.queue = [];
    this.refill();
    this.refill();
  }

  refill() {
    const bag = [...PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }

  next() {
    if (this.queue.length <= PIECE_TYPES.length) this.refill();
    return this.queue.shift();
  }

  peek(n = 3) {
    return this.queue.slice(0, n);
  }
}
