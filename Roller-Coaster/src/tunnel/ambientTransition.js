import { CAMERA_TRANSITION_DURATION } from '../config.js';

export class AmbientTransition {
    constructor() {
        this._target = 1.0;
        this._current = 1.0;
        this._outsideAmbient = 0.3;
        this._insideAmbient = 0.05;
        this._duration = CAMERA_TRANSITION_DURATION;
    }

    setInside() {
        this._target = 0.0;
    }

    setOutside() {
        this._target = 1.0;
    }

    update(dt) {
        const speed = 1.0 / this._duration;
        const diff = this._target - this._current;
        const step = Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);

        this._current += step;
    }

    get ambientValue() {
        return this._outsideAmbient + (this._insideAmbient - this._outsideAmbient) * (1.0 - this._current);
    }

    get transitionFactor() {
        return 1.0 - this._current;
    }
}
