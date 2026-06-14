import { Transform, Program, Mesh, Box, Plane, Color } from '../../ogl/src/index.js';

const COLOR_MAP = {
    'W': [1.0, 1.0, 1.0],
    'Y': [1.0, 0.835, 0.0],
    'R': [0.77, 0.12, 0.23],
    'O': [1.0, 0.345, 0.0],
    'G': [0.0, 0.62, 0.376],
    'B': [0.0, 0.318, 0.729],
};

const VERTEX_SHADER = `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec3 uColor;
varying vec3 vNormal;
void main() {
    vec3 light = normalize(vec3(0.5, 0.8, 0.6));
    float diff = max(dot(normalize(vNormal), light), 0.0);
    float ambient = 0.4;
    gl_FragColor.rgb = uColor * (ambient + diff * 0.6);
    gl_FragColor.a = 1.0;
}
`;

export class CubeRenderer {
    constructor(gl, scene) {
        this.gl = gl;
        this.scene = scene;
        this.cubieGroups = [];
        this.stickerMeshes = [];
        this.spacing = 1.08;
    }

    buildCubies(cubeState) {
        this.cubieGroups = [];
        this.stickerMeshes = [];

        const baseGeometry = new Box(this.gl, { width: 0.98, height: 0.98, depth: 0.98 });
        const stickerGeometry = new Plane(this.gl, { width: 0.85, height: 0.85 });

        // Shared programs — ONE per color, reused across all meshes
        const baseProgram = new Program(this.gl, {
            vertex: VERTEX_SHADER,
            fragment: FRAGMENT_SHADER,
            uniforms: { uColor: { value: new Color('#0a0a0a') } },
            cullFace: false,
        });

        const stickerPrograms = {};
        for (const [key, rgb] of Object.entries(COLOR_MAP)) {
            stickerPrograms[key] = new Program(this.gl, {
                vertex: VERTEX_SHADER,
                fragment: FRAGMENT_SHADER,
                uniforms: { uColor: { value: new Color(rgb[0], rgb[1], rgb[2]) } },
                cullFace: false,
            });
        }

        for (let i = 0; i < cubeState.cubies.length; i++) {
            const cubie = cubeState.cubies[i];
            const cubieGroup = new Transform();

            cubieGroup.position.set(
                cubie.position[0] * this.spacing,
                cubie.position[1] * this.spacing,
                cubie.position[2] * this.spacing
            );
            cubieGroup.setParent(this.scene);
            this.cubieGroups[i] = cubieGroup;

            const baseMesh = new Mesh(this.gl, { geometry: baseGeometry, program: baseProgram });
            baseMesh.setParent(cubieGroup);

            for (const [faceKey, color] of Object.entries(cubie.stickers)) {
                const program = stickerPrograms[color] || stickerPrograms['R'];
                const stickerMesh = new Mesh(this.gl, { geometry: stickerGeometry, program });

                const OFFSET = 0.5;

                switch (faceKey) {
                    case '+x':
                        stickerMesh.position.set(OFFSET, 0, 0);
                        stickerMesh.rotation.y = Math.PI / 2;
                        break;
                    case '-x':
                        stickerMesh.position.set(-OFFSET, 0, 0);
                        stickerMesh.rotation.y = -Math.PI / 2;
                        break;
                    case '+y':
                        stickerMesh.position.set(0, OFFSET, 0);
                        stickerMesh.rotation.x = -Math.PI / 2;
                        break;
                    case '-y':
                        stickerMesh.position.set(0, -OFFSET, 0);
                        stickerMesh.rotation.x = Math.PI / 2;
                        break;
                    case '+z':
                        stickerMesh.position.set(0, 0, OFFSET);
                        break;
                    case '-z':
                        stickerMesh.position.set(0, 0, -OFFSET);
                        stickerMesh.rotation.y = Math.PI;
                        break;
                }

                stickerMesh.userData = { cubieIndex: i, face: faceKey, color };
                stickerMesh.setParent(cubieGroup);
                this.stickerMeshes.push(stickerMesh);
            }
        }
    }

    updateFromState(cubeState) {
        for (let i = 0; i < cubeState.cubies.length; i++) {
            const cubie = cubeState.cubies[i];
            const group = this.cubieGroups[i];

            if (!group) continue;

            group.position.set(
                cubie.position[0] * this.spacing,
                cubie.position[1] * this.spacing,
                cubie.position[2] * this.spacing
            );
            group.quaternion.set(
                cubie.orientation[0],
                cubie.orientation[1],
                cubie.orientation[2],
                cubie.orientation[3]
            );
        }
    }

    getStickerMeshes() {
        return this.stickerMeshes;
    }

    getCubieGroup(index) {
        return this.cubieGroups[index];
    }
}
