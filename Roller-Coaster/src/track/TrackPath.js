import { Curve, Path, Vec3 } from '../../ogl/src/index.js';
import { CONTROL_POINTS, SEGMENTS } from './controlPoints.js';
import { TRACK_DIVISIONS } from '../config.js';
import { alignNonInvertingFramesToWorldUp } from '../math/framePostProcess.js';

const CATMULL_ROM_DIVISIONS = 12;

function pointsMatch(a, b) {
    return a.x === b.x && a.y === b.y && a.z === b.z;
}

function getClosedDensePoints(points) {
    if (points.length < 2) return points;

    const first = points[0];
    const last = points[points.length - 1];

    if (pointsMatch(first, last)) return points;

    return [...points, first.clone()];
}

export class TrackPath {
    constructor() {
        const curve = new Curve({
            points: CONTROL_POINTS,
            divisions: CATMULL_ROM_DIVISIONS,
            type: Curve.CATMULLROM,
        });

        this._densePoints = getClosedDensePoints(curve.getPoints(CATMULL_ROM_DIVISIONS));
        this._path = new Path();
        this._path.moveTo(this._densePoints[0]);

        for (let i = 1; i < this._densePoints.length; i++) {
            this._path.lineTo(this._densePoints[i]);
        }

        this._frames = this._path.computeFrenetFrames(TRACK_DIVISIONS, true);
        alignNonInvertingFramesToWorldUp(this._frames, TRACK_DIVISIONS, CONTROL_POINTS.length, SEGMENTS);

        const tunnelSeg = SEGMENTS.find((segment) => segment.name === 'tunnel');
        this._tunnelStartFrame = Math.floor((tunnelSeg.startIndex / CONTROL_POINTS.length) * TRACK_DIVISIONS);
        this._tunnelEndFrame = Math.floor((tunnelSeg.endIndex / CONTROL_POINTS.length) * TRACK_DIVISIONS);
    }

    getPointAt(t, out = new Vec3()) {
        return this._path.getPointAt(t, out);
    }

    getTangentAt(t, out = new Vec3()) {
        return this._path.getTangentAt(t, out);
    }

    get length() {
        return this._path.getLength();
    }

    get points() {
        return this._densePoints;
    }

    get path() {
        return this._path;
    }

    get frames() {
        return this._frames;
    }

    get tunnelStartFrame() {
        return this._tunnelStartFrame;
    }

    get tunnelEndFrame() {
        return this._tunnelEndFrame;
    }
}
