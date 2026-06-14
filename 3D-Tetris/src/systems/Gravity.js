export class Gravity {
    constructor() {
        this.accumulator = 0;
        this.softDropMultiplier = 1;
    }

    update(dt, dropInterval, onStep) {
        this.accumulator += dt * this.softDropMultiplier;

        while (this.accumulator >= dropInterval) {
            this.accumulator -= dropInterval;
            onStep();
        }
    }

    setSoftDrop(active) {
        this.softDropMultiplier = active ? 15 : 1;
    }

    reset() {
        this.accumulator = 0;
        this.softDropMultiplier = 1;
    }
}
