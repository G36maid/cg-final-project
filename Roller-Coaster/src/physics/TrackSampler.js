import { Vec3 } from '../../ogl/src/index.js';
import { TRACK_DIVISIONS } from '../config.js';

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

const _normalProj = new Vec3();

export class TrackSampler {
    constructor(trackPath) {
        this._trackPath = trackPath;
        this._frames = trackPath.frames;
        this._points = trackPath.points;
        this._cumulativeLengths = [];

        this._cumulativeLengths[0] = 0;
        for (let i = 1; i < this._points.length; i++) {
            this._cumulativeLengths[i] = this._cumulativeLengths[i - 1] + this._points[i].distance(this._points[i - 1]);
        }

        this._totalLength = this._cumulativeLengths[this._points.length - 1];
        this._frameCount = TRACK_DIVISIONS + 1;
    }

    get totalLength() {
        return this._totalLength;
    }

    sampleAtDistance(s) {
        s = ((s % this._totalLength) + this._totalLength) % this._totalLength;

        const frameFloat = (s / this._totalLength) * TRACK_DIVISIONS;
        const frameIndex = Math.floor(frameFloat);
        const frac = frameFloat - frameIndex;
        const i0 = frameIndex;
        const i1 = (frameIndex + 1) % this._frameCount;
        const t = s / this._totalLength;

        const point = this._trackPath.getPointAt(t, new Vec3());
        const tangent = new Vec3().copy(this._frames.tangents[i0]).lerp(this._frames.tangents[i1], frac).normalize();
        const normal = new Vec3().copy(this._frames.normals[i0]).lerp(this._frames.normals[i1], frac).normalize();

        // Gram-Schmidt: remove tangent component from interpolated normal
        _normalProj.copy(tangent).scale(normal.dot(tangent));
        normal.sub(_normalProj).normalize();

        const binormal = new Vec3().cross(tangent, normal).normalize();

        return { point, tangent, normal, binormal };
    }

    distanceToParam(s) {
        return s / this._totalLength;
    }

    paramToDistance(t) {
        return t * this._totalLength;
    }

    completion(s) {
        return clamp01(s / this._totalLength);
    }
}
