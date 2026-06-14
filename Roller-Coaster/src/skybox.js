import { Texture, Box, Mesh, Program } from '../ogl/src/index.js';
import { skyboxVertex, skyboxFragment } from './materials/skyboxProgram.js';
import { SKYBOX_SIZE } from './config.js';

function createDuskFace(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.00, '#0a0418');
    grad.addColorStop(0.28, '#1d1040');
    grad.addColorStop(0.48, '#3a1655');
    grad.addColorStop(0.56, '#7a2850');
    grad.addColorStop(0.62, '#c83c30');
    grad.addColorStop(0.67, '#ff7a35');
    grad.addColorStop(0.72, '#ffa050');
    grad.addColorStop(0.78, '#b04028');
    grad.addColorStop(0.87, '#3a1818');
    grad.addColorStop(1.00, '#0a0608');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 80; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size * 0.45;
        const r = Math.random() * 1.2 + 0.3;
        const a = Math.random() * 0.6 + 0.1;
        ctx.fillStyle = `rgba(255, 240, 220, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}

function createZenithFace(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0418';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 120; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 1.4 + 0.3;
        const a = Math.random() * 0.7 + 0.1;
        ctx.fillStyle = `rgba(255, 240, 220, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}

function createNadirFace(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#15100a';
    ctx.fillRect(0, 0, size, size);

    return canvas;
}

export function createDuskCubemap(gl, size = 512) {
    const sideFace = createDuskFace(size);
    const zenithFace = createZenithFace(size);
    const nadirFace = createNadirFace(size);

    const texture = new Texture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
    });

    texture.image = [
        sideFace,
        sideFace,
        zenithFace,
        nadirFace,
        sideFace,
        sideFace,
    ];

    return texture;
}

export function createSkybox(gl) {
    const cubemap = createDuskCubemap(gl);

    const geometry = new Box(gl, {
        width: SKYBOX_SIZE,
        height: SKYBOX_SIZE,
        depth: SKYBOX_SIZE,
    });

    const program = new Program(gl, {
        vertex: skyboxVertex,
        fragment: skyboxFragment,
        uniforms: {
            tCube: { value: cubemap },
        },
        cullFace: gl.FRONT,
        depthWrite: false,
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.name = 'skybox';
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;

    return mesh;
}