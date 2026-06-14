import { Mesh, Transform, Box, Cylinder } from '../../ogl/src/index.js';
import { COLORS, CAR_LENGTH } from '../config.js';

export function createCarMesh(gl, programs) {
    void COLORS;

    const group = new Transform();

    const bodyGeom = new Box(gl, { width: 1.6, height: 1.0, depth: CAR_LENGTH });
    const bodyMesh = new Mesh(gl, { geometry: bodyGeom, program: programs.body });
    bodyMesh.position.set(0, 0.6, 0);
    bodyMesh.setParent(group);

    const noseGeom = new Box(gl, { width: 1.4, height: 0.8, depth: 0.4 });
    const noseMesh = new Mesh(gl, { geometry: noseGeom, program: programs.body });
    noseMesh.position.set(0, 0.7, CAR_LENGTH / 2 + 0.2);
    noseMesh.setParent(group);

    const seatGeom = new Box(gl, { width: 0.5, height: 0.6, depth: 0.5 });
    const seatPositions = [
        [-0.35, 1.3, 0.3],
        [0.35, 1.3, 0.3],
    ];

    seatPositions.forEach((position) => {
        const seatMesh = new Mesh(gl, { geometry: seatGeom, program: programs.seat });
        seatMesh.position.set(position[0], position[1], position[2]);
        seatMesh.setParent(group);
    });

    const wheelGeom = new Cylinder(gl, {
        radiusTop: 0.3,
        radiusBottom: 0.3,
        height: 0.2,
        radialSegments: 12,
    });
    const wheelPositions = [
        [-0.9, 0.3, CAR_LENGTH / 2 - 0.3],
        [0.9, 0.3, CAR_LENGTH / 2 - 0.3],
        [-0.9, 0.3, -CAR_LENGTH / 2 + 0.3],
        [0.9, 0.3, -CAR_LENGTH / 2 + 0.3],
    ];

    wheelPositions.forEach((position) => {
        const wheelMesh = new Mesh(gl, { geometry: wheelGeom, program: programs.wheel });
        wheelMesh.position.set(position[0], position[1], position[2]);
        wheelMesh.rotation.z = Math.PI / 2;
        wheelMesh.setParent(group);
    });

    return group;
}
