import { Vec3, Quat, Transform } from '../../ogl/src/index.js';
import { CAR_COUNT, CAR_LENGTH } from '../config.js';
import { createCarMesh } from './carGeometry.js';
import { tnbToQuat } from '../math/frames.js';

// Pre-allocated temp vectors to avoid per-frame GC pressure
const _right = new Vec3();
const _upOffset = new Vec3();

export class Car {
    constructor(gl, trackSampler, programs) {
        this.sampler = trackSampler;
        this.group = new Transform();
        this.cars = [];

        for (let i = 0; i < CAR_COUNT; i++) {
            const offset = i * CAR_LENGTH * 0.8;
            const carMesh = createCarMesh(gl, programs);
            carMesh.setParent(this.group);
            this.cars.push({ mesh: carMesh, offset });
        }
    }

    update(physics) {
        this.cars.forEach(({ mesh, offset }) => {
            const carS = physics.s - offset;
            const frame = this.sampler.sampleAtDistance(carS);

            mesh.position.copy(frame.point);
            mesh.position.add(_upOffset.copy(frame.normal).scale(0.5));

            // Standard Frenet binormal B = T × N creates a left-handed basis (B, N, T)
            // with det = -1, which cannot produce a valid rotation quaternion.
            // Use right = N × T = -B to form the right-handed basis (-B, N, T)
            // where (-B) × N = T, giving det = +1 for a proper rotation matrix.
            _right.cross(frame.normal, frame.tangent).normalize();
            const q = tnbToQuat(frame.tangent, frame.normal, _right, new Quat());
            mesh.quaternion.copy(q);
        });
    }
}
