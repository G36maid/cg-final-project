// 程序化黃昏 cube map + skybox mesh
// T5: Environment cube map (skybox) as scene background

import { Texture, Box, Mesh, Program } from '../../../ogl/src/index.js';
import { skyboxVertex, skyboxFragment } from '../shaders/skybox.js';
import { WORLD } from '../constants.js';

// 產生一個黃昏漸層的 canvas（給 cube map 側面用）
function createDuskFace(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 由上到下：天頂暗紫 → 黃昏帶亮橙 → 地面暗
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.00, '#0a0418'); // 天頂
    grad.addColorStop(0.28, '#1d1040'); // 上層天空
    grad.addColorStop(0.48, '#3a1655'); // 過渡
    grad.addColorStop(0.56, '#7a2850'); // 粉紫
    grad.addColorStop(0.62, '#c83c30'); // 橙紅
    grad.addColorStop(0.67, '#ff7a35'); // 亮橙（夕陽帶）
    grad.addColorStop(0.72, '#ffa050'); // 金黃
    grad.addColorStop(0.78, '#b04028'); // 地平線下
    grad.addColorStop(0.87, '#3a1818'); // 暖暗
    grad.addColorStop(1.00, '#0a0608'); // 地面
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    return canvas;
}

// 產生天頂面（暗紫 + 星星）
function createZenithFace(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0418';
    ctx.fillRect(0, 0, size, size);

    // 隨機星星
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

// 產生地面面（暗暖色）
function createNadirFace(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#15100a';
    ctx.fillRect(0, 0, size, size);

    return canvas;
}

// 產生完整黃昏 cube map texture
// WebGL cubemap face order: +X, -X, +Y, -Y, +Z, -Z
export function createDuskCubemap(gl, size = 512) {
    const sideFace = createDuskFace(size);
    const zenithFace = createZenithFace(size);
    const nadirFace = createNadirFace(size);

    const texture = new Texture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
    });

    // OGL Texture for cubemap：image 是 6 個 image 的陣列
    texture.image = [
        sideFace,    // +X (right)
        sideFace,    // -X (left)
        zenithFace,  // +Y (top)
        nadirFace,   // -Y (bottom)
        sideFace,    // +Z (front)
        sideFace,    // -Z (back)
    ];

    return texture;
}

// 建立 skybox mesh（反轉的 box，從內部觀看）
export function createSkybox(gl) {
    const cubemap = createDuskCubemap(gl);

    const geometry = new Box(gl, {
        width: WORLD.SKYBOX_SIZE,
        height: WORLD.SKYBOX_SIZE,
        depth: WORLD.SKYBOX_SIZE,
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
