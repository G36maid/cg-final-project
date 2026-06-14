// Skybox shaders — 黃昏 cube map 背景
// 使用標準投影 + 巨型 box（500³），相機永遠在 box 內部。
// 不用 mat3/xyww trick（相機不在原點時會 clip 背後頂點，見 DEVLOG.md）。

export const skyboxVertex = /* glsl */ `
    attribute vec3 position;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 vDir;

    void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const skyboxFragment = /* glsl */ `
    precision highp float;

    uniform samplerCube tCube;

    varying vec3 vDir;

    void main() {
        gl_FragColor = textureCube(tCube, normalize(vDir));
    }
`;
