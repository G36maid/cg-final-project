import { Mesh, Sphere } from '../../ogl/src/index.js';

const MOUNTAIN_RADIUS = 30;
const DECORATIVE_MOUNTAIN_POSITION = [95, -5, 70];

export function createMountain(gl, rockProgram) {
    const geom = new Sphere(gl, { radius: MOUNTAIN_RADIUS, widthSegments: 64, heightSegments: 32 });
    const mesh = new Mesh(gl, { geometry: geom, program: rockProgram });

    mesh.position.set(
        DECORATIVE_MOUNTAIN_POSITION[0],
        DECORATIVE_MOUNTAIN_POSITION[1],
        DECORATIVE_MOUNTAIN_POSITION[2]
    );
    mesh.scale.set(1.2, 0.8, 1.2);

    return mesh;
}
