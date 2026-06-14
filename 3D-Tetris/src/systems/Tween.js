// Easing functions
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}

export function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Create a tween animation.
 * @param {Object} options
 * @param {number} options.duration - Duration in milliseconds
 * @param {Function} options.ease - Easing function (default: easeOutCubic)
 * @param {Function} options.onUpdate - Called each frame with eased progress (0-1)
 * @param {Function} [options.onComplete] - Called once when tween finishes
 * @returns {{update: (dt: number) => boolean, cancel: () => void, done: boolean}} Tween object. update() returns true when tween is complete.
 */
export function createTween({ duration, ease = easeOutCubic, onUpdate, onComplete }) {
    let elapsed = 0;
    let done = false;
    let cancelled = false;

    return {
        get done() { return done; },
        update(dt) {
            if (done || cancelled) return true;
            elapsed += dt;
            const t = Math.min(elapsed / duration, 1);
            const eased = ease(t);
            onUpdate(eased);
            if (t >= 1) {
                done = true;
                if (onComplete) onComplete();
            }
            return done;
        },
        cancel() {
            cancelled = true;
            done = true;
        }
    };
}

/**
 * Manages multiple active tweens. Call update(dt) every frame.
 */
export class TweenManager {
    constructor() {
        this.tweens = [];
    }

    add(tween) {
        this.tweens.push(tween);
        return tween;
    }

    update(dt) {
        this.tweens = this.tweens.filter(t => {
            const finished = t.update(dt);
            return !finished;
        });
    }

    cancelAll() {
        this.tweens.forEach(t => t.cancel());
        this.tweens = [];
    }

    get active() {
        return this.tweens.length;
    }
}
