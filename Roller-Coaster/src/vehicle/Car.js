import { Vec3, Quat, Transform } from '../../ogl/src/index.js';
import { CAR_COUNT, CAR_LENGTH } from '../config.js';
import { createCarMesh } from './carGeometry.js';
import { tnbToQuat } from '../math/frames.js';

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
            const upOffset = new Vec3().copy(frame.normal).scale(0.5);
            mesh.position.add(upOffset);

            const q = tnbToQuat(frame.tangent, frame.normal, frame.binormal, new Quat());
            mesh.quaternion.copy(q);
        });
    }
}
