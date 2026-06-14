import { GRAVITY, SPEED_MIN, SPEED_MAX, CHAIN_LIFT_SPEED, TRACK_DIVISIONS } from '../config.js';
import { SEGMENTS, CONTROL_POINTS } from '../track/controlPoints.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export class Physics {
    constructor(trackSampler) {
        this.sampler = trackSampler;
        this.s = 0;
        this.speed = SPEED_MIN;
        this.height = 0;
        this.gForce = 1.0;
        this.completion = 0;
        this.isInLiftHill = false;
        this.isInTunnel = false;
        this._prevHeight = 0;

        const liftHill = SEGMENTS.find((segment) => segment.name === 'liftHill');
        this._liftHillStartFrame = Math.floor((liftHill.startIndex / CONTROL_POINTS.length) * TRACK_DIVISIONS);
        this._liftHillEndFrame = Math.floor((liftHill.endIndex / CONTROL_POINTS.length) * TRACK_DIVISIONS);
        this._tunnelStartFrame = trackSampler._trackPath.tunnelStartFrame;
        this._tunnelEndFrame = trackSampler._trackPath.tunnelEndFrame;
    }

    update(dt) {
        const frame = this.sampler.sampleAtDistance(this.s);
        this.height = frame.point.y;

        const frameIdx = Math.floor((this.s / this.sampler.totalLength) * TRACK_DIVISIONS) % (TRACK_DIVISIONS + 1);
        this.isInLiftHill = frameIdx >= this._liftHillStartFrame && frameIdx <= this._liftHillEndFrame;
        this.isInTunnel = frameIdx >= this._tunnelStartFrame && frameIdx <= this._tunnelEndFrame;

        if (this.isInLiftHill) {
            this.speed = CHAIN_LIFT_SPEED;
        } else {
            const speedSquared = this.speed * this.speed + 2 * GRAVITY * (this._prevHeight - this.height);
            const energySpeed = Math.sqrt(Math.max(SPEED_MIN * SPEED_MIN, speedSquared));
            this.speed = clamp(energySpeed, SPEED_MIN, SPEED_MAX);
        }

        this._updateGForce(frame);

        this.s += this.speed * dt;
        this.s = ((this.s % this.sampler.totalLength) + this.sampler.totalLength) % this.sampler.totalLength;
        this.completion = this.sampler.completion(this.s);
        this._prevHeight = this.height;
    }

    reset() {
        this.s = 0;
        this.speed = SPEED_MIN;
    }

    _updateGForce(frame) {
        const ds = 0.5;
        const f1 = this.sampler.sampleAtDistance(this.s - ds);
        const f2 = this.sampler.sampleAtDistance(this.s + ds);
        const dotProduct = f1.tangent.dot(f2.tangent);
        const angle = Math.acos(clamp(dotProduct, -1, 1));
        const curvature = angle / (2 * ds);
        const a_c = this.speed * this.speed * curvature;

        this.gForce = clamp(Math.abs(1 + a_c / GRAVITY * Math.sign(frame.normal.y)), 0, 10);
    }
}
