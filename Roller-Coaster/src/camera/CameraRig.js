import { Vec3, Quat, Mat4, Orbit } from '../../ogl/src/index.js';
import { CAMERA_TRANSITION_DURATION } from '../config.js';
import { tnbToQuat } from '../math/frames.js';

const WORLD_UP = new Vec3(0, 1, 0);
const FALLBACK_RIGHT = new Vec3(1, 0, 0);

export class CameraRig {
    constructor(gl, camera, trackSampler, input) {
        this.gl = gl;
        this.camera = camera;
        this.sampler = trackSampler;
        this.mode = 2;
        this._prevMode = 2;

        this._transitioning = false;
        this._transitionT = 0;
        this._fromPos = new Vec3();
        this._toPos = new Vec3();
        this._fromQuat = new Quat();
        this._toQuat = new Quat();

        this._currentPos = new Vec3();
        this._currentQuat = new Quat();
        this._hasCurrent = false;
        this._scratchMatrix = new Mat4();

        this._orbit = null;
        this._orbitTarget = new Vec3();

        this._cinematicIndex = 0;
        this._cinematicTimer = 0;
        this._cinematicInterval = 4.0;
        this._cinematicProgress = 0;

        this._right = new Vec3();
        this._up = new Vec3();

        if (input) {
            input.onModeChange((mode) => this.setMode(mode));
        }
    }

    setMode(mode) {
        if (mode === this.mode) return;

        this._prevMode = this.mode;
        this.mode = mode;

        this._transitioning = true;
        this._transitionT = 0;
        this._fromPos.copy(this.camera.position);
        this._fromQuat.copy(this.camera.quaternion);
        this._currentPos.copy(this.camera.position);
        this._currentQuat.copy(this.camera.quaternion);
        this._hasCurrent = true;

        if (mode === 4) {
            this._orbitTarget.copy(this._currentPos);
            this._orbit = new Orbit(this.camera, {
                element: document,
                target: this._orbitTarget,
                enableRotate: true,
                enableZoom: true,
                enablePan: true,
                minDistance: 5,
                maxDistance: 200,
            });
        } else if (this._orbit) {
            this._orbit.remove();
            this._orbit = null;
        }
    }

    update(dt, physics) {
        if (this._transitioning) {
            this._transitionT += dt / CAMERA_TRANSITION_DURATION;
            if (this._transitionT >= 1.0) {
                this._transitionT = 1.0;
                this._transitioning = false;
            }
        }

        const frame = this.sampler.sampleAtDistance(physics.s);
        const targetPos = this._toPos;
        const targetQuat = this._toQuat;

        switch (this.mode) {
            case 1:
                this._updateFirstPerson(frame, targetPos, targetQuat);
                break;
            case 2:
                this._updateThirdPerson(frame, targetPos, targetQuat, dt);
                break;
            case 3:
                this._updateSideTrack(frame, targetPos, targetQuat);
                break;
            case 4:
                this._updateFreeOrbit(frame, dt);
                return;
            case 5:
                this._updateCinematic(frame, physics, targetPos, targetQuat, dt);
                break;
            default:
                this._updateThirdPerson(frame, targetPos, targetQuat, dt);
                break;
        }

        if (this._transitioning) {
            const t = this._smoothstep(this._transitionT);

            this.camera.position.copy(this._fromPos);
            this.camera.position.lerp(targetPos, t);

            this.camera.quaternion.copy(this._fromQuat);
            this.camera.quaternion.slerp(targetQuat, t);
        } else {
            this.camera.position.copy(targetPos);
            this.camera.quaternion.copy(targetQuat);
        }
    }

    _updateFirstPerson(frame, outPos, outQuat) {
        outPos.copy(frame.point);
        outPos.add(new Vec3().copy(frame.tangent).scale(1.0));
        outPos.y += 1.5;

        const lookAt = new Vec3().copy(frame.point).add(new Vec3().copy(frame.tangent).scale(5.0));
        this._lookAtQuat(outPos, lookAt, WORLD_UP, outQuat);
    }

    _updateThirdPerson(frame, outPos, outQuat, dt) {
        outPos.copy(frame.point);
        outPos.add(new Vec3().copy(frame.tangent).scale(-8.0));
        outPos.y += 4.0;

        const lookAt = new Vec3().copy(frame.point);
        lookAt.y += 1.0;
        this._lookAtQuat(outPos, lookAt, WORLD_UP, outQuat);

        if (!this._hasCurrent) {
            this._currentPos.copy(outPos);
            this._currentQuat.copy(outQuat);
            this._hasCurrent = true;
        }

        if (!this._transitioning) {
            const lerpFactor = 1.0 - Math.pow(0.001, dt);
            this._currentPos.lerp(outPos, lerpFactor);
            this._currentQuat.slerp(outQuat, lerpFactor);
            outPos.copy(this._currentPos);
            outQuat.copy(this._currentQuat);
        }
    }

    _updateSideTrack(frame, outPos, outQuat) {
        outPos.copy(frame.point);
        outPos.add(new Vec3().copy(frame.binormal).scale(15.0));
        outPos.y += 3.0;

        this._lookAtQuat(outPos, frame.point, WORLD_UP, outQuat);
    }

    _updateFreeOrbit(frame, dt) {
        this._orbitTarget.lerp(frame.point, 1.0 - Math.pow(0.01, dt));
        this._orbit.update();
    }

    _updateCinematic(frame, physics, outPos, outQuat, dt) {
        this._cinematicTimer += dt;
        if (this._cinematicTimer >= this._cinematicInterval) {
            this._cinematicTimer = 0;
            this._cinematicIndex = (this._cinematicIndex + 1) % 6;
        }

        const t = physics.s / this.sampler.totalLength;
        this._cinematicProgress = Number.isFinite(t) ? t : 0;
        const carPos = frame.point;
        const shots = [
            { offset: [30, 20, 30], height: true },
            { offset: [0, 50, 0], height: true },
            { offset: [-20, 5, 0], height: false },
            { offset: [10, 2, 15], height: false },
            { offset: [0, 10, -25], height: false },
            { offset: [40, 30, -40], height: true },
        ];

        const shot = shots[this._cinematicIndex];
        outPos.set(
            carPos.x + shot.offset[0],
            carPos.y + shot.offset[1],
            carPos.z + shot.offset[2]
        );

        this._lookAtQuat(outPos, carPos, WORLD_UP, outQuat);
    }

    _lookAtQuat(position, target, upHint, outQuat) {
        // OGL/OpenGL convention: camera looks down local -Z.
        // Build a basis where local +Z = backward (away from target), so the
        // camera's viewing direction (-Z) points toward the target.
        const backward = new Vec3().copy(position).sub(target).normalize();
        this._right.cross(upHint, backward);

        if (this._right.squaredLen() < 0.000001) {
            this._right.cross(FALLBACK_RIGHT, backward);
        }

        this._right.normalize();
        this._up.cross(backward, this._right).normalize();

        // tnbToQuat(tangent=Z, normal=Y, binormal=X) -> fromBasis(X=right, Y=up, Z=backward)
        return tnbToQuat(backward, this._up, this._right, outQuat);
    }

    _smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    destroy() {
        if (this._orbit) {
            this._orbit.remove();
            this._orbit = null;
        }
    }
}
