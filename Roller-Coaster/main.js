import { Renderer, Camera, Transform, Box, Program, Mesh, Orbit, Vec3 } from '../ogl/src/index.js';

// --- Bootstrap ----------------------------------------------------
const renderer = new Renderer({ dpr: 2, antialias: true });
const gl = renderer.gl;
document.body.appendChild(gl.canvas);
gl.clearColor(0.03, 0.05, 0.08, 1);

const camera = new Camera(gl, { fov: 50, near: 0.1, far: 2000 });
camera.position.set(0, 40, 120);

const controls = new Orbit(camera, { target: new Vec3(0, 20, 0) });

const scene = new Transform();

// --- Placeholder spinning box (proves the pipeline works) ---------
const boxGeom = new Box(gl);
const boxProg = new Program(gl, {
    vertex: /* glsl */ `
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
    `,
    fragment: /* glsl */ `
        precision highp float;
        varying vec3 vNormal;
        void main() {
            float lighting = dot(normalize(vNormal), normalize(vec3(0.6, 0.8, 0.3)));
            gl_FragColor.rgb = vec3(0.7, 0.5, 0.3) + lighting * 0.3;
            gl_FragColor.a = 1.0;
        }
    `,
});
const boxMesh = new Mesh(gl, { geometry: boxGeom, program: boxProg });
boxMesh.setParent(scene);

// --- Resize -------------------------------------------------------
function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    const hud = document.getElementById('hud');
    if (hud) {
        hud.width = window.innerWidth;
        hud.height = window.innerHeight;
    }
}
window.addEventListener('resize', resize, false);
resize();

// --- Render loop --------------------------------------------------
requestAnimationFrame(update);
function update(t) {
    requestAnimationFrame(update);
    boxMesh.rotation.y -= 0.01;
    boxMesh.rotation.x += 0.008;
    controls.update();
    renderer.render({ scene, camera });
}
