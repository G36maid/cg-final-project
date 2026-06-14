import { Renderer, Camera, Transform, Mesh, Box, Vec3, Orbit } from '../ogl/src/index.js';

import { COLORS, MAX_LIGHTS } from './src/config.js';
import { TrackPath } from './src/track/TrackPath.js';
import { TrackSampler } from './src/physics/TrackSampler.js';
import { Physics } from './src/physics/Physics.js';
import { createTrackGeometry } from './src/track/TrackGeometry.js';
import { createTunnelGeometry } from './src/tunnel/TunnelGeometry.js';
import { createMetalProgram } from './src/materials/metalProgram.js';
import { createRockProgram } from './src/materials/rockProgram.js';
import { Car } from './src/vehicle/Car.js';
import { createMountain, computeTunnelLights, populateLightUniforms } from './src/tunnel/Mountain.js';
import { createDustParticles, updateDust } from './src/tunnel/DustParticles.js';
import { WaterReflection } from './src/tunnel/WaterReflection.js';
import { AmbientTransition } from './src/tunnel/ambientTransition.js';
import { CameraRig } from './src/camera/CameraRig.js';
import { Input } from './src/input/Input.js';
import { HUD } from './src/hud/HUD.js';

void MAX_LIGHTS;
void Vec3;
void Orbit;

const canvas = document.getElementById('gl');
const renderer = new Renderer({
    canvas: canvas || undefined,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    antialias: true,
});
const gl = renderer.gl;

if (!canvas) {
    gl.canvas.id = 'gl';
    document.body.appendChild(gl.canvas);
}

gl.clearColor(COLORS.SKY[0], COLORS.SKY[1], COLORS.SKY[2], 1);

const camera = new Camera(gl, { fov: 60, near: 0.1, far: 2000 });
camera.position.set(0, 40, 120);

const scene = new Transform();

const railProgram = createMetalProgram(gl, { color: COLORS.RAIL });
const groundProgram = createMetalProgram(gl, { color: COLORS.GROUND });
const carBodyProgram = createMetalProgram(gl, { color: COLORS.CAR_BODY });
const carSeatProgram = createMetalProgram(gl, { color: COLORS.CAR_SEAT });
const carWheelProgram = createMetalProgram(gl, { color: COLORS.CAR_WHEEL });
const rockProgram = createRockProgram(gl);

rockProgram.cullFace = false;

const metalPrograms = [railProgram, groundProgram, carBodyProgram, carSeatProgram, carWheelProgram];

const trackPath = new TrackPath();
const trackSampler = new TrackSampler(trackPath);
const physics = new Physics(trackSampler);

const trackMesh = createTrackGeometry(gl, trackPath, railProgram);
trackMesh.setParent(scene);

const tunnelGeometry = createTunnelGeometry(gl, trackPath);
const tunnelMesh = new Mesh(gl, { geometry: tunnelGeometry, program: rockProgram });
tunnelMesh.setParent(scene);

const mountainMesh = createMountain(gl, rockProgram, trackPath);
mountainMesh.setParent(scene);

const tunnelLights = computeTunnelLights(trackPath);
populateLightUniforms(rockProgram, tunnelLights);

const carPrograms = { body: carBodyProgram, seat: carSeatProgram, wheel: carWheelProgram };
const car = new Car(gl, trackSampler, carPrograms);
car.group.setParent(scene);

const dustMesh = createDustParticles(gl, trackPath);
dustMesh.setParent(scene);

const water = new WaterReflection(gl, trackPath);
water.mesh.setParent(scene);

const ambientTransition = new AmbientTransition();

const groundGeometry = new Box(gl, { width: 400, height: 1, depth: 400 });
const groundMesh = new Mesh(gl, { geometry: groundGeometry, program: groundProgram });
groundMesh.position.y = -1;
groundMesh.setParent(scene);

const hudCanvas = document.getElementById('hud');
const input = new Input({ element: document });
const hud = new HUD({ canvas: hudCanvas });

const cameraRig = new CameraRig(gl, camera, trackSampler, input);

function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });

    hudCanvas.width = width;
    hudCanvas.height = height;
    hudCanvas.style.width = `${width}px`;
    hudCanvas.style.height = `${height}px`;
    hud.resize(width, height);
}

window.addEventListener('resize', resize, false);
resize();

let lastTime = 0;

requestAnimationFrame(update);

function update(time) {
    requestAnimationFrame(update);

    const elapsedTime = time * 0.001;
    const dt = Math.min(0.05, lastTime ? elapsedTime - lastTime : 0);
    lastTime = elapsedTime;

    physics.update(dt);
    car.update(physics);
    cameraRig.update(dt, physics);

    if (physics.isInTunnel) {
        ambientTransition.setInside();
    } else {
        ambientTransition.setOutside();
    }

    ambientTransition.update(dt);

    const ambient = ambientTransition.ambientValue;
    rockProgram.uniforms.uTime.value = elapsedTime;
    rockProgram.uniforms.uAmbient.value = ambient;

    for (let i = 0; i < metalPrograms.length; i++) {
        metalPrograms[i].uniforms.uAmbient.value = ambient;
    }

    updateDust(dustMesh, elapsedTime);
    water.update(elapsedTime);

    scene.updateMatrixWorld();
    renderer.render({ scene, camera, update: false });

    hud.update({
        speed: physics.speed,
        height: physics.height,
        gForce: physics.gForce,
        completion: physics.completion,
        mode: cameraRig.mode,
    });
}

window.addEventListener('beforeunload', () => {
    cameraRig.destroy();
    input.destroy();
});
